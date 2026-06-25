// ===========================================================================
// Pomodoro focus timer. A small, self-contained zustand store kept OUT of the
// persisted vault: the timer is ephemeral session state, but it is global so the
// Productivity panel and the Dashboard widget always show the same running clock.
// When a focus phase completes naturally it auto-logs its minutes to the active
// study day through the main store, so finished sprints feed productivity.
//
// The "Custom" preset is user-configurable (§3): its durations live on the main
// store's profile (so they back up + sync) and are mirrored into the timer
// snapshot so a reload restores them before the vault rehydrates.
// ===========================================================================
import { create } from "zustand";
import { useStore } from "./store";
import { dayKey } from "./scoring";

export interface PomodoroPreset {
  id: string;
  label: string;
  focus: number; // minutes
  break: number; // minutes
  longBreak?: number;
  cyclesBeforeLongBreak?: number;
  defaultTrackerId?: string;
}

export const POMODORO_PRESETS: PomodoroPreset[] = [
  { id: "deep-study", label: "Deep Study", focus: 50, break: 10, longBreak: 25, cyclesBeforeLongBreak: 4, defaultTrackerId: "tracker-study" },
  { id: "anki", label: "Anki", focus: 25, break: 5, longBreak: 15, cyclesBeforeLongBreak: 4, defaultTrackerId: "tracker-study" },
  { id: "lecture-review", label: "Lecture Review", focus: 45, break: 10, longBreak: 20, cyclesBeforeLongBreak: 3, defaultTrackerId: "tracker-study" },
  { id: "coding", label: "Coding", focus: 60, break: 10, longBreak: 25, cyclesBeforeLongBreak: 3, defaultTrackerId: "tracker-coding" },
  { id: "reading", label: "Reading", focus: 30, break: 5, longBreak: 15, cyclesBeforeLongBreak: 4, defaultTrackerId: "tracker-study" },
  { id: "custom", label: "Custom", focus: 25, break: 5, longBreak: 15, cyclesBeforeLongBreak: 4 },
];

export const DEFAULT_CUSTOM = { focus: 25, break: 5, longBreak: 15, cyclesBeforeLongBreak: 4 };
const clampMin = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number.isFinite(n) ? n : lo)));

export type PomodoroPhase = "focus" | "break";
export type PomodoroTargetKind = "free" | "tracker" | "blueprint";

interface CustomDurations {
  customFocus: number;
  customBreak: number;
  customLongBreak: number;
  customCycles: number;
}

interface PersistedPomodoro extends CustomDurations {
  presetId: string;
  phase: PomodoroPhase;
  secondsLeft: number;
  running: boolean;
  autoLog: boolean;
  anchorDay: string;
  sessionsToday: number;
  loggedMinutesToday: number;
  targetKind: PomodoroTargetKind;
  targetId?: string;
  targetLabel?: string;
  intention?: string;
  updatedAt: number;
}

interface PomodoroState extends CustomDurations {
  presetId: string;
  phase: PomodoroPhase;
  secondsLeft: number;
  running: boolean;
  autoLog: boolean;
  anchorDay: string;
  sessionsToday: number;
  loggedMinutesToday: number;
  targetKind: PomodoroTargetKind;
  targetId?: string;
  targetLabel?: string;
  intention: string;
  lastTickAt: number;
  // FX signal — bumped each time a focus sprint completes so the app root can
  // fire the page glow + completion toast (kept here so it works on any page).
  completedAt: string | null;
  completedMinutes: number;
  // actions
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  skip: () => void;
  setPreset: (id: string) => void;
  setAutoLog: (value: boolean) => void;
  setCustom: (patch: Partial<{ focus: number; break: number; longBreak: number; cyclesBeforeLongBreak: number }>) => void;
  setTarget: (target: { kind: PomodoroTargetKind; id?: string; label?: string }) => void;
  setIntention: (value: string) => void;
  _tick: () => void;
}

const PRESET_ALIASES: Record<string, string> = {
  "25-5": "anki",
  "50-10": "deep-study",
  "90-20": "deep-study",
};

const presetById = (id: string): PomodoroPreset =>
  POMODORO_PRESETS.find((preset) => preset.id === (PRESET_ALIASES[id] ?? id)) ?? POMODORO_PRESETS[0];

/** The effective preset, resolving "custom" against the user's live durations. */
export function effectivePreset(s: { presetId: string } & CustomDurations): PomodoroPreset {
  if ((PRESET_ALIASES[s.presetId] ?? s.presetId) === "custom") {
    return { id: "custom", label: "Custom", focus: s.customFocus, break: s.customBreak, longBreak: s.customLongBreak, cyclesBeforeLongBreak: s.customCycles };
  }
  return presetById(s.presetId);
}

/** Custom durations from the persisted profile (or defaults). */
function profileCustom(): CustomDurations {
  const c = useStore.getState().profile.pomodoroCustom;
  return {
    customFocus: clampMin(c?.focus ?? DEFAULT_CUSTOM.focus, 1, 180),
    customBreak: clampMin(c?.break ?? DEFAULT_CUSTOM.break, 1, 90),
    customLongBreak: clampMin(c?.longBreak ?? DEFAULT_CUSTOM.longBreak, 1, 120),
    customCycles: clampMin(c?.cyclesBeforeLongBreak ?? DEFAULT_CUSTOM.cyclesBeforeLongBreak, 1, 12),
  };
}

let interval: ReturnType<typeof setInterval> | null = null;
const POMO_KEY = "noctyrium-pomodoro-session";

function startInterval(tick: () => void) {
  if (interval) return;
  interval = setInterval(tick, 1000);
}
function stopInterval() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

function readPersisted(): Partial<PersistedPomodoro> {
  const fallbackCustom = profileCustom();
  try {
    const raw = localStorage.getItem(POMO_KEY);
    if (!raw) return fallbackCustom;
    const parsed = JSON.parse(raw) as PersistedPomodoro;
    const custom: CustomDurations = {
      customFocus: clampMin(parsed.customFocus ?? fallbackCustom.customFocus, 1, 180),
      customBreak: clampMin(parsed.customBreak ?? fallbackCustom.customBreak, 1, 90),
      customLongBreak: clampMin(parsed.customLongBreak ?? fallbackCustom.customLongBreak, 1, 120),
      customCycles: clampMin(parsed.customCycles ?? fallbackCustom.customCycles, 1, 12),
    };
    const phase = parsed.phase === "break" ? "break" : "focus";
    const preset = effectivePreset({ presetId: parsed.presetId, ...custom });
    const maxSeconds = (phase === "focus" ? preset.focus : preset.break) * 60;
    const elapsed = parsed.running ? Math.floor((Date.now() - Number(parsed.updatedAt || Date.now())) / 1000) : 0;
    return {
      ...parsed,
      ...custom,
      phase,
      secondsLeft: Math.max(parsed.running ? 1 : 0, Math.min(maxSeconds, Number(parsed.secondsLeft || maxSeconds) - elapsed)),
      presetId: PRESET_ALIASES[parsed.presetId] ?? parsed.presetId,
      targetKind: parsed.targetKind ?? "free",
      intention: parsed.intention ?? "",
    };
  } catch {
    return fallbackCustom;
  }
}

function persistSnapshot(s: PomodoroState) {
  try {
    const snapshot: PersistedPomodoro = {
      presetId: s.presetId,
      phase: s.phase,
      secondsLeft: s.secondsLeft,
      running: s.running,
      autoLog: s.autoLog,
      anchorDay: s.anchorDay,
      sessionsToday: s.sessionsToday,
      loggedMinutesToday: s.loggedMinutesToday,
      targetKind: s.targetKind,
      targetId: s.targetId,
      targetLabel: s.targetLabel,
      intention: s.intention,
      customFocus: s.customFocus,
      customBreak: s.customBreak,
      customLongBreak: s.customLongBreak,
      customCycles: s.customCycles,
      updatedAt: Date.now(),
    };
    localStorage.setItem(POMO_KEY, JSON.stringify(snapshot));
  } catch {
    /* storage unavailable */
  }
}

function logNote(reason: "complete" | "reset" | "skip", targetLabel?: string, intention?: string): string {
  const prefix = reason === "complete" ? "Pomodoro focus sprint" : `Pomodoro ${reason}: partial focus sprint`;
  return [prefix, targetLabel ? `target: ${targetLabel}` : "", intention ? `intention: ${intention}` : ""]
    .filter(Boolean)
    .join(" - ");
}

// A short, gentle two-tone chime so a finished sprint is noticeable without a
// jarring alarm. Best-effort: silently no-op if WebAudio is unavailable/blocked.
function chime(up: boolean) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(up ? 523.25 : 392, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(up ? 783.99 : 261.63, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.62);
    osc.onended = () => ctx.close();
  } catch {
    /* no audio available */
  }
}

export const usePomodoro = create<PomodoroState>((set, get) => {
  const initial = readPersisted();
  const initialCustom = profileCustom();
  // Reset the per-day counters when the active study day rolls over.
  const syncDay = () => {
    const today = dayKey();
    if (get().anchorDay !== today) set({ anchorDay: today, sessionsToday: 0, loggedMinutesToday: 0 });
  };

  const logPartialFocus = (reason: "reset" | "skip") => {
    syncDay();
    const { phase, secondsLeft, autoLog, targetLabel, intention } = get();
    if (phase !== "focus" || !autoLog) return 0;
    const preset = effectivePreset(get());
    const elapsedSeconds = Math.max(0, preset.focus * 60 - secondsLeft);
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes <= 0) return 0;
    useStore.getState().logStudy({ type: "Pomodoro", minutes, note: logNote(reason, targetLabel, intention) });
    set((s) => ({
      loggedMinutesToday: s.loggedMinutesToday + minutes,
      completedAt: new Date().toISOString(),
      completedMinutes: minutes,
    }));
    persistSnapshot(get());
    return minutes;
  };

  // A phase finished — log the focus block (if natural + auto-log on), then
  // advance: focus → break keeps running; break → focus pauses for a fresh start.
  const complete = (natural: boolean) => {
    stopInterval();
    syncDay();
    const { phase, autoLog, targetLabel, intention } = get();
    const preset = effectivePreset(get());
    if (phase === "focus") {
      if (natural && autoLog) {
        useStore.getState().logStudy({ type: "Pomodoro", minutes: preset.focus, note: logNote("complete", targetLabel, intention) });
      }
      if (natural) chime(true);
      set((s) => ({
        phase: "break",
        secondsLeft: preset.break * 60,
        running: natural,
        lastTickAt: Date.now(),
        sessionsToday: natural ? s.sessionsToday + 1 : s.sessionsToday,
        loggedMinutesToday: natural && autoLog ? s.loggedMinutesToday + preset.focus : s.loggedMinutesToday,
        completedAt: natural ? new Date().toISOString() : s.completedAt,
        completedMinutes: natural && autoLog ? preset.focus : s.completedMinutes,
      }));
      persistSnapshot(get());
      if (natural) startInterval(() => get()._tick());
    } else {
      if (natural) chime(false);
      set({ phase: "focus", secondsLeft: preset.focus * 60, running: false, lastTickAt: Date.now() });
      persistSnapshot(get());
    }
  };

  return {
    presetId: initial.presetId ?? "25-5",
    phase: initial.phase ?? "focus",
    secondsLeft: initial.secondsLeft ?? 25 * 60,
    running: initial.running ?? false,
    autoLog: initial.autoLog ?? true,
    anchorDay: initial.anchorDay ?? dayKey(),
    sessionsToday: initial.sessionsToday ?? 0,
    loggedMinutesToday: initial.loggedMinutesToday ?? 0,
    targetKind: initial.targetKind ?? "free",
    targetId: initial.targetId,
    targetLabel: initial.targetLabel,
    intention: initial.intention ?? "",
    customFocus: initial.customFocus ?? initialCustom.customFocus,
    customBreak: initial.customBreak ?? initialCustom.customBreak,
    customLongBreak: initial.customLongBreak ?? initialCustom.customLongBreak,
    customCycles: initial.customCycles ?? initialCustom.customCycles,
    lastTickAt: Date.now(),
    completedAt: null,
    completedMinutes: 0,

    start: () => {
      if (get().running) return;
      syncDay();
      // Ask once (within this user gesture) so we can fire an OS notification
      // when a sprint finishes while the tab is in the background.
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission().catch(() => { /* ignore */ });
      }
      set({ running: true, lastTickAt: Date.now() });
      persistSnapshot(get());
      startInterval(() => get()._tick());
    },
    pause: () => {
      stopInterval();
      set({ running: false, lastTickAt: Date.now() });
      persistSnapshot(get());
    },
    toggle: () => (get().running ? get().pause() : get().start()),
    reset: () => {
      stopInterval();
      logPartialFocus("reset");
      const preset = effectivePreset(get());
      set({ running: false, phase: "focus", secondsLeft: preset.focus * 60, lastTickAt: Date.now() });
      persistSnapshot(get());
    },
    skip: () => {
      logPartialFocus("skip");
      complete(false);
    },
    setPreset: (id) => {
      stopInterval();
      const presetId = PRESET_ALIASES[id] ?? id;
      const preset = effectivePreset({ presetId, customFocus: get().customFocus, customBreak: get().customBreak, customLongBreak: get().customLongBreak, customCycles: get().customCycles });
      set({ presetId, phase: "focus", secondsLeft: preset.focus * 60, running: false, lastTickAt: Date.now() });
      persistSnapshot(get());
    },
    setAutoLog: (autoLog) => { set({ autoLog }); persistSnapshot(get()); },
    setCustom: (patch) => {
      const next = {
        customFocus: clampMin(patch.focus ?? get().customFocus, 1, 180),
        customBreak: clampMin(patch.break ?? get().customBreak, 1, 90),
        customLongBreak: clampMin(patch.longBreak ?? get().customLongBreak, 1, 120),
        customCycles: clampMin(patch.cyclesBeforeLongBreak ?? get().customCycles, 1, 12),
      };
      set(next);
      // Persist to the profile so custom durations back up + sync with the vault.
      useStore.getState().updateProfile({
        pomodoroCustom: {
          focus: next.customFocus, break: next.customBreak, longBreak: next.customLongBreak, cyclesBeforeLongBreak: next.customCycles,
        },
      });
      // Re-fit the clock if the custom preset is active and idle.
      if ((PRESET_ALIASES[get().presetId] ?? get().presetId) === "custom" && !get().running) {
        const preset = effectivePreset(get());
        set({ secondsLeft: (get().phase === "focus" ? preset.focus : preset.break) * 60, lastTickAt: Date.now() });
      }
      persistSnapshot(get());
    },
    setTarget: (target) => {
      set({
        targetKind: target.kind,
        targetId: target.id,
        targetLabel: target.label,
      });
      persistSnapshot(get());
    },
    setIntention: (intention) => { set({ intention }); persistSnapshot(get()); },
    _tick: () => {
      const state = get();
      const elapsed = Math.max(1, Math.floor((Date.now() - state.lastTickAt) / 1000));
      if (state.secondsLeft <= elapsed) {
        complete(true);
        return;
      }
      set({ secondsLeft: state.secondsLeft - elapsed, lastTickAt: Date.now() });
      persistSnapshot(get());
    },
  };
});

export function ensurePomodoroClock() {
  const state = usePomodoro.getState();
  if (state.running) startInterval(() => usePomodoro.getState()._tick());
}

export function pomodoroPreset(id: string): PomodoroPreset {
  return presetById(id);
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

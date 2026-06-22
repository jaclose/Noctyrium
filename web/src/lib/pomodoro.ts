// ===========================================================================
// Pomodoro focus timer. A small, self-contained zustand store kept OUT of the
// persisted vault: the timer is ephemeral session state, but it is global so the
// Productivity panel and the Dashboard widget always show the same running clock.
// When a focus phase completes naturally it auto-logs its minutes to the active
// study day through the main store, so finished sprints feed productivity.
// ===========================================================================
import { create } from "zustand";
import { useStore } from "./store";
import { dayKey } from "./scoring";

export interface PomodoroPreset {
  id: string;
  label: string;
  focus: number; // minutes
  break: number; // minutes
}

export const POMODORO_PRESETS: PomodoroPreset[] = [
  { id: "25-5", label: "25 / 5", focus: 25, break: 5 },
  { id: "50-10", label: "50 / 10", focus: 50, break: 10 },
  { id: "90-20", label: "90 / 20", focus: 90, break: 20 },
];

export type PomodoroPhase = "focus" | "break";
export type PomodoroTargetKind = "free" | "tracker" | "blueprint";

interface PersistedPomodoro {
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

interface PomodoroState {
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
  setTarget: (target: { kind: PomodoroTargetKind; id?: string; label?: string }) => void;
  setIntention: (value: string) => void;
  _tick: () => void;
}

const presetById = (id: string): PomodoroPreset =>
  POMODORO_PRESETS.find((preset) => preset.id === id) ?? POMODORO_PRESETS[0];

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
  try {
    const raw = localStorage.getItem(POMO_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedPomodoro;
    const preset = presetById(parsed.presetId);
    const phase = parsed.phase === "break" ? "break" : "focus";
    const maxSeconds = (phase === "focus" ? preset.focus : preset.break) * 60;
    const elapsed = parsed.running ? Math.floor((Date.now() - Number(parsed.updatedAt || Date.now())) / 1000) : 0;
    return {
      ...parsed,
      phase,
      secondsLeft: Math.max(parsed.running ? 1 : 0, Math.min(maxSeconds, Number(parsed.secondsLeft || maxSeconds) - elapsed)),
      targetKind: parsed.targetKind ?? "free",
      intention: parsed.intention ?? "",
    };
  } catch {
    return {};
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
  // Reset the per-day counters when the active study day rolls over.
  const syncDay = () => {
    const today = dayKey();
    if (get().anchorDay !== today) set({ anchorDay: today, sessionsToday: 0, loggedMinutesToday: 0 });
  };

  const logPartialFocus = (reason: "reset" | "skip") => {
    syncDay();
    const { phase, presetId, secondsLeft, autoLog, targetLabel, intention } = get();
    if (phase !== "focus" || !autoLog) return 0;
    const preset = presetById(presetId);
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
    const { phase, presetId, autoLog, targetLabel, intention } = get();
    const preset = presetById(presetId);
    if (phase === "focus") {
      if (natural && autoLog) {
        useStore.getState().logStudy({ type: "Pomodoro", minutes: preset.focus, note: logNote("complete", targetLabel, intention) });
      }
      if (natural) chime(true);
      set((s) => ({
        phase: "break",
        secondsLeft: preset.break * 60,
        running: natural,
        sessionsToday: natural ? s.sessionsToday + 1 : s.sessionsToday,
        loggedMinutesToday: natural && autoLog ? s.loggedMinutesToday + preset.focus : s.loggedMinutesToday,
        completedAt: natural ? new Date().toISOString() : s.completedAt,
        completedMinutes: natural && autoLog ? preset.focus : s.completedMinutes,
      }));
      persistSnapshot(get());
      if (natural) startInterval(() => get()._tick());
    } else {
      if (natural) chime(false);
      set({ phase: "focus", secondsLeft: preset.focus * 60, running: false });
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
      set({ running: true });
      persistSnapshot(get());
      startInterval(() => get()._tick());
    },
    pause: () => {
      stopInterval();
      set({ running: false });
      persistSnapshot(get());
    },
    toggle: () => (get().running ? get().pause() : get().start()),
    reset: () => {
      stopInterval();
      logPartialFocus("reset");
      const preset = presetById(get().presetId);
      set({ running: false, phase: "focus", secondsLeft: preset.focus * 60 });
      persistSnapshot(get());
    },
    skip: () => {
      logPartialFocus("skip");
      complete(false);
    },
    setPreset: (id) => {
      stopInterval();
      const preset = presetById(id);
      set({ presetId: id, phase: "focus", secondsLeft: preset.focus * 60, running: false });
      persistSnapshot(get());
    },
    setAutoLog: (autoLog) => { set({ autoLog }); persistSnapshot(get()); },
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
      const { secondsLeft } = get();
      if (secondsLeft <= 1) {
        complete(true);
        return;
      }
      set({ secondsLeft: secondsLeft - 1 });
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

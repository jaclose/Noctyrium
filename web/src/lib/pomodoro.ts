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

interface PomodoroState {
  presetId: string;
  phase: PomodoroPhase;
  secondsLeft: number;
  running: boolean;
  autoLog: boolean;
  anchorDay: string;
  sessionsToday: number;
  loggedMinutesToday: number;
  // actions
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  skip: () => void;
  setPreset: (id: string) => void;
  setAutoLog: (value: boolean) => void;
  _tick: () => void;
}

const presetById = (id: string): PomodoroPreset =>
  POMODORO_PRESETS.find((preset) => preset.id === id) ?? POMODORO_PRESETS[0];

let interval: ReturnType<typeof setInterval> | null = null;

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
  // Reset the per-day counters when the active study day rolls over.
  const syncDay = () => {
    const today = dayKey();
    if (get().anchorDay !== today) set({ anchorDay: today, sessionsToday: 0, loggedMinutesToday: 0 });
  };

  // A phase finished — log the focus block (if natural + auto-log on), then
  // advance: focus → break keeps running; break → focus pauses for a fresh start.
  const complete = (natural: boolean) => {
    stopInterval();
    syncDay();
    const { phase, presetId, autoLog } = get();
    const preset = presetById(presetId);
    if (phase === "focus") {
      if (natural && autoLog) {
        useStore.getState().logStudy({ type: "Pomodoro", minutes: preset.focus, note: "Pomodoro focus sprint" });
      }
      if (natural) chime(true);
      set((s) => ({
        phase: "break",
        secondsLeft: preset.break * 60,
        running: natural,
        sessionsToday: natural ? s.sessionsToday + 1 : s.sessionsToday,
        loggedMinutesToday: natural && autoLog ? s.loggedMinutesToday + preset.focus : s.loggedMinutesToday,
      }));
      if (natural) startInterval(() => get()._tick());
    } else {
      if (natural) chime(false);
      set({ phase: "focus", secondsLeft: preset.focus * 60, running: false });
    }
  };

  return {
    presetId: "25-5",
    phase: "focus",
    secondsLeft: 25 * 60,
    running: false,
    autoLog: true,
    anchorDay: dayKey(),
    sessionsToday: 0,
    loggedMinutesToday: 0,

    start: () => {
      if (get().running) return;
      syncDay();
      set({ running: true });
      startInterval(() => get()._tick());
    },
    pause: () => {
      stopInterval();
      set({ running: false });
    },
    toggle: () => (get().running ? get().pause() : get().start()),
    reset: () => {
      stopInterval();
      const preset = presetById(get().presetId);
      set({ running: false, phase: "focus", secondsLeft: preset.focus * 60 });
    },
    skip: () => complete(false),
    setPreset: (id) => {
      stopInterval();
      const preset = presetById(id);
      set({ presetId: id, phase: "focus", secondsLeft: preset.focus * 60, running: false });
    },
    setAutoLog: (autoLog) => set({ autoLog }),
    _tick: () => {
      const { secondsLeft } = get();
      if (secondsLeft <= 1) {
        complete(true);
        return;
      }
      set({ secondsLeft: secondsLeft - 1 });
    },
  };
});

export function pomodoroPreset(id: string): PomodoroPreset {
  return presetById(id);
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

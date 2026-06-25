// ===========================================================================
// Habit logic (directive §6). Pure, deterministic, and deliberately calm:
// streaks survive intentional skips and non-scheduled days, "missed" is the only
// thing that breaks a chain, and recovery habits never break at all. No
// shame-heavy mechanics — a miss returns a gentle restart message, not a scolding.
// ===========================================================================
import type { Habit, HabitEntry, HabitCheckStatus, HabitType } from "./types";
import { isoDate } from "./scoring";
import { addLocalDays, localDateKey } from "./dailyRollover";

export const HABIT_TYPE_META: Record<HabitType, { label: string; hint: string; needsTarget: boolean }> = {
  binary: { label: "Yes / No", hint: "Did it or didn't.", needsTarget: false },
  duration: { label: "Duration", hint: "Minutes toward a daily target.", needsTarget: true },
  count: { label: "Count", hint: "Reps/units toward a daily target.", needsTarget: true },
  avoidance: { label: "Avoidance", hint: "Success = you avoided it today.", needsTarget: false },
  weekly: { label: "Flexible weekly", hint: "N times per week, any days.", needsTarget: true },
  scheduled: { label: "Scheduled days", hint: "Specific weekdays only.", needsTarget: false },
  recovery: { label: "Recovery", hint: "Gentle restart — never punishes a miss.", needsTarget: false },
  milestone: { label: "Milestone", hint: "A cumulative one-time goal.", needsTarget: true },
};

export const STATUS_META: Record<HabitCheckStatus, { label: string; tone: "green" | "cyan" | "neutral" | "orange" }> = {
  done: { label: "Done", tone: "green" },
  partial: { label: "Partial", tone: "cyan" },
  skipped: { label: "Skipped", tone: "neutral" },
  missed: { label: "Missed", tone: "orange" },
};

/** Is this habit expected on the given local date? (scheduled habits only fire on their weekdays) */
export function isScheduledDay(habit: Habit, date: string): boolean {
  if (habit.type !== "scheduled" || !habit.schedule?.length) return true;
  const weekday = new Date(`${date}T12:00:00`).getDay();
  return habit.schedule.includes(weekday);
}

export function entryFor(entries: HabitEntry[], habitId: string, date: string): HabitEntry | undefined {
  return entries.find((e) => e.habitId === habitId && e.date === date);
}

export function statusOn(habit: Habit, entries: HabitEntry[], date: string): HabitCheckStatus | "none" {
  const entry = entryFor(entries, habit.id, date);
  if (entry) return entry.status;
  return "none";
}

/**
 * Whether a day "holds" the streak. Non-punitive: done/partial hold it, an
 * intentional skip holds it, and a day the habit isn't scheduled holds it. Only
 * an explicit "missed" (or, for non-recovery habits, an unlogged scheduled past
 * day) breaks it. Recovery habits never break.
 */
function dayHolds(habit: Habit, entries: HabitEntry[], date: string, isPast: boolean): boolean {
  if (habit.type === "recovery") return true;
  if (!isScheduledDay(habit, date)) return true;
  const status = statusOn(habit, entries, date);
  if (status === "done" || status === "partial" || status === "skipped") return true;
  if (status === "missed") return false;
  // status === "none": an unlogged scheduled day in the past counts as a break,
  // but today being unlogged never breaks (you may still do it).
  return !isPast;
}

/**
 * Current streak counting back from `today`. Today being unlogged does not break
 * the chain (mirrors studyStreak). Avoidance habits count "done" (avoided) days.
 */
export function currentStreak(habit: Habit, entries: HabitEntry[], today: string = localDateKey()): number {
  let streak = 0;
  let cursor = today;
  let isToday = true;
  // Walk backwards up to 2 years to stay bounded.
  for (let i = 0; i < 730; i++) {
    const past = !isToday;
    if (!isScheduledDay(habit, cursor)) {
      cursor = addLocalDays(cursor, -1);
      isToday = false;
      continue;
    }
    const status = statusOn(habit, entries, cursor);
    const counts = status === "done" || status === "partial";
    if (counts) {
      streak++;
    } else if (!dayHolds(habit, entries, cursor, past)) {
      break;
    } else if (past && status === "none") {
      // unlogged past scheduled day breaks for non-recovery habits
      if (habit.type !== "recovery") break;
    }
    cursor = addLocalDays(cursor, -1);
    isToday = false;
  }
  return streak;
}

export interface HabitWeekStats {
  done: number;
  partial: number;
  skipped: number;
  missed: number;
  scheduledDays: number;
  adherence: number; // 0–100 over scheduled days
}

/** Aggregate a habit's status across a set of local dates (e.g. the last 7 days). */
export function weekStats(habit: Habit, entries: HabitEntry[], dates: string[]): HabitWeekStats {
  let done = 0, partial = 0, skipped = 0, missed = 0, scheduledDays = 0;
  for (const date of dates) {
    if (!isScheduledDay(habit, date)) continue;
    scheduledDays++;
    const status = statusOn(habit, entries, date);
    if (status === "done") done++;
    else if (status === "partial") partial++;
    else if (status === "skipped") skipped++;
    else if (status === "missed") missed++;
  }
  // Adherence credits done fully and partial at half, over scheduled (non-skipped) days.
  const effective = Math.max(0, scheduledDays - skipped);
  const adherence = effective > 0 ? Math.round(((done + partial * 0.5) / effective) * 100) : 0;
  return { done, partial, skipped, missed, scheduledDays, adherence };
}

export interface HeatCell {
  date: string;
  status: HabitCheckStatus | "none";
  scheduled: boolean;
  /** 0 (none) – 1 (done) intensity for rendering. */
  intensity: number;
}

const INTENSITY: Record<HabitCheckStatus, number> = { done: 1, partial: 0.6, skipped: 0.25, missed: 0.12 };

/** Last `days` cells (oldest → newest) for a habit heatmap. */
export function heatmapCells(habit: Habit, entries: HabitEntry[], days = 35, today: string = localDateKey()): HeatCell[] {
  const cells: HeatCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addLocalDays(today, -i);
    const scheduled = isScheduledDay(habit, date);
    const status = statusOn(habit, entries, date);
    cells.push({
      date,
      status,
      scheduled,
      intensity: status === "none" ? 0 : INTENSITY[status],
    });
  }
  return cells;
}

/** A short, non-punitive nudge based on the last few days. Never shames a miss. */
export function recoveryMessage(habit: Habit, entries: HabitEntry[], today: string = localDateKey()): string {
  const streak = currentStreak(habit, entries, today);
  const yesterday = addLocalDays(today, -1);
  const yStatus = statusOn(habit, entries, yesterday);
  if (habit.examMode) return "Exam mode: logging only, no pressure. Do what you can.";
  if (yStatus === "missed" || yStatus === "none") {
    return "Missed yesterday — that's fine. Restart today; one rep rebuilds momentum.";
  }
  if (streak >= 21) return `${streak}-day rhythm. This is who you are now — protect it, don't grind it.`;
  if (streak >= 7) return `${streak} days steady. Consistency is compounding.`;
  if (streak >= 1) return `${streak} day${streak === 1 ? "" : "s"} going. Keep it light and repeatable.`;
  return "Fresh start. Pick the smallest version you can't say no to.";
}

/** Default schedule (every day) and helpers for the creation flow. */
export function newHabitDefaults(name: string, type: HabitType): Omit<Habit, "id" | "createdAt" | "updatedAt"> {
  return {
    name: name.trim(),
    type,
    target: HABIT_TYPE_META[type].needsTarget ? (type === "duration" ? 20 : type === "weekly" ? 3 : 1) : undefined,
    unit: type === "duration" ? "min" : type === "count" ? "reps" : undefined,
    weeklyTarget: type === "weekly" ? 3 : undefined,
    schedule: undefined,
    quietMode: false,
  };
}

/** Today's local date key (re-exported so the page doesn't import two date utils). */
export function todayKey(): string {
  return isoDate(new Date());
}

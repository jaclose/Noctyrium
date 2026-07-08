// ===========================================================================
// Daily Closeout — the 30–90 second end-of-day review (directive §3). One
// record per study day; feeds tomorrow's Command Brief (first task + mode
// preference), recovery signals, and the energy history.
// ===========================================================================
import type { ID } from "./types";
import type { BriefMode } from "./commandBrief";

export type EnergyVsMorning = "lower" | "same" | "higher";

export interface DailyCloseout {
  id: ID;
  dayKey: string; // local yyyy-MM-dd
  completedSummary: string;
  remainingSummary?: string;
  blocker?: string;
  tomorrowFirstTask?: string;
  energyVsMorning?: EnergyVsMorning;
  /** "auto" lets the Command Brief rules decide tomorrow's mode. */
  tomorrowMode: "auto" | BriefMode;
  createdAt: string;
  updatedAt: string;
}

export function closeoutForDay(closeouts: DailyCloseout[], dayKey: string): DailyCloseout | undefined {
  return closeouts.find((c) => c.dayKey === dayKey);
}

/** The most recent closeout strictly before `dayKey` (yesterday's, usually). */
export function previousCloseout(closeouts: DailyCloseout[], dayKey: string): DailyCloseout | undefined {
  return [...closeouts]
    .filter((c) => c.dayKey < dayKey)
    .sort((a, b) => b.dayKey.localeCompare(a.dayKey))[0];
}

import { addLocalDays } from "./dailyRollover";
import { evaluateDailySuccess } from "./dailySuccess";
import { targetPassesForItem } from "./tracker";
import type { NoctyriumState, StudyLog } from "./types";

export type ReportMetricState = "ready" | "low-data" | "neutral";
export type ReportMetricId = "study" | "streak" | "consistency" | "daily-success" | "readiness" | "performance" | "tracker-mastery" | "tasks";
export type CoreReportMetricId = Exclude<ReportMetricId, "readiness" | "performance">;

export interface ReportMetric {
  id: ReportMetricId;
  label: string;
  value: string;
  note: string;
  numerator: number;
  denominator: number;
  period: string;
  sourceLabel: string;
  sourceRecordIds: string[];
  calculation: string;
  interpretation: string;
  action?: string;
  state: ReportMetricState;
}

export interface CanonicalReportSummary {
  startKey: string;
  endKey: string;
  observedDates: string[];
  eligibleDates: string[];
  scoredDates: string[];
  activeDates: string[];
  successfulDates: string[];
  metrics: Record<CoreReportMetricId, ReportMetric>;
}

/** One canonical denominator/provenance source for the primary report cards. */
export function buildCanonicalReportSummary(state: NoctyriumState, range: number): CanonicalReportSummary {
  const endKey = state.activeDayKey;
  const allDates = reportDateKeys(endKey, range);
  const trackingFloor = reportTrackingFloor(state);
  const observedDates = allDates.filter((date) => date >= trackingFloor && date <= endKey);
  const successResults = observedDates.map((date) => evaluateDailySuccess(state, date, endKey));
  const eligibleResults = successResults.filter((result) => result.eligibleCount > 0);
  const eligibleDates = eligibleResults.map((result) => result.dayKey);
  // The current day remains visible in trends, but it does not become a failed
  // denominator while its selected requirements are still awaiting/in progress.
  const scoredResults = eligibleResults.filter((result) => result.dayKey < endKey || result.status === "met");
  const scoredDates = scoredResults.map((result) => result.dayKey);
  const logs = state.logs.filter((log) => observedDates.includes(log.dayKey));
  const observedActiveDates = observedDates.filter((date) => hasNetActivity(state.logs, date));
  const activeDates = eligibleDates.filter((date) => hasNetActivity(state.logs, date));
  const scoredActiveDates = scoredDates.filter((date) => hasNetActivity(state.logs, date));
  const successfulDates = scoredResults.filter((result) => result.status === "met").map((result) => result.dayKey);
  const totalMinutes = sumDailyNet(logs, (log) => finite(log.minutes));
  const totalQuantities = sumDailyNet(logs, (log) => finite(log.quantity) || finite(log.cards));

  const activeTracker = state.tracker.filter((item) => item.passes < targetPassesForItem(item) || item.yield === "review");
  const completedTracker = state.tracker.filter((item) => item.passes >= targetPassesForItem(item));
  const reviewedTracker = state.tracker.filter((item) => item.passes > 0);
  const ankiTracker = state.tracker.filter((item) => item.ankiPasses > 0);

  const startKey = allDates[0] ?? endKey;
  const inPeriodTasks = state.tasks.filter((task) => !task.archived && (
    task.due && task.due.slice(0, 10) >= startKey && task.due.slice(0, 10) <= endKey
    || task.completedAt && task.completedAt.slice(0, 10) >= startKey && task.completedAt.slice(0, 10) <= endKey
  ));
  const completedTasks = inPeriodTasks.filter((task) => task.done);
  const dueTasks = inPeriodTasks.filter((task) => !task.done && Boolean(task.due));
  const overdueTasks = dueTasks.filter((task) => task.due!.slice(0, 10) < endKey);
  const streak = successStreak(state, trackingFloor);

  const observationPeriod = `${observedDates.length} observed day${observedDates.length === 1 ? "" : "s"}`;
  const scoredPeriod = `${scoredDates.length} scored eligible day${scoredDates.length === 1 ? "" : "s"}`;
  const windowPeriod = `${allDates.length}-day window ending ${endKey}`;
  const consistency = percent(scoredActiveDates.length, scoredDates.length);
  const dailySuccess = percent(successfulDates.length, scoredResults.length);
  const mastery = percent(completedTracker.length, state.tracker.length);
  const hasSelectedRequirements = state.profile.dailySuccess
    ? state.profile.dailySuccess.requirements.some((requirement) => requirement.enabled)
    : true;

  return {
    startKey,
    endKey,
    observedDates,
    eligibleDates,
    scoredDates,
    activeDates,
    successfulDates,
    metrics: {
      study: {
        id: "study",
        label: "Recorded activity",
        value: totalMinutes ? `${Math.round(totalMinutes / 60)}h` : observedActiveDates.length ? `${observedActiveDates.length}` : "No data",
        note: totalMinutes ? `${totalMinutes} minutes${totalQuantities ? ` · ${totalQuantities} recorded units` : ""}` : `${observedActiveDates.length} active day${observedActiveDates.length === 1 ? "" : "s"}`,
        numerator: totalMinutes,
        denominator: observedDates.length,
        period: observationPeriod,
        sourceLabel: "Activity log",
        sourceRecordIds: logs.map((log) => log.id),
        calculation: `${totalMinutes} net minutes across ${logs.length} in-range activity record${logs.length === 1 ? "" : "s"}; signed corrections are applied before each day is clamped at zero.`,
        interpretation: logs.length ? "This is recorded effort, not a judgment of quality." : "AXOM needs a real activity before it can describe effort.",
        action: logs.length ? "Review the activity timeline" : "Log one activity",
        state: logs.length ? "ready" : "neutral",
      },
      streak: {
        id: "streak",
        label: "Current streak",
        value: scoredResults.length ? `${streak}` : "Building",
        note: scoredResults.length ? `${streak === 1 ? "eligible day" : "eligible days"} meeting selected requirements` : "No completed eligible success days yet",
        numerator: streak,
        denominator: scoredResults.length,
        period: scoredPeriod,
        sourceLabel: "Daily-success requirements and their linked records",
        sourceRecordIds: unique(scoredResults.flatMap((result) => result.requirements.flatMap((item) => item.sourceRecordIds))),
        calculation: "Counts consecutive eligible days whose selected requirements were met; today awaiting activity does not break it.",
        interpretation: streak ? "The current eligible rhythm is intact." : "A streak starts only after a selected requirement is met.",
        action: "Review today's remaining requirements",
        state: scoredResults.length ? "ready" : "neutral",
      },
      consistency: {
        id: "consistency",
        label: "Consistency",
        value: scoredDates.length ? `${consistency}%` : "Building",
        note: `${scoredActiveDates.length}/${scoredDates.length} completed eligible days had activity`,
        numerator: scoredActiveDates.length,
        denominator: scoredDates.length,
        period: scoredPeriod,
        sourceLabel: "Positive activity records",
        sourceRecordIds: logs.filter((log) => scoredActiveDates.includes(log.dayKey)).map((log) => log.id),
        calculation: `${scoredActiveDates.length} active completed eligible days ÷ ${scoredDates.length} completed eligible days. Off-schedule dates, dates before tracking began, and a pending current day are excluded.`,
        interpretation: scoredDates.length < 3 ? "More completed eligible days are needed before a pattern is meaningful." : consistency >= 70 ? "Activity is appearing on most eligible days." : "The pattern is still intermittent.",
        action: "Choose the smallest repeatable next action",
        state: scoredDates.length >= 3 ? "ready" : scoredDates.length ? "low-data" : "neutral",
      },
      "daily-success": {
        id: "daily-success",
        label: "Daily success",
        value: scoredResults.length ? `${dailySuccess}%` : hasSelectedRequirements ? "Building" : "Not configured",
        note: scoredResults.length
          ? `${successfulDates.length}/${scoredResults.length} eligible days met selected requirements`
          : hasSelectedRequirements
            ? "No completed eligible requirement day is ready to score"
            : "Choose requirements before this metric is scored",
        numerator: successfulDates.length,
        denominator: scoredResults.length,
        period: scoredPeriod,
        sourceLabel: "Configured daily-success selector",
        sourceRecordIds: unique(scoredResults.flatMap((result) => result.requirements.flatMap((item) => item.sourceRecordIds))),
        calculation: scoredResults.length
          ? `${successfulDates.length} successful eligible days ÷ ${scoredResults.length} scored eligible days.`
          : hasSelectedRequirements
            ? "No completed eligible requirement day produced a denominator; a pending current day is excluded."
            : "No configured eligible requirement produced a denominator.",
        interpretation: scoredResults.length
          ? "Only requirements active on each date are considered."
          : hasSelectedRequirements
            ? "The first result appears after an eligible day is completed or today's requirements are met."
            : "Cards, minutes, and every other supported signal remain optional.",
        action: hasSelectedRequirements ? "Review today's requirements" : "Configure daily requirements",
        state: scoredResults.length >= 3 ? "ready" : scoredResults.length ? "low-data" : "neutral",
      },
      "tracker-mastery": {
        id: "tracker-mastery",
        label: "Tracker mastery",
        value: state.tracker.length ? `${mastery}%` : "No data",
        note: state.tracker.length ? `${completedTracker.length} completed · ${activeTracker.length} active` : "Add or import tracked items",
        numerator: completedTracker.length,
        denominator: state.tracker.length,
        period: "Current tracker state",
        sourceLabel: "Course Tracker items",
        sourceRecordIds: state.tracker.map((item) => item.id),
        calculation: `${completedTracker.length} completed at target ÷ ${state.tracker.length} tracked items. ${reviewedTracker.length} reviewed; ${ankiTracker.length} Anki-linked.`,
        interpretation: "Completion, review progress, and Anki linkage are disclosed separately rather than collapsed into one claim.",
        action: "Open Course Tracker",
        state: state.tracker.length ? "ready" : "neutral",
      },
      tasks: {
        id: "tasks",
        label: "Tasks",
        value: inPeriodTasks.length ? `${completedTasks.length}/${inPeriodTasks.length}` : "No due tasks",
        note: `${completedTasks.length} completed · ${dueTasks.length} due · ${overdueTasks.length} overdue`,
        numerator: completedTasks.length,
        denominator: inPeriodTasks.length,
        period: windowPeriod,
        sourceLabel: "Non-archived tasks due or completed in the period",
        sourceRecordIds: inPeriodTasks.map((task) => task.id),
        calculation: "Counts non-archived tasks whose due or completion date falls inside the selected report window.",
        interpretation: overdueTasks.length ? `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? "" : "s"} may need a decision.` : "No overdue in-period task is detected.",
        action: overdueTasks.length ? "Review overdue tasks" : "Review current tasks",
        state: inPeriodTasks.length ? "ready" : "neutral",
      },
    },
  };
}

export function reportDateKeys(endKey: string, range: number): string[] {
  const count = Math.max(1, Math.min(366, Math.floor(Number.isFinite(range) ? range : 1)));
  return Array.from({ length: count }, (_, index) => addLocalDays(endKey, index - count + 1));
}

function reportTrackingFloor(state: NoctyriumState): string {
  const configuredStarts = state.profile.dailySuccess?.requirements
    .filter((requirement) => requirement.enabled)
    .map((requirement) => requirement.trackingStartsAt)
    .filter(Boolean) ?? [];
  if (configuredStarts.length) return [...configuredStarts].sort()[0];
  const firstActivity = [...state.logs].filter(isActivity).sort((a, b) => a.dayKey.localeCompare(b.dayKey))[0]?.dayKey;
  return firstActivity ?? state.activeDayKey;
}

function successStreak(state: NoctyriumState, floor: string): number {
  let cursor = state.activeDayKey;
  let streak = 0;
  let first = true;
  for (let index = 0; index < 366 && cursor >= floor; index += 1) {
    const result = evaluateDailySuccess(state, cursor, state.activeDayKey);
    if (result.eligibleCount === 0) {
      cursor = addLocalDays(cursor, -1);
      first = false;
      continue;
    }
    if (first && result.status !== "met") {
      cursor = addLocalDays(cursor, -1);
      first = false;
      continue;
    }
    if (result.status === "met") streak += 1;
    else break;
    cursor = addLocalDays(cursor, -1);
    first = false;
  }
  return streak;
}

function isActivity(log: StudyLog): boolean {
  return finite(log.minutes) > 0 || finite(log.cards) > 0 || finite(log.quantity) > 0;
}

function hasNetActivity(logs: StudyLog[], dayKey: string): boolean {
  const dayLogs = logs.filter((log) => log.dayKey === dayKey);
  const minutes = dayLogs.reduce((sum, log) => sum + finite(log.minutes), 0);
  const cards = dayLogs.reduce((sum, log) => sum + finite(log.cards), 0);
  const quantity = dayLogs.reduce((sum, log) => sum + finite(log.quantity), 0);
  return minutes > 0 || cards > 0 || quantity > 0;
}

function sumDailyNet(logs: StudyLog[], value: (log: StudyLog) => number): number {
  const byDay = new Map<string, number>();
  for (const log of logs) byDay.set(log.dayKey, (byDay.get(log.dayKey) ?? 0) + finite(value(log)));
  return [...byDay.values()].reduce((sum, daily) => sum + Math.max(0, daily), 0);
}

function percent(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function finite(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

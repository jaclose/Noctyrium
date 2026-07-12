// ===========================================================================
// Recovery Protocol (directive §4) — a core feature, not an emergency button.
// Detects "behind" signals, states the situation without shame, estimates the
// gap, triages work into buckets, and generates a 24-hour restart plan plus a
// 72-hour stabilization plan. Pure functions; persistence lives in store.ts.
// No red-alert theatrics, no streak guilt — language stays factual and calm.
// ===========================================================================
import type { ID, StudyLog, Task, TrackerItem } from "./types";
import type { BriefSignals } from "./commandBrief";
import { targetPassesForItem, isQuestionKind } from "./tracker";

export type RecoveryBucket = "non-negotiable" | "high-yield" | "deferrable" | "drop-for-now";

export const BUCKET_LABEL: Record<RecoveryBucket, string> = {
  "non-negotiable": "Non-negotiable",
  "high-yield": "High-yield",
  deferrable: "Deferrable",
  "drop-for-now": "Safe to drop for now",
};

export type RecoveryPlanStatus = "proposed" | "accepted" | "edited" | "deferred" | "dismissed" | "completed";

export interface RecoveryItem {
  id: ID;
  title: string;
  bucket: RecoveryBucket;
  link?: { kind: "task" | "tracker"; id: ID };
  estimatedMinutes: number;
  note?: string;
}

export interface RecoveryStep {
  id: ID;
  window: "24h" | "72h";
  title: string;
  minutes: number;
  done: boolean;
}

export interface RecoveryPlan {
  id: ID;
  /** Local study day this preview belongs to. Additive metadata; schema stays v32. */
  dayKey?: string;
  createdAt: string;
  updatedAt: string;
  status: RecoveryPlanStatus;
  situation: string;
  gapEstimate: string;
  triggers: string[];
  items: RecoveryItem[];
  steps: RecoveryStep[];
  loadAssessment?: RecoveryLoadAssessment;
}

// --- trigger detection --------------------------------------------------------

export interface RecoveryTrigger {
  triggered: boolean;
  signals: string[];
  severity: "none" | "mild" | "moderate" | "serious";
  score: number;
  components: Array<{ label: string; points: number }>;
}

export function detectRecoveryTriggers(signals: BriefSignals): RecoveryTrigger {
  const hits: string[] = [];
  if (signals.daysSinceLastStudy >= 3) hits.push(`${signals.daysSinceLastStudy} days with no study logged`);
  else if (signals.daysSinceLastStudy === 2) hits.push("2 days with no study logged");
  if (signals.missedDaysLast7 >= 3) hits.push(`${signals.missedDaysLast7} of the last 7 days without study`);
  if (signals.carriedTasks >= 3) hits.push(`${signals.carriedTasks} tasks repeatedly carried forward`);
  if (signals.overdueTasks >= 3) hits.push(`${signals.overdueTasks} overdue tasks`);
  if (signals.examDaysAway !== null && signals.examDaysAway >= 0 && signals.examDaysAway <= 14 && signals.backlogScore >= 40) {
    hits.push(`assessment in ${signals.examDaysAway} days with meaningful backlog`);
  }
  if (signals.reviewFlagged >= 6) hits.push(`${signals.reviewFlagged} items flagged needs-review`);

  const components = [
    { label: "Study inactivity", points: signals.daysSinceLastStudy >= 3 ? 2 : signals.daysSinceLastStudy >= 2 ? 1 : 0 },
    { label: "Missed study days", points: signals.missedDaysLast7 >= 3 ? 1 : 0 },
    { label: "Repeated carryover", points: signals.carriedTasks >= 3 ? 1 : 0 },
    { label: "Overdue tasks", points: signals.overdueTasks >= 3 ? 1 : 0 },
    { label: "Combined backlog", points: signals.backlogScore >= 60 ? 2 : signals.backlogScore >= 40 ? 1 : 0 },
  ].filter((component) => component.points > 0);
  const score = components.reduce((sum, component) => sum + component.points, 0);

  return {
    triggered: score >= 2,
    signals: hits,
    severity: score >= 4 ? "serious" : score >= 3 ? "moderate" : score >= 2 ? "mild" : "none",
    score,
    components,
  };
}

// --- plan generation ----------------------------------------------------------

const uid = () => crypto.randomUUID();

export interface RecoveryPlanInputs {
  tasks: Task[];
  tracker: TrackerItem[];
  signals: BriefSignals;
  trigger: RecoveryTrigger;
  activeDayKey: string;
  logs?: StudyLog[];
  dailyTargetMinutes?: number;
  now?: Date;
}

export interface RecoveryLoadAssessment {
  openTaskCount: number;
  belowTargetItemCount: number;
  activeItemCount: number;
  estimatedMinutesLow: number;
  estimatedMinutesHigh: number;
  configuredDailyTargetMinutes: number | null;
  historyEvidenceDays: number;
  usualCompletedMinutes: { low: number; high: number } | null;
}

/** One canonical, inspectable load calculation used by copy and UI. */
export function assessRecoveryLoad(inputs: Pick<RecoveryPlanInputs, "tasks" | "tracker" | "activeDayKey" | "logs" | "dailyTargetMinutes">): RecoveryLoadAssessment {
  const openTasks = inputs.tasks.filter((t) => !t.done && !t.archived).length;
  const behindItems = inputs.tracker.filter((t) => t.passes < targetPassesForItem(t)).length;
  const roughMinutes = openTasks * 30 + Math.min(behindItems, 30) * 35;
  const byDay = new Map<string, number>();
  for (const log of inputs.logs ?? []) {
    if (log.dayKey >= inputs.activeDayKey || log.academic === false || log.productive === false) continue;
    const minutes = Number.isFinite(log.minutes) ? Math.max(0, log.minutes) : 0;
    if (minutes > 0) byDay.set(log.dayKey, (byDay.get(log.dayKey) ?? 0) + minutes);
  }
  const history = [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 14)
    .map(([, minutes]) => minutes)
    .sort((a, b) => a - b);
  const usualCompletedMinutes = history.length >= 3
    ? {
      low: history[Math.floor((history.length - 1) * 0.25)],
      high: history[Math.ceil((history.length - 1) * 0.75)],
    }
    : null;
  const configured = Number(inputs.dailyTargetMinutes);
  return {
    openTaskCount: openTasks,
    belowTargetItemCount: behindItems,
    activeItemCount: openTasks + behindItems,
    estimatedMinutesLow: roughMinutes === 0 ? 0 : Math.max(30, Math.floor(roughMinutes * 0.6)),
    estimatedMinutesHigh: roughMinutes,
    configuredDailyTargetMinutes: Number.isFinite(configured) && configured > 0 ? configured : null,
    historyEvidenceDays: history.length,
    usualCompletedMinutes,
  };
}

/** Estimate how much work is actually outstanding, in honest ranges. */
export function estimateGap(inputs: Pick<RecoveryPlanInputs, "tasks" | "tracker" | "signals" | "activeDayKey" | "logs" | "dailyTargetMinutes">): string {
  const assessment = assessRecoveryLoad(inputs);
  if (assessment.activeItemCount === 0) return "No outstanding tasks or below-target tracker items were detected.";
  const hoursLow = Math.max(1, Math.floor(assessment.estimatedMinutesLow / 60));
  const hoursHigh = Math.max(hoursLow + 1, Math.ceil(assessment.estimatedMinutesHigh / 60));
  const examNote = inputs.signals.examDaysAway !== null && inputs.signals.examDaysAway >= 0
    ? ` with ${inputs.signals.examDaysAway} day${inputs.signals.examDaysAway === 1 ? "" : "s"} until ${inputs.signals.examLabel ?? "the assessment"}`
    : "";
  return `Roughly ${hoursLow}–${hoursHigh} hours of outstanding work (${assessment.openTaskCount} open tasks, ${assessment.belowTargetItemCount} tracker items below target)${examNote}. Full completion may not be realistic — the plan below prioritizes instead.`;
}

function triageTracker(tracker: TrackerItem[], examSoon: boolean): RecoveryItem[] {
  const behind = tracker.filter((t) => t.passes < targetPassesForItem(t));
  const items: RecoveryItem[] = [];
  for (const t of behind) {
    let bucket: RecoveryBucket;
    if (t.yield === "review") bucket = "non-negotiable";
    else if (t.yield === "high" || isQuestionKind(t.kind)) bucket = "high-yield";
    else if (t.yield === "low") bucket = "drop-for-now";
    else bucket = examSoon && t.passes === 0 ? "deferrable" : "deferrable";
    items.push({
      id: uid(),
      title: t.label,
      bucket,
      link: { kind: "tracker", id: t.id },
      estimatedMinutes: isQuestionKind(t.kind) ? 40 : 35,
      note: t.yield === "review" ? "Flagged needs-review — repair before new content." : undefined,
    });
  }
  return items;
}

function triageTasks(tasks: Task[], activeDayKey: string): RecoveryItem[] {
  return tasks
    .filter((t) => !t.done && !t.archived)
    .map((t) => ({
      id: uid(),
      title: t.title,
      bucket: (t.due && t.due < activeDayKey
        ? "non-negotiable"
        : (t.carryoverFrom?.length ?? 0) >= 2 ? "high-yield" : "deferrable") as RecoveryBucket,
      link: { kind: "task" as const, id: t.id },
      estimatedMinutes: 30,
      note: t.due && t.due < activeDayKey ? `Due ${t.due}` : undefined,
    }));
}

export function buildRecoveryPlan(inputs: RecoveryPlanInputs): RecoveryPlan {
  const now = inputs.now ?? new Date();
  const examSoon = inputs.signals.examDaysAway !== null && inputs.signals.examDaysAway >= 0 && inputs.signals.examDaysAway <= 10;

  const items = [...triageTasks(inputs.tasks, inputs.activeDayKey), ...triageTracker(inputs.tracker, examSoon)]
    .sort((a, b) => bucketRank(a.bucket) - bucketRank(b.bucket))
    .slice(0, 24);

  const nonNeg = items.filter((i) => i.bucket === "non-negotiable");
  const highYield = items.filter((i) => i.bucket === "high-yield");
  const first = nonNeg[0] ?? highYield[0] ?? items[0];

  const steps: RecoveryStep[] = [
    // 24-hour restart: small, concrete, finishable. The goal is a logged win.
    { id: uid(), window: "24h", title: "One 25-minute session on the first item below — nothing else counts today", minutes: 25, done: false },
    ...(first ? [{ id: uid(), window: "24h" as const, title: `Start here: ${first.title}`, minutes: first.estimatedMinutes, done: false }] : []),
    { id: uid(), window: "24h", title: "Run tonight's 60-second closeout so tomorrow starts pre-decided", minutes: 2, done: false },
    // 72-hour stabilization: rebuild rhythm, don't repay debt all at once.
    { id: uid(), window: "72h", title: `Clear the non-negotiables (${nonNeg.length} item${nonNeg.length === 1 ? "" : "s"}) across the next three days`, minutes: nonNeg.reduce((a, i) => a + i.estimatedMinutes, 0), done: false },
    { id: uid(), window: "72h", title: examSoon ? "One question block per day on weak areas — misses feed the error log" : "One high-yield item per day, then stop while it still feels doable", minutes: 45, done: false },
    { id: uid(), window: "72h", title: "Defer or drop everything in the bottom two buckets without guilt — it is written down, not lost", minutes: 5, done: false },
  ];

  const trigger = inputs.trigger;
  const situation = trigger.signals.length
    ? `Here's where things stand: ${trigger.signals.join("; ")}. This is recoverable — the plan starts smaller than you think it should.`
    : "Work has drifted behind the plan. This is recoverable — the plan starts smaller than you think it should.";

  return {
    id: uid(),
    dayKey: inputs.activeDayKey,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    status: "proposed",
    situation,
    gapEstimate: estimateGap(inputs),
    triggers: trigger.signals,
    items,
    steps,
    loadAssessment: assessRecoveryLoad(inputs),
  };
}

function bucketRank(b: RecoveryBucket): number {
  return { "non-negotiable": 0, "high-yield": 1, deferrable: 2, "drop-for-now": 3 }[b];
}

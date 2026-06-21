import type { DayPlan, JournalEntry, StudyLog, Task, TrackerItem } from "./types";
import { dayTotals, isoDate, lastNDays, studyStreak } from "./scoring";
import { scopeMastery } from "./tracker";

export interface PerformanceInput {
  logs: StudyLog[];
  journal: JournalEntry[];
  tasks: Task[];
  tracker: TrackerItem[];
  dayPlans: DayPlan[];
  activeDayKey: string;
  minuteTarget: number;
  cardTarget: number;
  range?: number;
}

export interface PerformanceInsight {
  energyScore: number;
  energyLabel: "Low" | "Medium" | "High";
  performanceScore: number;
  performanceLabel: "Off track" | "Stabilizing" | "On track" | "Ahead";
  preliminary: boolean;
  activeDays: number;
  evidenceDays: number;
  consistency: number;
  adherence: number;
  journalSignal: string;
  recommendation: string;
  positives: string[];
  risks: string[];
}

const POSITIVE_TERMS = [
  ["gym", 7], ["workout", 7], ["exercise", 6], ["walk", 4], ["slept", 5], ["sleep", 3],
  ["finished", 7], ["completed", 7], ["consistent", 8], ["focused", 6], ["reviewed", 4],
  ["questions", 5], ["uworld", 5], ["anki", 4], ["lecture", 3], ["lectures", 4],
  ["caught up", 9], ["good", 4], ["proud", 5], ["win", 6],
] as const;

const NEGATIVE_TERMS = [
  ["skipped gym", -10], ["skipped workout", -10], ["behind", -9], ["doomscroll", -8],
  ["wasted", -8], ["missed", -6], ["tired", -5], ["exhausted", -8], ["burned out", -10],
  ["sick", -8], ["ill", -6], ["injury", -8], ["injured", -8], ["pain", -5],
  ["addiction", -10], ["relapse", -10], ["anxious", -6], ["depressed", -7],
  ["overwhelmed", -7], ["blocked", -5], ["couldn't", -5], ["didn't", -4],
] as const;

export function analyzePerformance(input: PerformanceInput): PerformanceInsight {
  const range = input.range ?? 14;
  const days = lastNDays(range).map((date) => {
    const key = isoDate(date);
    const totals = dayTotals(input.logs, key);
    const active = totals.minutes > 0 || totals.cards > 0;
    const onFloor = totals.minutes >= input.minuteTarget && totals.cards >= input.cardTarget;
    return { key, ...totals, active, onFloor };
  });

  const activeDays = days.filter((day) => day.active).length;
  const onFloorDays = days.filter((day) => day.onFloor).length;
  const journalDays = new Set(input.journal.map((entry) => entry.date.slice(0, 10))).size;
  const planDays = new Set(input.dayPlans.map((plan) => plan.dayKey)).size;
  const evidenceDays = Math.max(activeDays, journalDays, planDays);
  const consistency = Math.round((activeDays / range) * 100);
  const adherence = Math.round((onFloorDays / range) * 100);
  const streak = studyStreak(input.logs);
  const taskCompletion = taskCompletionRate(input.tasks);
  const mastery = scopeMastery(input.tracker);
  const journal = scoreJournal(input.journal.slice(0, 8), input.dayPlans.slice(0, 8));
  const averageMinuteRatio = days.reduce((sum, day) => sum + Math.min(day.minutes / Math.max(input.minuteTarget, 1), 1.4), 0) / range;
  const averageCardRatio = days.reduce((sum, day) => sum + Math.min(day.cards / Math.max(input.cardTarget, 1), 1.4), 0) / range;

  const energyScore = clamp(Math.round(
    50
    + journal.score
    + Math.min(18, activeDays * 2)
    + Math.min(10, streak * 2)
    + Math.min(8, averageMinuteRatio * 6)
    - (recentUnreviewedPlans(input.dayPlans, input.activeDayKey) * 4),
  ));

  const performanceScore = clamp(Math.round(
    adherence * 0.38
    + consistency * 0.22
    + taskCompletion * 0.15
    + mastery * 0.15
    + Math.min(100, ((averageMinuteRatio + averageCardRatio) / 2) * 100) * 0.1,
  ));

  return {
    energyScore,
    energyLabel: energyScore >= 72 ? "High" : energyScore >= 45 ? "Medium" : "Low",
    performanceScore,
    performanceLabel: performanceScore >= 82 ? "Ahead" : performanceScore >= 62 ? "On track" : performanceScore >= 38 ? "Stabilizing" : "Off track",
    preliminary: evidenceDays < 5,
    activeDays,
    evidenceDays,
    consistency,
    adherence,
    journalSignal: journal.signal,
    recommendation: recommendation({ energyScore, performanceScore, activeDays, adherence, streak, journal }),
    positives: journal.positives,
    risks: journal.risks,
  };
}

function scoreJournal(entries: JournalEntry[], plans: DayPlan[]) {
  const text = [
    ...entries.flatMap((entry) => [entry.today, entry.tomorrow, entry.blockers, entry.rating, entry.energy]),
    ...plans.flatMap((plan) => [plan.intention, plan.reviewNote ?? "", plan.outcome ?? ""]),
  ].join(" ").toLowerCase();
  if (!text.trim()) {
    return { score: 0, signal: "No journal language yet.", positives: [] as string[], risks: [] as string[] };
  }

  let score = 0;
  const positives: string[] = [];
  const risks: string[] = [];
  for (const [term, weight] of POSITIVE_TERMS) {
    if (text.includes(term)) {
      score += weight;
      positives.push(term);
    }
  }
  for (const [term, weight] of NEGATIVE_TERMS) {
    if (text.includes(term)) {
      score += weight;
      risks.push(term);
    }
  }

  if (/skipp?ed\s+(the\s+)?gym/.test(text)) {
    score -= 8;
    risks.push("skipped gym");
  }
  if (/(\d+)\s+lectures?\s+(behind|late|backed up)/.test(text)) score -= 8;
  if (/\b(completed|finished)\b.*\b(\d+)\s+lectures?/.test(text)) score += 6;

  const signal = risks.length
    ? `Watch: ${dedupe(risks).slice(0, 3).join(", ")}.`
    : positives.length
      ? `Positive signal: ${dedupe(positives).slice(0, 3).join(", ")}.`
      : "Neutral journal signal.";

  return { score, signal, positives: dedupe(positives).slice(0, 5), risks: dedupe(risks).slice(0, 5) };
}

function taskCompletionRate(tasks: Task[]) {
  const live = tasks.filter((task) => !task.archived);
  if (!live.length) return 50;
  return Math.round((live.filter((task) => task.done).length / live.length) * 100);
}

function recentUnreviewedPlans(plans: DayPlan[], activeDayKey: string) {
  return plans.filter((plan) => plan.dayKey <= activeDayKey && !plan.reviewedAt).slice(0, 3).length;
}

function recommendation({
  energyScore,
  performanceScore,
  activeDays,
  adherence,
  streak,
  journal,
}: {
  energyScore: number;
  performanceScore: number;
  activeDays: number;
  adherence: number;
  streak: number;
  journal: ReturnType<typeof scoreJournal>;
}) {
  if (energyScore < 38) return "Lower the load today: one 25-minute repair block, one small task closure, then write the blocker honestly.";
  if (performanceScore < 42) return "Rebuild signal: log one study block, add one question block, and choose a single tracker item to move forward.";
  if (activeDays >= 3 && adherence >= 45) return "You have a stable base. Add 5 questions daily or 15 minutes to the next three study days.";
  if (streak >= 3) return "Consistency is forming. Keep the floor, then add one targeted review item from Suggested Moves.";
  if (journal.risks.length) return "Address the roadblock before increasing volume. Convert the risk phrase into one task with a deadline.";
  return "Start with one concrete block today, then use the Journal follow-up to decide whether tomorrow needs volume or recovery.";
}

function dedupe(values: string[]) {
  return [...new Set(values)];
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

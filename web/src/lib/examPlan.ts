// ===========================================================================
// Exam-plan engine — deterministic countdown, study-phase, adaptive practice-
// question goals, and milestone reminders (directive §20 + §21).
//
// Everything here is a PURE function over the data already persisted in
// `boardPrep` (examDate, questionTarget, weeklyHours, contentStarted,
// blueprintLogs). No schema migration is required: when fields are missing the
// engine degrades to a useful empty state. Guidance follows official exam
// structure (USMLE moved to 30-minute blocks in 2026) but the engine never
// hard-codes score-report timing — that is always user-entered.
// ===========================================================================
import type { BoardExamId, BoardPrepProfile, BoardBlueprintLog } from "./types";
import { localDateKey, daysBetweenLocalDates } from "./dailyRollover";

export type StudyPhase = "foundation" | "systems" | "dedicated" | "maintenance" | "post-exam";
export type PrepIntensity = "gentle" | "balanced" | "intense";

/** Configurable daily practice-question tiers (directive §20). Never auto-forced. */
export const QUESTION_TIERS = [20, 40, 60, 100, 150, 200] as const;
export type QuestionTier = (typeof QUESTION_TIERS)[number];

export interface ExamMeta {
  label: string;
  short: string;
  /** Soft ceiling so we never recommend an unrealistic daily load for this path. */
  maxTier: QuestionTier;
  /** Where the prep lane lives in the hash router. */
  route: string;
}

export const EXAM_META: Record<BoardExamId, ExamMeta> = {
  step1: { label: "USMLE Step 1", short: "Step 1", maxTier: 150, route: "step" },
  step2: { label: "USMLE Step 2 CK", short: "Step 2 CK", maxTier: 200, route: "step2" },
  step3: { label: "USMLE Step 3", short: "Step 3", maxTier: 150, route: "step3" },
  shelf: { label: "Shelf exam", short: "Shelf", maxTier: 100, route: "shelf" },
  mcat: { label: "MCAT", short: "MCAT", maxTier: 100, route: "mcat" },
  premed: { label: "Pre-Med study", short: "Pre-Med", maxTier: 60, route: "premed" },
};

export const PHASE_LABEL: Record<StudyPhase, string> = {
  foundation: "Foundation",
  systems: "Systems review",
  dedicated: "Dedicated",
  maintenance: "Maintenance",
  "post-exam": "Post-exam",
};

/** Days from `today` until the exam. Negative = exam already passed. null = no date set. */
export function daysUntilExam(examDate: string | undefined, today: string = localDateKey()): number | null {
  if (!examDate) return null;
  const clean = examDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  // daysBetweenLocalDates clamps at 0, so compute signed distance directly.
  const forward = daysBetweenLocalDates(today, clean);
  if (forward > 0) return forward;
  const backward = daysBetweenLocalDates(clean, today);
  return backward > 0 ? -backward : 0;
}

const CONTENT_RANK: Record<BoardPrepProfile["contentStarted"], number> = {
  "not-started": 0,
  light: 1,
  half: 2,
  most: 3,
  dedicated: 4,
};

/**
 * Resolve the current study phase from the exam date and how much content the
 * user has covered. Date wins when present; otherwise we infer from progress.
 */
export function studyPhase(prep: Pick<BoardPrepProfile, "examDate" | "contentStarted">, today: string = localDateKey()): StudyPhase {
  const days = daysUntilExam(prep.examDate, today);
  const rank = CONTENT_RANK[prep.contentStarted] ?? 0;
  if (days !== null) {
    if (days < 0) return "post-exam";
    if (prep.contentStarted === "dedicated" || days <= 42) return "dedicated";
    if (days <= 180 || rank >= 2) return "systems";
    return "foundation";
  }
  if (rank >= 4) return "maintenance";
  if (rank >= 2) return "systems";
  return "foundation";
}

function tierAt(index: number): QuestionTier {
  return QUESTION_TIERS[Math.max(0, Math.min(QUESTION_TIERS.length - 1, index))];
}

/** Snap an arbitrary number to the nearest configured tier. */
export function nearestTier(value: number): QuestionTier {
  let best: QuestionTier = QUESTION_TIERS[0];
  let bestGap = Infinity;
  for (const tier of QUESTION_TIERS) {
    const gap = Math.abs(tier - value);
    if (gap < bestGap) {
      bestGap = gap;
      best = tier;
    }
  }
  return best;
}

const PHASE_BASE_INDEX: Record<StudyPhase, number> = {
  foundation: 0, // 20
  systems: 1, // 40
  dedicated: 3, // 100
  maintenance: 0, // 20
  "post-exam": 0,
};

const INTENSITY_SHIFT: Record<PrepIntensity, number> = { gentle: -1, balanced: 0, intense: 1 };

/**
 * Recommend a daily practice-question target. Adapts to phase, the user's chosen
 * intensity, and a per-exam ceiling. Post-exam returns 0 (no grind after the
 * test). The result is always one of the configured tiers.
 */
export function recommendedDailyQuestions(
  phase: StudyPhase,
  examId: BoardExamId,
  intensity: PrepIntensity = "balanced",
): QuestionTier | 0 {
  if (phase === "post-exam") return 0;
  const base = PHASE_BASE_INDEX[phase] + INTENSITY_SHIFT[intensity];
  const tier = tierAt(base);
  const cap = EXAM_META[examId]?.maxTier ?? 200;
  return tier > cap ? cap : tier;
}

/** Practice questions answered on a given local date, summed from blueprint logs. */
export function questionsAnsweredOn(logs: BoardBlueprintLog[] | undefined, date: string): { questions: number; correct: number } {
  let questions = 0;
  let correct = 0;
  for (const log of logs ?? []) {
    if (log.date?.slice(0, 10) !== date) continue;
    questions += Math.max(0, log.questions || 0);
    correct += Math.max(0, log.correct || 0);
  }
  return { questions, correct };
}

export interface MilestoneWindow {
  id: string;
  label: string;
  /** Inclusive day-count boundaries until the exam this window covers. */
  maxDays: number;
  minDays: number;
}

// Configurable milestone reminders (directive §21). A given day lands in exactly
// one window so we never fire overlapping reminders.
export const MILESTONE_WINDOWS: MilestoneWindow[] = [
  { id: "exam-day", label: "Exam day — you've got this", maxDays: 0, minDays: 0 },
  { id: "day-before", label: "Exam tomorrow — light review, rest, logistics", maxDays: 1, minDays: 1 },
  { id: "final-week", label: "Final week — daily check-ins", maxDays: 6, minDays: 2 },
  { id: "1-week", label: "1 week out — lock the plan", maxDays: 9, minDays: 7 },
  { id: "2-week", label: "2 weeks out", maxDays: 16, minDays: 10 },
  { id: "3-week", label: "3 weeks out", maxDays: 24, minDays: 17 },
  { id: "4-week", label: "4 weeks out", maxDays: 31, minDays: 25 },
  { id: "1-month", label: "~1 month out", maxDays: 45, minDays: 32 },
  { id: "2-month", label: "~2 months out", maxDays: 75, minDays: 46 },
  { id: "3-month", label: "~3 months out", maxDays: 105, minDays: 76 },
  { id: "6-month", label: "~6 months out", maxDays: 195, minDays: 106 },
];

/** The single active milestone window for a given days-until value (or null). */
export function activeMilestone(daysUntil: number | null): MilestoneWindow | null {
  if (daysUntil === null || daysUntil < 0) return null;
  for (const window of MILESTONE_WINDOWS) {
    if (daysUntil >= window.minDays && daysUntil <= window.maxDays) return window;
  }
  return null;
}

export interface ExamCountdown {
  examId: BoardExamId;
  meta: ExamMeta;
  examDate?: string;
  daysUntil: number | null;
  phase: StudyPhase;
  phaseLabel: string;
  recommendedDaily: QuestionTier | 0;
  answeredToday: number;
  correctToday: number;
  /** 0–100 progress toward today's recommended question target. */
  questionProgress: number;
  milestone: MilestoneWindow | null;
  /** True once the exam date has passed but no post-exam reflection is recorded. */
  awaitingPostExam: boolean;
}

/**
 * Pick the most relevant exam to surface: the soonest upcoming dated exam, else
 * the most recently passed one (for post-exam reflection), else the exam matching
 * the highest content progress. Returns null when nothing is meaningfully set.
 */
export function pickFocusExam(
  boardPrep: Partial<Record<BoardExamId, BoardPrepProfile>> | undefined,
  today: string = localDateKey(),
): BoardExamId | null {
  if (!boardPrep) return null;
  const entries = (Object.entries(boardPrep) as [BoardExamId, BoardPrepProfile][]).filter(([, p]) => p);
  if (!entries.length) return null;

  const dated = entries
    .map(([id, p]) => ({ id, days: daysUntilExam(p.examDate, today) }))
    .filter((e) => e.days !== null) as { id: BoardExamId; days: number }[];

  const upcoming = dated.filter((e) => e.days >= 0).sort((a, b) => a.days - b.days);
  if (upcoming.length) return upcoming[0].id;

  const past = dated.filter((e) => e.days < 0).sort((a, b) => b.days - a.days);
  if (past.length) return past[0].id;

  // No dates anywhere — fall back to the lane with the most content covered.
  const byProgress = entries
    .map(([id, p]) => ({ id, rank: CONTENT_RANK[p.contentStarted] ?? 0 }))
    .sort((a, b) => b.rank - a.rank);
  return byProgress[0].rank > 0 ? byProgress[0].id : null;
}

export function buildExamCountdown(
  examId: BoardExamId,
  prep: BoardPrepProfile,
  intensity: PrepIntensity = "balanced",
  today: string = localDateKey(),
): ExamCountdown {
  const daysUntil = daysUntilExam(prep.examDate, today);
  const phase = studyPhase(prep, today);
  const recommendedDaily = recommendedDailyQuestions(phase, examId, intensity);
  const { questions, correct } = questionsAnsweredOn(prep.blueprintLogs, today);
  const questionProgress = recommendedDaily > 0 ? Math.min(100, Math.round((questions / recommendedDaily) * 100)) : 0;
  return {
    examId,
    meta: EXAM_META[examId],
    examDate: prep.examDate,
    daysUntil,
    phase,
    phaseLabel: PHASE_LABEL[phase],
    recommendedDaily,
    answeredToday: questions,
    correctToday: correct,
    questionProgress,
    milestone: activeMilestone(daysUntil),
    awaitingPostExam: daysUntil !== null && daysUntil < 0,
  };
}

/** One short, deterministic, non-punitive line of guidance for the countdown card. */
export function countdownHeadline(c: ExamCountdown): string {
  if (c.daysUntil === null) return `Set an ${c.meta.short} date to unlock countdown, phase, and a daily question target.`;
  if (c.daysUntil < 0) return `${c.meta.short} is behind you — log how it went so Reports and the Journal can learn from it.`;
  if (c.daysUntil === 0) return `${c.meta.short} is today. Trust the work. Light review only.`;
  const dayWord = c.daysUntil === 1 ? "day" : "days";
  if (c.recommendedDaily === 0) return `${c.daysUntil} ${dayWord} to ${c.meta.short}.`;
  return `${c.daysUntil} ${dayWord} to ${c.meta.short} · ${c.phaseLabel} phase · aim for ~${c.recommendedDaily} questions/day.`;
}

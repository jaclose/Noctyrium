// ===========================================================================
// Command Brief — the engine behind the primary dashboard section. Answers:
// "Given my deadlines, energy, unfinished work, recent performance, and
// available time, what should I do next?" with ONE mode, ONE next best move,
// ONE fallback, and a factual delta since yesterday.
//
// Everything is transparent rules over persisted data (pure + testable). The
// AI layer (lib/ai) may later PROPOSE a brief through the same schema, but a
// proposal never mutates the plan without user review.
// ===========================================================================
import type { Course, NoctyriumState, Task, TrackerItem } from "./types";
import type { StudySession, SessionLink } from "./sessions";
import type { DailyCloseout } from "./closeout";
import { suggestMoves, targetPassesForItem, isQuestionKind } from "./tracker";
import { dayTotals, isoDate } from "./scoring";
import { pickFocusExam, daysUntilExam, EXAM_META } from "./examPlan";
import { previousCloseout } from "./closeout";
import type { QuestionRecord } from "./questions";
import { dueQuestions, questionMappingStatus, weakTopics } from "./questions";
import type { AnkiCard } from "./ankiCards";
import { dueCards } from "./ankiCards";
import type { QuestionSet, SourceDocument } from "./library";
import { EDUCATION_TRACKS } from "./tracks";
import { normalizeTrackerPath, trackerItemKey } from "./pathUtils";

export type BriefMode = "maintain" | "catch-up" | "recovery" | "sprint" | "exam-week";

export const MODE_LABEL: Record<BriefMode, string> = {
  maintain: "Maintain",
  "catch-up": "Catch-Up",
  recovery: "Recovery",
  sprint: "Sprint",
  "exam-week": "Exam Week",
};

export interface NextBestMove {
  title: string;
  link: SessionLink;
  estimatedMinutes: number;
  resources: string[];
  reason: string;
  expectedOutcome: string;
  /** Inspectable, deterministic evidence. The weights sum to score. */
  score?: number;
  contributions?: BriefRecommendationContribution[];
  source: "command-brief";
}

export interface BriefRecommendationContribution {
  id: string;
  label: string;
  weight: number;
  sourceLabel: string;
}

export interface RankedBriefCandidate extends NextBestMove {
  candidateId: string;
  score: number;
  contributions: BriefRecommendationContribution[];
}

export interface MinimumViableWin {
  title: string;
  estimatedMinutes: number;
  reason: string;
  link: SessionLink;
}

export interface BriefChange {
  label: string;
  value: string;
  tone: "good" | "neutral" | "watch";
}

export interface BriefSignals {
  daysSinceLastStudy: number;
  missedDaysLast7: number;
  overdueTasks: number;
  carriedTasks: number;
  openTasks: number;
  backlogScore: number; // 0..100 composite
  examDaysAway: number | null;
  examLabel?: string;
  reviewFlagged: number;
  dueQuestionCount: number;
  dueCardCount: number;
  yesterdayMinutes: number;
  todayMinutes: number;
}

export interface CommandBrief {
  mode: BriefMode;
  modeReason: string;
  move: NextBestMove;
  minimumViableWin: MinimumViableWin;
  changes: BriefChange[];
  signals: BriefSignals;
  recoverySuggested: boolean;
  generatedFor: string; // dayKey
  source: "rules" | "ai-reviewed";
}

// --- signal extraction ------------------------------------------------------

export interface BriefStateSlice {
  tasks: Task[];
  tracker: TrackerItem[];
  logs: NoctyriumState["logs"];
  boardPrep: NoctyriumState["boardPrep"];
  activeDayKey: string;
  sessions: StudySession[];
  closeouts: DailyCloseout[];
  questions: QuestionRecord[];
  ankiCards: AnkiCard[];
}

export interface BriefEvidenceState {
  courses: Course[];
  tracker: TrackerItem[];
  logs: NoctyriumState["logs"];
  tasks: Task[];
  questions: QuestionRecord[];
  documents: SourceDocument[];
  questionSets: QuestionSet[];
}

export interface BriefEvidenceCriterion {
  ready: boolean;
  count: number;
  required: number;
  label: string;
  explanation: string;
}

export interface CommandBriefEvidenceAssessment {
  ready: boolean;
  workload: BriefEvidenceCriterion;
  activeItems: BriefEvidenceCriterion;
  activity: BriefEvidenceCriterion;
}

type EvidenceOrigin = "seed" | "template" | "user" | "import";

const STARTER_TASK_TITLES = new Set([
  "create today's standup",
  "add your real lecture/DLA/PQ list",
  "save progress from settings",
].map(normalizeEvidenceText));

const TEMPLATE_COURSE_FINGERPRINTS = new Set(
  EDUCATION_TRACKS.flatMap((track) => track.terms.flatMap((term) => term.courses.map(courseFingerprint))),
);

const TEMPLATE_TRACKER_BASELINES = new Map<string, { passes: number; ankiPasses: number }>();
for (const row of EDUCATION_TRACKS.flatMap((track) => track.trackerRows)) {
  TEMPLATE_TRACKER_BASELINES.set(
    trackerFingerprint(row),
    { passes: 0, ankiPasses: 0 },
  );
}
// The original SGU seed includes two additional illustrative rows with one
// pass already applied. Their shipped progress is presentation, not evidence.
TEMPLATE_TRACKER_BASELINES.set(
  trackerFingerprint({
    path: "Term 2/BPM 501/NB3/Lectures",
    label: "Example lecture: Sleep and biological rhythms",
    kind: "Lecture",
  }),
  { passes: 1, ankiPasses: 1 },
);
TEMPLATE_TRACKER_BASELINES.set(
  trackerFingerprint({
    path: "Term 2/BPM 501/NB3/PQs",
    label: "Example PQ set: Psych foundations",
    kind: "PQ",
  }),
  { passes: 1, ankiPasses: 0 },
);

/**
 * Decide whether the brief has enough user evidence to make a recommendation.
 * This gate is deliberately conservative: seed/template structure can teach
 * the UI, but it cannot diagnose a workload until the user adds or advances
 * real records. It is pure so every surface can apply the same boundary.
 */
export function assessCommandBriefEvidence(state: BriefEvidenceState): CommandBriefEvidenceAssessment {
  const realCourses = state.courses.filter(isRealWorkloadCourse).length;
  const importedSourceKeys = new Set<string>();
  for (const document of state.documents) importedSourceKeys.add(`document:${document.id}`);
  for (const set of state.questionSets) importedSourceKeys.add(`set:${set.id}`);
  for (const question of state.questions) {
    const sourceKey = question.sourceDocumentId
      ? `document:${question.sourceDocumentId}`
      : question.setId
        ? `set:${question.setId}`
        : question.sourceFile?.name
          ? `file:${normalizeEvidenceText(question.sourceFile.name)}`
          : ["pasted", "screenshot", "image", "pdf", "imported"].includes(question.source)
            ? `question-source:${question.id}`
            : null;
    if (sourceKey) importedSourceKeys.add(sourceKey);
  }
  const workloadCount = realCourses + importedSourceKeys.size;

  const activeItemCount = state.tracker.filter(isMeaningfulActiveTrackerItem).length;
  const activityCount = state.logs.filter((log) => (
    Math.max(0, Number(log.minutes) || 0) > 0
    || Math.max(0, Number(log.cards) || 0) > 0
    || Math.max(0, Number(log.quantity) || 0) > 0
  )).length;
  const realTaskCount = state.tasks.filter((task) => (
    task.title.trim().length > 0 && !STARTER_TASK_TITLES.has(normalizeEvidenceText(task.title))
  )).length;
  const practicedQuestionCount = state.questions.filter((question) => (
    question.attempts.length > 0
    || Boolean(question.attemptedAt)
    || Boolean(question.userAnswerKey)
  )).length;
  const signalCount = activityCount + realTaskCount + practicedQuestionCount;

  const workload: BriefEvidenceCriterion = {
    ready: workloadCount >= 1,
    count: workloadCount,
    required: 1,
    label: "Real workload",
    explanation: "Add a course or import a source so AXOM knows what the work belongs to.",
  };
  const activeItems: BriefEvidenceCriterion = {
    ready: activeItemCount >= 2,
    count: activeItemCount,
    required: 2,
    label: "Meaningful active items",
    explanation: "Track at least two real items; untouched examples do not count.",
  };
  const activity: BriefEvidenceCriterion = {
    ready: signalCount >= 1,
    count: signalCount,
    required: 1,
    label: "Current signal",
    explanation: "Log activity, add a real task, or practise a question.",
  };
  return {
    ready: workload.ready && activeItems.ready && activity.ready,
    workload,
    activeItems,
    activity,
  };
}

function recordOrigin(value: unknown): EvidenceOrigin | undefined {
  if (!value || typeof value !== "object") return undefined;
  const origin = (value as { origin?: unknown }).origin;
  return origin === "seed" || origin === "template" || origin === "user" || origin === "import"
    ? origin
    : undefined;
}

function isRealWorkloadCourse(course: Course): boolean {
  const origin = recordOrigin(course);
  if (origin === "user" || origin === "import") return true;
  return !TEMPLATE_COURSE_FINGERPRINTS.has(courseFingerprint(course));
}

function isMeaningfulActiveTrackerItem(item: TrackerItem): boolean {
  if (item.passes >= targetPassesForItem(item)) return false;
  const origin = recordOrigin(item);
  if (origin === "user" || origin === "import") return true;
  const baseline = TEMPLATE_TRACKER_BASELINES.get(trackerFingerprint(item));
  if (baseline) return item.passes > baseline.passes || item.ankiPasses > baseline.ankiPasses;
  if (/^example(?:[:\s]|$)/i.test(item.label.trim())) return item.passes > 0 || item.ankiPasses > 0;
  return true;
}

function isActionableTask(task: Task): boolean {
  if (task.done || task.archived || !task.title.trim()) return false;
  const origin = recordOrigin(task);
  if (origin === "seed" || origin === "template") return false;
  return !STARTER_TASK_TITLES.has(normalizeEvidenceText(task.title));
}

function trustedDueQuestions(questions: QuestionRecord[], now: Date): QuestionRecord[] {
  return dueQuestions(questions, now).filter((question) => questionMappingStatus(question) === "ready");
}

function courseFingerprint(course: Pick<Course, "code" | "name" | "modules"> | { code: string; name: string; modules: string[] }): string {
  const modules = course.modules.map((module) => (
    typeof module === "string" ? module : module.name
  ));
  return [course.code, course.name, ...modules].map(normalizeEvidenceText).join("\u001f");
}

function trackerFingerprint(item: Pick<TrackerItem, "path" | "label" | "kind">): string {
  return `${trackerItemKey(normalizeTrackerPath(item.path), item.label)}::${item.kind}`;
}

function normalizeEvidenceText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function previousDayKey(key: string, back = 1): string {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() - back);
  return isoDate(d);
}

export function deriveSignals(s: BriefStateSlice, now: Date = new Date()): BriefSignals {
  const today = s.activeDayKey;
  const yesterday = previousDayKey(today);

  // Study days: any day with academic minutes or cards logged.
  const activeDays = new Set(
    s.logs.filter((l) => l.academic !== false && (l.minutes > 0 || l.cards > 0)).map((l) => l.dayKey),
  );
  let daysSinceLastStudy = 0;
  let missedDaysLast7 = 0;
  // A workspace with no study history has no evidence of missed study days.
  // Treating absence of history as 30 inactive days made first-use workspaces
  // enter Recovery before the user had logged anything.
  const priorActiveDays = [...activeDays].filter((key) => key < today).sort();
  if (!activeDays.has(today) && priorActiveDays.length > 0) {
    for (let back = 1; back <= 30; back++) {
      if (activeDays.has(previousDayKey(today, back))) break;
      daysSinceLastStudy = back;
    }
  }
  if (priorActiveDays.length > 0) {
    const trackingFloor = priorActiveDays[0];
    for (let back = 1; back <= 7; back++) {
      const key = previousDayKey(today, back);
      if (key >= trackingFloor && !activeDays.has(key)) missedDaysLast7++;
    }
  }

  const open = s.tasks.filter(isActionableTask);
  const overdueTasks = open.filter((t) => t.due && t.due < today).length;
  const carriedTasks = open.filter((t) => (t.carryoverFrom?.length ?? 0) > 0).length;

  const activeTracker = s.tracker.filter(isMeaningfulActiveTrackerItem);
  const reviewFlagged = activeTracker.filter((t) => t.yield === "review").length;
  const behindTracker = activeTracker.length;

  const examId = pickFocusExam(s.boardPrep, today);
  const examPrep = examId ? s.boardPrep?.[examId] : undefined;
  const examDaysAway = examPrep ? daysUntilExam(examPrep.examDate, today) : null;

  const backlogScore = Math.min(100, Math.round(
    overdueTasks * 12 + carriedTasks * 8 + reviewFlagged * 6 + Math.min(behindTracker, 40) * 0.5 + missedDaysLast7 * 6,
  ));

  return {
    daysSinceLastStudy,
    missedDaysLast7,
    overdueTasks,
    carriedTasks,
    openTasks: open.length,
    backlogScore,
    examDaysAway,
    examLabel: examId ? EXAM_META[examId].label : undefined,
    reviewFlagged,
    dueQuestionCount: trustedDueQuestions(s.questions, now).length,
    dueCardCount: dueCards(s.ankiCards, now).length,
    yesterdayMinutes: dayTotals(s.logs, yesterday).minutes,
    todayMinutes: dayTotals(s.logs, today).minutes,
  };
}

// --- mode -------------------------------------------------------------------

export function deriveMode(
  signals: BriefSignals,
  closeoutPreference?: "auto" | BriefMode,
): { mode: BriefMode; reason: string } {
  // A closeout choice for "tomorrow" wins — the user decided last night.
  if (closeoutPreference && closeoutPreference !== "auto") {
    return { mode: closeoutPreference, reason: "You chose this mode in yesterday's closeout. Change it any time." };
  }

  const { examDaysAway, examLabel, backlogScore, missedDaysLast7, daysSinceLastStudy, overdueTasks } = signals;
  const exam = examLabel ?? "your exam";

  if (examDaysAway !== null && examDaysAway >= 0 && examDaysAway <= 3) {
    return {
      mode: "exam-week",
      reason: `${exam} is ${examDaysAway === 0 ? "today" : `${examDaysAway} day${examDaysAway === 1 ? "" : "s"} away`}. Focus narrows to highest-yield review and question work — nothing new.`,
    };
  }
  if (examDaysAway !== null && examDaysAway > 3 && examDaysAway <= 7 && backlogScore >= 30) {
    return {
      mode: "sprint",
      reason: `${exam} is ${examDaysAway} days away and unfinished work needs a narrower plan. Short, prioritized pushes beat completeness now.`,
    };
  }
  if (daysSinceLastStudy >= 3 || (missedDaysLast7 >= 3 && backlogScore >= 40)) {
    return {
      mode: "recovery",
      reason: daysSinceLastStudy >= 3
        ? `No study logged for ${daysSinceLastStudy} days. That happens — the plan below restarts small instead of trying to repay everything at once.`
        : `${missedDaysLast7} of the last 7 days had no study and work has stacked up. Restart small; consistency first, volume later.`,
    };
  }
  if (backlogScore >= 30 || overdueTasks >= 2) {
    return {
      mode: "catch-up",
      reason: overdueTasks > 0
        ? `${overdueTasks} overdue task${overdueTasks === 1 ? " needs" : "s need"} attention. Today prioritizes the oldest high-value work without trying to clear everything at once.`
        : "Several active review items need attention. Today prioritizes the strongest supported repair without trying to clear everything at once.",
    };
  }
  return {
    mode: "maintain",
    reason: "Workload is stable and nothing major is overdue. Keep the rhythm: steady passes, questions, and reviews.",
  };
}

// --- next best move ---------------------------------------------------------

const MODE_MINUTES: Record<BriefMode, number> = {
  maintain: 45,
  "catch-up": 50,
  recovery: 25,
  sprint: 40,
  "exam-week": 45,
};

export function deriveNextBestMove(s: BriefStateSlice, mode: BriefMode, _signals: BriefSignals, now: Date = new Date()): NextBestMove {
  const [top] = rankCommandBriefCandidates(s, mode, now);
  if (top) return top;

  return {
    title: "Set up your course tracker",
    link: { kind: "free", label: "Course Tracker setup" },
    estimatedMinutes: 15,
    resources: ["Course Tracker → bulk import"],
    reason: "There is no tracked work yet, so the brief has nothing to rank. Fifteen minutes of setup makes every future brief specific.",
    expectedOutcome: "Tomorrow's brief names a real lecture, not a setup step.",
    source: "command-brief",
  };
}

function evidence(id: string, label: string, weight: number, sourceLabel: string): BriefRecommendationContribution {
  return { id, label, weight, sourceLabel };
}

function candidateScore(contributions: BriefRecommendationContribution[]): number {
  return contributions.reduce((total, item) => total + item.weight, 0);
}

/** Rank only actionable, user-backed work. Seed/template rows never enter this list. */
export function rankCommandBriefCandidates(
  s: BriefStateSlice,
  mode: BriefMode,
  now: Date = new Date(),
): RankedBriefCandidate[] {
  const minutes = MODE_MINUTES[mode];
  const closeout = previousCloseout(s.closeouts, s.activeDayKey);
  const commitment = normalizeEvidenceText(closeout?.tomorrowFirstTask ?? "");
  const examId = pickFocusExam(s.boardPrep, s.activeDayKey);
  const examPrep = examId ? s.boardPrep?.[examId] : undefined;
  const examDays = examPrep ? daysUntilExam(examPrep.examDate, s.activeDayKey) : null;
  const examNear = examDays !== null && examDays >= 0 && examDays <= 7;
  const latestLinked = [...s.sessions]
    .filter((session) => session.link?.id || session.link?.kind === "question-set")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.link;
  const candidates: RankedBriefCandidate[] = [];

  for (const task of s.tasks.filter(isActionableTask)) {
    const contributions = [evidence("open-task", "Open task", 20, "Tasks")];
    if (task.due && task.due < s.activeDayKey) {
      const daysLate = Math.max(1, Math.round((Date.parse(`${s.activeDayKey}T12:00:00`) - Date.parse(`${task.due}T12:00:00`)) / 86_400_000));
      contributions.push(evidence("overdue", `${daysLate} day${daysLate === 1 ? "" : "s"} overdue`, 80 + Math.min(daysLate, 14), "Task due date"));
    } else if (task.due === s.activeDayKey) {
      contributions.push(evidence("due-today", "Due today", 50, "Task due date"));
    } else if (task.due && task.due <= previousDayKey(s.activeDayKey, -2)) {
      contributions.push(evidence("due-soon", "Due within two days", 30, "Task due date"));
    }
    if ((task.carryoverFrom?.length ?? 0) > 0) contributions.push(evidence("carried", "Carried forward", 15, "Task history"));
    if (commitment && normalizeEvidenceText(task.title) === commitment) contributions.push(evidence("commitment", "Chosen as the first task", 100, "Yesterday’s closeout"));
    if (latestLinked?.kind === "task" && latestLinked.id === task.id) contributions.push(evidence("continuity", "Recently in progress", 18, "Recent session"));
    const score = candidateScore(contributions);
    candidates.push({
      candidateId: `task:${task.id}`,
      title: task.title,
      link: { kind: "task", id: task.id, label: task.title, context: task.scope },
      estimatedMinutes: mode === "recovery" ? 25 : minutes,
      resources: [],
      reason: contributions.slice().sort((a, b) => b.weight - a.weight)[0].label,
      expectedOutcome: "Complete one committed block and leave a clear task status.",
      score,
      contributions,
      source: "command-brief",
    });
  }

  for (const item of s.tracker.filter(isMeaningfulActiveTrackerItem)) {
    const [suggestion] = suggestMoves([item], 1);
    const contributions = [evidence("active-item", "Active study item", 15, "Course Tracker")];
    if (item.yield === "review") contributions.push(evidence("review-flag", "Marked for review", 70, "Course Tracker"));
    if (item.yield === "high") contributions.push(evidence("high-yield", "Marked high yield", item.passes === 0 ? 55 : 35, "Course Tracker"));
    if (item.passes === 0) contributions.push(evidence("untouched", "Not started", 25, "Course Tracker"));
    else if (item.passes === 1) contributions.push(evidence("fragile", "One pass so far", 22, "Course Tracker"));
    if (isQuestionKind(item.kind)) contributions.push(evidence("question-practice", "Practice work", 12, "Course Tracker"));
    if (examNear && (item.yield === "review" || item.yield === "high" || isQuestionKind(item.kind))) {
      contributions.push(evidence("exam-proximity", `${EXAM_META[examId!].label} is within seven days`, 18, "Exam plan"));
    }
    if (commitment && normalizeEvidenceText(item.label) === commitment) contributions.push(evidence("commitment", "Chosen as the first task", 100, "Yesterday’s closeout"));
    if (latestLinked?.kind === "tracker" && latestLinked.id === item.id) contributions.push(evidence("continuity", "Recently in progress", 18, "Recent session"));
    const score = candidateScore(contributions);
    candidates.push({
      candidateId: `tracker:${item.id}`,
      title: suggestion?.title ?? item.label,
      link: { kind: "tracker", id: item.id, label: item.label, context: item.path.split("/").slice(0, 3).join(" · ") },
      estimatedMinutes: mode === "recovery" ? 25 : minutes,
      resources: isQuestionKind(item.kind) ? ["Linked question set", "Error log"] : ["Lecture notes / slides", "Anki Lab for anchoring"],
      reason: suggestion?.reason ?? "This active item has the strongest current evidence.",
      expectedOutcome: item.passes === 0 ? "Complete a first pass so this is no longer unknown." : "Move one pass closer to stable recall.",
      score,
      contributions,
      source: "command-brief",
    });
  }

  const due = trustedDueQuestions(s.questions, now);
  if (due.length) {
    const contributions = [evidence("due-review", `${due.length} trusted review${due.length === 1 ? "" : "s"} due`, 65 + Math.min(due.length, 20), "Question Bank")];
    if (examNear) contributions.push(evidence("exam-proximity", `${EXAM_META[examId!].label} is within seven days`, 20, "Exam plan"));
    if (latestLinked?.kind === "question-set") contributions.push(evidence("continuity", "Recently practised", 12, "Recent session"));
    const score = candidateScore(contributions);
    candidates.push({
      candidateId: "questions:due-review",
      title: `Rework ${Math.min(due.length, 20)} due practice question${due.length === 1 ? "" : "s"}`,
      link: { kind: "question-set", label: "Question Workspace", context: "Due review queue" },
      estimatedMinutes: mode === "recovery" ? 20 : minutes,
      resources: ["Question Workspace → Review mode"],
      reason: `${due.length} trusted question${due.length === 1 ? " is" : "s are"} due for review.`,
      expectedOutcome: "Revisit supported answer mappings and repair repeat errors.",
      score,
      contributions,
      source: "command-brief",
    });
  }

  return candidates.sort((a, b) => b.score - a.score || a.candidateId.localeCompare(b.candidateId));
}

// --- minimum viable win -----------------------------------------------------

export function deriveMinimumViableWin(s: BriefStateSlice, signals: BriefSignals): MinimumViableWin {
  if (signals.dueCardCount > 0) {
    const n = Math.min(signals.dueCardCount, 8);
    return {
      title: `Review ${n} due card${n === 1 ? "" : "s"}`,
      estimatedMinutes: 5,
      reason: "Five minutes of due reviews keeps retention compounding even on a zero day.",
      link: { kind: "card-review", label: "Anki Lab review queue" },
    };
  }
  if (signals.dueQuestionCount > 0) {
    const n = Math.min(signals.dueQuestionCount, 5);
    return {
      title: `Answer ${n} due question${n === 1 ? "" : "s"}`,
      estimatedMinutes: 10,
      reason: "A handful of questions preserves the review loop without demanding a full session.",
      link: { kind: "question-set", label: "Question Workspace", context: "Review mode" },
    };
  }
  const fragile = s.tracker.find((t) => isMeaningfulActiveTrackerItem(t) && t.passes === 1 && t.yield !== "low");
  if (fragile) {
    return {
      title: `15-minute skim: ${fragile.label}`,
      estimatedMinutes: 15,
      reason: "One short focused block keeps continuity. It counts.",
      link: { kind: "tracker", id: fragile.id, label: fragile.label },
    };
  }
  return {
    title: "Write one sentence: what's blocking you today?",
    estimatedMinutes: 2,
    reason: "Naming the blocker is the smallest unit of progress — tomorrow's brief will use it.",
    link: { kind: "free", label: "Daily closeout note" },
  };
}

// --- what changed since yesterday --------------------------------------------

export function deriveChanges(s: BriefStateSlice, signals: BriefSignals): BriefChange[] {
  const changes: BriefChange[] = [];
  const yesterday = previousDayKey(s.activeDayKey);
  const y = dayTotals(s.logs, yesterday);

  changes.push(
    y.minutes > 0
      ? { label: "Yesterday", value: `${y.minutes} min logged${y.cards ? ` · ${y.cards} cards` : ""}`, tone: "good" }
      : { label: "Yesterday", value: "No study logged", tone: "watch" },
  );

  const completedYesterday = s.tasks.filter((t) => t.done && t.completedAt?.slice(0, 10) === yesterday).length;
  if (completedYesterday > 0) {
    changes.push({ label: "Completed", value: `${completedYesterday} task${completedYesterday === 1 ? "" : "s"} closed yesterday`, tone: "good" });
  }
  if (signals.overdueTasks > 0) {
    changes.push({ label: "Backlog", value: `${signals.overdueTasks} task${signals.overdueTasks === 1 ? "" : "s"} overdue`, tone: "watch" });
  }

  const attemptedYesterday = s.questions.filter((q) => q.attemptedAt?.slice(0, 10) === yesterday);
  if (attemptedYesterday.length >= 3) {
    const correct = attemptedYesterday.filter((q) => q.status === "correct").length;
    const pct = Math.round((correct / attemptedYesterday.length) * 100);
    changes.push({
      label: "Questions",
      value: `${pct}% correct on ${attemptedYesterday.length} attempted`,
      tone: pct >= 70 ? "good" : "watch",
    });
  }

  const weak = weakTopics(s.questions, 1)[0];
  if (weak) {
    changes.push({ label: "Weak topic", value: `${weak.topic} (${weak.incorrect}/${weak.attempts} missed)`, tone: "watch" });
  }

  const closeout = previousCloseout(s.closeouts, s.activeDayKey);
  if (closeout?.tomorrowFirstTask) {
    changes.push({ label: "You planned", value: `Start with: ${closeout.tomorrowFirstTask}`, tone: "neutral" });
  }
  if (closeout?.energyVsMorning) {
    const map = { lower: "watch", same: "neutral", higher: "good" } as const;
    changes.push({ label: "Energy", value: `Ended yesterday ${closeout.energyVsMorning} than morning`, tone: map[closeout.energyVsMorning] });
  }

  if (signals.dueCardCount + signals.dueQuestionCount > 0) {
    changes.push({
      label: "Due today",
      value: [
        signals.dueCardCount ? `${signals.dueCardCount} cards` : "",
        signals.dueQuestionCount ? `${signals.dueQuestionCount} questions` : "",
      ].filter(Boolean).join(" · "),
      tone: "neutral",
    });
  }
  return changes.slice(0, 6);
}

// --- assembly ----------------------------------------------------------------

export function buildCommandBrief(s: BriefStateSlice, now: Date = new Date()): CommandBrief {
  const signals = deriveSignals(s, now);
  const closeout = previousCloseout(s.closeouts, s.activeDayKey);
  const { mode, reason } = deriveMode(signals, closeout?.tomorrowMode);
  const move = deriveNextBestMove(s, mode, signals, now);

  return {
    mode,
    modeReason: reason,
    move,
    minimumViableWin: deriveMinimumViableWin(s, signals),
    changes: deriveChanges(s, signals),
    signals,
    recoverySuggested: mode === "recovery",
    generatedFor: s.activeDayKey,
    source: "rules",
  };
}

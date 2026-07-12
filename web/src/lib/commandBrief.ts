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
import type { NoctyriumState, Task, TrackerItem } from "./types";
import type { StudySession, SessionLink } from "./sessions";
import type { DailyCloseout } from "./closeout";
import { suggestMoves, targetPassesForItem, isQuestionKind } from "./tracker";
import { dayTotals, isoDate } from "./scoring";
import { pickFocusExam, daysUntilExam, EXAM_META } from "./examPlan";
import { previousCloseout } from "./closeout";
import type { QuestionRecord } from "./questions";
import { dueQuestions, weakTopics } from "./questions";
import type { AnkiCard } from "./ankiCards";
import { dueCards } from "./ankiCards";

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
  source: "command-brief";
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
  if (activeDays.size > 0) {
    for (let back = 1; back <= 30; back++) {
      if (activeDays.has(previousDayKey(today, back))) break;
      daysSinceLastStudy = back;
    }
    for (let back = 1; back <= 7; back++) {
      if (!activeDays.has(previousDayKey(today, back))) missedDaysLast7++;
    }
  }

  const open = s.tasks.filter((t) => !t.done && !t.archived);
  const overdueTasks = open.filter((t) => t.due && t.due < today).length;
  const carriedTasks = open.filter((t) => (t.carryoverFrom?.length ?? 0) > 0).length;

  const reviewFlagged = s.tracker.filter((t) => t.yield === "review" && t.passes < targetPassesForItem(t)).length;
  const behindTracker = s.tracker.filter((t) => t.passes < targetPassesForItem(t)).length;

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
    dueQuestionCount: dueQuestions(s.questions, now).length,
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
      reason: `${exam} is ${examDaysAway} days away and there is unfinished work behind you (backlog ${backlogScore}/100). Short, prioritized pushes beat completeness now.`,
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
      reason: `You're behind (${overdueTasks} overdue task${overdueTasks === 1 ? "" : "s"}, backlog ${backlogScore}/100) but there is adequate time. Today prioritizes clearing the oldest high-value work.`,
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

export function deriveNextBestMove(s: BriefStateSlice, mode: BriefMode, signals: BriefSignals): NextBestMove {
  const minutes = MODE_MINUTES[mode];

  // Exam week / sprint with due questions: question work outranks new content.
  if ((mode === "exam-week" || mode === "sprint") && signals.dueQuestionCount >= 5) {
    return {
      title: `Rework ${Math.min(signals.dueQuestionCount, 20)} due practice questions`,
      link: { kind: "question-set", label: "Question Workspace", context: "Due review queue" },
      estimatedMinutes: minutes,
      resources: ["Question Workspace → Review mode"],
      reason: `${signals.dueQuestionCount} questions are due for review and ${signals.examLabel ?? "your exam"} is close. Reworking misses is the highest-yield hour available.`,
      expectedOutcome: "Repeat-error topics get one more repetition before test day.",
      source: "command-brief",
    };
  }

  // Recovery: restart with the single most fragile flagged item, kept short.
  // Otherwise: the tracker suggestion engine already ranks review > high-yield
  // untouched > fragile items; reuse it rather than inventing a second ranking.
  const [top] = suggestMoves(s.tracker, 1);
  if (top?.itemId) {
    const item = s.tracker.find((t) => t.id === top.itemId);
    const context = item ? item.path.split("/").slice(0, 3).join(" · ") : undefined;
    return {
      title: top.title,
      link: { kind: "tracker", id: top.itemId, label: item?.label ?? top.title, context },
      estimatedMinutes: mode === "recovery" ? 25 : minutes,
      resources: item && isQuestionKind(item.kind) ? ["Linked question set", "Error log"] : ["Lecture notes / slides", "Anki Lab for anchoring"],
      reason: top.reason,
      expectedOutcome: item && item.passes === 0
        ? "First pass done — this item stops being an unknown."
        : "One pass closer to mature; tomorrow's brief re-ranks around it.",
      source: "command-brief",
    };
  }

  // No tracker content at all: point at the oldest actionable task, or setup.
  const oldestOpen = s.tasks
    .filter((t) => !t.done && !t.archived)
    .sort((a, b) => (a.due ?? a.created).localeCompare(b.due ?? b.created))[0];
  if (oldestOpen) {
    return {
      title: oldestOpen.title,
      link: { kind: "task", id: oldestOpen.id, label: oldestOpen.title, context: oldestOpen.scope },
      estimatedMinutes: minutes,
      resources: [],
      reason: oldestOpen.due && oldestOpen.due < s.activeDayKey
        ? "This is your oldest overdue task — clearing it unblocks the rest of the list."
        : "This is your oldest open task; nothing in the tracker outranks it right now.",
      expectedOutcome: "One committed block of real work, logged.",
      source: "command-brief",
    };
  }

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
  const fragile = s.tracker.find((t) => t.passes === 1 && t.yield !== "low");
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
  // The closeout's named first task, if actionable, wins the top slot: the user
  // committed to it last night, and honoring that beats re-deciding.
  let move = deriveNextBestMove(s, mode, signals);
  if (closeout?.tomorrowFirstTask?.trim()) {
    const planned = closeout.tomorrowFirstTask.trim();
    const matchedTask = s.tasks.find((t) => !t.done && !t.archived && t.title.toLowerCase() === planned.toLowerCase());
    const matchedTracker = s.tracker.find((t) => t.label.toLowerCase() === planned.toLowerCase());
    move = {
      title: matchedTracker ? move.title.includes(matchedTracker.label) ? move.title : planned : planned,
      link: matchedTask
        ? { kind: "task", id: matchedTask.id, label: matchedTask.title, context: matchedTask.scope }
        : matchedTracker
          ? { kind: "tracker", id: matchedTracker.id, label: matchedTracker.label }
          : { kind: "free", label: planned },
      estimatedMinutes: move.estimatedMinutes,
      resources: move.resources,
      reason: "You named this as tomorrow's first task in yesterday's closeout.",
      expectedOutcome: "The day starts on the thing you committed to — no re-deciding.",
      source: "command-brief",
    };
  }

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

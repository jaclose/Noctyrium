import { describe, expect, it } from "vitest";
import { makeDailyRequirement } from "./dailySuccess";
import { selectDayAtAGlance, type DayAtAGlanceState } from "./dayAtAGlance";
import type { QuestionRecord } from "./questions";
import { makeSeed } from "./seed";
import type { StudySession } from "./sessions";
import type { Habit, HabitEntry, StudyLog, Task } from "./types";

const DAY = "2026-07-13";
const NEXT_DAY = "2026-07-14";

describe("selectDayAtAGlance", () => {
  it("assembles one inspectable day without double-counting session time", () => {
    const minuteRequirement = makeDailyRequirement({
      id: "target-focus",
      label: "Focused study",
      source: { kind: "study-minutes" },
      target: 60,
      unit: "minutes",
      trackingStartsAt: DAY,
      createdAt: `${DAY}T06:00:00.000Z`,
      updatedAt: `${DAY}T06:00:00.000Z`,
    }, DAY);
    const cardRequirement = makeDailyRequirement({
      id: "target-cards",
      label: "Card review",
      source: { kind: "cards-reviewed" },
      target: 20,
      unit: "cards",
      trackingStartsAt: DAY,
      createdAt: `${DAY}T06:00:00.000Z`,
      updatedAt: `${DAY}T06:00:00.000Z`,
    }, DAY);
    const habits: Habit[] = [
      habit({ id: "habit-done", name: "Morning review" }),
      habit({ id: "habit-open", name: "Evening walk" }),
      habit({ id: "habit-weekly", name: "Weekly planning", type: "weekly", weeklyTarget: 2 }),
    ];
    const habitEntries: HabitEntry[] = [{
      id: "habit-entry-done",
      habitId: "habit-done",
      date: DAY,
      status: "done",
      createdAt: `${DAY}T07:00:00.000Z`,
    }];
    const logs: StudyLog[] = [
      log({ id: "log-pomodoro", type: "Pomodoro", minutes: 25, note: "Completed focus sprint" }),
      log({ id: "log-cards", type: "Anki", minutes: 15, cards: 20 }),
      log({
        id: "log-questions",
        type: "Question practice",
        minutes: 0,
        quantity: 10,
        quantityKind: "questions",
        quantityLabel: "questions",
      }),
      log({ id: "log-nonacademic", type: "Walk", minutes: 99, academic: false, productive: true }),
    ];
    const sessions: StudySession[] = [
      session({
        id: "session-completed",
        title: "Completed block",
        status: "completed",
        segments: [{ startedAt: `${DAY}T08:00:00.000Z`, endedAt: `${DAY}T08:25:00.000Z` }],
        capture: { outcome: "completed" },
        endedAt: `${DAY}T08:25:00.000Z`,
      }),
      session({
        id: "session-paused",
        title: "Paused block",
        status: "paused",
        segments: [{ startedAt: `${DAY}T09:00:00.000Z`, endedAt: `${DAY}T09:10:00.000Z` }],
      }),
      session({
        id: "session-partial",
        title: "Partial block",
        status: "completed",
        segments: [{ startedAt: `${DAY}T10:00:00.000Z`, endedAt: `${DAY}T10:05:00.000Z` }],
        capture: { outcome: "partial" },
        endedAt: `${DAY}T10:05:00.000Z`,
      }),
    ];
    const questions = [
      question({
        id: "question-correct",
        attempts: [{ at: `${DAY}T12:00:00.000Z`, answerKey: "B", status: "correct" }],
      }),
      question({
        id: "question-incorrect",
        attempts: [{ at: `${DAY}T13:00:00.000Z`, answerKey: "A", status: "incorrect" }],
      }),
      question({
        id: "question-untrusted",
        source: "imported",
        extraction: { confidence: "medium", reviewed: false },
        attempts: [{ at: `${DAY}T14:00:00.000Z`, answerKey: "B", status: "correct" }],
      }),
    ];
    const tasks: Task[] = [
      task({ id: "task-completed", title: "Finish renal review", done: true, completedAt: `${DAY}T15:00:00.000Z` }),
      task({ id: "task-open", title: "Write summary", due: DAY }),
      task({ id: "task-future", title: "Future task", created: `${NEXT_DAY}T08:00:00.000Z` }),
      task({ id: "task-archived", title: "Archived task", archived: true }),
    ];
    const state = glanceState({
      profile: {
        ...makeSeed().profile,
        dailySuccess: {
          version: 1,
          configuredAt: DAY,
          requirements: [minuteRequirement, cardRequirement],
        },
      },
      dayPlans: [{
        dayKey: DAY,
        intention: "Complete the renal review",
        wins: ["Finish the question block"],
        outcome: "partial",
        reviewNote: "The final section remains.",
        createdAt: `${DAY}T06:00:00.000Z`,
        reviewedAt: `${DAY}T20:00:00.000Z`,
      }],
      logs,
      sessions,
      questions,
      habits,
      habitEntries,
      tasks,
      journal: [{
        id: "journal-day",
        date: `${DAY}T20:00:00.000Z`,
        today: "Reviewed renal physiology.",
        tomorrow: "Finish the last section.",
        blockers: "Time ran short.",
        energy: "Medium",
        rating: "Useful",
      }],
      closeouts: [{
        id: "closeout-day",
        dayKey: DAY,
        completedSummary: "Finished the first review pass.",
        remainingSummary: "Complete the last renal section.",
        tomorrowMode: "auto",
        createdAt: `${DAY}T20:00:00.000Z`,
        updatedAt: `${DAY}T20:00:00.000Z`,
      }],
      energyFactors: [{
        id: "energy-sleep",
        date: DAY,
        source: "manual",
        label: "Poor sleep",
        category: "sleep",
        delta: -8,
        confidence: 1,
        carryoverDays: 1,
        decayPerDay: 0.5,
        userConfirmed: true,
        createdAt: `${DAY}T06:00:00.000Z`,
        updatedAt: `${DAY}T06:00:00.000Z`,
      }],
    });
    const before = structuredClone(state);

    const result = selectDayAtAGlance(state, DAY, DAY, new Date(`${DAY}T18:00:00.000Z`));

    expect(result.intention).toMatchObject({
      text: "Complete the renal review",
      outcome: "partial",
      sourceId: `day-plan:${DAY}`,
    });
    expect(result.targetCompletion).toMatchObject({ eligibleCount: 2, metCount: 1, status: "in-progress" });
    expect(result.targetCompletion.sourceIds).toEqual(expect.arrayContaining([
      "target-focus",
      "target-cards",
      "log-pomodoro",
      "log-cards",
    ]));
    expect(result.focusedMinutes.value).toBe(40);
    expect(result.focusedMinutes.sourceIds).toEqual(["log-cards", "log-pomodoro"]);
    expect(result.focusedMinutes.pomodoroLogIds).toEqual(["log-pomodoro"]);
    expect(result.focusedMinutes.sessions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "session-completed", elapsedMinutes: 25 }),
      expect.objectContaining({ id: "session-paused", elapsedMinutes: 10 }),
    ]));
    expect(result.questions).toMatchObject({ trustedAttempts: 2, correct: 1, incorrect: 1, other: 0 });
    expect(result.questions.questionIds).toEqual(["question-correct", "question-incorrect"]);
    expect(result.cards).toMatchObject({ reviewed: 20, sourceIds: ["log-cards"] });
    expect(result.habits).toMatchObject({ expected: 2, done: 1, unlogged: 1 });
    expect(result.habits.items.map((item) => item.habitId)).toEqual(["habit-open", "habit-done"]);
    expect(result.tasks.completed.map((item) => item.id)).toEqual(["task-completed"]);
    expect(result.tasks.open.map((item) => item.id)).toEqual(["task-open"]);
    expect(result.energy).toMatchObject({
      hasEvidence: true,
      selfReported: { label: "Medium", score: 60, source: "journal-day" },
    });
    expect(result.energy.sourceIds).toEqual(expect.arrayContaining(["journal-day", "energy-sleep", "log-pomodoro"]));
    expect(result.wins).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: "Finish the question block", kind: "planned-condition", status: "planned" }),
      expect.objectContaining({ text: "Finished the first review pass.", kind: "closeout-summary" }),
      expect.objectContaining({ text: "Reviewed renal physiology.", kind: "journal-summary" }),
    ]));
    expect(result.unfinishedItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: `day-plan:${DAY}`, kind: "day-plan", status: "partial" }),
      expect.objectContaining({ id: "target:target-focus", kind: "target" }),
      expect.objectContaining({ id: "session:session-paused", kind: "session" }),
      expect.objectContaining({ id: "session:session-partial", kind: "session", status: "partial" }),
      expect.objectContaining({ id: "habit:habit-open", kind: "habit", status: "unlogged" }),
      expect.objectContaining({ id: "task:task-open", kind: "task" }),
      expect.objectContaining({ id: "closeout:closeout-day:remaining", kind: "closeout" }),
    ]));
    expect(result.provenance).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceType: "question-attempt", sourceId: "question-correct", role: "questions" }),
      expect.objectContaining({ sourceType: "study-session", sourceId: "session-paused" }),
      expect.objectContaining({ sourceType: "task", sourceId: "task-open", role: "unfinished" }),
    ]));
    expect(state).toEqual(before);
  });

  it("uses the canonical mapping boundary for Question Bank attempts", () => {
    const state = glanceState({
      questions: [
        question({
          id: "manual-ready",
          attempts: [
            { at: `${DAY}T10:00:00.000Z`, status: "correct", answerKey: "B" },
            { at: `${NEXT_DAY}T10:00:00.000Z`, status: "incorrect", answerKey: "A" },
          ],
        }),
        question({
          id: "reviewed-import",
          source: "imported",
          extraction: { confidence: "medium", reviewed: true },
          attempts: [{ at: `${DAY}T11:00:00.000Z`, status: "guessed", answerKey: "A" }],
        }),
        question({
          id: "unreviewed-import",
          source: "imported",
          extraction: { confidence: "medium", reviewed: false },
          attempts: [{ at: `${DAY}T12:00:00.000Z`, status: "correct", answerKey: "B" }],
        }),
        question({
          id: "unresolved",
          correctKey: undefined,
          attempts: [{ at: `${DAY}T13:00:00.000Z`, status: "incorrect", answerKey: "A" }],
        }),
      ],
    });

    const result = selectDayAtAGlance(state, DAY, DAY);

    expect(result.questions).toMatchObject({ trustedAttempts: 2, correct: 1, incorrect: 0, other: 1 });
    expect(result.questions.questionIds).toEqual(["manual-ready", "reviewed-import"]);
    expect(result.questions.provenance.every((item) => item.sourceType === "question-attempt")).toBe(true);
    expect(result.provenance.some((item) => item.sourceId === "unreviewed-import")).toBe(false);
    expect(result.provenance.some((item) => item.sourceId === "unresolved")).toBe(false);
  });

  it("preserves canonical target contributions, including a manual correction", () => {
    const requirement = makeDailyRequirement({
      id: "target-questions",
      label: "Practice questions",
      source: { kind: "practice-questions" },
      target: 20,
      unit: "questions",
      trackingStartsAt: DAY,
      createdAt: `${DAY}T06:00:00.000Z`,
      updatedAt: `${DAY}T06:00:00.000Z`,
      manualContributions: [{
        id: "manual-question-correction",
        requirementId: "target-questions",
        dayKey: DAY,
        value: -2,
        unit: "questions",
        mode: "add",
        createdAt: `${DAY}T18:00:00.000Z`,
        updatedAt: `${DAY}T18:00:00.000Z`,
      }],
    }, DAY);
    const state = glanceState({
      profile: {
        ...makeSeed().profile,
        dailySuccess: { version: 1, configuredAt: DAY, requirements: [requirement] },
      },
      logs: [log({
        id: "log-question-count",
        type: "Questions",
        minutes: 0,
        quantity: 12,
        quantityKind: "questions",
        quantityLabel: "questions",
      })],
    });

    const result = selectDayAtAGlance(state, DAY, DAY);
    const target = result.targetCompletion.requirements[0];

    expect(target).toMatchObject({ id: "target-questions", current: 10, target: 20, status: "in-progress" });
    expect(target.sourceRecordIds).toEqual(["log-question-count", "manual-question-correction"]);
    expect(target.contributions).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceRecord: "study-log", sourceRecordId: "log-question-count", value: 12 }),
      expect.objectContaining({ sourceRecord: "manual-contribution", sourceRecordId: "manual-question-correction", value: -2, correction: true }),
    ]));
    expect(result.targetCompletion.provenance).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceType: "manual-contribution", sourceId: "manual-question-correction", role: "target" }),
    ]));
  });

  it("stays neutral and finite for an empty day and malformed numeric logs", () => {
    const state = glanceState({
      logs: [
        log({ id: "bad-minutes", minutes: Number.NaN, cards: 0 }),
        log({ id: "negative-cards", minutes: 0, cards: -10 }),
      ],
    });
    const before = structuredClone(state);

    const result = selectDayAtAGlance(state, DAY, DAY);

    expect(result.focusedMinutes.value).toBe(0);
    expect(result.cards.reviewed).toBe(0);
    expect(Number.isFinite(result.focusedMinutes.value)).toBe(true);
    expect(Number.isFinite(result.cards.reviewed)).toBe(true);
    expect(result.questions.trustedAttempts).toBe(0);
    expect(result.tasks).toMatchObject({ completed: [], open: [] });
    expect(result.habits).toMatchObject({ items: [], expected: 0, unlogged: 0 });
    expect(result.energy).toMatchObject({ hasEvidence: false, selfReported: { label: "Unlogged" } });
    expect(result.unfinishedItems).toEqual([]);
    expect(state).toEqual(before);
  });

  it("does not treat flexible, archived, future, or intentionally skipped records as unfinished", () => {
    const state = glanceState({
      habits: [
        habit({ id: "weekly", name: "Weekly review", type: "weekly", weeklyTarget: 2 }),
        habit({ id: "archived", name: "Archived habit", archived: true }),
        habit({ id: "future", name: "Future habit", createdAt: `${NEXT_DAY}T08:00:00.000Z`, trackingStartsAt: NEXT_DAY }),
        habit({ id: "skipped", name: "Intentional rest" }),
      ],
      habitEntries: [
        { id: "archived-entry", habitId: "archived", date: DAY, status: "done", createdAt: `${DAY}T09:00:00.000Z` },
        { id: "skip-entry", habitId: "skipped", date: DAY, status: "skipped", createdAt: `${DAY}T09:00:00.000Z` },
      ],
      tasks: [
        task({ id: "future-task", title: "Created tomorrow", created: `${NEXT_DAY}T09:00:00.000Z` }),
        task({ id: "archived-task", title: "Archived", archived: true }),
      ],
    });

    const result = selectDayAtAGlance(state, DAY, DAY);

    expect(result.habits.items.map((item) => item.habitId)).toEqual(["archived", "skipped"]);
    expect(result.habits.items.find((item) => item.habitId === "archived")?.expectedToday).toBe(false);
    expect(result.habits.items.find((item) => item.habitId === "skipped")?.status).toBe("skipped");
    expect(result.unfinishedItems.some((item) => item.kind === "habit")).toBe(false);
    expect(result.tasks.open).toEqual([]);
    expect(result.unfinishedItems.some((item) => item.kind === "task")).toBe(false);
  });
});

function glanceState(patch: Partial<DayAtAGlanceState> = {}): DayAtAGlanceState {
  const seed = makeSeed();
  return {
    profile: {
      ...seed.profile,
      dailySuccess: { version: 1, configuredAt: DAY, requirements: [] },
    },
    activeDayKey: DAY,
    dayPlans: [],
    logs: [],
    productivityTrackers: seed.productivityTrackers,
    sessions: [],
    questions: [],
    habits: [],
    habitEntries: [],
    tasks: [],
    energyFactors: [],
    journal: [],
    closeouts: [],
    ...patch,
  };
}

function log(patch: Partial<StudyLog> = {}): StudyLog {
  return {
    id: "log",
    dayKey: DAY,
    ts: `${DAY}T12:00:00.000Z`,
    type: "Study",
    minutes: 0,
    cards: 0,
    academic: true,
    productive: true,
    ...patch,
  };
}

function task(patch: Partial<Task> = {}): Task {
  return {
    id: "task",
    title: "Task",
    done: false,
    archived: false,
    created: `${DAY}T06:00:00.000Z`,
    ...patch,
  };
}

function habit(patch: Partial<Habit> = {}): Habit {
  return {
    id: "habit",
    name: "Habit",
    type: "binary",
    createdAt: `${DAY}T06:00:00.000Z`,
    updatedAt: `${DAY}T06:00:00.000Z`,
    trackingStartsAt: DAY,
    ...patch,
  };
}

function session(patch: Partial<StudySession> = {}): StudySession {
  return {
    id: "session",
    title: "Study session",
    link: { kind: "free", label: "Study" },
    segments: [],
    status: "paused",
    quickLogs: [],
    source: "manual",
    dayKey: DAY,
    createdAt: `${DAY}T06:00:00.000Z`,
    ...patch,
  };
}

function question(patch: Partial<QuestionRecord> = {}): QuestionRecord {
  return {
    id: "question",
    source: "manual",
    stem: "Which option is supported?",
    options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }],
    correctKey: "B",
    status: "unseen",
    tags: [],
    attempts: [],
    createdAt: `${DAY}T06:00:00.000Z`,
    updatedAt: `${DAY}T06:00:00.000Z`,
    ...patch,
  };
}

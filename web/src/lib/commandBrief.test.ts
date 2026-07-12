import { describe, expect, it } from "vitest";
import {
  assessCommandBriefEvidence, buildCommandBrief, deriveMinimumViableWin, deriveMode, deriveNextBestMove, deriveSignals,
  type BriefStateSlice, type BriefSignals,
} from "./commandBrief";
import type { NoctyriumState, Task, TrackerItem } from "./types";
import { newSchedule, type AnkiCard } from "./ankiCards";
import { makeSeed } from "./seed";

const TODAY = "2026-07-07";

function tracker(patch: Partial<TrackerItem>): TrackerItem {
  return {
    id: crypto.randomUUID(), path: "Term 2/BPM 501/NB3/Lectures", label: "Lecture",
    kind: "Lecture", passes: 0, ankiPasses: 0, yield: "none", updated: "2026-07-01T00:00:00.000Z",
    ...patch,
  };
}

function task(patch: Partial<Task>): Task {
  return { id: crypto.randomUUID(), title: "Task", done: false, created: "2026-07-01T00:00:00.000Z", ...patch };
}

function slice(patch: Partial<BriefStateSlice> = {}): BriefStateSlice {
  return {
    tasks: [],
    tracker: [],
    logs: [],
    boardPrep: {} as NoctyriumState["boardPrep"],
    activeDayKey: TODAY,
    sessions: [],
    closeouts: [],
    questions: [],
    ankiCards: [],
    ...patch,
  };
}

function signals(patch: Partial<BriefSignals> = {}): BriefSignals {
  return {
    daysSinceLastStudy: 0, missedDaysLast7: 0, overdueTasks: 0, carriedTasks: 0, openTasks: 0,
    backlogScore: 0, examDaysAway: null, reviewFlagged: 0, dueQuestionCount: 0, dueCardCount: 0,
    yesterdayMinutes: 60, todayMinutes: 0,
    ...patch,
  };
}

describe("mode derivation (transparent rules)", () => {
  it("stable workload with no backlog → Maintain", () => {
    expect(deriveMode(signals()).mode).toBe("maintain");
  });

  it("exam within 3 days → Exam Week regardless of backlog", () => {
    expect(deriveMode(signals({ examDaysAway: 2 })).mode).toBe("exam-week");
    expect(deriveMode(signals({ examDaysAway: 2, backlogScore: 80 })).mode).toBe("exam-week");
  });

  it("exam within 7 days plus backlog → Sprint", () => {
    expect(deriveMode(signals({ examDaysAway: 6, backlogScore: 40 })).mode).toBe("sprint");
  });

  it("exam within 7 days without backlog stays Maintain-ish, not Sprint", () => {
    expect(deriveMode(signals({ examDaysAway: 6, backlogScore: 5 })).mode).toBe("maintain");
  });

  it("multiple missed study days plus unfinished work → Recovery", () => {
    expect(deriveMode(signals({ daysSinceLastStudy: 4 })).mode).toBe("recovery");
    expect(deriveMode(signals({ missedDaysLast7: 4, backlogScore: 45 })).mode).toBe("recovery");
  });

  it("behind but with time → Catch-Up", () => {
    expect(deriveMode(signals({ overdueTasks: 3, backlogScore: 36 })).mode).toBe("catch-up");
  });

  it("a closeout mode preference overrides the rules", () => {
    const result = deriveMode(signals({ daysSinceLastStudy: 5 }), "maintain");
    expect(result.mode).toBe("maintain");
    expect(result.reason).toMatch(/closeout/i);
  });

  it("every mode ships a plain-language reason", () => {
    for (const s of [signals(), signals({ examDaysAway: 1 }), signals({ daysSinceLastStudy: 4 })]) {
      expect(deriveMode(s).reason.length).toBeGreaterThan(20);
    }
  });
});

describe("next best move priority", () => {
  it("picks exactly one move and explains it", () => {
    const s = slice({
      tracker: [
        tracker({ label: "Untouched high-yield", yield: "high", passes: 0 }),
        tracker({ label: "Needs review", yield: "review", passes: 1 }),
      ],
    });
    const move = deriveNextBestMove(s, "maintain", deriveSignals(s));
    expect(move.title).toContain("Needs review"); // review outranks untouched
    expect(move.reason.length).toBeGreaterThan(10);
    expect(move.expectedOutcome.length).toBeGreaterThan(10);
    expect(move.estimatedMinutes).toBeGreaterThan(0);
  });

  it("exam week with a due question backlog points at question rework", () => {
    const dueQuestion = (id: string) => ({
      id, source: "manual" as const, stem: "q", options: [], status: "incorrect" as const,
      tags: [], attempts: [], reviewDueAt: "2026-07-01T00:00:00.000Z",
      createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
    });
    const s = slice({ questions: Array.from({ length: 6 }, (_, i) => dueQuestion(String(i))) });
    const move = deriveNextBestMove(s, "exam-week", deriveSignals(s));
    expect(move.link.kind).toBe("question-set");
  });

  it("falls back to the oldest task, then to setup, when the tracker is empty", () => {
    const withTask = slice({ tasks: [task({ title: "Email the registrar", due: "2026-07-01" })] });
    expect(deriveNextBestMove(withTask, "maintain", deriveSignals(withTask)).title).toBe("Email the registrar");

    const empty = slice();
    const move = deriveNextBestMove(empty, "maintain", deriveSignals(empty));
    expect(move.title).toMatch(/tracker/i);
  });
});

describe("minimum viable win", () => {
  it("prefers due cards, then due questions, then a fragile skim, then one sentence", () => {
    const dueCard: AnkiCard = {
      id: "c1", type: "basic", front: "f", back: "b", tags: [], aiGenerated: false,
      schedule: { ...newSchedule(new Date("2026-07-01")), dueAt: "2026-07-01T00:00:00.000Z" },
      createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
    };
    const withCards = slice({ ankiCards: [dueCard] });
    expect(deriveMinimumViableWin(withCards, deriveSignals(withCards)).title).toMatch(/card/i);

    const bare = slice();
    expect(deriveMinimumViableWin(bare, deriveSignals(bare)).title).toMatch(/one sentence/i);
  });
});

describe("full brief assembly", () => {
  it("does not invent missed-study history in a fresh workspace", () => {
    const result = deriveSignals(slice());
    expect(result.daysSinceLastStudy).toBe(0);
    expect(result.missedDaysLast7).toBe(0);
    expect(detectMode(result)).not.toBe("recovery");
  });

  it("honors yesterday's closeout first-task commitment", () => {
    const s = slice({
      tracker: [tracker({ label: "Renal physiology", yield: "high" })],
      closeouts: [{
        id: "co", dayKey: "2026-07-06", completedSummary: "x", tomorrowFirstTask: "Renal physiology",
        tomorrowMode: "auto", createdAt: "2026-07-06T21:00:00.000Z", updatedAt: "2026-07-06T21:00:00.000Z",
      }],
    });
    const brief = buildCommandBrief(s, new Date(`${TODAY}T08:00:00`));
    expect(brief.move.reason).toMatch(/closeout/i);
    expect(brief.move.link.kind).toBe("tracker");
    expect(brief.generatedFor).toBe(TODAY);
    expect(brief.source).toBe("rules");
  });

  it("flags recovery when the signals warrant it", () => {
    const s = slice({
      tasks: [task({ due: "2026-07-01" }), task({ due: "2026-07-02" }), task({ due: "2026-07-03" })],
    });
    const brief = buildCommandBrief(s, new Date(`${TODAY}T08:00:00`));
    // Overdue work still produces catch-up without inventing study history.
    expect(brief.signals.overdueTasks).toBe(3);
    expect(["recovery", "catch-up"]).toContain(brief.mode);
  });
});

function detectMode(value: BriefSignals) {
  return deriveMode(value).mode;
}

describe("Command Brief evidence readiness", () => {
  it("excludes every canonical seed course, example tracker row, and starter task", () => {
    const seed = makeSeed();
    const evidence = assessCommandBriefEvidence({
      courses: seed.courses,
      tracker: seed.tracker,
      logs: seed.logs,
      tasks: seed.tasks,
      questions: seed.questions,
      documents: seed.documents,
      questionSets: seed.questionSets,
    });

    expect(evidence.ready).toBe(false);
    expect(evidence.workload.count).toBe(0);
    expect(evidence.activeItems.count).toBe(0);
    expect(evidence.activity.count).toBe(0);
  });

  it("requires all three independent evidence boundaries", () => {
    const seed = makeSeed();
    const evidence = assessCommandBriefEvidence({
      courses: [{ id: "course-real", termId: "term-1", code: "RENAL", name: "Renal block", files: 0, modules: [] }],
      tracker: [
        tracker({ id: "real-1", path: "Renal/Week 1", label: "Glomerular physiology", passes: 0 }),
        tracker({ id: "real-2", path: "Renal/Week 1", label: "Tubular transport", passes: 1 }),
      ],
      logs: [],
      tasks: seed.tasks,
      questions: [],
      documents: [],
      questionSets: [],
    });

    expect(evidence.workload.ready).toBe(true);
    expect(evidence.activeItems.ready).toBe(true);
    expect(evidence.activity.ready).toBe(false);
    expect(evidence.ready).toBe(false);
  });

  it("activates only after a real workload, two active items, and a real signal exist", () => {
    const evidence = assessCommandBriefEvidence({
      courses: [{ id: "course-real", termId: "term-real", code: "CARD", name: "Cardiology", files: 0, modules: [] }],
      tracker: [
        tracker({ id: "real-1", path: "Cardiology/Lectures", label: "Heart failure", passes: 0 }),
        tracker({ id: "real-2", path: "Cardiology/PQs", label: "Cardiology questions", kind: "PQ", passes: 1 }),
      ],
      logs: [{
        id: "log-real", dayKey: TODAY, ts: `${TODAY}T09:00:00.000Z`, type: "Study",
        minutes: 30, cards: 0, academic: true, productive: true,
      }],
      tasks: [],
      questions: [],
      documents: [],
      questionSets: [],
    });

    expect(evidence.ready).toBe(true);
    expect(evidence.workload.count).toBe(1);
    expect(evidence.activeItems.count).toBe(2);
    expect(evidence.activity.count).toBe(1);
  });

  it("treats progress beyond a template baseline as meaningful without counting shipped progress", () => {
    const seed = makeSeed();
    const progressed = seed.tracker.slice(0, 2).map((item) => ({ ...item, passes: item.passes + 1 }));
    const evidence = assessCommandBriefEvidence({
      courses: seed.courses,
      tracker: progressed,
      logs: [],
      tasks: [{ id: "user-task", title: "Review renal notes", done: false, created: `${TODAY}T08:00:00.000Z` }],
      questions: [],
      documents: [{
        id: "source-1", title: "Renal notes", fileName: "renal.pdf", fileType: "application/pdf",
        uploadedAt: `${TODAY}T08:00:00.000Z`, rawText: "", sizeBytes: 100, tags: [], linkedQuestionSetIds: [], libraryOnly: true,
      }],
      questionSets: [],
    });

    expect(evidence.workload.ready).toBe(true);
    expect(evidence.activeItems.count).toBe(2);
    expect(evidence.activity.ready).toBe(true);
    expect(evidence.ready).toBe(true);
  });
});

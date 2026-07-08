import { describe, expect, it } from "vitest";
import { buildRecoveryPlan, detectRecoveryTriggers, estimateGap } from "./recovery";
import type { BriefSignals } from "./commandBrief";
import type { Task, TrackerItem } from "./types";

function signals(patch: Partial<BriefSignals> = {}): BriefSignals {
  return {
    daysSinceLastStudy: 0, missedDaysLast7: 0, overdueTasks: 0, carriedTasks: 0, openTasks: 0,
    backlogScore: 0, examDaysAway: null, reviewFlagged: 0, dueQuestionCount: 0, dueCardCount: 0,
    yesterdayMinutes: 0, todayMinutes: 0,
    ...patch,
  };
}

function task(patch: Partial<Task>): Task {
  return { id: crypto.randomUUID(), title: "Task", done: false, created: "2026-07-01T00:00:00.000Z", ...patch };
}

function trackerItem(patch: Partial<TrackerItem>): TrackerItem {
  return {
    id: crypto.randomUUID(), path: "T2/NB3/Lectures", label: "Lecture", kind: "Lecture",
    passes: 0, ankiPasses: 0, yield: "none", updated: "2026-07-01T00:00:00.000Z",
    ...patch,
  };
}

describe("recovery trigger detection", () => {
  it("does not trigger on a healthy week", () => {
    expect(detectRecoveryTriggers(signals()).triggered).toBe(false);
  });

  it("triggers on missed days plus backlog and names its signals", () => {
    const result = detectRecoveryTriggers(signals({ daysSinceLastStudy: 4, overdueTasks: 4, backlogScore: 55 }));
    expect(result.triggered).toBe(true);
    expect(result.severity).toBe("serious");
    expect(result.signals.join(" ")).toMatch(/4 days with no study/);
    expect(result.signals.join(" ")).toMatch(/overdue/);
  });

  it("a single mild signal is not enough — no hair-trigger alarms", () => {
    expect(detectRecoveryTriggers(signals({ overdueTasks: 3 })).triggered).toBe(false);
    expect(detectRecoveryTriggers(signals({ daysSinceLastStudy: 2 })).triggered).toBe(false);
  });
});

describe("recovery plan generation", () => {
  const inputs = () => ({
    tasks: [
      task({ title: "Overdue assignment", due: "2026-07-01" }),
      task({ title: "Carried twice", carryoverFrom: ["2026-07-04", "2026-07-05"] }),
      task({ title: "Regular task" }),
    ],
    tracker: [
      trackerItem({ label: "Flagged lecture", yield: "review", passes: 1 }),
      trackerItem({ label: "High-yield PQs", kind: "PQ", yield: "high" }),
      trackerItem({ label: "Low-yield extra", yield: "low" }),
    ],
    signals: signals({ daysSinceLastStudy: 4, overdueTasks: 1, backlogScore: 50, examDaysAway: 6, examLabel: "USMLE Step 1" }),
    trigger: detectRecoveryTriggers(signals({ daysSinceLastStudy: 4, overdueTasks: 1, backlogScore: 50 })),
    activeDayKey: "2026-07-07",
    now: new Date("2026-07-07T08:00:00.000Z"),
  });

  it("triages into the four buckets correctly", () => {
    const plan = buildRecoveryPlan(inputs());
    const bucketOf = (title: string) => plan.items.find((i) => i.title === title)?.bucket;
    expect(bucketOf("Overdue assignment")).toBe("non-negotiable");
    expect(bucketOf("Flagged lecture")).toBe("non-negotiable");
    expect(bucketOf("Carried twice")).toBe("high-yield");
    expect(bucketOf("High-yield PQs")).toBe("high-yield");
    expect(bucketOf("Low-yield extra")).toBe("drop-for-now");
  });

  it("generates both a 24h restart and a 72h stabilization plan", () => {
    const plan = buildRecoveryPlan(inputs());
    expect(plan.steps.some((st) => st.window === "24h")).toBe(true);
    expect(plan.steps.some((st) => st.window === "72h")).toBe(true);
    expect(plan.status).toBe("proposed");
  });

  it("states the situation without shame language", () => {
    const plan = buildRecoveryPlan(inputs());
    const allText = [plan.situation, plan.gapEstimate, ...plan.steps.map((st) => st.title)].join(" ").toLowerCase();
    for (const banned of ["shame", "lazy", "failure", "fell behind again", "disappointing", "streak lost"]) {
      expect(allText).not.toContain(banned);
    }
    expect(plan.situation).toMatch(/recoverable/i);
  });

  it("estimates the gap as an honest range, not false precision", () => {
    const text = estimateGap(inputs());
    expect(text).toMatch(/\d+–\d+ hours/);
    expect(text).toMatch(/may not be realistic/i);
  });
});

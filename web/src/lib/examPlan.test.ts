import { describe, it, expect } from "vitest";
import type { BoardBlueprintLog, BoardPrepProfile } from "./types";
import {
  daysUntilExam,
  studyPhase,
  recommendedDailyQuestions,
  nearestTier,
  questionsAnsweredOn,
  activeMilestone,
  pickFocusExam,
  buildExamCountdown,
  countdownHeadline,
  QUESTION_TIERS,
} from "./examPlan";

const TODAY = "2026-06-25";

function prep(partial: Partial<BoardPrepProfile>): BoardPrepProfile {
  return {
    medYear: "",
    contentStarted: "not-started",
    weeklyHours: 20,
    questionTarget: 40,
    resourcesDone: [],
    otherResources: "",
    confidence: "medium",
    blueprintLogs: [],
    updated: "",
    ...partial,
  };
}

function qlog(date: string, questions: number, correct = 0): BoardBlueprintLog {
  return {
    id: `${date}-${questions}`,
    date,
    dimension: "system",
    area: "Cardio",
    mode: "Questions",
    minutes: 30,
    questions,
    correct,
    confidence: "orange",
    updated: "",
  };
}

describe("daysUntilExam", () => {
  it("returns positive days for a future date", () => {
    expect(daysUntilExam("2026-07-25", TODAY)).toBe(30);
  });
  it("returns negative days for a past date", () => {
    expect(daysUntilExam("2026-06-20", TODAY)).toBe(-5);
  });
  it("returns 0 on exam day", () => {
    expect(daysUntilExam("2026-06-25", TODAY)).toBe(0);
  });
  it("returns null when no date or malformed", () => {
    expect(daysUntilExam(undefined, TODAY)).toBeNull();
    expect(daysUntilExam("not-a-date", TODAY)).toBeNull();
  });
  it("accepts ISO datetimes by trimming to the date", () => {
    expect(daysUntilExam("2026-07-25T09:00:00.000Z", TODAY)).toBe(30);
  });
});

describe("studyPhase", () => {
  it("is post-exam after the date passes", () => {
    expect(studyPhase(prep({ examDate: "2026-06-20" }), TODAY)).toBe("post-exam");
  });
  it("is dedicated within 6 weeks of the exam", () => {
    expect(studyPhase(prep({ examDate: "2026-07-20" }), TODAY)).toBe("dedicated");
  });
  it("is systems within ~6 months", () => {
    expect(studyPhase(prep({ examDate: "2026-10-01" }), TODAY)).toBe("systems");
  });
  it("is foundation when the exam is far and little content is covered", () => {
    expect(studyPhase(prep({ examDate: "2027-06-01", contentStarted: "not-started" }), TODAY)).toBe("foundation");
  });
  it("honors an explicit dedicated content stage regardless of date", () => {
    expect(studyPhase(prep({ examDate: "2027-06-01", contentStarted: "dedicated" }), TODAY)).toBe("dedicated");
  });
  it("infers from content progress when no date is set", () => {
    expect(studyPhase(prep({ contentStarted: "not-started" }), TODAY)).toBe("foundation");
    expect(studyPhase(prep({ contentStarted: "half" }), TODAY)).toBe("systems");
    expect(studyPhase(prep({ contentStarted: "dedicated" }), TODAY)).toBe("maintenance");
  });
});

describe("recommendedDailyQuestions", () => {
  it("scales up with phase", () => {
    expect(recommendedDailyQuestions("foundation", "step1")).toBe(20);
    expect(recommendedDailyQuestions("systems", "step1")).toBe(40);
    expect(recommendedDailyQuestions("dedicated", "step1")).toBe(100);
  });
  it("returns 0 post-exam (no grind after the test)", () => {
    expect(recommendedDailyQuestions("post-exam", "step1")).toBe(0);
  });
  it("respects intensity", () => {
    expect(recommendedDailyQuestions("dedicated", "step2", "gentle")).toBe(60);
    expect(recommendedDailyQuestions("dedicated", "step2", "intense")).toBe(150);
  });
  it("never exceeds the per-exam ceiling", () => {
    // premed caps at 60, so an intense dedicated push still clamps to 60
    expect(recommendedDailyQuestions("dedicated", "premed", "intense")).toBe(60);
  });
  it("always returns a configured tier", () => {
    for (const phase of ["foundation", "systems", "dedicated", "maintenance"] as const) {
      for (const intensity of ["gentle", "balanced", "intense"] as const) {
        expect(QUESTION_TIERS).toContain(recommendedDailyQuestions(phase, "step1", intensity));
      }
    }
  });
});

describe("nearestTier", () => {
  it("snaps to the closest configured tier", () => {
    expect(nearestTier(0)).toBe(20);
    expect(nearestTier(33)).toBe(40);
    expect(nearestTier(500)).toBe(200);
    expect(nearestTier(85)).toBe(100);
    expect(nearestTier(80)).toBe(60); // exact tie (60/100) resolves to the lower tier
  });
});

describe("questionsAnsweredOn", () => {
  it("sums questions and correct for the matching date only", () => {
    const logs = [qlog(TODAY, 20, 14), qlog(TODAY, 10, 8), qlog("2026-06-24", 50, 40)];
    expect(questionsAnsweredOn(logs, TODAY)).toEqual({ questions: 30, correct: 22 });
  });
  it("handles empty/undefined logs", () => {
    expect(questionsAnsweredOn(undefined, TODAY)).toEqual({ questions: 0, correct: 0 });
  });
});

describe("activeMilestone", () => {
  it("flags exam day and day-before distinctly", () => {
    expect(activeMilestone(0)?.id).toBe("exam-day");
    expect(activeMilestone(1)?.id).toBe("day-before");
  });
  it("buckets the final week", () => {
    expect(activeMilestone(3)?.id).toBe("final-week");
  });
  it("buckets month/quarter/half-year windows", () => {
    expect(activeMilestone(30)?.id).toBe("4-week"); // 30d ≈ 4 weeks out
    expect(activeMilestone(40)?.id).toBe("1-month");
    expect(activeMilestone(90)?.id).toBe("3-month");
    expect(activeMilestone(180)?.id).toBe("6-month");
  });
  it("returns null for past or unset", () => {
    expect(activeMilestone(-1)).toBeNull();
    expect(activeMilestone(null)).toBeNull();
    expect(activeMilestone(400)).toBeNull();
  });
});

describe("pickFocusExam", () => {
  it("prefers the soonest upcoming dated exam", () => {
    const boardPrep = {
      step1: prep({ examDate: "2026-09-01" }),
      step2: prep({ examDate: "2026-07-10" }),
    };
    expect(pickFocusExam(boardPrep, TODAY)).toBe("step2");
  });
  it("falls back to the most recently passed exam for reflection", () => {
    const boardPrep = {
      step1: prep({ examDate: "2026-06-10" }),
      step2: prep({ examDate: "2026-05-01" }),
    };
    expect(pickFocusExam(boardPrep, TODAY)).toBe("step1");
  });
  it("falls back to most content progress when no dates", () => {
    const boardPrep = {
      step1: prep({ contentStarted: "light" }),
      step2: prep({ contentStarted: "most" }),
    };
    expect(pickFocusExam(boardPrep, TODAY)).toBe("step2");
  });
  it("returns null when nothing is set", () => {
    expect(pickFocusExam({}, TODAY)).toBeNull();
    expect(pickFocusExam(undefined, TODAY)).toBeNull();
  });
});

describe("buildExamCountdown + countdownHeadline", () => {
  it("assembles a coherent view model with question progress", () => {
    const p = prep({ examDate: "2026-07-20", blueprintLogs: [qlog(TODAY, 50, 35)] });
    const c = buildExamCountdown("step1", p, "balanced", TODAY);
    expect(c.daysUntil).toBe(25);
    expect(c.phase).toBe("dedicated");
    expect(c.recommendedDaily).toBe(100);
    expect(c.answeredToday).toBe(50);
    expect(c.questionProgress).toBe(50);
    expect(c.awaitingPostExam).toBe(false);
    expect(countdownHeadline(c)).toContain("25 days to Step 1");
  });
  it("flags awaiting-post-exam after the date", () => {
    const c = buildExamCountdown("step1", prep({ examDate: "2026-06-20" }), "balanced", TODAY);
    expect(c.awaitingPostExam).toBe(true);
    expect(countdownHeadline(c)).toContain("behind you");
  });
  it("gives an empty-state headline when no date is set", () => {
    const c = buildExamCountdown("step1", prep({}), "balanced", TODAY);
    expect(c.daysUntil).toBeNull();
    expect(countdownHeadline(c)).toContain("Set an Step 1 date");
  });
});

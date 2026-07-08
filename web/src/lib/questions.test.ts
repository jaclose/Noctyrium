import { describe, expect, it } from "vitest";
import {
  analyzeQuestionStyle, applyAttempt, dueQuestions, errorPatterns, filterForMode,
  validateQuestionRecord, weakTopics, type QuestionRecord,
} from "./questions";
import { parseQuestionText } from "./questionParse";

function makeQuestion(patch: Partial<QuestionRecord> = {}): QuestionRecord {
  return {
    id: crypto.randomUUID(), source: "manual", stem: "A stem", options: [{ key: "A", text: "x" }, { key: "B", text: "y" }],
    correctKey: "A", status: "unseen", tags: [], attempts: [],
    createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
    ...patch,
  };
}

describe("question record validation", () => {
  it("rejects a payload with no stem", () => {
    const result = validateQuestionRecord({ options: [] });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/stem/i);
  });

  it("rejects a correct answer that doesn't match an option", () => {
    const result = validateQuestionRecord({ stem: "q", options: [{ key: "A", text: "a" }], correctKey: "C" });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/does not match/i);
  });

  it("auto-letters options missing keys and normalizes case", () => {
    const result = validateQuestionRecord({
      stem: "q", options: [{ text: "first" }, { text: "second" }], correctKey: "b",
    });
    expect(result.ok).toBe(true);
    expect(result.value?.options.map((o) => o.key)).toEqual(["A", "B"]);
    expect(result.value?.correctKey).toBe("B");
  });

  it("defaults unknown status/source safely rather than throwing", () => {
    const result = validateQuestionRecord({ stem: "q", options: [], status: "bogus", source: "bogus" });
    expect(result.ok).toBe(true);
    expect(result.value?.status).toBe("unseen");
    expect(result.value?.source).toBe("manual");
  });

  it("marks ai-generated source with a generated flag", () => {
    const result = validateQuestionRecord({ stem: "q", options: [], source: "ai-generated" });
    expect(result.value?.ai?.generated).toBe(true);
  });
});

describe("attempts + spaced review", () => {
  it("schedules a sooner review for a miss than for a correct answer", () => {
    const now = new Date("2026-07-07T08:00:00.000Z");
    const missed = applyAttempt(makeQuestion(), { status: "incorrect", answerKey: "B" }, now);
    const right = applyAttempt(makeQuestion(), { status: "correct", answerKey: "A" }, now);
    expect(missed.reviewDueAt! < right.reviewDueAt!).toBe(true);
    expect(missed.status).toBe("incorrect");
    expect(missed.attempts).toHaveLength(1);
  });

  it("surfaces questions whose review is due", () => {
    const due = makeQuestion({ reviewDueAt: "2026-07-01T00:00:00.000Z" });
    const later = makeQuestion({ reviewDueAt: "2999-01-01T00:00:00.000Z" });
    expect(dueQuestions([due, later], new Date("2026-07-07")).map((q) => q.id)).toEqual([due.id]);
  });
});

describe("modes + pattern surfacing", () => {
  it("repeat-offenders needs two or more misses", () => {
    const once = makeQuestion({ attempts: [{ at: "t", status: "incorrect" }] });
    const twice = makeQuestion({ attempts: [{ at: "t", status: "incorrect" }, { at: "t2", status: "incorrect" }] });
    const result = filterForMode([once, twice], "repeat-offenders");
    expect(result.map((q) => q.id)).toEqual([twice.id]);
  });

  it("ranks weak topics by miss rate", () => {
    const qs = [
      makeQuestion({ topic: "Complement", attempts: [{ at: "t", status: "incorrect" }, { at: "t2", status: "incorrect" }] }),
      makeQuestion({ topic: "Renal", attempts: [{ at: "t", status: "correct" }, { at: "t2", status: "incorrect" }] }),
    ];
    const weak = weakTopics(qs);
    expect(weak[0].topic).toBe("Complement");
    expect(weak[0].missRate).toBe(1);
  });

  it("aggregates error patterns by why, not just count", () => {
    const qs = [
      makeQuestion({ attempts: [{ at: "t", status: "incorrect", errorType: "misread-stem" }] }),
      makeQuestion({ attempts: [{ at: "t", status: "incorrect", errorType: "misread-stem" }] }),
      makeQuestion({ attempts: [{ at: "t", status: "incorrect", errorType: "knowledge-gap" }] }),
    ];
    const patterns = errorPatterns(qs);
    expect(patterns[0].errorType).toBe("misread-stem");
    expect(patterns[0].count).toBe(2);
  });
});

describe("faculty style analyzer", () => {
  it("refuses to over-claim on a tiny sample", () => {
    const report = analyzeQuestionStyle([makeQuestion()]);
    expect(report.reliable).toBe(false);
    expect(report.findings).toHaveLength(0);
  });

  it("reports hedged structural findings on a real sample", () => {
    const qs = Array.from({ length: 14 }, (_, i) =>
      makeQuestion({ id: String(i), stem: "A 40-year-old presents with X. What is the most likely diagnosis?", topic: "Cardio" }));
    const report = analyzeQuestionStyle(qs);
    expect(report.reliable).toBe(true);
    expect(report.findings.length).toBeGreaterThan(0);
    // Hedged language, never certainty about intent.
    const text = (report.findings.map((f) => f.detail).join(" ") + report.suggestion).toLowerCase();
    expect(text).not.toContain("the professor wants");
    expect(text).toMatch(/appears|may|frequently/);
  });
});

describe("paste parser (honest extraction)", () => {
  it("splits a standard stem/options/answer/explanation block", () => {
    const draft = parseQuestionText(
      "A 45-year-old man presents with fatigue.\nA. Iron deficiency\nB. B12 deficiency\nC. Folate deficiency\nD. Anemia of chronic disease\nAnswer: B\nExplanation: Low B12 causes macrocytosis.",
    );
    expect(draft.stem).toContain("45-year-old");
    expect(draft.options).toHaveLength(4);
    expect(draft.correctKey).toBe("B");
    expect(draft.explanation).toContain("macrocytosis");
    expect(draft.confidence).toBe("high");
  });

  it("never invents an answer — leaves it unset and warns", () => {
    const draft = parseQuestionText("What is the capital?\nA. Paris\nB. London");
    expect(draft.correctKey).toBeUndefined();
    expect(draft.warnings.join(" ")).toMatch(/no correct answer/i);
    expect(draft.confidence).not.toBe("high");
  });

  it("flags missing options as low confidence", () => {
    const draft = parseQuestionText("Just a sentence with no options at all.");
    expect(draft.options).toHaveLength(0);
    expect(draft.confidence).toBe("low");
  });
});

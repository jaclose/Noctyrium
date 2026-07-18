import { describe, expect, it } from "vitest";
import { orderQuestions, makeOrderingSeed, isQuestionOrdering } from "./questionOrdering";
import type { QuestionRecord } from "./questions";

function q(patch: Partial<QuestionRecord> & { id: string }): QuestionRecord {
  return {
    source: "manual", stem: "Stem", options: [], status: "unseen", tags: [], attempts: [],
    createdAt: "2026-07-18T00:00:00.000Z", updatedAt: "2026-07-18T00:00:00.000Z", ...patch,
  };
}

const pool: QuestionRecord[] = [
  q({ id: "c", questionNumber: 3, createdAt: "2026-07-03T00:00:00.000Z", sourceFile: { name: "Zebra.pdf", type: "pdf", size: 1, addedAt: "x" } }),
  q({ id: "a", questionNumber: 1, createdAt: "2026-07-01T00:00:00.000Z", sourceFile: { name: "Alpha.pdf", type: "pdf", size: 1, addedAt: "x" } }),
  q({ id: "b", questionNumber: 2, createdAt: "2026-07-02T00:00:00.000Z", sourceFile: { name: "mango.pdf", type: "pdf", size: 1, addedAt: "x" } }),
];

describe("orderQuestions deterministic modes", () => {
  it("import preserves the given membership order", () => {
    expect(orderQuestions(pool, "import").map((x) => x.id)).toEqual(["c", "a", "b"]);
  });
  it("question-number sorts ascending", () => {
    expect(orderQuestions(pool, "question-number").map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
  it("source sorts alphabetically by source file name", () => {
    expect(orderQuestions(pool, "source").map((x) => x.id)).toEqual(["a", "b", "c"]); // Alpha, mango, Zebra (case-insensitive)
  });
  it("created sorts by creation time ascending", () => {
    expect(orderQuestions(pool, "created").map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
  it("unknown question numbers sort last, tiebroken deterministically", () => {
    const mixed = [q({ id: "y" }), q({ id: "x", questionNumber: 5 }), q({ id: "z" })];
    expect(orderQuestions(mixed, "question-number").map((x) => x.id)).toEqual(["x", "y", "z"]);
  });
});

describe("orderQuestions random (seeded)", () => {
  it("same seed always produces the same order", () => {
    const first = orderQuestions(pool, "random", "seed-123").map((x) => x.id);
    const second = orderQuestions(pool, "random", "seed-123").map((x) => x.id);
    expect(first).toEqual(second);
  });
  it("is independent of incoming array order (canonicalized before shuffle)", () => {
    const forward = orderQuestions(pool, "random", "abc").map((x) => x.id);
    const reversed = orderQuestions([...pool].reverse(), "random", "abc").map((x) => x.id);
    expect(forward).toEqual(reversed);
  });
  it("is a permutation of the input (no loss, no dupes)", () => {
    const ids = orderQuestions(pool, "random", "xyz").map((x) => x.id).sort();
    expect(ids).toEqual(["a", "b", "c"]);
  });
  it("different seeds can produce different orders over a larger pool", () => {
    const big = Array.from({ length: 50 }, (_, i) => q({ id: `q${i}` }));
    const one = orderQuestions(big, "random", "seedA").map((x) => x.id).join(",");
    const two = orderQuestions(big, "random", "seedB").map((x) => x.id).join(",");
    expect(one).not.toEqual(two);
  });
});

describe("helpers", () => {
  it("makeOrderingSeed yields a non-empty string", () => {
    expect(makeOrderingSeed().length).toBeGreaterThan(0);
  });
  it("isQuestionOrdering guards unknown values", () => {
    expect(isQuestionOrdering("random")).toBe(true);
    expect(isQuestionOrdering("nope")).toBe(false);
  });
});

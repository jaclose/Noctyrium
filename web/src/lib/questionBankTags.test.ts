import { beforeEach, describe, expect, it } from "vitest";
import { makeSeed } from "./seed";
import { useStore, migratePersistedState } from "./store";
import { applyQuestionFilter } from "./questionFilters";
import type { QuestionRecord } from "./questions";

function q(patch: Partial<QuestionRecord> & { id: string }): QuestionRecord {
  return {
    source: "manual", stem: "Stem", options: [], status: "unseen", tags: [], attempts: [],
    createdAt: "2026-07-18T00:00:00.000Z", updatedAt: "2026-07-18T00:00:00.000Z", ...patch,
  };
}

function seedQuestions(questions: QuestionRecord[]) {
  useStore.setState({ questions });
}

beforeEach(() => {
  useStore.setState(makeSeed());
});

describe("bulk tag operations", () => {
  beforeEach(() => seedQuestions([q({ id: "1", tags: ["cardiology"] }), q({ id: "2", tags: [] }), q({ id: "3", tags: ["renal"] })]));

  it("add normalizes and dedupes; never touches unselected", () => {
    useStore.getState().bulkTagQuestions(["1", "2"], { add: ["High Yield", "cardiology"] });
    const byId = new Map(useStore.getState().questions.map((x) => [x.id, x.tags]));
    expect(byId.get("1")).toEqual(["cardiology", "high yield"]);
    expect(byId.get("2")).toEqual(["high yield", "cardiology"]);
    expect(byId.get("3")).toEqual(["renal"]);
  });
  it("remove strips the given tags", () => {
    useStore.getState().bulkTagQuestions(["1"], { remove: ["CARDIOLOGY"] });
    expect(useStore.getState().questions.find((x) => x.id === "1")?.tags).toEqual([]);
  });
  it("replace overwrites the whole tag set", () => {
    useStore.getState().bulkTagQuestions(["3"], { replace: ["Micro", "micro", "ethics"] });
    expect(useStore.getState().questions.find((x) => x.id === "3")?.tags).toEqual(["micro", "ethics"]);
  });
  it("clear empties tags", () => {
    useStore.getState().bulkTagQuestions(["1", "3"], { clear: true });
    expect(useStore.getState().questions.map((x) => x.tags)).toEqual([[], [], []]);
  });
});

describe("tag rename / merge normalization", () => {
  it("renameTag matches case-insensitively and folds into the target", () => {
    seedQuestions([q({ id: "1", tags: ["cardio"] }), q({ id: "2", tags: ["cardio", "cardiology"] })]);
    useStore.getState().renameTag("CARDIO", "Cardiology");
    expect(useStore.getState().questions.map((x) => x.tags)).toEqual([["cardiology"], ["cardiology"]]);
  });
  it("mergeTags folds several tags into one, deduping", () => {
    seedQuestions([q({ id: "1", tags: ["heart", "cardio", "renal"] })]);
    useStore.getState().mergeTags(["heart", "cardio"], "cardiology");
    expect(useStore.getState().questions[0].tags).toEqual(["cardiology", "renal"]);
  });
});

describe("saved filter presets", () => {
  it("add / update / remove round-trips through state", () => {
    const id = useStore.getState().addSavedQuestionFilter({ name: "Cardio", criteria: { tags: ["Cardiology"] }, ordering: "random" });
    let preset = useStore.getState().savedQuestionFilters.find((f) => f.id === id);
    expect(preset?.name).toBe("Cardio");
    expect(preset?.criteria.tags).toEqual(["cardiology"]);
    useStore.getState().updateSavedQuestionFilter(id, { name: "Cardio finals" });
    preset = useStore.getState().savedQuestionFilters.find((f) => f.id === id);
    expect(preset?.name).toBe("Cardio finals");
    useStore.getState().removeSavedQuestionFilter(id);
    expect(useStore.getState().savedQuestionFilters.find((f) => f.id === id)).toBeUndefined();
  });
});

describe("createQuestionSetFromFilter — deterministic immutable snapshot", () => {
  beforeEach(() => seedQuestions([
    q({ id: "1", tags: ["cardiology"], questionNumber: 2 }),
    q({ id: "2", tags: ["cardiology"], questionNumber: 1 }),
    q({ id: "3", tags: ["renal"], questionNumber: 3 }),
  ]));

  it("captures the filtered pool, ordering, and filter snapshot", () => {
    const setId = useStore.getState().createQuestionSetFromFilter({
      title: "Cardio", criteria: { tags: ["cardiology"] }, ordering: "question-number",
    });
    const set = useStore.getState().questionSets.find((x) => x.id === setId)!;
    expect(set.questionIds).toEqual(["2", "1"]); // ordered by question number
    expect(set.filterSnapshot?.tags).toEqual(["cardiology"]);
    expect(set.ordering).toBe("question-number");
  });

  it("membership is frozen — later tag changes never move it", () => {
    const setId = useStore.getState().createQuestionSetFromFilter({ title: "Cardio", criteria: { tags: ["cardiology"] }, ordering: "import" });
    const before = useStore.getState().questionSets.find((x) => x.id === setId)!.questionIds;
    // retag question 1 away from cardiology
    useStore.getState().bulkTagQuestions(["1"], { replace: ["renal"] });
    const after = useStore.getState().questionSets.find((x) => x.id === setId)!.questionIds;
    expect(after).toEqual(before);
  });

  it("scopeIds restricts the snapshot to the on-screen (mode/id-scoped) pool", () => {
    // Simulates mapping-review / mode-pill scoping: only these ids are on screen.
    const setId = useStore.getState().createQuestionSetFromFilter({ title: "Scoped", criteria: {}, ordering: "import", scopeIds: ["1", "3"] });
    const set = useStore.getState().questionSets.find((x) => x.id === setId)!;
    expect(set.questionIds).toEqual(["1", "3"]);
  });

  it("random ordering stores a seed that reproduces the order", () => {
    const setId = useStore.getState().createQuestionSetFromFilter({ title: "Rnd", criteria: {}, ordering: "random", seed: "fixed-seed" });
    const set = useStore.getState().questionSets.find((x) => x.id === setId)!;
    expect(set.seed).toBe("fixed-seed");
    // Rebuild with the same seed → identical order.
    const setId2 = useStore.getState().createQuestionSetFromFilter({ title: "Rnd2", criteria: {}, ordering: "random", seed: "fixed-seed" });
    const set2 = useStore.getState().questionSets.find((x) => x.id === setId2)!;
    expect(set2.questionIds).toEqual(set.questionIds);
  });
});

describe("load-time tag normalization (no schema bump)", () => {
  it("canonicalizes mixed-case/duplicate tags on migrate and defaults presets", () => {
    const migrated = migratePersistedState({
      questions: [{ id: "1", source: "manual", stem: "S", options: [], status: "unseen", tags: ["Cardiology", "cardiology", " RENAL "], attempts: [], createdAt: "t", updatedAt: "t" }],
    }, 32);
    expect(migrated.questions[0].tags).toEqual(["cardiology", "renal"]);
    expect(Array.isArray(migrated.savedQuestionFilters)).toBe(true);
  });
});

describe("large library performance", () => {
  it("bulk-tags 20,000 questions and filters them well under a second", () => {
    const big = Array.from({ length: 20000 }, (_, i) => q({ id: `q${i}`, tags: i % 2 === 0 ? ["cardiology"] : ["renal"], status: i % 3 === 0 ? "incorrect" : "unseen" }));
    seedQuestions(big);
    const t0 = performance.now();
    useStore.getState().bulkTagQuestions(big.filter((_, i) => i % 2 === 0).map((x) => x.id), { add: ["high-yield"] });
    const tagged = performance.now() - t0;
    const t1 = performance.now();
    const result = applyQuestionFilter(useStore.getState().questions, { tags: ["cardiology", "high-yield"], incorrect: true });
    const filtered = performance.now() - t1;
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => r.tags.includes("cardiology") && r.tags.includes("high-yield") && r.status === "incorrect")).toBe(true);
    expect(tagged).toBeLessThan(1000);
    expect(filtered).toBeLessThan(500);
  });
});

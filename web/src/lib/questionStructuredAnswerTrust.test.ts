import { describe, expect, it } from "vitest";
import { importFromCsv, importFromJson, resolveStructuredAnswer } from "./questionImport";
import { draftImportStatus } from "./questionImportTrust";
import { questionMappingStatus, validateQuestionRecord, type QuestionOption } from "./questions";
import { buildQuizPool } from "./quiz";

const OPTIONS: QuestionOption[] = [
  { key: "A", text: "Mast cells" },
  { key: "B", text: "CD4+ T lymphocytes" },
  { key: "C", text: "B lymphocytes" },
  { key: "D", text: "Eosinophils" },
  { key: "E", text: "Neutrophils" },
];

describe("structured explicit-answer trust policy", () => {
  it.each([
    ["A", "resolved", "A", false, "answer.structured-explicit-letter"],
    ["(A)", "resolved", "A", false, "answer.structured-explicit-letter"],
    ["Answer: A", "resolved", "A", false, "answer.structured-explicit-letter"],
    ["A. Mast cells", "resolved", "A", false, "answer.structured-explicit-letter-exact"],
    ["A. Mast cell", "candidate", "A", true, "answer.explicit-letter-text-drift"],
    ["A. Mast cells (histamine release)", "candidate", "A", true, "answer.explicit-letter-text-drift"],
    ["A because histamine is released", "resolved", "A", false, "answer.structured-explicit-letter-rationale"],
    ["A. Mast cells because histamine is released", "candidate", "A", true, "answer.explicit-letter-text-drift"],
    ["Mast cells", "resolved", "A", false, "answer.structured-unique-text"],
  ] as const)("%s → %s", (answer, status, key, needsReview, ruleId) => {
    const resolution = resolveStructuredAnswer(answer, OPTIONS);
    expect(resolution).toMatchObject({ status, candidateKey: key, needsReview, ruleId });
    expect(resolution.evidence).toBe(answer);
  });

  it("blocks an exact cross-option contradiction while preserving both keys", () => {
    const resolution = resolveStructuredAnswer("A. B lymphocytes", OPTIONS);
    expect(resolution).toMatchObject({
      status: "conflict",
      candidateKey: undefined,
      conflictingKey: "C",
      needsReview: true,
      ruleId: "conflict.answer-letter-vs-text",
    });
    expect(resolution.status).toBe("conflict");
    if (resolution.status === "conflict") {
      expect(resolution.warning).toContain("letter A");
      expect(resolution.warning).toContain("option C");
    }
  });

  it.each([
    ["Mast cells", [{ key: "A", text: "Mast cells" }, { key: "B", text: "Mast cells" }], "answer.structured-ambiguous-text"],
    ["garbage", OPTIONS, "answer.structured-unresolved"],
    ["F", OPTIONS, "answer.structured-invalid-key"],
  ] as const)("leaves %s unresolved and never defaults to A", (answer, options, ruleId) => {
    expect(resolveStructuredAnswer(answer, [...options])).toMatchObject({
      status: "unresolved",
      candidateKey: undefined,
      needsReview: true,
      ruleId,
    });
  });

  it("preserves mixed B-D-A-C-E keys", () => {
    expect(["B", "D", "A", "C", "E"].map((answer) =>
      resolveStructuredAnswer(answer, OPTIONS).candidateKey,
    )).toEqual(["B", "D", "A", "C", "E"]);
  });

  it("routes CSV drift candidates to inspection without making them runnable", () => {
    const csv = [
      "question,a,b,c,answer",
      '"Which cell releases histamine?","Mast cells","CD4+ T lymphocytes","B lymphocytes","A. Mast cell"',
    ].join("\n");
    const draft = importFromCsv(csv).drafts[0];
    expect(draft).toMatchObject({
      correctKey: "A",
      needsReview: true,
      answerEvidence: "A. Mast cell",
    });
    expect(draft.parserRuleIds).toContain("answer.explicit-letter-text-drift");
    expect(draftImportStatus(draft)).toBe("review-suggested");
    const built = validateQuestionRecord({
      source: "imported", stem: draft.stem, options: draft.options,
      correctKey: draft.correctKey, needsReview: draft.needsReview,
      extraction: { reviewed: true, parserRuleIds: draft.parserRuleIds, warnings: draft.warnings },
    });
    expect(built.ok).toBe(true);
    expect(built.value && questionMappingStatus(built.value)).not.toBe("ready");
    expect(built.value && buildQuizPool([built.value], { count: 10, status: "all" })).toEqual([]);
  });

  it("gives JSON the same drift and conflict semantics", () => {
    const base = { stem: "Which cell?", options: OPTIONS };
    const result = importFromJson(JSON.stringify([
      { ...base, answer: "A. Mast cell" },
      { ...base, answer: "A. B lymphocytes" },
      { ...base, answer: "unknown" },
    ]));
    expect(result.drafts.map((draft) => draft.correctKey)).toEqual(["A", undefined, undefined]);
    expect(result.drafts.map((draft) => draft.parserRuleIds?.at(-1))).toEqual([
      "answer.explicit-letter-text-drift",
      "conflict.answer-letter-vs-text",
      "answer.structured-unresolved",
    ]);
    expect(result.drafts.every((draft) => draftImportStatus(draft) !== "ready")).toBe(true);
  });
});

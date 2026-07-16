import { describe, it, expect } from "vitest";
import { parseQuestionText, parseQuestionBlocks } from "./questionParse";
import { questionMappingStatus, validateQuestionRecord } from "./questions";

// Q1 — Explicit-Answer Trust and Mapping Reliability.
// An explicit answer letter must never be silently discarded merely because
// the trailing answer text does not exactly copy the option; harmless drift is
// preserved as a source-selected candidate routed to inspection, while a true
// contradiction (tail exactly matches a *different* option) stays unresolved.

const q = (answerLine: string, opts: Record<string, string>) =>
  parseQuestionText(
    `1. Which cell primarily mediates a positive PPD skin test?\n` +
      Object.entries(opts).map(([k, v]) => `${k}. ${v}`).join("\n") +
      `\n${answerLine}`,
  );

const STD = { A: "Mast cells", B: "CD4+ T lymphocytes", C: "B lymphocytes", D: "Eosinophils", E: "Neutrophils" };
const ruleSet = (d: ReturnType<typeof parseQuestionText>) => new Set(d.parserRuleIds ?? []);

describe("Q1 explicit-answer trust policy", () => {
  it("A — explicit letter + exact tail → candidate A, no review, no conflict", () => {
    const d = q("Answer: A. Mast cells", STD);
    expect(d.correctKey).toBe("A");
    expect(d.needsReview).not.toBe(true);
    expect(ruleSet(d).has("conflict.answer-letter-vs-text")).toBe(false);
  });

  it("B — singular drift → candidate A, inspection required, not conflict", () => {
    const d = q("Answer: A. Mast cell", STD);
    expect(d.correctKey).toBe("A");
    expect(d.needsReview).toBe(true);
    expect(ruleSet(d).has("answer.explicit-letter-text-drift")).toBe(true);
    expect(ruleSet(d).has("conflict.answer-letter-vs-text")).toBe(false);
  });

  it("C — parenthetical drift → candidate A, inspection required", () => {
    const d = q("Answer: A. Mast cells (histamine)", STD);
    expect(d.correctKey).toBe("A");
    expect(d.needsReview).toBe(true);
    expect(ruleSet(d).has("answer.explicit-letter-text-drift")).toBe(true);
  });

  it("D — explanatory drift → candidate A preserved (inspection unless a rationale form applies)", () => {
    const d = q("Answer: A. Mast cells because they release histamine", STD);
    expect(d.correctKey).toBe("A");
  });

  it("E — true cross-option conflict → no runnable key, both evidences preserved", () => {
    const d = q("Answer: A. Mast cells", { A: "Neutrophils", B: "CD4+ T lymphocytes", C: "Mast cells", D: "Eosinophils" });
    expect(d.correctKey).toBeUndefined();
    expect(d.needsReview).toBe(true);
    expect(ruleSet(d).has("conflict.answer-letter-vs-text")).toBe(true);
    // both the explicit letter (A) and the matched option (C) survive in evidence
    const evidence = `${d.answerEvidence ?? ""} ${d.warnings.join(" ")}`;
    expect(evidence).toContain("A");
    expect(evidence).toContain("C");
  });

  it("F — letter only → candidate A, source-explicit", () => {
    const d = q("Answer: A", STD);
    expect(d.correctKey).toBe("A");
    expect(d.needsReview).not.toBe(true);
  });

  it("G — mixed answer-key sequence B,D,A,C,E is preserved (never collapsed to all-A)", () => {
    const answers = ["B", "D", "A", "C", "E"];
    const block = answers
      .map((ans, i) => `${i + 1}. Question ${i + 1}?\nA. alpha${i}\nB. beta${i}\nC. gamma${i}\nD. delta${i}\nE. epsilon${i}\nAnswer: ${ans}`)
      .join("\n\n");
    const drafts = parseQuestionBlocks(block);
    expect(drafts.map((d) => d.correctKey)).toEqual(answers);
  });

  it("H — unknown/garbage answer → never A, no false key", () => {
    for (const bad of ["Answer: Z", "Answer: ?", "Answer: banana"]) {
      const d = q(bad, STD);
      expect(d.correctKey).toBeUndefined();
    }
  });

  it("J — ambiguous answer text (matches two options) → unresolved", () => {
    const d = q("Answer: Mast cells", { A: "Mast cells", B: "Mast cells", C: "Eosinophils" });
    expect(d.correctKey).toBeUndefined();
    expect(d.needsReview).toBe(true);
  });

  it("persisted safety — a drift candidate is NOT canonically ready", () => {
    const d = q("Answer: A. Mast cell", STD);
    const built = validateQuestionRecord({
      source: "import", stem: d.stem, options: d.options,
      correctKey: d.correctKey, needsReview: d.needsReview,
      extraction: { reviewed: true },
    });
    expect(built.ok).toBe(true);
    if (built.ok && built.value) {
      expect(built.value.correctKey).toBe("A");            // candidate preserved
      expect(questionMappingStatus(built.value)).not.toBe("ready"); // never runnable pre-confirm
    }
  });

  it("persisted readiness — an exact/letter-only answer can become ready once reviewed", () => {
    const d = q("Answer: A. Mast cells", STD);
    const built = validateQuestionRecord({
      source: "import", stem: d.stem, options: d.options,
      correctKey: d.correctKey, needsReview: d.needsReview,
      extraction: { reviewed: true },
    });
    expect(built.ok).toBe(true);
    if (built.ok && built.value) expect(questionMappingStatus(built.value)).toBe("ready");
  });
});

import { describe, expect, it } from "vitest";
import { cleanExplanationText } from "./questionExplanation";

const ppdQuestion = {
  stem: "A 36-year-old man with tuberculosis exposure has a positive PPD skin test. Which cells mediate this reaction?",
  options: [
    { key: "A", text: "B lymphocytes" },
    { key: "B", text: "CD4+ T lymphocytes" },
    { key: "C", text: "Mast cells" },
    { key: "D", text: "Eosinophils" },
    { key: "E", text: "Neutrophils" },
  ],
  correctKey: "B",
};

describe("cleanExplanationText", () => {
  it("reduces the exact contaminated PPD block to its teaching explanation", () => {
    const raw = [
      ppdQuestion.stem,
      "A. B lymphocytes",
      "B. CD4+ T lymphocytes",
      "C. Mast cells",
      "D. Eosinophils",
      "E. Neutrophils",
      "Answer: B. CD4+ T lymphocytes",
      "Explanation: The PPD test is a type IV hypersensitivity reaction mediated by Th1 CD4+ T cells and macrophages.",
    ].join("\n");

    expect(cleanExplanationText(raw, ppdQuestion)).toBe(
      "The PPD test is a type IV hypersensitivity reaction mediated by Th1 CD4+ T cells and macrophages.",
    );
  });

  it("removes objective/source clutter but preserves rationale and teaching-point prose", () => {
    const raw = [
      "Explanation: Delayed hypersensitivity is T-cell mediated.",
      "Learning Objective: Recognize hypersensitivity mechanisms.",
      "Source: Week 4 practice set",
      "Teaching point: Macrophage activation follows Th1 signaling.",
    ].join("\n");
    expect(cleanExplanationText(raw, ppdQuestion)).toBe([
      "Delayed hypersensitivity is T-cell mediated.",
      "Macrophage activation follows Th1 signaling.",
    ].join("\n"));
  });

  it("returns empty when the raw value contains duplicated structure only", () => {
    const raw = [
      ppdQuestion.stem,
      "A. B lymphocytes",
      "B. CD4+ T lymphocytes",
      "C. Mast cells",
      "D. Eosinophils",
      "E. Neutrophils",
      "Answer: B. CD4+ T lymphocytes",
    ].join("\n");
    expect(cleanExplanationText(raw, ppdQuestion)).toBe("");
  });

  it("is idempotent on already-clean prose", () => {
    const clean = "The reaction is mediated by Th1 cells and macrophages.";
    expect(cleanExplanationText(clean, ppdQuestion)).toBe(clean);
    expect(cleanExplanationText(cleanExplanationText(clean, ppdQuestion), ppdQuestion)).toBe(clean);
  });
});

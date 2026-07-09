import { describe, expect, it } from "vitest";
import { normalizeTags, suggestCategory, USMLE_CATEGORIES } from "./taxonomy";

describe("restrained USMLE auto-categorization", () => {
  it("auto-assigns high confidence for a clear multi-signal match", () => {
    const result = suggestCategory(
      "A patient with recurrent Neisseria infections; complement C5-C9 (MAC) deficiency is suspected. Which immunoglobulin activates complement?",
    );
    expect(result.category).toBe("Immunology");
    expect(result.confidence).toBe("high");
    expect(result.autoAssign).toBe(true);
  });

  it("suggests (not auto-assigns) on a single weak signal", () => {
    const result = suggestCategory("The patient was given a standard dose.");
    expect(result.category).toBe("Pharmacology");
    expect(result.confidence).toBe("medium");
    expect(result.autoAssign).toBe(false);
  });

  it("leaves uncategorized when nothing matches — never invents a bucket", () => {
    const result = suggestCategory("A neutral sentence about the weather and lunch.");
    expect(result.category).toBeUndefined();
    expect(result.confidence).toBe("low");
    expect(result.autoAssign).toBe(false);
  });

  it("only ever returns categories from the fixed vocabulary", () => {
    const result = suggestCategory("cardiac myocardial infarction with ST elevation and a coronary occlusion");
    expect(result.category && USMLE_CATEGORIES.includes(result.category)).toBe(true);
    expect(result.category).toBe("Cardiovascular");
  });

  it("surfaces restrained tags from matched keywords", () => {
    const result = suggestCategory("recurrent Neisseria infection with complement deficiency");
    expect(result.tags).toContain("Neisseria");
    expect(result.tags).toContain("complement");
    expect(result.tags.length).toBeLessThanOrEqual(4);
  });
});

describe("tag normalization", () => {
  it("trims, dedupes case-insensitively, and drops blanks", () => {
    expect(normalizeTags([" SCID ", "scid", "", "T-cell", "t-cell", "Immuno"]))
      .toEqual(["SCID", "T-cell", "Immuno"]);
  });
});

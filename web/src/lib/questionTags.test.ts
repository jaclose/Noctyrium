import { describe, expect, it } from "vitest";
import {
  computeTagCounts, mergeTagsInList, normalizeTag, normalizeTagList, parseTagInput,
} from "./questionTags";
import type { QuestionRecord } from "./questions";

function q(tags: string[], id = "q"): QuestionRecord {
  return {
    id, source: "manual", stem: "Stem", options: [], status: "unseen", tags,
    attempts: [], createdAt: "2026-07-18T00:00:00.000Z", updatedAt: "2026-07-18T00:00:00.000Z",
  };
}

describe("normalizeTag", () => {
  it("lowercases, trims, collapses internal whitespace, and caps length", () => {
    expect(normalizeTag("  Cardiology ")).toBe("cardiology");
    expect(normalizeTag("CARDIOLOGY")).toBe("cardiology");
    expect(normalizeTag("High   Yield")).toBe("high yield");
    expect(normalizeTag("week-4")).toBe("week-4");
    expect(normalizeTag("a".repeat(200)).length).toBe(64);
  });
  it("returns empty for blanks and non-strings", () => {
    expect(normalizeTag("   ")).toBe("");
    expect(normalizeTag(null)).toBe("");
    expect(normalizeTag(42)).toBe("");
  });
  it("is idempotent at the length cap — no trailing space when the cap lands on one", () => {
    const spaced = `${"a".repeat(63)} b`; // 65 chars; cap falls on the space at index 63
    const once = normalizeTag(spaced);
    expect(once).toBe("a".repeat(63));
    expect(once.endsWith(" ")).toBe(false);
    expect(normalizeTag(once)).toBe(once);
  });
});

describe("normalizeTagList", () => {
  it("collapses case/whitespace variants into one tag, order-preserving", () => {
    expect(normalizeTagList(["Cardiology", "cardiology", " CARDIOLOGY "])).toEqual(["cardiology"]);
    expect(normalizeTagList(["renal", "Ethics", "renal", "", "  "])).toEqual(["renal", "ethics"]);
  });
  it("returns [] for non-arrays", () => {
    expect(normalizeTagList("nope")).toEqual([]);
    expect(normalizeTagList(undefined)).toEqual([]);
  });
});

describe("parseTagInput", () => {
  it("splits comma/semicolon/newline and normalizes", () => {
    expect(parseTagInput("Cardiology, renal; High Yield\nCARDIOLOGY")).toEqual(["cardiology", "renal", "high yield"]);
  });
});

describe("computeTagCounts", () => {
  it("counts by canonical tag, ranked by count then name", () => {
    const counts = computeTagCounts([
      q(["cardiology", "renal"], "1"),
      q(["cardiology"], "2"),
      q(["ethics"], "3"),
    ]);
    expect(counts).toEqual([
      { tag: "cardiology", count: 2 },
      { tag: "ethics", count: 1 },
      { tag: "renal", count: 1 },
    ]);
  });
});

describe("mergeTagsInList", () => {
  it("folds every `from` tag into `into` and dedupes when the target already exists", () => {
    expect(mergeTagsInList(["cardio", "renal", "heart"], new Set(["cardio", "heart"]), "cardiology"))
      .toEqual(["cardiology", "renal"]);
    // merging into an already-present tag collapses to one
    expect(mergeTagsInList(["cardiology", "cardio"], new Set(["cardio"]), "cardiology"))
      .toEqual(["cardiology"]);
  });
});

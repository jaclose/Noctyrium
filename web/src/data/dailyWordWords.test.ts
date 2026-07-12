import { describe, expect, it } from "vitest";
import { fnv1a32 } from "../lib/dailyWord";
import {
  DAILY_WORD_ALLOWED_GUESSES,
  DAILY_WORD_ANSWERS,
  DAILY_WORD_LIST_METADATA,
  DAILY_WORD_LIST_SENTINEL,
  WORD_LIST_VERSION,
} from "./dailyWordWords";

describe("AXOM Daily Word general-1 curation", () => {
  it("publishes explicit original provenance and a build sentinel", () => {
    expect(WORD_LIST_VERSION).toBe("general-1");
    expect(DAILY_WORD_LIST_METADATA.provenance).toMatch(/Original AXOM curation/);
    expect(DAILY_WORD_LIST_METADATA.affiliation).toMatch(/No affiliation/);
    expect(DAILY_WORD_LIST_SENTINEL).toBe("AXOM_WORD_LIST_SENTINEL_GENERAL_1");
  });

  it("contains unique normalized answers and a larger unique allowed dictionary", () => {
    const isWord = (word: string) => /^[A-Z]{5}$/.test(word);
    expect(DAILY_WORD_ANSWERS.every(isWord)).toBe(true);
    expect(DAILY_WORD_ALLOWED_GUESSES.every(isWord)).toBe(true);
    expect(new Set(DAILY_WORD_ANSWERS).size).toBe(DAILY_WORD_ANSWERS.length);
    expect(new Set(DAILY_WORD_ALLOWED_GUESSES).size).toBe(DAILY_WORD_ALLOWED_GUESSES.length);
    expect(DAILY_WORD_ALLOWED_GUESSES.length).toBeGreaterThan(DAILY_WORD_ANSWERS.length);
    const allowed = new Set(DAILY_WORD_ALLOWED_GUESSES);
    expect(DAILY_WORD_ANSWERS.every((answer) => allowed.has(answer))).toBe(true);
  });

  it("pins answer-list order within general-1", () => {
    expect(DAILY_WORD_ANSWERS).toHaveLength(241);
    expect(DAILY_WORD_ANSWERS.slice(0, 3)).toEqual(["ABIDE", "ACORN", "ADAPT"]);
    expect(DAILY_WORD_ANSWERS.slice(-3)).toEqual(["WORTH", "WRITE", "YOUTH"]);
    expect(fnv1a32(DAILY_WORD_ANSWERS.join("\n"))).toBe(353680312);
  });
});

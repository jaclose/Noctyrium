import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { fnv1a32, selectDailyWordAnswer } from "../lib/dailyWord";
import {
  DAILY_WORD_ALLOWED_GUESSES,
  DAILY_WORD_ANSWERS,
  DAILY_WORD_GENERAL_1_ANSWERS,
  DAILY_WORD_LIST_METADATA,
  DAILY_WORD_LIST_SENTINEL,
  WORD_LIST_VERSION,
  dailyWordAnswersForVersion,
} from "./dailyWordWords";

describe("AXOM Daily Word general-2 dictionary", () => {
  it("publishes pinned permissive provenance, checksums, and a build sentinel", () => {
    expect(WORD_LIST_VERSION).toBe("general-2");
    expect(DAILY_WORD_LIST_METADATA.provenance).toMatch(/SCOWLv2 2026\.02\.25/);
    expect(DAILY_WORD_LIST_METADATA.upstreamCommit).toBe("7e99edab8e32f9f9ea2b15f249ca8d4d67237410");
    expect(DAILY_WORD_LIST_METADATA.license).toMatch(/SCOWL permissive notice/);
    expect(DAILY_WORD_LIST_METADATA.affiliation).toMatch(/No affiliation/);
    expect(DAILY_WORD_LIST_SENTINEL).toBe("AXOM_WORD_LIST_SENTINEL_GENERAL_2_SCOWL_2026_02_25");
    expect(sha256(DAILY_WORD_ANSWERS)).toBe(DAILY_WORD_LIST_METADATA.answersSha256);
    expect(sha256(DAILY_WORD_ALLOWED_GUESSES)).toBe(DAILY_WORD_LIST_METADATA.allowedGuessesSha256);
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
    expect(allowed.has("HELLO")).toBe(true);
    expect(allowed.has("ENVOY")).toBe(true);
    expect(DAILY_WORD_ANSWERS).toContain("HELLO");
    expect(DAILY_WORD_ANSWERS).toContain("ENVOY");
  });

  it("pins the general-2 list sizes and deterministic order", () => {
    expect(DAILY_WORD_ANSWERS).toHaveLength(1_981);
    expect(DAILY_WORD_ALLOWED_GUESSES).toHaveLength(8_659);
    expect(DAILY_WORD_ANSWERS.slice(0, 3)).toEqual(["ABACK", "ABATE", "ABBEY"]);
    expect(DAILY_WORD_ANSWERS.slice(-3)).toEqual(["YOUNG", "YOUTH", "ZEBRA"]);
    expect(fnv1a32(DAILY_WORD_ANSWERS.join("\n"))).toBe(3_789_948_516);
    expect(fnv1a32(DAILY_WORD_ALLOWED_GUESSES.join("\n"))).toBe(1_692_984_079);
  });

  it("retains the exact general-1 answer sequence for active historical puzzles", () => {
    expect(DAILY_WORD_GENERAL_1_ANSWERS).toHaveLength(241);
    expect(fnv1a32(DAILY_WORD_GENERAL_1_ANSWERS.join("\n"))).toBe(353680312);
    expect(dailyWordAnswersForVersion("general-1")).toBe(DAILY_WORD_GENERAL_1_ANSWERS);
    expect(dailyWordAnswersForVersion("general-2")).toBe(DAILY_WORD_ANSWERS);
    expect(dailyWordAnswersForVersion("unknown")).toBeUndefined();
    const legacyId = "daily-word:general-1:2026-07-01";
    expect(selectDailyWordAnswer(legacyId, dailyWordAnswersForVersion("general-1")!)).toBe("SHAPE");
    expect(selectDailyWordAnswer(legacyId, DAILY_WORD_ANSWERS)).not.toBe("SHAPE");
  });
});

function sha256(words: readonly string[]): string {
  return createHash("sha256").update(`${words.join("\n")}\n`).digest("hex");
}

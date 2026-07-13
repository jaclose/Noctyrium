import { describe, expect, it } from "vitest";
import { DAILY_WORD_PUBLIC_METADATA } from "./dailyWordMetadata";

describe("eager-safe Daily Word metadata", () => {
  it("exposes help facts without the lazy bundle sentinel", () => {
    expect(DAILY_WORD_PUBLIC_METADATA).toEqual({
      version: "general-2",
      language: "en-US",
      sourceName: "SCOWLv2",
      sourceRelease: "2026.02.25",
      upstream: "https://github.com/en-wl/wordlist",
      upstreamCommit: "7e99edab8e32f9f9ea2b15f249ca8d4d67237410",
      answerCount: 1_981,
      allowedGuessCount: 8_659,
      licensePath: "public/third-party/DAILY_WORD_SCOWL_LICENSE.txt",
      localValidation: true,
    });
    expect(JSON.stringify(DAILY_WORD_PUBLIC_METADATA)).not.toMatch(/sentinel|AXOM_WORD_LIST_SENTINEL/i);
  });
});

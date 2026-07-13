import { describe, expect, it } from "vitest";
import type { ParsedQuestionDraft } from "./questionParse";
import { draftImportStatus, summarizeImportDrafts } from "./questionImportTrust";

const draft = (patch: Partial<ParsedQuestionDraft>): ParsedQuestionDraft => ({
  stem: "Sanitized question?",
  options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }],
  confidence: "high",
  warnings: [],
  ...patch,
});

describe("question import trust summary", () => {
  it("keeps unresolved, review-suggested, and ready states distinct", () => {
    const ready = draft({ correctKey: "B", explanation: "Because beta." });
    const suggested = draft({ correctKey: "A", confidence: "medium" });
    const unresolved = draft({ needsReview: true, confidence: "low" });
    expect([ready, suggested, unresolved].map(draftImportStatus)).toEqual([
      "ready", "review-suggested", "unresolved",
    ]);
    expect(summarizeImportDrafts([ready, suggested, unresolved])).toEqual({
      ready: 1,
      reviewSuggested: 1,
      unresolved: 1,
      explanationsFound: 1,
      explanationsMissing: 2,
      sourceConfidence: { high: 1, medium: 1, low: 1 },
    });
  });
});


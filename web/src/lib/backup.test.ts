import { describe, expect, it } from "vitest";
import { mergeStates, parseImport, toPortableState } from "./backup";
import { makeSeed } from "./seed";

describe("portable backup safety", () => {
  it("keeps question-bank records and import diagnostics in the portable state", () => {
    const state = makeSeed();
    state.questions = [{
      id: "q1",
      source: "imported",
      stem: "Stem",
      options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }],
      correctKey: "B",
      correctAnswerText: "Beta",
      explanation: "Because beta.",
      status: "unseen",
      tags: [],
      attempts: [],
      extraction: {
        confidence: "high",
        reviewed: true,
        overallImportConfidence: 0.96,
        parserRuleIds: ["ANSWER.INLINE_LETTER_TEXT"],
        sourceSnippet: "Answer: B. Beta",
      },
      createdAt: "2026-07-10T00:00:00.000Z",
      updatedAt: "2026-07-10T00:00:00.000Z",
    }];
    const portable = toPortableState(state);
    expect(portable.questions[0].extraction?.sourceSnippet).toContain("Answer: B");
    expect(portable.questions[0].correctAnswerText).toBe("Beta");
  });

  it("parses an exported payload without dropping question-bank collections", () => {
    const state = makeSeed();
    state.documents = [{
      id: "doc1", title: "Source", fileName: "source.txt", fileType: "text",
      uploadedAt: "2026-07-10T00:00:00.000Z", rawText: "text", sizeBytes: 4,
      checksum: "abc", tags: [], linkedQuestionSetIds: ["set1"], libraryOnly: false,
    }];
    state.questionSets = [{
      id: "set1", title: "Set", sourceDocumentIds: ["doc1"], createdAt: "2026-07-10T00:00:00.000Z",
      questionIds: [], tags: [], aiEnhanced: false, parserWarnings: [],
    }];
    const parsed = parseImport(JSON.stringify({ _app: "AXOM", ...toPortableState(state) }));
    expect(parsed.documents[0].checksum).toBe("abc");
    expect(parsed.questionSets[0].sourceDocumentIds).toEqual(["doc1"]);
  });

  it("merge import is additive, keeps the current profile, and lets newer records win", () => {
    const current = makeSeed();
    current.profile.name = "Current user";
    current.questions = [{
      id: "q1", source: "manual", stem: "Current stem", options: [], status: "unseen", tags: [], attempts: [],
      createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-02T00:00:00.000Z",
    }];
    const imported = makeSeed();
    imported.profile.name = "Imported user";
    imported.questions = [
      { ...current.questions[0], stem: "Older imported stem", updatedAt: "2026-07-01T00:00:00.000Z" },
      { ...current.questions[0], id: "q2", stem: "New question", updatedAt: "2026-07-03T00:00:00.000Z" },
    ];
    const merged = mergeStates(current, imported);
    expect(merged.profile.name).toBe("Current user");
    expect(merged.questions).toHaveLength(2);
    expect(merged.questions.find((question) => question.id === "q1")?.stem).toBe("Current stem");
    expect(merged.questions.find((question) => question.id === "q2")?.stem).toBe("New question");
  });
});

import { describe, expect, it } from "vitest";
import type { SourceDocument } from "./library";
import { assignDraftProvenancePages, sourceCandidates, type DraftWithProvenance } from "./questionProvenance";

describe("question provenance", () => {
  it("attributes question, answer, and explanation evidence to independent pages", () => {
    const draft: DraftWithProvenance = {
      stem: "Which immune cell coordinates delayed hypersensitivity after PPD exposure?",
      options: [
        { key: "A", text: "B lymphocytes" },
        { key: "B", text: "CD4+ T lymphocytes" },
      ],
      explanation: "Delayed hypersensitivity is coordinated by Th1-polarized CD4+ T lymphocytes.",
      answerEvidence: "Answer: B. CD4+ T lymphocytes",
      sourceSnippet: "legacy combined source remains intact",
    };
    const pages = [
      `Lecture heading\n${draft.stem}\nA. B lymphocytes\nB. CD4+ T lymphocytes`,
      `Answer section\n${draft.answerEvidence}`,
      `Explanation section\n${draft.explanation}`,
    ];

    assignDraftProvenancePages([draft], pages);

    expect(draft.questionSourcePage).toBe(1);
    expect(draft.answerEvidencePage).toBe(2);
    expect(draft.explanationSourcePage).toBe(3);
    expect(draft.questionSourceSnippet).toContain(draft.stem);
    expect(draft.answerEvidenceSnippet).toBe(draft.answerEvidence);
    expect(draft.explanationSourceSnippet).toBe(draft.explanation);
    expect(draft.sourceSnippet).toBe("legacy combined source remains intact");
  });

  it("leaves an ambiguous question page unset instead of choosing the first match", () => {
    const repeated = "Which of the following findings best supports the diagnosis in this patient?";
    const draft: DraftWithProvenance = { stem: repeated, options: [{ key: "A", text: "Alpha" }] };
    assignDraftProvenancePages([draft], [`Page one ${repeated}`, `Page two ${repeated}`]);
    expect(draft.questionSourcePage).toBeUndefined();
    expect(draft.sourcePage).toBeUndefined();
    expect(draft.questionSourceSnippet).toBeUndefined();
  });

  it("returns exact grounded candidates without inventing an unanchored fallback", () => {
    const stem = "A sufficiently long exact question stem for source candidate matching.";
    const document: SourceDocument = {
      id: "doc",
      title: "Source",
      fileName: "source.pdf",
      fileType: "pdf",
      uploadedAt: "2026-07-12T00:00:00.000Z",
      rawText: stem,
      pageTexts: [`Before ${stem} after`, "Unrelated page"],
      sizeBytes: 100,
      tags: [],
      linkedQuestionSetIds: [],
      libraryOnly: true,
    };
    expect(sourceCandidates(document, "question", stem)).toEqual([
      expect.objectContaining({ kind: "question", page: 1, basis: "exact", snippet: expect.stringContaining(stem) }),
    ]);
    expect(sourceCandidates(document, "answer", "This evidence is not in the source")).toEqual([]);
  });

  it("offers bounded nearby source-grounded spans when bad evidence has a known question anchor", () => {
    const stem = "Which immune cell coordinates this delayed response?";
    const answerSection = "Answer evidence section\nCorrect answer: B. CD4+ T lymphocytes.";
    const document: SourceDocument = {
      id: "doc-nearby",
      title: "Source",
      fileName: "source.pdf",
      fileType: "pdf",
      uploadedAt: "2026-07-12T00:00:00.000Z",
      rawText: `${stem}\n\n${answerSection}`,
      pageTexts: [`${stem}\nA. B cells\nB. CD4+ cells\n\n${answerSection}`],
      sizeBytes: 100,
      tags: [],
      linkedQuestionSetIds: [],
      libraryOnly: false,
    };
    const candidates = sourceCandidates(document, "answer", "Wrong excerpt not found", { anchorNeedle: stem });
    expect(candidates.some((candidate) => candidate.basis === "nearby" && candidate.snippet.includes(answerSection))).toBe(true);
    expect(candidates.every((candidate) => document.pageTexts![candidate.page! - 1].includes(candidate.snippet))).toBe(true);
  });
});

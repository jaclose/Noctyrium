// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SourceDocument } from "../../lib/library";
import type { ParsedQuestionDraft } from "../../lib/questionParse";
import { ImportPanel, parseStoredDocument, preserveUserReviewedMappings } from "./ImportPanel";
import { importFromCsv, importFromJson } from "../../lib/questionImport";

const mocked = vi.hoisted(() => ({
  addDocument: vi.fn(),
  addQuestion: vi.fn(),
  addQuestionSet: vi.fn(),
  updateDocument: vi.fn(),
  documents: [] as SourceDocument[],
}));

vi.mock("../../lib/store", () => ({ useStore: () => mocked }));
vi.mock("../../lib/toast", () => ({ pushToast: vi.fn() }));
vi.mock("../../lib/ai", () => ({
  checkProviderHealth: vi.fn(async () => ({ ok: false, detail: "No provider" })),
  cleanExplanation: vi.fn(),
  enhanceQuestionSet: vi.fn(),
  generateQuestionDrafts: vi.fn(),
  loadAiSettings: vi.fn(() => ({ mode: "demo" })),
  mapAnswerFromText: vi.fn(),
  resolveActiveProvider: vi.fn(() => null),
}));

const draft: ParsedQuestionDraft = {
  stem: "Which option is correct?",
  options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }],
  correctKey: "B",
  correctAnswerText: "Beta",
  confidence: "high",
  warnings: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked.documents.splice(0);
  mocked.addQuestion.mockReturnValue({ ok: true, errors: [], id: "question-1" });
});
afterEach(cleanup);

describe("source-document-first import", () => {
  it("never records an unresolved mapping as reviewed even if confidence is malformed high", async () => {
    const user = userEvent.setup();
    render(<ImportPanel seed={{
      drafts: [{ ...draft, correctKey: undefined, correctAnswerText: undefined }],
      rawText: "Which option is correct?\nA. Alpha\nB. Beta",
      title: "Unresolved import",
      fileName: "unresolved.txt",
      fileType: "text",
    }} />);

    await user.click(screen.getByRole("button", { name: /^Save$/ }));
    expect(mocked.addQuestion).toHaveBeenCalledWith(expect.objectContaining({
      correctKey: undefined,
      extraction: expect.objectContaining({ reviewed: false, reviewedAt: undefined }),
    }));
  });

  it("summarizes ready, suggested, unresolved, and explanation coverage", () => {
    render(<ImportPanel seed={{
      drafts: [
        { ...draft, explanation: "Grounded rationale." },
        { ...draft, correctKey: "A", correctAnswerText: "Alpha", confidence: "medium" },
        { ...draft, correctKey: undefined, correctAnswerText: undefined, confidence: "low", needsReview: true },
      ],
      rawText: "Sanitized source",
      title: "Trust summary",
      fileName: "summary.txt",
      fileType: "text",
    }} />);

    expect(screen.getByText("Ready 1").textContent).toBe("Ready 1");
    expect(screen.getByText("Review suggested 1").textContent).toBe("Review suggested 1");
    expect(screen.getByText("Unresolved 1").textContent).toBe("Unresolved 1");
    expect(screen.getByText(/Explanations found/).textContent).toContain("1");
    expect(screen.getByRole("button", { name: "Approve ready (1)" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "Review suggested (1)" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "Repair unresolved (1)" }).hasAttribute("disabled")).toBe(false);
  });

  it("persists an explicit manual answer confirmation at medium confidence", async () => {
    const user = userEvent.setup();
    render(<ImportPanel seed={{
      drafts: [{
        ...draft,
        correctKey: undefined,
        correctAnswerText: undefined,
        confidence: "low",
        needsReview: true,
        questionDetectionConfidence: 0.7,
        answerDetectionConfidence: 0,
        explanationDetectionConfidence: 0,
        overallImportConfidence: 0.28,
      }],
      rawText: "Which option is correct?\nA. Alpha\nB. Beta",
      title: "Manual review",
      fileName: "manual.txt",
      fileType: "text",
    }} />);

    await user.click(screen.getByRole("button", { name: /Which option is correct/ }));
    await user.selectOptions(screen.getByLabelText("Correct answer"), "B");
    await user.click(screen.getByRole("button", { name: /^Save$/ }));

    expect(mocked.addQuestion).toHaveBeenCalledWith(expect.objectContaining({
      correctKey: "B",
      extraction: expect.objectContaining({
        confidence: "medium",
        reviewed: true,
        reviewedAt: expect.any(String),
        parserRuleIds: expect.arrayContaining(["answer.user-reviewed-mapping"]),
      }),
    }));
  });

  it("preselects a structured drift candidate, shows evidence, and keeps it review-gated until confirmation", async () => {
    const user = userEvent.setup();
    const [candidate] = importFromCsv([
      "question,a,b,c,answer",
      '"Which cell releases histamine?","Mast cells","CD4+ T lymphocytes","B lymphocytes","A. Mast cell"',
    ].join("\n")).drafts;
    render(<ImportPanel seed={{
      drafts: [candidate],
      rawText: "Structured CSV source",
      title: "Structured drift",
      fileName: "drift.csv",
      fileType: "csv",
    }} />);

    expect(screen.getByText("needs review")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Which cell releases histamine/ }));
    expect((screen.getByLabelText("Correct answer") as HTMLSelectElement).value).toBe("A");
    expect(document.body.textContent).toContain("Answer evidence: A. Mast cell");
    expect(screen.getByText(/Explicit answer letter A was preserved/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Confirm mapped answer A" }));
    await user.click(screen.getByRole("button", { name: /^Save$/ }));
    expect(mocked.addQuestion).toHaveBeenCalledWith(expect.objectContaining({
      correctKey: "A",
      needsReview: undefined,
      extraction: expect.objectContaining({
        reviewed: true,
        parserRuleIds: expect.arrayContaining([
          "answer.explicit-letter-text-drift",
          "answer.user-reviewed-mapping",
        ]),
      }),
    }));
  });

  it("shows both sides of a JSON letter/text conflict without preselecting an answer", async () => {
    const user = userEvent.setup();
    const [conflict] = importFromJson(JSON.stringify([{
      stem: "Which cell?",
      options: [
        { key: "A", text: "Mast cells" },
        { key: "B", text: "CD4+ T lymphocytes" },
        { key: "C", text: "B lymphocytes" },
      ],
      answer: "A. B lymphocytes",
    }])).drafts;
    render(<ImportPanel seed={{
      drafts: [conflict],
      rawText: "Structured JSON source",
      title: "Structured conflict",
      fileName: "conflict.json",
      fileType: "json",
    }} />);

    await user.click(screen.getByRole("button", { name: /Which cell/ }));
    expect((screen.getByLabelText("Correct answer") as HTMLSelectElement).value).toBe("");
    expect(document.body.textContent).toContain("letter A vs text of option C");
    expect(document.body.textContent).toContain("Answer evidence: A. B lymphocytes");
  });

  it("saves a no-question source as library-only without creating fake records", async () => {
    const user = userEvent.setup();
    render(<ImportPanel seed={{
      drafts: [],
      rawText: "Reference notes without a question pattern.",
      title: "Reference notes",
      fileName: "notes.txt",
      fileType: "text",
    }} />);

    expect(screen.getByRole("button", { name: "Save document" }).className).toContain("on");
    await user.click(screen.getByRole("button", { name: /^Save$/ }));

    expect(mocked.addQuestion).not.toHaveBeenCalled();
    expect(mocked.addQuestionSet).not.toHaveBeenCalled();
    expect(mocked.addDocument).toHaveBeenCalledWith(expect.objectContaining({
      title: "Reference notes",
      linkedQuestionSetIds: [],
      libraryOnly: true,
    }));
  });

  it("does not create an empty set when every approved question fails validation", async () => {
    const user = userEvent.setup();
    mocked.addQuestion.mockReturnValue({ ok: false, errors: ["Invalid question"] });
    render(<ImportPanel seed={{
      drafts: [draft],
      rawText: "Which option is correct?\nA. Alpha\nB. Beta",
      title: "Failed set",
      fileName: "failed.txt",
      fileType: "text",
    }} />);

    await user.click(screen.getByRole("button", { name: /^Save$/ }));
    expect(mocked.addQuestionSet).not.toHaveBeenCalled();
    expect(mocked.addDocument).toHaveBeenCalledWith(expect.objectContaining({
      linkedQuestionSetIds: [],
      libraryOnly: true,
    }));
  });

  it("parses a saved document locally and preserves mixed answer mappings", () => {
    const document: SourceDocument = {
      id: "doc-1",
      title: "Saved source",
      fileName: "questions.txt",
      fileType: "text",
      uploadedAt: "2026-07-12T00:00:00.000Z",
      rawText: [
        "1. First question?", "A. One", "B. Two", "Answer: B", "",
        "2. Second question?", "A. Alpha", "B. Beta", "Answer: A",
      ].join("\n"),
      sizeBytes: 100,
      tags: [],
      linkedQuestionSetIds: [],
      libraryOnly: true,
    };
    expect(parseStoredDocument(document).drafts.map((question) => question.correctKey)).toEqual(["B", "A"]);
  });

  it("keeps a user-confirmed mapping above conflicting re-import output", () => {
    const reparsed = importFromJson(JSON.stringify([{
      stem: "Reparsed question",
      options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }, { key: "C", text: "Gamma" }],
      answer: "A",
    }])).drafts;
    const preserved = preserveUserReviewedMappings(reparsed, [{
      id: "existing", source: "imported", sourceDocumentId: "doc-1", questionNumber: 1,
      stem: "Original question", options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }, { key: "C", text: "Gamma" }],
      correctKey: "B", correctAnswerText: "Beta", status: "unseen", tags: [], attempts: [],
      extraction: {
        confidence: "high", reviewed: true,
        parserRuleIds: ["answer.user-reviewed-mapping"],
      },
      createdAt: "2026-07-17T00:00:00.000Z", updatedAt: "2026-07-17T00:00:00.000Z",
    }], "doc-1");
    expect(preserved[0]).toMatchObject({
      correctKey: "B",
      correctAnswerText: "Beta",
    });
    expect(preserved[0].needsReview).toBeFalsy();
    expect(preserved[0].parserRuleIds).toContain("answer.user-reviewed-mapping");
    expect(preserved[0].warnings.join(" ")).toContain("Preserved user-confirmed answer B");
  });

  it("does not clear a non-answer review gate while preserving a user-confirmed mapping", () => {
    const reparsed = importFromJson(JSON.stringify([{
      stem: "Structurally incomplete question",
      options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }],
      answer: "A",
    }])).drafts;
    expect(reparsed[0]).toMatchObject({
      questionDetectionConfidence: 0.6,
      needsReview: true,
    });
    const preserved = preserveUserReviewedMappings(reparsed, [{
      id: "existing-low-confidence", source: "imported", sourceDocumentId: "doc-low-confidence", questionNumber: 1,
      stem: "Original question", options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }],
      correctKey: "B", correctAnswerText: "Beta", status: "unseen", tags: [], attempts: [],
      extraction: {
        confidence: "high", reviewed: true,
        parserRuleIds: ["answer.user-reviewed-mapping"],
      },
      createdAt: "2026-07-17T00:00:00.000Z", updatedAt: "2026-07-17T00:00:00.000Z",
    }], "doc-low-confidence");
    expect(preserved[0]).toMatchObject({
      correctKey: "B",
      questionDetectionConfidence: 0.6,
      needsReview: true,
    });
  });

  it("keeps duplicate-question-number review active while preserving a confirmed answer", () => {
    const reparsed = importFromJson(JSON.stringify([{
      stem: "Duplicate-number question",
      options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }, { key: "C", text: "Gamma" }],
      answer: "B trailing drift",
    }])).drafts.map((question) => ({
      ...question,
      needsReview: true,
      parserRuleIds: [
        ...(question.parserRuleIds ?? []),
        "conflict.duplicate-question-number",
      ],
    }));
    const preserved = preserveUserReviewedMappings(reparsed, [{
      id: "existing-duplicate-number", source: "imported", sourceDocumentId: "doc-duplicate-number", questionNumber: 1,
      stem: "Original question", options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }, { key: "C", text: "Gamma" }],
      correctKey: "B", correctAnswerText: "Beta", status: "unseen", tags: [], attempts: [],
      extraction: {
        confidence: "high", reviewed: true,
        parserRuleIds: ["answer.user-reviewed-mapping"],
      },
      createdAt: "2026-07-17T00:00:00.000Z", updatedAt: "2026-07-17T00:00:00.000Z",
    }], "doc-duplicate-number");
    expect(preserved[0]).toMatchObject({
      correctKey: "B",
      needsReview: true,
      parserRuleIds: expect.arrayContaining(["conflict.duplicate-question-number"]),
    });
  });

  it("reuses the saved document ID when parsed questions are saved later", async () => {
    const user = userEvent.setup();
    const existing: SourceDocument = {
      id: "doc-existing",
      title: "Existing source",
      fileName: "existing.txt",
      fileType: "text",
      uploadedAt: "2026-07-12T00:00:00.000Z",
      rawText: "Which option is correct?\nA. Alpha\nB. Beta",
      sizeBytes: 100,
      tags: [],
      linkedQuestionSetIds: [],
      libraryOnly: true,
    };
    mocked.documents.push(existing);
    render(<ImportPanel seed={{
      drafts: [draft],
      rawText: existing.rawText,
      title: existing.title,
      fileName: existing.fileName,
      fileType: existing.fileType,
      sourceDocumentId: existing.id,
    }} />);

    await user.click(screen.getByRole("button", { name: /^Save$/ }));
    expect(mocked.addDocument).not.toHaveBeenCalled();
    expect(mocked.updateDocument).toHaveBeenCalledWith("doc-existing", expect.objectContaining({
      linkedQuestionSetIds: [expect.any(String)],
      libraryOnly: false,
    }));
    expect(mocked.addQuestionSet).toHaveBeenCalledWith(expect.objectContaining({
      sourceDocumentIds: ["doc-existing"],
      questionIds: ["question-1"],
    }));
  });
});

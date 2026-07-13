// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SourceDocument } from "../../lib/library";
import type { ParsedQuestionDraft } from "../../lib/questionParse";
import { ImportPanel, parseStoredDocument } from "./ImportPanel";

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

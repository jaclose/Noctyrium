// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SourceDocument } from "../../lib/library";
import { extractPdfText } from "../../lib/extractText";
import { MassImport, massImportFileStatus } from "./MassImport";

const mocked = vi.hoisted(() => ({
  addDocument: vi.fn(),
  addQuestion: vi.fn(),
  addQuestionSet: vi.fn(),
  updateDocument: vi.fn(),
  updateQuestionSet: vi.fn(),
  documents: [] as SourceDocument[],
}));

vi.mock("../../lib/store", () => ({ useStore: () => mocked }));
vi.mock("../../lib/toast", () => ({ pushToast: vi.fn() }));
vi.mock("../../lib/checksum", () => ({ sha256Hex: vi.fn(async () => "sha256-test") }));
vi.mock("../../lib/extractText", async (importOriginal) => ({
  ...await importOriginal<typeof import("../../lib/extractText")>(),
  extractPdfText: vi.fn(),
}));
vi.mock("../../lib/ai", () => ({
  enhanceQuestionSet: vi.fn(),
  resolveActiveProvider: vi.fn(() => null),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocked.documents.splice(0);
  mocked.addQuestion.mockReturnValue({ ok: true, errors: [], id: "question-1" });
});
afterEach(cleanup);

async function processReadyText(onInspect = vi.fn()) {
  const user = userEvent.setup();
  render(<MassImport onInspect={onInspect} />);
  const contents = [
    "1. Which option is correct?",
    "A. Alpha",
    "B. Beta",
    "C. Gamma",
    "D. Delta",
    "Answer: B",
    "Explanation: Beta is the supported answer.",
  ].join("\n");
  const file = new File([contents], "mapped.txt", { type: "text/plain" });
  await user.upload(screen.getByLabelText("Choose multiple question files"), file);
  await user.click(screen.getByRole("button", { name: "Process queue" }));
  await screen.findByText("ready");
  return { user, file, onInspect };
}

describe("Mass Import trust handoff", () => {
  it("never marks a high-confidence draft with no mapped answer ready", () => {
    expect(massImportFileStatus([{
      stem: "Unresolved despite a malformed confidence value",
      options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }, { key: "C", text: "Gamma" }],
      correctKey: undefined,
      confidence: "high",
      warnings: [],
    }])).toBe("needs-review");
  });

  it("hands every source field and warning to the Import Center", async () => {
    const onInspect = vi.fn();
    const { user, file } = await processReadyText(onInspect);

    await user.click(screen.getByRole("button", { name: "Inspect" }));
    expect(onInspect).toHaveBeenCalledWith(expect.objectContaining({
      title: "mapped",
      fileName: "mapped.txt",
      fileType: "text",
      sizeBytes: file.size,
      rawText: expect.stringContaining("Which option is correct?"),
      pageTexts: undefined,
      checksum: "sha256-test",
      warnings: [],
      source: "imported",
      drafts: [expect.objectContaining({ correctKey: "B" })],
    }));
  });

  it("preserves PDF pages, warnings, and source identity for inspection", async () => {
    vi.mocked(extractPdfText).mockResolvedValue({
      text: [
        "1. Which PDF option is correct?", "A. Alpha", "B. Beta", "C. Gamma", "D. Delta",
        "Answer: B", "Explanation: Beta is the supported answer.",
      ].join("\n"),
      pages: ["Page one source text"],
      warnings: ["PDF extraction warning"],
      empty: false,
    });
    const user = userEvent.setup();
    const onInspect = vi.fn();
    render(<MassImport onInspect={onInspect} />);
    const file = new File(["pdf bytes"], "mapped.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Choose multiple question files"), file);
    await user.click(screen.getByRole("button", { name: "Process queue" }));
    await screen.findByText("ready");
    await user.click(screen.getByRole("button", { name: "Inspect" }));

    expect(onInspect).toHaveBeenCalledWith(expect.objectContaining({
      fileName: "mapped.pdf",
      fileType: "pdf",
      sizeBytes: file.size,
      pageTexts: ["Page one source text"],
      checksum: "sha256-test",
      warnings: ["PDF extraction warning"],
      source: "pdf",
    }));
  });

  it("marks batch-saved ready mappings as reviewed", async () => {
    const { user } = await processReadyText();
    await user.click(screen.getByRole("button", { name: /Batch-save 1 clean file/ }));

    await waitFor(() => expect(mocked.addQuestion).toHaveBeenCalled());
    expect(mocked.addQuestion).toHaveBeenCalledWith(expect.objectContaining({
      correctKey: "B",
      extraction: expect.objectContaining({ reviewed: true, reviewedAt: expect.any(String) }),
    }));
  });
});

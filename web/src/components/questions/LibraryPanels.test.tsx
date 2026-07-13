// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SourceLibrary } from "./LibraryPanels";

const mocked = vi.hoisted(() => ({ document: {
  id: "doc-1",
  title: "Saved source",
  fileName: "saved.txt",
  fileType: "text",
  uploadedAt: "2026-07-12T00:00:00.000Z",
  rawText: "1. Stem?\nA. Alpha\nB. Beta\nAnswer: B",
  sizeBytes: 100,
  tags: [],
  linkedQuestionSetIds: [],
  libraryOnly: true,
} }));

vi.mock("../../lib/store", () => ({
  useStore: () => ({ documents: [mocked.document], removeDocument: vi.fn() }),
}));
vi.mock("../../lib/ai", () => ({
  enhanceQuestionSet: vi.fn(),
  resolveActiveProvider: vi.fn(() => null),
}));

afterEach(cleanup);

describe("SourceLibrary", () => {
  it("offers deterministic local parsing without requiring an AI provider", async () => {
    const user = userEvent.setup();
    const onParseFrom = vi.fn();
    render(<SourceLibrary onParseFrom={onParseFrom} onGenerateFrom={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Parse into questions" }));
    expect(onParseFrom).toHaveBeenCalledWith(mocked.document);
    expect(screen.queryByRole("button", { name: "Generate" })).toBeNull();
  });
});

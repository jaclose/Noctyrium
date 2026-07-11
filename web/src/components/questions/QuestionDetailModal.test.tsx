// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuestionRecord } from "../../lib/questions";
import { QuestionDetailModal } from "./QuestionDetailModal";

const mocked = vi.hoisted(() => ({
  addAnkiCards: vi.fn(() => ({ saved: 1, errors: [] })),
}));

vi.mock("../../lib/store", () => ({
  useStore: () => ({
    addAnkiCards: mocked.addAnkiCards,
    recordQuestionAttempt: vi.fn(),
    removeQuestion: vi.fn(),
    toggleQuestionMarked: vi.fn(),
    updateQuestion: vi.fn(),
  }),
}));
vi.mock("../../lib/toast", () => ({ pushToast: vi.fn() }));

const edited = "Answer choice B is wrong because receptor affinity alone does not determine signaling.";
const question: QuestionRecord = {
  id: "manual-edit",
  source: "manual",
  stem: "Which option is correct?",
  options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }],
  correctKey: "B",
  correctAnswerText: "Beta",
  explanation: edited,
  status: "unseen",
  tags: [],
  attempts: [],
  createdAt: "2026-07-11T00:00:00.000Z",
  updatedAt: "2026-07-11T00:00:00.000Z",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("QuestionDetailModal repair cards", () => {
  it("preserves a manually edited answer-line-shaped explanation verbatim", async () => {
    const user = userEvent.setup();
    render(<QuestionDetailModal question={question} onClose={() => {}} />);

    await user.click(screen.getByRole("button", { name: "AAlpha" }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    await user.click(screen.getByRole("button", { name: /Create an error-repair card/i }));

    expect(mocked.addAnkiCards).toHaveBeenCalledWith([
      expect.objectContaining({ back: `Correct: B. Beta\n\n${edited}` }),
    ]);
  });
});

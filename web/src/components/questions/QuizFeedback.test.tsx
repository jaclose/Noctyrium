// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuestionRecord } from "../../lib/questions";
import { QuizFeedback } from "./QuizFeedback";

const stem = "A 36-year-old man with tuberculosis exposure has a positive PPD skin test.";
const question: QuestionRecord = {
  id: "ppd", source: "pdf", stem,
  options: [
    { key: "A", text: "B lymphocytes" },
    { key: "B", text: "CD4+ T lymphocytes" },
    { key: "C", text: "Mast cells" },
  ],
  correctKey: "B", correctAnswerText: "CD4+ T lymphocytes",
  explanation: `${stem}\nA. B lymphocytes\nB. CD4+ T lymphocytes\nC. Mast cells\nAnswer: B. CD4+ T lymphocytes\nExplanation: The PPD test is a type IV hypersensitivity reaction mediated by Th1 CD4+ T cells and macrophages.\nObjective: delayed hypersensitivity\nSource: Week 4 set`,
  objective: "Recognize delayed-type hypersensitivity.",
  bank: "Week 4 set", sourcePage: 1, citation: "Week 4 source",
  extraction: {
    confidence: "high", reviewed: true, overallImportConfidence: 0.96,
    sourceSnippet: "Answer: B. CD4+ T lymphocytes", parserRuleIds: ["answer.explicit-letter-text"],
  },
  status: "unseen", tags: [], attempts: [],
  createdAt: "2026-07-10T00:00:00.000Z", updatedAt: "2026-07-10T00:00:00.000Z",
};

afterEach(cleanup);

describe("QuizFeedback", () => {
  it("shows a short incorrect banner, distinct answers, and only the clean explanation", () => {
    render(<QuizFeedback question={question} pickedKey="A" />);
    expect(screen.getByRole("status").textContent).toContain("Incorrect — you picked A, answer is B");
    expect(screen.getByText("B. CD4+ T lymphocytes")).toBeTruthy();
    expect(screen.getByText("A. B lymphocytes")).toBeTruthy();
    const explanation = screen.getByText(/The PPD test is a type IV hypersensitivity/);
    expect(explanation.textContent).not.toContain(stem);
    expect(explanation.textContent).not.toContain("Answer: B");
    expect(explanation.textContent).not.toContain("Objective:");
  });

  it("shows the correct state and source metadata without mixing it into prose", () => {
    render(<QuizFeedback question={question} pickedKey="B" />);
    expect(screen.getByRole("status").textContent).toContain("Correct — you picked B");
    expect(screen.getByText("Source & evidence")).toBeTruthy();
    expect(screen.getByText("Recognize delayed-type hypersensitivity.")).toBeTruthy();
  });

  it("exposes repair actions through explicit callbacks", () => {
    const review = vi.fn();
    const mapping = vi.fn();
    render(<QuizFeedback question={question} pickedKey="A" onAddReview={review} onEditMapping={mapping} />);
    screen.getByRole("button", { name: /add to review/i }).click();
    screen.getByRole("button", { name: /edit mapping/i }).click();
    expect(review).toHaveBeenCalledOnce();
    expect(mapping).toHaveBeenCalledOnce();
  });

  it("uses a needs-review banner when no reliable answer exists", () => {
    render(<QuizFeedback question={{ ...question, correctKey: undefined, correctAnswerText: undefined }} pickedKey="A" />);
    expect(screen.getByRole("status").textContent).toContain("Needs review — no reliable answer was mapped");
  });
});

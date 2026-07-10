// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { QuestionSet, QuestionSetMetrics } from "../../lib/library";
import { QuestionSetCard } from "./QuestionSetCard";

const set: QuestionSet = {
  id: "set", title: "Week 4–5 Postmidterm Immunology", sourceDocumentIds: ["doc"],
  createdAt: "2026-07-01T00:00:00.000Z", questionIds: Array.from({ length: 20 }, (_, index) => String(index)),
  tags: [], aiEnhanced: false, parserWarnings: [],
};
const metrics: QuestionSetMetrics = {
  total: 20, completed: 12, remaining: 8, completionPct: 60,
  correct: 10, attempts: 12, accuracyPct: 83, accuracyTone: "gold",
  needsReview: 3, importConfidence: 91, lastStudiedAt: "2026-07-09T00:00:00.000Z",
  category: "Immunology", sourceTitle: "IMMU Practice set 3", missedQuestionIds: ["2", "4"],
};

afterEach(cleanup);

describe("QuestionSetCard", () => {
  it("shows completion, remaining, accuracy, confidence, review count, and progress", () => {
    render(<QuestionSetCard set={set} metrics={metrics} onStart={() => {}} onReviewMisses={() => {}} />);
    expect(screen.getByText(set.title)).toBeTruthy();
    expect(screen.getByLabelText("83% accuracy").classList.contains("gold")).toBe(true);
    expect(screen.getByText("12/20 complete")).toBeTruthy();
    expect(screen.getByText("3 need review")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("60");
    expect(screen.getByText("91%")).toBeTruthy();
    expect(screen.getByRole("button", { name: /review misses/i })).not.toHaveProperty("disabled", true);
  });

  it("uses a neutral no-attempt state and disables review misses", () => {
    render(<QuestionSetCard set={set} metrics={{ ...metrics, completed: 0, remaining: 20, completionPct: 0, accuracyPct: null, accuracyTone: "neutral", missedQuestionIds: [] }} onStart={() => {}} onReviewMisses={() => {}} />);
    expect(screen.getByLabelText("No attempts yet").classList.contains("neutral")).toBe(true);
    expect(screen.getByRole("button", { name: /review misses/i })).toHaveProperty("disabled", true);
  });
});

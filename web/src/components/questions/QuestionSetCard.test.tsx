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
  currentMasteryCorrect: 10, currentMasteryQuestions: 12, currentMasteryPct: 83, currentMasteryTone: "gold",
  historicalCorrectAttempts: 13, historicalAttemptCount: 18, historicalAccuracyPct: 72,
  needsReview: 3, importConfidence: 91, lastStudiedAt: "2026-07-09T00:00:00.000Z",
  category: "Immunology", sourceTitle: "IMMU Practice set 3", missedQuestionIds: ["2", "4"],
};

afterEach(cleanup);

describe("QuestionSetCard", () => {
  it("shows completion, mastery, historical accuracy, confidence, review count, and progress", () => {
    render(<QuestionSetCard set={set} metrics={metrics} onStart={() => {}} onReviewMisses={() => {}} />);
    expect(screen.getByText(set.title)).toBeTruthy();
    expect(screen.getByLabelText("83% current mastery").classList.contains("gold")).toBe(true);
    expect(screen.getByText("Historical accuracy 72% · 18 attempts")).toBeTruthy();
    expect(screen.getByText("3 need review")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "12 of 20 questions attempted" }).getAttribute("aria-valuenow")).toBe("60");
    expect(screen.getByText("91%")).toBeTruthy();
    expect(screen.getByRole("button", { name: /review misses/i })).not.toHaveProperty("disabled", true);
  });

  it("uses a neutral no-attempt state and disables review misses", () => {
    render(<QuestionSetCard set={set} metrics={{
      ...metrics,
      completed: 0,
      remaining: 20,
      completionPct: 0,
      currentMasteryCorrect: 0,
      currentMasteryQuestions: 0,
      currentMasteryPct: null,
      currentMasteryTone: "neutral",
      historicalCorrectAttempts: 0,
      historicalAttemptCount: 0,
      historicalAccuracyPct: null,
      missedQuestionIds: [],
    }} onStart={() => {}} onReviewMisses={() => {}} />);
    expect(screen.getByLabelText("No mastery attempts yet").classList.contains("neutral")).toBe(true);
    expect(screen.getByText("Historical accuracy — · 0 attempts")).toBeTruthy();
    expect(screen.getByRole("button", { name: /review misses/i })).toHaveProperty("disabled", true);
  });
});

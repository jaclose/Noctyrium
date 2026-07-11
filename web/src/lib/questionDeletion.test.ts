import { beforeEach, describe, expect, it } from "vitest";
import { makeSeed } from "./seed";
import { useStore } from "./store";

beforeEach(() => useStore.getState().replaceAll(makeSeed()));

describe("question deletion integrity", () => {
  it("unlinks the deleted question from every set without deleting session history", () => {
    const questionId = "delete-me";
    useStore.getState().addQuestion({
      id: questionId,
      source: "manual",
      stem: "Question to delete",
      options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }],
      correctKey: "A",
      status: "incorrect",
      tags: [],
      attempts: [{ at: "2026-07-10T00:00:00.000Z", answerKey: "B", status: "incorrect" }],
      createdAt: "2026-07-10T00:00:00.000Z",
      updatedAt: "2026-07-10T00:00:00.000Z",
    });
    useStore.getState().addQuestionSet({
      id: "set-1", title: "Set", sourceDocumentIds: [], createdAt: "2026-07-10T00:00:00.000Z",
      questionIds: [questionId], tags: [], aiEnhanced: false, parserWarnings: [],
    });
    useStore.getState().saveQuizSession({
      id: "session-1", mode: "tutor", startedAt: "2026-07-10T00:00:00.000Z",
      endedAt: "2026-07-10T00:01:00.000Z", timed: false, filters: { count: 1, status: "all" },
      questionIds: [questionId], answers: [{ questionId, answerKey: "B", correct: false, flagged: false }],
    });

    useStore.getState().removeQuestion(questionId);

    expect(useStore.getState().questions.some((question) => question.id === questionId)).toBe(false);
    expect(useStore.getState().questionSets[0].questionIds).toEqual([]);
    expect(useStore.getState().quizSessions[0].id).toBe("session-1");
  });
});

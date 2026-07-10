import { describe, expect, it } from "vitest";
import { accuracyTone, questionSetMetrics, type QuestionSet } from "./library";
import type { QuestionRecord } from "./questions";

function question(id: string, patch: Partial<QuestionRecord> = {}): QuestionRecord {
  return {
    id, source: "imported", stem: `Stem ${id}`,
    options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }],
    correctKey: "A", correctAnswerText: "Alpha", status: "unseen", tags: [], attempts: [],
    createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
    ...patch,
  };
}

const set: QuestionSet = {
  id: "set", title: "Immunology set", sourceDocumentIds: ["doc"],
  createdAt: "2026-07-01T00:00:00.000Z", questionIds: ["q1", "q2", "q3"],
  tags: [], aiEnhanced: false, parserWarnings: [],
};

describe("question-set progress and accuracy", () => {
  it("uses the exact product accuracy color thresholds", () => {
    expect(accuracyTone(null)).toBe("neutral");
    expect(accuracyTone(100)).toBe("green");
    expect(accuracyTone(90)).toBe("green");
    expect(accuracyTone(89)).toBe("gold");
    expect(accuracyTone(80)).toBe("gold");
    expect(accuracyTone(79)).toBe("orange");
    expect(accuracyTone(70)).toBe("orange");
    expect(accuracyTone(69)).toBe("red");
    expect(accuracyTone(0)).toBe("red");
  });

  it("separates completion from accuracy and surfaces review/source metadata", () => {
    const questions = [
      question("q1", {
        category: "Immunology", status: "correct", attemptedAt: "2026-07-08T10:00:00.000Z",
        attempts: [{ at: "2026-07-08T10:00:00.000Z", answerKey: "A", status: "correct" }],
        extraction: { confidence: "high", reviewed: true, overallImportConfidence: 0.96 },
      }),
      question("q2", {
        category: "Immunology", status: "incorrect", needsReview: true,
        attempts: [{ at: "2026-07-09T10:00:00.000Z", answerKey: "B", status: "incorrect" }],
        extraction: { confidence: "medium", reviewed: false, overallImportConfidence: 0.74 },
      }),
      question("q3", { category: "Pathology" }),
    ];
    const metrics = questionSetMetrics(set, questions, [{
      id: "doc", title: "Week 4 source", fileName: "week4.pdf", fileType: "pdf",
      uploadedAt: "2026-07-01T00:00:00.000Z", rawText: "", sizeBytes: 1,
      tags: [], linkedQuestionSetIds: ["set"], libraryOnly: false,
    }]);
    expect(metrics).toMatchObject({
      total: 3,
      completed: 2,
      remaining: 1,
      completionPct: 67,
      accuracyPct: 50,
      accuracyTone: "red",
      needsReview: 1,
      importConfidence: 85,
      category: "Immunology",
      sourceTitle: "Week 4 source",
      lastStudiedAt: "2026-07-09T10:00:00.000Z",
      missedQuestionIds: ["q2"],
    });
  });

  it("uses a neutral bar when no attempts exist", () => {
    const metrics = questionSetMetrics(set, set.questionIds.map((id) => question(id)));
    expect(metrics.completed).toBe(0);
    expect(metrics.accuracyPct).toBeNull();
    expect(metrics.accuracyTone).toBe("neutral");
  });
});

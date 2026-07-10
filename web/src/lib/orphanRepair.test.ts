import { describe, expect, it } from "vitest";
import { findOrphans, repairOrphans } from "./orphanRepair";
import type { QuestionRecord } from "./questions";
import type { QuestionSet, SourceDocument } from "./library";

function q(patch: Partial<QuestionRecord>): QuestionRecord {
  return {
    id: crypto.randomUUID(), source: "manual", stem: "s", options: [], status: "unseen",
    tags: [], attempts: [], createdAt: "t", updatedAt: "t", ...patch,
  };
}
function set(patch: Partial<QuestionSet>): QuestionSet {
  return {
    id: crypto.randomUUID(), title: "Set", sourceDocumentIds: [], createdAt: "t",
    questionIds: [], tags: [], aiEnhanced: false, parserWarnings: [], ...patch,
  };
}
function doc(patch: Partial<SourceDocument>): SourceDocument {
  return {
    id: crypto.randomUUID(), title: "Doc", fileName: "d.pdf", fileType: "pdf",
    uploadedAt: "t", rawText: "", sizeBytes: 0, tags: [], linkedQuestionSetIds: [],
    libraryOnly: false, ...patch,
  };
}

describe("orphan detection + repair (never destructive)", () => {
  it("finds no issues in a consistent graph", () => {
    const state = {
      documents: [doc({ id: "d1", linkedQuestionSetIds: ["s1"] })],
      questionSets: [set({ id: "s1", sourceDocumentIds: ["d1"], questionIds: ["q1"] })],
      questions: [q({ id: "q1", setId: "s1", sourceDocumentId: "d1" })],
    };
    expect(findOrphans(state).totalIssues).toBe(0);
  });

  it("unlinks a question from a deleted set/document but keeps the question", () => {
    const state = {
      documents: [],
      questionSets: [],
      questions: [q({ id: "q1", setId: "gone-set", sourceDocumentId: "gone-doc", attempts: [{ at: "t", status: "correct" }] })],
    };
    const report = findOrphans(state);
    expect(report.questionsUnlinkedFromSet).toBe(1);
    expect(report.questionsUnlinkedFromDocument).toBe(1);

    const result = repairOrphans(state);
    expect(result.questions).toHaveLength(1); // never deleted
    expect(result.questions[0].setId).toBeUndefined();
    expect(result.questions[0].sourceDocumentId).toBeUndefined();
    expect(result.questions[0].attempts).toHaveLength(1); // history preserved
  });

  it("prunes a set's dangling question and document ids", () => {
    const state = {
      documents: [doc({ id: "d1" })],
      questionSets: [set({ id: "s1", sourceDocumentIds: ["d1", "gone"], questionIds: ["q1", "ghost"] })],
      questions: [q({ id: "q1" })],
    };
    const result = repairOrphans(state);
    expect(result.questionSets[0].sourceDocumentIds).toEqual(["d1"]);
    expect(result.questionSets[0].questionIds).toEqual(["q1"]);
  });

  it("prunes a document's dangling set links", () => {
    const state = {
      documents: [doc({ id: "d1", linkedQuestionSetIds: ["s1", "gone"] })],
      questionSets: [set({ id: "s1" })],
      questions: [],
    };
    const result = repairOrphans(state);
    expect(result.documents[0].linkedQuestionSetIds).toEqual(["s1"]);
  });
});

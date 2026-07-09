// Pre-beta question bank: multi-question parsing, file import, and quiz
// session scoring/pools — the flagship loop's domain logic.
import { describe, expect, it } from "vitest";
import { parseQuestionBlocks, parseQuestionText, splitAnswerKeySection } from "./questionParse";
import { detectImportFormat, importFromCsv, importFromJson, parseCsv } from "./questionImport";
import { buildQuizPool, missedQuestionIds, scoreSession, scoresByCategory, type QuizSession } from "./quiz";
import { setAccuracy, type QuestionSet } from "./library";
import type { QuestionRecord } from "./questions";

function makeQuestion(patch: Partial<QuestionRecord> = {}): QuestionRecord {
  return {
    id: crypto.randomUUID(), source: "manual", stem: "A stem",
    options: [{ key: "A", text: "x" }, { key: "B", text: "y" }, { key: "C", text: "z" }],
    correctKey: "A", status: "unseen", tags: [], attempts: [],
    createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
    ...patch,
  };
}

describe("multi-question paste parsing", () => {
  it("splits a numbered set into separate drafts and strips the numbers", () => {
    const drafts = parseQuestionBlocks([
      "1. First stem about complement?",
      "A. One", "B. Two", "C. Three",
      "Answer: B",
      "",
      "2) Second stem about renal?",
      "A. Alpha", "B. Beta", "C. Gamma",
      "Correct: A",
      "Explanation: Because physiology.",
    ].join("\n"));
    expect(drafts).toHaveLength(2);
    expect(drafts[0].stem).toBe("First stem about complement?");
    expect(drafts[0].correctKey).toBe("B");
    expect(drafts[1].stem).toBe("Second stem about renal?");
    expect(drafts[1].correctKey).toBe("A");
    expect(drafts[1].explanation).toContain("physiology");
  });

  it("treats un-numbered text as a single question", () => {
    const drafts = parseQuestionBlocks("Plain stem?\nA. Yes\nB. No\nAnswer: A");
    expect(drafts).toHaveLength(1);
    expect(drafts[0].correctKey).toBe("A");
  });

  it("captures metadata lines like Topic:/Source:/Tags:", () => {
    const draft = parseQuestionText("Stem?\nA. One\nB. Two\nAnswer: A\nTopic: Complement\nSource: SGU NB3\nTags: immuno, hy");
    expect(draft.topic).toBe("Complement");
    expect(draft.sourceLabel).toBe("SGU NB3");
    expect(draft.tags).toEqual(["immuno", "hy"]);
  });

  it("retains the document's question numbers", () => {
    const drafts = parseQuestionBlocks("7. Stem seven?\nA. x\nB. y\n\n8) Stem eight?\nA. x\nB. y");
    expect(drafts.map((d) => d.questionNumber)).toEqual([7, 8]);
  });
});

describe("answer-key section mapping", () => {
  it("parses key formats: '1. C', '2-B', '3) D', 'Question 4: A'", () => {
    const { answerKey } = splitAnswerKeySection("body\nAnswer Key\n1. C\n2-B\n3) D\nQuestion 4: A");
    expect(answerKey.get(1)).toBe("C");
    expect(answerKey.get(2)).toBe("B");
    expect(answerKey.get(3)).toBe("D");
    expect(answerKey.get(4)).toBe("A");
  });

  it("parses the inline form 'Answers: 1C, 2B, 3D'", () => {
    const { answerKey, body } = splitAnswerKeySection("Question body here\nAnswers: 1C, 2B, 3D");
    expect([...answerKey.entries()]).toEqual([[1, "C"], [2, "B"], [3, "D"]]);
    expect(body).not.toMatch(/Answers:/);
  });

  it("maps a trailing key onto numbered questions and clears the missing-answer warning", () => {
    const drafts = parseQuestionBlocks([
      "1. First?", "A. x", "B. y", "C. z", "",
      "2. Second?", "A. x", "B. y", "C. z", "",
      "Answer key:", "1. B", "2. C",
    ].join("\n"));
    expect(drafts[0].correctKey).toBe("B");
    expect(drafts[1].correctKey).toBe("C");
    expect(drafts[0].warnings.join(" ")).not.toMatch(/no correct answer/i);
  });

  it("flags conflicting or impossible key entries instead of guessing", () => {
    const conflicted = parseQuestionBlocks([
      "1. First?", "A. x", "B. y", "",
      "Answer key:", "1. A", "1. B",
    ].join("\n"));
    expect(conflicted[0].correctKey).toBeUndefined();
    expect(conflicted[0].warnings.join(" ")).toMatch(/conflicting/i);

    const impossible = parseQuestionBlocks([
      "1. First?", "A. x", "B. y", "",
      "Answer key:", "1. F",
    ].join("\n"));
    expect(impossible[0].correctKey).toBeUndefined();
    expect(impossible[0].warnings.join(" ")).toMatch(/no such option/i);
  });

  it("an explicit in-question answer wins over the key", () => {
    const drafts = parseQuestionBlocks([
      "1. First?", "A. x", "B. y", "Answer: A", "",
      "2. Second?", "A. x", "B. y", "",
      "Answer key:", "1. B", "2. B",
    ].join("\n"));
    expect(drafts[0].correctKey).toBe("A");
    expect(drafts[1].correctKey).toBe("B");
  });
});

describe("library links", () => {
  it("pools by setId and documentId, and honors ordered mode", () => {
    const qs = [
      makeQuestion({ id: "a", setId: "set1", questionNumber: 2 }),
      makeQuestion({ id: "b", setId: "set1", questionNumber: 1 }),
      makeQuestion({ id: "c", setId: "set2", sourceDocumentId: "doc9" }),
    ];
    expect(buildQuizPool(qs, { count: 10, status: "all", setIds: ["set1"] })).toHaveLength(2);
    expect(buildQuizPool(qs, { count: 10, status: "all", documentIds: ["doc9"] }).map((q) => q.id)).toEqual(["c"]);
    const ordered = buildQuizPool(qs, { count: 10, status: "all", setIds: ["set1"], ordered: true });
    expect(ordered.map((q) => q.id)).toEqual(["b", "a"]);
  });

  it("computes set accuracy from attempt history", () => {
    const set: QuestionSet = {
      id: "s1", title: "Set", sourceDocumentIds: [], createdAt: "t",
      questionIds: ["a", "b", "never"], tags: [], aiEnhanced: false, parserWarnings: [],
    };
    const attempts = new Map([
      ["a", { correct: 2, total: 2 }],
      ["b", { correct: 0, total: 2 }],
    ]);
    expect(setAccuracy(set, attempts)).toEqual({ correct: 2, total: 4, pct: 50 });
    expect(setAccuracy({ ...set, questionIds: ["never"] }, attempts).pct).toBeNull();
  });
});

describe("file import", () => {
  it("detects formats honestly, including provenance-only PDFs/images", () => {
    expect(detectImportFormat("set.csv", "text/csv")).toBe("csv");
    expect(detectImportFormat("bank.json", "application/json")).toBe("json");
    expect(detectImportFormat("notes.md", "")).toBe("text");
    expect(detectImportFormat("scan.pdf", "application/pdf")).toBe("provenance-only");
    expect(detectImportFormat("shot.png", "image/png")).toBe("provenance-only");
    expect(detectImportFormat("deck.apkg", "application/octet-stream")).toBe("unsupported");
  });

  it("parses quoted CSV cells with commas and escaped quotes", () => {
    const rows = parseCsv('a,"b, with comma","say ""hi"""\nc,d,e');
    expect(rows[0]).toEqual(["a", "b, with comma", 'say "hi"']);
    expect(rows[1]).toEqual(["c", "d", "e"]);
  });

  it("maps CSV headers to drafts and validates the answer", () => {
    const result = importFromCsv([
      "question,a,b,c,answer,explanation,topic",
      '"Which is right?",First,Second,Third,B,"Because so.",Immuno',
      '"Bad answer row?",One,Two,Three,Z,,',
    ].join("\n"));
    expect(result.drafts).toHaveLength(2);
    expect(result.drafts[0].correctKey).toBe("B");
    expect(result.drafts[0].topic).toBe("Immuno");
    expect(result.drafts[1].correctKey).toBeUndefined();
    expect(result.drafts[1].warnings.join(" ")).toMatch(/no matching option/i);
  });

  it("imports JSON arrays with string options and answer matching", () => {
    const result = importFromJson(JSON.stringify([
      { question: "Q1?", options: ["one", "two", "three"], answer: "B", explanation: "e" },
    ]));
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0].options[1]).toEqual({ key: "B", text: "two" });
    expect(result.drafts[0].correctKey).toBe("B");
  });

  it("rejects malformed JSON with a clear warning instead of throwing", () => {
    const result = importFromJson("not json");
    expect(result.drafts).toHaveLength(0);
    expect(result.warnings[0]).toMatch(/valid JSON/i);
  });
});

describe("quiz pools and scoring", () => {
  it("filters pools by status, category, and exam type", () => {
    const qs = [
      makeQuestion({ id: "unused", category: "Immunology", examType: "imcq" }),
      makeQuestion({ id: "missed", status: "incorrect", attempts: [{ at: "t", status: "incorrect" }], category: "Immunology" }),
      makeQuestion({ id: "marked", marked: true }),
      makeQuestion({ id: "other", category: "Pathology" }),
    ];
    expect(buildQuizPool(qs, { count: 10, status: "unused" }).map((q) => q.id)).not.toContain("missed");
    expect(buildQuizPool(qs, { count: 10, status: "incorrect" }).map((q) => q.id)).toEqual(["missed"]);
    expect(buildQuizPool(qs, { count: 10, status: "marked" }).map((q) => q.id)).toEqual(["marked"]);
    expect(buildQuizPool(qs, { count: 10, status: "all", categories: ["immunology"] })).toHaveLength(2);
    expect(buildQuizPool(qs, { count: 10, status: "all", examTypes: ["imcq"] }).map((q) => q.id)).toEqual(["unused"]);
    expect(buildQuizPool(qs, { count: 2, status: "all" })).toHaveLength(2);
  });

  it("scores only questions that have a correct key, honestly", () => {
    const score = scoreSession([
      { questionId: "a", answerKey: "A", correct: true, flagged: false },
      { questionId: "b", answerKey: "B", correct: false, flagged: false },
      { questionId: "c", answerKey: "C", correct: undefined, flagged: false }, // no key set
    ]);
    expect(score).toEqual({ correct: 1, scored: 2, total: 3, pct: 50 });
  });

  it("aggregates category accuracy across sessions, weakest first", () => {
    const qs = [
      makeQuestion({ id: "q1", category: "Immunology" }),
      makeQuestion({ id: "q2", category: "Pathology" }),
    ];
    const sessions: QuizSession[] = [{
      id: "s1", mode: "exam", startedAt: "2026-07-08T10:00:00.000Z", endedAt: "2026-07-08T10:20:00.000Z",
      timed: false, filters: { count: 2, status: "all" }, questionIds: ["q1", "q2"],
      answers: [
        { questionId: "q1", answerKey: "B", correct: false, flagged: false },
        { questionId: "q2", answerKey: "A", correct: true, flagged: false },
      ],
    }];
    const scores = scoresByCategory(sessions, qs);
    expect(scores[0]).toMatchObject({ category: "Immunology", pct: 0 });
    expect(scores[1]).toMatchObject({ category: "Pathology", pct: 100 });
    expect(missedQuestionIds(sessions[0])).toEqual(["q1"]);
  });
});

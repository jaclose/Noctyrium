import { createImportMappingLedger, type ParsedQuestionDraft } from "./questionParse";
import type { QuestionImportAcceptanceFixture } from "./questionImportFixtures";
import { draftImportStatus, type DraftImportStatus } from "./questionImportTrust";

export interface QuestionImportEvaluationRow {
  fixtureId: string;
  questionNumber: number;
  expectedAnswer?: string;
  detectedAnswer?: string;
  status: DraftImportStatus;
  answerCorrect: boolean;
  explanationExpected: boolean;
  explanationAssociated: boolean;
  falseReady: boolean;
  confidence: number;
  answerEvidence?: string;
  conflictReason?: string;
  questionPage?: number;
  answerPage?: number;
  explanationPage?: number;
}

export interface QuestionImportEvaluationResult {
  rows: QuestionImportEvaluationRow[];
  totalQuestions: number;
  expectedAnswered: number;
  exactAnswers: number;
  answerAccuracy: number;
  expectedExplanations: number;
  associatedExplanations: number;
  explanationAccuracy: number;
  unresolved: number;
  unresolvedRate: number;
  falseReady: number;
  allACollapse: boolean;
  lostQuestions: number;
  unexpectedQuestions: number;
}

export function evaluateQuestionImports(
  fixtures: readonly QuestionImportAcceptanceFixture[],
  parsedByFixture: ReadonlyMap<string, readonly ParsedQuestionDraft[]>,
): QuestionImportEvaluationResult {
  const rows: QuestionImportEvaluationRow[] = [];
  let lostQuestions = 0;
  let unexpectedQuestions = 0;

  for (const fixture of fixtures) {
    const drafts = parsedByFixture.get(fixture.id) ?? [];
    const byNumber = new Map(drafts.map((draft) => [draft.questionNumber, draft]));
    const ledgerByNumber = new Map(createImportMappingLedger(drafts).map((entry) => [entry.questionNumber, entry]));
    const expectedNumbers = new Set(fixture.expected.map((entry) => entry.number));
    unexpectedQuestions += drafts.filter((draft) => !expectedNumbers.has(draft.questionNumber ?? Number.NaN)).length;
    for (const expected of fixture.expected) {
      const draft = byNumber.get(expected.number);
      const ledger = ledgerByNumber.get(expected.number);
      if (!draft) lostQuestions += 1;
      const status = draftImportStatus(draft);
      const answerCorrect = expected.answer === undefined
        ? draft?.correctKey === undefined
        : draft?.correctKey === expected.answer;
      const explanationExpected = Boolean(expected.explanationIncludes);
      const explanationAssociated = explanationExpected
        ? Boolean(
            draft?.explanation?.includes(expected.explanationIncludes!)
            && (expected.explanationPage === undefined || draft.explanationSourcePage === expected.explanationPage),
          )
        : true;
      const pageMismatch = (
        (expected.questionPage !== undefined && draft?.questionSourcePage !== expected.questionPage)
        || (expected.answerPage !== undefined && draft?.answerEvidencePage !== expected.answerPage)
        || (expected.explanationPage !== undefined && draft?.explanationSourcePage !== expected.explanationPage)
      );
      const falseReady = status === "ready" && (!answerCorrect || pageMismatch || !explanationAssociated);
      rows.push({
        fixtureId: fixture.id,
        questionNumber: expected.number,
        expectedAnswer: expected.answer,
        detectedAnswer: draft?.correctKey,
        status,
        answerCorrect,
        explanationExpected,
        explanationAssociated,
        falseReady,
        confidence: ledger?.confidence ?? 0,
        answerEvidence: ledger?.answerEvidence,
        conflictReason: ledger?.conflictReason,
        questionPage: draft?.questionSourcePage,
        answerPage: draft?.answerEvidencePage,
        explanationPage: draft?.explanationSourcePage,
      });
    }
  }

  const answered = rows.filter((row) => row.expectedAnswer !== undefined);
  const explanations = rows.filter((row) => row.explanationExpected);
  const detected = answered.map((row) => row.detectedAnswer).filter((answer): answer is string => Boolean(answer));
  const exactAnswers = answered.filter((row) => row.answerCorrect).length;
  const associatedExplanations = explanations.filter((row) => row.explanationAssociated).length;
  return {
    rows,
    totalQuestions: rows.length,
    expectedAnswered: answered.length,
    exactAnswers,
    answerAccuracy: ratio(exactAnswers, answered.length),
    expectedExplanations: explanations.length,
    associatedExplanations,
    explanationAccuracy: ratio(associatedExplanations, explanations.length),
    unresolved: rows.filter((row) => row.status === "unresolved").length,
    unresolvedRate: ratio(rows.filter((row) => row.status === "unresolved").length, rows.length),
    falseReady: rows.filter((row) => row.falseReady).length,
    allACollapse: detected.length >= 3 && detected.every((answer) => answer === "A")
      && answered.some((row) => row.expectedAnswer !== "A"),
    lostQuestions,
    unexpectedQuestions,
  };
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 10_000) / 100 : 100;
}

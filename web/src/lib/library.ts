// ===========================================================================
// Source Library + Question Sets (Import rehaul, layers 3). Uploaded documents
// and parsed question sets are SEPARATE but linked records: a file can live as
// a reference document only, become a question set, or both. Stable IDs
// everywhere; persistence in store.ts (schema v30).
// ===========================================================================
import type { ID } from "./types";
import type { QuestionRecord } from "./questions";

export interface SourceDocument {
  id: ID;
  title: string;
  fileName: string;
  fileType: string; // mime or extension label
  uploadedAt: string;
  /** Extracted text (capped in extractText.ts). Empty for scans/no-text files. */
  rawText: string;
  /** Per-page text for formats that have pages (PDF). */
  pageTexts?: string[];
  sizeBytes: number;
  /** SHA-256 of the original file bytes; used for non-destructive duplicate detection. */
  checksum?: string;
  tags: string[];
  linkedQuestionSetIds: ID[];
  /** True when the user chose "library document only" (no question set). */
  libraryOnly: boolean;
}

export interface QuestionSetDigest {
  summary: string;
  pitfalls: string[];
  suggestedReview: string[];
  generatedBy: string;
  generatedAt: string;
}

export interface QuestionSet {
  id: ID;
  title: string;
  sourceDocumentIds: ID[];
  createdAt: string;
  questionIds: ID[];
  tags: string[];
  aiEnhanced: boolean;
  parserWarnings: string[];
  /** AI-generated digest (review-gated feature output, clearly labeled). */
  digest?: QuestionSetDigest;
}

/** Accuracy for a set from attempt history on its questions. */
export function setAccuracy(
  set: QuestionSet,
  attemptsByQuestion: Map<ID, { correct: number; total: number }>,
): { correct: number; total: number; pct: number | null } {
  let correct = 0;
  let total = 0;
  for (const qid of set.questionIds) {
    const a = attemptsByQuestion.get(qid);
    if (!a) continue;
    correct += a.correct;
    total += a.total;
  }
  return { correct, total, pct: total ? Math.round((correct / total) * 100) : null };
}

export type AccuracyTone = "green" | "gold" | "orange" | "red" | "neutral";

/** Product-specified accuracy thresholds. Bar length represents completion;
 * this tone represents accuracy, so the two signals never compete. */
export function accuracyTone(pct: number | null): AccuracyTone {
  if (pct === null) return "neutral";
  if (pct >= 90) return "green";
  if (pct >= 80) return "gold";
  if (pct >= 70) return "orange";
  return "red";
}

export interface QuestionSetMetrics {
  total: number;
  completed: number;
  remaining: number;
  completionPct: number;
  correct: number;
  attempts: number;
  accuracyPct: number | null;
  accuracyTone: AccuracyTone;
  needsReview: number;
  importConfidence: number | null;
  lastStudiedAt?: string;
  category?: string;
  sourceTitle?: string;
  missedQuestionIds: ID[];
}

/** One canonical calculation shared by set cards, preview, and tests. */
export function questionSetMetrics(
  set: QuestionSet,
  questions: QuestionRecord[],
  documents: SourceDocument[] = [],
): QuestionSetMetrics {
  const ids = new Set(set.questionIds);
  const inSet = questions.filter((question) => ids.has(question.id));
  const attempted = inSet.filter((question) => question.attempts.length > 0);
  const attempts = inSet.flatMap((question) => question.attempts);
  const correct = attempts.filter((attempt) => attempt.status === "correct").length;
  const accuracyPct = attempts.length ? Math.round((correct / attempts.length) * 100) : null;
  const confidenceScores = inSet
    .map((question) => question.extraction?.overallImportConfidence)
    .filter((value): value is number => typeof value === "number");
  const categories = new Map<string, number>();
  for (const question of inSet) {
    const category = question.category ?? question.system;
    if (category) categories.set(category, (categories.get(category) ?? 0) + 1);
  }
  const category = [...categories.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
  const timestamps = inSet.flatMap((question) => [
    ...(question.attemptedAt ? [question.attemptedAt] : []),
    ...question.attempts.map((attempt) => attempt.at),
  ]).filter(Boolean).sort();
  const source = documents.find((document) => set.sourceDocumentIds.includes(document.id));
  const total = set.questionIds.length;
  return {
    total,
    completed: attempted.length,
    remaining: Math.max(0, total - attempted.length),
    completionPct: total ? Math.round((attempted.length / total) * 100) : 0,
    correct,
    attempts: attempts.length,
    accuracyPct,
    accuracyTone: accuracyTone(accuracyPct),
    needsReview: inSet.filter((question) => question.needsReview || question.status === "needs-review").length,
    importConfidence: confidenceScores.length
      ? Math.round((confidenceScores.reduce((sum, value) => sum + value, 0) / confidenceScores.length) * 100)
      : null,
    lastStudiedAt: timestamps.at(-1),
    category,
    sourceTitle: source?.title,
    missedQuestionIds: inSet
      .filter((question) => question.status === "incorrect" || question.status === "guessed")
      .map((question) => question.id),
  };
}

export function documentTitleFromFile(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim() || fileName;
}

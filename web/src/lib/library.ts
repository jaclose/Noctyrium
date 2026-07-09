// ===========================================================================
// Source Library + Question Sets (Import rehaul, layers 3). Uploaded documents
// and parsed question sets are SEPARATE but linked records: a file can live as
// a reference document only, become a question set, or both. Stable IDs
// everywhere; persistence in store.ts (schema v30).
// ===========================================================================
import type { ID } from "./types";

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

export function documentTitleFromFile(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim() || fileName;
}

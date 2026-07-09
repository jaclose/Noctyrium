// ===========================================================================
// Question Workspace domain model (directive Phase 4). Typed practice-question
// records with provenance, an error taxonomy that surfaces recurring patterns
// (not just wrong-answer counts), review scheduling, weak-topic aggregation,
// and the faculty style analyzer (Phase 6 §13). Pure + testable.
// ===========================================================================
import type { ID } from "./types";

export type QuestionStatus =
  | "unseen"
  | "in-progress"
  | "correct"
  | "incorrect"
  | "guessed"
  | "flagged"
  | "needs-review";

export type QuestionSource = "pasted" | "screenshot" | "image" | "pdf" | "imported" | "manual" | "ai-generated";

/** Broad exam-style buckets for filtering and exam-mode pools. */
export type QuestionExamType = "imcq" | "esop" | "board" | "mcat" | "shelf" | "lecture" | "custom";

export const EXAM_TYPE_LABEL: Record<QuestionExamType, string> = {
  imcq: "IMCQ",
  esop: "ESOP",
  board: "Board-style",
  mcat: "MCAT-style",
  shelf: "Shelf-style",
  lecture: "Lecture-based",
  custom: "Custom",
};

export type QuestionDifficulty = "easy" | "medium" | "hard";

/** Suggested category vocabulary — users can type anything; these seed the pickers. */
export const QUESTION_CATEGORIES = [
  "Ethics", "Immunology", "Microbiology", "Pathology", "Physiology", "Pharmacology",
  "Anatomy", "Biochemistry", "Behavioral science", "Public health", "Biostatistics",
  "Clinical reasoning", "MCAT biology", "MCAT chemistry", "MCAT physics",
  "MCAT psych/soc", "Custom",
] as const;

/** Structured error taxonomy (directive §9) — why a question was missed. */
export type QuestionErrorType =
  | "knowledge-gap"
  | "misread-stem"
  | "missed-clue"
  | "wrong-differential"
  | "incorrect-mechanism"
  | "management-error"
  | "timing-error"
  | "changed-correct-answer"
  | "overthinking"
  | "memorization-failure"
  | "data-interpretation"
  | "test-strategy";

export const ERROR_TYPE_LABEL: Record<QuestionErrorType, string> = {
  "knowledge-gap": "Knowledge gap",
  "misread-stem": "Misread the stem",
  "missed-clue": "Missed a clue",
  "wrong-differential": "Wrong differential",
  "incorrect-mechanism": "Incorrect mechanism",
  "management-error": "Management error",
  "timing-error": "Ran out of time",
  "changed-correct-answer": "Changed a correct answer",
  overthinking: "Overthinking",
  "memorization-failure": "Memorization failure",
  "data-interpretation": "Image/data interpretation",
  "test-strategy": "Test-taking strategy",
};

export interface QuestionOption {
  key: string; // "A", "B", …
  text: string;
}

export interface QuestionAttempt {
  at: string; // ISO
  answerKey?: string;
  status: QuestionStatus;
  confidence?: 1 | 2 | 3 | 4 | 5;
  timeSpentSeconds?: number;
  changedFromKey?: string;
  errorType?: QuestionErrorType;
  note?: string;
}

export type ExtractionConfidence = "high" | "medium" | "low";

export interface QuestionRecord {
  id: ID;
  source: QuestionSource;
  /** Original upload metadata — the file itself is not stored, its identity is. */
  sourceFile?: { name: string; type: string; size: number; addedAt: string };
  stem: string;
  options: QuestionOption[];
  correctKey?: string;
  explanation?: string;
  /** Latest attempt state, denormalized for filtering. */
  userAnswerKey?: string;
  status: QuestionStatus;
  confidence?: 1 | 2 | 3 | 4 | 5;
  timeSpentSeconds?: number;
  courseId?: ID;
  module?: string;
  system?: string;
  topic?: string;
  objective?: string;
  /** Named question bank / set this question belongs to (user-defined label). */
  bank?: string;
  /** Formal links into the library (schema v30): set + source document. */
  setId?: ID;
  sourceDocumentId?: ID;
  /** The source document's own numbering and page, when known. */
  questionNumber?: number;
  sourcePage?: number;
  category?: string;
  subcategory?: string;
  examType?: QuestionExamType;
  difficulty?: QuestionDifficulty;
  /** User-marked for review — independent of status. */
  marked?: boolean;
  tags: string[];
  errorType?: QuestionErrorType;
  notes?: string;
  attempts: QuestionAttempt[];
  attemptedAt?: string;
  reviewDueAt?: string;
  ai?: { generated: boolean; provider?: string; model?: string; promptVersion?: string };
  extraction?: { confidence: ExtractionConfidence; reviewed: boolean };
  citation?: string;
  createdAt: string;
  updatedAt: string;
}

// --- validation ---------------------------------------------------------------

export interface ValidationResult<T> {
  ok: boolean;
  errors: string[];
  value?: T;
}

const STATUSES: QuestionStatus[] = ["unseen", "in-progress", "correct", "incorrect", "guessed", "flagged", "needs-review"];
const SOURCES: QuestionSource[] = ["pasted", "screenshot", "image", "pdf", "imported", "manual", "ai-generated"];
const ERROR_TYPES = Object.keys(ERROR_TYPE_LABEL) as QuestionErrorType[];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Validate an unknown payload into a QuestionRecord. Used at every boundary
 * (paste parser, import, AI generation) so broken extraction can never corrupt
 * saved records. Missing safe fields are defaulted; structural problems fail.
 */
export function validateQuestionRecord(input: unknown, now: Date = new Date()): ValidationResult<QuestionRecord> {
  const errors: string[] = [];
  if (!isRecord(input)) return { ok: false, errors: ["Question must be an object."] };

  const stem = typeof input.stem === "string" ? input.stem.trim() : "";
  if (!stem) errors.push("Question stem is required.");
  if (stem.length > 8000) errors.push("Question stem is unreasonably long (>8000 chars).");

  const rawOptions = Array.isArray(input.options) ? input.options : [];
  const options: QuestionOption[] = [];
  for (const opt of rawOptions) {
    if (!isRecord(opt) || typeof opt.text !== "string" || !opt.text.trim()) continue;
    const key = typeof opt.key === "string" && opt.key.trim()
      ? opt.key.trim().toUpperCase()
      : String.fromCharCode(65 + options.length);
    options.push({ key, text: opt.text.trim() });
  }
  const keys = new Set(options.map((o) => o.key));
  if (keys.size !== options.length) errors.push("Answer option keys must be unique.");

  const correctKey = typeof input.correctKey === "string" && input.correctKey.trim()
    ? input.correctKey.trim().toUpperCase()
    : undefined;
  if (correctKey && options.length > 0 && !keys.has(correctKey)) {
    errors.push(`Correct answer "${correctKey}" does not match any option.`);
  }

  const status = STATUSES.includes(input.status as QuestionStatus) ? input.status as QuestionStatus : "unseen";
  const source = SOURCES.includes(input.source as QuestionSource) ? input.source as QuestionSource : "manual";
  const errorType = ERROR_TYPES.includes(input.errorType as QuestionErrorType) ? input.errorType as QuestionErrorType : undefined;

  if (errors.length) return { ok: false, errors };

  const iso = now.toISOString();
  return {
    ok: true,
    errors: [],
    value: {
      id: typeof input.id === "string" && input.id ? input.id : crypto.randomUUID(),
      source,
      sourceFile: isRecord(input.sourceFile) && typeof input.sourceFile.name === "string"
        ? {
            name: input.sourceFile.name,
            type: typeof input.sourceFile.type === "string" ? input.sourceFile.type : "unknown",
            size: typeof input.sourceFile.size === "number" ? input.sourceFile.size : 0,
            addedAt: typeof input.sourceFile.addedAt === "string" ? input.sourceFile.addedAt : iso,
          }
        : undefined,
      stem,
      options,
      correctKey,
      explanation: typeof input.explanation === "string" && input.explanation.trim() ? input.explanation.trim() : undefined,
      userAnswerKey: typeof input.userAnswerKey === "string" ? input.userAnswerKey.toUpperCase() : undefined,
      status,
      confidence: isConfidence(input.confidence) ? input.confidence : undefined,
      timeSpentSeconds: typeof input.timeSpentSeconds === "number" && input.timeSpentSeconds >= 0 ? input.timeSpentSeconds : undefined,
      courseId: typeof input.courseId === "string" ? input.courseId : undefined,
      module: cleanString(input.module),
      system: cleanString(input.system),
      topic: cleanString(input.topic),
      objective: cleanString(input.objective),
      bank: cleanString(input.bank),
      setId: typeof input.setId === "string" && input.setId ? input.setId : undefined,
      sourceDocumentId: typeof input.sourceDocumentId === "string" && input.sourceDocumentId ? input.sourceDocumentId : undefined,
      questionNumber: typeof input.questionNumber === "number" && input.questionNumber > 0 ? Math.floor(input.questionNumber) : undefined,
      sourcePage: typeof input.sourcePage === "number" && input.sourcePage > 0 ? Math.floor(input.sourcePage) : undefined,
      category: cleanString(input.category),
      subcategory: cleanString(input.subcategory),
      examType: (Object.keys(EXAM_TYPE_LABEL) as QuestionExamType[]).includes(input.examType as QuestionExamType)
        ? input.examType as QuestionExamType
        : undefined,
      difficulty: (["easy", "medium", "hard"] as const).includes(input.difficulty as QuestionDifficulty)
        ? input.difficulty as QuestionDifficulty
        : undefined,
      marked: input.marked === true,
      tags: Array.isArray(input.tags) ? input.tags.filter((t): t is string => typeof t === "string" && !!t.trim()).map((t) => t.trim()) : [],
      errorType,
      notes: cleanString(input.notes),
      attempts: Array.isArray(input.attempts) ? (input.attempts as QuestionAttempt[]) : [],
      attemptedAt: typeof input.attemptedAt === "string" ? input.attemptedAt : undefined,
      reviewDueAt: typeof input.reviewDueAt === "string" ? input.reviewDueAt : undefined,
      ai: isRecord(input.ai)
        ? {
            generated: input.ai.generated === true,
            provider: cleanString(input.ai.provider),
            model: cleanString(input.ai.model),
            promptVersion: cleanString(input.ai.promptVersion),
          }
        : source === "ai-generated" ? { generated: true } : undefined,
      extraction: isRecord(input.extraction)
        ? {
            confidence: (["high", "medium", "low"] as const).includes(input.extraction.confidence as ExtractionConfidence)
              ? input.extraction.confidence as ExtractionConfidence
              : "low",
            reviewed: input.extraction.reviewed === true,
          }
        : undefined,
      citation: cleanString(input.citation),
      createdAt: typeof input.createdAt === "string" ? input.createdAt : iso,
      updatedAt: iso,
    },
  };
}

function cleanString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
function isConfidence(v: unknown): v is 1 | 2 | 3 | 4 | 5 {
  return typeof v === "number" && [1, 2, 3, 4, 5].includes(v);
}

// --- attempts + review scheduling ----------------------------------------------

/** Days until the next review, keyed by how the attempt went. */
const REVIEW_INTERVALS: Partial<Record<QuestionStatus, number>> = {
  incorrect: 2,
  guessed: 3,
  "needs-review": 2,
  flagged: 4,
  correct: 10,
};

export function applyAttempt(question: QuestionRecord, attempt: Omit<QuestionAttempt, "at">, now: Date = new Date()): QuestionRecord {
  const at = now.toISOString();
  const full: QuestionAttempt = { ...attempt, at };
  const interval = REVIEW_INTERVALS[attempt.status];
  const reviewDueAt = interval
    ? new Date(now.getTime() + interval * 24 * 60 * 60 * 1000).toISOString()
    : question.reviewDueAt;
  return {
    ...question,
    userAnswerKey: attempt.answerKey ?? question.userAnswerKey,
    status: attempt.status,
    confidence: attempt.confidence ?? question.confidence,
    timeSpentSeconds: attempt.timeSpentSeconds ?? question.timeSpentSeconds,
    errorType: attempt.errorType ?? question.errorType,
    attempts: [...question.attempts, full],
    attemptedAt: at,
    reviewDueAt,
    updatedAt: at,
  };
}

export function dueQuestions(questions: QuestionRecord[], now: Date = new Date()): QuestionRecord[] {
  const iso = now.toISOString();
  return questions.filter((q) => q.reviewDueAt && q.reviewDueAt <= iso);
}

// --- modes ----------------------------------------------------------------------

export type QuestionMode =
  | "study"
  | "timed-block"
  | "review"
  | "weakness"
  | "faculty-style"
  | "incorrects-only"
  | "guessed-correctly"
  | "changed-answer"
  | "repeat-offenders"
  | "exam-simulation";

export const MODE_META: Record<QuestionMode, { label: string; note: string; ready: boolean }> = {
  study: { label: "Study Mode", note: "Untimed, explanation after each answer.", ready: true },
  review: { label: "Review Mode", note: "Everything due for another look.", ready: true },
  "incorrects-only": { label: "Incorrects Only", note: "Only questions you missed.", ready: true },
  "guessed-correctly": { label: "Guessed Correctly", note: "Right answer, shaky ground.", ready: true },
  "changed-answer": { label: "Changed Answer", note: "Attempts where you switched answers.", ready: true },
  "repeat-offenders": { label: "Repeat Offenders", note: "Missed more than once.", ready: true },
  weakness: { label: "Weakness Mode", note: "Focused on your weakest topics.", ready: true },
  "timed-block": { label: "Timed Block", note: "Block timing — in development.", ready: false },
  "faculty-style": { label: "Faculty Style", note: "Filtered by analyzed style patterns — in development.", ready: false },
  "exam-simulation": { label: "Exam Simulation", note: "Full simulated block — in development.", ready: false },
};

export function filterForMode(questions: QuestionRecord[], mode: QuestionMode, now: Date = new Date()): QuestionRecord[] {
  switch (mode) {
    case "study":
      return questions.filter((q) => q.status === "unseen" || q.status === "in-progress");
    case "review":
      return dueQuestions(questions, now);
    case "incorrects-only":
      return questions.filter((q) => q.status === "incorrect");
    case "guessed-correctly":
      return questions.filter((q) => q.attempts.some((a) => a.status === "guessed") && q.status !== "incorrect");
    case "changed-answer":
      return questions.filter((q) => q.attempts.some((a) => a.changedFromKey));
    case "repeat-offenders":
      return questions.filter((q) => q.attempts.filter((a) => a.status === "incorrect").length >= 2);
    case "weakness": {
      const weak = new Set(weakTopics(questions, 5).map((w) => w.topic));
      return questions.filter((q) => q.topic && weak.has(q.topic));
    }
    default:
      return [];
  }
}

// --- pattern surfacing ------------------------------------------------------------

export interface WeakTopic {
  topic: string;
  attempts: number;
  incorrect: number;
  missRate: number;
}

export function weakTopics(questions: QuestionRecord[], limit = 5): WeakTopic[] {
  const byTopic = new Map<string, { attempts: number; incorrect: number }>();
  for (const q of questions) {
    const topic = q.topic ?? q.system;
    if (!topic || !q.attempts.length) continue;
    const agg = byTopic.get(topic) ?? { attempts: 0, incorrect: 0 };
    for (const a of q.attempts) {
      agg.attempts++;
      if (a.status === "incorrect" || a.status === "guessed") agg.incorrect++;
    }
    byTopic.set(topic, agg);
  }
  return [...byTopic.entries()]
    .filter(([, v]) => v.attempts >= 2 && v.incorrect > 0)
    .map(([topic, v]) => ({ topic, ...v, missRate: v.incorrect / v.attempts }))
    .sort((a, b) => b.missRate - a.missRate || b.incorrect - a.incorrect)
    .slice(0, limit);
}

export interface ErrorPattern {
  errorType: QuestionErrorType;
  count: number;
  share: number; // 0..1 of classified errors
}

/** Recurring error patterns — the point is the WHY, not the count of wrongs. */
export function errorPatterns(questions: QuestionRecord[]): ErrorPattern[] {
  const counts = new Map<QuestionErrorType, number>();
  let total = 0;
  for (const q of questions) {
    for (const a of q.attempts) {
      if (!a.errorType) continue;
      counts.set(a.errorType, (counts.get(a.errorType) ?? 0) + 1);
      total++;
    }
  }
  return [...counts.entries()]
    .map(([errorType, count]) => ({ errorType, count, share: total ? count / total : 0 }))
    .sort((a, b) => b.count - a.count);
}

// --- faculty style analyzer (Phase 6 §13) -------------------------------------------
// Broad, non-identifying structural patterns only. Output language is hedged —
// never claims certainty about an instructor's intent.

export interface StyleFinding {
  observation: string;
  detail: string;
}

export interface FacultyStyleReport {
  sampleSize: number;
  reliable: boolean;
  findings: StyleFinding[];
  suggestion: string;
}

export function analyzeQuestionStyle(questions: QuestionRecord[]): FacultyStyleReport {
  const sample = questions.filter((q) => q.stem.trim().length > 0);
  const n = sample.length;
  if (n < 5) {
    return {
      sampleSize: n,
      reliable: false,
      findings: [],
      suggestion: "Add at least 5 questions from the same source to see structural patterns.",
    };
  }

  const findings: StyleFinding[] = [];
  const avgStemWords = Math.round(sample.reduce((a, q) => a + q.stem.split(/\s+/).length, 0) / n);
  findings.push({
    observation: avgStemWords > 80 ? "Long, vignette-style stems" : avgStemWords > 35 ? "Moderate stem length" : "Short, direct stems",
    detail: `Average stem length is about ${avgStemWords} words across ${n} questions.`,
  });

  const optionCounts = sample.filter((q) => q.options.length > 0).map((q) => q.options.length);
  if (optionCounts.length) {
    const modal = mode(optionCounts);
    findings.push({ observation: `${modal}-option format appears most often`, detail: `Most questions here carry ${modal} answer choices.` });
  }

  const nextStep = countMatching(sample, /next (best )?step|most appropriate (next )?management/i);
  const mostLikely = countMatching(sample, /most likely|most probable/i);
  const mechanism = countMatching(sample, /mechanism|pathophysiolog|enzyme|receptor|pathway/i);
  const dataHeavy = countMatching(sample, /\blab(s|oratory)?\b|\bimag(e|ing)\b|x-ray|ct |mri|figure|table|shown below/i);

  if (mostLikely / n > 0.3) findings.push({ observation: `"Most likely" phrasing is frequent`, detail: `${pct(mostLikely, n)} of stems ask for the most likely diagnosis/finding — this dataset appears to emphasize recognition.` });
  if (nextStep / n > 0.2) findings.push({ observation: `"Next best step" questions recur`, detail: `${pct(nextStep, n)} of stems ask about management sequencing — questions frequently test application, not just recall.` });
  if (mechanism / n > 0.3) findings.push({ observation: "Mechanism emphasis", detail: `${pct(mechanism, n)} of stems reference mechanisms/pathways — a reasonable preparation focus may be first-principles physiology.` });
  if (dataHeavy / n > 0.25) findings.push({ observation: "Data/image interpretation load", detail: `${pct(dataHeavy, n)} of stems reference labs, imaging, or figures.` });

  const topics = new Map<string, number>();
  for (const q of sample) {
    const t = q.topic ?? q.system;
    if (t) topics.set(t, (topics.get(t) ?? 0) + 1);
  }
  const topTopic = [...topics.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topTopic && topTopic[1] / n > 0.2) {
    findings.push({ observation: `Topic weighting toward ${topTopic[0]}`, detail: `${pct(topTopic[1], n)} of tagged questions fall under ${topTopic[0]}.` });
  }

  return {
    sampleSize: n,
    reliable: n >= 12,
    findings,
    suggestion: n >= 12
      ? "These are structural observations of this dataset, not statements about intent. A reasonable preparation focus may be the patterns above plus your own error log."
      : "Patterns from small samples are unstable — treat these as hints until the set grows past ~12 questions.",
  };
}

function countMatching(qs: QuestionRecord[], re: RegExp): number {
  return qs.filter((q) => re.test(q.stem)).length;
}
function pct(part: number, whole: number): string {
  return `${Math.round((part / whole) * 100)}%`;
}
function mode(nums: number[]): number {
  const counts = new Map<number, number>();
  for (const v of nums) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

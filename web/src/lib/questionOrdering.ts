// ===========================================================================
// Q2b-3: deterministic question ordering. Every ordering is a *total* order with
// a stable id tiebreak, so a fixed membership always produces the same sequence.
// "random" is reproducible from a stored seed: the same seed over the same set
// yields the same order, always — the list is canonicalized (sorted by id)
// before the seeded Fisher–Yates shuffle so the result never depends on the
// incoming array order.
// ===========================================================================
import type { QuestionRecord } from "./questions";

export type QuestionOrdering = "import" | "question-number" | "source" | "created" | "random";

export const QUESTION_ORDERINGS: readonly QuestionOrdering[] = [
  "import", "question-number", "source", "created", "random",
] as const;

export const ORDERING_LABEL: Record<QuestionOrdering, string> = {
  "import": "Recently added",
  "question-number": "Question number",
  "source": "Source (A→Z)",
  "created": "Date added",
  "random": "Random (seeded)",
};

export function isQuestionOrdering(value: unknown): value is QuestionOrdering {
  return typeof value === "string" && (QUESTION_ORDERINGS as readonly string[]).includes(value);
}

/** Short, URL-safe, human-shareable seed. */
export function makeOrderingSeed(): string {
  return Math.random().toString(36).slice(2, 10) || "seed";
}

/** FNV-1a 32-bit — a stable, dependency-free string hash for seeding the PRNG. */
function hashSeed(seed: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32 — small, fast, well-distributed deterministic PRNG in [0, 1). */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function byId(a: QuestionRecord, b: QuestionRecord): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function createdAsc(a: QuestionRecord, b: QuestionRecord): number {
  const at = Date.parse(a.createdAt);
  const bt = Date.parse(b.createdAt);
  const av = Number.isFinite(at) ? at : 0;
  const bv = Number.isFinite(bt) ? bt : 0;
  return av - bv;
}

function questionNumber(question: QuestionRecord): number {
  return typeof question.questionNumber === "number" && Number.isFinite(question.questionNumber)
    ? question.questionNumber
    : Number.POSITIVE_INFINITY; // unknown numbers sort last, deterministically
}

function sourceKey(question: QuestionRecord): string {
  return (question.sourceFile?.name ?? question.bank ?? "").toLowerCase();
}

/** Seeded Fisher–Yates over a canonicalized (id-sorted) copy for reproducibility. */
function seededShuffle(questions: readonly QuestionRecord[], seed: string): QuestionRecord[] {
  const list = [...questions].sort(byId);
  const rand = mulberry32(hashSeed(seed));
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}

/** Return a new array ordered deterministically. `import` preserves the given
 * membership order (the snapshot's insertion order); every other mode sorts. */
export function orderQuestions(
  questions: readonly QuestionRecord[],
  ordering: QuestionOrdering,
  seed?: string,
): QuestionRecord[] {
  switch (ordering) {
    case "question-number":
      return [...questions].sort((a, b) => questionNumber(a) - questionNumber(b) || createdAsc(a, b) || byId(a, b));
    case "source":
      return [...questions].sort((a, b) => sourceKey(a).localeCompare(sourceKey(b)) || questionNumber(a) - questionNumber(b) || byId(a, b));
    case "created":
      return [...questions].sort((a, b) => createdAsc(a, b) || byId(a, b));
    case "random":
      return seededShuffle(questions, seed && seed.length ? seed : "0");
    case "import":
    default:
      return [...questions];
  }
}

// ===========================================================================
// Structured-output validation (directive §8, §11, §12). Every AI response is
// parsed through these validators before the user sees it; invalid payloads
// fail loudly instead of leaking malformed drafts into review queues.
// ===========================================================================
import type { AiBriefProposal, GeneratedCardDraft, GeneratedQuestionDraft } from "./types";
import type { ValidationResult } from "../questions";
import { CARD_TYPE_LABEL, type AnkiCardType } from "../ankiCards";

const BRIEF_MODES = ["maintain", "catch-up", "recovery", "sprint", "exam-week"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}
function num(v: unknown, fallback: number, lo: number, hi: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : fallback;
  return Math.min(hi, Math.max(lo, n));
}
function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.trim()) : [];
}

export function validateAiBrief(input: unknown): ValidationResult<AiBriefProposal> {
  if (!isRecord(input)) return { ok: false, errors: ["Brief proposal must be an object."] };
  const errors: string[] = [];
  const mode = str(input.mode);
  if (!BRIEF_MODES.includes(mode)) errors.push(`Unknown mode "${mode}".`);
  const move = isRecord(input.nextBestMove) ? input.nextBestMove : undefined;
  if (!move || !str(move.title)) errors.push("nextBestMove.title is required.");
  const mvw = isRecord(input.minimumViableWin) ? input.minimumViableWin : undefined;
  if (!mvw || !str(mvw.title)) errors.push("minimumViableWin.title is required.");
  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    value: {
      mode: mode as AiBriefProposal["mode"],
      rationale: str(input.rationale, "No rationale provided."),
      nextBestMove: {
        title: str(move!.title),
        reason: str(move!.reason, "No reason provided."),
        estimatedMinutes: num(move!.estimatedMinutes, 45, 5, 240),
      },
      minimumViableWin: {
        title: str(mvw!.title),
        estimatedMinutes: num(mvw!.estimatedMinutes, 10, 1, 60),
      },
      recommendedDuration: num(input.recommendedDuration, 45, 5, 240),
      priorityLevel: (["low", "medium", "high"] as const).includes(input.priorityLevel as "low")
        ? input.priorityLevel as AiBriefProposal["priorityLevel"]
        : "medium",
      recoveryActions: strArray(input.recoveryActions),
      warnings: strArray(input.warnings),
      confidence: num(input.confidence, 0.5, 0, 1),
      assumptions: strArray(input.assumptions),
    },
  };
}

const CARD_TYPES = Object.keys(CARD_TYPE_LABEL);

export function validateGeneratedCards(input: unknown): ValidationResult<GeneratedCardDraft[]> {
  const root = isRecord(input) && Array.isArray(input.cards) ? input.cards : Array.isArray(input) ? input : null;
  if (!root) return { ok: false, errors: ["Expected a { cards: [...] } payload."] };
  const drafts: GeneratedCardDraft[] = [];
  const errors: string[] = [];
  root.forEach((item, i) => {
    if (!isRecord(item)) { errors.push(`Card ${i + 1} is not an object.`); return; }
    const front = str(item.front);
    const back = str(item.back);
    const type = CARD_TYPES.includes(str(item.type)) ? str(item.type) as AnkiCardType : "basic";
    if (!front) { errors.push(`Card ${i + 1} has no front.`); return; }
    if (!back && type !== "cloze") { errors.push(`Card ${i + 1} has no back.`); return; }
    if (type === "cloze" && !/\{\{c\d+::/.test(front)) { errors.push(`Card ${i + 1} claims cloze but has no deletion.`); return; }
    drafts.push({
      type,
      front,
      back,
      extra: str(item.extra) || undefined,
      tags: strArray(item.tags),
      source: str(item.source) || undefined,
    });
  });
  if (!drafts.length) return { ok: false, errors: errors.length ? errors : ["No valid cards in the response."] };
  return { ok: true, errors, value: drafts };
}

export function validateGeneratedQuestions(input: unknown): ValidationResult<GeneratedQuestionDraft[]> {
  const root = isRecord(input) && Array.isArray(input.questions) ? input.questions : Array.isArray(input) ? input : null;
  if (!root) return { ok: false, errors: ["Expected a { questions: [...] } payload."] };
  const drafts: GeneratedQuestionDraft[] = [];
  const errors: string[] = [];
  root.forEach((item, i) => {
    if (!isRecord(item)) { errors.push(`Question ${i + 1} is not an object.`); return; }
    const stem = str(item.stem);
    const options = Array.isArray(item.options)
      ? item.options
          .filter(isRecord)
          .map((o, j) => ({ key: str(o.key, String.fromCharCode(65 + j)).toUpperCase(), text: str(o.text) }))
          .filter((o) => o.text)
      : [];
    const correctKey = str(item.correctKey).toUpperCase();
    if (!stem) { errors.push(`Question ${i + 1} has no stem.`); return; }
    if (options.length < 3) { errors.push(`Question ${i + 1} has fewer than 3 options.`); return; }
    if (!options.some((o) => o.key === correctKey)) { errors.push(`Question ${i + 1}'s correct answer doesn't match an option.`); return; }
    if (!str(item.explanation)) { errors.push(`Question ${i + 1} has no explanation — rejected (unexplained answers aren't studyable).`); return; }
    drafts.push({
      stem,
      options,
      correctKey,
      explanation: str(item.explanation),
      whyOthersWrong: str(item.whyOthersWrong) || undefined,
      tags: strArray(item.tags),
      estimatedDifficulty: (["easy", "medium", "hard"] as const).includes(str(item.estimatedDifficulty) as "easy")
        ? str(item.estimatedDifficulty) as GeneratedQuestionDraft["estimatedDifficulty"]
        : "medium",
    });
  });
  if (!drafts.length) return { ok: false, errors: errors.length ? errors : ["No valid questions in the response."] };
  return { ok: true, errors, value: drafts };
}

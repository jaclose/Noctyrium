// ===========================================================================
// Question intake parser (directive §10). Turns pasted question text into a
// draft QuestionRecord for user review — the pipeline is paste → extract →
// SHOW FOR REVIEW → correct → save. The parser never invents answers; anything
// it is unsure about is left blank and the extraction confidence is lowered so
// the review step makes uncertainty obvious.
// ===========================================================================
import type { ExtractionConfidence, QuestionOption } from "./questions";

export interface ParsedQuestionDraft {
  stem: string;
  options: QuestionOption[];
  correctKey?: string;
  explanation?: string;
  /** Metadata lines detected in the block ("Topic:", "Source:", …). */
  topic?: string;
  system?: string;
  sourceLabel?: string;
  category?: string;
  tags?: string[];
  /** The document's own question number, when present ("12." → 12). */
  questionNumber?: number;
  /** Page in the source document this question came from (PDF imports). */
  sourcePage?: number;
  confidence: ExtractionConfidence;
  warnings: string[];
}

/** Lines like "A. text", "B) text", "(C) text", "d - text". */
const OPTION_RE = /^\s*\(?([A-Ha-h])[).:\-–]\s+(.*\S)\s*$/;
/** "Answer: C", "Correct answer - B", "ANS: A", "Correct: B". */
const ANSWER_RE = /^\s*(?:(?:correct\s+)?ans(?:wer)?|correct)\s*[:\-–]?\s*\(?([A-Ha-h])\)?\s*$/i;
/** "Explanation:", "Rationale:", "Discussion:". */
const EXPLANATION_RE = /^\s*(explanation|rationale|discussion|why)\s*[:\-–]/i;
/** Metadata lines: "Topic: Complement", "System: Immuno", "Source: SGU NB3", "Tags: a, b". */
const META_RE = /^\s*(topic|system|source|category|subject|tags)\s*[:\-–]\s*(.+\S)\s*$/i;
/** A numbered question start: "1. ", "12) ", "Q3: ", "Question 4." */
const QUESTION_START_RE = /^\s*(?:q(?:uestion)?\s*)?(\d{1,3})\s*[).:]\s+\S/i;

export function parseQuestionText(raw: string): ParsedQuestionDraft {
  const warnings: string[] = [];
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");

  const stemLines: string[] = [];
  const options: QuestionOption[] = [];
  const explanationLines: string[] = [];
  const meta: Record<string, string> = {};
  let correctKey: string | undefined;
  let phase: "stem" | "options" | "explanation" = "stem";

  for (const line of lines) {
    const optionMatch = line.match(OPTION_RE);
    const answerMatch = line.match(ANSWER_RE);
    const explanationMatch = line.match(EXPLANATION_RE);
    const metaMatch = line.match(META_RE);

    if (metaMatch && phase !== "stem") {
      meta[metaMatch[1].toLowerCase()] = metaMatch[2].trim();
      continue;
    }
    if (explanationMatch) {
      phase = "explanation";
      const rest = line.replace(EXPLANATION_RE, "").trim();
      if (rest) explanationLines.push(rest);
      continue;
    }
    if (answerMatch && phase !== "stem") {
      correctKey = answerMatch[1].toUpperCase();
      continue;
    }
    if (optionMatch && (phase === "options" || isLikelyFirstOption(optionMatch[1], options))) {
      phase = "options";
      options.push({ key: optionMatch[1].toUpperCase(), text: optionMatch[2].trim() });
      continue;
    }
    if (phase === "stem") stemLines.push(line);
    else if (phase === "options" && line.trim()) {
      // Continuation of the previous option's wrapped text.
      const last = options[options.length - 1];
      if (last) last.text = `${last.text} ${line.trim()}`;
    } else if (phase === "explanation") explanationLines.push(line);
  }

  const stem = stemLines.join("\n").trim();
  const explanation = explanationLines.join("\n").trim() || undefined;

  // Confidence: honest, never "perfect extraction".
  let confidence: ExtractionConfidence = "high";
  if (!stem) {
    warnings.push("No question stem detected — paste the full question including the stem.");
    confidence = "low";
  }
  if (options.length === 0) {
    warnings.push("No answer options detected. Add them manually or check the paste format (A. / B. / C.).");
    confidence = "low";
  } else if (options.length < 3) {
    warnings.push(`Only ${options.length} option${options.length === 1 ? "" : "s"} detected — most exam questions have 4–5.`);
    confidence = confidence === "high" ? "medium" : confidence;
  }
  const keys = options.map((o) => o.key);
  if (new Set(keys).size !== keys.length) {
    warnings.push("Duplicate option letters detected — review the split.");
    confidence = "low";
  }
  if (correctKey && !keys.includes(correctKey)) {
    warnings.push(`Detected answer "${correctKey}" doesn't match any option — left unset.`);
    correctKey = undefined;
    confidence = confidence === "high" ? "medium" : confidence;
  }
  if (!correctKey) {
    warnings.push("No correct answer detected. The question saves fine without one — set it after checking the source.");
    if (confidence === "high") confidence = "medium";
  }

  return {
    stem,
    options,
    correctKey,
    explanation,
    topic: meta.topic,
    system: meta.system,
    sourceLabel: meta.source,
    category: meta.category ?? meta.subject,
    tags: meta.tags ? meta.tags.split(/[,;]/).map((t) => t.trim()).filter(Boolean) : undefined,
    confidence,
    warnings,
  };
}

/** Options should start at A (or the next expected letter) — otherwise a line
 * like "B) both kidneys" inside a stem shouldn't flip us into option mode. */
function isLikelyFirstOption(letter: string, existing: QuestionOption[]): boolean {
  if (existing.length > 0) return true;
  return letter.toUpperCase() === "A";
}

/**
 * Split a pasted block that may contain SEVERAL numbered questions
 * ("1. …", "Q2) …") into per-question drafts, then map any trailing answer-key
 * section ("Answer key: 1. C  2. B", "1-C", "Answers: 1C, 2B") back onto the
 * questions by number. Ambiguous keys are flagged, never invented.
 */
export function parseQuestionBlocks(raw: string): ParsedQuestionDraft[] {
  const { body, answerKey } = splitAnswerKeySection(raw.replace(/\r\n?/g, "\n"));
  const lines = body.split("\n");
  const starts: number[] = [];
  lines.forEach((line, i) => {
    if (QUESTION_START_RE.test(line)) starts.push(i);
  });

  let drafts: ParsedQuestionDraft[];
  // One (or zero) numbered starts → single-question parse of the whole text.
  if (starts.length <= 1) {
    const number = starts.length === 1 ? leadingNumber(body) : undefined;
    const cleaned = starts.length === 1 ? stripLeadingNumber(body) : body;
    const draft = parseQuestionText(cleaned);
    draft.questionNumber = number;
    drafts = draft.stem || draft.options.length ? [draft] : [];
  } else {
    drafts = [];
    // Any preamble before the first numbered question is dropped.
    for (let b = 0; b < starts.length; b++) {
      const from = starts[b];
      const to = b + 1 < starts.length ? starts[b + 1] : lines.length;
      const block = lines.slice(from, to).join("\n");
      const draft = parseQuestionText(stripLeadingNumber(block));
      draft.questionNumber = leadingNumber(block);
      if (draft.stem || draft.options.length) drafts.push(draft);
    }
    const numbers = drafts.map((d) => d.questionNumber).filter((n): n is number => n !== undefined);
    if (new Set(numbers).size !== numbers.length) {
      for (const d of drafts) d.warnings.push("Duplicate question numbers in this document — check the split.");
    }
  }

  return answerKey.size ? applyAnswerKey(drafts, answerKey) : drafts;
}

function leadingNumber(block: string): number | undefined {
  const match = block.match(/^\s*(?:q(?:uestion)?\s*)?(\d{1,3})\s*[).:]\s+/i);
  return match ? Number(match[1]) : undefined;
}

function stripLeadingNumber(block: string): string {
  return block.replace(/^\s*(?:q(?:uestion)?\s*)?\d{1,3}\s*[).:]\s+/i, "");
}

// --- answer-key section ---------------------------------------------------------

const KEY_HEADER_RE = /^\s*(answer\s*key|answers)\s*[:\-–]?\s*$/im;
/** Pairs like "1. C", "2-B", "3) D", "Question 4: A", "5C". */
const KEY_PAIR_RE = /(?:question\s*)?(\d{1,3})\s*[).:\-–]?\s*\(?([A-Ha-h])\)?(?![a-z0-9])/gi;

/**
 * Detect a trailing answer-key section and parse number→letter pairs from it.
 * Returns the body without the key plus the parsed map.
 */
export function splitAnswerKeySection(text: string): { body: string; answerKey: Map<number, string> } {
  const answerKey = new Map<number, string>();
  const headerMatch = text.match(KEY_HEADER_RE);
  let body = text;
  let keyText = "";

  if (headerMatch && headerMatch.index !== undefined) {
    keyText = text.slice(headerMatch.index + headerMatch[0].length);
    body = text.slice(0, headerMatch.index);
  } else {
    // Inline form: "Answers: 1C, 2B, 3D" on a single line. Must contain real
    // number→letter pairs — a per-question "Answer: B" line is NOT a key
    // section and stays in the body for the single-question parser.
    const inline = text.match(/^\s*answers?\s*[:\-–]\s*(.+\S)\s*$/im);
    if (inline && inline.index !== undefined && /\d{1,3}\s*[).:\-–]?\s*\(?[A-Ha-h]\)?(?![a-z0-9])/.test(inline[1])) {
      keyText = inline[1];
      body = text.slice(0, inline.index) + text.slice(inline.index + inline[0].length);
    }
  }
  if (!keyText) return { body: text, answerKey };

  for (const match of keyText.matchAll(KEY_PAIR_RE)) {
    const num = Number(match[1]);
    const letter = match[2].toUpperCase();
    // Conflicting duplicate entries poison that number — flag, don't guess.
    if (answerKey.has(num) && answerKey.get(num) !== letter) answerKey.set(num, "?");
    else if (!answerKey.has(num)) answerKey.set(num, letter);
  }
  return { body, answerKey };
}

function applyAnswerKey(drafts: ParsedQuestionDraft[], key: Map<number, string>): ParsedQuestionDraft[] {
  return drafts.map((draft) => {
    if (draft.correctKey || draft.questionNumber === undefined) return draft;
    const mapped = key.get(draft.questionNumber);
    if (!mapped) return draft;
    if (mapped === "?") {
      return { ...draft, warnings: [...draft.warnings, "The answer key lists conflicting answers for this number — left unset."] };
    }
    if (!draft.options.some((o) => o.key === mapped)) {
      return { ...draft, warnings: [...draft.warnings, `Answer key says "${mapped}" but no such option exists — left unset.`] };
    }
    return {
      ...draft,
      correctKey: mapped,
      confidence: draft.confidence === "low" ? "low" : "high",
      warnings: draft.warnings.filter((w) => !/no correct answer detected/i.test(w)),
    };
  });
}

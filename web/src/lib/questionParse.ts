// ===========================================================================
// Question parser — layered extraction (rehaul phase 3):
//   L1 question detection (numbered stems + options)
//   L2 answer-key detection (trailing keys, inline keys, compressed keys)
//   L3 explanation detection (inline blocks + "Answers and Explanations"
//      sections mapped back by question number)
//   L4 choice-rationale detection ("A is incorrect because…")
//   L5 conflict detection (key says C, explanation prose says B → flag,
//      unset, require review)
//   L6 confidence scoring (high only when number/options/answer/explanation
//      align)
// The parser never invents answers or explanations. Anything uncertain is
// left blank with a visible warning and a needs-review flag.
// ===========================================================================
import type { ExtractionConfidence, QuestionOption } from "./questions";

export interface ParsedQuestionDraft {
  stem: string;
  options: QuestionOption[];
  correctKey?: string;
  explanation?: string;
  /** Per-choice rationales ("A is incorrect because…"), keyed by letter. */
  choiceRationales?: Record<string, string>;
  /** Where the explanation came from — inline block or a trailing section. */
  explanationSource?: "inline" | "answer-section";
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
  /** Set when a conflict or serious ambiguity demands human review. */
  needsReview?: boolean;
  confidence: ExtractionConfidence;
  warnings: string[];
}

/** One entry from an "Answers / Answers & Explanations" section. */
export interface AnswerSectionEntry {
  /** "?" = conflicting entries for this number. */
  letter?: string;
  explanation?: string;
}

/** Lines like "A. text", "B) text", "(C) text", "d - text". */
const OPTION_RE = /^\s*\(?([A-Ha-h])[).:\-–]\s+(.*\S)\s*$/;
/** "Answer: C", "Correct answer - B", "ANS: A", "Correct: B". */
const ANSWER_RE = /^\s*(?:(?:correct\s+)?ans(?:wer)?|correct)\s*[:\-–]?\s*\(?([A-Ha-h])\)?\s*$/i;
/** "Correct Answer: C. Explanation…" / "The correct answer is C because…" as a line. */
const ANSWER_WITH_TAIL_RE = /^\s*(?:the\s+)?correct\s+answer\s*(?:is)?\s*[:\-–]?\s*\(?([A-Ha-h])\)?\b[.,]?\s*(.*)$/i;
/** "Explanation:", "Rationale:", "Discussion:". */
const EXPLANATION_RE = /^\s*(explanation|rationale|discussion|teaching\s+point|why)\s*[:\-–]/i;
/** "A is incorrect because…" / "C is correct — …" (choice rationales). */
const RATIONALE_RE = /^\s*\(?([A-Ha-h])\)?[).:\-–]?\s+is\s+(in)?correct\b[.,:;\s]*(.*)$/i;
/** Prose-embedded answer inside explanation text. */
const PROSE_ANSWER_RE = /\b(?:the\s+answer\s+is|correct\s+answer\s+is|correct\s+choice\s+is)\s*\(?([A-Ha-h])\)?(?![a-z])/i;
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
  const rationales: Record<string, string> = {};
  const meta: Record<string, string> = {};
  let correctKey: string | undefined;
  let rationaleCorrectLetter: string | undefined;
  let phase: "stem" | "options" | "explanation" = "stem";

  for (const line of lines) {
    const optionMatch = line.match(OPTION_RE);
    const answerMatch = line.match(ANSWER_RE);
    const answerTailMatch = line.match(ANSWER_WITH_TAIL_RE);
    const explanationMatch = line.match(EXPLANATION_RE);
    const metaMatch = line.match(META_RE);
    const rationaleMatch = line.match(RATIONALE_RE);

    if (metaMatch && phase !== "stem") {
      meta[metaMatch[1].toLowerCase()] = metaMatch[2].trim();
      continue;
    }
    // L4: choice rationales. A rationale line can look like an option line
    // ("A. is incorrect because…"), so it wins when the letter is already a
    // parsed option or we're past the options.
    if (rationaleMatch && phase !== "stem") {
      const letter = rationaleMatch[1].toUpperCase();
      const isKnownOption = options.some((o) => o.key === letter);
      if (isKnownOption || phase === "explanation") {
        rationales[letter] = rationaleMatch[3].trim() || (rationaleMatch[2] ? "Incorrect." : "Correct.");
        if (!rationaleMatch[2]) rationaleCorrectLetter = rationaleCorrectLetter ?? letter;
        continue;
      }
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
    if (answerTailMatch && phase !== "stem") {
      correctKey = correctKey ?? answerTailMatch[1].toUpperCase();
      if (answerTailMatch[2].trim()) explanationLines.push(answerTailMatch[2].trim());
      phase = "explanation";
      continue;
    }
    if (optionMatch && (phase === "options" || isLikelyFirstOption(optionMatch[1], options))) {
      phase = "options";
      options.push({ key: optionMatch[1].toUpperCase(), text: optionMatch[2].trim() });
      continue;
    }
    if (phase === "stem") stemLines.push(line);
    else if (phase === "options" && line.trim()) {
      // "The answer is C because…" directly after options starts the explanation.
      if (PROSE_ANSWER_RE.test(line)) {
        phase = "explanation";
        explanationLines.push(line.trim());
      } else {
        // Continuation of the previous option's wrapped text.
        const last = options[options.length - 1];
        if (last) last.text = `${last.text} ${line.trim()}`;
      }
    } else if (phase === "explanation") explanationLines.push(line);
  }

  const stem = stemLines.join("\n").trim();
  const explanation = explanationLines.join("\n").trim() || undefined;

  // Confidence: honest, never "perfect extraction".
  let confidence: ExtractionConfidence = "high";
  let needsReview = false;
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

  // L3/L5: reconcile the explicit answer with what the prose/rationales claim.
  const proseLetter = explanation?.match(PROSE_ANSWER_RE)?.[1]?.toUpperCase();
  const claimed = [correctKey, proseLetter, rationaleCorrectLetter].filter((l): l is string => !!l);
  const distinct = [...new Set(claimed)];
  if (distinct.length > 1) {
    warnings.push(`Conflicting answers detected (${distinct.join(" vs ")}) between the answer line, explanation prose, and choice rationales — left unset, needs review.`);
    correctKey = undefined;
    confidence = "low";
    needsReview = true;
  } else if (!correctKey && distinct.length === 1) {
    correctKey = distinct[0];
    warnings.push(`Answer "${correctKey}" was inferred from explanation prose — confirm it against the source.`);
    if (confidence === "high") confidence = "medium";
  }

  if (correctKey && keys.length > 0 && !keys.includes(correctKey)) {
    warnings.push(`Detected answer "${correctKey}" doesn't match any option — left unset.`);
    correctKey = undefined;
    confidence = confidence === "high" ? "medium" : confidence;
    needsReview = true;
  }
  if (!correctKey && !needsReview) {
    warnings.push("No correct answer detected. The question saves fine without one — set it after checking the source.");
    if (confidence === "high") confidence = "medium";
  }

  return {
    stem,
    options,
    correctKey,
    explanation,
    choiceRationales: Object.keys(rationales).length ? rationales : undefined,
    explanationSource: explanation ? "inline" : undefined,
    topic: meta.topic,
    system: meta.system,
    sourceLabel: meta.source,
    category: meta.category ?? meta.subject,
    tags: meta.tags ? meta.tags.split(/[,;]/).map((t) => t.trim()).filter(Boolean) : undefined,
    needsReview: needsReview || undefined,
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
 * ("1. …", "Q2) …") into per-question drafts, then map any trailing answer /
 * explanation section back onto the questions by number. Ambiguous keys are
 * flagged, never invented.
 */
export function parseQuestionBlocks(raw: string): ParsedQuestionDraft[] {
  const { body, entries } = parseAnswerSections(raw.replace(/\r\n?/g, "\n"));
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

  return entries.size ? applyAnswerEntries(drafts, entries) : drafts;
}

function leadingNumber(block: string): number | undefined {
  const match = block.match(/^\s*(?:q(?:uestion)?\s*)?(\d{1,3})\s*[).:]\s+/i);
  return match ? Number(match[1]) : undefined;
}

function stripLeadingNumber(block: string): string {
  return block.replace(/^\s*(?:q(?:uestion)?\s*)?\d{1,3}\s*[).:]\s+/i, "");
}

// --- answer / explanation sections (L2 + L3) -------------------------------------

const KEY_HEADER_RE = /^\s*(answer\s*key|answers?(?:\s*(?:and|&)\s*(?:explanations?|rationales?))?|explanations?|solutions?)\s*[:\-–]?\s*$/im;
/** Compressed pairs like "1. C", "2-B", "3) D", "Question 4: A", "5C". */
const KEY_PAIR_RE = /(?:question\s*)?(\d{1,3})\s*[).:\-–]?\s*\(?([A-Ha-h])\)?(?![a-z0-9])/gi;
/** A numbered entry start inside an answer section: "1. …", "Question 3: …". */
const ENTRY_START_RE = /^\s*(?:question\s*)?(\d{1,3})\s*[).:\-–]\s*/i;
/** Letter at the head of a section entry: "C", "(C)", "C.", "Correct answer: C". */
const ENTRY_LETTER_RE = /^(?:(?:the\s+)?correct\s+answer\s*(?:is)?\s*[:\-–]?\s*)?\(?([A-Ha-h])\)?(?:[.,:;]|\s+[—–-]\s*|\s|$)/i;

/**
 * Detect a trailing answer/explanation section and parse per-number entries
 * (letter + explanation text). Returns the body without the section.
 */
export function parseAnswerSections(text: string): { body: string; entries: Map<number, AnswerSectionEntry> } {
  const entries = new Map<number, AnswerSectionEntry>();
  const headerMatch = text.match(KEY_HEADER_RE);
  let body = text;
  let sectionText = "";

  if (headerMatch && headerMatch.index !== undefined) {
    sectionText = text.slice(headerMatch.index + headerMatch[0].length);
    body = text.slice(0, headerMatch.index);
  } else {
    // Inline form: "Answers: 1C, 2B, 3D" on a single line. Must contain real
    // number→letter pairs — a per-question "Answer: B" line is NOT a key
    // section and stays in the body for the single-question parser.
    const inline = text.match(/^\s*answers?\s*[:\-–]\s*(.+\S)\s*$/im);
    if (inline && inline.index !== undefined && /\d{1,3}\s*[).:\-–]?\s*\(?[A-Ha-h]\)?(?![a-z0-9])/.test(inline[1])) {
      sectionText = inline[1];
      body = text.slice(0, inline.index) + text.slice(inline.index + inline[0].length);
    }
  }
  if (!sectionText) return { body: text, entries };

  // Split the section into numbered entries so explanations attach to numbers.
  const sectionLines = sectionText.split("\n");
  const entryStarts: number[] = [];
  sectionLines.forEach((line, i) => {
    if (ENTRY_START_RE.test(line)) entryStarts.push(i);
  });

  if (entryStarts.length > 0) {
    for (let e = 0; e < entryStarts.length; e++) {
      const from = entryStarts[e];
      const to = e + 1 < entryStarts.length ? entryStarts[e + 1] : sectionLines.length;
      const entryLines = sectionLines.slice(from, to);
      const numMatch = entryLines[0].match(ENTRY_START_RE)!;
      const num = Number(numMatch[1]);
      const content = [entryLines[0].slice(numMatch[0].length), ...entryLines.slice(1)].join("\n").trim();

      const letterMatch = content.match(ENTRY_LETTER_RE);
      const proseMatch = content.match(PROSE_ANSWER_RE);
      const letter = (letterMatch?.[1] ?? proseMatch?.[1])?.toUpperCase();
      // Explanation = whatever follows the letter marker (dash/period separated).
      let explanation = content;
      if (letterMatch) {
        explanation = content.slice(letterMatch[0].length).replace(/^\s*[—–-]\s*/, "").trim();
      }
      // Cross-check: head letter vs prose letter inside the same entry (L5).
      const claims = [...new Set([letterMatch?.[1], proseMatch?.[1]].filter((l): l is string => !!l).map((l) => l.toUpperCase()))];
      const finalLetter = claims.length > 1 ? "?" : letter;

      const existing = entries.get(num);
      if (existing && existing.letter && finalLetter && existing.letter !== finalLetter) {
        entries.set(num, { letter: "?", explanation: existing.explanation ?? (explanation || undefined) });
      } else if (!existing) {
        entries.set(num, { letter: finalLetter, explanation: explanation || undefined });
      }
    }
    // A section that split into entries but yielded no letters at all is more
    // likely a compressed key ("1C 2B…") — fall through to pair parsing.
    if ([...entries.values()].some((e) => e.letter)) return { body, entries };
    entries.clear();
  }

  // Compressed / one-line keys: "1C, 2B, 3D" or "1. C 2. B 3. D".
  for (const match of sectionText.matchAll(KEY_PAIR_RE)) {
    const num = Number(match[1]);
    const letter = match[2].toUpperCase();
    const existing = entries.get(num);
    if (existing?.letter && existing.letter !== letter) entries.set(num, { letter: "?" });
    else if (!existing) entries.set(num, { letter });
  }
  return { body, entries };
}

/** Back-compat wrapper: number → letter map only. */
export function splitAnswerKeySection(text: string): { body: string; answerKey: Map<number, string> } {
  const { body, entries } = parseAnswerSections(text);
  const answerKey = new Map<number, string>();
  for (const [num, entry] of entries) {
    if (entry.letter) answerKey.set(num, entry.letter);
  }
  return { body, answerKey };
}

function applyAnswerEntries(drafts: ParsedQuestionDraft[], entries: Map<number, AnswerSectionEntry>): ParsedQuestionDraft[] {
  return drafts.map((draft) => {
    if (draft.questionNumber === undefined) return draft;
    const entry = entries.get(draft.questionNumber);
    if (!entry) return draft;
    let next = { ...draft };

    // L3: attach the section explanation when the question has none.
    if (entry.explanation && !next.explanation) {
      next.explanation = entry.explanation;
      next.explanationSource = "answer-section";
    }

    if (entry.letter === "?") {
      next.warnings = [...next.warnings, "The answer section lists conflicting answers for this number — left unset, needs review."];
      next.needsReview = true;
      next.confidence = "low";
      return next;
    }
    if (!entry.letter) return next;

    // L5: the key vs an answer already found inside the question block.
    if (next.correctKey && next.correctKey !== entry.letter) {
      next = {
        ...next,
        correctKey: undefined,
        needsReview: true,
        confidence: "low",
        warnings: [...next.warnings, `Conflict: the question block says "${next.correctKey}" but the answer section says "${entry.letter}" — left unset, needs review.`],
      };
      return next;
    }
    if (next.correctKey) return next; // already agrees

    if (!next.options.some((o) => o.key === entry.letter)) {
      next.warnings = [...next.warnings, `Answer key says "${entry.letter}" but no such option exists — left unset.`];
      next.needsReview = true;
      return next;
    }
    // L6: full alignment (number + options + key ± explanation) earns high.
    return {
      ...next,
      correctKey: entry.letter,
      confidence: next.confidence === "low" ? "low" : "high",
      warnings: next.warnings.filter((w) => !/no correct answer detected/i.test(w)),
    };
  });
}

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
/** Feedback/explanation/objective markers that begin a NON-option content block.
 * Capturing group 1 is the marker keyword so callers can classify it. */
const EXPLANATION_RE = /^\s*(correct\s+feedback|incorrect\s+feedback|feedback|explanation|rationale|discussion|teaching\s+point|key\s+concept|learning\s+objectives?|objectives?|references?|why)\s*[:\-–]/i;
/**
 * The SAME markers, matched mid-line so we can split feedback that got glued to
 * an answer choice ("E. Co-payment Correct Feedback: …"). Requires whitespace
 * before the marker so words like "objective assessment" inside an option don't
 * trip it. Group 1 = marker, group 2 = the feedback text after the colon. */
const INLINE_FEEDBACK_RE = /\s+((?:correct|incorrect)\s+feedback|feedback|explanation|rationale|this\s+question\s+addresses\s+objectives?|learning\s+objectives?|objectives?|teaching\s+point|key\s+concept)\s*[:\-–]\s*(.*)$/i;
/** "A is incorrect because…" / "C is correct — …" (choice rationales). */
const RATIONALE_RE = /^\s*\(?([A-Ha-h])\)?[).:\-–]?\s+is\s+(in)?correct\b[.,:;\s]*(.*)$/i;
/** Prose-embedded answer inside explanation text. */
const PROSE_ANSWER_RE = /\b(?:the\s+answer\s+is|correct\s+answer\s+is|correct\s+choice\s+is)\s*\(?([A-Ha-h])\)?(?![a-z])/i;
/** Metadata lines: "Topic: Complement", "System: Immuno", "Source: SGU NB3", "Tags: a, b". */
const META_RE = /^\s*(topic|system|source|category|subject|tags)\s*[:\-–]\s*(.+\S)\s*$/i;
/** A numbered question start: "1. ", "12) ", "Q3: ", "Question 4." */
const QUESTION_START_RE = /^\s*(?:q(?:uestion)?\s*)?(\d{1,3})\s*[).:]\s+\S/i;

/** True when a feedback marker is a "correct" signal (marks its option/choice). */
function isCorrectFeedback(marker: string): boolean {
  return /^correct\s+feedback$/i.test(marker.trim());
}
function isIncorrectFeedback(marker: string): boolean {
  return /^incorrect\s+feedback$/i.test(marker.trim());
}

/**
 * Split feedback/explanation text that was glued onto an answer choice.
 * "Co-payment Correct Feedback: Co-insurance is the term…" →
 *   { optionText: "Co-payment", marker: "Correct Feedback", feedback: "Co-insurance…" }
 * Returns just the text when no marker is present.
 */
export function splitOptionFeedback(text: string): { optionText: string; marker?: string; feedback?: string } {
  const m = text.match(INLINE_FEEDBACK_RE);
  if (!m || m.index === undefined) return { optionText: text.trim() };
  return {
    optionText: text.slice(0, m.index).trim(),
    marker: m[1].replace(/\s+/g, " ").trim(),
    feedback: m[2].trim(),
  };
}

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
  // Layer 2: the option letter whose choice carried a "Correct Feedback" block.
  let feedbackCorrectLetter: string | undefined;
  // While collecting the tail of an inline-feedback block, continuation lines
  // append to the explanation, not to the previous option's text.
  let feedbackFlow = false;
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
      feedbackFlow = false;
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
        feedbackFlow = false;
        continue;
      }
    }
    // A standalone feedback/explanation/objective marker line → explanation.
    if (explanationMatch) {
      phase = "explanation";
      feedbackFlow = true;
      const rest = line.replace(EXPLANATION_RE, "").trim();
      if (rest) explanationLines.push(rest);
      continue;
    }
    if (answerMatch && phase !== "stem") {
      correctKey = answerMatch[1].toUpperCase();
      feedbackFlow = false;
      continue;
    }
    if (answerTailMatch && phase !== "stem") {
      correctKey = correctKey ?? answerTailMatch[1].toUpperCase();
      if (answerTailMatch[2].trim()) explanationLines.push(answerTailMatch[2].trim());
      phase = "explanation";
      feedbackFlow = true;
      continue;
    }
    if (optionMatch && (phase === "options" || isLikelyFirstOption(optionMatch[1], options))) {
      phase = "options";
      const letter = optionMatch[1].toUpperCase();
      // CRITICAL FIX: strip any feedback/explanation glued to the choice so it
      // never becomes part of the option text.
      const split = splitOptionFeedback(optionMatch[2]);
      options.push({ key: letter, text: split.optionText });
      if (split.feedback) {
        if (isCorrectFeedback(split.marker!)) {
          feedbackCorrectLetter = feedbackCorrectLetter ?? letter;
          explanationLines.push(split.feedback);
        } else if (isIncorrectFeedback(split.marker!)) {
          rationales[letter] = split.feedback;
        } else {
          explanationLines.push(split.feedback);
        }
        feedbackFlow = true; // wrapped feedback continues on following lines
      } else {
        feedbackFlow = false;
      }
      continue;
    }
    if (phase === "stem") stemLines.push(line);
    else if (phase === "options" && line.trim()) {
      // Feedback started on a prior option line — keep collecting it.
      if (feedbackFlow) {
        explanationLines.push(line.trim());
      } else if (PROSE_ANSWER_RE.test(line)) {
        // "The answer is C because…" directly after options starts the explanation.
        phase = "explanation";
        explanationLines.push(line.trim());
      } else {
        // Layer 2 by option TEXT: "Co-insurance Correct Feedback: …" (no letter).
        const textFeedback = line.match(/^(.*?\S)\s+((?:correct|incorrect)\s+feedback)\s*[:\-–]\s*(.*)$/i);
        const matchedByText = textFeedback
          ? options.find((o) => o.text.toLowerCase() === textFeedback[1].trim().toLowerCase())
          : undefined;
        if (textFeedback && matchedByText) {
          if (isCorrectFeedback(textFeedback[2])) feedbackCorrectLetter = feedbackCorrectLetter ?? matchedByText.key;
          else rationales[matchedByText.key] = textFeedback[3].trim();
          explanationLines.push(textFeedback[3].trim());
          phase = "explanation";
          feedbackFlow = true;
        } else {
          // Continuation of the previous option's wrapped text.
          const last = options[options.length - 1];
          if (last) last.text = `${last.text} ${line.trim()}`;
        }
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

  // L2/L3/L5: reconcile every answer signal. "Correct Feedback" attached to a
  // choice (feedbackCorrectLetter) is a STRONG explicit signal, on par with an
  // explicit answer line.
  const proseLetter = explanation?.match(PROSE_ANSWER_RE)?.[1]?.toUpperCase();
  const explicit = [correctKey, feedbackCorrectLetter].filter((l): l is string => !!l);
  const claimed = [correctKey, feedbackCorrectLetter, proseLetter, rationaleCorrectLetter].filter((l): l is string => !!l);
  const distinct = [...new Set(claimed)];
  const distinctExplicit = [...new Set(explicit)];
  if (distinctExplicit.length > 1) {
    // Two explicit sources disagree → real conflict, never guess.
    warnings.push(`Conflicting answers detected (${distinctExplicit.join(" vs ")}) between explicit answer signals — left unset, needs review.`);
    correctKey = undefined;
    confidence = "low";
    needsReview = true;
  } else if (distinctExplicit.length === 1) {
    correctKey = distinctExplicit[0];
    // L5: an explicit answer that a prose "the answer is X" contradicts is a
    // real conflict — never guess, require review (matches the directive).
    if (proseLetter && proseLetter !== correctKey) {
      warnings.push(`Conflicting answers detected (${correctKey} vs ${proseLetter}) between the answer signal and explanation prose — left unset, needs review.`);
      correctKey = undefined;
      confidence = "low";
      needsReview = true;
    } else if (rationaleCorrectLetter && rationaleCorrectLetter !== correctKey) {
      warnings.push(`Conflicting answers detected (${correctKey} vs ${rationaleCorrectLetter}) between the answer signal and a choice rationale — left unset, needs review.`);
      correctKey = undefined;
      confidence = "low";
      needsReview = true;
    }
  } else if (distinct.length > 1) {
    warnings.push(`Conflicting answers detected (${distinct.join(" vs ")}) between the explanation prose and choice rationales — left unset, needs review.`);
    correctKey = undefined;
    confidence = "low";
    needsReview = true;
  } else if (distinct.length === 1) {
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
  // L3: semantic mapping — the explanation opens by naming an option's text
  // ("Co-insurance is the term…"). Conservative: only an exact option-text
  // match at the very start, and only when nothing explicit was found.
  if (!correctKey && !needsReview && explanation && options.length) {
    const semantic = matchExplanationToOption(explanation, options);
    if (semantic) {
      correctKey = semantic;
      warnings.push(`Answer "${correctKey}" was inferred from the explanation naming that option — confirm it against the source.`);
      if (confidence === "high") confidence = "medium";
    }
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
 * L3 semantic mapping: does the explanation open by naming one option's text?
 * "Co-insurance is the term…" → the option whose text is "Co-insurance".
 * Requires the named phrase to appear at the very start followed by "is/are",
 * and to be an EXACT (case-insensitive) option-text match, so it never guesses.
 * Returns the option letter, or undefined when no single clear match exists.
 */
function matchExplanationToOption(explanation: string, options: QuestionOption[]): string | undefined {
  const opening = explanation.trim().slice(0, 120).toLowerCase();
  const matches = options.filter((o) => {
    const t = o.text.trim().toLowerCase();
    if (t.length < 3) return false;
    return opening.startsWith(`${t} is `) || opening.startsWith(`${t} are `) || opening.startsWith(`${t}, `);
  });
  // Exactly one option named at the opening → confident enough to suggest.
  return matches.length === 1 ? matches[0].key : undefined;
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

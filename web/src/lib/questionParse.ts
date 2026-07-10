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
import { cleanExplanationText } from "./questionExplanation";

export interface ParsedQuestionDraft {
  stem: string;
  options: QuestionOption[];
  correctKey?: string;
  /** Canonical display text derived from correctKey + options (never invented). */
  correctAnswerText?: string;
  /** Verbatim source line(s) that supported the answer mapping. */
  answerEvidence?: string;
  explanation?: string;
  /** Per-choice rationales ("A is incorrect because…"), keyed by letter. */
  choiceRationales?: Record<string, string>;
  /** Where the explanation came from — inline block or a trailing section. */
  explanationSource?: "inline" | "answer-section";
  /** Metadata lines detected in the block ("Topic:", "Source:", …). */
  topic?: string;
  system?: string;
  sourceLabel?: string;
  /** Kept separate from explanation so quiz feedback stays focused. */
  objective?: string;
  reference?: string;
  category?: string;
  tags?: string[];
  /** The document's own question number, when present ("12." → 12). */
  questionNumber?: number;
  /** Page in the source document this question came from (PDF imports). */
  sourcePage?: number;
  /** Bounded evidence excerpt from the exact source block used by the parser. */
  sourceSnippet?: string;
  /** Stable, inspectable rules that contributed to this mapping. */
  parserRuleIds?: string[];
  /** Numeric 0..1 confidence for each parser stage. */
  questionDetectionConfidence?: number;
  answerDetectionConfidence?: number;
  explanationDetectionConfidence?: number;
  overallImportConfidence?: number;
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
/** Feedback/explanation/objective markers that begin a NON-option content block.
 * Capturing group 1 is the marker keyword so callers can classify it. */
const EXPLANATION_RE = /^\s*(correct\s+feedback|incorrect\s+feedback|feedback|answer\s+explanation|explanation|rationale|discussion|teaching\s+point|key\s+concept|why)\s*[:\-–]/i;
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
const OBJECTIVE_RE = /^\s*(learning\s+objectives?|objectives?|this\s+question\s+addresses\s+objectives?)\s*[:\-–]\s*(.*)$/i;
const REFERENCE_RE = /^\s*(references?|citation)\s*[:\-–]\s*(.*)$/i;

interface AnswerSignal {
  key?: string;
  answerText?: string;
  rationale?: string;
  ruleId: string;
  evidence: string;
  payload: string;
  /** "Answer: B lymphocytes" may be text, not letter B + tail. */
  ambiguousLeadingLetter?: boolean;
}

const ANSWER_PREFIX_RE = /^\s*(?:(?:the\s+)?(?:correct\s+|right\s+)?answer|(?:correct|right)\s+(?:option|choice)|(?:correct\s+)?ans|correct|key|solution)\s*(?:is)?\s*[:\-–]?\s*(.+?)\s*$/i;

/** Parse explicit answer lines without confusing answer text with explanation. */
export function parseAnswerSignal(line: string): AnswerSignal | undefined {
  const match = line.match(ANSWER_PREFIX_RE);
  if (!match) return undefined;
  const payload = match[1].trim();
  const punctuated = payload.match(/^\(?([A-Ha-h])\)?\s*[.):\-–]\s*(.*)$/);
  const bare = payload.match(/^\(?([A-Ha-h])\)?\s*$/);
  const spaced = payload.match(/^([A-Ha-h])\s+(.+)$/);
  const letter = punctuated ?? bare ?? spaced;
  if (!letter) return { answerText: payload, ruleId: "answer.explicit-text", evidence: line.trim(), payload };

  const key = letter[1].toUpperCase();
  const tail = (letter[2] ?? "").trim();
  if (!tail) return { key, ruleId: "answer.explicit-letter", evidence: line.trim(), payload };
  if (/^(?:because|since|as\b|due\s+to\b)/i.test(tail)) {
    return { key, rationale: tail, ruleId: "answer.explicit-letter-rationale", evidence: line.trim(), payload };
  }
  return {
    key,
    answerText: tail,
    ruleId: "answer.explicit-letter-text",
    evidence: line.trim(),
    payload,
    ambiguousLeadingLetter: Boolean(spaced && !punctuated),
  };
}

function comparableAnswerText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/^\(?[a-h]\)?[).:\-–]\s*/i, "")
    .replace(/\s+/g, " ")
    .replace(/[\s.,;:!?]+$/g, "")
    .trim();
}

function matchAnswerText(text: string, options: QuestionOption[]): { key?: string; ambiguous: boolean } {
  const normalized = comparableAnswerText(text);
  if (!normalized) return { ambiguous: false };
  const matches = options.filter((option) => comparableAnswerText(option.text) === normalized);
  return { key: matches.length === 1 ? matches[0].key : undefined, ambiguous: matches.length > 1 };
}

function boundedConfidence(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;
}

function categoricalConfidence(value: number): ExtractionConfidence {
  return value >= 0.85 ? "high" : value >= 0.6 ? "medium" : "low";
}

function sourceSnippet(raw: string): string | undefined {
  const value = normalizeSourceText(raw).trim().replace(/\n{3,}/g, "\n\n");
  return value ? value.slice(0, 1600) : undefined;
}

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

/**
 * Normalization pre-pass — makes every downstream detector stronger for free.
 * Strips markdown bold/italic pairs, leading list bullets, smart quotes,
 * non-breaking spaces, and stray form-feed/tab noise from copied PDFs.
 */
export function normalizeSourceText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00a0\u2007\u202f]/g, " ") // nbsp variants -> space
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")            // **bold** → bold
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/^[\s]*[•●▪‣◦·]\s*/gm, "")            // list bullets at line start
    .replace(/[\t\f\v]+/g, " ");
}

/** Correct-answer markers that can decorate a single option line. */
const CHECK_MARK_RE = /[✓✔☑]/;
const CORRECT_SUFFIX_RE = /\s*\(\s*(?:correct(?:\s+answer)?|right)\s*\)\s*$/i;

/**
 * Options crammed onto one line — "A. Alpha B. Beta C. Gamma D. Delta" —
 * are expanded onto separate lines so the option loop can read them.
 * Requires a run of ≥3 sequential letters starting at A to avoid mangling
 * prose that merely mentions "B. cereus".
 */
export function expandInlineOptions(line: string): string[] {
  const starts: Array<{ index: number; letter: string }> = [];
  const re = /(?:^|\s)\(?([A-Ha-h])[).:]\s+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    starts.push({ index: m.index === 0 ? 0 : m.index + 1, letter: m[1].toUpperCase() });
  }
  if (starts.length < 3) return [line];
  const letters = starts.map((s) => s.letter).join("");
  if (!"ABCDEFGH".startsWith(letters)) return [line];
  const pieces: string[] = [];
  if (starts[0].index > 0) pieces.push(line.slice(0, starts[0].index).trim());
  for (let i = 0; i < starts.length; i++) {
    const from = starts[i].index;
    const to = i + 1 < starts.length ? starts[i + 1].index : line.length;
    pieces.push(line.slice(from, to).trim());
  }
  return pieces.filter(Boolean);
}

export function parseQuestionText(raw: string): ParsedQuestionDraft {
  const warnings: string[] = [];
  const parserRuleIds = new Set<string>();
  const normalized = normalizeSourceText(raw);
  const lines: string[] = [];
  for (const line of normalized.split("\n")) {
    const expanded = expandInlineOptions(line);
    if (expanded.length > 1) parserRuleIds.add("options.inline-expanded");
    lines.push(...expanded);
  }

  const stemLines: string[] = [];
  const options: QuestionOption[] = [];
  const explanationLines: string[] = [];
  const objectiveLines: string[] = [];
  const referenceLines: string[] = [];
  const rationales: Record<string, string> = {};
  const meta: Record<string, string> = {};
  const answerSignals: AnswerSignal[] = [];
  let rationaleCorrectLetter: string | undefined;
  // Layer 2: the option letter whose choice carried a "Correct Feedback" block.
  let feedbackCorrectLetter: string | undefined;
  // While collecting the tail of an inline-feedback block, continuation lines
  // append to the explanation, not to the previous option's text.
  let feedbackFlow = false;
  // Options decorated with a correct-marker (✓, leading/trailing *, "(correct)").
  const markedLetters: string[] = [];
  let phase: "stem" | "options" | "explanation" = "stem";
  let metadataFlow: "objective" | "reference" | undefined;
  let explanationMarkerDetected = false;

  for (const rawLine of lines) {
    // Strip a correct-marker decorating this line so the option regex can see
    // through it; remember the flag for the marker heuristic below.
    let line = rawLine;
    let lineMarked = false;
    const lead = line.match(/^\s*[*✓✔☑]\s*(\(?[A-Ha-h][).:\-–]\s.*)$/);
    if (lead) { line = lead[1]; lineMarked = true; }
    const trail = line.match(/^(\s*\(?[A-Ha-h][).:\-–]\s.*\S)\s*[*✓✔☑]\s*$/);
    if (trail) { line = trail[1]; lineMarked = true; }

    const optionMatch = line.match(OPTION_RE);
    const answerSignal = parseAnswerSignal(line);
    const explanationMatch = line.match(EXPLANATION_RE);
    const metaMatch = line.match(META_RE);
    const objectiveMatch = line.match(OBJECTIVE_RE);
    const referenceMatch = line.match(REFERENCE_RE);
    const rationaleMatch = line.match(RATIONALE_RE);

    if (metaMatch && phase !== "stem") {
      meta[metaMatch[1].toLowerCase()] = metaMatch[2].trim();
      parserRuleIds.add(`metadata.${metaMatch[1].toLowerCase()}`);
      feedbackFlow = false;
      metadataFlow = undefined;
      continue;
    }
    if (objectiveMatch && phase !== "stem") {
      if (objectiveMatch[2].trim()) objectiveLines.push(objectiveMatch[2].trim());
      parserRuleIds.add("metadata.objective");
      feedbackFlow = false;
      metadataFlow = "objective";
      continue;
    }
    if (referenceMatch && phase !== "stem") {
      if (referenceMatch[2].trim()) referenceLines.push(referenceMatch[2].trim());
      parserRuleIds.add("metadata.reference");
      feedbackFlow = false;
      metadataFlow = "reference";
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
        parserRuleIds.add(rationaleMatch[2] ? "rationale.incorrect-choice" : "answer.choice-rationale");
        feedbackFlow = false;
        metadataFlow = undefined;
        continue;
      }
    }
    // A standalone feedback/explanation marker line → explanation. Objectives
    // and references were handled above and never contaminate this field.
    if (explanationMatch) {
      phase = "explanation";
      feedbackFlow = true;
      metadataFlow = undefined;
      explanationMarkerDetected = true;
      parserRuleIds.add(`explanation.${explanationMatch[1].toLowerCase().replace(/\s+/g, "-")}`);
      const rest = line.replace(EXPLANATION_RE, "").trim();
      if (rest) explanationLines.push(rest);
      continue;
    }
    if (answerSignal && phase !== "stem") {
      answerSignals.push(answerSignal);
      parserRuleIds.add(answerSignal.ruleId);
      if (answerSignal.rationale) explanationLines.push(answerSignal.rationale);
      phase = "explanation";
      feedbackFlow = Boolean(answerSignal.rationale);
      metadataFlow = undefined;
      continue;
    }
    if (optionMatch && (phase === "options" || isLikelyFirstOption(optionMatch[1], options))) {
      phase = "options";
      const letter = optionMatch[1].toUpperCase();
      // CRITICAL FIX: strip any feedback/explanation glued to the choice so it
      // never becomes part of the option text.
      const split = splitOptionFeedback(optionMatch[2]);
      // "(correct)" suffix decorating the choice text is an answer marker.
      let optionText = split.optionText;
      if (CORRECT_SUFFIX_RE.test(optionText)) {
        optionText = optionText.replace(CORRECT_SUFFIX_RE, "").trim();
        lineMarked = true;
      }
      if (lineMarked || CHECK_MARK_RE.test(rawLine)) markedLetters.push(letter);
      options.push({ key: letter, text: optionText });
      parserRuleIds.add("options.labeled");
      if (split.feedback) {
        if (isCorrectFeedback(split.marker!)) {
          feedbackCorrectLetter = feedbackCorrectLetter ?? letter;
          explanationLines.push(split.feedback);
          parserRuleIds.add("answer.correct-feedback");
        } else if (isIncorrectFeedback(split.marker!)) {
          rationales[letter] = split.feedback;
          parserRuleIds.add("rationale.incorrect-feedback");
        } else {
          explanationLines.push(split.feedback);
        }
        explanationMarkerDetected = true;
        feedbackFlow = true; // wrapped feedback continues on following lines
      } else {
        feedbackFlow = false;
      }
      metadataFlow = undefined;
      continue;
    }
    if (phase === "stem") stemLines.push(line);
    else if (phase === "options" && line.trim()) {
      if (metadataFlow === "objective") {
        objectiveLines.push(line.trim());
        continue;
      }
      if (metadataFlow === "reference") {
        referenceLines.push(line.trim());
        continue;
      }
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
          parserRuleIds.add(isCorrectFeedback(textFeedback[2]) ? "answer.correct-feedback-text-match" : "rationale.incorrect-feedback");
          explanationMarkerDetected = true;
          phase = "explanation";
          feedbackFlow = true;
        } else {
          // Continuation of the previous option's wrapped text.
          const last = options[options.length - 1];
          if (last) last.text = `${last.text} ${line.trim()}`;
        }
      }
    } else if (phase === "explanation") {
      if (metadataFlow === "objective") objectiveLines.push(line.trim());
      else if (metadataFlow === "reference") referenceLines.push(line.trim());
      else explanationLines.push(line);
    }
  }

  const stem = stemLines.join("\n").trim();
  const rawExplanation = explanationLines.join("\n").trim() || undefined;

  let needsReview = false;
  if (!stem) {
    warnings.push("No question stem detected — paste the full question including the stem.");
  } else {
    parserRuleIds.add("question.stem");
  }
  if (options.length === 0) {
    warnings.push("No answer options detected. Add them manually or check the paste format (A. / B. / C.).");
  } else if (options.length < 3) {
    warnings.push(`Only ${options.length} option${options.length === 1 ? "" : "s"} detected — most exam questions have 4–5.`);
  }
  const keys = options.map((o) => o.key);
  let duplicateOptions = false;
  if (new Set(keys).size !== keys.length) {
    warnings.push("Duplicate option letters detected — review the split.");
    duplicateOptions = true;
    needsReview = true;
  }

  // Correct-marker heuristic: exactly ONE option decorated (✓ / * / "(correct)")
  // is an explicit signal; every option decorated means list bullets — ignore.
  const uniqueMarked = [...new Set(markedLetters)];
  const markerCorrectLetter =
    uniqueMarked.length === 1 && options.length > 1 && markedLetters.length < options.length
      ? uniqueMarked[0]
      : undefined;
  if (markerCorrectLetter) parserRuleIds.add("answer.option-marker");

  // Reconcile every explicit letter/text signal before considering weaker prose.
  const structuredKeys: string[] = [];
  let answerDetectionConfidence = 0;
  let structuredConflict = false;
  for (const signal of answerSignals) {
    let signalKey = signal.key;
    let signalAnswerText = signal.answerText;
    if (signal.ambiguousLeadingLetter) {
      const fullTextMatch = matchAnswerText(signal.payload, options);
      if (fullTextMatch.ambiguous) {
        warnings.push(`Answer text "${signal.payload}" matches more than one option — left unset, needs review.`);
        structuredConflict = true;
        needsReview = true;
      } else if (fullTextMatch.key) {
        signalKey = fullTextMatch.key;
        signalAnswerText = undefined;
        parserRuleIds.add("answer.text-option-match");
        answerDetectionConfidence = Math.max(answerDetectionConfidence, 0.96);
      }
    }
    if (signalAnswerText) {
      const textMatch = matchAnswerText(signalAnswerText, options);
      if (textMatch.ambiguous) {
        warnings.push(`Answer text "${signalAnswerText}" matches more than one option — left unset, needs review.`);
        structuredConflict = true;
        needsReview = true;
      } else if (textMatch.key) {
        parserRuleIds.add("answer.text-option-match");
        answerDetectionConfidence = Math.max(answerDetectionConfidence, 0.96);
        if (signalKey && signalKey !== textMatch.key) {
          warnings.push(`Conflicting answer letter/text detected (${signalKey} vs ${textMatch.key}) — left unset, needs review.`);
          structuredConflict = true;
          needsReview = true;
        } else signalKey = textMatch.key;
      } else {
        warnings.push(`Answer text "${signalAnswerText}" did not exactly match an option — review the mapping.`);
        needsReview = true;
      }
    }
    if (signalKey) {
      if (!keys.includes(signalKey)) {
        warnings.push(`Detected answer "${signalKey}" doesn't match any option — left unset.`);
        needsReview = true;
      } else {
        structuredKeys.push(signalKey);
        answerDetectionConfidence = Math.max(answerDetectionConfidence, signalAnswerText ? 0.98 : 0.96);
      }
    }
  }

  const proseLetter = rawExplanation?.match(PROSE_ANSWER_RE)?.[1]?.toUpperCase();
  if (proseLetter) parserRuleIds.add("answer.explanation-prose");
  const explicit = [...structuredKeys, feedbackCorrectLetter, markerCorrectLetter].filter((l): l is string => !!l);
  if (feedbackCorrectLetter) answerDetectionConfidence = Math.max(answerDetectionConfidence, 0.92);
  if (markerCorrectLetter) answerDetectionConfidence = Math.max(answerDetectionConfidence, 0.9);
  const claimed = [...explicit, proseLetter, rationaleCorrectLetter].filter((l): l is string => !!l);
  const distinct = [...new Set(claimed)];
  const distinctExplicit = [...new Set(explicit)];
  let correctKey: string | undefined;
  if (structuredConflict || distinctExplicit.length > 1) {
    // Two explicit sources disagree → real conflict, never guess.
    if (distinctExplicit.length > 1) warnings.push(`Conflicting answers detected (${distinctExplicit.join(" vs ")}) between explicit answer signals — left unset, needs review.`);
    correctKey = undefined;
    answerDetectionConfidence = 0.05;
    needsReview = true;
    parserRuleIds.add("conflict.explicit-answer");
  } else if (distinctExplicit.length === 1) {
    correctKey = distinctExplicit[0];
    // L5: an explicit answer that a prose "the answer is X" contradicts is a
    // real conflict — never guess, require review (matches the directive).
    if (proseLetter && proseLetter !== correctKey) {
      warnings.push(`Conflicting answers detected (${correctKey} vs ${proseLetter}) between the answer signal and explanation prose — left unset, needs review.`);
      correctKey = undefined;
      answerDetectionConfidence = 0.05;
      needsReview = true;
      parserRuleIds.add("conflict.answer-vs-explanation");
    } else if (rationaleCorrectLetter && rationaleCorrectLetter !== correctKey) {
      warnings.push(`Conflicting answers detected (${correctKey} vs ${rationaleCorrectLetter}) between the answer signal and a choice rationale — left unset, needs review.`);
      correctKey = undefined;
      answerDetectionConfidence = 0.05;
      needsReview = true;
      parserRuleIds.add("conflict.answer-vs-rationale");
    }
  } else if (distinct.length > 1) {
    warnings.push(`Conflicting answers detected (${distinct.join(" vs ")}) between the explanation prose and choice rationales — left unset, needs review.`);
    correctKey = undefined;
    answerDetectionConfidence = 0.05;
    needsReview = true;
    parserRuleIds.add("conflict.inferred-answer");
  } else if (distinct.length === 1) {
    correctKey = distinct[0];
    warnings.push(`Answer "${correctKey}" was inferred from explanation prose — confirm it against the source.`);
    answerDetectionConfidence = rationaleCorrectLetter ? 0.76 : 0.72;
  }

  if (correctKey && keys.length > 0 && !keys.includes(correctKey)) {
    warnings.push(`Detected answer "${correctKey}" doesn't match any option — left unset.`);
    correctKey = undefined;
    answerDetectionConfidence = 0.1;
    needsReview = true;
  }
  // L3: semantic mapping — the explanation opens by naming an option's text
  // ("Co-insurance is the term…"). Conservative: only an exact option-text
  // match at the very start, and only when nothing explicit was found.
  if (!correctKey && !needsReview && rawExplanation && options.length) {
    const semantic = matchExplanationToOption(rawExplanation, options);
    if (semantic) {
      correctKey = semantic;
      warnings.push(`Answer "${correctKey}" was inferred from the explanation naming that option — confirm it against the source.`);
      answerDetectionConfidence = 0.66;
      parserRuleIds.add("answer.explanation-text-match");
    }
  }
  if (!correctKey && !needsReview) {
    warnings.push("No correct answer was reliably detected — set it after checking the source.");
    needsReview = true;
  }

  const explanation = cleanExplanationText(rawExplanation, { stem, options, correctKey }) || undefined;
  if (rawExplanation && !explanation) {
    warnings.push("Explanation content contained only duplicated question structure or metadata and was removed.");
  }

  const questionDetectionConfidence = boundedConfidence(
    !stem ? (options.length ? 0.25 : 0.05)
      : options.length >= 3 && !duplicateOptions ? 0.96
        : options.length === 2 && !duplicateOptions ? 0.76
          : options.length === 1 && !duplicateOptions ? 0.52
            : 0.42,
  );
  const explanationDetectionConfidence = boundedConfidence(
    explanation ? (explanationMarkerDetected ? 0.95 : 0.76) : 0,
  );
  let overallImportConfidence = boundedConfidence(
    questionDetectionConfidence * 0.4
      + answerDetectionConfidence * 0.4
      + explanationDetectionConfidence * 0.2,
  );
  if (needsReview && answerDetectionConfidence <= 0.1) overallImportConfidence = Math.min(overallImportConfidence, 0.49);
  if (correctKey && answerDetectionConfidence < 0.8) overallImportConfidence = Math.min(overallImportConfidence, 0.84);
  const confidence = categoricalConfidence(overallImportConfidence);
  const correctAnswerText = correctKey ? options.find((option) => option.key === correctKey)?.text : undefined;
  const answerEvidence = answerSignals.map((signal) => signal.evidence).filter(Boolean).join("\n")
    || (feedbackCorrectLetter ? `Correct Feedback attached to option ${feedbackCorrectLetter}` : undefined)
    || (markerCorrectLetter ? `Correct marker attached to option ${markerCorrectLetter}` : undefined);

  return {
    stem,
    options,
    correctKey,
    correctAnswerText,
    answerEvidence,
    explanation,
    choiceRationales: Object.keys(rationales).length ? rationales : undefined,
    explanationSource: explanation ? "inline" : undefined,
    topic: meta.topic,
    system: meta.system,
    sourceLabel: meta.source,
    objective: objectiveLines.join("\n").trim() || undefined,
    reference: referenceLines.join("\n").trim() || undefined,
    category: meta.category ?? meta.subject,
    tags: meta.tags ? meta.tags.split(/[,;]/).map((t) => t.trim()).filter(Boolean) : undefined,
    needsReview: needsReview || undefined,
    confidence,
    warnings,
    parserRuleIds: [...parserRuleIds],
    questionDetectionConfidence,
    answerDetectionConfidence: boundedConfidence(answerDetectionConfidence),
    explanationDetectionConfidence,
    overallImportConfidence,
    sourceSnippet: sourceSnippet(raw),
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
  const { body, entries } = parseAnswerSections(normalizeSourceText(raw));
  const lines = body.split("\n");
  const starts: number[] = [];
  lines.forEach((line, i) => {
    if (matchQuestionStart(line)) starts.push(i);
  });

  let drafts: ParsedQuestionDraft[];
  if (starts.length === 0) {
    const draft = parseQuestionText(body);
    drafts = draft.stem || draft.options.length ? [draft] : [];
  } else if (starts.length === 1) {
    // Drop a document title/preamble before the sole numbered question.
    const block = lines.slice(starts[0]).join("\n");
    const number = leadingNumber(block);
    const cleaned = stripLeadingNumber(block);
    const draft = parseQuestionText(cleaned);
    draft.questionNumber = number;
    markNumberedDraft(draft, block);
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
      markNumberedDraft(draft, block);
      if (draft.stem || draft.options.length) drafts.push(draft);
    }
    const numbers = drafts.map((d) => d.questionNumber).filter((n): n is number => n !== undefined);
    if (new Set(numbers).size !== numbers.length) {
      for (const d of drafts) d.warnings.push("Duplicate question numbers in this document — check the split.");
    }
  }

  return entries.size ? applyAnswerEntries(drafts, entries) : drafts;
}

function matchQuestionStart(line: string): { number: number; rest: string } | undefined {
  // Strong labels allow no punctuation and may occupy their own line: "Q1",
  // "Question 2", "Q3 What is...".
  const labeled = line.match(/^\s*q(?:uestion)?\s*(\d{1,4})\s*(?:[).:\-–]\s*)?(.*?)\s*$/i);
  if (labeled) return { number: Number(labeled[1]), rest: labeled[2].trim() };
  // Bare numbers remain punctuation-gated to avoid splitting doses/lab values.
  const numbered = line.match(/^\s*(\d{1,4})\s*[).:\-–]\s*(.*?)\s*$/);
  return numbered ? { number: Number(numbered[1]), rest: numbered[2].trim() } : undefined;
}

function leadingNumber(block: string): number | undefined {
  return matchQuestionStart(block.split("\n", 1)[0])?.number;
}

function stripLeadingNumber(block: string): string {
  const lines = block.split("\n");
  const match = matchQuestionStart(lines[0]);
  if (!match) return block;
  return [match.rest, ...lines.slice(1)].filter((line, index) => index > 0 || Boolean(line)).join("\n");
}

function markNumberedDraft(draft: ParsedQuestionDraft, originalBlock: string) {
  draft.parserRuleIds = [...new Set([...(draft.parserRuleIds ?? []), "question.numbered-boundary"])];
  const priorQuestionConfidence = draft.questionDetectionConfidence ?? 0;
  draft.questionDetectionConfidence = Math.max(priorQuestionConfidence, draft.stem && draft.options.length >= 3 ? 0.99 : priorQuestionConfidence);
  draft.sourceSnippet = sourceSnippet(originalBlock);
  draft.overallImportConfidence = boundedConfidence(
    draft.questionDetectionConfidence * 0.4
      + (draft.answerDetectionConfidence ?? 0) * 0.4
      + (draft.explanationDetectionConfidence ?? 0) * 0.2,
  );
  if (draft.needsReview && (draft.answerDetectionConfidence ?? 0) <= 0.1) draft.overallImportConfidence = Math.min(draft.overallImportConfidence, 0.49);
  if (draft.correctKey && (draft.answerDetectionConfidence ?? 0) < 0.8) draft.overallImportConfidence = Math.min(draft.overallImportConfidence, 0.84);
  draft.confidence = categoricalConfidence(draft.overallImportConfidence);
}

// --- answer / explanation sections (L2 + L3) -------------------------------------

const KEY_HEADER_RE = /^\s*(answer\s*key|answers?(?:\s*(?:and|&)\s*(?:explanations?|rationales?))?|explanations?|solutions?)\s*[:\-–]?\s*$/im;
/** Compressed pairs like "1. C", "2-B", "3) D", "Question 4: A", "5C". */
const KEY_PAIR_RE = /(?:q(?:uestion)?\s*)?(\d{1,4})\s*[).:\-–]?\s*\(?([A-Ha-h])\)?(?![a-z0-9])/gi;
/** A numbered entry start inside an answer section: "1. …", "Question 3: …". */
const ENTRY_START_RE = /^\s*(?:q(?:uestion)?\s*)?(\d{1,4})\s*(?:[).:\-–]\s*|\s+)(?=\S)/i;
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
    const candidate = text.slice(headerMatch.index + headerMatch[0].length);
    // A single-question "Explanation:\n..." is content, not a trailing
    // numbered answer section. Only cut when the tail has number→answer shape.
    const hasNumberedAnswer = candidate.split("\n").some((line) => {
      const start = line.match(ENTRY_START_RE);
      if (!start) return false;
      return Boolean(line.slice(start[0].length).match(ENTRY_LETTER_RE));
    });
    const hasCompressedKey = /(?:q(?:uestion)?\s*)?\d{1,4}\s*[).:\-–]?\s*\(?[A-Ha-h]\)?(?![a-z0-9])/i.test(candidate);
    if (hasNumberedAnswer || hasCompressedKey) {
      sectionText = candidate;
      body = text.slice(0, headerMatch.index);
    }
  } else {
    // Inline form: "Answers: 1C, 2B, 3D" on a single line. Must contain real
    // number→letter pairs — a per-question "Answer: B" line is NOT a key
    // section and stays in the body for the single-question parser.
    const inline = text.match(/^\s*answers?\s*[:\-–]\s*(.+\S)\s*$/im);
    if (inline && inline.index !== undefined && /(?:q(?:uestion)?\s*)?\d{1,4}\s*[).:\-–]?\s*\(?[A-Ha-h]\)?(?![a-z0-9])/i.test(inline[1])) {
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
      const optionText = entry.letter && entry.letter !== "?"
        ? next.options.find((option) => option.key === entry.letter)?.text
        : undefined;
      // "1. B. CD4+ T lymphocytes" is an answer-text key, not an
      // explanation. Only attach the tail when it is teaching prose.
      const tailIsAnswerText = optionText
        ? comparableAnswerText(optionText) === comparableAnswerText(entry.explanation)
        : false;
      if (!tailIsAnswerText) {
        next.explanation = cleanExplanationText(entry.explanation, next) || undefined;
        next.explanationSource = next.explanation ? "answer-section" : undefined;
        if (next.explanation) next.explanationDetectionConfidence = 0.96;
      }
    }

    if (entry.letter === "?") {
      next.warnings = [...next.warnings, "The answer section lists conflicting answers for this number — left unset, needs review."];
      next.needsReview = true;
      next.correctKey = undefined;
      next.correctAnswerText = undefined;
      next.answerDetectionConfidence = 0.05;
      next.overallImportConfidence = Math.min(next.overallImportConfidence ?? 1, 0.49);
      next.confidence = "low";
      next.parserRuleIds = [...new Set([...(next.parserRuleIds ?? []), "conflict.answer-section"] )];
      return next;
    }
    if (!entry.letter) return next;

    // L5: the key vs an answer already found inside the question block.
    if (next.correctKey && next.correctKey !== entry.letter) {
      const blockKey = next.correctKey;
      next = {
        ...next,
        correctKey: undefined,
        correctAnswerText: undefined,
        needsReview: true,
        answerDetectionConfidence: 0.05,
        overallImportConfidence: Math.min(next.overallImportConfidence ?? 1, 0.49),
        confidence: "low",
        parserRuleIds: [...new Set([...(next.parserRuleIds ?? []), "conflict.block-vs-answer-section"])],
        warnings: [...next.warnings, `Conflict: the question block says "${blockKey}" but the answer section says "${entry.letter}" — left unset, needs review.`],
      };
      return next;
    }
    if (next.correctKey) return refreshAnswerEntryDiagnostics(next); // already agrees

    if (!next.options.some((o) => o.key === entry.letter)) {
      next.warnings = [...next.warnings, `Answer key says "${entry.letter}" but no such option exists — left unset.`];
      next.needsReview = true;
      next.answerDetectionConfidence = 0.1;
      next.overallImportConfidence = Math.min(next.overallImportConfidence ?? 1, 0.49);
      next.confidence = "low";
      next.parserRuleIds = [...new Set([...(next.parserRuleIds ?? []), "answer.section-invalid-option"])];
      return next;
    }
    return refreshAnswerEntryDiagnostics({
      ...next,
      correctKey: entry.letter,
      correctAnswerText: next.options.find((option) => option.key === entry.letter)?.text,
    });
  });
}

function refreshAnswerEntryDiagnostics(draft: ParsedQuestionDraft): ParsedQuestionDraft {
  const warnings = draft.warnings.filter((warning) => !/no correct answer/i.test(warning));
  const parserRuleIds = [...new Set([...(draft.parserRuleIds ?? []), "answer.trailing-section"])];
  const answerDetectionConfidence = 0.99;
  let overallImportConfidence = boundedConfidence(
    (draft.questionDetectionConfidence ?? 0) * 0.4
      + answerDetectionConfidence * 0.4
      + (draft.explanationDetectionConfidence ?? 0) * 0.2,
  );
  const stillNeedsReview = warnings.some((warning) => /conflict|duplicate|doesn't match|no such option|no question stem|no answer options/i.test(warning));
  if (stillNeedsReview) overallImportConfidence = Math.min(overallImportConfidence, 0.49);
  return {
    ...draft,
    correctAnswerText: draft.correctKey ? draft.options.find((option) => option.key === draft.correctKey)?.text : undefined,
    answerDetectionConfidence,
    overallImportConfidence,
    confidence: categoricalConfidence(overallImportConfidence),
    needsReview: stillNeedsReview || undefined,
    parserRuleIds,
    warnings,
  };
}

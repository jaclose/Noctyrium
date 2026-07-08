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
  confidence: ExtractionConfidence;
  warnings: string[];
}

/** Lines like "A. text", "B) text", "(C) text", "d - text". */
const OPTION_RE = /^\s*\(?([A-Ha-h])[).:\-–]\s+(.*\S)\s*$/;
/** "Answer: C", "Correct answer - B", "ANS: A". */
const ANSWER_RE = /^\s*(?:correct\s+)?ans(?:wer)?\s*[:\-–]?\s*\(?([A-Ha-h])\)?\b/i;
/** "Explanation:", "Rationale:", "Discussion:". */
const EXPLANATION_RE = /^\s*(explanation|rationale|discussion|why)\s*[:\-–]/i;

export function parseQuestionText(raw: string): ParsedQuestionDraft {
  const warnings: string[] = [];
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");

  const stemLines: string[] = [];
  const options: QuestionOption[] = [];
  const explanationLines: string[] = [];
  let correctKey: string | undefined;
  let phase: "stem" | "options" | "explanation" = "stem";

  for (const line of lines) {
    const optionMatch = line.match(OPTION_RE);
    const answerMatch = line.match(ANSWER_RE);
    const explanationMatch = line.match(EXPLANATION_RE);

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

  return { stem, options, correctKey, explanation, confidence, warnings };
}

/** Options should start at A (or the next expected letter) — otherwise a line
 * like "B) both kidneys" inside a stem shouldn't flip us into option mode. */
function isLikelyFirstOption(letter: string, existing: QuestionOption[]): boolean {
  if (existing.length > 0) return true;
  return letter.toUpperCase() === "A";
}

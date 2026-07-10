// Deterministic cleanup for imported question explanations. This is deliberately
// source-preserving: it removes structural duplication and metadata, but never
// rewrites medical content or invents an answer.

export interface ExplanationQuestionContext {
  stem: string;
  options: Array<{ key: string; text: string }>;
  correctKey?: string;
}

const EXPLANATION_MARKER_RE = /(?:^|\s)(correct\s+feedback|feedback|answer\s+explanation|explanation|rationale|discussion|teaching\s+point|key\s+concept|why)\s*[:\-–]\s*/i;
const METADATA_LINE_RE = /^\s*(?:incorrect\s+feedback|objectives?|learning\s+objectives?|this\s+question\s+addresses\s+objectives?|source|references?|citation)\s*[:\-–]/i;
const OPTION_LINE_RE = /^\s*\(?([A-H])\)?[).:\-–]\s*(.*)$/i;
const ANSWER_LINE_RE = /^\s*(?:(?:the\s+)?(?:correct|right)\s+(?:answer|option|choice)|(?:correct\s+)?ans(?:wer)?|correct|key|solution)\s*(?:is)?\s*[:\-–]?\s*(.*)$/i;

function comparable(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/[\s.,;:!?]+$/g, "")
    .trim();
}

function answerRationale(line: string): string | undefined {
  const match = line.match(ANSWER_LINE_RE);
  if (!match) return undefined;
  const rationale = match[1].match(/\b(because|since|as a result|due to)\b[\s\S]*$/i)?.[0]?.trim();
  if (!rationale) return undefined;
  return rationale.charAt(0).toUpperCase() + rationale.slice(1);
}

/**
 * Remove repeated stem/options/answer lines and source/objective clutter from a
 * raw explanation. The returned string contains only source-authored teaching
 * prose. Empty input or a block containing structure alone returns "".
 */
export function cleanExplanationText(
  rawExplanation: string | null | undefined,
  question: ExplanationQuestionContext,
): string {
  if (!rawExplanation?.trim()) return "";

  let source = rawExplanation
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00a0\u2007\u202f]/g, " ")
    .trim();

  // When a full extracted question was accidentally stored as its explanation,
  // the first real explanation marker is the safest boundary. The marker may be
  // glued to an option ("E. foo Correct Feedback: ...").
  const marker = source.match(EXPLANATION_MARKER_RE);
  if (marker?.index !== undefined) source = source.slice(marker.index).trimStart();

  const stem = comparable(question.stem);
  const options = new Map(question.options.map((option) => [option.key.toUpperCase(), comparable(option.text)]));
  const kept: string[] = [];

  for (const rawLine of source.split("\n")) {
    let line = rawLine.trim();
    if (!line) {
      if (kept.length && kept[kept.length - 1] !== "") kept.push("");
      continue;
    }

    const inlineMarker = line.match(EXPLANATION_MARKER_RE);
    if (inlineMarker?.index !== undefined) {
      line = line.slice(inlineMarker.index + inlineMarker[0].length).trim();
      if (!line) continue;
    }

    if (METADATA_LINE_RE.test(line)) continue;

    const numberedStem = line.replace(/^\s*(?:q(?:uestion)?\s*)?\d{1,4}\s*[).:\-–]?\s*/i, "");
    if (stem && comparable(numberedStem) === stem) continue;

    const option = line.match(OPTION_LINE_RE);
    if (option) {
      const expected = options.get(option[1].toUpperCase());
      if (expected && comparable(option[2]) === expected) continue;
    }

    if (ANSWER_LINE_RE.test(line)) {
      const rationale = answerRationale(line);
      if (rationale) kept.push(rationale);
      continue;
    }

    // Remove exact duplicate consecutive prose introduced by extraction/page
    // joins without collapsing meaningful repeated words inside a paragraph.
    if (kept.length && comparable(kept[kept.length - 1]) === comparable(line)) continue;
    kept.push(line);
  }

  while (kept[0] === "") kept.shift();
  while (kept[kept.length - 1] === "") kept.pop();
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

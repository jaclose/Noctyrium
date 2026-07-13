import type { SourceDocument } from "./library";
import type { QuestionOption } from "./questions";

export type QuestionEvidenceKind = "question" | "answer" | "explanation";

export interface DraftWithProvenance {
  stem: string;
  options: QuestionOption[];
  explanation?: string;
  answerEvidence?: string;
  sourceSnippet?: string;
  sourcePage?: number;
  questionSourceSnippet?: string;
  questionSourcePage?: number;
  answerEvidenceSnippet?: string;
  answerEvidencePage?: number;
  explanationSourceSnippet?: string;
  explanationSourcePage?: number;
}

export interface SourceCandidate {
  kind: QuestionEvidenceKind;
  snippet: string;
  page?: number;
  basis: "exact" | "nearby";
}

export interface SourceCandidateOptions {
  limit?: number;
  anchorPage?: number;
  anchorNeedle?: string;
}

interface ExactLocation {
  page?: number;
  text: string;
  index: number;
}

/**
 * Attribute each evidence layer independently. A page is accepted only when
 * the evidence occurs exactly once across the stored page texts. Ambiguous or
 * missing evidence remains unset instead of being assigned to the first page.
 */
export function assignDraftProvenancePages<T extends DraftWithProvenance>(drafts: T[], pages: string[]): T[] {
  for (const draft of drafts) {
    const questionNeedle = bestQuestionNeedle(draft);
    const questionLocation = uniqueLocation(pages, questionNeedle);
    if (questionLocation) {
      draft.questionSourcePage = questionLocation.page;
      draft.sourcePage = questionLocation.page;
      draft.questionSourceSnippet ??= excerpt(questionLocation.text, questionLocation.index, questionNeedle?.length ?? 0);
    }

    const answerNeedle = draft.answerEvidenceSnippet ?? draft.answerEvidence;
    // Numbered/labelled answer evidence is often intentionally short ("1. B"
    // or "Answer: C"). Accept it only when it is still unique across every
    // page; a bare repeated letter remains unattributed rather than guessed.
    const answerLocation = uniqueLocation(pages, answerNeedle, 3);
    if (answerLocation) {
      draft.answerEvidencePage = answerLocation.page;
      draft.answerEvidenceSnippet ??= answerNeedle?.trim();
    }

    const explanationNeedle = draft.explanationSourceSnippet ?? draft.explanation;
    const explanationLocation = uniqueLocation(pages, explanationNeedle);
    if (explanationLocation) {
      draft.explanationSourcePage = explanationLocation.page;
      draft.explanationSourceSnippet ??= explanationNeedle?.trim();
    }
  }
  return drafts;
}

/** Grounded nearby excerpts for the explicit source-repair UI. */
export function sourceCandidates(
  document: SourceDocument,
  kind: QuestionEvidenceKind,
  needle: string | undefined,
  options: SourceCandidateOptions = {},
): SourceCandidate[] {
  const limit = Math.max(1, Math.min(8, Math.trunc(options.limit ?? 5)));
  const value = usefulNeedle(needle);
  const pages = document.pageTexts?.length ? document.pageTexts : [document.rawText];
  const out: SourceCandidate[] = [];
  const seen = new Set<string>();
  if (value) {
    for (let pageIndex = 0; pageIndex < pages.length && out.length < limit; pageIndex++) {
      const text = pages[pageIndex] ?? "";
      let from = 0;
      while (from < text.length && out.length < limit) {
        const index = text.indexOf(value, from);
        if (index < 0) break;
        addCandidate(out, seen, {
          kind,
          snippet: excerpt(text, index, value.length),
          page: document.pageTexts?.length ? pageIndex + 1 : undefined,
          basis: "exact",
        }, limit);
        from = index + Math.max(1, value.length);
      }
    }
  }

  const anchorPage = validPage(options.anchorPage, pages.length)
    ?? uniqueLocation(pages, usefulNeedle(options.anchorNeedle))?.page;
  if (anchorPage !== undefined && out.length < limit) {
    const pageOrder = [anchorPage, anchorPage - 1, anchorPage + 1]
      .filter((page, index, all) => validPage(page, pages.length) !== undefined && all.indexOf(page) === index);
    for (const page of pageOrder) {
      for (const snippet of groundedPageSpans(pages[page - 1] ?? "")) {
        addCandidate(out, seen, { kind, snippet, page: document.pageTexts?.length ? page : undefined, basis: "nearby" }, limit);
        if (out.length >= limit) break;
      }
      if (out.length >= limit) break;
    }
  }
  return out;
}

function addCandidate(out: SourceCandidate[], seen: Set<string>, candidate: SourceCandidate, limit: number): void {
  const snippet = candidate.snippet.trim();
  if (snippet.length < 12 || out.length >= limit) return;
  const key = `${candidate.page ?? 0}:${snippet}`;
  if (seen.has(key)) return;
  seen.add(key);
  out.push({ ...candidate, snippet });
}

function validPage(page: number | undefined, pageCount: number): number | undefined {
  if (!Number.isInteger(page) || page === undefined || page < 1 || page > pageCount) return undefined;
  return page;
}

/** Exact substrings only: paragraph-sized when possible, bounded line windows otherwise. */
function groundedPageSpans(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/).map((part) => part.trim()).filter((part) => part.length >= 12);
  if (paragraphs.length > 1) return paragraphs.flatMap(boundedSlices);
  const lineMatches = [...text.matchAll(/[^\n]+(?:\n|$)/g)];
  if (!lineMatches.length) return boundedSlices(text.trim());
  const spans: string[] = [];
  for (let index = 0; index < lineMatches.length; index += 4) {
    const start = lineMatches[index].index ?? 0;
    const last = lineMatches[Math.min(lineMatches.length - 1, index + 5)];
    const end = (last.index ?? start) + last[0].length;
    spans.push(...boundedSlices(text.slice(start, end).trim()));
  }
  return spans;
}

function boundedSlices(value: string): string[] {
  if (value.length <= 720) return value.length >= 12 ? [value] : [];
  const slices: string[] = [];
  for (let start = 0; start < value.length; start += 600) {
    const snippet = value.slice(start, start + 720).trim();
    if (snippet.length >= 12) slices.push(snippet);
  }
  return slices;
}

function bestQuestionNeedle(draft: DraftWithProvenance): string | undefined {
  const stem = usefulNeedle(draft.stem);
  if (!stem) return undefined;
  // Long exact text is materially less likely to collide than generic openings
  // such as “Which of the following”. Never shorten below 48 characters.
  return stem.length > 180 ? stem.slice(0, 180).trim() : stem;
}

function usefulNeedle(value: string | undefined, minimumLength = 12): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length >= minimumLength ? normalized : undefined;
}

function uniqueLocation(pages: string[], needle: string | undefined, minimumLength = 12): ExactLocation | undefined {
  const value = usefulNeedle(needle, minimumLength);
  if (!value) return undefined;
  let match: ExactLocation | undefined;
  let count = 0;
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const text = pages[pageIndex] ?? "";
    let from = 0;
    while (from < text.length) {
      const index = text.indexOf(value, from);
      if (index < 0) break;
      count += 1;
      if (count > 1) return undefined;
      match = { page: pageIndex + 1, text, index };
      from = index + Math.max(1, value.length);
    }
  }
  return count === 1 ? match : undefined;
}

function excerpt(text: string, index: number, matchLength: number): string {
  const start = Math.max(0, index - 120);
  const end = Math.min(text.length, index + Math.max(matchLength, 520));
  return text.slice(start, end).trim();
}

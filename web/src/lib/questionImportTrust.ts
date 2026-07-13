import type { ParsedQuestionDraft } from "./questionParse";

export type DraftImportStatus = "ready" | "review-suggested" | "unresolved";

export interface DraftImportSummary {
  ready: number;
  reviewSuggested: number;
  unresolved: number;
  explanationsFound: number;
  explanationsMissing: number;
  sourceConfidence: Record<"high" | "medium" | "low", number>;
}

/** Canonical pre-save trust state used by import UI and acceptance tooling. */
export function draftImportStatus(draft: ParsedQuestionDraft | undefined): DraftImportStatus {
  if (!draft?.correctKey) return "unresolved";
  if (draft.needsReview || draft.confidence !== "high") return "review-suggested";
  return "ready";
}

export function summarizeImportDrafts(drafts: readonly ParsedQuestionDraft[]): DraftImportSummary {
  const summary: DraftImportSummary = {
    ready: 0,
    reviewSuggested: 0,
    unresolved: 0,
    explanationsFound: 0,
    explanationsMissing: 0,
    sourceConfidence: { high: 0, medium: 0, low: 0 },
  };
  for (const draft of drafts) {
    const status = draftImportStatus(draft);
    if (status === "ready") summary.ready += 1;
    else if (status === "review-suggested") summary.reviewSuggested += 1;
    else summary.unresolved += 1;
    if (draft.explanation?.trim()) summary.explanationsFound += 1;
    else summary.explanationsMissing += 1;
    summary.sourceConfidence[draft.confidence] += 1;
  }
  return summary;
}


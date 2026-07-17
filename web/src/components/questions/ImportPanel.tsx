// ===========================================================================
// Import Center (question-bank rehaul, layers 1–2). Upload PDF/DOCX/TXT/MD/
// CSV/JSON or paste text → extract → parse (stems, choices, answer keys,
// numbering, pages) → MANDATORY review screen with per-question editing →
// choose how to save: library document only, question set, or both — with
// optional review-gated AI enhancement (digest, pitfalls, review targets).
// Scanned PDFs with no text layer are stored as source records and say so
// honestly; no fake OCR.
// ===========================================================================
import { useMemo, useRef, useState } from "react";
import { ClipboardPaste, FileUp, Save, Sparkles, RefreshCw, ChevronDown, ChevronUp, X } from "lucide-react";
import { useStore } from "../../lib/store";
import { createImportMappingLedger, parseQuestionBlocks, type ParsedQuestionDraft } from "../../lib/questionParse";
import { detectImportFormat, importFromCsv, importFromJson, importFromText } from "../../lib/questionImport";
import { extractDocxText, extractPdfText, extractPlainText } from "../../lib/extractText";
import { documentTitleFromFile, type QuestionSet, type SourceDocument } from "../../lib/library";
import {
  EXAM_TYPE_LABEL, QUESTION_CATEGORIES,
  type QuestionDifficulty, type QuestionExamType, type QuestionRecord, type QuestionSource,
} from "../../lib/questions";
import { normalizeTags, suggestCategory } from "../../lib/taxonomy";
import {
  checkProviderHealth, cleanExplanation as cleanExplanationWithAi, enhanceQuestionSet,
  generateQuestionDrafts, loadAiSettings, mapAnswerFromText, resolveActiveProvider,
} from "../../lib/ai";
import { hashGenerationInput, saveAiGeneration } from "../../lib/aiGenerations";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../ui/primitives";
import { Field, SelectField, TextAreaField } from "../ui/Modal";
import { pushToast } from "../../lib/toast";
import { sha256Hex } from "../../lib/checksum";
import { assignDraftProvenancePages } from "../../lib/questionProvenance";
import { draftImportStatus, summarizeImportDrafts } from "../../lib/questionImportTrust";
import { ICON_SIZE } from "../../lib/iconSize";

export type ImportTab = "paste" | "file" | "ai";
type SaveMode = "set" | "doc" | "both";

interface ReviewDraft extends ParsedQuestionDraft {
  include: boolean;
  aiGenerated?: boolean;
  expanded?: boolean;
  source: QuestionSource;
}

interface PendingDocument {
  existingDocumentId?: string;
  title: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  rawText: string;
  pageTexts?: string[];
  checksum?: string;
}

const EXAM_TYPES = Object.keys(EXAM_TYPE_LABEL) as QuestionExamType[];
const uid = () => crypto.randomUUID();

/** Seed the Import Center from elsewhere: a reference doc (AI tab) or a set of
 * already-parsed drafts to review (Mass Import "Inspect"). */
export interface ImportSeed {
  reference?: { title: string; text: string };
  drafts?: ParsedQuestionDraft[];
  rawText?: string;
  fileName?: string;
  title?: string;
  sourceDocumentId?: string;
  fileType?: string;
  sizeBytes?: number;
  pageTexts?: string[];
  checksum?: string;
  warnings?: string[];
  source?: QuestionSource;
}

/** Re-open a saved source with the deterministic local parser; no provider is required. */
export function parseStoredDocument(document: SourceDocument): { drafts: ParsedQuestionDraft[]; warnings: string[] } {
  const kind = document.fileType.toLowerCase();
  const result = kind === "csv"
    ? importFromCsv(document.rawText)
    : kind === "json"
      ? importFromJson(document.rawText)
      : importFromText(document.rawText);
  if (document.pageTexts?.length) assignDraftProvenancePages(result.drafts, document.pageTexts);
  return result;
}

/** User-reviewed mappings outrank deterministic reparse output for the same source question. */
export function preserveUserReviewedMappings(
  drafts: readonly ParsedQuestionDraft[],
  existingQuestions: readonly QuestionRecord[],
  sourceDocumentId: string | undefined,
): ParsedQuestionDraft[] {
  if (!sourceDocumentId) return [...drafts];
  const confirmedByNumber = new Map(existingQuestions
    .filter((question) => (
      question.sourceDocumentId === sourceDocumentId
      && question.questionNumber !== undefined
      && Boolean(question.correctKey)
      && question.extraction?.parserRuleIds?.includes("answer.user-reviewed-mapping")
    ))
    .map((question) => [question.questionNumber!, question]));
  return drafts.map((draft) => {
    const confirmed = draft.questionNumber === undefined ? undefined : confirmedByNumber.get(draft.questionNumber);
    if (!confirmed?.correctKey) return draft;
    if (!draft.options.some((option) => option.key === confirmed.correctKey)) {
      return {
        ...draft,
        correctKey: undefined,
        correctAnswerText: undefined,
        needsReview: true,
        answerDetectionConfidence: 0.05,
        parserRuleIds: [...new Set([...(draft.parserRuleIds ?? []), "conflict.user-confirmed-mapping-vs-reparse"])],
        warnings: [
          ...draft.warnings,
          `User-confirmed answer ${confirmed.correctKey} is unavailable in the reparsed options — left unset for review.`,
        ],
      };
    }
    const optionKeys = draft.options.map((option) => option.key);
    const hasDuplicateOptionKeys = new Set(optionKeys).size !== optionKeys.length;
    const hasNonSequentialOptionKeys = !hasDuplicateOptionKeys
      && optionKeys.some((key, index) => key !== String.fromCharCode(65 + index));
    const hasNonAnswerReviewGate = (
      (draft.questionDetectionConfidence !== undefined && draft.questionDetectionConfidence < 0.75)
      || hasDuplicateOptionKeys
      || hasNonSequentialOptionKeys
      || (draft.parserRuleIds ?? []).some((ruleId) => (
        ruleId === "question.malformed-boundary"
        || ruleId === "conflict.duplicate-question-number"
      ))
    );
    const hasSupersededAnswerReviewGate = (draft.parserRuleIds ?? []).some((ruleId) => (
      ruleId === "answer.explicit-letter-text-drift"
      || ruleId === "conflict.answer-letter-vs-text"
      || ruleId === "conflict.explicit-answer"
      || ruleId === "conflict.answer-vs-explanation"
      || ruleId === "conflict.answer-vs-rationale"
      || ruleId === "conflict.inferred-answer"
      || ruleId === "ambiguous.answer-text"
      || ruleId === "answer.text-no-option-match"
    ));
    const stillNeedsReview = hasNonAnswerReviewGate
      || (Boolean(draft.needsReview) && !hasSupersededAnswerReviewGate);
    return {
      ...draft,
      correctKey: confirmed.correctKey,
      correctAnswerText: draft.options.find((option) => option.key === confirmed.correctKey)?.text,
      needsReview: stillNeedsReview || undefined,
      answerDetectionConfidence: 1,
      parserRuleIds: [...new Set([...(draft.parserRuleIds ?? []), "answer.user-reviewed-mapping"])],
      warnings: [
        ...draft.warnings,
        `Preserved user-confirmed answer ${confirmed.correctKey} over re-imported parser output.`,
      ],
    };
  });
}

export function ImportPanel({ seed, initialTab = "file" }: { seed?: ImportSeed | null; initialTab?: ImportTab }) {
  const s = useStore();
  const [tab, setTab] = useState<ImportTab>(seed?.reference ? "ai" : initialTab);
  const [drafts, setDrafts] = useState<ReviewDraft[]>(() =>
    seed?.drafts
      ? preserveUserReviewedMappings(seed.drafts, s.questions ?? [], seed.sourceDocumentId)
        .map((d) => ({ ...d, include: true, source: seed.source ?? "imported" }))
      : []);
  const [batchWarnings, setBatchWarnings] = useState<string[]>(() => seed?.warnings ?? []);
  const [pendingDoc, setPendingDoc] = useState<PendingDocument | null>(() =>
    seed?.drafts && seed.rawText != null
      ? {
          existingDocumentId: seed.sourceDocumentId,
          title: seed.title ?? "Imported",
          fileName: seed.fileName ?? "import",
          fileType: seed.fileType ?? "imported",
          sizeBytes: seed.sizeBytes ?? seed.rawText.length,
          rawText: seed.rawText,
          pageTexts: seed.pageTexts,
          checksum: seed.checksum,
        }
      : null);
  const [busyFile, setBusyFile] = useState<string | null>(null);
  // Save options (§save modes): radio for destination, checkbox for AI.
  const [saveMode, setSaveMode] = useState<SaveMode>(() =>
    seed?.drafts ? (seed.drafts.length > 0 ? "both" : "doc") : "both");
  const [aiEnhance, setAiEnhance] = useState(false);
  const [setTitle, setSetTitle] = useState(seed?.title ?? "");
  const [category, setCategory] = useState("");
  const [examType, setExamType] = useState<QuestionExamType | "">("");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | "">("");
  const [aiBusyDraft, setAiBusyDraft] = useState<number | null>(null);

  const provider = useMemo(() => resolveActiveProvider(), []);
  const reviewing = drafts.length > 0 || pendingDoc !== null;

  // Auto-categorize only when the user hasn't set a batch category and the
  // draft has none: high-confidence heuristic assigns, otherwise left blank.
  const draftText = (d: ReviewDraft) => `${d.stem} ${d.options.map((o) => o.text).join(" ")} ${d.explanation ?? ""}`;
  function resolveCategory(d: ReviewDraft): string | undefined {
    if (d.category) return d.category;
    if (category) return category;
    const suggestion = suggestCategory(draftText(d));
    return suggestion.autoAssign ? suggestion.category : undefined;
  }
  function autoTags(d: ReviewDraft): string[] {
    return suggestCategory(draftText(d)).tags;
  }

  function reset() {
    setDrafts([]);
    setBatchWarnings([]);
    setPendingDoc(null);
    setSetTitle("");
    setSaveMode("both");
    setAiEnhance(false);
  }

  function loadDrafts(parsed: ParsedQuestionDraft[], warnings: string[], source: QuestionSource, doc: PendingDocument | null, ai = false) {
    setDrafts(parsed.map((d) => ({ ...d, include: true, aiGenerated: ai, source })));
    setBatchWarnings(warnings);
    setPendingDoc(doc);
    setSetTitle(doc?.title ?? (ai ? "AI-generated set" : `Pasted set ${new Date().toISOString().slice(0, 10)}`));
    setSaveMode(doc ? (parsed.length > 0 ? "both" : "doc") : "set");
  }

  async function saveApproved(modeOverride: SaveMode = saveMode) {
    const approved = drafts.filter((d) => d.include);
    const wantsSet = modeOverride !== "doc" && approved.length > 0;
    const wantsDoc = modeOverride !== "set" && pendingDoc !== null;
    if (!wantsSet && !wantsDoc) {
      pushToast({ title: "Nothing to save", body: "Include at least one question, or choose 'library document only'.", tone: "warn" });
      return;
    }

    const duplicateDoc = wantsDoc
      ? (s.documents ?? []).find((document) => document.id === pendingDoc?.existingDocumentId)
        ?? (pendingDoc?.checksum
          ? (s.documents ?? []).find((document) => document.checksum === pendingDoc.checksum)
          : undefined)
      : undefined;
    const docId = wantsDoc ? (duplicateDoc?.id ?? uid()) : undefined;
    const setId = wantsSet ? uid() : undefined;

    // Questions first, so the set can reference their real ids.
    const questionIds: string[] = [];
    const errors: string[] = [];
    if (wantsSet) {
      for (const d of approved) {
        const manuallyReviewedAnswer = Boolean(
          d.correctKey && d.parserRuleIds?.includes("answer.user-reviewed-mapping"),
        );
        const extractionReviewed = Boolean(
          d.correctKey && (manuallyReviewedAnswer || (!d.needsReview && d.confidence === "high")),
        );
        const result = s.addQuestion({
          source: d.source,
          stem: d.stem,
          options: d.options,
          correctKey: d.correctKey,
          correctAnswerText: d.correctAnswerText,
          explanation: d.explanation,
          choiceRationales: d.choiceRationales,
          needsReview: d.needsReview,
          topic: d.topic,
          system: d.system,
          objective: d.objective,
          category: resolveCategory(d),
          bank: setTitle || undefined,
          setId,
          sourceDocumentId: docId,
          questionNumber: d.questionNumber,
          sourcePage: d.sourcePage,
          examType: (examType || undefined) as QuestionExamType | undefined,
          difficulty: (difficulty || undefined) as QuestionDifficulty | undefined,
          citation: d.reference ?? d.sourceLabel ?? pendingDoc?.fileName,
          tags: normalizeTags([...(d.tags ?? []), ...autoTags(d)]),
          status: "unseen",
          ai: d.aiGenerated ? { generated: true, provider: provider?.info.label } : undefined,
          extraction: {
            confidence: d.confidence,
            reviewed: extractionReviewed,
            reviewedAt: extractionReviewed ? new Date().toISOString() : undefined,
            questionDetectionConfidence: d.questionDetectionConfidence,
            answerDetectionConfidence: d.answerDetectionConfidence,
            explanationDetectionConfidence: d.explanationDetectionConfidence,
            overallImportConfidence: d.overallImportConfidence,
            warnings: d.warnings,
            parserRuleIds: d.parserRuleIds,
            sourceSnippet: d.sourceSnippet,
            questionSourceSnippet: d.questionSourceSnippet,
            questionSourcePage: d.questionSourcePage,
            answerEvidence: d.answerEvidence,
            answerEvidenceSnippet: d.answerEvidenceSnippet,
            answerEvidencePage: d.answerEvidencePage,
            explanationSourceSnippet: d.explanationSourceSnippet,
            explanationSourcePage: d.explanationSourcePage,
            explanationSource: d.explanationSource,
            explanationRawCandidate: d.explanationRawCandidate,
            explanationCleanupOperations: d.explanationCleanupOperations,
          },
        });
        if (result.ok && result.id) questionIds.push(result.id);
        else errors.push(...result.errors);
      }
      if (questionIds.length > 0) {
        const qset: QuestionSet = {
          id: setId!,
          title: setTitle || "Untitled set",
          sourceDocumentIds: docId ? [docId] : [],
          createdAt: new Date().toISOString(),
          questionIds,
          tags: category ? [category] : [],
          aiEnhanced: false,
          parserWarnings: batchWarnings,
        };
        s.addQuestionSet(qset);
      }
    }

    const savedSetId = questionIds.length > 0 ? setId : undefined;

    if (wantsDoc && pendingDoc && duplicateDoc) {
      s.updateDocument(duplicateDoc.id, {
        linkedQuestionSetIds: savedSetId
          ? [...new Set([...duplicateDoc.linkedQuestionSetIds, savedSetId])]
          : duplicateDoc.linkedQuestionSetIds,
        libraryOnly: duplicateDoc.libraryOnly && !savedSetId,
      });
    } else if (wantsDoc && pendingDoc) {
      const doc: SourceDocument = {
        id: docId!,
        title: pendingDoc.title,
        fileName: pendingDoc.fileName,
        fileType: pendingDoc.fileType,
        uploadedAt: new Date().toISOString(),
        rawText: pendingDoc.rawText,
        pageTexts: pendingDoc.pageTexts,
        sizeBytes: pendingDoc.sizeBytes,
        checksum: pendingDoc.checksum,
        tags: category ? [category] : [],
        linkedQuestionSetIds: savedSetId ? [savedSetId] : [],
        libraryOnly: !savedSetId,
      };
      s.addDocument(doc);
    }

    pushToast({
      title: savedSetId
        ? `${questionIds.length} question${questionIds.length === 1 ? "" : "s"} saved${wantsDoc ? " + source document" : ""}`
        : "Source document saved to the library",
      body: errors.length
        ? `Skipped: ${errors.slice(0, 2).join(" ")}`
        : duplicateDoc ? "Matched the existing source checksum and linked it instead of storing a duplicate." : undefined,
      tone: "success",
    });

    // Optional AI enhancement — after save, clearly labeled, never blocking.
    if (aiEnhance && savedSetId && provider) {
      const forDigest = approved.map((d) => ({
        stem: d.stem,
        correct: d.options.find((o) => o.key === d.correctKey)?.text,
        explanation: d.explanation,
      }));
      enhanceQuestionSet(provider, { title: setTitle || "Question set", questions: forDigest })
        .then((digest) => {
          s.updateQuestionSet(savedSetId, {
            aiEnhanced: true,
            digest: { ...digest, generatedBy: provider.info.label, generatedAt: new Date().toISOString() },
          });
          void saveAiGeneration({
            kind: "summary",
            title: `${setTitle || "Question set"} digest`,
            inputHash: hashGenerationInput({ kind: "question-set-digest", setId: savedSetId, questionIds }),
            sourceIds: [savedSetId, ...(docId ? [docId] : [])],
            model: provider.info.label,
            promptVersion: "question-set-digest-v1",
            content: digest,
            metadata: { provider: provider.info.label, questionCount: questionIds.length },
          });
          pushToast({ title: "Question Intelligence ready", body: "The set's digest and pitfalls are on its card in Question Sets.", tone: "success" });
        })
        .catch((err) => pushToast({ title: "AI enhancement failed", body: err instanceof Error ? err.message : "Unknown error.", tone: "warn" }));
    }
    reset();
  }

  function updateDraft(index: number, patch: Partial<ReviewDraft>) {
    setDrafts((all) => all.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function confirmDraftAnswer(index: number, draft: ReviewDraft, key: string | undefined) {
    const answerScore = key ? 1 : 0;
    const overall = (draft.questionDetectionConfidence ?? 0) * 0.4
      + answerScore * 0.4
      + (draft.explanationDetectionConfidence ?? 0) * 0.2;
    updateDraft(index, {
      correctKey: key,
      correctAnswerText: key ? draft.options.find((option) => option.key === key)?.text : undefined,
      answerDetectionConfidence: answerScore,
      overallImportConfidence: overall,
      needsReview: !key || (draft.questionDetectionConfidence ?? 0) < 0.75 || undefined,
      confidence: overall >= 0.85 && key ? "high" : overall >= 0.6 ? "medium" : "low",
      parserRuleIds: key
        ? [...new Set([...(draft.parserRuleIds ?? []), "answer.user-reviewed-mapping"])]
        : draft.parserRuleIds,
    });
  }

  async function assistDraftMapping(index: number) {
    const draft = drafts[index];
    if (!provider || !draft || !pendingDoc?.rawText) return;
    setAiBusyDraft(index);
    try {
      const result = await mapAnswerFromText(provider, {
        stem: draft.stem,
        options: draft.options,
        nearbyText: draft.sourceSnippet ?? pendingDoc.rawText.slice(0, 4000),
      });
      updateDraft(index, {
        correctKey: result.suggestedKey,
        correctAnswerText: result.suggestedKey
          ? draft.options.find((option) => option.key === result.suggestedKey)?.text
          : undefined,
        answerEvidence: result.evidence,
        answerDetectionConfidence: result.confidence,
        overallImportConfidence: Math.min(0.84, Math.max(draft.overallImportConfidence ?? 0, result.confidence)),
        needsReview: result.needsReview || undefined,
        confidence: result.needsReview ? "low" : "medium",
        warnings: [
          ...draft.warnings,
          result.needsReview
            ? "AI mapping assist found no grounded answer — human review is still required."
            : `AI mapping suggestion ${result.suggestedKey} is grounded in the evidence shown below and still requires your approval.`,
        ],
        parserRuleIds: [...new Set([...(draft.parserRuleIds ?? []), "ai.mapping-assist.reviewed-suggestion"])],
      });
    } catch (error) {
      pushToast({ title: "Mapping assist failed", body: error instanceof Error ? error.message : "Unknown error.", tone: "warn" });
    } finally {
      setAiBusyDraft(null);
    }
  }

  async function cleanDraftWithAi(index: number) {
    const draft = drafts[index];
    if (!provider || !draft?.explanation) return;
    setAiBusyDraft(index);
    try {
      const cleaned = await cleanExplanationWithAi(provider, {
        stem: draft.stem,
        correct: draft.correctAnswerText,
        rawExplanation: draft.explanation,
      });
      updateDraft(index, {
        explanation: cleaned,
        explanationDetectionConfidence: Math.max(draft.explanationDetectionConfidence ?? 0, 0.8),
        confidence: draft.confidence === "low" ? "low" : "medium",
        needsReview: true,
        warnings: [...draft.warnings, "AI cleaned this explanation without changing the mapped answer — review before acceptance."],
        parserRuleIds: [...new Set([...(draft.parserRuleIds ?? []), "ai.explanation-cleaner.review-required"])],
      });
    } catch (error) {
      pushToast({ title: "Explanation cleaner failed", body: error instanceof Error ? error.message : "Unknown error.", tone: "warn" });
    } finally {
      setAiBusyDraft(null);
    }
  }

  const includedCount = drafts.filter((d) => d.include).length;
  const importSummary = useMemo(() => summarizeImportDrafts(drafts), [drafts]);
  const developerLedger = useMemo(() => import.meta.env.DEV ? createImportMappingLedger(drafts) : [], [drafts]);

  return (
    <GlassCard>
      <PanelHeader
        title="Paste & inspect"
        headingLevel={2}
        sub="Paste a question block, generate with AI, or review drafts from your imported files. Everything passes through inspection before it becomes a question set."
      />
      {!reviewing && (
        <div className="row" style={{ flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {([["file", "Import file"], ["paste", "Paste text"], ["ai", "Generate with AI"]] as Array<[ImportTab, string]>).map(([id, label]) => (
            <button key={id} className={`filter-pill ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
      )}

      {!reviewing && tab === "paste" && <PasteTab onParsed={(d, w) => loadDrafts(d, w, "pasted", null)} />}
      {!reviewing && tab === "file" && (
        <FileTab
          busyFile={busyFile}
          setBusyFile={setBusyFile}
          onParsed={loadDrafts}
        />
      )}
      {!reviewing && tab === "ai" && (
        <AiGenerateTab seedReference={seed?.reference} onParsed={(d, w) => loadDrafts(d, w, "ai-generated", null, true)} />
      )}

      {reviewing && (
        <div className="stack" style={{ gap: 12 }}>
          <div className="spread" style={{ flexWrap: "wrap", gap: 8 }}>
            <div className="stack" style={{ gap: 2 }}>
              <b>
                {drafts.length > 0
                  ? `Review ${drafts.length} parsed question${drafts.length === 1 ? "" : "s"}`
                  : "No questions parsed from this file"}
                {pendingDoc ? ` · ${pendingDoc.fileName}` : ""}
              </b>
              <span className="sub">
                {drafts.length > 0
                  ? "Uncheck what you don't want. Expand a row to fix the extraction before saving."
                  : "You can still keep the file in the Source Library and paste its text later."}
              </span>
            </div>
            <div className="row">
              <GhostButton onClick={reset}>Cancel import</GhostButton>
              {pendingDoc && drafts.length > 0 && (
                <GhostButton onClick={() => void saveApproved("doc")}>Save and review later</GhostButton>
              )}
              <GButton
                variant="primary"
                disabled={saveMode === "doc" ? !pendingDoc : saveMode === "set" ? !includedCount : !pendingDoc || !includedCount}
                onClick={() => void saveApproved()}
              >
                <Save size={ICON_SIZE.body} /> Save
              </GButton>
            </div>
          </div>

          {batchWarnings.length > 0 && (
            <ul className="intake-warnings">{batchWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          )}

          {drafts.length > 0 && (
            <section className="import-summary" aria-labelledby="import-summary-title">
              <div className="spread wrap gap8">
                <div>
                  <b id="import-summary-title">Import summary</b>
                  <div className="sub">Wrong trusted answers are blocked. Review anything AXOM could not ground cleanly.</div>
                  {importSummary.unresolved > 0 && (
                    <div className="sub">Unresolved questions may be saved as drafts, but they cannot enter a practice block until repaired.</div>
                  )}
                </div>
                <div className="row wrap gap6" aria-label="Import trust counts">
                  <Tag tone="green">Ready {importSummary.ready}</Tag>
                  <Tag tone="orange">Review suggested {importSummary.reviewSuggested}</Tag>
                  <Tag tone="red">Unresolved {importSummary.unresolved}</Tag>
                </div>
              </div>
              <div className="row wrap gap8 sub">
                <span>Explanations found <b>{importSummary.explanationsFound}</b></span>
                <span>Missing <b>{importSummary.explanationsMissing}</b></span>
                <span>Source confidence: <b>{importSummary.sourceConfidence.high} high</b> · {importSummary.sourceConfidence.medium} medium · {importSummary.sourceConfidence.low} low</span>
              </div>
              <div className="row wrap gap6">
                <GhostButton onClick={() => setDrafts((all) => all.map((d) => ({ ...d, include: draftImportStatus(d) === "ready" })))}>
                  Approve ready ({importSummary.ready})
                </GhostButton>
                <GhostButton onClick={() => setDrafts((all) => all.map((d) => ({
                  ...d,
                  include: draftImportStatus(d) === "review-suggested",
                  expanded: draftImportStatus(d) === "review-suggested" || d.expanded,
                })))}>
                  Review suggested ({importSummary.reviewSuggested})
                </GhostButton>
                <GhostButton onClick={() => setDrafts((all) => all.map((d) => ({
                  ...d,
                  include: draftImportStatus(d) === "unresolved",
                  expanded: draftImportStatus(d) === "unresolved" || d.expanded,
                })))}>
                  Repair unresolved ({importSummary.unresolved})
                </GhostButton>
              </div>
            </section>
          )}

          {drafts.length > 1 && (
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
              <span className="sub">Quick select:</span>
              <button className="filter-pill" onClick={() => setDrafts((all) => all.map((d) => ({ ...d, include: d.confidence === "high" && !d.needsReview })))}>
                High-confidence only ({drafts.filter((d) => d.confidence === "high" && !d.needsReview).length})
              </button>
              <button className="filter-pill" onClick={() => setDrafts((all) => all.map((d) => ({ ...d, include: Boolean(d.needsReview || d.confidence === "low") })))}>
                Needs-review only ({drafts.filter((d) => d.needsReview || d.confidence === "low").length})
              </button>
              <button className="filter-pill" onClick={() => setDrafts((all) => all.map((d) => ({ ...d, include: true })))}>All</button>
              <button className="filter-pill" onClick={() => setDrafts((all) => all.map((d) => ({ ...d, include: false })))}>None</button>
            </div>
          )}

          {import.meta.env.DEV && drafts.length > 0 && (
            <details className="question-import-diagnostics">
              <summary>Import diagnostics (development only)</summary>
              <div className="stack gap6">
                {developerLedger.map((entry, index) => (
                  <div className="question-explanation" key={`${entry.questionNumber ?? "draft"}-${index}`}>
                    <b>Question {entry.questionNumber ?? index + 1}</b>
                    <div>Options: {entry.extractedOptions.map((option) => `${option.key}. ${option.text}`).join(" · ") || "none"}</div>
                    <div>Evidence: {entry.answerEvidence ?? "none"}</div>
                    <div>Mapping: {entry.selectedMapping ?? "unresolved"} · confidence {Math.round(entry.confidence * 100)}%</div>
                    {entry.conflictReason && <div>Conflict: {entry.conflictReason}</div>}
                    <div>Source spans: {entry.sourceSpans.map((span) => `${span.kind}${span.page ? ` p.${span.page}` : ""}`).join(" · ") || "none"}</div>
                  </div>
                ))}
              </div>
            </details>
          )}

          <div className="stack gap6">
            <span className="field-label">Save as</span>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
              {([
                ["set", "Save questions"],
                ["doc", "Save document"],
                ["both", "Save document + questions"],
              ] as Array<[SaveMode, string]>).map(([mode, label]) => {
                const disabled = (mode !== "set" && !pendingDoc) || (mode !== "doc" && drafts.length === 0);
                return (
                  <button key={mode} className={`filter-pill ${saveMode === mode ? "on" : ""}`} disabled={disabled}
                    title={disabled ? (pendingDoc ? "No questions were parsed" : "No source file attached") : undefined}
                    onClick={() => setSaveMode(mode)}>
                    {label}
                  </button>
                );
              })}
              <label className="row" style={{ gap: 6, cursor: provider ? "pointer" : "not-allowed", opacity: provider ? 1 : 0.55 }}>
                <input type="checkbox" checked={aiEnhance} disabled={!provider || saveMode === "doc"}
                  onChange={() => setAiEnhance((v) => !v)} />
                <span className="sub">AI enhancement (digest, pitfalls, review targets{provider ? "" : " — needs a provider in Settings → AI"})</span>
              </label>
            </div>
          </div>

          {saveMode !== "doc" && <div className="grid grid-2">
            <Field label="Set title" value={setTitle} onChange={(e) => setSetTitle(e.target.value)} />
            <SelectField label="Category (applies to all)" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">None</option>
              {QUESTION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
            <SelectField label="Exam style" value={examType} onChange={(e) => setExamType(e.target.value as QuestionExamType | "")}>
              <option value="">Not set</option>
              {EXAM_TYPES.map((t) => <option key={t} value={t}>{EXAM_TYPE_LABEL[t]}</option>)}
            </SelectField>
            <SelectField label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty | "")}>
              <option value="">Not set</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </SelectField>
          </div>}

          <div className="stack gap6">
            {drafts.map((d, i) => (
              <div key={i} className={`import-draft ${d.include ? "" : "excluded"}`}>
                <div className="row" style={{ gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={d.include}
                    aria-label={`Include question ${d.questionNumber ?? i + 1}`}
                    onChange={() => updateDraft(i, { include: !d.include })}
                  />
                  <button className="grow stack card-row-main" onClick={() => updateDraft(i, { expanded: !d.expanded })}>
                    <span className="truncate" style={{ fontWeight: 600 }}>
                      {d.questionNumber !== undefined ? `${d.questionNumber}. ` : ""}{d.stem || "(no stem — needs editing)"}
                    </span>
                    <span className="sub truncate">
                      {d.options.length} options{d.correctKey ? ` · answer ${d.correctKey}` : " · no answer set"}
                      {d.explanation ? ` · explanation${d.explanationSource === "answer-section" ? " (from answer section)" : ""}` : " · no explanation"}
                      {d.sourcePage ? ` · p.${d.sourcePage}` : ""}{d.topic ? ` · ${d.topic}` : ""}
                    </span>
                  </button>
                  {d.needsReview && <Tag tone="red">needs review</Tag>}
                  <Tag tone={d.confidence === "high" ? "green" : d.confidence === "medium" ? "orange" : "red"}>{d.confidence}</Tag>
                  {d.aiGenerated && <Tag tone="purple">AI</Tag>}
                  {d.warnings.length > 0 && <Tag tone="orange">{d.warnings.length}⚠</Tag>}
                  <GhostButton aria-label="Toggle editor" onClick={() => updateDraft(i, { expanded: !d.expanded })}>
                    {d.expanded ? <ChevronUp size={ICON_SIZE.body} /> : <ChevronDown size={ICON_SIZE.body} />}
                  </GhostButton>
                </div>
                {d.expanded && (
                  <div className="stack" style={{ gap: 8, marginTop: 10 }}>
                    {d.warnings.length > 0 && <ul className="intake-warnings">{d.warnings.map((w, j) => <li key={j}>{w}</li>)}</ul>}
                    <div className="import-confidence-grid" aria-label="Parser confidence by layer">
                      <span><b>{Math.round((d.questionDetectionConfidence ?? 0) * 100)}%</b> question</span>
                      <span><b>{Math.round((d.answerDetectionConfidence ?? 0) * 100)}%</b> answer</span>
                      <span><b>{Math.round((d.explanationDetectionConfidence ?? 0) * 100)}%</b> explanation</span>
                      <span><b>{Math.round((d.overallImportConfidence ?? 0) * 100)}%</b> overall</span>
                    </div>
                    <TextAreaField label="Stem" rows={3} value={d.stem} onChange={(e) => updateDraft(i, { stem: e.target.value })} />
                    {d.options.map((opt, j) => (
                      <div key={j} className="row">
                        <span className="mono option-key">{opt.key}</span>
                        <input className="field grow" value={opt.text} aria-label={`Option ${opt.key}`}
                          onChange={(e) => updateDraft(i, { options: d.options.map((o, k) => (k === j ? { ...o, text: e.target.value } : o)) })} />
                        <GhostButton aria-label={`Remove option ${opt.key}`}
                          onClick={() => updateDraft(i, { options: d.options.filter((_, k) => k !== j) })}><X size={ICON_SIZE.body} /></GhostButton>
                      </div>
                    ))}
                    <GhostButton onClick={() => updateDraft(i, { options: [...d.options, { key: String.fromCharCode(65 + d.options.length), text: "" }] })}>
                      + Add option
                    </GhostButton>
                    <div className="grid grid-2">
                      <SelectField label="Correct answer" value={d.correctKey ?? ""}
                        onChange={(e) => {
                          const key = e.target.value || undefined;
                          confirmDraftAnswer(i, d, key);
                        }}>
                        <option value="">Not set</option>
                        {d.options.map((o) => <option key={o.key} value={o.key}>{o.key}</option>)}
                      </SelectField>
                      {d.correctKey && d.needsReview && (
                        <GhostButton onClick={() => confirmDraftAnswer(i, d, d.correctKey)}>
                          Confirm mapped answer {d.correctKey}
                        </GhostButton>
                      )}
                      <Field label="Topic" value={d.topic ?? ""} onChange={(e) => updateDraft(i, { topic: e.target.value || undefined })} />
                      <Field label="Learning objective" value={d.objective ?? ""} onChange={(e) => updateDraft(i, { objective: e.target.value || undefined })} />
                      <Field label="Reference / source" value={d.reference ?? d.sourceLabel ?? ""}
                        onChange={(e) => updateDraft(i, { reference: e.target.value || undefined })} />
                    </div>
                    <TextAreaField label="Explanation" rows={2} value={d.explanation ?? ""}
                      onChange={(e) => updateDraft(i, { explanation: e.target.value || undefined })} />
                    {provider && (
                      <div className="row wrap gap6">
                        {!d.correctKey && pendingDoc?.rawText && (
                          <GhostButton disabled={aiBusyDraft === i} onClick={() => void assistDraftMapping(i)}>
                            <Sparkles size={ICON_SIZE.body} /> {aiBusyDraft === i ? "Checking evidence…" : "Mapping assist"}
                          </GhostButton>
                        )}
                        {d.explanation && (
                          <GhostButton disabled={aiBusyDraft === i} onClick={() => void cleanDraftWithAi(i)}>
                            <Sparkles size={ICON_SIZE.body} /> {aiBusyDraft === i ? "Cleaning…" : "Clean explanation with AI"}
                          </GhostButton>
                        )}
                        <span className="sub">AI suggestions stay review-gated and never invent a key without quoted evidence.</span>
                      </div>
                    )}
                    {d.answerEvidence && <div className="question-explanation"><b>Answer evidence:</b> {d.answerEvidence}</div>}
                    {d.choiceRationales && Object.keys(d.choiceRationales).length > 0 && (
                      <div className="stack gap6">
                        <span className="field-label">Choice rationales</span>
                        {Object.entries(d.choiceRationales).map(([key, why]) => (
                          <div key={key} className="sub"><b>{key}:</b> {why}</div>
                        ))}
                      </div>
                    )}
                    {pendingDoc?.rawText && d.stem && (
                      <SourcePeek rawText={pendingDoc.rawText} stem={d.stem} />
                    )}
                    {(d.parserRuleIds?.length ?? 0) > 0 && <div className="source-rules">Parser rules: {d.parserRuleIds!.join(" · ")}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

// --- source peek ("show nearby extracted text") --------------------------------

function SourcePeek({ rawText, stem }: { rawText: string; stem: string }) {
  const [open, setOpen] = useState(false);
  const needle = stem.slice(0, 40).trim();
  const idx = needle.length >= 10 ? rawText.indexOf(needle) : -1;
  const excerpt = idx >= 0
    ? rawText.slice(Math.max(0, idx - 120), idx + 600)
    : null;
  return (
    <div className="stack gap6">
      <GhostButton onClick={() => setOpen((v) => !v)}>
        {open ? "Hide source text" : "Show nearby source text"}
      </GhostButton>
      {open && (
        <div className="question-explanation" style={{ maxHeight: 220, overflowY: "auto", whiteSpace: "pre-wrap" }}>
          {excerpt
            ? <>…{excerpt}…</>
            : "No matching nearby excerpt was found. AXOM left the source unset instead of showing unrelated text."}
        </div>
      )}
    </div>
  );
}

// --- paste tab ---------------------------------------------------------------

function PasteTab({ onParsed }: { onParsed: (drafts: ParsedQuestionDraft[], warnings: string[]) => void }) {
  const [raw, setRaw] = useState("");
  function parse() {
    const drafts = parseQuestionBlocks(raw);
    onParsed(drafts, drafts.length === 0 ? ["No questions detected — check the format (numbered stems, A./B./C. options)."] : []);
  }
  return (
    <div className="stack" style={{ gap: 10 }}>
      <TextAreaField
        label="Paste one question or a whole numbered set (answer keys like 'Answer key: 1. C  2. B' are mapped automatically)"
        rows={6}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={"1. A 45-year-old man presents with…\nA. Option one\nB. Option two\nC. Option three\nD. Option four\n\n2. The next question…\nA. …\nB. …\n\nAnswer key:\n1. C\n2. A"}
      />
      <div className="row">
        <GButton variant="primary" disabled={!raw.trim()} onClick={parse}>
          <ClipboardPaste size={ICON_SIZE.body} /> Extract & inspect
        </GButton>
      </div>
    </div>
  );
}

// --- file tab ----------------------------------------------------------------

function FileTab({ busyFile, setBusyFile, onParsed }: {
  busyFile: string | null;
  setBusyFile: (name: string | null) => void;
  onParsed: (drafts: ParsedQuestionDraft[], warnings: string[], source: QuestionSource, doc: PendingDocument | null, ai?: boolean) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const name = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
    const isDocx = name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    setBusyFile(file.name);
    try {
      if (isPdf || isDocx) {
        const buffer = await file.arrayBuffer();
        const checksum = await sha256Hex(buffer);
        const extracted = isPdf ? await extractPdfText(buffer) : await extractDocxText(buffer);
        const doc: PendingDocument = {
          title: documentTitleFromFile(file.name),
          fileName: file.name,
          fileType: isPdf ? "pdf" : "docx",
          sizeBytes: file.size,
          rawText: extracted.text,
          pageTexts: isPdf ? extracted.pages : undefined,
          checksum,
        };
        if (extracted.empty) {
          onParsed([], extracted.warnings, isPdf ? "pdf" : "imported", doc);
          return;
        }
        const drafts = parseQuestionBlocks(extracted.text);
        if (isPdf) assignSourcePages(drafts, extracted.pages);
        onParsed(
          drafts,
          [
            ...extracted.warnings,
            ...(drafts.length === 0 ? ["Text was extracted but no question pattern was found — review the file, or keep it as a library document."] : []),
          ],
          isPdf ? "pdf" : "imported",
          doc,
        );
        return;
      }

      if (file.type.startsWith("image/")) {
        const checksum = await sha256Hex(await file.arrayBuffer());
        onParsed([], [
          `Attached ${file.name}. Image imports store provenance only — there is no in-app OCR yet. Paste the question text instead.`,
        ], "image", {
          title: documentTitleFromFile(file.name),
          fileName: file.name,
          fileType: file.type,
          sizeBytes: file.size,
          rawText: "",
          checksum,
        });
        return;
      }

      const format = detectImportFormat(file.name, file.type);
      if (format === "unsupported") {
        pushToast({ title: "Unsupported file type", body: "Use PDF, DOCX, TXT, Markdown, CSV, or JSON.", tone: "warn" });
        return;
      }
      const [text, checksum] = await Promise.all([
        file.text(),
        file.arrayBuffer().then(sha256Hex),
      ]);
      const plain = extractPlainText(text);
      const result = format === "csv" ? importFromCsv(plain.text) : format === "json" ? importFromJson(plain.text) : importFromText(plain.text);
      onParsed(result.drafts, [...plain.warnings, ...result.warnings], "imported", {
        title: documentTitleFromFile(file.name),
        fileName: file.name,
        fileType: format,
        sizeBytes: file.size,
        rawText: plain.text,
        checksum,
      });
    } catch (err) {
      pushToast({ title: "Import failed", body: err instanceof Error ? err.message : "Could not read this file.", tone: "warn" });
    } finally {
      setBusyFile(null);
    }
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="sub">
        <b>PDF and DOCX are parsed directly</b> (digital text — scanned PDFs are kept as source records; no OCR yet).
        TXT/Markdown use the question parser; CSV wants headers like
        <span className="mono"> question, a, b, c, d, answer, explanation, topic</span>; JSON takes an array of questions.
        Answer-key sections ("Answer key: 1. C…") are mapped automatically and flagged when ambiguous.
      </div>
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json,image/*"
        aria-label="Choose a question file to import"
        className="visually-hidden-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <div className="import-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file && !busyFile) void handleFile(file);
      }}>
        <FileUp size={ICON_SIZE.display} />
        <div><b>Drop a question file here</b><span>or choose one from this device</span></div>
        <GButton variant="primary" disabled={busyFile !== null} onClick={() => fileInput.current?.click()}>
          {busyFile ? <RefreshCw size={ICON_SIZE.body} className="spin" /> : <FileUp size={ICON_SIZE.body} />} {busyFile ? `Extracting ${busyFile}…` : "Choose file"}
        </GButton>
      </div>
    </div>
  );
}

/** Best-effort page attribution: find each stem's first line inside page texts. */
function assignSourcePages(drafts: ParsedQuestionDraft[], pages: string[]) {
  assignDraftProvenancePages(drafts, pages);
}

// --- AI generate tab -----------------------------------------------------------

function AiGenerateTab({ seedReference, onParsed }: {
  seedReference?: { title: string; text: string } | null;
  onParsed: (drafts: ParsedQuestionDraft[], warnings: string[]) => void;
}) {
  const [topic, setTopic] = useState(seedReference?.title ?? "");
  const [genCategory, setGenCategory] = useState("");
  const [style, setStyle] = useState("board-style");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState("3");
  const [reference, setReference] = useState(seedReference?.text.slice(0, 6000) ?? "");
  const [busy, setBusy] = useState(false);
  const settings = loadAiSettings();
  const provider = useMemo(() => resolveActiveProvider(), []);
  const [health, setHealth] = useState<{ ok: boolean; detail: string } | null>(null);

  useMemo(() => { void checkProviderHealth().then(setHealth); }, []);

  async function generate() {
    if (!provider) return;
    setBusy(true);
    try {
      const result = await generateQuestionDrafts(provider, {
        topic,
        category: genCategory || undefined,
        examStyle: style,
        difficulty,
        count: Math.max(1, Math.min(10, Number(count) || 3)),
        reference: reference || undefined,
      });
      void saveAiGeneration({
        kind: "question-analysis",
        title: topic.trim() || "AI question drafts",
        inputHash: hashGenerationInput({ topic, category: genCategory, style, difficulty, count, reference }),
        model: settings.mode === "local" ? settings.localModel : provider.info.label,
        promptVersion: result.promptVersion,
        content: result.drafts,
        metadata: {
          provider: provider.info.label,
          category: genCategory || undefined,
          style,
          difficulty,
          warnings: result.warnings,
          sourceReference: seedReference?.title,
        },
      });
      onParsed(
        result.drafts.map((d) => ({
          stem: d.stem,
          options: d.options,
          correctKey: d.correctKey,
          explanation: [d.explanation, d.whyOthersWrong ? `Why the others are wrong: ${d.whyOthersWrong}` : ""].filter(Boolean).join("\n\n"),
          topic: topic || undefined,
          category: genCategory || undefined,
          tags: d.tags,
          confidence: "medium",
          warnings: ["AI-generated — verify against a trusted source before trusting it."],
        })),
        result.warnings,
      );
    } catch (err) {
      pushToast({ title: "Generation failed", body: err instanceof Error ? err.message : "Unknown error.", tone: "warn" });
    } finally {
      setBusy(false);
    }
  }

  if (!provider || (settings.mode === "local" && !settings.localModel)) {
    return (
      <EmptyState
        title="No AI provider is active"
        hint={health?.detail ?? "Turn on Local (Ollama) or Demo mode in Settings → AI. Generated questions always require your review before saving."}
        icon={<Sparkles size={ICON_SIZE.emphasis} />}
      />
    );
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="grid grid-2">
        <Field label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Complement deficiencies" />
        <SelectField label="Category" value={genCategory} onChange={(e) => setGenCategory(e.target.value)}>
          <option value="">None</option>
          {QUESTION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectField>
        <SelectField label="Style" value={style} onChange={(e) => setStyle(e.target.value)}>
          <option value="board-style">Board-style vignette</option>
          <option value="imcq">IMCQ</option>
          <option value="esop">ESOP</option>
          <option value="mcat">MCAT-style</option>
          <option value="recall">Direct recall</option>
        </SelectField>
        <SelectField label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </SelectField>
      </div>
      <Field label="How many (≤10)" type="number" min={1} max={10} value={count} onChange={(e) => setCount(e.target.value)} />
      <TextAreaField label="Optional reference text (objectives, notes — questions are grounded in this)" rows={3}
        value={reference} onChange={(e) => setReference(e.target.value)} />
      <div className="row">
        <GButton variant="primary" disabled={busy || !topic.trim()} onClick={generate}>
          {busy ? <RefreshCw size={ICON_SIZE.body} className="spin" /> : <Sparkles size={ICON_SIZE.body} />} {busy ? "Generating…" : "Generate drafts"}
        </GButton>
        <span className="sub">Every draft lands in review — nothing saves without your approval.</span>
      </div>
    </div>
  );
}

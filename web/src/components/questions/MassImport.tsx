// ===========================================================================
// Mass Import (rehaul phase 2) — a staged queue for many files at once:
//   1. upload queue      2. extract text (parallel, capped)
//   3. detect Q/A/expl   4. file-level summary
//   5. inspect each file 6. batch-save clean files
//   7. low-confidence files are flagged and can be opened in the single-file
//      Import Center for full review.
// Clean files (all high/medium confidence, no needs-review) can be batch-saved
// as question sets; risky files require inspection. Never auto-saves garbage.
// ===========================================================================
import { useRef, useState } from "react";
import { FileUp, RefreshCw, Save, CheckCircle2, AlertTriangle, Trash2, Eye } from "lucide-react";
import { useStore } from "../../lib/store";
import { parseQuestionBlocks, type ParsedQuestionDraft } from "../../lib/questionParse";
import { importFromCsv, importFromJson } from "../../lib/questionImport";
import { extractDocxText, extractPdfText, extractPlainText } from "../../lib/extractText";
import { documentTitleFromFile, type QuestionSet, type SourceDocument } from "../../lib/library";
import { suggestCategory, normalizeTags } from "../../lib/taxonomy";
import { enhanceQuestionSet, resolveActiveProvider } from "../../lib/ai";
import { hashGenerationInput, saveAiGeneration } from "../../lib/aiGenerations";
import type { QuestionSource } from "../../lib/questions";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../ui/primitives";
import { pushToast } from "../../lib/toast";
import { sha256Hex } from "../../lib/checksum";
import { assignDraftProvenancePages } from "../../lib/questionProvenance";
import type { ImportSeed } from "./ImportPanel";
import { draftImportStatus } from "../../lib/questionImportTrust";
import { ICON_SIZE } from "../../lib/iconSize";

type FileStatus = "queued" | "extracting" | "parsing" | "ready" | "needs-review" | "no-text" | "error" | "saved";

interface QueuedFile {
  id: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  status: FileStatus;
  rawText: string;
  pageTexts?: string[];
  checksum?: string;
  drafts: ParsedQuestionDraft[];
  warnings: string[];
  answerKeyDetected: boolean;
  source: QuestionSource;
  error?: string;
}

const uid = () => crypto.randomUUID();
const CONCURRENCY = 3;

export function massImportFileStatus(drafts: readonly ParsedQuestionDraft[]): "error" | "needs-review" | "ready" {
  if (drafts.length === 0) return "error";
  return drafts.every((draft) => draftImportStatus(draft) === "ready") ? "ready" : "needs-review";
}

export function MassImport({ onInspect }: { onInspect: (payload: ImportSeed & { title: string; drafts: ParsedQuestionDraft[]; rawText: string; fileName: string }) => void }) {
  const s = useStore();
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [batchAi, setBatchAi] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const provider = resolveActiveProvider();

  function enqueue(files: FileList) {
    const added: QueuedFile[] = Array.from(files).map((f) => ({
      id: uid(),
      fileName: f.name,
      fileType: fileKind(f),
      sizeBytes: f.size,
      status: "queued",
      rawText: "",
      drafts: [],
      warnings: [],
      answerKeyDetected: false,
      source: sourceKind(f),
    }));
    // Keep the File objects alongside the queue rows for processing.
    added.forEach((row, i) => fileMap.set(row.id, files[i]));
    setQueue((q) => [...q, ...added]);
  }

  async function processAll() {
    setProcessing(true);
    const pending = queue.filter((f) => f.status === "queued");
    // Simple bounded-concurrency worker pool.
    let cursor = 0;
    async function worker() {
      while (cursor < pending.length) {
        const row = pending[cursor++];
        await processOne(row.id);
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));
    setProcessing(false);
  }

  function patch(id: string, next: Partial<QueuedFile>) {
    setQueue((q) => q.map((f) => (f.id === id ? { ...f, ...next } : f)));
  }

  async function processOne(id: string) {
    const file = fileMap.get(id);
    if (!file) return;
    patch(id, { status: "extracting" });
    try {
      const kind = fileKind(file);
      let rawText = "";
      let pageTexts: string[] | undefined;
      let checksum: string | undefined;
      let warnings: string[] = [];

      if (kind === "pdf" || kind === "docx") {
        const buffer = await file.arrayBuffer();
        checksum = await sha256Hex(buffer);
        const extracted = kind === "pdf" ? await extractPdfText(buffer) : await extractDocxText(buffer);
        rawText = extracted.text;
        pageTexts = kind === "pdf" ? extracted.pages : undefined;
        warnings = [...extracted.warnings];
        if (extracted.empty) {
          patch(id, { status: "no-text", rawText: "", pageTexts, checksum, warnings, drafts: [] });
          return;
        }
      } else if (kind === "csv" || kind === "json") {
        const buffer = await file.arrayBuffer();
        checksum = await sha256Hex(buffer);
        const plain = extractPlainText(new TextDecoder().decode(buffer));
        rawText = plain.text;
        warnings.push(...plain.warnings);
      } else {
        const buffer = await file.arrayBuffer();
        checksum = await sha256Hex(buffer);
        const plain = extractPlainText(new TextDecoder().decode(buffer));
        rawText = plain.text;
        warnings.push(...plain.warnings);
      }

      patch(id, { status: "parsing", rawText, pageTexts, checksum });
      const result = kind === "csv" ? importFromCsv(rawText) : kind === "json" ? importFromJson(rawText) : { drafts: parseQuestionBlocks(rawText), warnings: [] };
      const drafts = result.drafts;
      if (kind === "pdf" && pageTexts) assignSourcePages(drafts, pageTexts);
      warnings = [...warnings, ...result.warnings];
      const answerKeyDetected = drafts.some((d) => d.correctKey);
      const importStatus = massImportFileStatus(drafts);
      patch(id, {
        status: importStatus,
        drafts,
        warnings,
        answerKeyDetected,
        error: drafts.length === 0 ? "No questions detected" : undefined,
      });
    } catch (err) {
      patch(id, { status: "error", error: err instanceof Error ? err.message : "Could not read this file." });
    }
  }

  function saveClean() {
    const clean = queue.filter((f) => f.status === "ready");
    let sets = 0;
    let totalQ = 0;
    for (const file of clean) {
      const existingDoc = file.checksum
        ? (s.documents ?? []).find((document) => document.checksum === file.checksum)
        : undefined;
      const docId = existingDoc?.id ?? uid();
      const setId = uid();
      const questionIds: string[] = [];
      for (const d of file.drafts) {
        const suggestion = suggestCategory(`${d.stem} ${d.options.map((o) => o.text).join(" ")} ${d.explanation ?? ""}`);
        const result = s.addQuestion({
          source: file.source,
          stem: d.stem,
          options: d.options,
          correctKey: d.correctKey,
          correctAnswerText: d.correctAnswerText,
          explanation: d.explanation,
          choiceRationales: d.choiceRationales,
          needsReview: d.needsReview,
          topic: d.topic,
          objective: d.objective,
          category: d.category ?? (suggestion.autoAssign ? suggestion.category : undefined),
          bank: documentTitleFromFile(file.fileName),
          setId,
          sourceDocumentId: docId,
          questionNumber: d.questionNumber,
          sourcePage: d.sourcePage,
          citation: d.reference ?? file.fileName,
          tags: normalizeTags([...(d.tags ?? []), ...suggestion.tags]),
          status: "unseen",
          extraction: {
            confidence: d.confidence,
            reviewed: true,
            reviewedAt: new Date().toISOString(),
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
      }
      if (!questionIds.length) continue;
      const qset: QuestionSet = {
        id: setId,
        title: documentTitleFromFile(file.fileName),
        sourceDocumentIds: [docId],
        createdAt: new Date().toISOString(),
        questionIds,
        tags: [],
        aiEnhanced: false,
        parserWarnings: file.warnings,
      };
      s.addQuestionSet(qset);
      if (existingDoc) {
        s.updateDocument(existingDoc.id, {
          linkedQuestionSetIds: [...new Set([...existingDoc.linkedQuestionSetIds, setId])],
          libraryOnly: false,
        });
      } else {
        const doc: SourceDocument = {
          id: docId,
          title: documentTitleFromFile(file.fileName),
          fileName: file.fileName,
          fileType: file.fileType,
          uploadedAt: new Date().toISOString(),
          rawText: file.rawText,
          pageTexts: file.pageTexts,
          sizeBytes: file.sizeBytes,
          checksum: file.checksum,
          tags: [],
          linkedQuestionSetIds: [setId],
          libraryOnly: false,
        };
        s.addDocument(doc);
      }
      patch(file.id, { status: "saved" });
      sets++;
      totalQ += questionIds.length;

      if (batchAi && provider) {
        const forDigest = file.drafts.map((d) => ({ stem: d.stem, correct: d.options.find((o) => o.key === d.correctKey)?.text, explanation: d.explanation }));
        enhanceQuestionSet(provider, { title: qset.title, questions: forDigest })
          .then((digest) => {
            s.updateQuestionSet(setId, { aiEnhanced: true, digest: { ...digest, generatedBy: provider.info.label, generatedAt: new Date().toISOString() } });
            void saveAiGeneration({
              kind: "summary",
              title: `${qset.title} digest`,
              inputHash: hashGenerationInput({ kind: "mass-import-digest", setId, questionIds }),
              sourceIds: [setId, docId],
              model: provider.info.label,
              promptVersion: "question-set-digest-v1",
              content: digest,
              metadata: { provider: provider.info.label, fileName: file.fileName, questionCount: questionIds.length },
            });
          })
          .catch(() => { /* enhancement is best-effort */ });
      }
    }
    pushToast({
      title: sets ? `Saved ${sets} set${sets === 1 ? "" : "s"} · ${totalQ} questions` : "Nothing clean to save",
      body: sets ? "Flagged files still need inspection before they save." : "Import files first, then inspect any flagged ones.",
      tone: sets ? "success" : "warn",
    });
  }

  const cleanCount = queue.filter((f) => f.status === "ready").length;
  const anyQueued = queue.some((f) => f.status === "queued");

  return (
    <GlassCard>
      <PanelHeader
        title="Import"
        sub="Upload one file or several related files — extraction, review routing, and batch save happen automatically."
        action={
          <div className="row">
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json"
              aria-label="Choose multiple question files"
              className="visually-hidden-input"
              onChange={(e) => { if (e.target.files?.length) enqueue(e.target.files); e.target.value = ""; }}
            />
            <GhostButton onClick={() => fileInput.current?.click()}><FileUp size={ICON_SIZE.body} /> Add files</GhostButton>
            <GButton size="sm" variant="primary" disabled={!anyQueued || processing} onClick={() => void processAll()}>
              {processing ? <RefreshCw size={ICON_SIZE.body} className="spin" /> : <RefreshCw size={ICON_SIZE.body} />} {processing ? "Importing…" : "Import files"}
            </GButton>
          </div>
        }
      />

      {queue.length === 0 ? (
        <EmptyState icon={<FileUp size={ICON_SIZE.emphasis} />} title="No files queued" hint="Add several PDFs or documents at once — each is parsed and summarized before you save." />
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          <div className="spread" style={{ flexWrap: "wrap", gap: 8 }}>
            <label className="row" style={{ gap: 6, cursor: provider ? "pointer" : "not-allowed", opacity: provider ? 1 : 0.55 }}>
              <input type="checkbox" checked={batchAi} disabled={!provider} onChange={() => setBatchAi((v) => !v)} />
              <span className="sub">AI-enhance each saved set (digest + pitfalls){provider ? "" : " — needs a provider"}</span>
            </label>
            <GButton size="sm" variant="primary" disabled={!cleanCount} onClick={saveClean}>
              <Save size={ICON_SIZE.body} /> Batch-save {cleanCount} clean file{cleanCount === 1 ? "" : "s"}
            </GButton>
          </div>

          <div className="stack gap6">
            {queue.map((file) => (
              <div key={file.id} className="import-draft">
                <div className="row" style={{ gap: 8 }}>
                  <StatusIcon status={file.status} />
                  <div className="grow stack" style={{ gap: 2, minWidth: 0 }}>
                    <span className="truncate" style={{ fontWeight: 600 }}>{file.fileName}</span>
                    <span className="sub truncate">
                      {file.fileType.toUpperCase()} · {Math.round(file.sizeBytes / 1024)} KB
                      {file.status === "ready" || file.status === "needs-review" || file.status === "saved"
                        ? ` · ${file.drafts.length} questions · answer key ${file.answerKeyDetected ? "found" : "not found"}`
                        : ""}
                      {file.error ? ` · ${file.error}` : ""}
                    </span>
                  </div>
                  <StatusTag status={file.status} />
                  {(file.status === "needs-review" || file.status === "ready") && file.drafts.length > 0 && (
                    <GhostButton title="Open in Import Center for full review"
                      onClick={() => onInspect({
                        title: documentTitleFromFile(file.fileName),
                        drafts: file.drafts,
                        rawText: file.rawText,
                        fileName: file.fileName,
                        fileType: file.fileType,
                        sizeBytes: file.sizeBytes,
                        pageTexts: file.pageTexts,
                        checksum: file.checksum,
                        warnings: file.warnings,
                        source: file.source,
                      })}>
                      <Eye size={ICON_SIZE.body} /> Inspect
                    </GhostButton>
                  )}
                  <GhostButton aria-label={`Remove ${file.fileName}`} onClick={() => { fileMap.delete(file.id); setQueue((q) => q.filter((f) => f.id !== file.id)); }}>
                    <Trash2 size={ICON_SIZE.body} />
                  </GhostButton>
                </div>
                {file.warnings.length > 0 && (file.status === "needs-review" || file.status === "no-text") && (
                  <ul className="intake-warnings" style={{ marginTop: 8 }}>{file.warnings.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}</ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

// File objects can't live in React state cleanly across renders; keep them in a
// module map keyed by the queue row id (cleared when a row is removed).
const fileMap = new Map<string, File>();

function fileKind(file: File): string {
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (n.endsWith(".docx")) return "docx";
  if (n.endsWith(".csv")) return "csv";
  if (n.endsWith(".json")) return "json";
  return "text";
}
function sourceKind(file: File): QuestionSource {
  const k = fileKind(file);
  return k === "pdf" ? "pdf" : "imported";
}

function assignSourcePages(drafts: ParsedQuestionDraft[], pages: string[]) {
  assignDraftProvenancePages(drafts, pages);
}

function StatusIcon({ status }: { status: FileStatus }) {
  if (status === "saved" || status === "ready") return <CheckCircle2 size={ICON_SIZE.emphasis} style={{ color: "var(--grade-green)" }} />;
  if (status === "needs-review" || status === "no-text" || status === "error") return <AlertTriangle size={ICON_SIZE.emphasis} style={{ color: "var(--grade-orange)" }} />;
  if (status === "extracting" || status === "parsing") return <RefreshCw size={ICON_SIZE.emphasis} className="spin" />;
  return <FileUp size={ICON_SIZE.emphasis} className="dim" />;
}

function StatusTag({ status }: { status: FileStatus }) {
  const map: Record<FileStatus, { label: string; tone: "green" | "orange" | "red" | "neutral" | "cyan" }> = {
    queued: { label: "queued", tone: "neutral" },
    extracting: { label: "extracting", tone: "cyan" },
    parsing: { label: "parsing", tone: "cyan" },
    ready: { label: "ready", tone: "green" },
    "needs-review": { label: "needs review", tone: "orange" },
    "no-text": { label: "no text (scan)", tone: "orange" },
    error: { label: "no questions", tone: "red" },
    saved: { label: "saved", tone: "green" },
  };
  const meta = map[status];
  return <Tag tone={meta.tone}>{meta.label}</Tag>;
}

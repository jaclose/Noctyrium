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
import { parseQuestionBlocks, type ParsedQuestionDraft } from "../../lib/questionParse";
import { detectImportFormat, importFromCsv, importFromJson, importFromText } from "../../lib/questionImport";
import { extractDocxText, extractPdfText } from "../../lib/extractText";
import { documentTitleFromFile, type QuestionSet, type SourceDocument } from "../../lib/library";
import { EXAM_TYPE_LABEL, QUESTION_CATEGORIES, type QuestionDifficulty, type QuestionExamType, type QuestionSource } from "../../lib/questions";
import { normalizeTags, suggestCategory } from "../../lib/taxonomy";
import { checkProviderHealth, enhanceQuestionSet, generateQuestionDrafts, loadAiSettings, resolveActiveProvider } from "../../lib/ai";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../ui/primitives";
import { Field, SelectField, TextAreaField } from "../ui/Modal";
import { pushToast } from "../../lib/toast";

type ImportTab = "paste" | "file" | "ai";
type SaveMode = "set" | "doc" | "both";

interface ReviewDraft extends ParsedQuestionDraft {
  include: boolean;
  aiGenerated?: boolean;
  expanded?: boolean;
  source: QuestionSource;
}

interface PendingDocument {
  title: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  rawText: string;
  pageTexts?: string[];
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
}

export function ImportPanel({ seed }: { seed?: ImportSeed | null }) {
  const s = useStore();
  const [tab, setTab] = useState<ImportTab>(seed?.reference ? "ai" : "file");
  const [drafts, setDrafts] = useState<ReviewDraft[]>(() =>
    seed?.drafts ? seed.drafts.map((d) => ({ ...d, include: true, source: "imported" as QuestionSource })) : []);
  const [batchWarnings, setBatchWarnings] = useState<string[]>([]);
  const [pendingDoc, setPendingDoc] = useState<PendingDocument | null>(() =>
    seed?.drafts && seed.rawText != null
      ? { title: seed.title ?? "Imported", fileName: seed.fileName ?? "import", fileType: "imported", sizeBytes: seed.rawText.length, rawText: seed.rawText }
      : null);
  const [busyFile, setBusyFile] = useState<string | null>(null);
  // Save options (§save modes): radio for destination, checkbox for AI.
  const [saveMode, setSaveMode] = useState<SaveMode>("both");
  const [aiEnhance, setAiEnhance] = useState(false);
  const [setTitle, setSetTitle] = useState(seed?.title ?? "");
  const [category, setCategory] = useState("");
  const [examType, setExamType] = useState<QuestionExamType | "">("");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | "">("");

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
    setSaveMode(doc ? "both" : "set");
  }

  async function saveApproved() {
    const approved = drafts.filter((d) => d.include);
    const wantsSet = saveMode !== "doc" && approved.length > 0;
    const wantsDoc = saveMode !== "set" && pendingDoc !== null;
    if (!wantsSet && !wantsDoc) {
      pushToast({ title: "Nothing to save", body: "Include at least one question, or choose 'library document only'.", tone: "warn" });
      return;
    }

    const docId = wantsDoc ? uid() : undefined;
    const setId = wantsSet ? uid() : undefined;

    // Questions first, so the set can reference their real ids.
    const questionIds: string[] = [];
    const errors: string[] = [];
    if (wantsSet) {
      for (const d of approved) {
        const result = s.addQuestion({
          source: d.source,
          stem: d.stem,
          options: d.options,
          correctKey: d.correctKey,
          explanation: d.explanation,
          choiceRationales: d.choiceRationales,
          needsReview: d.needsReview,
          topic: d.topic,
          system: d.system,
          category: resolveCategory(d),
          bank: setTitle || undefined,
          setId,
          sourceDocumentId: docId,
          questionNumber: d.questionNumber,
          sourcePage: d.sourcePage,
          examType: (examType || undefined) as QuestionExamType | undefined,
          difficulty: (difficulty || undefined) as QuestionDifficulty | undefined,
          citation: d.sourceLabel ?? pendingDoc?.fileName,
          tags: normalizeTags([...(d.tags ?? []), ...autoTags(d)]),
          status: "unseen",
          ai: d.aiGenerated ? { generated: true, provider: provider?.info.label } : undefined,
          extraction: { confidence: d.confidence, reviewed: true },
        });
        if (result.ok && result.id) questionIds.push(result.id);
        else errors.push(...result.errors);
      }
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

    if (wantsDoc && pendingDoc) {
      const doc: SourceDocument = {
        id: docId!,
        title: pendingDoc.title,
        fileName: pendingDoc.fileName,
        fileType: pendingDoc.fileType,
        uploadedAt: new Date().toISOString(),
        rawText: pendingDoc.rawText,
        pageTexts: pendingDoc.pageTexts,
        sizeBytes: pendingDoc.sizeBytes,
        tags: category ? [category] : [],
        linkedQuestionSetIds: setId ? [setId] : [],
        libraryOnly: saveMode === "doc",
      };
      s.addDocument(doc);
    }

    pushToast({
      title: wantsSet
        ? `${questionIds.length} question${questionIds.length === 1 ? "" : "s"} saved${wantsDoc ? " + source document" : ""}`
        : "Source document saved to the library",
      body: errors.length ? `Skipped: ${errors.slice(0, 2).join(" ")}` : undefined,
      tone: "success",
    });

    // Optional AI enhancement — after save, clearly labeled, never blocking.
    if (aiEnhance && wantsSet && provider) {
      const forDigest = approved.map((d) => ({
        stem: d.stem,
        correct: d.options.find((o) => o.key === d.correctKey)?.text,
        explanation: d.explanation,
      }));
      enhanceQuestionSet(provider, { title: setTitle || "Question set", questions: forDigest })
        .then((digest) => {
          s.updateQuestionSet(setId!, {
            aiEnhanced: true,
            digest: { ...digest, generatedBy: provider.info.label, generatedAt: new Date().toISOString() },
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

  const includedCount = drafts.filter((d) => d.include).length;

  return (
    <GlassCard>
      <PanelHeader
        title="Import Center"
        sub="Upload PDF, DOCX, TXT, Markdown, CSV, or JSON — or paste a block. Everything passes through review before it becomes a question set."
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
              <GButton variant="primary" disabled={saveMode !== "doc" && !includedCount && !pendingDoc} onClick={() => void saveApproved()}>
                <Save size={14} /> Save
              </GButton>
            </div>
          </div>

          {batchWarnings.length > 0 && (
            <ul className="intake-warnings">{batchWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          )}

          <div className="stack gap6">
            <span className="field-label">Save as</span>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
              {([
                ["set", "Question set only"],
                ["doc", "Library document only"],
                ["both", "Both (linked)"],
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

          <div className="grid grid-2">
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
          </div>

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
                    {d.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </GhostButton>
                </div>
                {d.expanded && (
                  <div className="stack" style={{ gap: 8, marginTop: 10 }}>
                    {d.warnings.length > 0 && <ul className="intake-warnings">{d.warnings.map((w, j) => <li key={j}>{w}</li>)}</ul>}
                    <TextAreaField label="Stem" rows={3} value={d.stem} onChange={(e) => updateDraft(i, { stem: e.target.value })} />
                    {d.options.map((opt, j) => (
                      <div key={j} className="row">
                        <span className="mono option-key">{opt.key}</span>
                        <input className="field grow" value={opt.text} aria-label={`Option ${opt.key}`}
                          onChange={(e) => updateDraft(i, { options: d.options.map((o, k) => (k === j ? { ...o, text: e.target.value } : o)) })} />
                        <GhostButton aria-label={`Remove option ${opt.key}`}
                          onClick={() => updateDraft(i, { options: d.options.filter((_, k) => k !== j) })}><X size={13} /></GhostButton>
                      </div>
                    ))}
                    <GhostButton onClick={() => updateDraft(i, { options: [...d.options, { key: String.fromCharCode(65 + d.options.length), text: "" }] })}>
                      + Add option
                    </GhostButton>
                    <div className="grid grid-2">
                      <SelectField label="Correct answer" value={d.correctKey ?? ""}
                        onChange={(e) => updateDraft(i, { correctKey: e.target.value || undefined })}>
                        <option value="">Not set</option>
                        {d.options.map((o) => <option key={o.key} value={o.key}>{o.key}</option>)}
                      </SelectField>
                      <Field label="Topic" value={d.topic ?? ""} onChange={(e) => updateDraft(i, { topic: e.target.value || undefined })} />
                    </div>
                    <TextAreaField label="Explanation" rows={2} value={d.explanation ?? ""}
                      onChange={(e) => updateDraft(i, { explanation: e.target.value || undefined })} />
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
        {open ? "Hide source text" : excerpt ? "Show nearby source text" : "Show source text"}
      </GhostButton>
      {open && (
        <div className="question-explanation" style={{ maxHeight: 220, overflowY: "auto", whiteSpace: "pre-wrap" }}>
          {excerpt
            ? <>…{excerpt}…</>
            : rawText.slice(0, 800)}
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
          <ClipboardPaste size={14} /> Extract & review
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
        const extracted = isPdf ? await extractPdfText(buffer) : await extractDocxText(buffer);
        const doc: PendingDocument = {
          title: documentTitleFromFile(file.name),
          fileName: file.name,
          fileType: isPdf ? "pdf" : "docx",
          sizeBytes: file.size,
          rawText: extracted.text,
          pageTexts: isPdf ? extracted.pages : undefined,
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
        onParsed([], [
          `Attached ${file.name}. Image imports store provenance only — there is no in-app OCR yet. Paste the question text instead.`,
        ], "image", {
          title: documentTitleFromFile(file.name),
          fileName: file.name,
          fileType: file.type,
          sizeBytes: file.size,
          rawText: "",
        });
        return;
      }

      const format = detectImportFormat(file.name, file.type);
      if (format === "unsupported") {
        pushToast({ title: "Unsupported file type", body: "Use PDF, DOCX, TXT, Markdown, CSV, or JSON.", tone: "warn" });
        return;
      }
      const text = await file.text();
      const result = format === "csv" ? importFromCsv(text) : format === "json" ? importFromJson(text) : importFromText(text);
      onParsed(result.drafts, result.warnings, "imported", {
        title: documentTitleFromFile(file.name),
        fileName: file.name,
        fileType: format,
        sizeBytes: file.size,
        rawText: text.slice(0, 400_000),
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
      <div className="row">
        <GButton variant="primary" disabled={busyFile !== null} onClick={() => fileInput.current?.click()}>
          {busyFile ? <RefreshCw size={14} className="spin" /> : <FileUp size={14} />} {busyFile ? `Extracting ${busyFile}…` : "Choose file"}
        </GButton>
      </div>
    </div>
  );
}

/** Best-effort page attribution: find each stem's first line inside page texts. */
function assignSourcePages(drafts: ParsedQuestionDraft[], pages: string[]) {
  for (const draft of drafts) {
    const needle = draft.stem.slice(0, 60).trim();
    if (needle.length < 12) continue;
    const page = pages.findIndex((p) => p.includes(needle));
    if (page >= 0) draft.sourcePage = page + 1;
  }
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
        icon={<Sparkles size={18} />}
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
          {busy ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />} {busy ? "Generating…" : "Generate drafts"}
        </GButton>
        <span className="sub">Every draft lands in review — nothing saves without your approval.</span>
      </div>
    </div>
  );
}

// ===========================================================================
// Question import (pre-beta §5): three paths — paste (multi-question), file
// (TXT/MD/CSV/JSON; images/PDF as provenance only, stated honestly), and
// AI generation — all converging on ONE review screen. Nothing saves without
// explicit approval; every draft is editable before it enters the bank.
// ===========================================================================
import { useMemo, useRef, useState } from "react";
import { ClipboardPaste, FileUp, Save, Sparkles, RefreshCw, ChevronDown, ChevronUp, X } from "lucide-react";
import { useStore } from "../../lib/store";
import { parseQuestionBlocks, type ParsedQuestionDraft } from "../../lib/questionParse";
import { detectImportFormat, importFromCsv, importFromJson, importFromText } from "../../lib/questionImport";
import { EXAM_TYPE_LABEL, QUESTION_CATEGORIES, type QuestionDifficulty, type QuestionExamType, type QuestionSource } from "../../lib/questions";
import { checkProviderHealth, generateQuestionDrafts, loadAiSettings, resolveActiveProvider } from "../../lib/ai";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../ui/primitives";
import { Field, SelectField, TextAreaField } from "../ui/Modal";
import { pushToast } from "../../lib/toast";

type ImportTab = "paste" | "file" | "ai";

interface ReviewDraft extends ParsedQuestionDraft {
  include: boolean;
  aiGenerated?: boolean;
  expanded?: boolean;
  source: QuestionSource;
  sourceFile?: { name: string; type: string; size: number; addedAt: string };
}

const EXAM_TYPES = Object.keys(EXAM_TYPE_LABEL) as QuestionExamType[];

export function ImportPanel() {
  const addQuestion = useStore((s) => s.addQuestion);
  const [tab, setTab] = useState<ImportTab>("paste");
  const [drafts, setDrafts] = useState<ReviewDraft[]>([]);
  const [batchWarnings, setBatchWarnings] = useState<string[]>([]);
  // Batch metadata applied to every saved question (per-draft values win).
  const [bank, setBank] = useState("");
  const [category, setCategory] = useState("");
  const [examType, setExamType] = useState<QuestionExamType | "">("");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | "">("");

  function loadDrafts(parsed: ParsedQuestionDraft[], warnings: string[], source: QuestionSource, ai = false, file?: ReviewDraft["sourceFile"]) {
    setDrafts(parsed.map((d) => ({ ...d, include: true, aiGenerated: ai, source, sourceFile: file })));
    setBatchWarnings(warnings);
  }

  function saveApproved() {
    const approved = drafts.filter((d) => d.include);
    let saved = 0;
    const errors: string[] = [];
    for (const d of approved) {
      const result = addQuestion({
        source: d.source,
        sourceFile: d.sourceFile,
        stem: d.stem,
        options: d.options,
        correctKey: d.correctKey,
        explanation: d.explanation,
        topic: d.topic,
        system: d.system,
        category: d.category || category || undefined,
        bank: bank || undefined,
        examType: (examType || undefined) as QuestionExamType | undefined,
        difficulty: (difficulty || undefined) as QuestionDifficulty | undefined,
        citation: d.sourceLabel,
        tags: d.tags ?? [],
        status: "unseen",
        ai: d.aiGenerated ? { generated: true, provider: resolveActiveProvider()?.info.label } : undefined,
        extraction: { confidence: d.confidence, reviewed: true },
      });
      if (result.ok) saved++;
      else errors.push(...result.errors);
    }
    pushToast({
      title: `${saved} question${saved === 1 ? "" : "s"} added to the bank`,
      body: errors.length ? `Skipped: ${errors.slice(0, 2).join(" ")}` : undefined,
      tone: saved ? "success" : "warn",
    });
    setDrafts([]);
    setBatchWarnings([]);
  }

  function updateDraft(index: number, patch: Partial<ReviewDraft>) {
    setDrafts((all) => all.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  const includedCount = drafts.filter((d) => d.include).length;

  return (
    <GlassCard>
      <PanelHeader
        title="Add questions"
        sub="Import from files or paste blocks of questions; AI generation is optional and always review-gated."
      />
      <div className="row" style={{ flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {([["paste", "Paste text"], ["file", "Import file"], ["ai", "Generate with AI"]] as Array<[ImportTab, string]>).map(([id, label]) => (
          <button key={id} className={`filter-pill ${tab === id ? "on" : ""}`} onClick={() => { setTab(id); }}>{label}</button>
        ))}
      </div>

      {drafts.length === 0 && tab === "paste" && <PasteTab onParsed={(d, w) => loadDrafts(d, w, "pasted")} />}
      {drafts.length === 0 && tab === "file" && <FileTab onParsed={loadDrafts} />}
      {drafts.length === 0 && tab === "ai" && <AiGenerateTab onParsed={(d, w) => loadDrafts(d, w, "ai-generated", true)} />}

      {drafts.length > 0 && (
        <div className="stack" style={{ gap: 12 }}>
          <div className="spread" style={{ flexWrap: "wrap", gap: 8 }}>
            <div className="stack" style={{ gap: 2 }}>
              <b>Review {drafts.length} parsed question{drafts.length === 1 ? "" : "s"}</b>
              <span className="sub">Uncheck what you don't want. Expand a row to correct the extraction before saving.</span>
            </div>
            <div className="row">
              <GhostButton onClick={() => { setDrafts([]); setBatchWarnings([]); }}>Cancel import</GhostButton>
              <GButton variant="primary" disabled={!includedCount} onClick={saveApproved}>
                <Save size={14} /> Save {includedCount} to bank
              </GButton>
            </div>
          </div>

          {batchWarnings.length > 0 && (
            <ul className="intake-warnings">{batchWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          )}

          <div className="grid grid-2">
            <Field label="Bank / set name (applies to all)" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="e.g. NB3 PQ Set 4" />
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
                    aria-label={`Include question ${i + 1}`}
                    onChange={() => updateDraft(i, { include: !d.include })}
                  />
                  <button className="grow stack card-row-main" onClick={() => updateDraft(i, { expanded: !d.expanded })}>
                    <span className="truncate" style={{ fontWeight: 600 }}>{d.stem || "(no stem — needs editing)"}</span>
                    <span className="sub truncate">
                      {d.options.length} options{d.correctKey ? ` · answer ${d.correctKey}` : " · no answer set"}
                      {d.topic ? ` · ${d.topic}` : ""}
                    </span>
                  </button>
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
        label="Paste one question or a whole numbered set"
        rows={6}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={"1. A 45-year-old man presents with…\nA. Option one\nB. Option two\nC. Option three\nD. Option four\nAnswer: C\nExplanation: …\n\n2. The next question…"}
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

function FileTab({ onParsed }: {
  onParsed: (drafts: ParsedQuestionDraft[], warnings: string[], source: QuestionSource, ai?: boolean, file?: ReviewDraft["sourceFile"]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const meta = { name: file.name, type: file.type || "unknown", size: file.size, addedAt: new Date().toISOString() };
    const format = detectImportFormat(file.name, file.type);
    if (format === "provenance-only") {
      onParsed(
        [{
          stem: "", options: [], confidence: "low",
          warnings: [
            `Attached ${file.name}. PDF/image imports currently store provenance only — paste the extracted text or use TXT/CSV/JSON for parsing. No OCR runs in-app.`,
          ],
        }],
        [], file.type.startsWith("image/") ? "image" : "pdf", false, meta,
      );
      return;
    }
    if (format === "unsupported") {
      pushToast({ title: "Unsupported file type", body: "Use TXT, Markdown, CSV, or JSON. PDFs/images attach as provenance only.", tone: "warn" });
      return;
    }
    const text = await file.text();
    const result = format === "csv" ? importFromCsv(text) : format === "json" ? importFromJson(text) : importFromText(text);
    onParsed(result.drafts, result.warnings, "imported", false, meta);
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="sub">
        Supported for parsing: <b>TXT, Markdown, CSV, JSON</b>. CSV wants headers like
        <span className="mono"> question, a, b, c, d, answer, explanation, topic</span>. Images and PDFs attach
        as source records only — there is no in-app OCR yet.
      </div>
      <input
        ref={fileInput}
        type="file"
        accept=".txt,.md,.markdown,.csv,.json,image/*,.pdf"
        aria-label="Choose a question file to import"
        className="visually-hidden-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <div className="row">
        <GButton variant="primary" onClick={() => fileInput.current?.click()}>
          <FileUp size={14} /> Choose file
        </GButton>
      </div>
    </div>
  );
}

// --- AI generate tab -----------------------------------------------------------

function AiGenerateTab({ onParsed }: { onParsed: (drafts: ParsedQuestionDraft[], warnings: string[]) => void }) {
  const [topic, setTopic] = useState("");
  const [genCategory, setGenCategory] = useState("");
  const [style, setStyle] = useState("board-style");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState("3");
  const [reference, setReference] = useState("");
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

// ===========================================================================
// Question intake (directive §10): paste → extract → review → correct → save.
// Extraction is honest: uncertain fields stay blank, confidence is visible,
// and nothing saves without the review step. Screenshots/PDFs attach as
// provenance metadata with manual transcription (the extension point for
// future secure server-side OCR — no fake OCR claims).
// ===========================================================================
import { useRef, useState } from "react";
import { ClipboardPaste, FileUp, Save, X } from "lucide-react";
import { useStore } from "../../lib/store";
import { parseQuestionText, type ParsedQuestionDraft } from "../../lib/questionParse";
import type { QuestionSource } from "../../lib/questions";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag } from "../ui/primitives";
import { Field, SelectField, TextAreaField } from "../ui/Modal";
import { pushToast } from "../../lib/toast";

interface DraftState extends ParsedQuestionDraft {
  source: QuestionSource;
  sourceFile?: { name: string; type: string; size: number; addedAt: string };
  topic: string;
  system: string;
  citation: string;
}

export function QuestionIntake() {
  const addQuestion = useStore((s) => s.addQuestion);
  const [raw, setRaw] = useState("");
  const [draft, setDraft] = useState<DraftState | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function parse() {
    if (!raw.trim()) return;
    const parsed = parseQuestionText(raw);
    setDraft({ ...parsed, source: "pasted", topic: "", system: "", citation: "" });
  }

  function attachFile(file: File) {
    const kind: QuestionSource = file.type.startsWith("image/")
      ? (file.name.toLowerCase().includes("screen") ? "screenshot" : "image")
      : file.type === "application/pdf" ? "pdf" : "imported";
    setDraft({
      stem: "",
      options: [],
      confidence: "low",
      warnings: [
        `Attached ${file.name}. In-browser OCR isn't wired up yet — type or paste the question text below; the file stays linked as the source.`,
      ],
      source: kind,
      sourceFile: { name: file.name, type: file.type || "unknown", size: file.size, addedAt: new Date().toISOString() },
      topic: "",
      system: "",
      citation: file.name,
    });
  }

  function save() {
    if (!draft) return;
    const result = addQuestion({
      source: draft.source,
      sourceFile: draft.sourceFile,
      stem: draft.stem,
      options: draft.options,
      correctKey: draft.correctKey,
      explanation: draft.explanation,
      topic: draft.topic || undefined,
      system: draft.system || undefined,
      citation: draft.citation || undefined,
      tags: [],
      status: "unseen",
      extraction: { confidence: draft.confidence, reviewed: true },
    });
    if (!result.ok) {
      pushToast({ title: "Couldn't save question", body: result.errors.join(" "), tone: "warn" });
      return;
    }
    pushToast({ title: "Question saved", body: "It's in your workspace and will enter the review loop once attempted.", tone: "success" });
    setDraft(null);
    setRaw("");
  }

  function updateOption(index: number, text: string) {
    setDraft((d) => d && ({ ...d, options: d.options.map((o, i) => (i === index ? { ...o, text } : o)) }));
  }
  function removeOption(index: number) {
    setDraft((d) => d && ({ ...d, options: d.options.filter((_, i) => i !== index) }));
  }
  function addOption() {
    setDraft((d) => d && ({
      ...d,
      options: [...d.options, { key: String.fromCharCode(65 + d.options.length), text: "" }],
    }));
  }

  return (
    <GlassCard>
      <PanelHeader
        title="Add questions"
        sub="Paste a question (stem + A./B./C. options), or attach a screenshot/PDF and transcribe it. You review every extraction before it saves."
        action={
          <div className="row">
            <input
              ref={fileInput}
              type="file"
              accept="image/*,.pdf"
              aria-label="Attach a question screenshot or PDF"
              className="visually-hidden-input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) attachFile(f);
                e.target.value = "";
              }}
            />
            <GhostButton onClick={() => fileInput.current?.click()}><FileUp size={14} /> Attach file</GhostButton>
          </div>
        }
      />

      {!draft && (
        <div className="stack" style={{ gap: 10 }}>
          <TextAreaField
            label="Paste question text"
            rows={5}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={"A 45-year-old man presents with…\nA. Option one\nB. Option two\nC. Option three\nD. Option four\nAnswer: C\nExplanation: …"}
          />
          <div className="row">
            <GButton variant="primary" disabled={!raw.trim()} onClick={parse}>
              <ClipboardPaste size={14} /> Extract & review
            </GButton>
          </div>
        </div>
      )}

      {draft && (
        <div className="stack" style={{ gap: 12 }}>
          <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
            <Tag tone={draft.confidence === "high" ? "green" : draft.confidence === "medium" ? "orange" : "red"}>
              Extraction: {draft.confidence}
            </Tag>
            {draft.sourceFile && <Tag tone="neutral">{draft.sourceFile.name}</Tag>}
          </div>
          {draft.warnings.length > 0 && (
            <ul className="intake-warnings">
              {draft.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
          <TextAreaField label="Question stem" rows={4} value={draft.stem}
            onChange={(e) => setDraft({ ...draft, stem: e.target.value })} />
          <div className="stack gap6">
            <span className="field-label">Answer options</span>
            {draft.options.map((opt, i) => (
              <div key={i} className="row">
                <span className="mono option-key">{opt.key}</span>
                <input className="field grow" value={opt.text} aria-label={`Option ${opt.key}`}
                  onChange={(e) => updateOption(i, e.target.value)} />
                <GhostButton aria-label={`Remove option ${opt.key}`} onClick={() => removeOption(i)}><X size={13} /></GhostButton>
              </div>
            ))}
            <GhostButton onClick={addOption}>+ Add option</GhostButton>
          </div>
          <div className="grid grid-2">
            <SelectField label="Correct answer" value={draft.correctKey ?? ""}
              onChange={(e) => setDraft({ ...draft, correctKey: e.target.value || undefined })}>
              <option value="">Not set yet</option>
              {draft.options.map((o) => <option key={o.key} value={o.key}>{o.key}</option>)}
            </SelectField>
            <Field label="Topic (e.g. Complement)" value={draft.topic}
              onChange={(e) => setDraft({ ...draft, topic: e.target.value })} />
            <Field label="System / course area" value={draft.system}
              onChange={(e) => setDraft({ ...draft, system: e.target.value })} />
            <Field label="Source / citation" value={draft.citation}
              onChange={(e) => setDraft({ ...draft, citation: e.target.value })} />
          </div>
          <TextAreaField label="Explanation (optional)" rows={3} value={draft.explanation ?? ""}
            onChange={(e) => setDraft({ ...draft, explanation: e.target.value || undefined })} />
          <div className="row">
            <GButton variant="primary" onClick={save}><Save size={14} /> Save to workspace</GButton>
            <GhostButton onClick={() => setDraft(null)}>Discard</GhostButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

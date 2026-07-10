import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  FileQuestion,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { QuestionSetCard } from "../components/questions/QuestionSetCard";
import { QuizFeedback } from "../components/questions/QuizFeedback";
import { AxomBrandLockup } from "../components/ui/BrandMark";
import { EmptyState, GButton, GhostButton, GlassCard, PanelHeader, Tag } from "../components/ui/primitives";
import type { QuestionSet, QuestionSetMetrics } from "../lib/library";
import type { QuestionRecord } from "../lib/questions";
import "../styles/design-preview.css";

type PreviewVariant = "quiet" | "balanced" | "contrast";

const PREVIEW_SET: QuestionSet = {
  id: "preview-immunology",
  title: "Week 4–5 Postmidterm Immunology",
  sourceDocumentIds: ["preview-source"],
  createdAt: "2026-07-08T14:00:00.000Z",
  questionIds: Array.from({ length: 20 }, (_, index) => `preview-question-${index + 1}`),
  tags: ["Immunology", "Postmidterm"],
  aiEnhanced: true,
  parserWarnings: [],
};

const PREVIEW_METRICS: QuestionSetMetrics = {
  total: 20,
  completed: 12,
  remaining: 8,
  completionPct: 60,
  correct: 10,
  attempts: 12,
  accuracyPct: 83,
  accuracyTone: "gold",
  needsReview: 3,
  importConfidence: 91,
  lastStudiedAt: "2026-07-09T20:30:00.000Z",
  category: "Immunology",
  sourceTitle: "Postmidterm IMMU Practice · set 3",
  missedQuestionIds: ["preview-question-2", "preview-question-9"],
};

const STEM = "A 36-year-old man with tuberculosis exposure has a positive PPD skin test. Which cell type primarily mediates this reaction?";
const OPTIONS = [
  { key: "A", text: "B lymphocytes" },
  { key: "B", text: "CD4+ T lymphocytes" },
  { key: "C", text: "Mast cells" },
  { key: "D", text: "Eosinophils" },
  { key: "E", text: "Neutrophils" },
];

const PREVIEW_QUESTION: QuestionRecord = {
  id: "preview-question-1",
  source: "pdf",
  stem: STEM,
  options: OPTIONS,
  correctKey: "B",
  correctAnswerText: "CD4+ T lymphocytes",
  explanation: [
    STEM,
    ...OPTIONS.map((option) => `${option.key}. ${option.text}`),
    "Answer: B. CD4+ T lymphocytes",
    "Explanation: The PPD test is a type IV hypersensitivity reaction mediated by Th1 CD4+ T cells and macrophages.",
    "Learning Objective: Recognize delayed-type hypersensitivity.",
    "Source: Week 4–5 Postmidterm IMMU Practice questions set 3.",
  ].join("\n"),
  status: "unseen",
  bank: PREVIEW_SET.title,
  setId: PREVIEW_SET.id,
  sourceDocumentId: "preview-source",
  sourcePage: 1,
  category: "Immunology",
  topic: "Type IV hypersensitivity",
  objective: "Connect delayed hypersensitivity to Th1 CD4+ T-cell activation and macrophage recruitment.",
  examType: "board",
  difficulty: "medium",
  tags: ["hypersensitivity", "tuberculosis"],
  attempts: [],
  extraction: {
    confidence: "high",
    reviewed: true,
    questionDetectionConfidence: 0.98,
    answerDetectionConfidence: 0.97,
    explanationDetectionConfidence: 0.95,
    overallImportConfidence: 0.97,
    warnings: [],
    parserRuleIds: ["question.numbered", "option.alpha-dot", "answer.letter-and-text", "explanation.marker"],
    sourceSnippet: "Answer: B. CD4+ T lymphocytes\nExplanation: The PPD test is a type IV hypersensitivity reaction mediated by Th1 CD4+ T cells and macrophages.",
    answerEvidence: "Answer: B. CD4+ T lymphocytes",
    explanationSource: "inline",
  },
  citation: "Week 4–5 Postmidterm IMMU Practice questions set 3",
  createdAt: "2026-07-09T18:00:00.000Z",
  updatedAt: "2026-07-09T18:00:00.000Z",
};

const VARIANT_COPY: Record<PreviewVariant, string> = {
  quiet: "Lowest visual energy for long study sessions.",
  balanced: "Selected · strongest hierarchy with restrained gold.",
  contrast: "Sharper borders for bright rooms and low-vision review.",
};

export default function DesignPreviewPage() {
  const [variant, setVariant] = useState<PreviewVariant>("balanced");
  const [picked, setPicked] = useState<string>();
  const [revealed, setRevealed] = useState(false);
  const [query, setQuery] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  function choose(key: string) {
    if (revealed) return;
    setPicked(key);
  }

  function showState(key: "A" | "B") {
    setPicked(key);
    setRevealed(true);
  }

  function resetQuestion() {
    setPicked(undefined);
    setRevealed(false);
    setActionMessage("");
  }

  function report(message: string) {
    setActionMessage(message);
  }

  return (
    <main className={`design-preview design-preview--${variant}`}>
      <div className="dp-wrap">
        <header className="dp-topbar">
          <AxomBrandLockup
            layout="horizontal"
            size="lg"
            subtitle="Academic command system · component preview"
            markFramed
          />
          <div className="dp-top-actions">
            <Tag tone="orange">Development only</Tag>
            <a className="dp-exit" href="#dashboard"><ArrowLeft size={14} /> Exit preview</a>
          </div>
        </header>

        <section className="dp-hero glass-liquid" aria-labelledby="preview-title">
          <div className="dp-hero-copy">
            <span className="dp-eyebrow"><ShieldCheck size={14} /> AXOM design proof</span>
            <h1 id="preview-title">Import. Review uncertainty. Study cleanly.</h1>
            <p>A reusable black-glass system built around the real question-bank loop, with gold reserved for identity, focus, and the next useful action.</p>
          </div>
          <div className="dp-variant-panel">
            <span className="field-label">Glass treatment</span>
            <div className="dp-tabs" role="tablist" aria-label="Design variants">
              {(["quiet", "balanced", "contrast"] as const).map((item) => (
                <button key={item} role="tab" aria-selected={variant === item} className={variant === item ? "on" : ""} onClick={() => setVariant(item)}>
                  {item}
                </button>
              ))}
            </div>
            <p>{VARIANT_COPY[variant]}</p>
          </div>
        </section>

        <section className="dp-metrics" aria-label="Question Bank metrics">
          {[
            ["Total questions", "1,248", "+84 this week"],
            ["Due review", "32", "recommended next"],
            ["Unseen", "416", "across 7 sets"],
            ["Accuracy", "83%", "up 6 points"],
            ["Active sets", "7", "2 used today"],
            ["Needs mapping", "9", "review only these"],
          ].map(([label, value, note]) => (
            <GlassCard key={label} className="dp-metric" pad={false}>
              <span>{label}</span><strong>{value}</strong><small>{note}</small>
            </GlassCard>
          ))}
        </section>

        <section className="dp-command-grid" aria-label="Primary study preview">
          <div className="dp-column">
            <div className="dp-section-heading">
              <div><span className="dp-eyebrow">Next useful action</span><h2>Continue with the set that is already warm.</h2></div>
              <Tag tone="green">12 of 20 complete</Tag>
            </div>
            <QuestionSetCard
              set={PREVIEW_SET}
              metrics={PREVIEW_METRICS}
              onStart={() => report("Tutor block ready with 8 remaining questions.")}
              onReviewMisses={() => report("Missed-only block ready with 2 questions.")}
              onEdit={() => report("Set editor would open here.")}
              onInsights={() => report("Set intelligence would open here.")}
            >
              <div className="dp-set-insight"><Sparkles size={14} /> Most misses cluster around delayed hypersensitivity and complement pathways.</div>
            </QuestionSetCard>

            <GlassCard className="dp-controls-card">
              <PanelHeader title="Control language" sub="Representative inputs, buttons, tags, and search behavior." />
              <label className="dp-field">
                <span className="field-label">Search the bank</span>
                <span className="dp-search"><Search size={15} /><input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Stem, source, system, or tag" /></span>
              </label>
              <div className="row wrap gap6">
                <GButton variant="primary"><Upload size={14} /> Quick import</GButton>
                <GButton>Build block</GButton>
                <GhostButton>Mass import</GhostButton>
                <Tag tone="green">high confidence</Tag>
                <Tag tone="orange">needs review</Tag>
                <Tag tone="neutral">{query ? `searching “${query}”` : "local-first"}</Tag>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="dp-quiz" aria-labelledby="quiz-preview-title">
            <div className="dp-quiz-topline">
              <div><span className="dp-eyebrow">Tutor mode</span><h2 id="quiz-preview-title">Question 1 of 20</h2></div>
              <div className="row wrap gap6"><Tag tone="neutral">Immunology</Tag><Tag tone="neutral">page 1</Tag><Tag tone="green">97% mapped</Tag></div>
            </div>
            <div className="dp-progress" role="progressbar" aria-label="Block progress" aria-valuemin={0} aria-valuemax={20} aria-valuenow={1}><span /></div>
            <p className="dp-stem">{PREVIEW_QUESTION.stem}</p>
            <fieldset className="dp-choices">
              <legend className="sr-only">Choose one answer</legend>
              {PREVIEW_QUESTION.options.map((option) => {
                const selected = picked === option.key;
                const correct = revealed && option.key === PREVIEW_QUESTION.correctKey;
                const wrong = revealed && selected && !correct;
                return (
                  <button
                    type="button"
                    key={option.key}
                    className={["dp-choice", selected ? "selected" : "", correct ? "correct" : "", wrong ? "wrong" : ""].filter(Boolean).join(" ")}
                    aria-pressed={selected}
                    disabled={revealed}
                    onClick={() => choose(option.key)}
                  >
                    <span className="dp-choice-key">{option.key}</span><span>{option.text}</span><kbd>{option.key}</kbd>
                  </button>
                );
              })}
            </fieldset>
            <div className="dp-quiz-actions">
              {!revealed ? (
                <GButton variant="primary" disabled={!picked} onClick={() => setRevealed(true)}>Check answer</GButton>
              ) : (
                <GButton variant="primary" onClick={resetQuestion}>Try again</GButton>
              )}
              <GhostButton onClick={() => showState("B")}>Preview correct</GhostButton>
              <GhostButton onClick={() => showState("A")}>Preview incorrect</GhostButton>
            </div>
            {revealed ? (
              <QuizFeedback
                question={PREVIEW_QUESTION}
                pickedKey={picked}
                onRepairCard={() => report("Repair card staged for review.")}
                onAddReview={() => report("Question added to the review queue.")}
                onMarkExplanationWrong={() => report("Explanation issue recorded.")}
                onMarkAnswerWrong={() => report("Answer mapping flagged for review.")}
                onEditMapping={() => report("Mapping editor would open here.")}
              />
            ) : (
              <div className="dp-feedback-placeholder">Choose an answer to reveal clean, source-aware feedback.</div>
            )}
          </GlassCard>
        </section>

        {actionMessage && <div className="dp-action-message" role="status">{actionMessage}</div>}

        <section className="dp-states" aria-labelledby="states-title">
          <div className="dp-section-heading dp-section-heading--full">
            <div><span className="dp-eyebrow">System states</span><h2 id="states-title">Nothing important is left visually undefined.</h2></div>
          </div>
          <GlassCard className="dp-state-card">
            <div className="dp-state-title"><LoaderCircle className="spin" size={17} /><b>Loading</b></div>
            <div className="dp-skeleton"><span /><span /><span /></div>
            <small>Extracting text and preserving page boundaries…</small>
          </GlassCard>
          <GlassCard className="dp-state-card">
            <EmptyState icon={<BookOpenCheck size={18} />} title="No saved blocks yet" hint="Build one once; rerun it in a single click." />
          </GlassCard>
          <GlassCard className="dp-state-card dp-state-error">
            <div className="dp-state-title"><AlertTriangle size={17} /><b>Import failed safely</b></div>
            <p>The file stayed untouched. Try another export or keep it as a source document.</p>
            <GhostButton>View details</GhostButton>
          </GlassCard>
          <GlassCard className="dp-state-card dp-state-review">
            <div className="dp-state-title"><FileQuestion size={17} /><b>Needs mapping review</b><Tag tone="orange">low confidence</Tag></div>
            <p>Answer key says A while the explanation names B. AXOM will not guess.</p>
            <GButton size="sm">Review mapping</GButton>
          </GlassCard>
        </section>

        <footer className="dp-footer">Development artifact · representative local data only · no workspace data is read or changed.</footer>
      </div>
    </main>
  );
}

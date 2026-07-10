// ===========================================================================
// Question Bank — the flagship study engine. Import Center → Source Library →
// Question Sets → Block Builder → Results, in one tabbed surface. Uploaded
// files become reusable question ecosystems: parse → review → save → block →
// results → weakness intelligence.
// ===========================================================================
import { useMemo, useState } from "react";
import { HelpCircle, ListFilter, Microscope, Play, Timer } from "lucide-react";
import { useStore } from "../lib/store";
import {
  analyzeQuestionStyle, dueQuestions, errorPatterns, weakTopics,
  ERROR_TYPE_LABEL,
  type QuestionRecord,
} from "../lib/questions";
import type { QuizBlock, QuizFilters, QuizMode } from "../lib/quiz";
import type { QuestionSet, SourceDocument } from "../lib/library";
import { GlassCard, PanelHeader, EmptyState, GButton } from "../components/ui/primitives";
import { StatCard } from "../components/ui/StatCard";
import { ImportPanel, type ImportSeed } from "../components/questions/ImportPanel";
import { MassImport } from "../components/questions/MassImport";
import { ExamRunner } from "../components/questions/ExamRunner";
import { PerformancePanel } from "../components/questions/PerformancePanel";
import { QuestionDetailModal } from "../components/questions/QuestionDetailModal";
import { SourceLibrary, QuestionSetList } from "../components/questions/LibraryPanels";
import { BlockBuilder } from "../components/questions/BlockBuilder";
import { BankBrowser } from "../components/questions/BankBrowser";

const NO_QUESTIONS: QuestionRecord[] = [];

type BankTab = "import" | "mass" | "sets" | "library" | "blocks" | "bank" | "insights";

interface RunnerLaunch {
  mode: QuizMode;
  retakeIds?: string[];
  presetFilters?: Partial<QuizFilters>;
  blockId?: string;
}

export function QuestionWorkspacePage() {
  const s = useStore();
  const questions = s.questions ?? NO_QUESTIONS;
  const [tab, setTab] = useState<BankTab>("import");
  const [open, setOpen] = useState<QuestionRecord | null>(null);
  const [showStyle, setShowStyle] = useState(false);
  const [runner, setRunner] = useState<RunnerLaunch | null>(null);
  const [importSeed, setImportSeed] = useState<ImportSeed | null>(null);

  const due = useMemo(() => dueQuestions(questions), [questions]);
  const incorrect = questions.filter((q) => q.status === "incorrect");
  const weak = useMemo(() => weakTopics(questions, 5), [questions]);
  const patterns = useMemo(() => errorPatterns(questions).slice(0, 5), [questions]);
  const style = useMemo(() => (showStyle ? analyzeQuestionStyle(questions) : null), [showStyle, questions]);
  const runnable = questions.filter((q) => q.options.length >= 2).length;

  function runSet(set: QuestionSet) {
    setRunner({ mode: "tutor", presetFilters: { setIds: [set.id], count: Math.min(set.questionIds.length, 20) } });
  }
  function runBlock(block: QuizBlock) {
    s.saveQuizBlock({ ...block, lastRunAt: new Date().toISOString() });
    setRunner({ mode: block.mode, presetFilters: block.filters, blockId: block.id });
  }
  function generateFrom(doc: SourceDocument) {
    setImportSeed({ reference: { title: doc.title, text: doc.rawText } });
    setTab("import");
  }

  const TABS: Array<[BankTab, string]> = [
    ["import", "Import Center"],
    ["mass", "Mass Import"],
    ["sets", `Question Sets (${(s.questionSets ?? []).length})`],
    ["library", `Source Library (${(s.documents ?? []).length})`],
    ["blocks", `Block Builder (${(s.quizBlocks ?? []).length})`],
    ["bank", `Bank (${questions.length})`],
    ["insights", "Insights"],
  ];

  return (
    <>
      <div className="grid grid-stats">
        <StatCard icon={<HelpCircle size={17} />} title="Question bank" value={String(questions.length)} note={`${runnable} runnable in blocks`} />
        <StatCard icon={<ListFilter size={17} />} title="Due for review" value={String(due.length)} note="misses resurface automatically" />
        <StatCard icon={<Microscope size={17} />} title="Incorrect" value={String(incorrect.length)} note="each one is a future asset" />
        <StatCard icon={<Microscope size={17} />} title="Weak topics" value={String(weak.length)} note={weak[0] ? `worst: ${weak[0].topic}` : "none identified yet"} />
      </div>

      <GlassCard>
        <PanelHeader
          title="Run a block"
          sub="Tutor gives feedback after every question; Exam holds explanations until the end and can be timed."
          action={
            <div className="row">
              <GButton size="sm" variant="primary" disabled={!runnable} onClick={() => setRunner({ mode: "tutor" })}>
                <Play size={14} /> Tutor block
              </GButton>
              <GButton size="sm" disabled={!runnable} onClick={() => setRunner({ mode: "exam" })}>
                <Timer size={14} /> Exam block
              </GButton>
            </div>
          }
        />
        {runnable > 0 && (due.length > 0 || incorrect.length > 0 || weak.length > 0) && (
          <div className="row" style={{ flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            <span className="sub">Today's study:</span>
            {due.length > 0 && (
              <button className="filter-pill" onClick={() => setRunner({ mode: "tutor", presetFilters: { status: "all", count: Math.min(due.length, 20) }, retakeIds: due.slice(0, 20).map((q) => q.id) })}>
                Review {Math.min(due.length, 20)} due
              </button>
            )}
            {incorrect.length > 0 && (
              <button className="filter-pill" onClick={() => setRunner({ mode: "tutor", retakeIds: incorrect.slice(0, 20).map((q) => q.id) })}>
                Retry {Math.min(incorrect.length, 20)} missed
              </button>
            )}
            {weak[0] && (
              <button className="filter-pill" onClick={() => setRunner({ mode: "tutor", presetFilters: { status: "all", count: 15, categories: weak[0].topic ? [weak[0].topic] : undefined } })}>
                Weak topic: {weak[0].topic}
              </button>
            )}
          </div>
        )}
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          {TABS.map(([id, label]) => (
            <button key={id} className={`filter-pill ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
      </GlassCard>

      {tab === "import" && <ImportPanel key={importSeed?.reference?.title ?? importSeed?.fileName ?? "plain"} seed={importSeed} />}
      {tab === "mass" && (
        <MassImport onInspect={(payload) => {
          setImportSeed({ drafts: payload.drafts, rawText: payload.rawText, fileName: payload.fileName, title: payload.title });
          setTab("import");
        }} />
      )}
      {tab === "sets" && <QuestionSetList onRunSet={runSet} />}
      {tab === "library" && <SourceLibrary onGenerateFrom={generateFrom} />}
      {tab === "blocks" && <BlockBuilder onRunBlock={runBlock} onNewBlock={() => setRunner({ mode: "tutor" })} />}

      {tab === "bank" && <BankBrowser onOpen={setOpen} />}

      {tab === "insights" && (
        <>
          <div className="grid grid-2">
            <PerformancePanel onRetakeMissed={(ids) => setRunner({ mode: "tutor", retakeIds: ids })} />
            <GlassCard>
              <PanelHeader title="Error patterns" sub="Why you miss, not just how often — the taxonomy surfaces repeat behavior." />
              {patterns.length === 0 ? (
                <EmptyState title="No classified errors yet" hint="When you miss a question, pick an error type — patterns appear after a few." />
              ) : (
                <div className="stack gap6">
                  {patterns.map((p) => (
                    <div key={p.errorType} className="row">
                      <span className="grow">{ERROR_TYPE_LABEL[p.errorType]}</span>
                      <span className="dim">{p.count}× · {Math.round(p.share * 100)}%</span>
                    </div>
                  ))}
                  {weak.length > 0 && (
                    <div className="sub" style={{ marginTop: 6 }}>
                      Weakest topics: {weak.map((w) => `${w.topic} (${Math.round(w.missRate * 100)}% missed)`).join(" · ")}
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </div>
          <GlassCard>
            <PanelHeader
              title="Faculty style analyzer"
              sub="Broad structural patterns of this question set — hedged observations, never claims about intent."
              action={<button className="filter-pill" onClick={() => setShowStyle((v) => !v)}>{showStyle ? "Hide" : "Analyze"}</button>}
            />
            {!showStyle && <div className="sub">Runs locally over your saved questions.</div>}
            {style && (
              <div className="stack gap6">
                <div className="sub">Sample: {style.sampleSize} questions{style.reliable ? "" : " (small — treat as hints)"}</div>
                {style.findings.map((f, i) => (
                  <div key={i} className="stack" style={{ gap: 2 }}>
                    <b style={{ fontSize: 13 }}>{f.observation}</b>
                    <span className="sub">{f.detail}</span>
                  </div>
                ))}
                <div className="sub">{style.suggestion}</div>
              </div>
            )}
          </GlassCard>
        </>
      )}

      {open && <QuestionDetailModal question={open} onClose={() => setOpen(null)} />}
      {runner && (
        <ExamRunner
          mode={runner.mode}
          retakeIds={runner.retakeIds}
          presetFilters={runner.presetFilters}
          onClose={() => setRunner(null)}
        />
      )}
    </>
  );
}

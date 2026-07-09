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
  analyzeQuestionStyle, dueQuestions, errorPatterns, filterForMode, weakTopics,
  ERROR_TYPE_LABEL, MODE_META,
  type QuestionMode, type QuestionRecord,
} from "../lib/questions";
import type { QuizBlock, QuizFilters, QuizMode } from "../lib/quiz";
import type { QuestionSet, SourceDocument } from "../lib/library";
import { GlassCard, PanelHeader, Tag, EmptyState, GButton } from "../components/ui/primitives";
import { StatCard } from "../components/ui/StatCard";
import { ImportPanel } from "../components/questions/ImportPanel";
import { ExamRunner } from "../components/questions/ExamRunner";
import { PerformancePanel } from "../components/questions/PerformancePanel";
import { QuestionDetailModal } from "../components/questions/QuestionDetailModal";
import { SourceLibrary, QuestionSetList } from "../components/questions/LibraryPanels";
import { BlockBuilder } from "../components/questions/BlockBuilder";

const MODES = Object.keys(MODE_META) as QuestionMode[];
const NO_QUESTIONS: QuestionRecord[] = [];

type BankTab = "import" | "sets" | "library" | "blocks" | "bank" | "insights";

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
  const [mode, setMode] = useState<QuestionMode | "all">("all");
  const [open, setOpen] = useState<QuestionRecord | null>(null);
  const [showStyle, setShowStyle] = useState(false);
  const [runner, setRunner] = useState<RunnerLaunch | null>(null);
  const [seedReference, setSeedReference] = useState<{ title: string; text: string } | null>(null);

  const due = useMemo(() => dueQuestions(questions), [questions]);
  const incorrect = questions.filter((q) => q.status === "incorrect");
  const filtered = mode === "all" ? questions : filterForMode(questions, mode);
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
    setSeedReference({ title: doc.title, text: doc.rawText });
    setTab("import");
  }

  const TABS: Array<[BankTab, string]> = [
    ["import", "Import Center"],
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
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          {TABS.map(([id, label]) => (
            <button key={id} className={`filter-pill ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
      </GlassCard>

      {tab === "import" && <ImportPanel key={seedReference?.title ?? "plain"} seedReference={seedReference} />}
      {tab === "sets" && <QuestionSetList onRunSet={runSet} />}
      {tab === "library" && <SourceLibrary onGenerateFrom={generateFrom} />}
      {tab === "blocks" && <BlockBuilder onRunBlock={runBlock} onNewBlock={() => setRunner({ mode: "tutor" })} />}

      {tab === "bank" && (
        <GlassCard>
          <PanelHeader title="Browse the bank" sub="Modes filter by what each attempt recorded — status, guesses, answer changes, repeat misses." />
          <div className="row" style={{ flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            <button className={`filter-pill ${mode === "all" ? "on" : ""}`} onClick={() => setMode("all")}>
              All ({questions.length})
            </button>
            {MODES.map((m) => {
              const meta = MODE_META[m];
              const count = filterForMode(questions, m).length;
              return (
                <button
                  key={m}
                  className={`filter-pill ${mode === m ? "on" : ""}`}
                  disabled={!meta.ready}
                  title={meta.note}
                  onClick={() => meta.ready && setMode(m)}
                >
                  {meta.label}{meta.ready ? ` (${count})` : " · soon"}
                </button>
              );
            })}
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              title={questions.length === 0 ? "No questions yet" : "Nothing in this mode right now"}
              hint={questions.length === 0
                ? "Import your first questions in the Import Center — misses become review items and repair cards."
                : "That's not a failure state. Pick another mode or import more questions."}
            />
          ) : (
            <div className="stack gap6">
              {filtered.slice(0, 50).map((q) => (
                <button key={q.id} className="question-row" onClick={() => setOpen(q)}>
                  <span className="grow truncate">{q.stem}</span>
                  {q.marked && <Tag tone="purple">marked</Tag>}
                  {q.bank && <Tag tone="neutral">{q.bank}</Tag>}
                  {!q.bank && (q.category || q.topic) && <Tag tone="neutral">{q.category ?? q.topic}</Tag>}
                  <Tag tone={q.status === "correct" ? "green" : q.status === "incorrect" ? "red" : q.status === "unseen" ? "cyan" : "orange"}>
                    {q.status}
                  </Tag>
                </button>
              ))}
              {filtered.length > 50 && <div className="sub">Showing 50 of {filtered.length}.</div>}
            </div>
          )}
        </GlassCard>
      )}

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

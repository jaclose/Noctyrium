// ===========================================================================
// Question Workspace (directive Phase 4) — a central product pillar. Intake
// (paste/upload → review → save), study/review modes over typed records, the
// error-pattern insights, and the faculty style analyzer. The page stays slim;
// the flows live in components/questions/*.
// ===========================================================================
import { useMemo, useState } from "react";
import { HelpCircle, ListFilter, Microscope } from "lucide-react";
import { useStore } from "../lib/store";
import {
  analyzeQuestionStyle, dueQuestions, errorPatterns, filterForMode, weakTopics,
  ERROR_TYPE_LABEL, MODE_META,
  type QuestionMode, type QuestionRecord,
} from "../lib/questions";
import { GlassCard, PanelHeader, Tag, EmptyState } from "../components/ui/primitives";
import { StatCard } from "../components/ui/StatCard";
import { QuestionIntake } from "../components/questions/QuestionIntake";
import { QuestionDetailModal } from "../components/questions/QuestionDetailModal";

const MODES = Object.keys(MODE_META) as QuestionMode[];

export function QuestionWorkspacePage() {
  const questions = useStore((s) => s.questions ?? []);
  const [mode, setMode] = useState<QuestionMode | "all">("all");
  const [open, setOpen] = useState<QuestionRecord | null>(null);
  const [showStyle, setShowStyle] = useState(false);

  const due = useMemo(() => dueQuestions(questions), [questions]);
  const incorrect = questions.filter((q) => q.status === "incorrect");
  const filtered = mode === "all" ? questions : filterForMode(questions, mode);
  const weak = useMemo(() => weakTopics(questions, 5), [questions]);
  const patterns = useMemo(() => errorPatterns(questions).slice(0, 5), [questions]);
  const style = useMemo(() => (showStyle ? analyzeQuestionStyle(questions) : null), [showStyle, questions]);

  return (
    <>
      <div className="grid grid-stats">
        <StatCard icon={<HelpCircle size={17} />} title="Questions" value={String(questions.length)} note="in your workspace" />
        <StatCard icon={<ListFilter size={17} />} title="Due for review" value={String(due.length)} note="misses resurface automatically" />
        <StatCard icon={<Microscope size={17} />} title="Incorrect" value={String(incorrect.length)} note="each one is a future asset" />
        <StatCard icon={<Microscope size={17} />} title="Weak topics" value={String(weak.length)} note={weak[0] ? `worst: ${weak[0].topic}` : "none identified yet"} />
      </div>

      <QuestionIntake />

      <GlassCard>
        <PanelHeader title="Work the questions" sub="Modes filter by what each attempt recorded — status, guesses, answer changes, repeat misses." />
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
              ? "Paste your first practice question above — misses become review items and repair cards."
              : "That's not a failure state. Pick another mode or add new questions."}
          />
        ) : (
          <div className="stack gap6">
            {filtered.slice(0, 50).map((q) => (
              <button key={q.id} className="question-row" onClick={() => setOpen(q)}>
                <span className="grow truncate">{q.stem}</span>
                {q.topic && <Tag tone="neutral">{q.topic}</Tag>}
                <Tag tone={q.status === "correct" ? "green" : q.status === "incorrect" ? "red" : q.status === "unseen" ? "cyan" : "orange"}>
                  {q.status}
                </Tag>
              </button>
            ))}
            {filtered.length > 50 && <div className="sub">Showing 50 of {filtered.length}.</div>}
          </div>
        )}
      </GlassCard>

      <div className="grid grid-2">
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
      </div>

      {open && <QuestionDetailModal question={open} onClose={() => setOpen(null)} />}
    </>
  );
}

// ===========================================================================
// Question Bank — the flagship study engine. Import Center → Source Library →
// Question Sets → Block Builder → Results, in one tabbed surface. Uploaded
// files become reusable question ecosystems: parse → review → save → block →
// results → weakness intelligence.
// ===========================================================================
import { useMemo, useState } from "react";
import {
  BarChart3, BookOpen, Boxes, FileInput, Files, HelpCircle, ListFilter,
  Microscope, Play, RotateCcw, Sparkles,
} from "lucide-react";
import { useStore } from "../lib/store";
import {
  analyzeQuestionStyle, dueQuestions, errorPatterns, weakTopics,
  ERROR_TYPE_LABEL,
  type QuestionRecord,
} from "../lib/questions";
import type { QuizBlock, QuizFilters, QuizMode } from "../lib/quiz";
import type { QuestionSet, SourceDocument } from "../lib/library";
import { GlassCard, PanelHeader, EmptyState } from "../components/ui/primitives";
import { ImportPanel, type ImportSeed } from "../components/questions/ImportPanel";
import { MassImport } from "../components/questions/MassImport";
import { ExamRunner } from "../components/questions/ExamRunner";
import { PerformancePanel } from "../components/questions/PerformancePanel";
import { QuestionDetailModal } from "../components/questions/QuestionDetailModal";
import { SourceLibrary, QuestionSetList } from "../components/questions/LibraryPanels";
import { BlockBuilder } from "../components/questions/BlockBuilder";
import { BankBrowser } from "../components/questions/BankBrowser";
import { AxomBrandLockup } from "../components/ui/BrandMark";
import { coachWeakness, resolveActiveProvider } from "../lib/ai";
import { pushToast } from "../lib/toast";

const NO_QUESTIONS: QuestionRecord[] = [];

type BankTab = "overview" | "import" | "mass" | "sets" | "library" | "blocks" | "bank" | "insights";

interface RunnerLaunch {
  mode: QuizMode;
  retakeIds?: string[];
  presetFilters?: Partial<QuizFilters>;
  presetTimed?: boolean;
  blockId?: string;
}

export function QuestionWorkspacePage() {
  const s = useStore();
  const questions = s.questions ?? NO_QUESTIONS;
  const [tab, setTab] = useState<BankTab>("overview");
  const [open, setOpen] = useState<QuestionRecord | null>(null);
  const [showStyle, setShowStyle] = useState(false);
  const [runner, setRunner] = useState<RunnerLaunch | null>(null);
  const [importSeed, setImportSeed] = useState<ImportSeed | null>(null);
  const [coach, setCoach] = useState<{ diagnosis: string; suggestedBlock: string } | null>(null);
  const [coachBusy, setCoachBusy] = useState(false);
  const provider = useMemo(() => resolveActiveProvider(), []);

  const due = useMemo(() => dueQuestions(questions), [questions]);
  const incorrect = questions.filter((q) => q.status === "incorrect");
  const weak = useMemo(() => weakTopics(questions, 5), [questions]);
  const patterns = useMemo(() => errorPatterns(questions).slice(0, 5), [questions]);
  const style = useMemo(() => (showStyle ? analyzeQuestionStyle(questions) : null), [showStyle, questions]);
  const runnable = questions.filter((q) => q.options.length >= 2).length;
  const unseen = questions.filter((q) => q.attempts.length === 0).length;
  const needsMapping = questions.filter((q) => q.needsReview || !q.correctKey).length;
  const allAttempts = questions.flatMap((q) => q.attempts);
  const correctAttempts = allAttempts.filter((attempt) => attempt.status === "correct").length;
  const accuracy = allAttempts.length ? Math.round((correctAttempts / allAttempts.length) * 100) : null;
  const lastSession = [...(s.quizSessions ?? [])].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const highConfidenceMisses = questions.filter((q) =>
    q.status === "incorrect" && (q.confidence ?? 0) >= 4).length;
  const recentImprovement = useMemo(() => {
    const attempts = questions.flatMap((question) => question.attempts)
      .filter((attempt) => attempt.status === "correct" || attempt.status === "incorrect")
      .sort((a, b) => a.at.localeCompare(b.at));
    if (attempts.length < 4) return undefined;
    const size = Math.min(10, Math.floor(attempts.length / 2));
    const recent = attempts.slice(-size);
    const previous = attempts.slice(-size * 2, -size);
    const pct = (items: typeof attempts) => Math.round((items.filter((attempt) => attempt.status === "correct").length / items.length) * 100);
    return pct(recent) - pct(previous);
  }, [questions]);
  const slowest = useMemo(() => {
    const byCategory = new Map<string, { seconds: number; count: number }>();
    for (const question of questions) {
      const category = question.category ?? question.system;
      if (!category) continue;
      for (const attempt of question.attempts) {
        if (!attempt.timeSpentSeconds) continue;
        const value = byCategory.get(category) ?? { seconds: 0, count: 0 };
        value.seconds += attempt.timeSpentSeconds;
        value.count += 1;
        byCategory.set(category, value);
      }
    }
    return [...byCategory.entries()]
      .map(([category, value]) => ({ category, seconds: Math.round(value.seconds / value.count) }))
      .sort((a, b) => b.seconds - a.seconds)[0];
  }, [questions]);

  function runSet(set: QuestionSet) {
    setRunner({ mode: "tutor", presetFilters: { setIds: [set.id], count: Math.min(set.questionIds.length, 20) } });
  }
  function runBlock(block: QuizBlock) {
    setRunner({ mode: block.mode, presetFilters: block.filters, presetTimed: block.timed, blockId: block.id });
  }
  function generateFrom(doc: SourceDocument) {
    setImportSeed({ reference: { title: doc.title, text: doc.rawText } });
    setTab("import");
  }

  async function runWeaknessCoach() {
    if (!provider || !incorrect.length) return;
    setCoachBusy(true);
    try {
      setCoach(await coachWeakness(provider, {
        missed: incorrect.map((question) => ({
          stem: question.stem,
          category: question.category ?? question.system,
          errorType: question.errorType,
        })),
      }));
    } catch (error) {
      pushToast({ title: "Weakness coach failed", body: error instanceof Error ? error.message : "Unknown error.", tone: "warn" });
    } finally {
      setCoachBusy(false);
    }
  }

  const TABS: Array<[BankTab, string]> = [
    ["overview", "Command Center"],
    ["import", "Import Center"],
    ["mass", "Mass Import"],
    ["sets", `Question Sets (${(s.questionSets ?? []).length})`],
    ["library", `Source Library (${(s.documents ?? []).length})`],
    ["blocks", `Block Builder (${(s.quizBlocks ?? []).length})`],
    ["bank", `Bank (${questions.length})`],
    ["insights", "Insights"],
  ];

  const stats: Array<{ label: string; value: number | string; note: string; icon: typeof HelpCircle }> = [
    { label: "Total questions", value: questions.length, note: `${runnable} runnable`, icon: HelpCircle },
    { label: "Due review", value: due.length, note: "auto-resurfaced", icon: ListFilter },
    { label: "Unseen", value: unseen, note: "ready to study", icon: BookOpen },
    { label: "Accuracy", value: accuracy === null ? "—" : `${accuracy}%`, note: `${allAttempts.length} attempts`, icon: BarChart3 },
    { label: "Active sets", value: (s.questionSets ?? []).length, note: `${(s.documents ?? []).length} sources`, icon: Files },
    { label: "Needs mapping", value: needsMapping, note: "review before trust", icon: Microscope },
  ];

  return (
    <>
      {/* ---- Marble hero: identity, one-line intent, framed primary actions ---- */}
      <div className="qb-hero tx-marble">
        <div className="qb-hero-inner">
          <div className="qb-hero-head">
            <div className="stack" style={{ gap: 6, minWidth: 0 }}>
              <AxomBrandLockup layout="horizontal" size="sm" subtitle="Question Bank" markFramed />
              <h2 className="qb-title">Turn messy files into clean test blocks.</h2>
              <p className="qb-lede">Import, map, review uncertainty, practise, repair — then let the next useful action surface itself.</p>
            </div>
            <div className="qb-hero-actions">
              <button className="qb-cta" onClick={() => setTab("import")}>
                <FileInput size={15} /> Quick import
              </button>
              <button className="qb-cta ghost" onClick={() => setTab("mass")}>
                <Files size={15} /> Mass import
              </button>
              <button className="qb-cta ghost" onClick={() => setTab("blocks")}>
                <Boxes size={15} /> Build block
              </button>
              <button className="qb-cta ghost" disabled={!lastSession && !runnable} onClick={() => {
                if (lastSession) setRunner({ mode: lastSession.mode, presetFilters: lastSession.filters, presetTimed: lastSession.timed });
                else setRunner({ mode: "tutor" });
              }}>
                <Play size={15} /> Continue last block
              </button>
            </div>
          </div>

          <div className="qb-stats">
            {stats.map((st) => (
              <div key={st.label} className="qb-stat">
                <span className="qb-stat-icon"><st.icon size={15} /></span>
                <span className="qb-stat-value">{st.value}</span>
                <span className="qb-stat-label">{st.label}</span>
                <span className="qb-stat-note">{st.note}</span>
              </div>
            ))}
          </div>

          {runnable > 0 && (due.length > 0 || incorrect.length > 0 || weak.length > 0) && (
            <div className="qb-quick">
              <span className="qb-quick-label">Today</span>
              {due.length > 0 && (
                <button className="qb-chip" onClick={() => setRunner({ mode: "tutor", presetFilters: { status: "all", count: Math.min(due.length, 20) }, retakeIds: due.slice(0, 20).map((q) => q.id) })}>
                  Review {Math.min(due.length, 20)} due
                </button>
              )}
              {incorrect.length > 0 && (
                <button className="qb-chip" onClick={() => setRunner({ mode: "tutor", retakeIds: incorrect.slice(0, 20).map((q) => q.id) })}>
                  Retry {Math.min(incorrect.length, 20)} missed
                </button>
              )}
              {weak[0] && (
                <button className="qb-chip" onClick={() => setRunner({ mode: "tutor", presetFilters: { status: "all", count: 15, categories: weak[0].topic ? [weak[0].topic] : undefined } })}>
                  Weak: {weak[0].topic}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---- Premium segmented navigation ---- */}
      <div className="qb-segment" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={`qb-seg ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="qb-command-grid">
            <div className="qb-next-card glass-liquid">
              <div className="qb-next-copy">
                <span className="qb-eyebrow">Recommended next</span>
                <h3>{due.length ? `Review ${Math.min(due.length, 20)} due questions` : incorrect.length ? `Retry ${Math.min(incorrect.length, 20)} misses` : unseen ? "Start an unseen tutor block" : "Import your first clean set"}</h3>
                <p>{due.length
                  ? "These questions are scheduled to resurface now. A short tutor block keeps the review loop moving."
                  : incorrect.length
                    ? "Turn recent misses into a focused block, classify the error, and repair the pattern."
                    : unseen
                      ? "You have mapped questions ready to study. Start small and let the performance data build."
                      : "PDF, DOCX, TXT, CSV, JSON, or pasted text all land in the same review-gated pipeline."}</p>
              </div>
              <button className="qb-cta" onClick={() => {
                if (due.length) setRunner({ mode: "tutor", retakeIds: due.slice(0, 20).map((q) => q.id) });
                else if (incorrect.length) setRunner({ mode: "tutor", retakeIds: incorrect.slice(0, 20).map((q) => q.id) });
                else if (unseen) setRunner({ mode: "tutor", presetFilters: { status: "unused", count: Math.min(unseen, 10) } });
                else setTab("import");
              }}><Play size={14} /> Begin</button>
            </div>
            <div className="qb-insight-card">
              <span className="qb-eyebrow">Live insight</span>
              <div className="stack gap12" style={{ marginTop: 12 }}>
                <div><b>{weak[0]?.topic ?? "No weak category yet"}</b><div className="sub">Weakest category</div></div>
                <div><b>{patterns[0] ? ERROR_TYPE_LABEL[patterns[0].errorType] : "Classify a miss to begin"}</b><div className="sub">Repeated error pattern</div></div>
                <div><b>{highConfidenceMisses || "None"}</b><div className="sub">High-confidence misses</div></div>
                <div><b>{slowest ? `${slowest.category} · ${slowest.seconds}s` : "No timing data yet"}</b><div className="sub">Slowest category</div></div>
                <div><b>{recentImprovement === undefined ? "Needs more attempts" : `${recentImprovement >= 0 ? "+" : ""}${recentImprovement} points`}</b><div className="sub">Recent improvement</div></div>
                {provider && incorrect.length > 0 && (
                  <button className="qb-chip" disabled={coachBusy} onClick={() => void runWeaknessCoach()}>
                    <Sparkles size={12} /> {coachBusy ? "Analyzing misses…" : "Ask weakness coach"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {coach && (
            <GlassCard className="qb-ai-coach">
              <PanelHeader title="AI weakness coach" sub={`${provider?.info.label} · grounded in your saved misses; suggestion only`} />
              <p>{coach.diagnosis}</p>
              <div className="question-explanation"><b>Suggested next block:</b> {coach.suggestedBlock}</div>
            </GlassCard>
          )}

          <div className="qb-loop-grid" aria-label="Today's AXOM study loop">
            <button className="qb-loop-card" disabled={!due.length} onClick={() => setRunner({ mode: "tutor", retakeIds: due.slice(0, 20).map((q) => q.id) })}>
              <ListFilter size={17} /><b>Review due</b><span>{due.length ? `${due.length} ready now` : "Nothing due"}</span>
            </button>
            <button className="qb-loop-card" disabled={!incorrect.length} onClick={() => setRunner({ mode: "tutor", retakeIds: incorrect.slice(0, 20).map((q) => q.id) })}>
              <RotateCcw size={17} /><b>Retry incorrects</b><span>{incorrect.length ? `${incorrect.length} misses to repair` : "No current misses"}</span>
            </button>
            <button className="qb-loop-card" disabled={!weak[0]} onClick={() => weak[0] && setRunner({ mode: "tutor", presetFilters: { status: "all", count: 15, categories: [weak[0].topic] } })}>
              <Microscope size={17} /><b>Weak-topic block</b><span>{weak[0]?.topic ?? "Needs more attempts"}</span>
            </button>
            <button className="qb-loop-card" onClick={() => setTab("import")}>
              <FileInput size={17} /><b>Import questions</b><span>Review uncertainty, not every line</span>
            </button>
          </div>

          <div className="qb-library-strip">
            <button className="qb-library-link" onClick={() => setTab("sets")}><b>Question Sets</b><span>{(s.questionSets ?? []).length} saved</span></button>
            <button className="qb-library-link" onClick={() => setTab("library")}><b>Source Documents</b><span>{(s.documents ?? []).length} available</span></button>
            <button className="qb-library-link" onClick={() => setTab("blocks")}><b>Saved Blocks</b><span>{(s.quizBlocks ?? []).length} reusable</span></button>
            <button className="qb-library-link" onClick={() => setTab("sets")}><b>AI Generated Sets</b><span>{(s.questionSets ?? []).filter((set) => set.aiEnhanced).length} labeled</span></button>
          </div>

          {(s.questionSets ?? []).length > 0 && (
            <QuestionSetList
              onRunSet={runSet}
              onReviewMisses={(ids) => ids.length && setRunner({ mode: "tutor", retakeIds: ids })}
              onOpenInsights={() => setTab("insights")}
            />
          )}
        </>
      )}

      {tab === "import" && <ImportPanel key={importSeed?.reference?.title ?? importSeed?.fileName ?? "plain"} seed={importSeed} />}
      {tab === "mass" && (
        <MassImport onInspect={(payload) => {
          setImportSeed({ drafts: payload.drafts, rawText: payload.rawText, fileName: payload.fileName, title: payload.title });
          setTab("import");
        }} />
      )}
      {tab === "sets" && (
        <QuestionSetList
          onRunSet={runSet}
          onReviewMisses={(ids) => ids.length && setRunner({ mode: "tutor", retakeIds: ids })}
          onOpenInsights={() => setTab("insights")}
        />
      )}
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
          presetTimed={runner.presetTimed}
          blockId={runner.blockId}
          onClose={() => setRunner(null)}
        />
      )}
    </>
  );
}

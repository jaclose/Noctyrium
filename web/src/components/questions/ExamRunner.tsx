// ===========================================================================
// Question block runner (pre-beta §7): Tutor mode (immediate feedback, AI
// actions, repair cards) and Exam mode (deferred feedback, optional timer,
// flagging, end-of-block review). Results persist as QuizSession records and
// every answer is recorded on the question for spaced retry.
// ===========================================================================
import { useEffect, useMemo, useState } from "react";
import { Flag, Play, WandSparkles, Sparkles } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  buildQuizPool, missedQuestionIds, scoreSession,
  type QuizAnswer, type QuizFilters, type QuizMode, type QuizSession,
} from "../../lib/quiz";
import {
  ERROR_TYPE_LABEL, EXAM_TYPE_LABEL, QUESTION_CATEGORIES,
  type QuestionErrorType, type QuestionExamType, type QuestionRecord,
} from "../../lib/questions";
import { newSchedule } from "../../lib/ankiCards";
import { explainSimply, explainWhyWrong, memoryHook, resolveActiveProvider } from "../../lib/ai";
import { Modal, SelectField } from "../ui/Modal";
import { GButton, GhostButton, Tag } from "../ui/primitives";
import { pushToast } from "../../lib/toast";

const ERROR_TYPES = Object.keys(ERROR_TYPE_LABEL) as QuestionErrorType[];
const EXAM_TYPES = Object.keys(EXAM_TYPE_LABEL) as QuestionExamType[];

type Stage = "setup" | "running" | "results";

export function ExamRunner({ mode: initialMode, retakeIds, presetFilters, onClose }: {
  mode: QuizMode;
  /** When set, skips setup and runs exactly these questions (retake missed). */
  retakeIds?: string[];
  /** Pre-fill the setup (run-from-set, saved blocks). */
  presetFilters?: Partial<QuizFilters>;
  onClose: () => void;
}) {
  const s = useStore();
  const questions = s.questions ?? [];
  const questionSets = s.questionSets ?? [];
  const [mode, setMode] = useState<QuizMode>(initialMode);
  const [stage, setStage] = useState<Stage>(retakeIds?.length ? "running" : "setup");

  // --- setup state
  const [count, setCount] = useState(presetFilters?.count ?? 10);
  const [status, setStatus] = useState<QuizFilters["status"]>(presetFilters?.status ?? "all");
  const [category, setCategory] = useState(presetFilters?.categories?.[0] ?? "");
  const [examType, setExamType] = useState<QuestionExamType | "">(presetFilters?.examTypes?.[0] ?? "");
  const [setIds, setSetIds] = useState<string[]>(presetFilters?.setIds ?? []);
  const [ordered, setOrdered] = useState(presetFilters?.ordered ?? false);
  const [timed, setTimed] = useState(false);
  const [minutesPerQ] = useState(1.5);

  // --- run state
  const [pool, setPool] = useState<QuestionRecord[]>(() =>
    retakeIds?.length ? questions.filter((q) => retakeIds.includes(q.id)) : []);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, QuizAnswer>>(new Map());
  const [picked, setPicked] = useState<string | undefined>();
  const [revealed, setRevealed] = useState(false); // tutor mode reveal
  const [errorType, setErrorType] = useState<QuestionErrorType | "">("");
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5 | undefined>();
  const [startedAt, setStartedAt] = useState<string>(() => new Date().toISOString());
  const [shownAt, setShownAt] = useState(() => Date.now());
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [session, setSession] = useState<QuizSession | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const timeLimitSeconds = timed ? Math.round(pool.length * minutesPerQ * 60) : undefined;
  const question = pool[index];
  const provider = useMemo(() => resolveActiveProvider(), []);

  // Timer display tick (display only — limits derive from timestamps).
  useEffect(() => {
    if (stage !== "running" || !timed) return;
    const t = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [stage, timed]);

  const elapsedSeconds = Math.floor((nowTick - Date.parse(startedAt)) / 1000);
  const timeLeft = timeLimitSeconds !== undefined ? Math.max(0, timeLimitSeconds - elapsedSeconds) : undefined;
  useEffect(() => {
    if (stage === "running" && timeLeft === 0 && timed) finishBlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, stage, timed]);

  // Keyboard shortcuts: A–E pick an option, Enter submits / advances, F flags.
  useEffect(() => {
    if (stage !== "running" || !question) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const letter = e.key.toUpperCase();
      if (/^[A-H]$/.test(letter) && question!.options.some((o) => o.key === letter)) {
        if (!(mode === "tutor" && revealed)) setPicked(letter);
        e.preventDefault();
      } else if (e.key === "Enter") {
        if (mode === "tutor") { if (!revealed && picked) submitTutor(); else if (revealed) nextQuestion(); }
        else if (picked) submitExamAndNext();
        e.preventDefault();
      } else if (letter === "F") {
        toggleFlag();
        e.preventDefault();
      } else if (/^[1-5]$/.test(e.key) && mode === "tutor" && revealed) {
        // 1–5 sets confidence once the answer is revealed.
        setConfidence(Number(e.key) as 1 | 2 | 3 | 4 | 5);
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, question?.id, revealed, picked, mode]);

  function currentFilters(): QuizFilters {
    return {
      count,
      status,
      categories: category ? [category] : undefined,
      examTypes: examType ? [examType] : undefined,
      setIds: setIds.length ? setIds : undefined,
      ordered: ordered || undefined,
    };
  }

  function saveAsBlock() {
    const title = prompt("Name this block (it appears in Block Builder):", "");
    if (!title?.trim()) return;
    s.saveQuizBlock({
      id: crypto.randomUUID(),
      title: title.trim(),
      mode,
      timed,
      filters: currentFilters(),
      createdAt: new Date().toISOString(),
    });
    pushToast({ title: "Block saved", body: "Rerun it any time from Block Builder.", tone: "success" });
  }

  function begin() {
    const filters = currentFilters();
    const built = buildQuizPool(questions, filters);
    if (built.length === 0) {
      pushToast({ title: "No questions match", body: "Loosen the filters or import more questions first.", tone: "warn" });
      return;
    }
    setPool(built);
    setStartedAt(new Date().toISOString());
    setShownAt(Date.now());
    setStage("running");
  }

  function recordCurrent(answerKey: string | undefined, flagged: boolean) {
    if (!question) return;
    const correct = question.correctKey ? (answerKey ? answerKey === question.correctKey : false) : undefined;
    const seconds = Math.round((Date.now() - shownAt) / 1000);
    setAnswers((prev) => new Map(prev).set(question.id, { questionId: question.id, answerKey, correct, flagged, seconds }));
  }

  function submitTutor() {
    if (!picked) return;
    recordCurrent(picked, answers.get(question!.id)?.flagged ?? false);
    setRevealed(true);
  }

  function nextQuestion() {
    // Tutor mode saves the attempt (with error type) as the user moves on.
    if (mode === "tutor" && question && revealed) {
      const a = answers.get(question.id);
      s.recordQuestionAttempt(question.id, {
        answerKey: a?.answerKey,
        status: a?.correct === undefined ? "needs-review" : a.correct ? "correct" : "incorrect",
        timeSpentSeconds: a?.seconds,
        confidence,
        errorType: a?.correct === false ? (errorType || undefined) : undefined,
      });
    }
    setPicked(undefined);
    setRevealed(false);
    setErrorType("");
    setConfidence(undefined);
    setAiText(null);
    setShownAt(Date.now());
    if (index + 1 >= pool.length) finishBlock();
    else setIndex(index + 1);
  }

  function submitExamAndNext() {
    recordCurrent(picked, answers.get(question!.id)?.flagged ?? false);
    setPicked(undefined);
    if (index + 1 >= pool.length) finishBlock(picked);
    else { setIndex(index + 1); setShownAt(Date.now()); }
  }

  function finishBlock(lastPick?: string) {
    // Ensure the in-flight answer is captured before scoring.
    const all = new Map(answers);
    if (question && !all.has(question.id) && (lastPick ?? picked)) {
      const key = lastPick ?? picked;
      const correct = question.correctKey ? key === question.correctKey : undefined;
      all.set(question.id, { questionId: question.id, answerKey: key, correct, flagged: false, seconds: Math.round((Date.now() - shownAt) / 1000) });
    }
    const answerList = pool.map((q) => all.get(q.id) ?? ({ questionId: q.id, flagged: false } as QuizAnswer));
    const result: QuizSession = {
      id: crypto.randomUUID(),
      mode,
      startedAt,
      endedAt: new Date().toISOString(),
      timed,
      timeLimitSeconds,
      filters: currentFilters(),
      questionIds: pool.map((q) => q.id),
      answers: answerList,
      score: scoreSession(answerList),
    };
    // Exam mode records attempts at the END so nothing leaks mid-block.
    if (mode === "exam") {
      for (const a of answerList) {
        if (!a.answerKey && !a.flagged) continue;
        s.recordQuestionAttempt(a.questionId, {
          answerKey: a.answerKey,
          status: a.correct === undefined ? "needs-review" : a.correct ? "correct" : "incorrect",
          timeSpentSeconds: a.seconds,
        });
      }
    }
    s.saveQuizSession(result);
    setSession(result);
    setStage("results");
  }

  function toggleFlag() {
    if (!question) return;
    const existing = answers.get(question.id);
    setAnswers((prev) => new Map(prev).set(question.id, {
      questionId: question.id,
      answerKey: existing?.answerKey,
      correct: existing?.correct,
      flagged: !(existing?.flagged ?? false),
      seconds: existing?.seconds,
    }));
    s.updateQuestion(question.id, { marked: !(existing?.flagged ?? false) });
  }

  function makeRepairCard(q: QuestionRecord) {
    const correct = q.options.find((o) => o.key === q.correctKey);
    const result = s.addAnkiCards([{
      type: "error-repair",
      front: `You missed this: ${q.stem.slice(0, 300)}${q.stem.length > 300 ? "…" : ""}`,
      back: [
        correct ? `Correct: ${correct.key}. ${correct.text}` : "Set the correct answer on the question first.",
        q.explanation ?? "",
      ].filter(Boolean).join("\n\n"),
      source: q.citation ?? q.bank ?? "Question bank",
      tags: ["error-repair", ...(q.category ? [q.category] : []), ...(q.topic ? [q.topic] : [])],
      questionId: q.id,
      aiGenerated: false,
      schedule: newSchedule(),
    }]);
    pushToast(result.saved
      ? { title: "Repair card created", body: "Due now in the Anki Lab review queue.", tone: "success" }
      : { title: "Couldn't create card", body: result.errors.join(" "), tone: "warn" });
  }

  async function runAi(kind: "simple" | "why-wrong" | "hook") {
    if (!provider || !question) return;
    setAiBusy(true);
    setAiText(null);
    try {
      const correct = question.options.find((o) => o.key === question.correctKey)?.text;
      const text = kind === "simple"
        ? await explainSimply(provider, { stem: question.stem, correct, explanation: question.explanation })
        : kind === "why-wrong"
          ? await explainWhyWrong(provider, { stem: question.stem, picked: picked ?? "?", correct })
          : await memoryHook(provider, { stem: question.stem, correct });
      setAiText(`${provider.info.local ? "" : ""}${text}`);
    } catch (err) {
      pushToast({ title: "AI request failed", body: err instanceof Error ? err.message : "Unknown error.", tone: "warn" });
    } finally {
      setAiBusy(false);
    }
  }

  // ------------------------------------------------------------------ render

  if (stage === "setup") {
    return (
      <Modal title={mode === "exam" ? "Set up an exam block" : "Set up a tutor block"} onClose={onClose}
        footer={
          <>
            <GhostButton onClick={saveAsBlock}>Save as block</GhostButton>
            <GButton variant="primary" onClick={begin}><Play size={14} /> Start {mode} block</GButton>
          </>
        }>
        <div className="row" style={{ gap: 6 }}>
          {(["tutor", "exam"] as QuizMode[]).map((m) => (
            <button key={m} className={`filter-pill ${mode === m ? "on" : ""}`} onClick={() => setMode(m)}>
              {m === "tutor" ? "Tutor (feedback per question)" : "Exam (feedback at the end)"}
            </button>
          ))}
        </div>
        {questionSets.length > 0 && (
          <div className="stack gap6">
            <span className="field-label">Question sets (none selected = whole bank)</span>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
              {questionSets.map((qset) => (
                <button key={qset.id} className={`filter-pill ${setIds.includes(qset.id) ? "on" : ""}`}
                  onClick={() => setSetIds((prev) => prev.includes(qset.id) ? prev.filter((x) => x !== qset.id) : [...prev, qset.id])}>
                  {qset.title} ({qset.questionIds.length})
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="stack gap6">
          <span className="field-label">How many questions</span>
          <div className="row" style={{ flexWrap: "wrap" }}>
            {[5, 10, 20, 40].map((n) => (
              <button key={n} className={`filter-pill ${count === n ? "on" : ""}`} onClick={() => setCount(n)}>{n}</button>
            ))}
          </div>
        </div>
        <div className="stack gap6">
          <span className="field-label">Pool</span>
          <div className="row" style={{ flexWrap: "wrap" }}>
            {([["all", "All"], ["unused", "Unused only"], ["incorrect", "Incorrect only"], ["marked", "Marked only"]] as Array<[QuizFilters["status"], string]>).map(([v, label]) => (
              <button key={v} className={`filter-pill ${status === v ? "on" : ""}`} onClick={() => setStatus(v)}>{label}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-2">
          <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Any</option>
            {QUESTION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <SelectField label="Exam style" value={examType} onChange={(e) => setExamType(e.target.value as QuestionExamType | "")}>
            <option value="">Any</option>
            {EXAM_TYPES.map((t) => <option key={t} value={t}>{EXAM_TYPE_LABEL[t]}</option>)}
          </SelectField>
        </div>
        <label className="row" style={{ gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={ordered} onChange={() => setOrdered((v) => !v)} />
          <span>Keep document order (instead of shuffling)</span>
        </label>
        {mode === "exam" && (
          <label className="row" style={{ gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={timed} onChange={() => setTimed((v) => !v)} />
            <span>Timed · {minutesPerQ} min per question</span>
          </label>
        )}
      </Modal>
    );
  }

  if (stage === "results" && session) {
    const missed = missedQuestionIds(session);
    const byId = new Map(questions.map((q) => [q.id, q]));
    return (
      <Modal title="Block results" onClose={onClose}
        footer={
          <>
            {missed.length > 0 && (
              <GhostButton onClick={() => {
                setPool(questions.filter((q) => missed.includes(q.id)));
                setAnswers(new Map());
                setIndex(0);
                setSession(null);
                setStartedAt(new Date().toISOString());
                setShownAt(Date.now());
                setStage("running");
              }}>Retake {missed.length} missed</GhostButton>
            )}
            <GButton variant="primary" onClick={onClose}>Done</GButton>
          </>
        }>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <Tag tone={session.score && session.score.pct >= 70 ? "green" : "orange"}>
            {session.score?.correct}/{session.score?.scored} correct ({session.score?.pct}%)
          </Tag>
          <Tag tone="neutral">{session.mode} mode</Tag>
          {session.timed && <Tag tone="neutral">{Math.round((Date.parse(session.endedAt!) - Date.parse(session.startedAt)) / 60000)} min</Tag>}
          {session.score && session.score.total > session.score.scored && (
            <span className="sub">{session.score.total - session.score.scored} unscored (no correct answer set)</span>
          )}
        </div>
        {missed.length > 0 && (
          <div className="stack gap6">
            <span className="field-label">Missed — review and repair</span>
            {missed.map((id) => {
              const q = byId.get(id);
              if (!q) return null;
              const a = session.answers.find((x) => x.questionId === id);
              return (
                <div key={id} className="import-draft">
                  <div className="stack" style={{ gap: 4 }}>
                    <span style={{ fontWeight: 600 }}>{q.stem}</span>
                    <span className="sub">You picked {a?.answerKey ?? "nothing"} · correct {q.correctKey}</span>
                    {q.explanation && <span className="sub">{q.explanation}</span>}
                    <div className="row">
                      <GhostButton onClick={() => makeRepairCard(q)}><WandSparkles size={13} /> Repair card</GhostButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {missed.length === 0 && <div className="sub">Nothing missed in this block. The pool filters decide what comes next.</div>}
      </Modal>
    );
  }

  if (!question) return null;
  const answer = answers.get(question.id);
  const isCorrect = revealed && question.correctKey && picked === question.correctKey;

  return (
    <Modal
      title={`${mode === "exam" ? "Exam" : "Tutor"} · ${index + 1} of ${pool.length}`}
      onClose={() => { if (confirm("Leave this block? Progress in unanswered questions is discarded.")) onClose(); }}
      footer={
        mode === "tutor"
          ? (!revealed
            ? <GButton variant="primary" disabled={!picked} onClick={submitTutor}>Check answer</GButton>
            : <GButton variant="primary" onClick={nextQuestion}>{index + 1 >= pool.length ? "Finish block" : "Next question"}</GButton>)
          : (
            <>
              <GhostButton onClick={() => finishBlock()}>End block</GhostButton>
              <GButton variant="primary" disabled={!picked} onClick={submitExamAndNext}>
                {index + 1 >= pool.length ? "Submit & finish" : "Submit & next"}
              </GButton>
            </>
          )
      }
    >
      <div className="quiz-progress" aria-hidden="true">
        <span className="quiz-progress-fill" style={{ width: `${Math.round(((index + (revealed ? 1 : 0)) / pool.length) * 100)}%` }} />
      </div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {timed && timeLeft !== undefined && (
          <Tag tone={timeLeft < 60 ? "red" : "neutral"}>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")} left</Tag>
        )}
        {question.category && <Tag tone="neutral">{question.category}</Tag>}
        {question.examType && <Tag tone="neutral">{EXAM_TYPE_LABEL[question.examType]}</Tag>}
        {question.sourcePage && <Tag tone="neutral">p.{question.sourcePage}</Tag>}
        {question.bank && <span className="sub truncate" style={{ maxWidth: 200 }}>{question.bank}</span>}
        <GhostButton onClick={toggleFlag} aria-label="Flag question">
          <Flag size={13} style={{ color: answer?.flagged ? "var(--gold)" : undefined }} /> {answer?.flagged ? "Flagged" : "Flag"}
        </GhostButton>
      </div>

      <div className="question-stem">{question.stem}</div>

      <div className="stack gap6">
        {question.options.map((opt) => {
          const isPicked = picked === opt.key;
          const showCorrect = revealed && question.correctKey === opt.key;
          const showWrong = revealed && isPicked && question.correctKey !== opt.key;
          return (
            <button key={opt.key}
              className={`option-row ${isPicked ? "picked" : ""} ${showCorrect ? "correct" : ""} ${showWrong ? "wrong" : ""}`}
              disabled={revealed}
              onClick={() => setPicked(opt.key)}>
              <span className="mono option-key">{opt.key}</span>
              <span>{opt.text}</span>
              <span className="option-hint">{opt.key}</span>
            </button>
          );
        })}
      </div>

      {mode === "tutor" && revealed && (
        <>
          <div className="review-verdict">
            {question.correctKey
              ? <span className={isCorrect ? "grade-green" : "grade-red"}>
                  {isCorrect ? "Correct" : "Incorrect"} — you picked {picked ?? "nothing"}, answer is {question.correctKey}
                </span>
              : <span className="sub">No correct answer is set on this question — recorded as needs-review.</span>}
          </div>
          {question.explanation && (
            <div className="stack gap6">
              <span className="field-label">Explanation</span>
              <div className="question-explanation">{question.explanation}</div>
            </div>
          )}
          {question.choiceRationales && Object.keys(question.choiceRationales).length > 0 && (
            <div className="stack gap6">
              <span className="field-label">Why each choice</span>
              {Object.entries(question.choiceRationales).map(([key, why]) => (
                <div key={key} className={`sub ${key === question.correctKey ? "grade-green" : ""}`}>
                  <b>{key}:</b> {why}
                </div>
              ))}
            </div>
          )}
          {question.sourcePage && (
            <div className="sub">Source: {question.bank ?? "document"} · page {question.sourcePage}</div>
          )}
          {!isCorrect && question.correctKey && (
            <>
              <SelectField label="Why did this go wrong?" value={errorType}
                onChange={(e) => setErrorType(e.target.value as QuestionErrorType | "")}>
                <option value="">Pick an error type (recommended)</option>
                {ERROR_TYPES.map((t) => <option key={t} value={t}>{ERROR_TYPE_LABEL[t]}</option>)}
              </SelectField>
              <div className="stack gap6">
                <span className="field-label">Confidence in this material now (press 1–5)</span>
                <div className="row">
                  {([1, 2, 3, 4, 5] as const).map((n) => (
                    <button key={n} className={`filter-pill ${confidence === n ? "on" : ""}`} onClick={() => setConfidence(n)}>{n}</button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
            {!isCorrect && <GhostButton onClick={() => makeRepairCard(question)}><WandSparkles size={13} /> Repair card</GhostButton>}
            {provider && (
              <>
                <GhostButton disabled={aiBusy} onClick={() => runAi("simple")}><Sparkles size={13} /> Explain simply</GhostButton>
                {!isCorrect && picked && <GhostButton disabled={aiBusy} onClick={() => runAi("why-wrong")}><Sparkles size={13} /> Why was I wrong?</GhostButton>}
                <GhostButton disabled={aiBusy} onClick={() => runAi("hook")}><Sparkles size={13} /> Memory hook</GhostButton>
              </>
            )}
          </div>
          {aiBusy && <div className="sub">Thinking locally…</div>}
          {aiText && (
            <div className="question-explanation">
              <b>{provider?.info.label}:</b> {aiText}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

// ===========================================================================
// Question block runner (pre-beta §7): Tutor mode (immediate feedback, AI
// actions, repair cards) and Exam mode (deferred feedback, optional timer,
// flagging, end-of-block review). Results persist as QuizSession records and
// every answer is recorded on the question for spaced retry.
// ===========================================================================
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, Flag, Play, WandSparkles, Sparkles, Calculator, Minus, Plus, RotateCcw } from "lucide-react";
import { useStore } from "../../lib/store";
import { STORAGE_KEYS } from "../../lib/brand";
import { QuizCalculator } from "./QuizCalculator";
import {
  buildQuizPool, missedQuestionIds, scoreSession,
  type QuizAnswer, type QuizFilters, type QuizMode, type QuizSession,
} from "../../lib/quiz";
import {
  ERROR_TYPE_LABEL, EXAM_TYPE_LABEL, QUESTION_CATEGORIES,
  questionMappingStatus,
  type QuestionErrorType, type QuestionExamType, type QuestionRecord,
} from "../../lib/questions";
import { newSchedule } from "../../lib/ankiCards";
import { explainSimply, explainWhyWrong, memoryHook, resolveActiveProvider } from "../../lib/ai";
import { Modal, SelectField } from "../ui/Modal";
import { GButton, GhostButton, Tag } from "../ui/primitives";
import { pushToast } from "../../lib/toast";
import { QuizFeedback } from "./QuizFeedback";
import { accuracyTone } from "../../lib/library";
import { ICON_SIZE } from "../../lib/iconSize";
import { createTextAnnotationWithIntegrity, removeTextAnnotationById, type QuestionAnnotationTarget, type QuestionAnnotationTone } from "../../lib/questionAnnotations";
import { AnnotatedQuestionText, type QuestionTextSelection } from "./AnnotatedQuestionText";
import { QuestionAnnotationToolbar } from "./QuestionAnnotationToolbar";
import { QuestionNotesPanel } from "./QuestionNotesPanel";

const ERROR_TYPES = Object.keys(ERROR_TYPE_LABEL) as QuestionErrorType[];
const EXAM_TYPES = Object.keys(EXAM_TYPE_LABEL) as QuestionExamType[];

type Stage = "setup" | "running" | "results";

function trustedCorrectKey(question: QuestionRecord): string | undefined {
  return questionMappingStatus(question) === "ready" ? question.correctKey : undefined;
}

// Device-only reading preference for the quiz player (Q2a). A UI preference,
// never workspace content — persisted like theme.
const READING_SCALE_MIN = 0.9;
const READING_SCALE_MAX = 1.4;
function readReadingScale(): number {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEYS.quizReadingScale));
    return Number.isFinite(value) && value >= READING_SCALE_MIN && value <= READING_SCALE_MAX ? value : 1;
  } catch { return 1; }
}

export function ExamRunner({ mode: initialMode, retakeIds, presetFilters, presetTimed = false, blockId, onClose }: {
  mode: QuizMode;
  /** When set, skips setup and runs exactly these questions (retake missed). */
  retakeIds?: string[];
  /** Pre-fill the setup (run-from-set, saved blocks). */
  presetFilters?: Partial<QuizFilters>;
  /** Preserve the timer setting when reopening a saved block/session. */
  presetTimed?: boolean;
  /** Saved block whose last-run timestamp advances only when the run begins. */
  blockId?: string;
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
  const [timed, setTimed] = useState(presetTimed);
  const [runBlockId, setRunBlockId] = useState(blockId);
  const [minutesPerQ] = useState(1.5);

  // --- run state
  const [pool, setPool] = useState<QuestionRecord[]>(() =>
    retakeIds?.length
      ? buildQuizPool(
          questions.filter((question) => retakeIds.includes(question.id)),
          { count: Math.max(1, retakeIds.length), status: "all", ordered: true },
        )
      : []);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, QuizAnswer>>(new Map());
  const [picked, setPicked] = useState<string | undefined>();
  const [revealed, setRevealed] = useState(false); // tutor mode reveal
  const [errorType, setErrorType] = useState<QuestionErrorType | "">("");
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5 | undefined>();
  const [startedAt, setStartedAt] = useState<string>(() => new Date().toISOString());
  const [shownAt, setShownAt] = useState(() => Date.now());
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [annotationTone, setAnnotationTone] = useState<QuestionAnnotationTone>("yellow");
  const [annotationSelection, setAnnotationSelection] = useState<{
    target: QuestionAnnotationTarget;
    range: QuestionTextSelection;
  } | null>(null);
  const [localAnnotations, setLocalAnnotations] = useState(() => pool[index]?.annotations ?? []);
  const localAnnotationsRef = useRef(localAnnotations);
  const [annotationStatus, setAnnotationStatus] = useState<string>();
  const [session, setSession] = useState<QuizSession | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [editingMapping, setEditingMapping] = useState(false);
  const recordedTutorAttempts = useRef(new Set<string>());

  // --- Q2a player toolkit: strikeout (session-transient per question), reading
  // scale (persisted device pref), calculator, and scroll-to-top on advance.
  const [struck, setStruck] = useState<Set<string>>(() => new Set());
  const [calcOpen, setCalcOpen] = useState(false);
  const [readingScale, setReadingScale] = useState(() => readReadingScale());
  const stemRef = useRef<HTMLDivElement>(null);

  function toggleStrike(key: string) {
    setStruck((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }
  function adjustReadingScale(direction: 1 | -1) {
    setReadingScale((value) => {
      const next = Math.min(READING_SCALE_MAX, Math.max(READING_SCALE_MIN, Math.round((value + direction * 0.1) * 10) / 10));
      try { localStorage.setItem(STORAGE_KEYS.quizReadingScale, String(next)); } catch { /* device pref only */ }
      return next;
    });
  }
  function closeCalculator() {
    setCalcOpen(false);
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>('button[aria-label="Calculator"]')?.focus();
    }, 0);
  }

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
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.closest('input, textarea, select, button, a, [contenteditable="true"], [role="button"]')) return;
      const letter = e.key.toUpperCase();
      if (letter === "F") {
        toggleFlag();
        e.preventDefault();
      } else if (/^[A-E]$/.test(letter) && question!.options.some((o) => o.key === letter)) {
        // Shift+letter eliminates/restores a choice; plain letter picks it.
        if (e.shiftKey) toggleStrike(letter);
        else if (!(mode === "tutor" && revealed)) setPicked(letter);
        e.preventDefault();
      } else if (e.key === "Enter") {
        if (mode === "tutor") { if (!revealed && picked) submitTutor(); else if (revealed) nextQuestion(); }
        else if (picked) submitExamAndNext();
        e.preventDefault();
      } else if (/^[1-5]$/.test(e.key) && mode === "tutor" && revealed) {
        // 1–5 sets confidence once the answer is revealed.
        setConfidence(Number(e.key) as 1 | 2 | 3 | 4 | 5);
        e.preventDefault();
      } else if (e.key === "ArrowLeft" && index > 0) {
        goPrevious();
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        if (mode === "tutor" && revealed) nextQuestion();
        else if (mode === "exam" && picked) submitExamAndNext();
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, question?.id, revealed, picked, mode, errorType, confidence]);

  // On advancing to a new question, clear this question's eliminations and reset
  // the reading surface to the top of the stem, moving focus there so assistive
  // tech announces the new question. Instant (no smooth scroll) respects
  // reduced-motion by construction.
  useEffect(() => {
    setStruck(new Set());
    setLocalAnnotations(question?.annotations ?? []);
    localAnnotationsRef.current = question?.annotations ?? [];
    setAnnotationSelection(null);
    setAnnotationStatus(undefined);
    if (stage !== "running") return;
    const stem = stemRef.current;
    const body = stem?.closest<HTMLElement>(".modal-body");
    if (body) body.scrollTop = 0;
    stem?.focus({ preventScroll: true });
  }, [index, stage, question?.id, question?.annotations]);

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
    const id = crypto.randomUUID();
    s.saveQuizBlock({
      id,
      title: title.trim(),
      mode,
      timed,
      filters: currentFilters(),
      createdAt: new Date().toISOString(),
    });
    setRunBlockId(id);
    pushToast({ title: "Block saved", body: "Rerun it any time from Block Builder.", tone: "success" });
  }

  function begin() {
    const filters = currentFilters();
    const built = buildQuizPool(questions, filters);
    if (built.length === 0) {
      pushToast({ title: "No questions match", body: "Loosen the filters or import more questions first.", tone: "warn" });
      return;
    }
    const runStartedAt = new Date().toISOString();
    setPool(built);
    setStartedAt(runStartedAt);
    setShownAt(Date.now());
    if (runBlockId) {
      const savedBlock = (s.quizBlocks ?? []).find((block) => block.id === runBlockId);
      if (savedBlock) s.saveQuizBlock({ ...savedBlock, lastRunAt: runStartedAt });
    }
    setStage("running");
  }

  function recordCurrent(answerKey: string | undefined, flagged: boolean) {
    if (!question) return;
    const correctKey = trustedCorrectKey(question);
    const correct = correctKey ? (answerKey ? answerKey === correctKey : false) : undefined;
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
    if (mode === "tutor" && question && revealed && !recordedTutorAttempts.current.has(question.id)) {
      const a = answers.get(question.id);
      s.recordQuestionAttempt(question.id, {
        answerKey: a?.answerKey,
        status: a?.correct === undefined ? "needs-review" : a.correct ? "correct" : "incorrect",
        timeSpentSeconds: a?.seconds,
        confidence,
        errorType: a?.correct === false ? (errorType || undefined) : undefined,
      });
      recordedTutorAttempts.current.add(question.id);
    }
    setPicked(undefined);
    setRevealed(false);
    setErrorType("");
    setConfidence(undefined);
    setAiText(null);
    setEditingMapping(false);
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

  function goPrevious() {
    if (index <= 0) return;
    const previous = pool[index - 1];
    const saved = answers.get(previous.id);
    setIndex((value) => Math.max(0, value - 1));
    setPicked(saved?.answerKey);
    setRevealed(mode === "tutor" && Boolean(saved?.answerKey));
    setErrorType("");
    setConfidence(undefined);
    setAiText(null);
    setEditingMapping(false);
    setShownAt(Date.now());
  }

  function finishBlock(lastPick?: string) {
    // Ensure the in-flight answer is captured before scoring.
    const all = new Map(answers);
    if (question && !all.has(question.id) && (lastPick ?? picked)) {
      const key = lastPick ?? picked;
      const correctKey = trustedCorrectKey(question);
      const correct = correctKey ? key === correctKey : undefined;
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
    const correctKey = trustedCorrectKey(q);
    const correct = q.options.find((o) => o.key === correctKey);
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
      const correctKey = trustedCorrectKey(question);
      const correct = question.options.find((o) => o.key === correctKey)?.text;
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

  function flagExtractionIssue(kind: "answer" | "explanation") {
    if (!question) return;
    const warning = kind === "answer"
      ? "User marked the mapped answer as wrong."
      : "User marked the extracted explanation as wrong.";
    const previous = question.extraction;
    s.updateQuestion(question.id, {
      needsReview: true,
      status: "needs-review",
      extraction: {
        confidence: "low",
        reviewed: false,
        ...previous,
        answerDetectionConfidence: kind === "answer" ? 0 : previous?.answerDetectionConfidence,
        explanationDetectionConfidence: kind === "explanation" ? 0 : previous?.explanationDetectionConfidence,
        overallImportConfidence: Math.min(previous?.overallImportConfidence ?? 0.35, 0.35),
        warnings: [...new Set([...(previous?.warnings ?? []), warning])],
      },
    });
    pushToast({ title: "Added to mapping review", body: warning, tone: "warn" });
  }

  // ------------------------------------------------------------------ render

  if (stage === "setup") {
    return (
      <Modal title={mode === "exam" ? "Set up an exam block" : "Set up a tutor block"} onClose={onClose}
        footer={
          <>
            <GhostButton onClick={saveAsBlock}>Save as block</GhostButton>
            <GButton variant="primary" onClick={begin}><Play size={ICON_SIZE.body} /> Start {mode} block</GButton>
          </>
        }>
        <div className="row" style={{ gap: 6 }} role="group" aria-label="Block mode">
          {(["tutor", "exam"] as QuizMode[]).map((m) => (
            <button type="button" key={m} className={`filter-pill ${mode === m ? "on" : ""}`}
              aria-pressed={mode === m} onClick={() => setMode(m)}>
              {m === "tutor" ? "Tutor (feedback per question)" : "Exam (feedback at the end)"}
            </button>
          ))}
        </div>
        {questionSets.length > 0 && (
          <div className="stack gap6">
            <span className="field-label">Question sets (none selected = whole bank)</span>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }} role="group" aria-label="Question sets">
              {questionSets.map((qset) => (
                <button type="button" key={qset.id} className={`filter-pill ${setIds.includes(qset.id) ? "on" : ""}`}
                  aria-pressed={setIds.includes(qset.id)}
                  onClick={() => setSetIds((prev) => prev.includes(qset.id) ? prev.filter((x) => x !== qset.id) : [...prev, qset.id])}>
                  {qset.title} ({qset.questionIds.length})
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="stack gap6">
          <span className="field-label">How many questions</span>
          <div className="row" style={{ flexWrap: "wrap" }} role="group" aria-label="Question count">
            {[5, 10, 20, 40].map((n) => (
              <button type="button" key={n} className={`filter-pill ${count === n ? "on" : ""}`}
                aria-pressed={count === n} onClick={() => setCount(n)}>{n}</button>
            ))}
          </div>
        </div>
        <div className="stack gap6">
          <span className="field-label">Pool</span>
          <div className="row" style={{ flexWrap: "wrap" }} role="group" aria-label="Question pool">
            {([["all", "All"], ["unused", "Unused only"], ["incorrect", "Incorrect only"], ["marked", "Marked only"]] as Array<[QuizFilters["status"], string]>).map(([v, label]) => (
              <button type="button" key={v} className={`filter-pill ${status === v ? "on" : ""}`}
                aria-pressed={status === v} onClick={() => setStatus(v)}>{label}</button>
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
    const retakePool = buildQuizPool(
      questions.filter((question) => missed.includes(question.id)),
      { count: Math.max(1, missed.length), status: "all", ordered: true },
    );
    return (
      <Modal title="Block results" onClose={onClose}
        footer={
          <>
            {retakePool.length > 0 && (
              <GhostButton onClick={() => {
                setPool(retakePool);
                setAnswers(new Map());
                setIndex(0);
                setSession(null);
                recordedTutorAttempts.current = new Set();
                setStartedAt(new Date().toISOString());
                setShownAt(Date.now());
                setStage("running");
              }}>Retake {retakePool.length} missed</GhostButton>
            )}
            <GButton variant="primary" onClick={onClose}>Done</GButton>
          </>
        }>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <Tag tone={accuracyTone(session.score?.pct ?? null)}>
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
                    <span className="sub">You picked {a?.answerKey ?? "nothing"} · correct {trustedCorrectKey(q) ?? "unresolved"}</span>
                    {/* Import owns cleanup; display must preserve legitimate user edits. */}
                    {q.explanation && <span className="sub">{q.explanation.trim()}</span>}
                    <div className="row">
                      <GhostButton onClick={() => makeRepairCard(q)}><WandSparkles size={ICON_SIZE.body} /> Repair card</GhostButton>
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
  const correctKey = trustedCorrectKey(question);
  const isCorrect = revealed && correctKey && picked === correctKey;
  const annotations = localAnnotations;
  const stemAnnotations = annotations.filter((annotation) => annotation.target === "stem");
  const explanationAnnotations = annotations.filter((annotation) => annotation.target === "explanation");

  function saveAnnotation() {
    if (!annotationSelection) return;
    const sourceText = annotationSelection.target === "stem" ? question.stem : question.explanation ?? "";
    const now = new Date().toISOString();
    const result = createTextAnnotationWithIntegrity({
      id: `annotation-${crypto.randomUUID()}`,
      target: annotationSelection.target,
      sourceText,
      startOffset: annotationSelection.range.startOffset,
      endOffset: annotationSelection.range.endOffset,
      tone: annotationTone,
      now,
      existingAnnotations: localAnnotationsRef.current,
    });
    if (result.status !== "created") {
      setAnnotationStatus(result.status === "overlap" ? result.reason : undefined);
      return;
    }
    const next = [...localAnnotationsRef.current, result.annotation];
    localAnnotationsRef.current = next;
    setLocalAnnotations(next);
    setPool((current) => current.map((item) => item.id === question.id ? { ...item, annotations: next } : item));
    s.updateQuestion(question.id, { annotations: next });
    setAnnotationSelection(null);
    setAnnotationStatus("Highlight saved.");
    window.getSelection()?.removeAllRanges();
  }

  function clearAnnotations() {
    if (!annotations.length) return;
    localAnnotationsRef.current = [];
    setLocalAnnotations([]);
    setPool((current) => current.map((item) => item.id === question.id ? { ...item, annotations: [] } : item));
    s.updateQuestion(question.id, { annotations: [] });
    setAnnotationSelection(null);
    setAnnotationStatus("Highlights cleared.");
  }

  function deleteAnnotation(annotationId: string) {
    const next = removeTextAnnotationById(localAnnotationsRef.current, annotationId);
    if (next.length === localAnnotationsRef.current.length) return;
    localAnnotationsRef.current = next;
    setLocalAnnotations(next);
    setPool((current) => current.map((item) => item.id === question.id ? { ...item, annotations: next } : item));
    s.updateQuestion(question.id, { annotations: next });
    setAnnotationStatus("Highlight deleted.");
  }

  return (
    <Modal
      title={`${mode === "exam" ? "Exam" : "Tutor"} · ${index + 1} of ${pool.length}`}
      className="quiz-player-modal"
      bodyClassName="quiz-player-body"
      onClose={() => { if (confirm("Leave this block? Progress in unanswered questions is discarded.")) onClose(); }}
      footer={
        mode === "tutor"
          ? (
            <>
              <GhostButton disabled={index === 0} onClick={goPrevious}><ChevronLeft size={ICON_SIZE.body} /> Previous</GhostButton>
              <GhostButton onClick={toggleFlag} aria-pressed={answer?.flagged ?? false}>
                <Flag size={ICON_SIZE.body} /> {answer?.flagged ? "Flagged" : "Mark review"}
              </GhostButton>
              {!revealed
                ? <GButton variant="primary" disabled={!picked} onClick={submitTutor}>Check answer</GButton>
                : <GButton variant="primary" onClick={nextQuestion}>{index + 1 >= pool.length ? "Finish block" : "Next question"}</GButton>}
            </>
          )
          : (
            <>
              <GhostButton disabled={index === 0} onClick={goPrevious}><ChevronLeft size={ICON_SIZE.body} /> Previous</GhostButton>
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
        <div className="quiz-tools" role="group" aria-label="Reading tools">
          {struck.size > 0 && (
            <GhostButton className="quiz-tool" onClick={() => setStruck(new Set())} aria-label="Reset eliminations">
              <RotateCcw size={ICON_SIZE.microInline} /> Reset
            </GhostButton>
          )}
          <div className="quiz-reading-control" role="group" aria-label="Reading size">
            <GhostButton className="icon-only" aria-label="Decrease reading size" disabled={readingScale <= READING_SCALE_MIN} onClick={() => adjustReadingScale(-1)}><Minus size={ICON_SIZE.microInline} /></GhostButton>
            <span className="quiz-reading-value" aria-hidden="true">A</span>
            <GhostButton className="icon-only" aria-label="Increase reading size" disabled={readingScale >= READING_SCALE_MAX} onClick={() => adjustReadingScale(1)}><Plus size={ICON_SIZE.microInline} /></GhostButton>
          </div>
          <GhostButton className="icon-only" aria-label="Calculator" aria-pressed={calcOpen} onClick={() => setCalcOpen((value) => !value)}>
            <Calculator size={ICON_SIZE.body} />
          </GhostButton>
          <GhostButton onClick={toggleFlag} aria-label="Flag question" aria-pressed={answer?.flagged ?? false}>
            <Flag size={ICON_SIZE.body} style={{ color: answer?.flagged ? "var(--gold)" : undefined }} /> {answer?.flagged ? "Flagged" : "Flag"}
          </GhostButton>
        </div>
      </div>

      {calcOpen && <QuizCalculator onClose={closeCalculator} />}

      <QuestionAnnotationToolbar
        selectedTone={annotationTone}
        hasSelection={Boolean(annotationSelection)}
        onTone={setAnnotationTone}
        onHighlight={saveAnnotation}
        onClear={clearAnnotations}
        statusMessage={annotationStatus}
      />

      <div className="quiz-reading" style={{ "--quiz-reading-scale": readingScale } as CSSProperties}>
        <AnnotatedQuestionText
          text={question.stem}
          annotations={stemAnnotations}
          className="question-stem"
          label="Question stem"
          onDelete={deleteAnnotation}
          focusRef={stemRef}
          onSelection={(range) => setAnnotationSelection(range ? { target: "stem", range } : null)}
        />

        <div className="stack gap6">
          {question.options.map((opt) => {
            const isPicked = picked === opt.key;
            const showCorrect = revealed && correctKey === opt.key;
            const showWrong = revealed && isPicked && Boolean(correctKey) && correctKey !== opt.key;
            const isStruck = struck.has(opt.key);
            return (
              <div key={opt.key}
                className={`option-row ${isPicked ? "picked" : ""} ${showCorrect ? "correct" : ""} ${showWrong ? "wrong" : ""} ${isStruck ? "struck" : ""}`}>
                <button type="button" className="option-pick"
                  aria-label={`${opt.key}. ${opt.text}`}
                  aria-pressed={isPicked}
                  disabled={revealed}
                  onClick={() => setPicked(opt.key)}>
                  <span className="mono option-key">{opt.key}</span>
                  <span className="option-text">{opt.text}</span>
                </button>
                <button type="button" className="option-strike"
                  aria-label={`${isStruck ? "Restore" : "Eliminate"} option ${opt.key}`}
                  aria-pressed={isStruck}
                  disabled={revealed}
                  onClick={() => toggleStrike(opt.key)}>
                  <Minus size={ICON_SIZE.body} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {mode === "tutor" && revealed && (
        <>
          <QuizFeedback
            question={question}
            pickedKey={picked}
            onRepairCard={!isCorrect ? () => makeRepairCard(question) : undefined}
            onAddReview={() => s.updateQuestion(question.id, { marked: true })}
            onMarkExplanationWrong={() => flagExtractionIssue("explanation")}
            onMarkAnswerWrong={() => flagExtractionIssue("answer")}
            onEditMapping={() => setEditingMapping((value) => !value)}
            explanationContent={question.explanation ? (
              <AnnotatedQuestionText
                text={question.explanation.trim()}
                annotations={explanationAnnotations}
                className="question-explanation-text"
                label="Question explanation"
                onDelete={deleteAnnotation}
                inline
                onSelection={(range) => setAnnotationSelection(range ? { target: "explanation", range } : null)}
              />
            ) : undefined}
          />
          {editingMapping && (
            <SelectField label="Repair correct-answer mapping" value={question.correctKey ?? ""}
              onChange={(event) => {
                s.updateQuestion(question.id, {
                  correctKey: event.target.value || undefined,
                  needsReview: !event.target.value,
                  extraction: question.extraction ? {
                    ...question.extraction,
                    reviewed: Boolean(event.target.value),
                    reviewedAt: event.target.value ? new Date().toISOString() : undefined,
                    answerDetectionConfidence: event.target.value ? 1 : 0,
                  } : undefined,
                });
                setEditingMapping(false);
              }}>
              <option value="">No reliable answer</option>
              {question.options.map((option) => <option key={option.key} value={option.key}>{option.key}. {option.text}</option>)}
            </SelectField>
          )}
          {question.choiceRationales && Object.keys(question.choiceRationales).length > 0 && (() => {
            const rationales = question.choiceRationales!;
            const correctWhy = correctKey ? rationales[correctKey] : undefined;
            const pickedWhy = picked && picked !== correctKey ? rationales[picked] : undefined;
            const others = Object.entries(rationales).filter(([key]) => key !== correctKey && key !== picked);
            return (
              <div className="stack gap6 choice-rationales">
                {/* Lead with what the learner most needs: why the correct answer
                    is right, then why their own pick was wrong; the remaining
                    distractors collapse so they never bury the key point. */}
                {correctWhy && (
                  <div className="rationale-lead">
                    <b className="grade-green">Why {correctKey} is correct</b>
                    <p>{correctWhy}</p>
                  </div>
                )}
                {pickedWhy && (
                  <div className="rationale-lead">
                    <b className="grade-red">Why your choice ({picked}) is wrong</b>
                    <p>{pickedWhy}</p>
                  </div>
                )}
                {others.length > 0 && (
                  <details className="rationale-others">
                    <summary>Why the other choices are wrong</summary>
                    <div className="stack gap6">
                      {others.map(([key, why]) => (
                        <div key={key} className="sub"><b>{key}:</b> {why}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })()}
          {!isCorrect && correctKey && (
            <>
              <SelectField label="Why did this go wrong?" value={errorType}
                onChange={(e) => setErrorType(e.target.value as QuestionErrorType | "")}>
                <option value="">Pick an error type (recommended)</option>
                {ERROR_TYPES.map((t) => <option key={t} value={t}>{ERROR_TYPE_LABEL[t]}</option>)}
              </SelectField>
              <div className="stack gap6">
                <span className="field-label">Confidence in this material now (press 1–5)</span>
                <div className="row" role="group" aria-label="Confidence in this material">
                  {([1, 2, 3, 4, 5] as const).map((n) => (
                    <button type="button" key={n} className={`filter-pill ${confidence === n ? "on" : ""}`}
                      aria-label={`Confidence ${n} of 5`} aria-pressed={confidence === n}
                      onClick={() => setConfidence(n)}>{n}</button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
            {provider && (
              <>
                <GhostButton disabled={aiBusy} onClick={() => runAi("simple")}><Sparkles size={ICON_SIZE.body} /> Explain simply</GhostButton>
                {!isCorrect && picked && <GhostButton disabled={aiBusy} onClick={() => runAi("why-wrong")}><Sparkles size={ICON_SIZE.body} /> Why was I wrong?</GhostButton>}
                <GhostButton disabled={aiBusy} onClick={() => runAi("hook")}><Sparkles size={ICON_SIZE.body} /> Memory hook</GhostButton>
              </>
            )}
          </div>
          {aiBusy && <div className="sub">Thinking locally…</div>}
          {aiText && (
            <div className="question-explanation">
              <b>{provider?.info.label}:</b> {aiText}
            </div>
          )}
          <QuestionNotesPanel
            questionId={question.id}
            value={question.notes}
            onSave={(notesValue) => {
              const trimmed = notesValue.trim() || undefined;
              // Keep the in-run pool in sync (like annotations) so a note
              // survives navigating away and back within the same block —
              // not just in the persisted store.
              setPool((current) => current.map((item) => item.id === question.id ? { ...item, notes: trimmed } : item));
              s.updateQuestion(question.id, { notes: trimmed });
            }}
          />
        </>
      )}
    </Modal>
  );
}

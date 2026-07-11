// ===========================================================================
// Answer + review flow for a single question. Answer → reveal → capture WHY
// (confidence, guessed?, error type on a miss, note) → optionally turn the
// miss into an error-repair card in one tap (the Capture → Review link in the
// daily loop).
// ===========================================================================
import { useEffect, useState } from "react";
import { Trash2, WandSparkles } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  ERROR_TYPE_LABEL,
  type QuestionErrorType, type QuestionRecord, type QuestionStatus,
} from "../../lib/questions";
import { newSchedule } from "../../lib/ankiCards";
import { Modal, TextAreaField, SelectField } from "../ui/Modal";
import { GButton, GhostButton, Tag } from "../ui/primitives";
import { pushToast } from "../../lib/toast";
import { cleanExplanationText } from "../../lib/questionExplanation";
import { QuizFeedback } from "./QuizFeedback";

const ERROR_TYPES = Object.keys(ERROR_TYPE_LABEL) as QuestionErrorType[];

export function QuestionDetailModal({ question, onClose }: { question: QuestionRecord; onClose: () => void }) {
  const s = useStore();
  const [picked, setPicked] = useState<string | undefined>();
  const [firstPick, setFirstPick] = useState<string | undefined>();
  const [revealed, setRevealed] = useState(false);
  const [guessed, setGuessed] = useState(false);
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5 | undefined>();
  const [errorType, setErrorType] = useState<QuestionErrorType | "">("");
  const [note, setNote] = useState("");
  const [startedAt] = useState(() => Date.now());

  // Track answer changes so "Changed Answer" mode has real data.
  useEffect(() => {
    if (picked && !firstPick) setFirstPick(picked);
  }, [picked, firstPick]);

  const hasKey = Boolean(question.correctKey);
  const isCorrect = hasKey && picked === question.correctKey;
  const changed = Boolean(firstPick && picked && firstPick !== picked);

  function submit() {
    if (!picked && question.options.length > 0) return;
    setRevealed(true);
  }

  function saveAttempt() {
    let status: QuestionStatus;
    if (!hasKey) status = "needs-review";
    else if (isCorrect) status = guessed ? "guessed" : "correct";
    else status = "incorrect";
    s.recordQuestionAttempt(question.id, {
      answerKey: picked,
      status,
      confidence,
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000),
      changedFromKey: changed ? firstPick : undefined,
      errorType: status === "incorrect" || status === "guessed" ? (errorType || undefined) : undefined,
      note: note.trim() || undefined,
    });
    onClose();
  }

  function makeRepairCard() {
    const correct = question.options.find((o) => o.key === question.correctKey);
    const result = s.addAnkiCards([{
      type: "error-repair",
      front: `You missed this: ${question.stem.slice(0, 300)}${question.stem.length > 300 ? "…" : ""}`,
      back: [
        correct ? `Correct: ${correct.key}. ${correct.text}` : "Set the correct answer on the question first.",
        cleanExplanationText(question.explanation, question),
        errorType ? `Why missed: ${ERROR_TYPE_LABEL[errorType as QuestionErrorType]}` : "",
      ].filter(Boolean).join("\n\n"),
      source: question.citation ?? "Question Workspace",
      tags: ["error-repair", ...(question.topic ? [question.topic] : [])],
      questionId: question.id,
      aiGenerated: false,
      schedule: newSchedule(),
    }]);
    pushToast(result.saved
      ? { title: "Repair card created", body: "It's due now in the Anki Lab review queue.", tone: "success" }
      : { title: "Couldn't create card", body: result.errors.join(" "), tone: "warn" });
  }

  function remove() {
    if (!confirm("Permanently delete this question and its attempt history? It will be safely unlinked from question sets.")) return;
    s.removeQuestion(question.id);
    onClose();
  }

  return (
    <Modal
      title={question.topic ? `Question · ${question.topic}` : "Question"}
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={remove}><Trash2 size={13} /> Delete</GhostButton>
          {!revealed
            ? <GButton variant="primary" onClick={submit} disabled={!picked && question.options.length > 0}>Check answer</GButton>
            : <GButton variant="primary" onClick={saveAttempt}>Save attempt</GButton>}
        </>
      }
    >
      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        <Tag tone="neutral">{question.status}</Tag>
        {question.category && <Tag tone="neutral">{question.category}</Tag>}
        {question.system && <Tag tone="neutral">{question.system}</Tag>}
        {question.bank && <Tag tone="neutral">{question.bank}</Tag>}
        {question.ai?.generated && <Tag tone="purple">AI-generated</Tag>}
        {question.extraction && !question.extraction.reviewed && <Tag tone="orange">Extraction unreviewed</Tag>}
        {question.citation && <span className="sub">{question.citation}</span>}
        <button className={`filter-pill ${question.marked ? "on" : ""}`} onClick={() => s.toggleQuestionMarked(question.id)}>
          {question.marked ? "Marked ✓" : "Mark for review"}
        </button>
      </div>

      <div className="question-stem">{question.stem}</div>

      {question.options.length > 0 && (
        <div className="stack gap6">
          {question.options.map((opt) => {
            const isPicked = picked === opt.key;
            const showCorrect = revealed && hasKey && opt.key === question.correctKey;
            const showWrong = revealed && isPicked && hasKey && opt.key !== question.correctKey;
            return (
              <button
                key={opt.key}
                className={`option-row ${isPicked ? "picked" : ""} ${showCorrect ? "correct" : ""} ${showWrong ? "wrong" : ""}`}
                onClick={() => !revealed && setPicked(opt.key)}
                disabled={revealed}
              >
                <span className="mono option-key">{opt.key}</span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {revealed && (
        <>
          <QuizFeedback
            question={question}
            pickedKey={picked}
            onRepairCard={hasKey && !isCorrect ? makeRepairCard : undefined}
            onAddReview={() => s.updateQuestion(question.id, { marked: true })}
            onMarkExplanationWrong={() => s.updateQuestion(question.id, { needsReview: true, status: "needs-review" })}
            onMarkAnswerWrong={() => s.updateQuestion(question.id, { needsReview: true, status: "needs-review" })}
          />
          <div className="stack gap6">
            <span className="field-label">Confidence</span>
            <div className="row">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <button key={n} className={`filter-pill ${confidence === n ? "on" : ""}`} onClick={() => setConfidence(n)}>{n}</button>
              ))}
              {isCorrect && (
                <button className={`filter-pill ${guessed ? "on" : ""}`} onClick={() => setGuessed((v) => !v)}>
                  I guessed
                </button>
              )}
            </div>
          </div>
          {hasKey && (!isCorrect || guessed) && (
            <>
              <SelectField label="Why did this go wrong?" value={errorType}
                onChange={(e) => setErrorType(e.target.value as QuestionErrorType | "")}>
                <option value="">Pick an error type (recommended)</option>
                {ERROR_TYPES.map((t) => <option key={t} value={t}>{ERROR_TYPE_LABEL[t]}</option>)}
              </SelectField>
              <GhostButton onClick={makeRepairCard}>
                <WandSparkles size={13} /> Create an error-repair card from this miss
              </GhostButton>
            </>
          )}
          <TextAreaField label="Note (optional)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          {changed && <div className="sub">You changed your answer from {firstPick} to {picked} — recorded.</div>}
        </>
      )}
    </Modal>
  );
}

import { AlertTriangle, BookMarked, FileSearch, PencilLine, WandSparkles } from "lucide-react";
import type { QuestionRecord } from "../../lib/questions";
import { GhostButton } from "../ui/primitives";

export function QuizFeedback({
  question,
  pickedKey,
  onRepairCard,
  onAddReview,
  onMarkExplanationWrong,
  onMarkAnswerWrong,
  onEditMapping,
}: {
  question: QuestionRecord;
  pickedKey?: string;
  onRepairCard?: () => void;
  onAddReview?: () => void;
  onMarkExplanationWrong?: () => void;
  onMarkAnswerWrong?: () => void;
  onEditMapping?: () => void;
}) {
  const correct = question.options.find((option) => option.key === question.correctKey);
  const picked = question.options.find((option) => option.key === pickedKey);
  const result = !question.correctKey ? "review" : pickedKey === question.correctKey ? "correct" : "incorrect";
  // Import owns cleanup; display must preserve legitimate user edits.
  const explanation = (question.explanation ?? "").trim();
  const extraction = question.extraction;

  return (
    <section className="quiz-feedback" aria-live="polite">
      <div className={`result-banner ${result}`} role="status">
        <span className="result-dot" aria-hidden="true" />
        <strong>
          {result === "correct"
            ? `Correct — you picked ${pickedKey}`
            : result === "incorrect"
              ? `Incorrect — you picked ${pickedKey ?? "nothing"}, answer is ${question.correctKey}`
              : "Needs review — no reliable answer was mapped"}
        </strong>
      </div>

      <div className="answer-compare">
        {correct && (
          <div className="answer-row correct-answer">
            <span>Correct answer</span>
            <strong>{correct.key}. {correct.text}</strong>
          </div>
        )}
        <div className={`answer-row your-answer ${result === "incorrect" ? "wrong" : ""}`}>
          <span>Your answer</span>
          <strong>{picked ? `${picked.key}. ${picked.text}` : "No answer selected"}</strong>
        </div>
      </div>

      {explanation && (
        <div className="feedback-explanation">
          <span className="field-label">Explanation</span>
          <p>{explanation}</p>
        </div>
      )}

      {question.objective && (
        <div className="learning-objective">
          <span>Learning objective</span>
          <p>{question.objective}</p>
        </div>
      )}

      {(question.sourcePage || question.citation || extraction?.sourceSnippet) && (
        <details className="source-evidence">
          <summary><FileSearch size={14} /> Source &amp; evidence</summary>
          <div className="source-evidence-body">
            <div className="source-line">
              <b>{question.citation ?? question.bank ?? "Imported source"}</b>
              {question.sourcePage && <span>page {question.sourcePage}</span>}
              {typeof extraction?.overallImportConfidence === "number" && (
                <span>{Math.round(extraction.overallImportConfidence * 100)}% parser confidence</span>
              )}
            </div>
            {extraction?.sourceSnippet && <pre>{extraction.sourceSnippet}</pre>}
            {extraction?.parserRuleIds?.length ? (
              <div className="source-rules">Rules: {extraction.parserRuleIds.join(" · ")}</div>
            ) : null}
          </div>
        </details>
      )}

      <div className="feedback-repair" aria-label="Repair this question">
        <span className="field-label">Repair</span>
        <div className="row wrap gap6">
          {onRepairCard && <GhostButton onClick={onRepairCard}><WandSparkles size={13} /> Repair card</GhostButton>}
          {onAddReview && <GhostButton onClick={onAddReview}><BookMarked size={13} /> Add to review</GhostButton>}
          {onMarkExplanationWrong && <GhostButton onClick={onMarkExplanationWrong}><AlertTriangle size={13} /> Explanation wrong</GhostButton>}
          {onMarkAnswerWrong && <GhostButton onClick={onMarkAnswerWrong}><AlertTriangle size={13} /> Answer wrong</GhostButton>}
          {onEditMapping && <GhostButton onClick={onEditMapping}><PencilLine size={13} /> Edit mapping</GhostButton>}
        </div>
      </div>
    </section>
  );
}

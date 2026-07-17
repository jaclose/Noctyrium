import { useEffect, useRef, useState } from "react";

export function QuestionNotesPanel({
  questionId,
  value,
  onSave,
}: {
  questionId: string;
  value?: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const initial = useRef(value ?? "");
  const saveRef = useRef(onSave);
  const draftRef = useRef(value ?? "");

  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    setDraft(value ?? "");
    initial.current = value ?? "";
    draftRef.current = value ?? "";
    setStatus("idle");
  }, [questionId, value]);

  useEffect(() => {
    draftRef.current = draft;
    if (draft === initial.current) return;
    setStatus("saving");
    const timer = window.setTimeout(() => {
      saveRef.current(draft);
      initial.current = draft;
      setStatus("saved");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => () => {
    if (draftRef.current !== initial.current) {
      saveRef.current(draftRef.current);
      initial.current = draftRef.current;
    }
  }, [questionId]);

  return (
    <section className="question-notes-panel" aria-label="Question notes">
      <label className="field-label" htmlFor={`question-note-${questionId}`}>Question note</label>
      <textarea
        id={`question-note-${questionId}`}
        className="field"
        rows={3}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Add a private note for this question…"
      />
      <span className="sub" role="status" aria-live="polite">
        {status === "saving" ? "Saving note…" : status === "saved" ? "Note saved" : "Saved with this question"}
      </span>
    </section>
  );
}

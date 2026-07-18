// ===========================================================================
// Q2b-3: turn the current Bank filter into an immutable, deterministically
// ordered question set. The dialog only chooses the name + ordering (+ seed for
// random); membership is the filtered pool captured at creation, so later tag
// edits never move it.
// ===========================================================================
import { useState } from "react";
import { Shuffle } from "lucide-react";
import { Modal, Field, SelectField } from "../ui/Modal";
import { GButton, GhostButton } from "../ui/primitives";
import { ICON_SIZE } from "../../lib/iconSize";
import {
  ORDERING_LABEL, QUESTION_ORDERINGS, makeOrderingSeed, type QuestionOrdering,
} from "../../lib/questionOrdering";

export function CreateQuestionSetDialog({
  count,
  defaultOrdering,
  defaultSeed,
  onCreate,
  onClose,
}: {
  count: number;
  defaultOrdering: QuestionOrdering;
  defaultSeed: string;
  onCreate: (input: { title: string; ordering: QuestionOrdering; seed: string }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [ordering, setOrdering] = useState<QuestionOrdering>(defaultOrdering);
  const [seed, setSeed] = useState(defaultSeed || makeOrderingSeed());

  function submit() {
    const name = title.trim();
    if (!name || count === 0) return;
    onCreate({ title: name, ordering, seed });
  }

  return (
    <Modal
      title="Create question set"
      onClose={onClose}
      className="qb-create-set-modal"
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <GButton variant="primary" disabled={!title.trim() || count === 0} onClick={submit}>
            Create set ({count})
          </GButton>
        </>
      }
    >
      <div className="stack gap12">
        <p className="sub" role="status">
          {count === 0
            ? "No questions match the current filter — adjust it before creating a set."
            : `This snapshots ${count} question${count === 1 ? "" : "s"}. The membership is frozen; later tag or filter changes never alter this set.`}
        </p>
        <Field
          label="Set name"
          placeholder="e.g. Cardio finals"
          value={title}
          autoFocus
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
        />
        <SelectField label="Order questions by" value={ordering} onChange={(event) => setOrdering(event.target.value as QuestionOrdering)}>
          {QUESTION_ORDERINGS.map((option) => (
            <option key={option} value={option}>{ORDERING_LABEL[option]}</option>
          ))}
        </SelectField>
        {ordering === "random" && (
          <div className="row" style={{ gap: 8, alignItems: "flex-end" }}>
            <div className="grow">
              <Field
                label="Random seed"
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
              />
            </div>
            <GhostButton onClick={() => setSeed(makeOrderingSeed())} aria-label="Generate a new random seed">
              <Shuffle size={ICON_SIZE.body} /> New seed
            </GhostButton>
          </div>
        )}
        {ordering === "random" && (
          <p className="sub">The seed is stored with the set — the same seed always reproduces this order.</p>
        )}
      </div>
    </Modal>
  );
}

import type { QuestionAnnotationTone } from "../../lib/questionAnnotations";
import { GhostButton } from "../ui/primitives";

const TONES: Array<{ tone: QuestionAnnotationTone; label: string }> = [
  { tone: "yellow", label: "Yellow" },
  { tone: "cyan", label: "Cyan" },
  { tone: "purple", label: "Purple" },
];

export function QuestionAnnotationToolbar({
  selectedTone,
  hasSelection,
  onTone,
  onHighlight,
  onClear,
}: {
  selectedTone: QuestionAnnotationTone;
  hasSelection: boolean;
  onTone: (tone: QuestionAnnotationTone) => void;
  onHighlight: () => void;
  onClear: () => void;
}) {
  return (
    <div className="question-annotation-toolbar row wrap gap6" role="toolbar" aria-label="Question annotation tools">
      <span className="field-label">Highlight</span>
      {TONES.map(({ tone, label }) => (
        <button
          type="button"
          key={tone}
          className={`annotation-tone tone-${tone} ${selectedTone === tone ? "on" : ""}`}
          aria-label={`${label} highlight`}
          aria-pressed={selectedTone === tone}
          onClick={() => onTone(tone)}
        />
      ))}
      <GhostButton disabled={!hasSelection} onClick={onHighlight}>Highlight selection</GhostButton>
      <GhostButton onClick={onClear}>Clear highlights</GhostButton>
      <span className="sub">Select stem or explanation text, then highlight.</span>
    </div>
  );
}

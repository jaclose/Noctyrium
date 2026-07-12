import { useEffect, useId, useRef } from "react";
import { ScrollText } from "lucide-react";
import { GButton } from "../ui/primitives";

export function PromisePrompt({
  onSign,
  onReviewLater,
  onSkip,
}: {
  onSign: () => void;
  onReviewLater: () => void;
  onSkip: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    dialog?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (!dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onReviewLater();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll<HTMLButtonElement>("button:not([disabled])")];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [onReviewLater]);

  return (
    <div className="promise-prompt-scrim">
      <div ref={dialogRef} className="promise-prompt" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1}>
        <span className="promise-prompt-icon" aria-hidden="true"><ScrollText size={20} /></span>
        <div>
          <h2 id={titleId}>One optional promise</h2>
          <p id={descriptionId}>The guide is complete. If it feels useful, you can review AXOM’s personal use contract and sign it to yourself. Nothing is required to continue.</p>
        </div>
        <div className="promise-prompt-actions">
          <GButton variant="primary" onClick={onSign}>Sign now</GButton>
          <GButton onClick={onReviewLater}>Review later</GButton>
          <button type="button" className="promise-prompt-skip" onClick={onSkip}>Skip for now</button>
        </div>
      </div>
    </div>
  );
}

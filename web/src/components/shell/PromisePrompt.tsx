import { useEffect, useId, useRef } from "react";
import { GButton } from "../ui/primitives";
import { AxomWordmark } from "../ui/BrandMark";

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
        <div className="promise-prompt-brand"><AxomWordmark size="lg" /></div>
        <div className="promise-prompt-copy">
          <span className="promise-prompt-kicker">A personal checkpoint</span>
          <h2 id={titleId}>A promise to yourself</h2>
          <p id={descriptionId}>Before you continue, AXOM will show its personal-use promise once. Signing is optional; it is not a legal contract and nothing is required to keep using your workspace.</p>
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

import { useEffect, useRef, useState } from "react";
import type { DailySuccessResult } from "../../lib/dailySuccess";

export function DailyProgressVessel({ result, compact = false }: { result: DailySuccessResult; compact?: boolean }) {
  const previous = useRef(result.progress);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (previous.current === result.progress) return;
    previous.current = result.progress;
    setChanged(true);
    const timeout = window.setTimeout(() => setChanged(false), 760);
    return () => window.clearTimeout(timeout);
  }, [result.progress]);

  const ariaText = result.status === "neutral"
    ? `${result.statusLabel}. ${result.eligibleCount} eligible requirement${result.eligibleCount === 1 ? "" : "s"}.`
    : `${result.progress}% complete. ${result.metCount} of ${result.eligibleCount} requirements met.`;

  return (
    <div className={`daily-progress-vessel ${compact ? "compact" : ""}`} data-state={result.status}>
      <div className="daily-progress-copy">
        <span>Today</span>
        <strong>{result.statusLabel}</strong>
        <small>{result.eligibleCount
          ? `${result.metCount} of ${result.eligibleCount} selected requirement${result.eligibleCount === 1 ? "" : "s"} met`
          : "Choose only the signals that matter to you"}</small>
      </div>
      <div
        className="daily-progress-track"
        role="progressbar"
        aria-label="Daily success progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={result.progress}
        aria-valuetext={ariaText}
      >
        <div className={`daily-progress-fill ${changed ? "changed" : ""}`} style={{ width: `${result.progress}%` }} />
        <span aria-hidden="true">{result.status === "neutral" ? "—" : `${result.progress}%`}</span>
      </div>
    </div>
  );
}

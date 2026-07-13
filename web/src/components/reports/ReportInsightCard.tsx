import { useId, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../lib/motion";
import type { ReportMetric } from "../../lib/reports";

export interface ReportCardInsight {
  change?: string;
  strongestContributor?: string;
}

export function ReportInsightCard({
  icon,
  metric,
  insight,
}: {
  icon: ReactNode;
  metric: ReportMetric;
  insight?: ReportCardInsight;
}) {
  const detailId = useId();
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissedWhileFocused, setDismissedWhileFocused] = useState(false);
  const revealed = reducedMotion || pinned || (!dismissedWhileFocused && (hovered || focused));
  const tone = metric.state === "neutral" ? "neutral" : metric.state === "low-data" ? "orange" : "cyan";
  const context = metric.denominator
    ? `${metric.numerator}/${metric.denominator} · ${metric.period}`
    : `No denominator yet · ${metric.period}`;

  function togglePinned() {
    setDismissedWhileFocused(false);
    setPinned((value) => !value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setPinned(false);
      setHovered(false);
      setDismissedWhileFocused(true);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePinned();
    }
  }

  function onBlur(event: FocusEvent<HTMLElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setFocused(false);
    setDismissedWhileFocused(false);
  }

  return (
    <article
      className={`glass-card pad stat-card report-stat report-insight-card ${revealed ? "revealed" : ""} ${pinned ? "pinned" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => { setFocused(true); setDismissedWhileFocused(false); }}
      onBlur={onBlur}
    >
      <button
        type="button"
        className="report-insight-trigger"
        aria-expanded={revealed}
        aria-controls={detailId}
        onClick={togglePinned}
        onKeyDown={onKeyDown}
      >
        <span className="report-stat-top">
          <span className={`report-stat-icon ${tone}`}>{icon}</span>
          <span className="stat-title">{metric.label}</span>
          <span className="report-stat-state">{metric.state === "low-data" ? "Low data" : metric.state === "neutral" ? "Neutral" : pinned ? "Pinned" : "Insight"}</span>
        </span>
        <span className="stat-value">{metric.value}</span>
        <span className="report-stat-statusline">{metric.note}</span>
        <span className="stat-note">{metric.interpretation}</span>
        <span className="report-stat-context">{context}</span>
      </button>
        <div
          id={detailId}
          className={`report-stat-detail report-insight-layer ${revealed ? "visible" : ""}`}
          aria-hidden={!revealed}
        >
          <dl>
            <div><dt>What changed</dt><dd>{insight?.change ?? "No reliable comparison yet."}</dd></div>
            <div><dt>Strongest contributor</dt><dd>{insight?.strongestContributor ?? "Not enough evidence yet."}</dd></div>
            <div><dt>Source</dt><dd>{metric.sourceLabel}</dd></div>
            {metric.action && <div><dt>Next action</dt><dd>{metric.action}</dd></div>}
          </dl>
          <details className="report-technical-details">
            <summary tabIndex={revealed ? 0 : -1}>Technical details</summary>
            <div><b>Calculation</b><span>{metric.calculation}</span></div>
            <div><b>Source records</b><span>{metric.sourceRecordIds.length ? metric.sourceRecordIds.slice(0, 4).join(", ") : "No source record contributed yet."}</span></div>
          </details>
        </div>
    </article>
  );
}

import { BarChart3, Edit3, Play, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import type { QuestionSet, QuestionSetMetrics } from "../../lib/library";
import { GButton, GhostButton, Tag } from "../ui/primitives";

export function QuestionSetCard({
  set,
  metrics,
  onStart,
  onReviewMisses,
  onEdit,
  onInsights,
  children,
}: {
  set: QuestionSet;
  metrics: QuestionSetMetrics;
  onStart: () => void;
  onReviewMisses?: () => void;
  onEdit?: () => void;
  onInsights?: () => void;
  children?: ReactNode;
}) {
  const mastery = metrics.currentMasteryPct === null ? "—" : `${metrics.currentMasteryPct}%`;
  const historicalAccuracy = metrics.historicalAccuracyPct === null ? "—" : `${metrics.historicalAccuracyPct}%`;
  const confidence = metrics.importConfidence === null ? "Legacy" : `${metrics.importConfidence}%`;

  return (
    <article className="qset-card glass-liquid">
      <div className="qset-card-head">
        <div className="stack qset-title-wrap">
          <span className="qset-kicker">{metrics.sourceTitle ?? "Question set"}</span>
          <h3>{set.title}</h3>
          <div className="row wrap gap6">
            {metrics.category && <Tag tone="neutral">{metrics.category}</Tag>}
            {set.aiEnhanced && <Tag tone="purple">AI digest</Tag>}
            {metrics.needsReview > 0 && <Tag tone="orange">{metrics.needsReview} need review</Tag>}
          </div>
        </div>
        <div className={`qset-accuracy ${metrics.currentMasteryTone}`} aria-label={metrics.currentMasteryPct === null ? "No mastery attempts yet" : `${metrics.currentMasteryPct}% current mastery`}>
          <strong>{mastery}</strong>
          <span>mastery</span>
        </div>
      </div>

      <div className="qset-metric-strip" aria-label="Question set progress">
        <span><b>{metrics.total}</b> questions</span>
        <span><b>{metrics.completed}</b> completed</span>
        <span><b>{metrics.remaining}</b> remaining</span>
        <span><b>{confidence}</b> import</span>
      </div>

      <div className="qset-progress-copy">
        <span>Historical accuracy {historicalAccuracy} · {metrics.historicalAttemptCount} attempt{metrics.historicalAttemptCount === 1 ? "" : "s"}</span>
        <span>{metrics.lastStudiedAt ? `Last studied ${formatDate(metrics.lastStudiedAt)}` : "Not studied yet"}</span>
      </div>
      <div className={`qset-progress ${metrics.currentMasteryTone}`} role="progressbar" aria-label={`${metrics.completed} of ${metrics.total} questions attempted`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={metrics.completionPct}>
        <span style={{ width: `${metrics.completionPct}%` }} />
      </div>

      {children}

      <div className="qset-actions">
        <GButton size="sm" variant="primary" onClick={onStart}><Play size={13} /> Start</GButton>
        {onReviewMisses && (
          <GhostButton disabled={metrics.missedQuestionIds.length === 0} onClick={onReviewMisses}>
            <RotateCcw size={13} /> Review misses
          </GhostButton>
        )}
        {onEdit && <GhostButton onClick={onEdit}><Edit3 size={13} /> Edit</GhostButton>}
        {onInsights && <GhostButton onClick={onInsights}><BarChart3 size={13} /> Insights</GhostButton>}
      </div>
    </article>
  );
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso.slice(0, 10);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(parsed);
}

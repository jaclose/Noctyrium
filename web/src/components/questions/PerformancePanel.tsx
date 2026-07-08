// ===========================================================================
// Question performance summaries (pre-beta §8) — useful numbers over charts:
// recent blocks, weakest categories, and the retry queue. Reads persisted
// QuizSession records; heavier analytics stay for a later pass.
// ===========================================================================
import { useMemo } from "react";
import { useStore } from "../../lib/store";
import { scoresByCategory, sessionElapsedSeconds } from "../../lib/quiz";
import { dueQuestions } from "../../lib/questions";
import { GlassCard, PanelHeader, Tag, EmptyState } from "../ui/primitives";

export function PerformancePanel({ onRetakeMissed }: { onRetakeMissed: (ids: string[]) => void }) {
  const questions = useStore((s) => s.questions ?? []);
  const sessions = useStore((s) => s.quizSessions ?? []);

  const recent = sessions.slice(0, 5);
  const byCategory = useMemo(() => scoresByCategory(sessions, questions).slice(0, 5), [sessions, questions]);
  const due = useMemo(() => dueQuestions(questions).length, [questions]);
  const incorrectIds = useMemo(
    () => questions.filter((q) => q.status === "incorrect").map((q) => q.id),
    [questions],
  );

  return (
    <GlassCard>
      <PanelHeader title="Performance" sub="Session history, weakest categories, and what's due for another shot." />
      {sessions.length === 0 ? (
        <EmptyState title="No blocks completed yet" hint="Run a tutor or exam block — results land here and feed weakness detection." />
      ) : (
        <div className="stack" style={{ gap: 12 }}>
          <div className="stack gap6">
            <span className="field-label">Recent blocks</span>
            {recent.map((session) => (
              <div key={session.id} className="row" style={{ fontSize: 13 }}>
                <Tag tone={session.score && session.score.pct >= 70 ? "green" : "orange"}>
                  {session.score?.pct ?? 0}%
                </Tag>
                <span className="grow">
                  {session.mode} · {session.questionIds.length} questions
                  {session.timed ? ` · ${Math.round(sessionElapsedSeconds(session) / 60)}m` : ""}
                </span>
                <span className="dim">{session.startedAt.slice(0, 10)}</span>
              </div>
            ))}
          </div>
          {byCategory.length > 0 && (
            <div className="stack gap6">
              <span className="field-label">Weakest categories</span>
              {byCategory.map((c) => (
                <div key={c.category} className="row" style={{ fontSize: 13 }}>
                  <span className="grow">{c.category}</span>
                  <span className={c.pct < 60 ? "grade-red" : c.pct < 75 ? "grade-orange" : "grade-green"}>
                    {c.pct}% ({c.correct}/{c.attempts})
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <Tag tone={due ? "orange" : "green"}>{due} due for retry</Tag>
            {incorrectIds.length > 0 && (
              <button className="filter-pill" onClick={() => onRetakeMissed(incorrectIds.slice(0, 20))}>
                Retake {Math.min(incorrectIds.length, 20)} incorrect
              </button>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

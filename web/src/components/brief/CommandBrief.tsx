// ===========================================================================
// Command Brief — the primary dashboard section (directive §1). One mode, one
// next best move, one fallback win, and a factual delta since yesterday.
// Rules-driven today (lib/commandBrief); AI proposals plug in later through
// the same schema, always behind user review.
// ===========================================================================
import { useMemo, useState } from "react";
import { Play, Zap, LifeBuoy, ClipboardCheck, ChevronDown, ChevronUp } from "lucide-react";
import { useStore } from "../../lib/store";
import { buildCommandBrief, MODE_LABEL, type BriefMode } from "../../lib/commandBrief";
import { detectRecoveryTriggers } from "../../lib/recovery";
import { findLiveSession } from "../../lib/sessions";
import { closeoutForDay } from "../../lib/closeout";
import { GlassCard, GButton, GhostButton, Tag } from "../ui/primitives";
import { CloseoutModal } from "./CloseoutModal";
import { RecoveryPanel } from "./RecoveryPanel";

const MODE_TONE: Record<BriefMode, "cyan" | "green" | "purple" | "orange" | "red" | "neutral"> = {
  maintain: "green",
  "catch-up": "orange",
  recovery: "purple",
  sprint: "cyan",
  "exam-week": "red",
};

export function CommandBrief() {
  const s = useStore();
  const [showCloseout, setShowCloseout] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [showChanges, setShowChanges] = useState(true);

  const brief = useMemo(
    () => buildCommandBrief({
      tasks: s.tasks,
      tracker: s.tracker,
      logs: s.logs,
      boardPrep: s.boardPrep,
      activeDayKey: s.activeDayKey,
      sessions: s.sessions ?? [],
      closeouts: s.closeouts ?? [],
      questions: s.questions ?? [],
      ankiCards: s.ankiCards ?? [],
    }),
    [s.tasks, s.tracker, s.logs, s.boardPrep, s.activeDayKey, s.sessions, s.closeouts, s.questions, s.ankiCards],
  );
  const recovery = useMemo(() => detectRecoveryTriggers(brief.signals), [brief.signals]);
  const liveSession = findLiveSession(s.sessions ?? []);
  const todayCloseout = closeoutForDay(s.closeouts ?? [], s.activeDayKey);

  function begin(kind: "move" | "mvw") {
    const target = kind === "move" ? brief.move : undefined;
    if (target) {
      s.startSession({
        title: target.title,
        link: target.link,
        plannedMinutes: target.estimatedMinutes,
        resources: target.resources,
        reason: target.reason,
        source: "command-brief",
      });
    } else {
      s.startSession({
        title: brief.minimumViableWin.title,
        link: brief.minimumViableWin.link,
        plannedMinutes: brief.minimumViableWin.estimatedMinutes,
        reason: brief.minimumViableWin.reason,
        source: "minimum-viable-win",
      });
    }
  }

  return (
    <GlassCard className="brief" data-tour="command-brief">
      <div className="spread" style={{ alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: 4 }}>
          <div className="row" style={{ gap: 10 }}>
            <span className="h-section">Command Brief</span>
            <Tag tone={MODE_TONE[brief.mode]}>{MODE_LABEL[brief.mode]}</Tag>
          </div>
          <div className="sub" style={{ maxWidth: 640 }}>{brief.modeReason}</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {recovery.triggered && (
            <GButton size="sm" onClick={() => setShowRecovery(true)}>
              <LifeBuoy size={14} /> Recovery plan
            </GButton>
          )}
          <GButton size="sm" variant={todayCloseout ? "default" : "primary"} onClick={() => setShowCloseout(true)}>
            <ClipboardCheck size={14} /> {todayCloseout ? "Closeout ✓" : "Daily closeout"}
          </GButton>
        </div>
      </div>

      <div className="brief-body">
        <div className="brief-move">
          <div className="brief-kicker">Next best move</div>
          <div className="brief-title">{brief.move.title}</div>
          <div className="brief-meta">
            ~{brief.move.estimatedMinutes} min
            {brief.move.link.context ? ` · ${brief.move.link.context}` : ""}
            {brief.move.resources.length > 0 ? ` · ${brief.move.resources.join(", ")}` : ""}
          </div>
          <div className="brief-why">
            <b>Why this now:</b> {brief.move.reason}
          </div>
          <div className="brief-why dim">
            <b>Expected outcome:</b> {brief.move.expectedOutcome}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            {liveSession ? (
              <span className="sub">A session is already running below — finish or park it first.</span>
            ) : (
              <GButton variant="primary" onClick={() => begin("move")}>
                <Play size={15} /> Begin Session
              </GButton>
            )}
          </div>
        </div>

        <div className="brief-side">
          <div className="brief-mvw">
            <div className="brief-kicker"><Zap size={12} style={{ marginRight: 4 }} />Minimum viable win</div>
            <div className="brief-mvw-title">{brief.minimumViableWin.title}</div>
            <div className="sub">{brief.minimumViableWin.reason}</div>
            {!liveSession && (
              <GhostButton onClick={() => begin("mvw")} style={{ marginTop: 8 }}>
                Do the small win (~{brief.minimumViableWin.estimatedMinutes} min)
              </GhostButton>
            )}
          </div>

          <div className="brief-changes">
            <button className="brief-kicker as-button" onClick={() => setShowChanges((v) => !v)}>
              Since yesterday {showChanges ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showChanges && (
              <ul className="brief-change-list">
                {brief.changes.map((c, i) => (
                  <li key={i} className={`brief-change ${c.tone}`}>
                    <span className="brief-change-label">{c.label}</span>
                    <span>{c.value}</span>
                  </li>
                ))}
                {brief.changes.length === 0 && <li className="sub">Nothing logged yet — today writes the first entry.</li>}
              </ul>
            )}
          </div>
        </div>
      </div>

      {showCloseout && <CloseoutModal onClose={() => setShowCloseout(false)} />}
      {showRecovery && <RecoveryPanel signals={brief.signals} trigger={recovery} onClose={() => setShowRecovery(false)} />}
    </GlassCard>
  );
}

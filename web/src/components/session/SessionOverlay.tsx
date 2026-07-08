// ===========================================================================
// Live session surface (directive §2). Renders whenever an active/paused
// session exists: a persistent bottom bar with the running clock (recomputed
// every second from absolute timestamp segments — never a stored counter), the
// committed task, quick logging, pause/resume, an optional full-screen focus
// mode, and the completion capture (confidence, status, takeaway, blocker,
// energy). On mount it restores the live session after reload/sleep.
// ===========================================================================
import { useEffect, useMemo, useState } from "react";
import { Pause, Play, Check, Maximize2, Minimize2 } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  findLiveSession, formatElapsed, sessionElapsedMs,
  QUICK_LOG_LABEL, type SessionCapture, type SessionQuickLog,
} from "../../lib/sessions";
import { GButton, GhostButton, Tag } from "../ui/primitives";
import { Modal, Field, TextAreaField } from "../ui/Modal";

const QUICK_LOGS = Object.keys(QUICK_LOG_LABEL) as SessionQuickLog[];

export function SessionOverlay() {
  const s = useStore();
  const restoreLiveSessions = useStore((st) => st.restoreLiveSessions);
  const session = findLiveSession(s.sessions ?? []);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [focusMode, setFocusMode] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [showQuickLogs, setShowQuickLogs] = useState(false);

  // Restore once on mount: caps stale open segments after sleep/reload.
  useEffect(() => {
    restoreLiveSessions();
  }, [restoreLiveSessions]);

  // The visible clock re-derives from timestamps every second; the interval is
  // display-only and never the source of truth.
  const sessionId = session?.id;
  const sessionStatus = session?.status;
  useEffect(() => {
    if (sessionStatus !== "active") return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [sessionId, sessionStatus]);

  const elapsedMs = useMemo(
    () => (session ? sessionElapsedMs(session, new Date(nowMs)) : 0),
    [session, nowMs],
  );

  if (!session) return null;

  const planned = session.plannedMinutes ? session.plannedMinutes * 60_000 : null;
  const progress = planned ? Math.min(100, Math.round((elapsedMs / planned) * 100)) : null;
  const running = session.status === "active";

  function quickLog(log: SessionQuickLog) {
    if (!session) return;
    s.quickLogSession(session.id, log);
    setShowQuickLogs(false);
    if (log === "completed") setCapturing(true);
  }

  const bar = (
    <div className={`session-bar ${focusMode ? "in-focus" : ""}`}>
      <div className="session-clock mono">{formatElapsed(elapsedMs)}</div>
      <div className="stack grow" style={{ gap: 2, minWidth: 0 }}>
        <div className="truncate" style={{ fontWeight: 700 }}>{session.title}</div>
        <div className="sub truncate">
          {session.link.context ?? session.link.label}
          {progress !== null ? ` · ${progress}% of ~${session.plannedMinutes}m` : ""}
          {session.status === "paused" ? " · paused" : ""}
        </div>
      </div>
      <div className="row" style={{ gap: 6, flexShrink: 0 }}>
        <div className="session-quicklog-wrap">
          <GhostButton onClick={() => setShowQuickLogs((v) => !v)}>Log…</GhostButton>
          {showQuickLogs && (
            <div className="session-quicklog-menu">
              {QUICK_LOGS.map((log) => (
                <button key={log} className="session-quicklog-item" onClick={() => quickLog(log)}>
                  {QUICK_LOG_LABEL[log]}
                </button>
              ))}
            </div>
          )}
        </div>
        <GButton size="sm" iconOnly aria-label={running ? "Pause session" : "Resume session"}
          onClick={() => (running ? s.pauseSession(session.id) : s.resumeSession(session.id))}>
          {running ? <Pause size={15} /> : <Play size={15} />}
        </GButton>
        <GButton size="sm" iconOnly aria-label={focusMode ? "Exit focus mode" : "Focus mode"}
          onClick={() => setFocusMode((v) => !v)}>
          {focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </GButton>
        <GButton size="sm" variant="primary" onClick={() => setCapturing(true)}>
          <Check size={15} /> Finish
        </GButton>
      </div>
    </div>
  );

  return (
    <>
      {focusMode ? (
        <div className="focus-overlay">
          <div className="focus-center">
            <div className="focus-clock mono">{formatElapsed(elapsedMs)}</div>
            <div className="focus-task">{session.title}</div>
            {session.link.context && <div className="sub">{session.link.context}</div>}
            {session.reason && <div className="focus-reason">{session.reason}</div>}
            {(session.resources?.length ?? 0) > 0 && (
              <div className="row" style={{ justifyContent: "center", flexWrap: "wrap", gap: 6 }}>
                {session.resources!.map((r, i) => <Tag key={i} tone="neutral">{r}</Tag>)}
              </div>
            )}
          </div>
          {bar}
        </div>
      ) : bar}
      {capturing && (
        <SessionCaptureModal
          onCancel={() => setCapturing(false)}
          onAbandon={() => { s.abandonSession(session.id); setCapturing(false); setFocusMode(false); }}
          onSave={(capture) => {
            s.completeSession(session.id, capture);
            setCapturing(false);
            setFocusMode(false);
          }}
        />
      )}
    </>
  );
}

function SessionCaptureModal({
  onSave, onCancel, onAbandon,
}: {
  onSave: (capture: SessionCapture) => void;
  onCancel: () => void;
  onAbandon: () => void;
}) {
  const [outcome, setOutcome] = useState<SessionQuickLog>("completed");
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5 | undefined>();
  const [takeaway, setTakeaway] = useState("");
  const [blocker, setBlocker] = useState("");
  const [energy, setEnergy] = useState<"Low" | "Medium" | "High" | undefined>();

  return (
    <Modal
      title="Close this session"
      onClose={onCancel}
      footer={
        <>
          <GhostButton onClick={onAbandon}>Discard session</GhostButton>
          <GButton variant="primary" onClick={() => onSave({
            outcome,
            confidence,
            takeaway: takeaway.trim() || undefined,
            blocker: blocker.trim() || undefined,
            energyAfter: energy,
          })}>
            Save & finish
          </GButton>
        </>
      }
    >
      <div className="stack gap6">
        <span className="field-label">How did it go?</span>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {QUICK_LOGS.map((log) => (
            <button key={log} className={`filter-pill ${outcome === log ? "on" : ""}`} onClick={() => setOutcome(log)}>
              {QUICK_LOG_LABEL[log]}
            </button>
          ))}
        </div>
      </div>
      <div className="stack gap6">
        <span className="field-label">Confidence in this material now</span>
        <div className="row">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button key={n} className={`filter-pill ${confidence === n ? "on" : ""}`} onClick={() => setConfidence(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <Field label="Key takeaway (one line, optional)" value={takeaway} onChange={(e) => setTakeaway(e.target.value)} />
      <TextAreaField label="Error or blocker (optional)" rows={2} value={blocker} onChange={(e) => setBlocker(e.target.value)} />
      <div className="stack gap6">
        <span className="field-label">Energy now (optional)</span>
        <div className="row">
          {(["Low", "Medium", "High"] as const).map((v) => (
            <button key={v} className={`filter-pill ${energy === v ? "on" : ""}`} onClick={() => setEnergy(v)}>{v}</button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// Pomodoro focus timer UI. One component, two densities: a full panel for the
// Productivity page and a compact widget for the Dashboard. Both are driven by
// the shared usePomodoro store, so the clock stays in sync wherever it's shown.
import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward, Timer, Coffee, Flame } from "lucide-react";
import { GlassCard, GButton, PanelHeader } from "../ui/primitives";
import { useStore } from "../../lib/store";
import { usePomodoro, POMODORO_PRESETS, pomodoroPreset, formatClock, ensurePomodoroClock } from "../../lib/pomodoro";

export function Pomodoro({ compact = false }: { compact?: boolean }) {
  const pomo = usePomodoro();
  const [intentionDraft, setIntentionDraft] = useState(pomo.intention);
  const tracker = useStore((s) => s.tracker);
  const blueprintInstalls = useStore((s) => s.blueprintInstalls);
  const preset = pomodoroPreset(pomo.presetId);
  const total = (pomo.phase === "focus" ? preset.focus : preset.break) * 60;
  const elapsed = total - pomo.secondsLeft;
  const pct = total ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
  const isFocus = pomo.phase === "focus";

  const radius = compact ? 46 : 58;
  const dim = (radius + 7) * 2;
  const circumference = 2 * Math.PI * radius;
  const accent = isFocus ? "var(--cyan)" : "var(--green)";
  const targets = useMemo(() => {
    const trackerTargets = tracker
      .filter((item) => item.passes < 4 || item.ankiPasses < 3)
      .slice(0, 18)
      .map((item) => ({ value: `tracker:${item.id}`, label: `${item.label} · ${item.path}`, kind: "tracker" as const, id: item.id }));
    const blueprintTargets = blueprintInstalls
      .flatMap((install) => install.nodes
        .filter((node) => node.status !== "done" && node.status !== "mastered")
        .slice(0, 10)
        .map((node) => ({ value: `blueprint:${node.id}`, label: `${node.objective} · ${install.title}`, kind: "blueprint" as const, id: node.id })))
      .slice(0, 18);
    return [{ value: "free", label: "No target selected", kind: "free" as const }, ...trackerTargets, ...blueprintTargets];
  }, [tracker, blueprintInstalls]);
  const selectedTarget = pomo.targetKind === "free" ? "free" : `${pomo.targetKind}:${pomo.targetId ?? ""}`;

  useEffect(() => { ensurePomodoroClock(); }, []);
  useEffect(() => { setIntentionDraft(pomo.intention); }, [pomo.intention]);

  function chooseTarget(value: string) {
    const target = targets.find((item) => item.value === value);
    if (!target || target.kind === "free") {
      pomo.setTarget({ kind: "free" });
    } else {
      pomo.setTarget({ kind: target.kind, id: target.id, label: target.label });
    }
  }

  return (
    <GlassCard pad className={`pomodoro ${compact ? "compact" : ""} ${pomo.running ? "running" : ""} phase-${pomo.phase}`} data-tour="pomodoro">
      <PanelHeader
        title="Pomodoro"
        sub={compact ? (pomo.targetLabel ?? "Focus sprints that auto-log minutes") : "Focus sprints that auto-log their minutes to today when finished"}
        action={
          <span className={`pomo-phase-pill ${pomo.phase}`}>
            {isFocus ? <Flame size={13} /> : <Coffee size={13} />} {isFocus ? "Focus" : "Break"}
          </span>
        }
      />

      <div className="pomo-body">
        <div className="pomo-dial" style={{ width: dim, height: dim }}>
          <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
            <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
            <circle
              cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              transform={`rotate(-90 ${dim / 2} ${dim / 2})`}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="pomo-clock">
            <span className="pomo-time">{formatClock(pomo.secondsLeft)}</span>
            <span className="pomo-sub">{isFocus ? "until break" : "until focus"}</span>
          </div>
        </div>

        <div className="pomo-controls">
          <div className="pomo-presets">
            {POMODORO_PRESETS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`pomo-preset ${pomo.presetId === option.id ? "on" : ""}`}
                onClick={() => pomo.setPreset(option.id)}
                disabled={pomo.running}
                title={`${option.focus} min focus · ${option.break} min break`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {!compact && (
            <div className="pomo-target-box">
              <label className="stack gap6">
                <span className="field-label">Sprint target</span>
                <select className="field" value={selectedTarget} onChange={(event) => chooseTarget(event.target.value)} disabled={pomo.running}>
                  {targets.map((target) => <option key={target.value} value={target.value}>{target.label}</option>)}
                </select>
              </label>
              <label className="stack gap6">
                <span className="field-label">Intention</span>
                <input className="field" value={intentionDraft} onChange={(event) => {
                  setIntentionDraft(event.target.value);
                  pomo.setIntention(event.target.value);
                }}
                  placeholder="e.g. finish cardio questions without checking notes" />
              </label>
            </div>
          )}

          <div className="pomo-actions">
            <GButton variant="primary" onClick={pomo.toggle}>
              {pomo.running ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Start</>}
            </GButton>
            <GButton size="sm" onClick={pomo.skip} title="Skip to the next phase and log elapsed focus minutes">
              <SkipForward size={14} /> Skip
            </GButton>
            <GButton size="sm" onClick={pomo.reset} title="Reset and log elapsed focus minutes">
              <RotateCcw size={14} /> Reset
            </GButton>
          </div>

          <div className="pomo-meta">
            <span className="pomo-stat"><Timer size={13} /> {pomo.sessionsToday} sprint{pomo.sessionsToday === 1 ? "" : "s"} today</span>
            <span className="pomo-stat"><Flame size={13} /> {pomo.loggedMinutesToday}m logged</span>
            <label className="pomo-toggle" title="Add finished focus minutes to today's study log">
              <input type="checkbox" checked={pomo.autoLog} onChange={(event) => pomo.setAutoLog(event.target.checked)} />
              <span>Auto-log</span>
            </label>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

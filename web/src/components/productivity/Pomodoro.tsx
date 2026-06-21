// Pomodoro focus timer UI. One component, two densities: a full panel for the
// Productivity page and a compact widget for the Dashboard. Both are driven by
// the shared usePomodoro store, so the clock stays in sync wherever it's shown.
import { Pause, Play, RotateCcw, SkipForward, Timer, Coffee, Flame } from "lucide-react";
import { GlassCard, GButton, PanelHeader } from "../ui/primitives";
import { usePomodoro, POMODORO_PRESETS, pomodoroPreset, formatClock } from "../../lib/pomodoro";

export function Pomodoro({ compact = false }: { compact?: boolean }) {
  const pomo = usePomodoro();
  const preset = pomodoroPreset(pomo.presetId);
  const total = (pomo.phase === "focus" ? preset.focus : preset.break) * 60;
  const elapsed = total - pomo.secondsLeft;
  const pct = total ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
  const isFocus = pomo.phase === "focus";

  const radius = compact ? 46 : 58;
  const dim = (radius + 7) * 2;
  const circumference = 2 * Math.PI * radius;
  const accent = isFocus ? "var(--cyan)" : "var(--green)";

  return (
    <GlassCard pad className={`pomodoro ${compact ? "compact" : ""} ${pomo.running ? "running" : ""} phase-${pomo.phase}`} data-tour="pomodoro">
      <PanelHeader
        title="Pomodoro"
        sub={compact ? "Focus sprints that auto-log minutes" : "Focus sprints that auto-log their minutes to today when finished"}
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

          <div className="pomo-actions">
            <GButton variant="primary" onClick={pomo.toggle}>
              {pomo.running ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Start</>}
            </GButton>
            <GButton size="sm" onClick={pomo.skip} title="Skip to the next phase">
              <SkipForward size={14} /> Skip
            </GButton>
            <GButton size="sm" onClick={pomo.reset} title="Reset the current phase">
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

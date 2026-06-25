// Habit Tracker (directive §6) — experimental, opt-in via Settings → Early
// Features. Calm and recovery-friendly: non-punitive streaks, intentional skips,
// and gentle restart messaging. All logic lives in lib/habits.ts (unit-tested).
import { useMemo, useState } from "react";
import { Plus, Trash2, Archive, ArchiveRestore, FlaskConical, Settings2 } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../components/ui/primitives";
import { StreakEmber } from "../components/ui/motion";
import {
  HABIT_TYPE_META, STATUS_META, currentStreak, weekStats, heatmapCells, recoveryMessage,
  statusOn, newHabitDefaults, todayKey,
} from "../lib/habits";
import { addLocalDays } from "../lib/dailyRollover";
import type { Habit, HabitCheckStatus, HabitType } from "../lib/types";

const CHECK_OPTIONS: HabitCheckStatus[] = ["done", "partial", "skipped", "missed"];

export function HabitTrackerPage() {
  const enabled = useStore((s) => s.profile.experimentalFlags?.habits === true);
  const updateProfile = useStore((s) => s.updateProfile);
  const habits = useStore((s) => s.habits);
  const [showArchived, setShowArchived] = useState(false);

  if (!enabled) {
    return (
      <GlassCard pad>
        <PanelHeader title="Habit Tracker" sub="Experimental — currently turned off" />
        <EmptyState
          title="This is an early feature"
          hint="Enable the Habit Tracker in Settings → Personalization → Early Features. Your data stays local."
        />
        <GButton variant="primary" onClick={() => updateProfile({ experimentalFlags: { habits: true } })}>
          <FlaskConical size={15} /> Enable Habit Tracker
        </GButton>
      </GlassCard>
    );
  }

  const active = habits.filter((h) => !h.archived);
  const archived = habits.filter((h) => h.archived);
  const list = showArchived ? archived : active;

  return (
    <>
      <HabitCreate />
      <GlassCard pad>
        <PanelHeader
          title="Habits"
          sub={`${active.length} active${archived.length ? ` · ${archived.length} archived` : ""}`}
          action={
            <div className="filter-bar">
              <button type="button" className={`filter-pill ${!showArchived ? "on" : ""}`} onClick={() => setShowArchived(false)}>Active</button>
              <button type="button" className={`filter-pill ${showArchived ? "on" : ""}`} onClick={() => setShowArchived(true)}>Archived</button>
            </div>
          }
        />
        {list.length === 0 && (
          <EmptyState
            title={showArchived ? "Nothing archived" : "No habits yet"}
            hint={showArchived ? "Archived habits keep their history and can be restored." : "Start with one small, repeatable habit you can't say no to."}
          />
        )}
        <div className="stack gap12">
          {list.map((h) => <HabitRow key={h.id} habit={h} />)}
        </div>
      </GlassCard>
    </>
  );
}

const HABIT_TYPES: HabitType[] = ["binary", "duration", "count", "avoidance", "weekly", "scheduled", "recovery", "milestone"];

function HabitCreate() {
  const addHabit = useStore((s) => s.addHabit);
  const [name, setName] = useState("");
  const [type, setType] = useState<HabitType>("binary");

  function add() {
    if (!name.trim()) return;
    addHabit(newHabitDefaults(name, type));
    setName("");
    setType("binary");
  }

  return (
    <GlassCard pad>
      <PanelHeader title="New habit" sub="Self-monitoring with realistic, flexible recovery — not shame-driven streaks." />
      <div className="row wrap gap8">
        <input className="field grow" placeholder="e.g. Morning sunlight, 20 min of cardio, no doomscrolling"
          value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <select className="field" value={type} onChange={(e) => setType(e.target.value as HabitType)} style={{ width: 190 }} aria-label="Habit type">
          {HABIT_TYPES.map((t) => <option key={t} value={t}>{HABIT_TYPE_META[t].label}</option>)}
        </select>
        <GButton variant="primary" onClick={add}><Plus size={15} /> Add</GButton>
      </div>
      <div className="sub" style={{ marginTop: 10 }}>{HABIT_TYPE_META[type].hint}</div>
    </GlassCard>
  );
}

function HabitRow({ habit }: { habit: Habit }) {
  const entries = useStore((s) => s.habitEntries);
  const checkHabit = useStore((s) => s.checkHabit);
  const clearHabitCheck = useStore((s) => s.clearHabitCheck);
  const updateHabit = useStore((s) => s.updateHabit);
  const removeHabit = useStore((s) => s.removeHabit);
  const [editing, setEditing] = useState(false);

  const today = todayKey();
  const myEntries = useMemo(() => entries.filter((e) => e.habitId === habit.id), [entries, habit.id]);
  const streak = currentStreak(habit, myEntries, today);
  const todayStatus = statusOn(habit, myEntries, today);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addLocalDays(today, -i)), [today]);
  const week = weekStats(habit, myEntries, weekDates);
  const cells = useMemo(() => heatmapCells(habit, myEntries, 35, today), [habit, myEntries, today]);
  const targeted = HABIT_TYPE_META[habit.type].needsTarget;

  function setStatus(status: HabitCheckStatus) {
    if (todayStatus === status) clearHabitCheck(habit.id, today);
    else checkHabit(habit.id, today, status);
  }

  function setValue(raw: string) {
    const value = Math.max(0, Number(raw) || 0);
    const target = habit.target ?? 1;
    if (value <= 0) { clearHabitCheck(habit.id, today); return; }
    checkHabit(habit.id, today, value >= target ? "done" : "partial", value);
  }

  const todayEntry = myEntries.find((e) => e.date === today);

  return (
    <div className="habit-card">
      <div className="habit-card-head">
        <div className="habit-title">
          {habit.color && <span style={{ width: 10, height: 10, borderRadius: 999, background: habit.color, display: "inline-block" }} />}
          <b>{habit.name}</b>
          <Tag tone="neutral">{HABIT_TYPE_META[habit.type].label}</Tag>
          {habit.examMode && <Tag tone="orange">Exam mode</Tag>}
        </div>
        <div className="row gap8" style={{ alignItems: "center" }}>
          <StreakEmber count={streak} />
          <GhostButton onClick={() => setEditing((v) => !v)} title="Settings"><Settings2 size={14} /></GhostButton>
          <GhostButton onClick={() => updateHabit(habit.id, { archived: !habit.archived })} title={habit.archived ? "Restore" : "Archive"}>
            {habit.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
          </GhostButton>
          <GhostButton className="danger" onClick={() => removeHabit(habit.id)} title="Delete"><Trash2 size={14} /></GhostButton>
        </div>
      </div>

      {!habit.archived && (
        <div className="habit-checkin">
          {targeted && (
            <input className="field habit-value-input" type="number" min={0} inputMode="numeric"
              placeholder={`${habit.target ?? ""}${habit.unit ? ` ${habit.unit}` : ""}`}
              defaultValue={todayEntry?.value ?? ""} key={todayEntry?.value ?? "empty"}
              onBlur={(e) => setValue(e.target.value)}
              aria-label={`Log ${habit.name} value`} />
          )}
          {CHECK_OPTIONS.map((status) => (
            <button key={status} type="button"
              className={`habit-status-btn tone-${STATUS_META[status].tone} ${todayStatus === status ? "on" : ""}`}
              onClick={() => setStatus(status)}
              aria-pressed={todayStatus === status}>
              {STATUS_META[status].label}
            </button>
          ))}
        </div>
      )}

      <div className="habit-heat" aria-hidden="true">
        {cells.map((cell) => {
          const tone = cell.status === "none" ? undefined : STATUS_META[cell.status].tone;
          const bg = tone === "green" ? `rgba(70,210,126,${0.25 + cell.intensity * 0.6})`
            : tone === "cyan" ? `rgba(90,215,239,${0.25 + cell.intensity * 0.6})`
              : tone === "orange" ? `rgba(255,159,67,${0.2 + cell.intensity * 0.5})`
                : tone === "neutral" ? "rgba(180,226,255,0.18)"
                  : undefined;
          return (
            <span key={cell.date}
              className={`habit-heat-cell ${cell.scheduled ? "" : "unscheduled"}`}
              style={bg ? { background: bg } : undefined}
              title={`${cell.date}${cell.status !== "none" ? ` · ${STATUS_META[cell.status].label}` : ""}`} />
          );
        })}
      </div>

      <div className="habit-meta-row">
        <span>This week: <b>{week.adherence}%</b> adherence</span>
        <span>{week.done} done · {week.partial} partial · {week.skipped} skipped · {week.missed} missed</span>
        {habit.type === "scheduled" && habit.schedule?.length ? <span>Scheduled {scheduleLabel(habit.schedule)}</span> : null}
      </div>
      {!habit.archived && <div className="habit-recovery">{recoveryMessage(habit, myEntries, today)}</div>}

      {editing && <HabitEditor habit={habit} onClose={() => setEditing(false)} />}
    </div>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function scheduleLabel(schedule: number[]): string {
  return schedule.slice().sort((a, b) => a - b).map((d) => WEEKDAYS[d]).join(" ");
}

function HabitEditor({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const updateHabit = useStore((s) => s.updateHabit);
  const scheduled = habit.type === "scheduled";
  const sched = new Set(habit.schedule ?? []);

  function toggleDay(d: number) {
    const next = new Set(sched);
    if (next.has(d)) next.delete(d); else next.add(d);
    updateHabit(habit.id, { schedule: [...next].sort((a, b) => a - b) });
  }

  return (
    <div className="habit-subpanel">
      <div className="row wrap gap12" style={{ alignItems: "center" }}>
        {HABIT_TYPE_META[habit.type].needsTarget && (
          <label className="stack gap6">
            <span className="field-label">Daily target {habit.unit ? `(${habit.unit})` : ""}</span>
            <input className="field" type="number" min={0} style={{ width: 120 }} defaultValue={habit.target ?? 1}
              onBlur={(e) => updateHabit(habit.id, { target: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
        )}
        <label className="stack gap6">
          <span className="field-label">Category</span>
          <input className="field" style={{ width: 160 }} defaultValue={habit.category ?? ""}
            placeholder="Health, Spiritual…" onBlur={(e) => updateHabit(habit.id, { category: e.target.value.trim() || undefined })} />
        </label>
        <label className="stack gap6">
          <span className="field-label">Reminder window</span>
          <span className="row gap6">
            <input className="field" type="time" style={{ width: 110 }} defaultValue={habit.reminderStart ?? ""}
              onBlur={(e) => updateHabit(habit.id, { reminderStart: e.target.value || undefined })} aria-label="Reminder window start" />
            <input className="field" type="time" style={{ width: 110 }} defaultValue={habit.reminderEnd ?? ""}
              onBlur={(e) => updateHabit(habit.id, { reminderEnd: e.target.value || undefined })} aria-label="Reminder window end" />
          </span>
        </label>
      </div>

      {scheduled && (
        <div className="row gap6 wrap" style={{ marginTop: 12 }}>
          {WEEKDAYS.map((label, d) => (
            <button key={d} type="button" className={`filter-pill ${sched.has(d) ? "on" : ""}`} onClick={() => toggleDay(d)}>{label}</button>
          ))}
        </div>
      )}

      <div className="row gap12 wrap" style={{ marginTop: 12, alignItems: "center" }}>
        <label className="row gap6" style={{ alignItems: "center" }}>
          <input type="checkbox" checked={habit.quietMode === true} onChange={(e) => updateHabit(habit.id, { quietMode: e.target.checked })} />
          <span>Quiet mode (no reminders)</span>
        </label>
        <label className="row gap6" style={{ alignItems: "center" }}>
          <input type="checkbox" checked={habit.examMode === true} onChange={(e) => updateHabit(habit.id, { examMode: e.target.checked })} />
          <span>Examination-period mode</span>
        </label>
        <GButton size="sm" onClick={onClose}>Done</GButton>
      </div>
      <div className="sub" style={{ marginTop: 8 }}>
        Reminders use a time window, not a fixed alarm, and never fire after you've completed the habit. Scheduling lives here; in-app reminder delivery is on the roadmap.
      </div>
    </div>
  );
}

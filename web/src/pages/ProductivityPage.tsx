import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Activity, BookOpen, CalendarDays, Clock, History, Layers, Minus, Plus, Sunrise, Target, Timer, TrendingUp, Zap } from "lucide-react";
import { useStore } from "../lib/store";
import { dayKey, dayTotals, gradeColor, Grade, isoDate, lastNDays, prettyDate, todayGrade } from "../lib/scoring";
import type { StudyLog } from "../lib/types";
import { GlassCard, GButton, PanelHeader, Tag } from "../components/ui/primitives";
import { Ring } from "../components/ui/Ring";
import { Pomodoro } from "../components/productivity/Pomodoro";
import { useInView } from "../lib/useInView";

function stepVal(current: string, delta: number): string {
  return String((Number(current) || 0) + delta);
}

type QuickLogItem = { label: string; type: string; minutes?: number; cards?: number; icon?: boolean };

const QUICK_BASE: QuickLogItem[] = [
  { label: "+50 cards · 15m", type: "Anki", cards: 50, minutes: 15 },
  { label: "+100 cards · 30m", type: "Anki", cards: 100, minutes: 30 },
  { label: "+150 cards · 45m", type: "Anki", cards: 150, minutes: 45 },
  { label: "+200 cards · 60m", type: "Anki", cards: 200, minutes: 60 },
  { label: "Deep Study +180m", type: "Deep Study", minutes: 180 },
];

export function ProductivityPage() {
  const s = useStore();
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [manualType, setManualType] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualCards, setManualCards] = useState("");
  const [manualNote, setManualNote] = useState("");
  const strip = useInView<HTMLDivElement>();

  const viewKey = pickedDay ?? s.activeDayKey;
  const totals = dayTotals(s.logs, viewKey);
  const isActive = viewKey === s.activeDayKey;
  const canStartNewDay = s.activeDayKey < dayKey();
  const weekly = useMemo(() => summarizePeriod(s.logs, lastNDays(7), "week"), [s.logs]);
  const calendarWeek = useMemo(() => summarizePeriod(s.logs, currentWeekDays(), "week"), [s.logs]);
  const monthly = useMemo(() => summarizePeriod(s.logs, currentMonthDays(), "month"), [s.logs]);
  const monthCells = useMemo(() => buildMonthCells(monthly.days), [monthly.days]);
  const calendarToday = isoDate(new Date());
  const quickItems = useMemo(() => {
    const primary: QuickLogItem = s.profile.educationTrack === "sgu"
      ? { label: "Lecture 60min", type: "Lecture", minutes: 60 }
      : { label: "Study 60min", type: "Study", minutes: 60 };
    return [primary, ...QUICK_BASE];
  }, [s.profile.educationTrack]);

  function logManual() {
    const minutes = Number(manualMinutes) || 0;
    const cards = Number(manualCards) || 0;
    if (!minutes && !cards) return;
    const type = manualType.trim() || (minutes < 0 || cards < 0 ? "Correction" : "Study");
    s.logStudy({ type, minutes, cards, note: manualNote || undefined });
    setManualMinutes(""); setManualCards(""); setManualNote("");
  }

  return (
    <>
      <GlassCard pad>
        <PanelHeader title="Study Day Controls"
          sub="Manual correction layer for clean productivity tracking" />
        <div className="row wrap gap8">
          <GButton variant="primary" disabled={!canStartNewDay} onClick={() => s.startNewStudyDay()}>
            <Sunrise size={15} /> Start New Study Day
          </GButton>
          <GButton onClick={() => s.logStudy({ type: "Anki", cards: 20 })}><Plus size={14} /> 20 Anki Cards</GButton>
          <GButton onClick={() => s.logStudy({ type: "Study", minutes: 30 })}><Plus size={14} /> 30 Minutes</GButton>
          <div className="right sub">Active study day: <span className="mono" style={{ color: "var(--cyan)" }}>{s.activeDayKey}</span></div>
        </div>
        <div className="sub" style={{ marginTop: 10 }}>
          {canStartNewDay
            ? "A new shifted study day is available. Starting it will move the active pointer to today."
            : "Start New Study Day unlocks only after the next real Noctyrium study day begins."}
        </div>
      </GlassCard>

      <GlassCard pad data-tour="log">
        <PanelHeader
          title="Productivity Console"
          sub={isActive ? "Logging to today's study day" : `Viewing ${viewKey}`}
          action={!isActive ? <GButton size="sm" onClick={() => setPickedDay(null)}>Back to today</GButton> : undefined} />
        <Ring minutes={totals.minutes} cards={totals.cards} />
        <div className={`quick-grid ${isActive ? "" : "is-locked"}`}>
          {quickItems.map((q) => (
            <GButton key={q.label} onClick={() => s.logStudy({ type: q.type, minutes: q.minutes, cards: q.cards })}>
              {q.type === "Anki" ? <Layers size={14} /> : q.type === "Deep Study" ? <Zap size={14} /> : <Clock size={14} />}
              {q.label}
            </GButton>
          ))}
        </div>

        <div className={`manual-logger ${isActive ? "" : "is-locked"}`}>
          <div className="manual-logger-head"><span>Manual Activity Logger</span></div>
          <div className="manual-log">
            <input className="field manual-type" placeholder="Activity type" value={manualType} onChange={(e) => setManualType(e.target.value)} />
            <div className="stepper" title="Minutes (±10)">
              <button type="button" className="step-btn" aria-label="Minus 10 minutes" onClick={() => setManualMinutes(stepVal(manualMinutes, -10))}><Minus size={14} /></button>
              <input className="field" type="number" placeholder="Min" value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)} />
              <button type="button" className="step-btn" aria-label="Plus 10 minutes" onClick={() => setManualMinutes(stepVal(manualMinutes, 10))}><Plus size={14} /></button>
            </div>
            <div className="stepper" title="Anki cards (±10)">
              <button type="button" className="step-btn" aria-label="Minus 10 cards" onClick={() => setManualCards(stepVal(manualCards, -10))}><Minus size={14} /></button>
              <input className="field" type="number" placeholder="Cards" value={manualCards} onChange={(e) => setManualCards(e.target.value)} />
              <button type="button" className="step-btn" aria-label="Plus 10 cards" onClick={() => setManualCards(stepVal(manualCards, 10))}><Plus size={14} /></button>
            </div>
            <input className="field manual-note" placeholder="Note (optional)" value={manualNote} onChange={(e) => setManualNote(e.target.value)} />
            <GButton variant="primary" onClick={logManual}><Plus size={14} /> Log</GButton>
          </div>
          <div className="log-presets">
            <span className="preset-label">Minutes</span>
            {[10, 20, 25, 50, 90].map((m) => (
              <button key={m} type="button" className="preset-chip" onClick={() => setManualMinutes(String(m))}>{m}m</button>
            ))}
            <span className="preset-label">Cards</span>
            {[10, 20, 25, 50, 100].map((c) => (
              <button key={c} type="button" className="preset-chip" onClick={() => setManualCards(String(c))}>{c}</button>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="productivity-analytics">
        <GlassCard pad className="productivity-intel" data-tour="insights">
          <PanelHeader title="Weekly Productivity Intelligence" sub="Calendar-aligned 7-day signal from minutes and cards"
            action={<Tag tone={scoreTone(weekly.grade)}>{weekly.activeDays}/7 active</Tag>} />
          <div className="period-metrics">
            <Metric icon={<Clock size={15} />} label="Study time" value={`${Math.round(weekly.minutes / 60)}h ${weekly.minutes % 60}m`} note={`${weekly.avgMinutes}m / active day`} />
            <Metric icon={<Layers size={15} />} label="Cards" value={`${weekly.cards}`} note={`${weekly.avgCards} / active day`} />
            <Metric icon={<TrendingUp size={15} />} label="Consistency" value={`${weekly.consistency}%`} note={`${weekly.strongDays.length} strong day${weekly.strongDays.length === 1 ? "" : "s"}`} />
            <Metric icon={<Target size={15} />} label="Needs work" value={`${weekly.needsWorkDays.length}`} note="quiet or fragile days" />
          </div>
          <div className={`productivity-strip reveal-bars ${strip.inView ? "in-view" : ""}`} ref={strip.ref}>
            {weekly.days.map((d) => <DayPillar key={d.key} day={d} onPick={() => setPickedDay(d.key)} />)}
          </div>
          <InsightList insights={weekly.insights} />
        </GlassCard>

        <GlassCard pad className="month-intel">
          <PanelHeader title="Monthly Productivity Calendar" sub={`${monthly.label} · each cell follows the real calendar day`}
            action={<Tag tone={scoreTone(monthly.grade)}>{monthly.activeDays}/{monthly.days.length} active</Tag>} />
          <div className="month-summary">
            <Metric icon={<Activity size={15} />} label="Month result" value={`${Math.round(monthly.minutes / 60)}h`} note={`${monthly.cards} cards`} />
            <Metric icon={<CalendarDays size={15} />} label="Best day" value={monthly.bestDay ? shortDate(monthly.bestDay.key) : "None"} note={monthly.bestDay ? `${monthly.bestDay.minutes}m · ${monthly.bestDay.cards} cards` : "log a session"} />
          </div>
          <div className="calendar-month">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span className="cal-head" key={d}>{d}</span>)}
            {monthCells.map((cell, i) => cell
              ? <button key={cell.key} className={`cal-day ${cell.key === viewKey ? "on" : ""} ${cell.key === calendarToday ? "today" : ""}`}
                  style={{ borderColor: cell.active ? gradeColor(cell.grade) : undefined }}
                  title={`${prettyDate(cell.key)}: ${cell.minutes}m, ${cell.cards} cards`}
                  onClick={() => setPickedDay(cell.key)}>
                  <span>{cell.date.getDate()}</span>
                  <i style={{ background: cell.active ? gradeColor(cell.grade) : "rgba(255,255,255,0.08)" }} />
                </button>
              : <span className="cal-day blank" key={`blank-${i}`} />)}
          </div>
          <InsightList insights={monthly.insights} compact />
        </GlassCard>
      </div>

      <GlassCard pad>
        <PanelHeader title="Productivity Schedule" sub={`${monthly.label} · same calendar engine as Dashboard`}
          action={<Tag tone={scoreTone(calendarWeek.grade)}>{calendarWeek.activeDays}/7 this week</Tag>} />
        <div className="dashboard-schedule productivity-schedule">
          <div className="schedule-calendar">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span className="cal-head" key={d}>{d}</span>)}
            {monthCells.map((cell, i) => cell
              ? <button key={cell.key}
                  className={`cal-day schedule-day ${cell.key === viewKey ? "on" : ""} ${cell.key === calendarToday ? "today" : ""} ${cell.active ? "worked" : ""}`}
                  style={{ borderColor: cell.active ? gradeColor(cell.grade) : undefined }}
                  title={`${prettyDate(cell.key)}: ${cell.minutes}m, ${cell.cards} cards`}
                  onClick={() => setPickedDay(cell.key)}>
                  <span>{cell.date.getDate()}</span>
                  <i style={{ background: cell.active ? gradeColor(cell.grade) : "rgba(255,255,255,0.08)" }} />
                </button>
              : <span className="cal-day blank" key={`schedule-blank-${i}`} />)}
          </div>
          <div className="schedule-side">
            <div className="schedule-stat">
              <CalendarDays size={15} />
              <div><b>{calendarWeek.minutes}m</b><span>this calendar week · {calendarWeek.cards} cards</span></div>
            </div>
            <div className="schedule-stat">
              <Clock size={15} />
              <div><b>{monthly.minutes}m</b><span>this month · {monthly.activeDays}/{monthly.days.length} active</span></div>
            </div>
            <div className="schedule-note">
              <b>{scheduleNote(calendarWeek).title}</b>
              <span>{scheduleNote(calendarWeek).body}</span>
            </div>
          </div>
        </div>
        <div className="heat-legend">
          <span className="lg"><span className="sw" style={{ background: "rgba(255,85,99,0.8)" }} /> Red: logged, below baseline</span>
          <span className="lg"><span className="sw" style={{ background: "rgba(255,159,67,0.82)" }} /> Orange: solid day</span>
          <span className="lg"><span className="sw" style={{ background: "rgba(70,210,126,0.78)" }} /> Green: strong day</span>
          <span className="lg"><span className="sw" style={{ background: "rgba(77,141,255,0.88)" }} /> 👑 Blue: excellent day</span>
        </div>
      </GlassCard>

      <ActivityLog logs={s.logs} />

      <Pomodoro />

      <GlassCard pad>
        <PanelHeader title="Future Integration Slots" sub="Auto-logging from connected tools (coming soon)" />
        <div className="stack gap8">
          <div className="slot"><Layers size={16} /> Anki review counts → auto cards/day</div>
          <div className="slot"><Clock size={16} /> Calendar study blocks → auto minutes</div>
        </div>
      </GlassCard>
    </>
  );
}

interface PeriodDay {
  key: string;
  date: Date;
  minutes: number;
  cards: number;
  grade: Grade;
  active: boolean;
  intensity: number;
}

interface PeriodSummary {
  label: string;
  days: PeriodDay[];
  minutes: number;
  cards: number;
  activeDays: number;
  avgMinutes: number;
  avgCards: number;
  consistency: number;
  grade: Grade;
  strongDays: PeriodDay[];
  needsWorkDays: PeriodDay[];
  bestDay?: PeriodDay;
  insights: { tone: "green" | "orange" | "red" | "cyan" | "neutral"; title: string; body: string }[];
}

function Metric({
  icon, label, value, note,
}: {
  icon: ReactNode; label: string; value: string; note: string;
}) {
  return (
    <div className="metric-tile">
      <span>{icon}</span>
      <div>
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-note">{note}</div>
      </div>
    </div>
  );
}

function DayPillar({ day, onPick }: { day: PeriodDay; onPick: () => void }) {
  const label = day.date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
  return (
    <button className="day-pillar" onClick={onPick} title={`${prettyDate(day.key)}: ${day.minutes}m, ${day.cards} cards`}>
      <div className="day-pillar-track">
        <div
          className="day-pillar-fill"
          style={{ height: `${day.active ? Math.max(10, day.intensity) : 4}%`, background: day.active ? gradeColor(day.grade) : "rgba(255,255,255,0.12)" }}
        />
      </div>
      <span>{label}</span>
      <small>{day.minutes || day.cards ? `${Math.round(day.minutes / 60)}h` : "off"}</small>
    </button>
  );
}

function InsightList({
  insights, compact = false,
}: {
  insights: PeriodSummary["insights"]; compact?: boolean;
}) {
  return (
    <div className={`insight-list ${compact ? "compact" : ""}`}>
      {insights.map((insight) => (
        <div className={`insight insight-${insight.tone}`} key={insight.title}>
          <b>{insight.title}</b>
          <span>{insight.body}</span>
        </div>
      ))}
    </div>
  );
}

function summarizePeriod(logs: ReturnType<typeof useStore.getState>["logs"], dates: Date[], span: "week" | "month"): PeriodSummary {
  const days = dates.map((date) => {
    const key = isoDate(date);
    const totals = dayTotals(logs, key);
    const grade = todayGrade(totals.minutes, totals.cards);
    const intensity = Math.min(100, Math.max((totals.minutes / 480) * 100, (totals.cards / 350) * 100));
    return { key, date, minutes: totals.minutes, cards: totals.cards, grade, active: totals.minutes > 0 || totals.cards > 0, intensity };
  });
  const minutes = days.reduce((sum, d) => sum + d.minutes, 0);
  const cards = days.reduce((sum, d) => sum + d.cards, 0);
  const active = days.filter((d) => d.active);
  const activeDays = active.length;
  const strongDays = days.filter((d) => d.grade === "green" || d.grade === "blue");
  const redActiveDays = days.filter((d) => d.active && d.grade === "red");
  const quietDays = days.filter((d) => !d.active);
  const needsWorkDays = [...redActiveDays, ...quietDays];
  const avgMinutes = activeDays ? Math.round(minutes / activeDays) : 0;
  const avgCards = activeDays ? Math.round(cards / activeDays) : 0;
  const consistency = Math.round((activeDays / Math.max(days.length, 1)) * 100);
  const grade = todayGrade(avgMinutes, avgCards);
  const bestDay = [...days].sort((a, b) => b.intensity - a.intensity || b.minutes - a.minutes || b.cards - a.cards)[0];
  const monthName = days[0]?.date.toLocaleDateString(undefined, { month: "long", year: "numeric" }) ?? "Month";
  const label = span === "week" ? "Last 7 days" : monthName;

  return {
    label,
    days,
    minutes,
    cards,
    activeDays,
    avgMinutes,
    avgCards,
    consistency,
    grade,
    strongDays,
    needsWorkDays,
    bestDay: bestDay?.active ? bestDay : undefined,
    insights: buildInsights({ span, days, activeDays, strongDays, redActiveDays, quietDays, avgMinutes, avgCards, bestDay }),
  };
}

function buildInsights({
  span, days, activeDays, strongDays, redActiveDays, quietDays, avgMinutes, avgCards, bestDay,
}: {
  span: "week" | "month";
  days: PeriodDay[];
  activeDays: number;
  strongDays: PeriodDay[];
  redActiveDays: PeriodDay[];
  quietDays: PeriodDay[];
  avgMinutes: number;
  avgCards: number;
  bestDay?: PeriodDay;
}): PeriodSummary["insights"] {
  const label = span === "week" ? "This week" : "This month";
  const insights: PeriodSummary["insights"] = [];

  if (bestDay?.active && (bestDay.grade === "green" || bestDay.grade === "blue")) {
    insights.push({
      tone: "green",
      title: "Strong day detected",
      body: `${shortDate(bestDay.key)} was excellent: ${bestDay.minutes} minutes and ${bestDay.cards} cards. Good work - that pattern is worth repeating.`,
    });
  } else if (bestDay?.active) {
    insights.push({
      tone: "cyan",
      title: "Best day logged",
      body: `${shortDate(bestDay.key)} led the period with ${bestDay.minutes} minutes and ${bestDay.cards} cards. Build from that baseline.`,
    });
  }

  if (strongDays.length >= Math.ceil(days.length * 0.35)) {
    insights.push({
      tone: "green",
      title: "Momentum is real",
      body: `${label} has ${strongDays.length} strong day${strongDays.length === 1 ? "" : "s"}. Keep the same rhythm and protect recovery.`,
    });
  }

  if (quietDays.length > Math.ceil(days.length * 0.35)) {
    insights.push({
      tone: "orange",
      title: "Pick up the pace gently",
      body: `${quietDays.length} quiet day${quietDays.length === 1 ? "" : "s"} in this ${span}. It is okay - restart with one focused block and a small card target.`,
    });
  } else if (redActiveDays.length) {
    insights.push({
      tone: "orange",
      title: "Fragile days need a floor",
      body: `${redActiveDays.length} active day${redActiveDays.length === 1 ? "" : "s"} stayed in red. A 30-minute minimum plus 50 cards would stabilize the floor.`,
    });
  }

  if (activeDays === 0) {
    insights.push({
      tone: "neutral",
      title: "No logged activity yet",
      body: "Log minutes or cards and this panel will start giving real weekly and monthly feedback.",
    });
  } else {
    insights.push({
      tone: "cyan",
      title: "Current active-day average",
      body: `${avgMinutes} minutes and ${avgCards} cards per active day. The next useful target is consistency before intensity.`,
    });
  }

  return insights.slice(0, 4);
}

function currentMonthDays(): Date[] {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const days: Date[] = [];
  for (let d = new Date(first); d.getMonth() === first.getMonth(); d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function currentWeekDays(): Date[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(start);
    d.setDate(start.getDate() + idx);
    return d;
  });
}

function buildMonthCells(days: PeriodDay[]): Array<PeriodDay | null> {
  const first = days[0];
  const blanks = first ? first.date.getDay() : 0;
  return [...Array.from({ length: blanks }, () => null), ...days];
}

function scheduleNote(summary: PeriodSummary): { title: string; body: string } {
  const today = isoDate(new Date());
  const elapsed = summary.days.filter((day) => day.key <= today);
  const elapsedNeedsWork = summary.needsWorkDays.filter((day) => day.key <= today);
  const strongElapsed = summary.strongDays.filter((day) => day.key <= today);

  if (strongElapsed.length >= 3) {
    return {
      title: "Strong execution week",
      body: `${strongElapsed.length} strong day${strongElapsed.length === 1 ? "" : "s"} are on the board. Repeat the best day, but keep one recovery block protected.`,
    };
  }
  if (elapsed.length && elapsedNeedsWork.length >= Math.max(2, Math.ceil(elapsed.length * 0.6))) {
    return {
      title: "Pick the pace back up",
      body: `${elapsedNeedsWork.length} day${elapsedNeedsWork.length === 1 ? "" : "s"} need attention so far. It is okay - restart with one 30-minute block and a small card target today.`,
    };
  }
  return {
    title: "Useful middle ground",
    body: "The week has activity, but the next gain is consistency. Add one retrieval block to the next quiet day.",
  };
}

// GitHub-style activity feed: every logged study event as a timeline row,
// grouped by day, newest first — "you logged a lecture at this time".
function ActivityLog({ logs }: { logs: StudyLog[] }) {
  const [expanded, setExpanded] = useState(false);
  const limit = expanded ? 200 : 14;
  const visible = logs.slice(0, limit);
  const groups = useMemo(() => groupLogsByDay(visible), [visible]);
  const todayKey = isoDate(new Date());

  return (
    <GlassCard pad className="activity-log-card">
      <PanelHeader title="Activity Log" sub="Every logged block, newest first — a running history of your effort"
        action={<Tag tone={logs.length ? "cyan" : "neutral"}>{logs.length} event{logs.length === 1 ? "" : "s"}</Tag>} />
      {logs.length === 0 ? (
        <div className="activity-empty">
          <History size={20} />
          <div>
            <b>No activity yet</b>
            <span>Log minutes or cards above and each entry will appear here as a timeline.</span>
          </div>
        </div>
      ) : (
        <>
          <div className="activity-feed">
            {groups.map((group) => (
              <div className="activity-day" key={group.key}>
                <div className="activity-day-head">
                  <span>{group.key === todayKey ? "Today" : prettyDate(`${group.key}T12:00:00`)}</span>
                  <small>{group.minutes}m · {group.cards} cards</small>
                </div>
                {group.entries.map((log) => {
                  const meta = describeLog(log);
                  return (
                    <div className="activity-row" key={log.id}>
                      <span className={`activity-dot ${meta.tone}`}>{meta.icon}</span>
                      <div className="activity-main">
                        <span className="activity-text">{meta.text}</span>
                        {log.note && <span className="activity-note">{log.note}</span>}
                      </div>
                      <span className="activity-time">{formatLogTime(log.ts)}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {logs.length > 14 && (
            <button type="button" className="activity-toggle" onClick={() => setExpanded((open) => !open)}>
              {expanded ? "Show less" : `Show all ${logs.length} events`}
            </button>
          )}
        </>
      )}
    </GlassCard>
  );
}

interface ActivityGroup { key: string; minutes: number; cards: number; entries: StudyLog[] }

function groupLogsByDay(logs: StudyLog[]): ActivityGroup[] {
  const order: string[] = [];
  const map = new Map<string, ActivityGroup>();
  for (const log of logs) {
    let group = map.get(log.dayKey);
    if (!group) {
      group = { key: log.dayKey, minutes: 0, cards: 0, entries: [] };
      map.set(log.dayKey, group);
      order.push(log.dayKey);
    }
    group.entries.push(log);
    group.minutes += log.minutes;
    group.cards += log.cards;
  }
  return order.map((key) => map.get(key)!);
}

function describeLog(log: StudyLog): { text: string; tone: string; icon: ReactNode } {
  const type = log.type || "Study";
  const lower = type.toLowerCase();
  const parts: string[] = [];
  if (log.cards) parts.push(`${log.cards > 0 ? "+" : ""}${log.cards} card${Math.abs(log.cards) === 1 ? "" : "s"}`);
  if (log.minutes) parts.push(`${log.minutes > 0 ? "+" : ""}${log.minutes}m`);
  const detail = parts.length ? ` · ${parts.join(" · ")}` : "";
  const correction = log.minutes < 0 || log.cards < 0;
  let icon: ReactNode = <Clock size={13} />;
  let tone = "neutral";
  if (correction) { icon = <Minus size={13} />; tone = "red"; }
  else if (lower.includes("anki") || lower.includes("card")) { icon = <Layers size={13} />; tone = "green"; }
  else if (lower.includes("pomodoro")) { icon = <Timer size={13} />; tone = "purple"; }
  else if (lower.includes("lecture")) { icon = <BookOpen size={13} />; tone = "cyan"; }
  else if (lower.includes("deep")) { icon = <Zap size={13} />; tone = "orange"; }
  return { text: `${correction ? "Corrected" : "Logged"} ${type}${detail}`, tone, icon };
}

function formatLogTime(ts: string): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function shortDate(key: string): string {
  return prettyDate(`${key}T00:00:00`);
}

function scoreTone(grade: Grade): "green" | "orange" | "red" | "cyan" {
  if (grade === "blue") return "cyan";
  if (grade === "green") return "green";
  if (grade === "orange") return "orange";
  return "red";
}

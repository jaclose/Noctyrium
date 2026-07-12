import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Activity, BookOpen, CalendarDays, Clock, History, Layers, Minus, Plus, Target, Timer, TrendingUp, X, Zap } from "lucide-react";
import { useStore } from "../lib/store";
import { dayTotals, gradeColor, Grade, isoDate, prettyDate, productiveTotals, todayGrade } from "../lib/scoring";
import { previousLocalDateKey } from "../lib/dailyRollover";
import type { StudyLog } from "../lib/types";
import { GlassCard, GButton, PanelHeader, Tag } from "../components/ui/primitives";
import { Pomodoro } from "../components/productivity/Pomodoro";
import { ActivityLabelInput } from "../components/productivity/ActivityLabelInput";
import { DailyProgressVessel } from "../components/productivity/DailyProgressVessel";
import { DailyRequirementsEditor } from "../components/productivity/DailyRequirementsEditor";
import { useInView } from "../lib/useInView";
import { missedStandupDays } from "../lib/journal";
import { gotoJournalDay } from "../lib/uiStore";
import { evaluateDailySuccess } from "../lib/dailySuccess";
import { frequentActivityShortcuts, recentActivityShortcuts, type ActivityShortcut } from "../lib/activityShortcuts";

export function ProductivityPage() {
  const s = useStore();
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [manualType, setManualType] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualQuantity, setManualQuantity] = useState("");
  const [manualQuantityKind, setManualQuantityKind] = useState<"cards" | "questions" | "count">("count");
  const [manualNote, setManualNote] = useState("");
  const [manualTrackerId, setManualTrackerId] = useState("");
  const strip = useInView<HTMLDivElement>();

  const viewKey = pickedDay ?? s.activeDayKey;
  const totals = dayTotals(s.logs, viewKey);
  const productive = productiveTotals(s.logs, viewKey);
  const isActive = viewKey === s.activeDayKey;
  const yesterdayKey = previousLocalDateKey(s.activeDayKey);
  // Cheap selector over the current store snapshot. Memoizing the whole store
  // object here was both unnecessary and dependency-fragile; calculate it on
  // render so new requirements/logs can never leave the period floor stale.
  const trackingFloor = productivityTrackingFloor(s);
  const weekly = useMemo(() => summarizePeriod(s.logs, daysEndingOn(s.activeDayKey, 7).filter((date) => isoDate(date) >= trackingFloor), "week", s.activeDayKey), [s.logs, s.activeDayKey, trackingFloor]);
  const monthly = useMemo(() => summarizePeriod(s.logs, currentMonthDays(s.activeDayKey).filter((date) => isoDate(date) >= trackingFloor), "month", s.activeDayKey), [s.logs, s.activeDayKey, trackingFloor]);
  const monthCells = useMemo(() => buildMonthCells(monthly.days), [monthly.days]);
  const calendarToday = s.activeDayKey;
  const missedSet = useMemo(() => new Set(missedStandupDays({ journal: s.journal, logs: s.logs, dayPlans: s.dayPlans }, s.activeDayKey)), [s.journal, s.logs, s.dayPlans, s.activeDayKey]);
  const visibleTrackers = s.productivityTrackers.filter((tracker) => tracker.visible && !tracker.archived);
  const dailyProgress = useMemo(() => evaluateDailySuccess(s, viewKey, s.activeDayKey), [s, viewKey]);
  const recent = useMemo(() => recentActivityShortcuts(s.logs, s.profile.hiddenActivityShortcuts), [s.logs, s.profile.hiddenActivityShortcuts]);
  const recentSignatures = useMemo(() => new Set(recent.map((item) => item.signature)), [recent]);
  const frequent = useMemo(() => frequentActivityShortcuts(s.logs, s.profile.hiddenActivityShortcuts, 2, 3, recentSignatures), [s.logs, s.profile.hiddenActivityShortcuts, recentSignatures]);
  const patternDays = new Set(s.logs.filter((log) => log.dayKey >= trackingFloor).map((log) => log.dayKey)).size;

  function logManual() {
    const minutes = Number(manualMinutes) || 0;
    const quantity = Number(manualQuantity) || 0;
    if (!manualType.trim()) return;
    s.logActivity({
      label: manualType,
      trackerId: manualTrackerId || undefined,
      minutes,
      quantity,
      quantityKind: quantity ? manualQuantityKind : undefined,
      quantityLabel: quantity ? manualQuantityKind : undefined,
      note: manualNote || undefined,
    });
    setManualType(""); setManualMinutes(""); setManualQuantity(""); setManualNote("");
  }

  function fillShortcut(shortcut: ActivityShortcut) {
    setManualType(shortcut.label);
    setManualTrackerId(shortcut.trackerId ?? "");
    setManualMinutes(shortcut.minutes ? String(shortcut.minutes) : "");
    setManualQuantity(shortcut.quantity ? String(shortcut.quantity) : "");
    setManualQuantityKind(shortcut.quantityKind ?? "count");
  }

  function hideShortcut(signature: string) {
    s.updateProfile({
      hiddenActivityShortcuts: [...new Set([...(s.profile.hiddenActivityShortcuts ?? []), signature])].slice(-100),
    });
  }

  return (
    <>
      <GlassCard pad data-tour="log">
        <PanelHeader
          title="Productivity Console"
          sub={isActive ? "One useful record in a few seconds" : `Viewing ${prettyDate(`${viewKey}T12:00:00`)}`}
          action={isActive ? (
            <div className="row wrap gap6">
              <GButton size="sm" onClick={() => setPickedDay(yesterdayKey)}><History size={14} /> Yesterday</GButton>
              <GButton size="sm" onClick={() => gotoJournalDay(yesterdayKey)}><BookOpen size={14} /> Catch-up</GButton>
            </div>
          ) : <GButton size="sm" onClick={() => setPickedDay(null)}>Back to today</GButton>} />
        <DailyProgressVessel result={dailyProgress} />

        {isActive ? (
          <>
            <div className="fast-activity-logger">
              <ActivityLabelInput value={manualType} onChange={setManualType} />
              <label className="fast-field"><span>Duration</span><div><input className="field" aria-label="Duration in minutes" type="number" min="0" placeholder="Optional" value={manualMinutes} onChange={(event) => setManualMinutes(event.target.value)} /><small>min</small></div></label>
              <div className="fast-field quantity"><span>Quantity</span><div>
                <select className="field" aria-label="Quantity type" value={manualQuantityKind} onChange={(event) => setManualQuantityKind(event.target.value as typeof manualQuantityKind)}>
                  <option value="count">Count</option>
                  <option value="questions">Questions</option>
                  <option value="cards">Cards</option>
                </select>
                <input className="field" aria-label="Quantity" type="number" min="0" placeholder="Optional" value={manualQuantity} onChange={(event) => setManualQuantity(event.target.value)} />
              </div></div>
              <input className="field fast-activity-note" aria-label="Activity note" placeholder="Note (optional)" value={manualNote} onChange={(event) => setManualNote(event.target.value)} />
              <GButton variant="primary" onClick={logManual} disabled={!manualType.trim()}><Plus size={14} /> Log</GButton>
            </div>
            <details className="activity-category-disclosure">
              <summary>Category and contribution (optional)</summary>
              <label><span>Use existing category</span><select className="field" aria-label="Productivity category" value={manualTrackerId} onChange={(event) => setManualTrackerId(event.target.value)}>
                <option value="">Infer from this activity</option>
                {visibleTrackers.map((tracker) => <option key={tracker.id} value={tracker.id}>{tracker.name}</option>)}
              </select></label>
            </details>

            {(recent.length > 0 || frequent.length > 0) && (
              <div className="activity-shortcuts">
                {recent.length > 0 && <ShortcutGroup title="Recent" items={recent} onFill={fillShortcut} onHide={hideShortcut} />}
                {frequent.length > 0 && <ShortcutGroup title="Frequent" items={frequent} onFill={fillShortcut} onHide={hideShortcut} />}
              </div>
            )}
            <DailyRequirementsEditor />
          </>
        ) : (
          <div className="historical-log-lock">
            <History size={18} aria-hidden="true" />
            <span><b>History is read-only.</b><small>Return to today before logging so an old view cannot change the current day.</small></span>
          </div>
        )}
        <div className="console-totals" aria-label="Viewed day totals">
          <span><Clock size={13} /> {totals.minutes} study minutes</span>
          {totals.cards > 0 && <span><Layers size={13} /> {totals.cards} cards</span>}
          {productive.minutes !== totals.minutes && <span>{productive.minutes} total productive minutes</span>}
        </div>
      </GlassCard>

      {patternDays >= 3 && <div className="productivity-analytics">
        <GlassCard pad className="productivity-intel" data-tour="insights">
          <PanelHeader title="Weekly Productivity Intelligence" sub="Calendar-aligned 7-day signal from minutes and cards"
            action={<Tag tone={weekly.activeDays ? scoreTone(weekly.grade) : "neutral"}>{weekly.activeDays}/{weekly.days.length} eligible</Tag>} />
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
            action={<Tag tone={monthly.activeDays ? scoreTone(monthly.grade) : "neutral"}>{monthly.activeDays}/{monthly.days.length} eligible</Tag>} />
          <div className="month-summary">
            <Metric icon={<Activity size={15} />} label="Month result" value={`${Math.round(monthly.minutes / 60)}h`} note={`${monthly.cards} cards`} />
            <Metric icon={<CalendarDays size={15} />} label="Best day" value={monthly.bestDay ? shortDate(monthly.bestDay.key) : "None"} note={monthly.bestDay ? `${monthly.bestDay.minutes}m · ${monthly.bestDay.cards} cards` : "log a session"} />
          </div>
          <div className="calendar-month">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span className="cal-head" key={d}>{d}</span>)}
            {monthCells.map((cell, i) => cell
              ? <button key={cell.key} className={`cal-day ${cell.key === viewKey ? "on" : ""} ${cell.key === calendarToday ? "today" : ""} ${missedSet.has(cell.key) ? "remediable" : ""}`}
                  style={{ borderColor: !missedSet.has(cell.key) && cell.active ? gradeColor(cell.grade) : undefined }}
                  title={missedSet.has(cell.key) ? `${prettyDate(cell.key)}: missed standup — click to remediate` : `${prettyDate(cell.key)}: ${cell.minutes}m, ${cell.cards} cards`}
                  onClick={() => (missedSet.has(cell.key) ? gotoJournalDay(cell.key) : setPickedDay(cell.key))}>
                  <span>{cell.date.getDate()}</span>
                  <i style={{ background: cell.active ? gradeColor(cell.grade) : "rgba(255,255,255,0.08)" }} />
                </button>
              : <span className="cal-day blank" key={`blank-${i}`} />)}
          </div>
          <InsightList insights={monthly.insights} compact />
          <div className="heat-legend">
            <span className="lg"><span className="sw" style={{ background: "rgba(255,85,99,0.8)" }} /> Red: logged, below baseline</span>
            <span className="lg"><span className="sw" style={{ background: "rgba(255,159,67,0.82)" }} /> Orange: solid day</span>
            <span className="lg"><span className="sw" style={{ background: "rgba(70,210,126,0.78)" }} /> Green: strong day</span>
            <span className="lg"><span className="sw" style={{ background: "rgba(77,141,255,0.88)" }} /> 👑 Blue: excellent day</span>
          </div>
        </GlassCard>
      </div>}

      <ActivityLog logs={s.logs} activeDayKey={s.activeDayKey} />

      <Pomodoro />
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

function ShortcutGroup({
  title,
  items,
  onFill,
  onHide,
}: {
  title: string;
  items: ActivityShortcut[];
  onFill: (item: ActivityShortcut) => void;
  onHide: (signature: string) => void;
}) {
  return (
    <section className="activity-shortcut-group" aria-label={`${title} activity shortcuts`}>
      <span>{title}</span>
      <div>
        {items.map((item) => (
          <div className="activity-shortcut" key={item.signature}>
            <button type="button" onClick={() => onFill(item)}>
              <b>{item.label}</b>
              <small>{shortcutDetail(item)}{title === "Frequent" ? ` · ${item.uses} uses` : ""}</small>
            </button>
            <button type="button" aria-label={`Hide ${item.label} shortcut`} onClick={() => onHide(item.signature)}><X size={12} /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

function shortcutDetail(item: ActivityShortcut): string {
  const parts = [];
  if (item.minutes) parts.push(`${item.minutes} min`);
  if (item.quantity) parts.push(`${item.quantity} ${item.quantityKind ?? "count"}`);
  return parts.join(" · ") || "One completion";
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

function summarizePeriod(logs: ReturnType<typeof useStore.getState>["logs"], dates: Date[], span: "week" | "month", activeDayKey: string): PeriodSummary {
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
  const quietDays = days.filter((d) => !d.active && d.key < activeDayKey);
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
      body: `${quietDays.length} eligible quiet day${quietDays.length === 1 ? "" : "s"} in this ${span}. Restart with one selected requirement; cards are optional.`,
    });
  } else if (redActiveDays.length) {
    insights.push({
      tone: "orange",
      title: "Fragile days need a floor",
      body: `${redActiveDays.length} active day${redActiveDays.length === 1 ? "" : "s"} stayed below the current floor. Review the requirements you actually want to protect.`,
    });
  }

  if (activeDays === 0) {
    insights.push({
      tone: "neutral",
      title: "No logged activity yet",
      body: "Log any named activity and this panel will start building a real weekly and monthly pattern.",
    });
  } else {
    insights.push({
      tone: "cyan",
      title: "Current active-day average",
      body: `${avgMinutes} minutes${avgCards ? ` and ${avgCards} cards` : ""} per active day. The next useful target is consistency before intensity.`,
    });
  }

  return insights.slice(0, 4);
}

function currentMonthDays(activeDayKey: string): Date[] {
  const now = localDateFromKey(activeDayKey);
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const days: Date[] = [];
  for (let d = new Date(first); d <= now; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function daysEndingOn(activeDayKey: string, count: number): Date[] {
  const end = localDateFromKey(activeDayKey);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (count - index - 1));
    return date;
  });
}

function localDateFromKey(dayKey: string): Date {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function productivityTrackingFloor(state: ReturnType<typeof useStore.getState>): string {
  const starts = state.profile.dailySuccess?.requirements
    .filter((requirement) => requirement.enabled)
    .map((requirement) => requirement.trackingStartsAt)
    .filter(Boolean) ?? [];
  if (starts.length) return [...starts].sort()[0];
  const firstLog = [...state.logs].sort((a, b) => a.dayKey.localeCompare(b.dayKey))[0]?.dayKey;
  return firstLog ?? state.activeDayKey;
}

function buildMonthCells(days: PeriodDay[]): Array<PeriodDay | null> {
  const first = days[0];
  const blanks = first ? first.date.getDay() : 0;
  return [...Array.from({ length: blanks }, () => null), ...days];
}

// GitHub-style activity feed: every logged study event as a timeline row,
// grouped by day, newest first — "you logged a lecture at this time".
function ActivityLog({ logs, activeDayKey }: { logs: StudyLog[]; activeDayKey: string }) {
  const [expanded, setExpanded] = useState(false);
  const limit = expanded ? 200 : 14;
  const visible = logs.slice(0, limit);
  const groups = useMemo(() => groupLogsByDay(visible), [visible]);
  const todayKey = activeDayKey;

  return (
    <GlassCard pad className="activity-log-card">
      <PanelHeader title="Activity Log" sub="Every logged block, newest first — a running history of your effort"
        action={
          <div className="row gap6">
            <Tag tone={logs.length ? "cyan" : "neutral"}>{logs.length} event{logs.length === 1 ? "" : "s"}</Tag>
            <a className="gbtn sm" href="#activity">View full activity</a>
          </div>
        } />
      {logs.length === 0 ? (
        <div className="activity-empty">
          <History size={20} />
          <div>
            <b>No activity yet</b>
            <span>Log any named activity above and each entry will appear here as a timeline.</span>
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
  if (log.quantity && log.quantityKind && log.quantityKind !== "cards") {
    const unit = log.quantityLabel || log.quantityKind;
    parts.push(`${log.quantity} ${unit}`);
  }
  if (log.minutes) parts.push(`${log.minutes > 0 ? "+" : ""}${log.minutes}m`);
  const detail = parts.length ? ` · ${parts.join(" · ")}` : "";
  const correction = log.minutes < 0 || log.cards < 0;
  let icon: ReactNode = <Clock size={13} />;
  let tone = "neutral";
  if (correction) { icon = <Minus size={13} />; tone = "red"; }
  else if (lower.includes("anki") || lower.includes("card")) { icon = <Layers size={13} />; tone = "green"; }
  else if (lower.includes("pomodoro")) { icon = <Timer size={13} />; tone = "purple"; }
  else if (log.quantityKind === "questions") { icon = <Target size={13} />; tone = "cyan"; }
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

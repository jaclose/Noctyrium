import { useEffect, useState } from "react";
import {
  Layers, Clock, ListChecks, BookText, Sparkles, ArrowRight,
  Flame, Database, Download, ShieldCheck, PackageCheck, CalendarDays,
  Sunrise, Trophy, Check, Circle, ArrowRightCircle, RefreshCw, Bot, ExternalLink,
  SlidersHorizontal, GripVertical, PlusCircle, X, Link as LinkIcon, Brain,
} from "lucide-react";
import { useStore } from "../lib/store";
import { dayTotals, todayGrade, gradeLabel, gradeColor, prettyDate, studyStreak, lastNDays, isoDate } from "../lib/scoring";
import type { Grade } from "../lib/scoring";
import type { Course, Term, TrackerItem } from "../lib/types";
import type { DashboardWidgetId } from "../lib/types";
import { PASS_COLOR, scopeMastery, suggestMoves } from "../lib/tracker";
import { exportState } from "../lib/backup";
import { gotoTrackerItem } from "../lib/uiStore";
import { useInView } from "../lib/useInView";
import { APP_RELEASE_VERSION, SCHEMA_VERSION, DEFAULT_DASHBOARD_WIDGETS } from "../lib/seed";
import { resolveTrack } from "../lib/tracks";
import { analyzePerformance } from "../lib/performance";
import { StatCard } from "../components/ui/StatCard";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag } from "../components/ui/primitives";
import { Pomodoro } from "../components/productivity/Pomodoro";
import { runAi } from "../services/aiClient";

const HOSTED_ALPHA_URL = "https://noctyrium-cktjdhuhw-jacloses-projects.vercel.app/#dashboard";

const DASHBOARD_WIDGETS: Array<{ id: DashboardWidgetId; label: string; note: string; preview: string }> = [
  { id: "winDay", label: "Win the day", note: "Morning intention and evening close-out.", preview: "intention" },
  { id: "todayScore", label: "Today's score", note: "Cards/minutes against your daily floor.", preview: "rings" },
  { id: "pomodoro", label: "Pomodoro timer", note: "Focus sprints that auto-log their minutes.", preview: "rings" },
  { id: "weekly", label: "Weekly overview", note: "Seven-day rhythm and active days.", preview: "bars" },
  { id: "suggested", label: "Suggested moves", note: "Clickable tracker/task jumps.", preview: "list" },
  { id: "aiActions", label: "AI actions", note: "Provider-backed action queue; hidden by default.", preview: "ai" },
  { id: "schedule", label: "Schedule", note: "Month activity map.", preview: "calendar" },
  { id: "termMap", label: "Term map", note: "Current course structure; hidden by default.", preview: "map" },
  { id: "localData", label: "Local data & package", note: "Backup, vault, and alpha package status.", preview: "vault" },
  { id: "latestStandup", label: "Latest standup", note: "Most recent journal entry.", preview: "journal" },
  { id: "productivityTrend", label: "Productivity trend", note: "Trend commentary from logged effort.", preview: "trend" },
  { id: "premedHours", label: "Pre-Med hours", note: "Clinical/service/research hour progress.", preview: "hours" },
  { id: "resourceFocus", label: "Resource focus", note: "Pinned resources and SGU drive state.", preview: "links" },
  { id: "boardBlueprint", label: "Blueprint pulse", note: "Current exam/prep lane status.", preview: "brain" },
];

export function DashboardPage() {
  const s = useStore();
  const [editDashboard, setEditDashboard] = useState(false);
  const track = resolveTrack(s.profile.educationTrack);
  const today = dayTotals(s.logs, s.activeDayKey);
  const grade = todayGrade(today.minutes, today.cards);
  const openTasks = s.tasks.filter((t) => !t.done).length;
  const doneToday = s.tasks.filter((t) => t.done && t.completedAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const matureItems = s.tracker.filter((t) => t.passes >= 3).length;
  const masteredItems = s.tracker.filter((t) => t.passes >= 4).length;
  const ankiActive = s.tracker.filter((t) => t.ankiPasses > 0).length;
  const trackerReady = scopeMastery(s.tracker);
  const reviewItems = s.tracker.filter((t) => t.yield === "review" || t.passes < 2).length;

  const streak = studyStreak(s.logs);
  const week = weeklySummary(s.logs);
  const cardTarget = s.profile.dailyCardTarget || 120;
  const minTarget = s.profile.dailyMinuteTarget || 240;
  const cardPct = Math.min(100, Math.round((today.cards / cardTarget) * 100));
  const minPct = Math.min(100, Math.round((today.minutes / minTarget) * 100));
  const targetsMet = today.cards >= cardTarget && today.minutes >= minTarget;
  const floorFill = Math.min(100, Math.round((cardPct + minPct) / 2));
  const strongDay = grade === "green" || grade === "blue" || floorFill >= 80;

  const suggestions = buildSuggestions(s);
  const schedule = buildDashboardSchedule(s.logs, s.tasks);
  const termMap = buildTermSequence(s.terms, s.courses, s.tracker);
  const performance = analyzePerformance({
    logs: s.logs,
    journal: s.journal,
    tasks: s.tasks,
    tracker: s.tracker,
    dayPlans: s.dayPlans,
    activeDayKey: s.activeDayKey,
    minuteTarget: minTarget,
    cardTarget,
    range: 14,
  });
  const widgetOrder = normalizeWidgetOrder(s.profile.dashboardWidgetOrder);
  const hiddenWidgets = new Set(s.profile.hiddenDashboardWidgets ?? []);
  const showWidget = (id: DashboardWidgetId) => !hiddenWidgets.has(id);
  const renderWidget = (widgetId: DashboardWidgetId) => {
    if (!showWidget(widgetId)) return null;
    if (widgetId === "winDay") return <WinTheDay key={widgetId} />;
    if (widgetId === "todayScore") {
      return (
        <TodayScoreWidget key={widgetId}
          today={today} grade={grade} streak={streak}
          cardTarget={cardTarget} minTarget={minTarget}
          cardPct={cardPct} minPct={minPct}
          targetsMet={targetsMet} activeDayKey={s.activeDayKey} />
      );
    }
    if (widgetId === "pomodoro") return <Pomodoro key={widgetId} compact />;
    if (widgetId === "weekly") return <WeeklyWidget key={widgetId} week={week} />;
    if (widgetId === "suggested") return <SuggestedMovesWidget key={widgetId} suggestions={suggestions} />;
    if (widgetId === "aiActions") return <AiSuggestedActions key={widgetId} />;
    if (widgetId === "schedule") return <ScheduleWidget key={widgetId} schedule={schedule} />;
    if (widgetId === "termMap") return <TermMapWidget key={widgetId} termMap={termMap} trackShort={track.short} tracker={s.tracker} />;
    if (widgetId === "localData") return <LocalDataWidget key={widgetId} state={s} />;
    if (widgetId === "latestStandup") return <LatestStandupWidget key={widgetId} />;
    if (widgetId === "productivityTrend") return <ProductivityTrendWidget key={widgetId} performance={performance} week={week} />;
    if (widgetId === "premedHours") return <PremedHoursWidget key={widgetId} />;
    if (widgetId === "resourceFocus") return <ResourceFocusWidget key={widgetId} />;
    if (widgetId === "boardBlueprint") return <BoardBlueprintWidget key={widgetId} />;
    return null;
  };

  return (
    <>
      <AlphaBuildBanner
        profileName={s.profile.name}
        activeDayKey={s.activeDayKey}
        termCount={s.terms.length}
        performanceLabel={performance.performanceLabel}
        energyScore={performance.energyScore}
      />

      <GlassCard pad className="dashboard-control-card">
        <div className="spread">
          <div className="dashboard-control-copy">
            <div className="dashboard-control-kicker">Personal command surface</div>
            <div className="dashboard-control-title">Tailored to {track.short}</div>
            <div className="dashboard-control-meta">
              <span>{performance.performanceLabel}</span>
              <span>Energy {performance.energyScore}/100</span>
              <span>{hiddenWidgets.size} widgets in the library</span>
            </div>
            <div className={`day-fluid-pill dashboard-mini-fluid ${strongDay ? "hot" : ""}`} title="Daily floor fill from minutes and cards">
              <span className="day-fluid-fill" style={{ width: `${floorFill}%` }} />
              <span className="day-fluid-label">{strongDay && <Flame size={13} />} {floorFill}% daily floor</span>
            </div>
          </div>
          <GButton size="sm" variant={editDashboard ? "primary" : "default"} onClick={() => setEditDashboard((open) => !open)}>
            <SlidersHorizontal size={14} /> {editDashboard ? "Done editing" : "Edit dashboard"}
          </GButton>
        </div>
        {editDashboard && <DashboardWidgetEditor order={widgetOrder} hidden={hiddenWidgets} />}
      </GlassCard>

      <div className="grid dashboard-stat-row">
        <StatCard title="Anki" value={`${today.cards}`} note="cards today" icon={<Layers size={18} />}
          trend="🃏" trendTone="neutral"
          overview={<OverviewPanel title="Anki today" rows={[
            { label: "Cards today", value: `${today.cards}`, tone: today.cards >= cardTarget ? "green" : "" },
            { label: "Daily card floor", value: `${cardTarget}`, },
            { label: "Floor progress", value: `${cardPct}%`, tone: cardPct >= 100 ? "green" : cardPct >= 60 ? "cyan" : "orange" },
            { label: "Decks in rotation", value: `${ankiActive} item${ankiActive === 1 ? "" : "s"}` },
            { label: "This week", value: `${week.cards} cards` },
          ]} foot={today.cards >= cardTarget ? "Card floor cleared — protect the streak, not the maximum." : `${Math.max(0, cardTarget - today.cards)} cards to clear today's floor.`} />} />
        <StatCard title="Study" value={`${today.minutes}m`} note="logged today" icon={<Clock size={18} />}
          trend={gradeLabel(grade)} trendTone={grade === "red" ? "red" : grade === "orange" ? "orange" : grade === "green" ? "green" : "cyan"}
          overview={<OverviewPanel title="Study time" rows={[
            { label: "Minutes today", value: `${today.minutes}m`, tone: today.minutes >= minTarget ? "green" : "" },
            { label: "Daily minute floor", value: `${minTarget}m` },
            { label: "Day grade", value: gradeLabel(grade).replace("👑 ", ""), tone: grade === "green" || grade === "blue" ? "green" : grade === "orange" ? "orange" : "red" },
            { label: "Current streak", value: `${streak} day${streak === 1 ? "" : "s"}` },
            { label: "This week", value: `${Math.round(week.minutes / 60)}h · ${week.activeDays}/7 active` },
          ]} foot={today.minutes >= minTarget ? "Minute floor cleared for today." : `${Math.max(0, minTarget - today.minutes)}m to clear today's floor.`} />} />
        <TasksJournalStatCard openTasks={openTasks} doneToday={doneToday} journalCount={s.journal.length}
          firstTasks={s.tasks.filter((t) => !t.done && !t.archived).slice(0, 3).map((t) => t.title)}
          lastStandup={s.journal[0]?.date} />
        <StatCard title="Tracker" value={`${trackerReady}%`} note={`${matureItems} mature · ${reviewItems} need attention`} icon={<BadgeDot />}
          trend={`${masteredItems} mastered`} trendTone="green"
          overview={<OverviewPanel title="Tracker mastery" rows={[
            { label: "Overall readiness", value: `${trackerReady}%`, tone: trackerReady >= 70 ? "green" : trackerReady >= 40 ? "cyan" : "orange" },
            { label: "Tracked rows", value: `${s.tracker.length}` },
            { label: "Mastered (4+)", value: `${masteredItems}`, tone: "green" },
            { label: "Mature (3)", value: `${matureItems}` },
            { label: "Needs attention", value: `${reviewItems}`, tone: reviewItems ? "orange" : "green" },
          ]} foot={reviewItems ? `${reviewItems} item${reviewItems === 1 ? "" : "s"} flagged review or under two passes.` : "No review flags — keep cycling fresh evidence."} />} />
        <StatCard title="Energy" value={`${performance.energyScore}`} note={performance.journalSignal} icon={<Sunrise size={18} />}
          trend={performance.energyLabel} trendTone={performance.energyScore >= 72 ? "green" : performance.energyScore >= 45 ? "orange" : "red"}
          overview={<OverviewPanel title="Energy read" rows={[
            { label: "Energy score", value: `${performance.energyScore}/100`, tone: performance.energyScore >= 72 ? "green" : performance.energyScore >= 45 ? "orange" : "red" },
            { label: "Read", value: performance.energyLabel },
            { label: "Performance", value: performance.performanceLabel },
            { label: "Journal signal", value: performance.journalSignal },
          ]} foot={performance.recommendation} />} />
      </div>

      {widgetOrder.map(renderWidget)}
    </>
  );
}

function AlphaBuildBanner({
  profileName, activeDayKey, termCount, performanceLabel, energyScore,
}: {
  profileName: string;
  activeDayKey: string;
  termCount: number;
  performanceLabel: string;
  energyScore: number;
}) {
  const displayName = profileName && profileName !== "Noctyrium" ? profileName : "JD";
  const quote = dailyDashboardMessage(activeDayKey);
  const date = new Date(`${activeDayKey}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <GlassCard pad className="alpha-build-banner">
      <div className="alpha-build-mark">
        <PackageCheck size={19} />
      </div>
      <div className="alpha-build-copy">
        <span>{date}</span>
        <b>Welcome, {displayName}</b>
        <p>{quote}</p>
      </div>
      <div className="alpha-build-meta">
        <span><Sparkles size={13} /> {performanceLabel}</span>
        <span><Sunrise size={13} /> Energy {energyScore}/100</span>
        <span><ShieldCheck size={13} /> Version v{APP_RELEASE_VERSION}</span>
        <span><Database size={13} /> Schema {SCHEMA_VERSION}</span>
        <span>{termCount} active map nodes</span>
      </div>
    </GlassCard>
  );
}

const DASHBOARD_MESSAGES = [
  "Do the honest block. Then do the next one.",
  "A clean hour beats a noisy day.",
  "Protect the floor; the ceiling takes care of itself.",
  "Questions reveal the map. Review repairs it.",
  "You are not behind if you return with a plan.",
  "Make today legible: effort, evidence, next move.",
  "Small retrieval done daily is not small.",
  "The goal is not panic. The goal is contact with the work.",
  "Good medicine starts with good attention.",
  "Be precise, be kind, keep moving.",
];

function dailyDashboardMessage(key: string) {
  const code = key.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return DASHBOARD_MESSAGES[code % DASHBOARD_MESSAGES.length];
}

const WRAP_MESSAGES = [
  "Close the loop while the day is still fresh.",
  "A short honest review is enough.",
  "Record the signal before memory edits it.",
  "Name the blocker, keep the useful part.",
  "End clean so tomorrow starts lighter.",
];

function wrapUpMessage(key: string) {
  const code = key.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return WRAP_MESSAGES[code % WRAP_MESSAGES.length];
}

function BadgeDot() {
  return <span className="badge-dot-icon" aria-hidden="true" />;
}

function TasksJournalStatCard({
  openTasks, doneToday, journalCount, firstTasks, lastStandup,
}: {
  openTasks: number;
  doneToday: number;
  journalCount: number;
  firstTasks: string[];
  lastStandup?: string;
}) {
  return (
    <div className="stat-card-wrap">
      <GlassCard className="stat-card tasks-journal-stat has-overview" pad>
        <div className="stat-top">
          <span className="stat-icon"><ListChecks size={18} /></span>
          <Tag tone={openTasks ? "orange" : "green"}>{openTasks ? `${openTasks} open` : "Clear"}</Tag>
        </div>
        <div className="tasks-journal-split">
          <div>
            <b>{openTasks}</b>
            <span>open tasks</span>
          </div>
          <div>
            <b>{journalCount}</b>
            <span>standups</span>
          </div>
        </div>
        <div className="stat-title">Tasks + Journal</div>
        <div className="stat-note">{doneToday} done today · execute, then reflect</div>
      </GlassCard>
      <div className="stat-overview" role="tooltip">
        <div className="stat-ov-title">Tasks &amp; Journal</div>
        <div className="stat-ov-row"><span>Open tasks</span><b className={openTasks ? "orange" : "green"}>{openTasks}</b></div>
        <div className="stat-ov-row"><span>Done today</span><b className="green">{doneToday}</b></div>
        <div className="stat-ov-row"><span>Standups logged</span><b>{journalCount}</b></div>
        <div className="stat-ov-row"><span>Last standup</span><b>{lastStandup ? prettyDate(lastStandup) : "None yet"}</b></div>
        {firstTasks.length > 0 && (
          <div className="stat-ov-list">
            {firstTasks.map((title) => <span key={title}><Circle size={9} /> {title}</span>)}
          </div>
        )}
        <div className="stat-ov-foot">{openTasks ? "Clear the open loop, then write the standup." : "Inbox clear — reflect and set tomorrow's intention."}</div>
      </div>
    </div>
  );
}

// Shared hover-popover body for the dashboard stat cards.
function OverviewPanel({
  title, rows, foot,
}: {
  title: string;
  rows: Array<{ label: string; value: string; tone?: string }>;
  foot?: string;
}) {
  return (
    <>
      <div className="stat-ov-title">{title}</div>
      {rows.map((row) => (
        <div className="stat-ov-row" key={row.label}>
          <span>{row.label}</span><b className={row.tone}>{row.value}</b>
        </div>
      ))}
      {foot && <div className="stat-ov-foot">{foot}</div>}
    </>
  );
}

function DashboardWidgetEditor({ order, hidden }: { order: DashboardWidgetId[]; hidden: Set<DashboardWidgetId> }) {
  const updateProfile = useStore((state) => state.updateProfile);
  const [dragId, setDragId] = useState<DashboardWidgetId | null>(null);
  const [overId, setOverId] = useState<DashboardWidgetId | null>(null);

  function setOrder(next: DashboardWidgetId[]) {
    updateProfile({ dashboardWidgetOrder: normalizeWidgetOrder(next) });
  }

  function remove(id: DashboardWidgetId) {
    const next = new Set(hidden);
    next.add(id);
    updateProfile({ hiddenDashboardWidgets: [...next] });
  }

  function subscribe(id: DashboardWidgetId) {
    const next = new Set(hidden);
    next.delete(id);
    updateProfile({ hiddenDashboardWidgets: [...next], dashboardWidgetOrder: normalizeWidgetOrder(order) });
  }

  function handleDrop(targetId: DashboardWidgetId) {
    if (!dragId || dragId === targetId) return;
    const current = normalizeWidgetOrder(order);
    const from = current.indexOf(dragId);
    const to = current.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const next = [...current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
    setDragId(null);
    setOverId(null);
  }

  const visible = order.filter((id) => !hidden.has(id));
  const available = order.filter((id) => hidden.has(id));

  return (
    <div className="dashboard-widget-editor">
      <div className="widget-editor-head">
        <div>
          <span className="widget-library-eyebrow">Widget Library</span>
          <b>Drag to arrange</b>
          <span>Grab anywhere on a widget row. Remove sends it back to the library.</span>
        </div>
        <GButton size="sm" onClick={() => updateProfile({ dashboardWidgetOrder: [...DEFAULT_DASHBOARD_WIDGETS], hiddenDashboardWidgets: [] })}>
          Show all
        </GButton>
      </div>

      <div className="widget-editor-zones">
        <section className="widget-editor-zone">
          <div className="widget-zone-title">On Dashboard</div>
          {visible.map((id) => {
            const meta = DASHBOARD_WIDGETS.find((widget) => widget.id === id);
            if (!meta) return null;
            return (
              <div className={`widget-library-row draggable ${overId === id ? "drop-target" : ""}`} key={id}
                draggable
                onDragStart={() => setDragId(id)}
                onDragOver={(event) => { event.preventDefault(); setOverId(id); }}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                onDrop={(event) => { event.preventDefault(); handleDrop(id); }}>
                <GripVertical size={16} className="widget-grip" />
                <WidgetPreview kind={meta.preview} />
                <div className="grow">
                  <b>{meta.label}</b>
                  <span>{meta.note}</span>
                </div>
                <button className="ghost-btn" title="Remove widget" onClick={() => remove(id)}><X size={14} /></button>
              </div>
            );
          })}
        </section>

        <section className="widget-editor-zone available">
          <div className="widget-zone-title">Available Widgets</div>
          {available.map((id) => {
            const meta = DASHBOARD_WIDGETS.find((widget) => widget.id === id);
            if (!meta) return null;
            return (
              <div className="widget-library-row off" key={id}>
                <PlusCircle size={16} className="widget-grip" />
                <WidgetPreview kind={meta.preview} />
                <div className="grow">
                  <b>{meta.label}</b>
                  <span>{meta.note}</span>
                </div>
                <GButton size="sm" onClick={() => subscribe(id)}>Subscribe</GButton>
              </div>
            );
          })}
        </section>
      </div>

      <div className="row">
        <GButton size="sm" onClick={() => updateProfile({ dashboardWidgetOrder: [...DEFAULT_DASHBOARD_WIDGETS], hiddenDashboardWidgets: ["aiActions", "schedule", "termMap", "localData", "latestStandup", "productivityTrend", "premedHours", "resourceFocus", "boardBlueprint"] })}>
          Reset to focused layout
        </GButton>
        <span className="sub">Saved locally with your profile, backup, and future sync payload.</span>
      </div>
    </div>
  );
}

function WidgetPreview({ kind }: { kind: string }) {
  return (
    <span className={`widget-preview mini-${kind}`} aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}

function normalizeWidgetOrder(value: unknown): DashboardWidgetId[] {
  const valid = new Set(DEFAULT_DASHBOARD_WIDGETS);
  const incoming = Array.isArray(value)
    ? value.filter((item): item is DashboardWidgetId => typeof item === "string" && valid.has(item as DashboardWidgetId))
    : [];
  return [...new Set([...incoming, ...DEFAULT_DASHBOARD_WIDGETS])];
}

function TodayScoreWidget({
  today, grade, streak, cardTarget, minTarget, cardPct, minPct, targetsMet, activeDayKey,
}: {
  today: { minutes: number; cards: number };
  grade: Grade;
  streak: number;
  cardTarget: number;
  minTarget: number;
  cardPct: number;
  minPct: number;
  targetsMet: boolean;
  activeDayKey: string;
}) {
  const fill = Math.min(100, Math.round((cardPct + minPct) / 2));
  const strong = grade === "green" || grade === "blue" || fill >= 80;
  return (
    <GlassCard pad>
      <div className="panel-head">
        <div>
          <div className="panel-title">Today's score</div>
          <div className="panel-sub">A “good enough” day, not a maximum to grind past</div>
        </div>
        <span className="streak-badge" title="Consecutive study days">
          <Flame size={14} /> {streak} day{streak === 1 ? "" : "s"}
        </span>
      </div>
      <div className={`day-fluid-pill ${strong ? "hot" : ""}`} title="Daily floor fill from minutes and cards">
        <span className="day-fluid-fill" style={{ width: `${fill}%` }} />
        <span className="day-fluid-label">{strong && <Flame size={13} />} {fill}% daily floor</span>
      </div>
      <div className="ring-wrap">
        <div className="ring">
          <svg width="116" height="116" viewBox="0 0 116 116">
            <circle cx="58" cy="58" r="51" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
            <circle cx="58" cy="58" r="51" fill="none" stroke={gradeColor(grade)} strokeWidth="14" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 51} strokeDashoffset={2 * Math.PI * 51 * (1 - Math.min(today.minutes / 480, 1))}
              transform="rotate(-90 58 58)" style={{ transition: "stroke-dashoffset .5s ease" }} />
          </svg>
          <div className="ring-label" style={{ color: gradeColor(grade) }}>{gradeLabel(grade).replace("👑 ", "")}</div>
        </div>
        <div className="stack gap8 grow">
          <ProgressBar label="Cards" value={today.cards} target={cardTarget} pct={cardPct} color="var(--grade-green)" />
          <ProgressBar label="Minutes" value={today.minutes} target={minTarget} pct={minPct} color="var(--cyan)" />
          <div className="dim" style={{ fontSize: 11.5 }}>Study day {activeDayKey}</div>
        </div>
      </div>
      {targetsMet && (
        <div className="enough-note">✓ You've hit today's target. Stopping here is a win — protect the streak, not the maximum.</div>
      )}
    </GlassCard>
  );
}

function WeeklyWidget({ week }: { week: ReturnType<typeof weeklySummary> }) {
  const reveal = useInView<HTMLDivElement>();
  return (
    <GlassCard pad className="weekly-card">
      <PanelHeader title="Weekly Overview" sub="Last 7 calendar days from your local study log"
        action={<Tag tone={week.activeDays >= 5 ? "green" : week.activeDays >= 3 ? "orange" : "neutral"}>{week.activeDays}/7 active</Tag>} />
      <div className="weekly-hero">
        <div>
          <div className="week-total">{Math.round(week.minutes / 60)}h</div>
          <div className="sub">{week.minutes} minutes · {week.cards} cards · {week.tasksDone} tasks done</div>
        </div>
        <div className="weekly-score">
          <span style={{ color: gradeColor(week.grade) }}>{gradeLabel(week.grade).replace("👑 ", "")}</span>
          <small>week result</small>
        </div>
      </div>
      <div className={`week-bars reveal-bars ${reveal.inView ? "in-view" : ""}`} ref={reveal.ref}>
        {week.days.map((d) => (
          <div className="week-day" key={d.key} title={`${d.key}: ${d.minutes}m, ${d.cards} cards`}>
            <div className="week-bar-shell">
              <div className="week-bar-fill" style={{ height: `${Math.max(8, d.intensity)}%`, background: gradeColor(d.grade) }} />
            </div>
            <span>{d.label}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function SuggestedMovesWidget({ suggestions }: { suggestions: DashSuggestion[] }) {
  return (
    <GlassCard pad>
      <PanelHeader title="Suggested next moves" sub="Reactive to your current state" />
      <div className="stack gap8">
        {suggestions.map((sg, i) => {
          const clickable = !!(sg.itemId || sg.route);
          const go = () => { if (sg.itemId) gotoTrackerItem(sg.itemId); else if (sg.route) location.hash = sg.route; };
          const interactive = clickable ? { role: "button" as const, tabIndex: 0, onClick: go } : {};
          return (
            <div className={`sugg ${clickable ? "clickable" : ""}`} key={i} {...interactive}>
              <span className="sugg-dot" style={{ background: sg.color }} />
              <div className="grow">
                <div className="sugg-title">{sg.title}</div>
                <div className="sugg-reason">{sg.reason}</div>
              </div>
              {clickable ? <ArrowRight size={15} style={{ color: "var(--cyan)" }} /> : <Sparkles size={15} style={{ color: "var(--cyan)" }} />}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function ScheduleWidget({ schedule }: { schedule: ReturnType<typeof buildDashboardSchedule> }) {
  return (
    <GlassCard pad className="dashboard-schedule-card" data-tour="schedule">
      <PanelHeader title="Schedule" sub={`${schedule.monthLabel} · updates automatically with each new week and month`}
        action={<Tag tone={schedule.weekActive >= 5 ? "green" : schedule.weekActive >= 3 ? "orange" : "neutral"}>{schedule.weekActive}/7 this week</Tag>} />
      <div className="dashboard-schedule">
        <div className="schedule-calendar">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span className="cal-head" key={d}>{d}</span>)}
          {schedule.cells.map((cell, i) => cell
            ? <button key={cell.key}
                className={`cal-day schedule-day ${cell.key === schedule.todayKey ? "today" : ""} ${cell.active ? "worked" : ""}`}
                style={{ borderColor: cell.active ? gradeColor(cell.grade) : undefined }}
                title={`${prettyDate(cell.key)}: ${cell.minutes}m, ${cell.cards} cards`}
                onClick={() => (location.hash = "productivity")}>
                <span>{cell.date.getDate()}</span>
                <i style={{ background: cell.active ? gradeColor(cell.grade) : "rgba(255,255,255,0.08)" }} />
              </button>
            : <span className="cal-day blank" key={`blank-${i}`} />)}
        </div>
        <div className="schedule-side">
          <div className="schedule-stat">
            <CalendarDays size={15} />
            <div><b>{schedule.weekMinutes}m</b><span>this week · {schedule.weekCards} cards</span></div>
          </div>
          <div className="schedule-stat">
            <Clock size={15} />
            <div><b>{schedule.monthMinutes}m</b><span>this month · {schedule.monthActive}/{schedule.days.length} active</span></div>
          </div>
          <div className="schedule-note">
            <b>{schedule.noteTitle}</b>
            <span>{schedule.noteBody}</span>
          </div>
        </div>
      </div>
      <div className="heat-legend">
        <span className="lg"><span className="sw" style={{ background: "rgba(255,85,99,0.8)" }} /> Red: logged, below baseline</span>
        <span className="lg"><span className="sw" style={{ background: "rgba(255,159,67,0.82)" }} /> Orange: solid day</span>
        <span className="lg"><span className="sw" style={{ background: "rgba(70,210,126,0.78)" }} /> Green: strong day</span>
        <span className="lg"><span className="sw" style={{ background: "rgba(77,141,255,0.88)" }} /> Blue: excellent day</span>
      </div>
      <div className="pass-legend">
        <span><i style={{ background: PASS_COLOR.red }} />1 pass: red</span>
        <span><i style={{ background: PASS_COLOR.young }} />2 passes: young</span>
        <span><i style={{ background: PASS_COLOR.mature }} />3 passes: mature</span>
        <span><i style={{ background: PASS_COLOR.mastered }} />4+: mastered</span>
      </div>
    </GlassCard>
  );
}

function TermMapWidget({
  termMap, trackShort, tracker,
}: {
  termMap: ReturnType<typeof buildTermSequence>;
  trackShort: string;
  tracker: TrackerItem[];
}) {
  return (
    <GlassCard pad className="term-map-card">
      <PanelHeader title="Term Map" sub={`${trackShort} runway: user-created course shells, modules, tracker maturity, and review pressure`}
        action={<div className="term-map-actions"><Tag tone={termMap.ready >= 70 ? "green" : termMap.ready >= 35 ? "orange" : "neutral"}>{termMap.ready}% overall</Tag><a className="gbtn sm" href="#courses">Open Courses <ArrowRight size={14} /></a></div>} />
      <div className="term-map-overview">
        <div><b>{termMap.entries.length}</b><span>active nodes</span></div>
        <div><b>{termMap.modules}</b><span>modules</span></div>
        <div><b>{termMap.review}</b><span>review signals</span></div>
      </div>
      <div className="term-sequence" aria-label="Term sequence">
        {termMap.entries.map(({ term, courses, stats }, index) => {
          const current = index === termMap.focusIndex;
          return (
            <section className={`term-node-card ${current ? "current" : ""}`} key={term.id}>
              <div className="term-node-cap">
                <span className="term-index">T{index + 1}</span>
                <div>
                  <b>{term.name}</b>
                  <span>{stats.primaryCode || "Course shell"} · {stats.modules} module{stats.modules === 1 ? "" : "s"}</span>
                </div>
                <Tag tone={current ? "cyan" : stats.ready >= 70 ? "green" : stats.ready >= 35 ? "orange" : "neutral"}>{current ? "focus" : `${stats.ready}%`}</Tag>
              </div>
              <div className="term-course-lane">
                {courses.map((course) => {
                  const courseStats = summarizeCourse(course, tracker);
                  return (
                    <button className="term-course-pill" key={course.id} onClick={() => (location.hash = "courses")}>
                      <div className="spread">
                        <b>{course.code}</b>
                        <span>{courseStats.items ? `${courseStats.ready}%` : "shell"}</span>
                      </div>
                      <em>{course.name || "Course shell"}</em>
                      <small>{course.modules.length} modules · {courseStats.items || 0} tracker rows{courseStats.review ? ` · ${courseStats.review} review` : ""}</small>
                    </button>
                  );
                })}
                {!courses.length && <div className="term-empty">Add a course shell for this term.</div>}
              </div>
              <div className="term-node-meter">
                <div className="spread"><span>Readiness</span><b>{stats.ready}%</b></div>
                <div className="track">
                  <div className="track-fill" style={{ width: `${stats.ready}%`, background: stats.ready >= 70 ? PASS_COLOR.mastered : stats.ready >= 35 ? PASS_COLOR.young : "rgba(90,215,239,0.34)" }} />
                </div>
              </div>
              <div className="term-node-signals">
                <span>{stats.items} tracked</span>
                <span>{stats.review} review</span>
                <span>{stats.highYield} high-yield</span>
              </div>
              <div className="term-module-row">
                {stats.moduleNames.slice(0, 5).map((module) => <span key={module}>{module}</span>)}
                {stats.moduleNames.length > 5 && <span>+{stats.moduleNames.length - 5}</span>}
                {!stats.moduleNames.length && <span>Modules ready to add</span>}
              </div>
            </section>
          );
        })}
      </div>
    </GlassCard>
  );
}

function LocalDataWidget({ state }: { state: ReturnType<typeof useStore.getState> }) {
  return (
    <GlassCard pad className="local-data-card">
      <PanelHeader title="Local Data & Package" sub="Your online edits persist in this browser; exported backups move between installs"
        action={<GButton size="sm" onClick={() => exportState(state)}><Download size={14} /> Export backup</GButton>} />
      <div className="alpha-notice">
        <span className="alpha-pill">ALPHA</span>
        <span>Web redeployments keep this browser vault intact. Export backups before switching devices, browsers, or domains.</span>
      </div>
      <div className="local-data-grid">
        <div className="local-data-item">
          <Database size={17} />
          <div>
            <b>Local Vault</b>
            <span>IndexedDB with localStorage fallback. Seed updates will not overwrite your saved profile.</span>
          </div>
        </div>
        <div className="local-data-item">
          <ShieldCheck size={17} />
          <div>
            <b>Private by default</b>
            <span>No account server is required. Data stays on the current browser/device unless exported.</span>
          </div>
        </div>
        <div className="local-data-item">
          <PackageCheck size={17} />
          <div>
            <b>Future login path</b>
            <span>Settings → Account & Sync can initialize a profile, save cloud snapshots, and restore backups.</span>
          </div>
        </div>
        <a className="local-data-item" href={HOSTED_ALPHA_URL} target="_blank" rel="noreferrer">
          <ExternalLink size={17} />
          <div>
            <b>Hosted Alpha</b>
            <span>Open the Vercel instance for website embedding, API routes, and cloud-sync testing.</span>
          </div>
        </a>
      </div>
    </GlassCard>
  );
}

function LatestStandupWidget() {
  const entry = useStore((state) => state.journal[0]);
  return (
    <GlassCard pad>
      <PanelHeader title="Latest standup" sub="From your Journal" />
      {entry ? (
        <div className="journal-card">
          <div className="jc-date">{prettyDate(entry.date)}</div>
          <div className="jc-line"><b>Today:</b> {entry.today}</div>
          <div className="jc-line dim"><b>Tomorrow:</b> {entry.tomorrow}</div>
        </div>
      ) : <div className="dim">No journal entries yet.</div>}
    </GlassCard>
  );
}

function ProductivityTrendWidget({
  performance,
  week,
}: {
  performance: ReturnType<typeof analyzePerformance>;
  week: ReturnType<typeof weeklySummary>;
}) {
  return (
    <GlassCard pad>
      <PanelHeader title="Productivity Trend" sub="A short read on the week, not another noisy chart"
        action={<Tag tone={performance.performanceScore >= 70 ? "green" : performance.performanceScore >= 45 ? "orange" : "neutral"}>{performance.performanceScore}/100</Tag>} />
      <div className="trend-widget">
        <div><b>{Math.round(week.minutes / 60)}h</b><span>this week</span></div>
        <div><b>{week.activeDays}/7</b><span>active days</span></div>
        <div><b>{week.cards}</b><span>cards</span></div>
      </div>
      <div className="trend-comment">{performance.recommendation}</div>
    </GlassCard>
  );
}

function PremedHoursWidget() {
  const entries = useStore((state) => state.premedExperiences ?? []);
  const total = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const clinical = entries.filter((entry) => entry.kind === "Clinical" || entry.kind === "Shadowing").reduce((sum, entry) => sum + entry.hours, 0);
  const service = entries.filter((entry) => entry.kind === "Service").reduce((sum, entry) => sum + entry.hours, 0);
  const verified = entries.filter((entry) => entry.verified).reduce((sum, entry) => sum + entry.hours, 0);
  return (
    <GlassCard pad>
      <PanelHeader title="Pre-Med Hours" sub="Clinical, service, research, and verification evidence"
        action={<a className="gbtn sm" href="#premed">Open <ArrowRight size={14} /></a>} />
      <div className="trend-widget">
        <div><b>{total}</b><span>total</span></div>
        <div><b>{clinical}</b><span>clinical/shadow</span></div>
        <div><b>{verified}</b><span>verified</span></div>
      </div>
      <div className="premed-mini-bars">
        <ProgressBar label="Clinical + shadowing" value={clinical} target={150} pct={Math.min(100, Math.round((clinical / 150) * 100))} color="var(--green)" />
        <ProgressBar label="Service" value={service} target={100} pct={Math.min(100, Math.round((service / 100) * 100))} color="var(--cyan)" />
      </div>
    </GlassCard>
  );
}

function ResourceFocusWidget() {
  const s = useStore();
  const favorites = s.resources.filter((resource) => resource.favorite).slice(0, 4);
  const drives = s.resources.filter((resource) => resource.category === "Drives").length;
  return (
    <GlassCard pad>
      <PanelHeader title="Resource Focus" sub={`${favorites.length} pinned resources · ${drives} drives`}
        action={<a className="gbtn sm" href="#resources">Library <LinkIcon size={14} /></a>} />
      <div className="stack gap8">
        {favorites.length ? favorites.map((resource) => (
          <a className="sugg clickable" href={resource.url} target="_blank" rel="noreferrer" key={resource.id}>
            <span className="sugg-dot" style={{ background: "var(--cyan)" }} />
            <div className="grow">
              <div className="sugg-title">{resource.title}</div>
              <div className="sugg-reason">{resource.category}</div>
            </div>
            <ExternalLink size={14} />
          </a>
        )) : <div className="dim">Favorite resources to make this widget useful.</div>}
      </div>
    </GlassCard>
  );
}

function BoardBlueprintWidget() {
  const s = useStore();
  const active = s.profile.activeFocusId ?? "step1";
  const exam: "step1" | "step2" | "step3" | "shelf" | "mcat" | "premed" =
    active === "step2" || active === "step3" || active === "shelf" || active === "mcat" || active === "premed" ? active : "step1";
  const prep = s.boardPrep[exam];
  const logs = prep?.blueprintLogs ?? [];
  const minutes = logs.slice(0, 7).reduce((sum, log) => sum + log.minutes, 0);
  return (
    <GlassCard pad>
      <PanelHeader title="Blueprint Pulse" sub="Current prep lane status"
        action={<a className="gbtn sm" href={exam === "premed" || exam === "mcat" ? "#premed" : "#step"}><Brain size={14} /> Open</a>} />
      <div className="trend-widget">
        <div><b>{exam.toUpperCase()}</b><span>lane</span></div>
        <div><b>{logs.length}</b><span>logs</span></div>
        <div><b>{minutes}m</b><span>recent</span></div>
      </div>
      <div className="trend-comment">{logs.length ? "Keep turning blueprint logs into tracker rows and question repair." : "Install a blueprint or log one focused block to generate signal."}</div>
    </GlassCard>
  );
}

const OUTCOMES: { key: "won" | "partial" | "missed"; label: string; tone: "green" | "orange" | "red" }[] = [
  { key: "won", label: "Won it", tone: "green" },
  { key: "partial", label: "Partial", tone: "orange" },
  { key: "missed", label: "Missed", tone: "red" },
];

// "Win the day": a morning intention, an end-of-day review, and a gentle
// carry-over nudge if a past day was planned but never closed out.
function WinTheDay() {
  const s = useStore();
  const today = s.activeDayKey;
  const todayPlan = s.dayPlans.find((p) => p.dayKey === today);
  const pendingPast = s.dayPlans
    .filter((p) => p.dayKey < today && !p.reviewedAt)
    .sort((a, b) => b.dayKey.localeCompare(a.dayKey))[0];

  const [intention, setIntention] = useState("");
  const [wins, setWins] = useState("");
  const [note, setNote] = useState("");
  const [showWrapPrompt, setShowWrapPrompt] = useState(false);

  const openTasks = s.tasks.filter((t) => !t.done && !t.archived).slice(0, 3);
  const reviewDue = isAfterLocalTime(s.profile.journalReviewTime ?? "20:00");

  useEffect(() => {
    if (todayPlan && !todayPlan.outcome && reviewDue) setShowWrapPrompt(true);
  }, [reviewDue, todayPlan?.dayKey, todayPlan?.outcome]);

  function save() {
    if (!intention.trim()) return;
    s.setDayPlan(today, intention.trim(), wins.split("\n").map((w) => w.trim()).filter(Boolean));
    setIntention(""); setWins("");
  }

  return (
    <GlassCard pad className="win-day" data-tour="intention">
      {showWrapPrompt && todayPlan && !todayPlan.outcome && (
        <div className="journal-wrap-popover">
          <button className="ghost-btn" onClick={() => setShowWrapPrompt(false)} title="Dismiss"><X size={14} /></button>
          <div className="journal-wrap-mark"><BookText size={18} /></div>
          <div>
            <b>Wrap up the day</b>
            <span>{wrapUpMessage(today)} Review “{todayPlan.intention}”, then turn it into a useful standup.</span>
          </div>
          <a className="gbtn sm primary" href="#journal">Open Journal</a>
        </div>
      )}
      {pendingPast && (
        <div className="carry-over">
          <ArrowRightCircle size={16} />
          <div className="grow">
            <b>You planned {prettyDate(`${pendingPast.dayKey}T12:00:00`)} but never closed it out.</b>
            <span>“{pendingPast.intention}” — did you get it done?</span>
          </div>
          <div className="row gap6">
            {OUTCOMES.map((o) => (
              <button key={o.key} className={`gbtn tiny ${o.tone === "green" ? "primary" : ""}`}
                onClick={() => s.reviewDayPlan(pendingPast.dayKey, o.key)}>{o.label}</button>
            ))}
          </div>
        </div>
      )}

      {!todayPlan ? (
        <>
          <PanelHeader title="Win the day" sub="Set one intention before you start — how would today be a win?" />
          <div className="stack gap8">
            <input className="field" placeholder="e.g. Finish NB3 lectures + 100 cards, no doomscrolling"
              value={intention} onChange={(e) => setIntention(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} autoFocus />
            <textarea className="field" rows={2} placeholder="Win conditions (one per line, optional)"
              value={wins} onChange={(e) => setWins(e.target.value)} />
            <div className="row">
              <GButton variant="primary" className="right" onClick={save}><Sunrise size={15} /> Set today's intention</GButton>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="panel-head">
            <div>
              <div className="panel-title">Today's intention</div>
              <div className="panel-sub">“{todayPlan.intention}”</div>
            </div>
            {todayPlan.outcome
              ? <Tag tone={OUTCOMES.find((o) => o.key === todayPlan.outcome)?.tone ?? "neutral"}>
                  <Trophy size={12} /> {OUTCOMES.find((o) => o.key === todayPlan.outcome)?.label}
                </Tag>
              : <button className="gbtn tiny" onClick={() => s.setDayPlan(today, "", [])}>Reset</button>}
          </div>

          {todayPlan.wins.length > 0 && (
            <div className="win-conditions">
              {todayPlan.wins.map((w, i) => <span key={i} className="win-cond"><Check size={12} /> {w}</span>)}
            </div>
          )}

          {openTasks.length > 0 && (
            <div className="win-tasks">
              <div className="field-label" style={{ marginBottom: 6 }}>Check off as you go</div>
              {openTasks.map((t) => (
                <button key={t.id} className="win-task" onClick={() => s.toggleTask(t.id)}>
                  <Circle size={15} /> <span>{t.title}</span>
                  {t.scope && <Tag tone="neutral">{t.scope}</Tag>}
                </button>
              ))}
            </div>
          )}

          {!todayPlan.outcome && (
            <div className="win-review">
              <input className="field grow" placeholder="End-of-day note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              {OUTCOMES.map((o) => (
                <GButton key={o.key} size="sm" variant={o.tone === "green" ? "primary" : "default"}
                  onClick={() => s.reviewDayPlan(today, o.key, note.trim() || undefined)}>{o.label}</GButton>
              ))}
            </div>
          )}
          {!todayPlan.outcome && reviewDue && (
            <div className="journal-follow-nudge">
              <BookText size={15} />
              <span>It is past your journal follow-up time. Review today’s intention, then write the standup.</span>
              <a className="gbtn tiny" href="#journal">Open Journal</a>
            </div>
          )}
          {todayPlan.outcome && (
            <div className="row gap8" style={{ marginTop: 10 }}>
              <GhostButton onClick={() => s.reviewDayPlan(today, undefined)} title="Re-open review"><ArrowRight size={14} /></GhostButton>
              <span className="sub">Reviewed{todayPlan.reviewNote ? ` — “${todayPlan.reviewNote}”` : ""}. Want to log it as a standup? Open Journal.</span>
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}

interface AiMove { title: string; why: string; mode: string; effortMinutes: number; itemId?: string; route?: string }

// AI-backed "what should I do right now" queue. Builds context from the live
// tracker/tasks/board-prep state so the mock (or configured) provider can react
// to the same signals as the rule-based "Suggested next moves" card.
function AiSuggestedActions() {
  const s = useStore();
  const [queue, setQueue] = useState<AiMove[] | null>(null);
  const [rule, setRule] = useState("");
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchSuggestions() {
    setLoading(true);
    setError("");
    try {
      const weakAreas = [...new Set(
        s.tracker.filter((t) => t.yield === "review" || t.yield === "high").map((t) => t.label),
      )].slice(0, 5);
      const dueReviews = s.tracker.filter((t) => t.yield === "review" || t.passes < 2).length;
      const tasks = s.tasks.filter((t) => !t.done).map((t) => t.title);
      const focusCourse = s.courses[0];
      const exam: "step1" | "step2" = s.profile.phase === "step2-dedicated" ? "step2" : "step1";

      const res = await runAi("next-move", {
        userId: s.profile.userId,
        context: {
          weakAreas,
          dueReviews,
          tasks,
          currentCourse: focusCourse?.code,
          stepStatus: s.boardPrep[exam]?.contentStarted,
        },
      });

      const result = res.result as { queue?: AiMove[]; rule?: string };
      setQueue(result.queue ?? []);
      setRule(result.rule ?? "");
      setProvider(res.provider);
    } catch {
      const local = buildLocalAiQueue(s);
      setQueue(local.queue);
      setRule(local.rule);
      setProvider("local strategist");
      setError("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSuggestions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GlassCard pad>
      <PanelHeader title="AI Suggested Actions" sub="Context-aware queue from your tracker, tasks, and board prep"
        action={
          <div className="row gap6">
            {provider && <Tag tone="purple">{provider}</Tag>}
            <GhostButton title="Refresh" onClick={fetchSuggestions} disabled={loading}>
              <RefreshCw size={15} className={loading ? "spin" : ""} />
            </GhostButton>
          </div>} />

      {error && <div className="sub" style={{ color: "var(--red)" }}>Couldn't reach the AI service: {error}</div>}

      {!error && (
        <div className="stack gap8">
          {(queue ?? []).map((move, i) => {
            const clickable = Boolean(move.itemId || move.route);
            const go = () => { if (move.itemId) gotoTrackerItem(move.itemId); else if (move.route) location.hash = move.route; };
            return (
            <div className={`sugg ${clickable ? "clickable" : ""}`} key={i}
              role={clickable ? "button" : undefined} tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? go : undefined}>
              <span className="sugg-dot" style={{ background: i === 0 ? "var(--cyan)" : "var(--purple)" }} />
              <div className="grow">
                <div className="sugg-title">{move.title}</div>
                <div className="sugg-reason">{move.why} · {move.mode} · ~{move.effortMinutes}m</div>
              </div>
              {clickable ? <ArrowRight size={15} style={{ color: "var(--cyan)" }} /> : <Bot size={15} style={{ color: "var(--cyan)" }} />}
            </div>
          );})}
          {!loading && queue && queue.length === 0 && (
            <div className="dim">No AI suggestions yet — keep logging study activity and check back.</div>
          )}
          {loading && !queue && <div className="dim">Thinking…</div>}
        </div>
      )}

      {rule && <div className="sub" style={{ marginTop: 8 }}>{rule}</div>}
    </GlassCard>
  );
}

function buildLocalAiQueue(s: ReturnType<typeof useStore.getState>): { queue: AiMove[]; rule: string } {
  const trackerMoves = suggestMoves(s.tracker, 2);
  const openTasks = s.tasks.filter((t) => !t.done && !t.archived);
  const dueReviews = s.tracker.filter((t) => t.yield === "review" || t.passes < 2).length;
  const phase = s.profile.phase || "preclinical";
  const queue: AiMove[] = trackerMoves.map((move, index) => ({
    title: move.title,
    why: move.reason,
    mode: index === 0 ? "active recall" : "targeted repair",
    effortMinutes: index === 0 ? 35 : 25,
    itemId: move.itemId,
  }));

  if (openTasks.length) {
    queue.push({
      title: `Clear: ${openTasks[0].title}`,
      why: `${openTasks.length} open task${openTasks.length === 1 ? "" : "s"} are competing with study execution.`,
      mode: "task closure",
      effortMinutes: 15,
      route: "tasks",
    });
  }

  if (!queue.length) {
    queue.push({
      title: phase.includes("step") ? "Run a timed question block" : "Log one focused study block",
      why: dueReviews ? `${dueReviews} review signals need fresh evidence.` : "No urgent signal yet; generate signal with retrieval or questions.",
      mode: "signal generation",
      effortMinutes: phase.includes("step") ? 45 : 30,
      route: phase.includes("step") ? "step" : "productivity",
    });
  }

  return {
    queue: queue.slice(0, 4),
    rule: "Local strategist fallback: prioritize review flags, red/untouched items, then one small task closure. Configure Vercel API + AI_PROVIDER for provider-backed output.",
  };
}

function ProgressBar({
  label, value, target, pct, color,
}: { label: string; value: number; target: number; pct: number; color: string }) {
  return (
    <div className="stack gap6">
      <div className="spread" style={{ fontSize: 12 }}>
        <span className="muted" style={{ fontWeight: 700 }}>{label}</span>
        <span className="dim">{value} / {target}</span>
      </div>
      <div className="track"><div className="track-fill" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

interface DashSuggestion { title: string; reason: string; color: string; itemId?: string; route?: string }

function buildSuggestions(s: ReturnType<typeof useStore.getState>): DashSuggestion[] {
  const out: DashSuggestion[] = [];

  out.push(...suggestMoves(s.tracker, 3).map((sg) => ({ title: sg.title, reason: sg.reason, color: sg.color, itemId: sg.itemId })));

  const open = s.tasks.filter((t) => !t.done);
  if (open.length) out.push({ title: `Clear ${open.length} open task${open.length > 1 ? "s" : ""}`, reason: open[0].title, color: "var(--orange)", route: "tasks" });

  const young = s.tracker.filter((t) => t.passes > 0 && t.passes < 3);
  if (young.length) out.push({ title: `Push ${young.length} young/red item${young.length > 1 ? "s" : ""} to mature`, reason: "One focused pass can stabilize the weak middle.", color: "var(--cyan)", route: "tracker" });

  if (!out.length) out.push({ title: "You're on track", reason: "Nothing urgent — keep the streak going", color: "var(--green)" });
  return out.slice(0, 4);
}

function buildTermSequence(terms: Term[], courses: Course[], tracker: TrackerItem[]) {
  const entries = terms.map((term) => {
    const termCourses = courses.filter((course) => course.termId === term.id);
    return { term, courses: termCourses, stats: summarizeTermCourses(termCourses, tracker) };
  });
  const ready = entries.length ? Math.round(entries.reduce((sum, entry) => sum + entry.stats.ready, 0) / entries.length) : 0;
  const focus = entries.findIndex((entry) => entry.courses.length > 0 && (entry.stats.ready < 70 || entry.stats.review > 0));
  return {
    entries,
    ready,
    focusIndex: focus >= 0 ? focus : Math.max(0, entries.length - 1),
    courseCount: courses.length,
    modules: entries.reduce((sum, entry) => sum + entry.stats.modules, 0),
    review: entries.reduce((sum, entry) => sum + entry.stats.review, 0),
  };
}

function summarizeTermCourses(courses: Course[], tracker: TrackerItem[]) {
  const stats = courses.map((course) => summarizeCourse(course, tracker));
  const ready = stats.length ? Math.round(stats.reduce((sum, item) => sum + item.ready, 0) / stats.length) : 0;
  const moduleNames = courses.flatMap((course) => course.modules.map((module) => module.name));
  return {
    ready,
    primaryCode: courses.map((course) => course.code).join(" / "),
    modules: courses.reduce((sum, course) => sum + course.modules.length, 0),
    items: stats.reduce((sum, item) => sum + item.items, 0),
    review: stats.reduce((sum, item) => sum + item.review, 0),
    highYield: stats.reduce((sum, item) => sum + item.highYield, 0),
    moduleNames,
  };
}

function summarizeCourse(course: Course, tracker: TrackerItem[]) {
  const needles = [
    course.code,
    course.code.replace(/\s+/g, ""),
    course.name,
    ...course.modules.map((module) => module.name),
  ].map((value) => value.toLowerCase()).filter(Boolean);
  const items = tracker.filter((item) => {
    const hay = `${item.path} ${item.label}`.toLowerCase().replace(/\s+/g, "");
    return needles.some((needle) => hay.includes(needle.replace(/\s+/g, "")));
  });
  const ready = items.length
    ? Math.round(items.reduce((sum, item) => sum + Math.min(100, (Math.min(item.passes, 4) / 4) * 100), 0) / items.length)
    : 0;
  const review = items.filter((item) => item.yield === "review" || item.passes < 2).length;
  const highYield = items.filter((item) => item.yield === "high").length;
  return { items: items.length, ready, review, highYield };
}

function weeklySummary(logs: ReturnType<typeof useStore.getState>["logs"]) {
  const days = lastNDays(7).map((d) => {
    const key = isoDate(d);
    const totals = dayTotals(logs, key);
    const grade = todayGrade(totals.minutes, totals.cards);
    const intensity = Math.min(100, Math.max((totals.minutes / 480) * 100, (totals.cards / 350) * 100));
    return {
      key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
      minutes: totals.minutes,
      cards: totals.cards,
      grade,
      intensity,
    };
  });
  const minutes = days.reduce((a, d) => a + d.minutes, 0);
  const cards = days.reduce((a, d) => a + d.cards, 0);
  const activeDays = days.filter((d) => d.minutes > 0 || d.cards > 0).length;
  return {
    days,
    minutes,
    cards,
    activeDays,
    tasksDone: useStore.getState().tasks.filter((t) => t.done && t.completedAt && days.some((d) => t.completedAt?.startsWith(d.key))).length,
    grade: todayGrade(Math.round(minutes / Math.max(activeDays, 1)), Math.round(cards / Math.max(activeDays, 1))),
  };
}

interface ScheduleDay {
  key: string;
  date: Date;
  minutes: number;
  cards: number;
  grade: Grade;
  active: boolean;
}

function buildDashboardSchedule(
  logs: ReturnType<typeof useStore.getState>["logs"],
  tasks: ReturnType<typeof useStore.getState>["tasks"],
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = isoDate(today);
  const days = currentMonthDays(today).map((date) => {
    const key = isoDate(date);
    const totals = dayTotals(logs, key);
    return {
      key,
      date,
      minutes: totals.minutes,
      cards: totals.cards,
      grade: todayGrade(totals.minutes, totals.cards),
      active: totals.minutes > 0 || totals.cards > 0,
    };
  });
  const cells = buildMonthCells(days);
  const monthMinutes = days.reduce((sum, day) => sum + day.minutes, 0);
  const monthCards = days.reduce((sum, day) => sum + day.cards, 0);
  const monthActive = days.filter((day) => day.active).length;
  const weekStart = startOfWeek(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekDays = days.filter((day) => day.date >= weekStart && day.date <= weekEnd);
  const weekMinutes = weekDays.reduce((sum, day) => sum + day.minutes, 0);
  const weekCards = weekDays.reduce((sum, day) => sum + day.cards, 0);
  const weekActive = weekDays.filter((day) => day.active).length;
  const dueThisWeek = tasks.filter((task) => task.due && task.due >= isoDate(weekStart) && task.due <= isoDate(weekEnd) && !task.done).length;
  const monthLabel = today.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const noteTitle = weekActive >= 5 ? "Strong weekly cadence" : weekActive >= 3 ? "Good base forming" : "Schedule needs a floor";
  const noteBody = weekActive >= 5
    ? "You have enough active days to protect retention. Keep the next sessions mixed: questions, review, then Anki."
    : weekActive >= 3
      ? "The week is alive. Add one short retrieval block on the next quiet day."
      : "It is okay to pick the pace back up. Start with one 30-minute block and mark it here.";

  return {
    todayKey,
    days,
    cells,
    monthLabel,
    monthMinutes,
    monthCards,
    monthActive,
    weekMinutes,
    weekCards,
    weekActive,
    dueThisWeek,
    noteTitle,
    noteBody: dueThisWeek ? `${noteBody} ${dueThisWeek} open task${dueThisWeek === 1 ? "" : "s"} due this week.` : noteBody,
  };
}

function currentMonthDays(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const out: Date[] = [];
  for (let day = 1; day <= last.getDate(); day++) {
    out.push(new Date(first.getFullYear(), first.getMonth(), day));
  }
  return out;
}

function buildMonthCells(days: ScheduleDay[]): Array<ScheduleDay | null> {
  const blanks = days[0]?.date.getDay() ?? 0;
  return [...Array.from({ length: blanks }, () => null), ...days];
}

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function isAfterLocalTime(value: string): boolean {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const [, hh, mm] = match;
  const now = new Date();
  const target = new Date();
  target.setHours(Number(hh), Number(mm), 0, 0);
  return now >= target;
}

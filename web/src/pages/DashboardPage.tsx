import { useEffect, useState } from "react";
import {
  Inbox, ArrowDownToLine, Layers, Clock, ListChecks, BookText, Sparkles, ArrowRight,
  Flame, Database, Download, ShieldCheck, PackageCheck, CalendarDays,
  Sunrise, Trophy, Check, Circle, ArrowRightCircle, RefreshCw, Bot,
} from "lucide-react";
import { useStore } from "../lib/store";
import { dayTotals, todayGrade, gradeLabel, gradeColor, prettyDate, studyStreak, lastNDays, isoDate } from "../lib/scoring";
import type { Grade } from "../lib/scoring";
import type { Course, Term, TrackerItem } from "../lib/types";
import { PASS_COLOR, scopeMastery, suggestMoves } from "../lib/tracker";
import { exportState } from "../lib/backup";
import { APP_BUILD_LABEL, APP_RELEASE_VERSION, SCHEMA_VERSION } from "../lib/seed";
import { StatCard } from "../components/ui/StatCard";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag } from "../components/ui/primitives";
import { runAi } from "../services/aiClient";

export function DashboardPage() {
  const s = useStore();
  const today = dayTotals(s.logs, s.activeDayKey);
  const grade = todayGrade(today.minutes, today.cards);
  const openTasks = s.tasks.filter((t) => !t.done).length;
  const doneToday = s.tasks.filter((t) => t.done && t.completedAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const inboxFolder = s.folders.find((f) => /inbox/i.test(f.name));
  const matureItems = s.tracker.filter((t) => t.passes >= 3).length;
  const masteredItems = s.tracker.filter((t) => t.passes >= 4).length;
  const trackerReady = scopeMastery(s.tracker);
  const reviewItems = s.tracker.filter((t) => t.yield === "review" || t.passes < 2).length;

  const streak = studyStreak(s.logs);
  const week = weeklySummary(s.logs);
  const cardTarget = s.profile.dailyCardTarget || 120;
  const minTarget = s.profile.dailyMinuteTarget || 240;
  const cardPct = Math.min(100, Math.round((today.cards / cardTarget) * 100));
  const minPct = Math.min(100, Math.round((today.minutes / minTarget) * 100));
  const targetsMet = today.cards >= cardTarget && today.minutes >= minTarget;

  const suggestions = buildSuggestions(s);
  const schedule = buildDashboardSchedule(s.logs, s.tasks);
  const termMap = buildTermSequence(s.terms, s.courses, s.tracker);

  return (
    <>
      <AlphaBuildBanner
        activeDayKey={s.activeDayKey}
        courseCount={s.courses.length}
        termCount={s.terms.length}
      />

      <div className="grid grid-stats">
        <StatCard title="Inbox" value={`${inboxFolder ? 1 : 0}`} note="folders to sort" icon={<Inbox size={18} />}
          trend={s.folders.length > 3 ? "Heavy" : "Clean"} trendTone={s.folders.length > 3 ? "orange" : "green"} />
        <StatCard title="Courses" value={`${s.courses.length}`} note={`${s.terms.length} terms`} icon={<ArrowDownToLine size={18} />}
          trend="Mapped" trendTone="cyan" />
        <StatCard title="Anki" value={`${today.cards}`} note="cards today" icon={<Layers size={18} />}
          trend="🃏" trendTone="neutral" />
        <StatCard title="Study" value={`${today.minutes}m`} note="logged today" icon={<Clock size={18} />}
          trend={gradeLabel(grade)} trendTone={grade === "red" ? "red" : grade === "orange" ? "orange" : grade === "green" ? "green" : "cyan"} />
        <StatCard title="Tasks" value={`${openTasks}`} note={`${doneToday} done today`} icon={<ListChecks size={18} />}
          trend="Execute" trendTone="cyan" />
        <StatCard title="Journal" value={`${s.journal.length}`} note="standups" icon={<BookText size={18} />}
          trend="Reflect" trendTone="purple" />
        <StatCard title="Tracker" value={`${trackerReady}%`} note={`${matureItems} mature · ${reviewItems} need attention`} icon={<BadgeDot />}
          trend={`${masteredItems} mastered`} trendTone="green" />
      </div>

      <WinTheDay />

      <div className="dashboard-prime">
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
              <div className="dim" style={{ fontSize: 11.5 }}>Study day {s.activeDayKey}</div>
            </div>
          </div>
          {targetsMet && (
            <div className="enough-note">✓ You've hit today's target. Stopping here is a win — protect the streak, not the maximum.</div>
          )}
        </GlassCard>

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
          <div className="week-bars">
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

        <GlassCard pad>
          <PanelHeader title="Suggested next moves" sub="Reactive to your current state" />
          <div className="stack gap8">
            {suggestions.map((sg, i) => (
              <div className="sugg" key={i}>
                <span className="sugg-dot" style={{ background: sg.color }} />
                <div className="grow">
                  <div className="sugg-title">{sg.title}</div>
                  <div className="sugg-reason">{sg.reason}</div>
                </div>
                <Sparkles size={15} style={{ color: "var(--cyan)" }} />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <AiSuggestedActions />

      <GlassCard pad className="dashboard-schedule-card">
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

      <GlassCard pad className="term-map-card">
        <PanelHeader title="Term Map" sub="SGU academic runway: course shells, modules, tracker maturity, and review pressure"
          action={<div className="term-map-actions"><Tag tone={termMap.ready >= 70 ? "green" : termMap.ready >= 35 ? "orange" : "neutral"}>{termMap.ready}% overall</Tag><a className="gbtn sm" href="#courses">Open Courses <ArrowRight size={14} /></a></div>} />
        <div className="term-map-overview">
          <div><b>{termMap.entries.length}</b><span>terms mapped</span></div>
          <div><b>{termMap.courseCount}</b><span>course shells</span></div>
          <div><b>{termMap.modules}</b><span>modules</span></div>
          <div><b>{termMap.review}</b><span>review signals</span></div>
        </div>
        <div className="term-sequence" aria-label="SGU term sequence">
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
                    const courseStats = summarizeCourse(course, s.tracker);
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

      <GlassCard pad className="local-data-card">
        <PanelHeader title="Local Data & Package" sub="Your online edits persist in this browser; exported backups move between installs"
          action={<GButton size="sm" onClick={() => exportState(s)}><Download size={14} /> Export backup</GButton>} />
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
              <b>Download package</b>
              <span>The package runs from the built static app, not the dev localhost server.</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="Latest standup" sub="From your Journal" />
        {s.journal[0] ? (
          <div className="journal-card">
            <div className="jc-date">{prettyDate(s.journal[0].date)}</div>
            <div className="jc-line"><b>Today:</b> {s.journal[0].today}</div>
            <div className="jc-line dim"><b>Tomorrow:</b> {s.journal[0].tomorrow}</div>
          </div>
        ) : <div className="dim">No journal entries yet.</div>}
      </GlassCard>
    </>
  );
}

function AlphaBuildBanner({
  activeDayKey, courseCount, termCount,
}: {
  activeDayKey: string;
  courseCount: number;
  termCount: number;
}) {
  return (
    <GlassCard pad className="alpha-build-banner">
      <div className="alpha-build-mark">
        <PackageCheck size={19} />
      </div>
      <div className="alpha-build-copy">
        <span>First alpha package</span>
        <b>{APP_BUILD_LABEL}</b>
        <p>Local-first web build, Vercel-ready backend shell, and packaged-download workflow.</p>
      </div>
      <div className="alpha-build-meta">
        <span><ShieldCheck size={13} /> Version v{APP_RELEASE_VERSION}</span>
        <span><Database size={13} /> Schema {SCHEMA_VERSION}</span>
        <span><CalendarDays size={13} /> Study day {activeDayKey}</span>
        <span>{termCount} terms · {courseCount} courses</span>
      </div>
    </GlassCard>
  );
}

function BadgeDot() {
  return <span className="badge-dot-icon" aria-hidden="true" />;
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

  const openTasks = s.tasks.filter((t) => !t.done && !t.archived).slice(0, 5);

  function save() {
    if (!intention.trim()) return;
    s.setDayPlan(today, intention.trim(), wins.split("\n").map((w) => w.trim()).filter(Boolean));
    setIntention(""); setWins("");
  }

  return (
    <GlassCard pad className="win-day">
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

interface AiMove { title: string; why: string; mode: string; effortMinutes: number }

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
    } catch (e) {
      setError((e as Error).message);
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
          {(queue ?? []).map((move, i) => (
            <div className="sugg" key={i}>
              <span className="sugg-dot" style={{ background: i === 0 ? "var(--cyan)" : "var(--purple)" }} />
              <div className="grow">
                <div className="sugg-title">{move.title}</div>
                <div className="sugg-reason">{move.why} · {move.mode} · ~{move.effortMinutes}m</div>
              </div>
              <Bot size={15} style={{ color: "var(--cyan)" }} />
            </div>
          ))}
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

function buildSuggestions(s: ReturnType<typeof useStore.getState>) {
  const out: { title: string; reason: string; color: string }[] = [];

  out.push(...suggestMoves(s.tracker, 3).map((sg) => ({ title: sg.title, reason: sg.reason, color: sg.color })));

  const open = s.tasks.filter((t) => !t.done);
  if (open.length) out.push({ title: `Clear ${open.length} open task${open.length > 1 ? "s" : ""}`, reason: open[0].title, color: "var(--orange)" });

  const young = s.tracker.filter((t) => t.passes > 0 && t.passes < 3);
  if (young.length) out.push({ title: `Push ${young.length} young/red item${young.length > 1 ? "s" : ""} to mature`, reason: "One focused pass can stabilize the weak middle.", color: "var(--cyan)" });

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

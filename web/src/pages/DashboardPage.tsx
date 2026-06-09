import {
  Inbox, ArrowDownToLine, Layers, Clock, ListChecks, BookText, Sparkles, ArrowRight,
  Flame, Database, Download, ShieldCheck, PackageCheck,
} from "lucide-react";
import { useStore } from "../lib/store";
import { dayTotals, todayGrade, gradeLabel, gradeColor, prettyDate, studyStreak, lastNDays, isoDate } from "../lib/scoring";
import { PASS_COLOR, scopeMastery, suggestMoves } from "../lib/tracker";
import { exportState } from "../lib/backup";
import { StatCard } from "../components/ui/StatCard";
import { GlassCard, GButton, PanelHeader, Tag } from "../components/ui/primitives";
import { Heatmap } from "../components/ui/Heatmap";

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

  return (
    <>
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

      <GlassCard pad>
        <PanelHeader title="Term Map" sub="Canonical course sequence"
          action={<a className="gbtn sm" href="#courses">Open Courses <ArrowRight size={14} /></a>} />
        <div className="grid grid-courses">
          {s.courses.map((c) => {
            const term = s.terms.find((t) => t.id === c.termId);
            return (
              <GlassCard key={c.id} pad hoverable className="course-card" onClick={() => (location.hash = "courses")}>
                <Tag>{term?.name ?? "Term"}</Tag>
                <div className="cc-code">{c.code}</div>
                {c.name && <div className="cc-name">{c.name}</div>}
                <div className="cc-files">{c.files} files · {c.modules.length} modules</div>
              </GlassCard>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="Activity heatmap" sub="Last 8 weeks — click a day to open it on Productivity" />
        <Heatmap logs={s.logs} onPick={() => (location.hash = "productivity")} />
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

function BadgeDot() {
  return <span className="badge-dot-icon" aria-hidden="true" />;
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

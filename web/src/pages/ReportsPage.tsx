import { useMemo, useState } from "react";
import { Flame, Target, Activity, CalendarCheck, Layers, ListChecks, Download, BatteryCharging, Gauge, AlertTriangle, CalendarDays } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, PanelHeader, Tag } from "../components/ui/primitives";
import { dayTotals, todayGrade, gradeColor, gradeLabel, lastNDays, isoDate, studyStreak, prettyDate } from "../lib/scoring";
import { PASS_COLOR, PASS_LABEL, YIELD_LABEL, YIELD_TONE, passStage, scopeMastery } from "../lib/tracker";
import { resolveTrack } from "../lib/tracks";
import { exportState } from "../lib/backup";
import { analyzePerformance } from "../lib/performance";
import { calculateReadiness } from "../lib/energy";
import type { PassStage } from "../lib/tracker";
import type { TrackerKind, Yield } from "../lib/types";

const RANGES = [14, 30] as const;
const STAGES: PassStage[] = ["untouched", "red", "young", "mature", "mastered"];
const YIELDS: Yield[] = ["high", "review", "low", "none"];
const KINDS: TrackerKind[] = ["Lecture", "DLA", "PQ", "Lab", "Reading", "Requirement", "Milestone", "Evidence", "Question Block", "Assessment", "Review Loop"];

export function ReportsPage() {
  const s = useStore();
  const [range, setRange] = useState<number>(14);
  const track = resolveTrack(s.profile.educationTrack);
  const minTarget = s.profile.dailyMinuteTarget || 240;
  const cardTarget = s.profile.dailyCardTarget || 120;
  const performance = analyzePerformance({
    logs: s.logs,
    journal: s.journal,
    tasks: s.tasks,
    tracker: s.tracker,
    dayPlans: s.dayPlans,
    activeDayKey: s.activeDayKey,
    minuteTarget: minTarget,
    cardTarget,
    range,
  });
  const readiness = useMemo(() => calculateReadiness({
    date: s.activeDayKey,
    factors: s.energyFactors ?? [],
    journal: s.journal,
    logs: s.logs,
    tasks: s.tasks,
    dayPlans: s.dayPlans,
    productivityTrackers: s.productivityTrackers,
  }), [s.activeDayKey, s.energyFactors, s.journal, s.logs, s.tasks, s.dayPlans, s.productivityTrackers]);

  const days = useMemo(() => lastNDays(range).map((d) => {
    const key = isoDate(d);
    const { minutes, cards } = dayTotals(s.logs, key);
    return { key, date: d, minutes, cards, grade: todayGrade(minutes, cards), active: minutes > 0 || cards > 0 };
  }), [s.logs, range]);

  const activeDays = days.filter((d) => d.active);
  const totalMin = activeDays.reduce((a, d) => a + d.minutes, 0);
  const totalCards = activeDays.reduce((a, d) => a + d.cards, 0);
  const consistency = Math.round((activeDays.length / range) * 100);
  const onFloorDays = days.filter((d) => d.minutes >= minTarget && d.cards >= cardTarget).length;
  const adherence = Math.round((onFloorDays / range) * 100);
  const bestDay = days.reduce<typeof days[number] | null>((best, d) => (!best || d.minutes > best.minutes ? d : best), null);
  const streak = studyStreak(s.logs);
  const maxMin = Math.max(1, ...days.map((d) => d.minutes));

  const dist = { blue: 0, green: 0, orange: 0, red: 0 };
  activeDays.forEach((d) => dist[d.grade]++);

  // Tracker analytics — the spine of the system, summarized.
  const stageCounts = STAGES.map((stage) => ({ stage, n: s.tracker.filter((t) => passStage(t.passes) === stage).length }));
  const yieldCounts = YIELDS.map((y) => ({ y, n: s.tracker.filter((t) => t.yield === y).length }));
  const kindCounts = KINDS.map((k) => ({ k, n: s.tracker.filter((t) => t.kind === k).length })).filter((x) => x.n > 0);
  const mastery = scopeMastery(s.tracker);
  const ankiAnchored = s.tracker.filter((t) => t.ankiPasses > 0).length;
  const reviewFlags = s.tracker.filter((t) => t.yield === "review").length;

  const completedTasks = s.tasks.filter((t) => t.done);
  const openTasks = s.tasks.filter((t) => !t.done);
  const latestStandups = s.journal.slice(0, 3);

  return (
    <>
      <GlassCard pad>
        <PanelHeader title="Reports" sub={`Traceable record for ${track.label} — every number is computed from your local study log, tracker, and tasks.`}
          action={
            <div className="row gap8">
              <div className="filter-bar" style={{ margin: 0 }}>
                {RANGES.map((r) => (
                  <button type="button" key={r} className={`filter-pill ${range === r ? "on" : ""}`} onClick={() => setRange(r)}>{r}d</button>
                ))}
              </div>
              <GButton size="sm" onClick={() => exportState(s)}><Download size={14} /> Export</GButton>
            </div>} />
      </GlassCard>

      <div className="grid grid-stats">
        <ReportStat icon={<Activity size={17} />} label={`Study · ${range}d`} value={`${Math.round(totalMin / 60)}h`} note={`${totalMin} min · ${totalCards} cards`} />
        <ReportStat icon={<Flame size={17} />} label="Current streak" value={`${streak}`} note={`${streak === 1 ? "day" : "days"} in a row`} tone="orange" />
        <ReportStat icon={<CalendarCheck size={17} />} label="Consistency" value={`${consistency}%`} note={`${activeDays.length}/${range} active days`} tone={consistency >= 70 ? "green" : consistency >= 40 ? "orange" : "red"} />
        <ReportStat icon={<Target size={17} />} label="Hit the floor" value={`${adherence}%`} note={`${onFloorDays}/${range} days at target`} tone={adherence >= 60 ? "green" : adherence >= 30 ? "orange" : "red"} />
        <ReportStat icon={<BatteryCharging size={17} />} label="Readiness" value={`${readiness.estimatedReadiness}`} note={`Energy ${readiness.selfReportedEnergy.score} · ${readiness.primarySignal}`} tone={readiness.estimatedReadiness >= 78 ? "green" : readiness.estimatedReadiness >= 58 ? "orange" : "red"} />
        <ReportStat icon={<Gauge size={17} />} label="Performance" value={`${performance.performanceScore}`} note={performance.performanceLabel} tone={performance.performanceScore >= 62 ? "green" : performance.performanceScore >= 38 ? "orange" : "red"} />
        <ReportStat icon={<Layers size={17} />} label="Tracker mastery" value={`${mastery}%`} note={`${s.tracker.length} items · ${ankiAnchored} in Anki`} tone={mastery >= 60 ? "green" : mastery >= 30 ? "orange" : "neutral"} />
        <ReportStat icon={<ListChecks size={17} />} label="Tasks done" value={`${completedTasks.length}`} note={`${openTasks.length} still open`} />
      </div>

      <GlassCard pad className="report-performance-card">
        <PanelHeader title="Energy, readiness, and performance" sub="Readiness uses confirmed ledger factors, tracker/goal signals, carryover decay, and self-reported energy."
          action={<Tag tone={performance.preliminary ? "orange" : "green"}>{performance.preliminary ? "Preliminary" : "Enough signal"}</Tag>} />
        {performance.preliminary && (
          <div className="report-prelim">
            <AlertTriangle size={15} />
            <span>Here are preliminary statistics. Noctyrium needs about 5 days of use before the energy/performance rating becomes meaningfully personalized.</span>
          </div>
        )}
        <div className="report-insight-grid">
          <div>
            <b>Readiness recommendation</b>
            <span>{readiness.recommendation}</span>
          </div>
          <div>
            <b>Factor impact</b>
            <span>{readiness.totalImpact >= 0 ? "+" : ""}{readiness.totalImpact} net · {readiness.carryoverImpact >= 0 ? "+" : ""}{readiness.carryoverImpact} carryover</span>
          </div>
          <div>
            <b>Possible journal signals</b>
            <span>{readiness.possibleSignals.length ? readiness.possibleSignals.map((signal) => signal.label).join(", ") : "No unconfirmed journal signals."}</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard pad data-tour="reports-top">
        <PanelHeader title="Effort trend" sub={`Minutes logged per day over the last ${range} days`}
          action={<Tag tone={bestDay && bestDay.minutes > 0 ? "cyan" : "neutral"}>{bestDay && bestDay.minutes > 0 ? `Best: ${bestDay.minutes}m on ${prettyDate(`${bestDay.key}T12:00:00`)}` : "No effort logged yet"}</Tag>} />
        <div className="report-trend">
          {days.map((d) => (
            <div className="report-trend-col" key={d.key} title={`${prettyDate(`${d.key}T12:00:00`)}: ${d.minutes}m, ${d.cards} cards`}>
              <div className="report-trend-shell">
                <div className="report-trend-fill" style={{ height: `${Math.max(d.minutes ? 5 : 0, (d.minutes / maxMin) * 100)}%`, background: gradeColor(d.grade) }} />
              </div>
              <span>{d.date.getDate()}</span>
            </div>
          ))}
        </div>
        <div className="report-target-line"><span>Daily floor: {minTarget} min · {cardTarget} cards</span></div>
      </GlassCard>

      <GlassCard pad className="week-planner-lab under-construction">
        <span className="uc-tape t1">Under Construction</span>
        <span className="uc-badge"><CalendarDays size={15} /> Week planner lab</span>
        <PanelHeader title="Hourly week map" sub="Future calendar: map each hour, note what happened, score the block, and feed energy/performance logic." />
        <div className="week-planner-grid">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div className="week-planner-day" key={day}>
              <b>{day}</b>
              {["6a", "9a", "12p", "3p", "6p", "9p"].map((slot) => <span key={slot}>{slot}</span>)}
            </div>
          ))}
        </div>
        <div className="sub">This will factor roadblocks, illness/injury, praise-worthy moments, addictions, sleep, exercise, and goal-relative performance into recommendations.</div>
      </GlassCard>

      <div className="grid grid-2">
        <GlassCard pad>
          <PanelHeader title="Useful-day distribution" sub={`Grade of each active day in the window`} />
          <div className="stack gap8">
            {(["blue", "green", "orange", "red"] as const).map((g) => {
              const n = dist[g];
              const pct = activeDays.length ? Math.round((n / activeDays.length) * 100) : 0;
              return (
                <div className="report-bar-row" key={g}>
                  <div className="report-bar-label" style={{ color: gradeColor(g) }}>{gradeLabel(g).replace("👑 ", "")}</div>
                  <div className="report-bar-track">
                    <div className="report-bar-fill" style={{ width: `${pct}%`, background: gradeColor(g) }} />
                  </div>
                  <div className="report-bar-val">{n} day{n === 1 ? "" : "s"}</div>
                </div>
              );
            })}
            {!activeDays.length && <div className="dim">No active days in this window yet.</div>}
          </div>
        </GlassCard>

        <GlassCard pad>
          <PanelHeader title="Mastery pipeline" sub="Where your tracker items sit on the pass ladder" />
          {s.tracker.length === 0 ? (
            <div className="dim">No tracker items yet — install a blueprint or import a list.</div>
          ) : (
            <>
              <div className="report-pipeline">
                {stageCounts.map(({ stage, n }) => {
                  const pct = Math.round((n / s.tracker.length) * 100);
                  return (
                    <div className="report-pipe-seg" key={stage} title={`${PASS_LABEL[stage]}: ${n}`}
                      style={{ flexGrow: Math.max(n, 0.001), background: PASS_COLOR[stage] }}>
                      {pct >= 8 ? n : ""}
                    </div>
                  );
                })}
              </div>
              <div className="report-pipe-legend">
                {stageCounts.map(({ stage, n }) => (
                  <span key={stage}><i style={{ background: PASS_COLOR[stage] }} /> {PASS_LABEL[stage]} · {n}</span>
                ))}
              </div>
              <div className="report-yield-row">
                {yieldCounts.filter((x) => x.n > 0).map(({ y, n }) => (
                  <Tag key={y} tone={YIELD_TONE[y]}>{YIELD_LABEL[y]}: {n}</Tag>
                ))}
                {reviewFlags > 0 && <Tag tone="red">{reviewFlags} need review</Tag>}
              </div>
            </>
          )}
        </GlassCard>
      </div>

      <GlassCard pad>
        <PanelHeader title="Coverage by course" sub="Tracker readiness and review pressure mapped onto your course shells" />
        {s.courses.length === 0 ? (
          <div className="dim">No courses yet. Your program's starter structure loads from onboarding or Settings → Personalization.</div>
        ) : (
          <div className="stack gap8">
            {s.courses.map((c) => {
              const cov = courseCoverage(c, s.tracker);
              return (
                <div className="report-course-row" key={c.id}>
                  <div className="report-course-head">
                    <div className="grow">
                      <div className="report-course-code">{c.code}</div>
                      <div className="sub">{c.name || "—"}</div>
                    </div>
                    <Tag tone="cyan">{c.modules.length} modules</Tag>
                    <Tag tone={cov.items ? (cov.ready >= 70 ? "green" : cov.ready >= 35 ? "orange" : "neutral") : "neutral"}>
                      {cov.items ? `${cov.ready}% ready` : "no rows"}
                    </Tag>
                  </div>
                  <div className="report-bar-track">
                    <div className="report-bar-fill" style={{ width: `${cov.ready}%`, background: cov.ready >= 70 ? PASS_COLOR.mastered : cov.ready >= 35 ? PASS_COLOR.young : "rgba(90,215,239,0.34)" }} />
                  </div>
                  <div className="report-course-foot sub">
                    {cov.items} tracker row{cov.items === 1 ? "" : "s"}
                    {cov.review ? ` · ${cov.review} need review` : ""}
                    {cov.highYield ? ` · ${cov.highYield} high-yield` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {kindCounts.length > 0 && (
        <GlassCard pad>
          <PanelHeader title="Item mix" sub="What kind of work your tracker is made of" />
          <div className="row wrap gap8">
            {kindCounts.map(({ k, n }) => <Tag key={k} tone="neutral">{k}: {n}</Tag>)}
            <Tag tone="purple">{ankiAnchored} anchored in Anki</Tag>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-2">
        <GlassCard pad>
          <PanelHeader title="Task report" sub="Completed work is the task archive" />
          <div className="stack gap8">
            {completedTasks.length === 0 && <div className="dim">No completed tasks yet.</div>}
            {completedTasks.slice(0, 8).map((t) => (
              <div className="report-row" key={t.id}>
                <div className="grow">
                  <div className="report-course-code">{t.title}</div>
                  <div className="sub">{t.scope || "Unscoped"}{t.completedAt ? ` · completed ${t.completedAt.slice(0, 10)}` : ""}</div>
                </div>
                <Tag tone="green">done</Tag>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard pad>
          <PanelHeader title="Standup report" sub="Latest journal standups" />
          <div className="stack gap8">
            {latestStandups.length === 0 && <div className="dim">No standups yet.</div>}
            {latestStandups.map((j) => (
              <div className="report-row" key={j.id}>
                <div className="grow">
                  <div className="report-course-code">{j.date.slice(0, 10)}</div>
                  <div className="sub">{j.today}</div>
                </div>
                {j.energy && <Tag tone={j.energy === "High" ? "green" : j.energy === "Medium" ? "orange" : "red"}>{j.energy}</Tag>}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard pad>
        <PanelHeader title="Traceability" sub="Every number above is computed from your local data" />
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
          Reports read directly from your study log, tracker, course, and task data stored in this browser.
          No external service is involved — export a JSON backup any time to keep an audit trail.
        </div>
      </GlassCard>
    </>
  );
}

function ReportStat({ icon, label, value, note, tone = "neutral" }: {
  icon: React.ReactNode; label: string; value: string; note: string;
  tone?: "neutral" | "green" | "orange" | "red" | "cyan";
}) {
  return (
    <GlassCard pad className="stat-card report-stat">
      <div className="report-stat-top">
        <span className={`report-stat-icon ${tone}`}>{icon}</span>
        <div className="stat-title">{label}</div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </GlassCard>
  );
}

function courseCoverage(course: { code: string; name: string; modules: { name: string }[] }, tracker: ReturnType<typeof useStore.getState>["tracker"]) {
  const needles = [course.code, course.name, ...course.modules.map((m) => m.name)]
    .map((v) => v.toLowerCase().replace(/\s+/g, "")).filter(Boolean);
  const items = tracker.filter((item) => {
    const hay = `${item.path} ${item.label}`.toLowerCase().replace(/\s+/g, "");
    return needles.some((needle) => needle && hay.includes(needle));
  });
  const ready = scopeMastery(items);
  const review = items.filter((i) => i.yield === "review" || i.passes < 2).length;
  const highYield = items.filter((i) => i.yield === "high").length;
  return { items: items.length, ready, review, highYield };
}

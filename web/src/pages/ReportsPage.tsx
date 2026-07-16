import { useMemo, useState } from "react";
import { Flame, Target, Activity, CalendarCheck, Layers, ListChecks, Download, BatteryCharging, Gauge, AlertTriangle } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, PanelHeader, Tag } from "../components/ui/primitives";
import { dayTotals, todayGrade, gradeColor, gradeLabel, prettyDate } from "../lib/scoring";
import { PASS_COLOR, PASS_LABEL, YIELD_LABEL, YIELD_TONE, passStage, scopeMastery } from "../lib/tracker";
import { resolveTrack } from "../lib/tracks";
import { exportState } from "../lib/backup";
import { analyzePerformance } from "../lib/performance";
import { calculateReadiness } from "../lib/energy";
import type { PassStage } from "../lib/tracker";
import type { TrackerKind, Yield } from "../lib/types";
import {
  buildCanonicalReportSummary,
  buildCanonicalReportTrends,
  compareReportPeriods,
  reportTrendMetricValue,
  type ReportDayDatum,
  type ReportMetric,
  type ReportTrendMetric,
} from "../lib/reports";
import { evaluateDailySuccess } from "../lib/dailySuccess";
import { ReportInsightCard, type ReportCardInsight } from "../components/reports/ReportInsightCard";
import { ICON_SIZE } from "../lib/iconSize";

const RANGES = [14, 30] as const;
const STAGES: PassStage[] = ["untouched", "red", "young", "mature", "mastered"];
const YIELDS: Yield[] = ["high", "review", "low", "none"];
const KINDS: TrackerKind[] = ["Lecture", "DLA", "PQ", "Lab", "Reading", "Requirement", "Milestone", "Evidence", "Question Block", "Assessment", "Review Loop"];

export function ReportsPage() {
  const s = useStore();
  const [range, setRange] = useState<number>(14);
  const [trendMetric, setTrendMetric] = useState<ReportTrendMetric>("minutes");
  const [selectedTrendDay, setSelectedTrendDay] = useState<string | null>(null);
  const track = resolveTrack(s.profile.educationTrack);
  const minTarget = s.profile.dailyMinuteTarget || 240;
  const cardTarget = s.profile.dailyCardTarget || 120;
  const reportSummary = useMemo(() => buildCanonicalReportSummary(s, range), [s, range]);
  const reportTrends = useMemo(() => buildCanonicalReportTrends(s), [s]);
  const weeklyComparison = useMemo(
    () => compareReportPeriods(reportTrends.currentWeek, reportTrends.previousWeek, trendMetric),
    [reportTrends, trendMetric],
  );
  const todaySuccess = useMemo(() => evaluateDailySuccess(s, s.activeDayKey, s.activeDayKey), [s]);
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

  const days = useMemo(() => reportSummary.observedDates.map((key) => {
    const d = new Date(`${key}T12:00:00`);
    const { minutes, cards } = dayTotals(s.logs, key);
    return { key, date: d, minutes, cards, grade: todayGrade(minutes, cards), active: minutes > 0 || cards > 0 };
  }), [s.logs, reportSummary.observedDates]);

  const activeDays = days.filter((d) => d.active);
  const bestDay = days.reduce<typeof days[number] | null>((best, d) => (!best || d.minutes > best.minutes ? d : best), null);
  const maxMin = Math.max(1, ...days.map((d) => d.minutes));

  const dist = { blue: 0, green: 0, orange: 0, red: 0 };
  activeDays.forEach((d) => dist[d.grade]++);

  // Tracker analytics — the spine of the system, summarized.
  const stageCounts = STAGES.map((stage) => ({ stage, n: s.tracker.filter((t) => passStage(t.passes) === stage).length }));
  const yieldCounts = YIELDS.map((y) => ({ y, n: s.tracker.filter((t) => t.yield === y).length }));
  const kindCounts = KINDS.map((k) => ({ k, n: s.tracker.filter((t) => t.kind === k).length })).filter((x) => x.n > 0);
  const ankiAnchored = s.tracker.filter((t) => t.ankiPasses > 0).length;
  const reviewFlags = s.tracker.filter((t) => t.yield === "review").length;

  const completedTasks = s.tasks.filter((t) => t.done && !t.archived);
  const latestStandups = s.journal.slice(0, 3);
  const readinessEvidenceIds = [...new Set([
    ...(readiness.selfReportedEnergy.source ? [readiness.selfReportedEnergy.source] : []),
    ...readiness.contributions
      .filter((contribution) => contribution.userConfirmed)
      .map((contribution) => contribution.factorId ?? contribution.id),
  ])];
  const readinessMetric: ReportMetric = {
    id: "readiness",
    label: "Readiness",
    value: readinessEvidenceIds.length ? `${readiness.estimatedReadiness}` : "No input",
    note: readinessEvidenceIds.length ? readiness.primarySignal : "No readiness input yet",
    numerator: readinessEvidenceIds.length ? readiness.estimatedReadiness : 0,
    denominator: readinessEvidenceIds.length ? 100 : 0,
    period: reportSummary.metrics.consistency.period,
    sourceLabel: "Confirmed readiness contributions and energy check-ins",
    sourceRecordIds: readinessEvidenceIds,
    calculation: readinessEvidenceIds.length
      ? `Baseline plus ${readiness.totalImpact >= 0 ? "+" : ""}${readiness.totalImpact} net contribution; ${readiness.carryoverImpact >= 0 ? "+" : ""}${readiness.carryoverImpact} carryover.`
      : "No confirmed factor, energy check-in, or qualifying activity supplied a readiness observation.",
    interpretation: readinessEvidenceIds.length ? readiness.recommendation : "No readiness input yet. AXOM will not present the default baseline as if you reported it.",
    action: "Open the full calculation",
    state: readinessEvidenceIds.length ? "ready" : "neutral",
  };
  // The legacy performance engine still considers some lifetime journal/plan
  // signals. Never let those older records unlock a directional score for a
  // report window that does not yet contain five canonical active eligible days.
  const performancePreliminary = performance.preliminary || reportSummary.activeDates.length < 5;
  const openTasks = s.tasks.filter((task) => !task.archived && !task.done);
  const overdueOpenTasks = openTasks.filter((task) => task.due && task.due.slice(0, 10) < s.activeDayKey);
  const todayMetric: ReportMetric = {
    id: "daily-success",
    label: "Today’s success",
    value: todaySuccess.eligibleCount ? `${todaySuccess.progress}%` : "No targets",
    note: todaySuccess.statusLabel,
    numerator: todaySuccess.metCount,
    denominator: todaySuccess.eligibleCount,
    period: s.activeDayKey,
    sourceLabel: "Targets scheduled for today and their linked records",
    sourceRecordIds: [...new Set(todaySuccess.requirements.flatMap((requirement) => requirement.sourceRecordIds))],
    calculation: `${todaySuccess.metCount} met ÷ ${todaySuccess.eligibleCount} scheduled targets.`,
    interpretation: todaySuccess.eligibleCount ? todaySuccess.statusLabel : "No optional target is scheduled today.",
    action: "Review today’s targets",
    state: todaySuccess.eligibleCount ? "ready" : "neutral",
  };
  const openTaskMetric: ReportMetric = {
    id: "tasks",
    label: "Open tasks",
    value: `${openTasks.length}`,
    note: `${overdueOpenTasks.length} overdue`,
    numerator: openTasks.length,
    denominator: s.tasks.filter((task) => !task.archived).length,
    period: "Current task state",
    sourceLabel: "Current non-archived tasks",
    sourceRecordIds: openTasks.map((task) => task.id),
    calculation: `${openTasks.length} unfinished non-archived tasks; ${overdueOpenTasks.length} are overdue.`,
    interpretation: overdueOpenTasks.length ? `${overdueOpenTasks.length} overdue task${overdueOpenTasks.length === 1 ? "" : "s"} need a decision.` : openTasks.length ? "Open work is visible without treating it as failure." : "No open tasks are waiting.",
    action: overdueOpenTasks.length ? "Review overdue tasks" : "Review current tasks",
    state: openTasks.length ? "ready" : "neutral",
  };
  const monthlyQuestions = reportTrends.month.reduce((sum, day) => sum + day.questions, 0);
  const questionMetric: ReportMetric = {
    id: "study",
    label: "Question practice",
    value: monthlyQuestions ? `${monthlyQuestions}` : "No data",
    note: "questions this calendar month",
    numerator: monthlyQuestions,
    denominator: reportTrends.month.filter((day) => day.eligible).length,
    period: `${s.activeDayKey.slice(0, 7)} calendar month`,
    sourceLabel: "Activity records labeled as question quantities",
    sourceRecordIds: s.logs
      .filter((log) => reportTrends.month.some((day) => day.dayKey === log.dayKey) && log.quantityKind === "questions")
      .map((log) => log.id),
    calculation: `${monthlyQuestions} net question units after signed daily corrections.`,
    interpretation: monthlyQuestions ? "Practice-question volume is recorded separately from study time." : "No practice-question quantity has been logged this month.",
    action: monthlyQuestions ? "Review question activity" : "Log practice questions",
    state: monthlyQuestions ? "ready" : "neutral",
  };
  const activityCounts = [...new Map(s.logs
    .filter((log) => reportSummary.observedDates.includes(log.dayKey))
    .map((log) => [log.type.trim() || "Activity", 0] as const)).keys()]
    .map((label) => ({ label, count: s.logs.filter((log) => reportSummary.observedDates.includes(log.dayKey) && (log.type.trim() || "Activity") === label).length }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const activityMetric: ReportMetric = {
    id: "study",
    label: "Activity mix",
    value: activityCounts[0]?.label ?? "No data",
    note: activityCounts.length ? `${activityCounts.length} recorded activity type${activityCounts.length === 1 ? "" : "s"}` : "No recorded activity",
    numerator: activityCounts[0]?.count ?? 0,
    denominator: s.logs.filter((log) => reportSummary.observedDates.includes(log.dayKey)).length,
    period: reportSummary.metrics.study.period,
    sourceLabel: "Named activity records",
    sourceRecordIds: reportSummary.metrics.study.sourceRecordIds,
    calculation: activityCounts.length ? activityCounts.slice(0, 3).map((item) => `${item.label}: ${item.count}`).join(" · ") : "No named activity records in range.",
    interpretation: activityCounts[0] ? `${activityCounts[0].label} appears most often in this window.` : "Activity distribution appears after a real log.",
    action: "Review activity history",
    state: activityCounts.length ? "ready" : "neutral",
  };
  const trendInsight: ReportCardInsight = {
    change: weeklyComparison.interpretation,
    strongestContributor: weeklyComparison.strongestContributor,
  };
  const weekMax = Math.max(1, ...reportTrends.currentWeek.map((day) => reportTrendMetricValue(day, trendMetric)));
  const monthMax = Math.max(1, ...reportTrends.month.map((day) => reportTrendMetricValue(day, trendMetric)));
  const monthBlanks = reportTrends.month[0]
    ? new Date(`${reportTrends.month[0].dayKey}T12:00:00`).getDay()
    : 0;
  const selectedDay = [...reportTrends.currentWeek, ...reportTrends.month].find((day) => day.dayKey === selectedTrendDay);
  const monthMetricTotal = reportTrends.month.reduce((sum, day) => sum + reportTrendMetricValue(day, trendMetric), 0);
  const monthBest = [...reportTrends.month]
    .sort((a, b) => reportTrendMetricValue(b, trendMetric) - reportTrendMetricValue(a, trendMetric) || a.dayKey.localeCompare(b.dayKey))[0];
  const monthScored = reportTrends.month.filter((day) => day.scored);
  const monthMet = monthScored.filter((day) => day.status === "met").length;
  const monthSummaryValue = trendMetric === "requirements"
    ? monthScored.length ? Math.round(monthScored.reduce((sum, day) => sum + day.requirementProgress, 0) / monthScored.length) : 0
    : monthMetricTotal;

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
              <GButton size="sm" onClick={() => exportState(s)}><Download size={ICON_SIZE.body} /> Export</GButton>
            </div>} />
      </GlassCard>

      <section className="report-section" aria-labelledby="report-current-title">
        <div className="report-section-heading"><div><span>Current state</span><h2 id="report-current-title">Today</h2></div><p>The signals that can help you decide what to do next.</p></div>
        <div className="grid grid-stats report-card-grid">
          <ReportInsightCard icon={<Target size={ICON_SIZE.emphasis} />} metric={todayMetric} />
          <ReportInsightCard icon={<BatteryCharging size={ICON_SIZE.emphasis} />} metric={readinessMetric} />
          <ReportInsightCard icon={<ListChecks size={ICON_SIZE.emphasis} />} metric={openTaskMetric} />
        </div>
      </section>

      <section className="report-section" aria-labelledby="report-trend-title">
        <div className="report-section-heading"><div><span>Pattern over time</span><h2 id="report-trend-title">Trend</h2></div><p>Only scheduled, tracked dates enter requirement comparisons.</p></div>
        <div className="grid grid-stats report-card-grid report-card-grid-two">
          <ReportInsightCard icon={<CalendarCheck size={ICON_SIZE.emphasis} />} metric={reportSummary.metrics.consistency} insight={trendInsight} />
          <ReportInsightCard icon={<Flame size={ICON_SIZE.emphasis} />} metric={reportSummary.metrics.streak} insight={trendInsight} />
        </div>
        <GlassCard pad className="report-week-card">
          <PanelHeader title="Weekly trend" sub="Your latest seven eligible study days"
            action={<Tag tone={weeklyComparison.sufficient ? "cyan" : "neutral"}>{reportTrends.currentWeek.length}/7 eligible</Tag>} />
          <div className="report-metric-switch" role="group" aria-label="Weekly and monthly trend metric">
            {(["minutes", "questions", "cards", "requirements"] as ReportTrendMetric[]).map((metric) => (
              <button key={metric} className={`filter-pill ${trendMetric === metric ? "on" : ""}`} onClick={() => setTrendMetric(metric)}>
                {metric === "minutes" ? "Minutes" : metric === "questions" ? "Questions" : metric === "cards" ? "Cards" : "Target completion"}
              </button>
            ))}
          </div>
          <div className="report-eligible-week" aria-label="Seven eligible day trend">
            {reportTrends.currentWeek.map((day) => {
              const value = reportTrendMetricValue(day, trendMetric);
              return <button key={day.dayKey} className={`report-eligible-day ${day.status} ${selectedTrendDay === day.dayKey ? "selected" : ""}`} aria-label={`${day.dayKey}: ${value} ${trendMetric}`} aria-pressed={selectedTrendDay === day.dayKey} onClick={() => setSelectedTrendDay(day.dayKey)}>
                <span className="report-eligible-bar"><i style={{ height: `${Math.max(value ? 8 : 0, (value / weekMax) * 100)}%` }} /></span>
                <b>{new Date(`${day.dayKey}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}</b>
                <small>{value}</small>
              </button>;
            })}
            {!reportTrends.currentWeek.length && <p className="dim">Not enough tracked days yet.</p>}
          </div>
          <div className="report-trend-interpretation">
            <b>{weeklyComparison.interpretation}</b>
            <span>{weeklyComparison.strongestContributor ? `${weeklyComparison.strongestContributor} was the strongest contributor. ` : ""}{weeklyComparison.quietEligibleDays ? `${weeklyComparison.quietEligibleDays} scheduled day${weeklyComparison.quietEligibleDays === 1 ? "" : "s"} had no activity.` : "No completed eligible day was silently classified from an off-day."}</span>
          </div>
        </GlassCard>

        <GlassCard pad className="report-month-card">
          <PanelHeader title="Monthly trend" sub="Calendar month · dates before tracking or off schedule stay neutral"
            action={<Tag tone={reportTrends.month.some((day) => reportTrendMetricValue(day, trendMetric) > 0) ? "cyan" : "neutral"}>{trendMetric}</Tag>} />
          <div className="report-month-grid" aria-label="Monthly trend calendar">
            {Array.from({ length: monthBlanks }, (_, index) => <span className="report-month-day blank" key={`blank-${index}`} />)}
            {reportTrends.month.map((day) => {
              const value = reportTrendMetricValue(day, trendMetric);
              const intensity = value / monthMax;
              return <button key={day.dayKey} className={`report-month-day ${day.status} ${selectedTrendDay === day.dayKey ? "selected" : ""}`} aria-label={`${day.dayKey}: ${value} ${trendMetric}; ${day.eligible ? "eligible" : "not scheduled"}`} aria-pressed={selectedTrendDay === day.dayKey} onClick={() => setSelectedTrendDay(day.dayKey)}>
                <span>{Number(day.dayKey.slice(-2))}</span>
                <i style={{ opacity: value ? Math.max(.2, intensity) : .06 }} />
              </button>;
            })}
          </div>
          <div className="report-month-summary">
            <span><b>{monthSummaryValue}{trendMetric === "requirements" ? "%" : ""}</b> {trendMetric === "requirements" ? "average target completion" : `total ${trendMetric}`}</span>
            <span><b>{monthBest && reportTrendMetricValue(monthBest, trendMetric) > 0 ? monthBest.dayKey : "—"}</b> best day</span>
            <span><b>{monthScored.length ? `${Math.round((monthMet / monthScored.length) * 100)}%` : "—"}</b> target completion</span>
          </div>
          <div className="report-month-legend"><span><i className="met" /> target met</span><span><i className="missed" /> scheduled, not met</span><span><i className="neutral" /> not tracked or not scheduled</span></div>
        </GlassCard>
        {selectedDay && <DayTrendDetail day={selectedDay} metric={trendMetric} />}
      </section>

      <section className="report-section" aria-labelledby="report-system-title">
        <div className="report-section-heading"><div><span>Learning system</span><h2 id="report-system-title">Study system</h2></div><p>Course progress, question practice, and the work you record.</p></div>
        <div className="grid grid-stats report-card-grid">
          <ReportInsightCard icon={<Layers size={ICON_SIZE.emphasis} />} metric={reportSummary.metrics["tracker-mastery"]} />
          <ReportInsightCard icon={<Activity size={ICON_SIZE.emphasis} />} metric={questionMetric} />
          <ReportInsightCard icon={<Gauge size={ICON_SIZE.emphasis} />} metric={activityMetric} />
        </div>
      </section>

      <details className="report-advanced">
        <summary>More reports and technical detail</summary>
        <div className="stack gap16 report-advanced-body">

      <GlassCard pad className="report-performance-card">
        <PanelHeader title="Energy, readiness, and performance" sub="Deterministic calculations with visible local sources."
          action={<Tag tone={!readinessEvidenceIds.length ? "neutral" : performancePreliminary ? "orange" : "green"}>{!readinessEvidenceIds.length ? "No input" : performancePreliminary ? "Preliminary" : "Enough signal"}</Tag>} />
        {!readinessEvidenceIds.length && (
          <div className="report-prelim neutral">
            <BatteryCharging size={ICON_SIZE.body} />
            <span>No readiness input yet. AXOM will not present its default baseline as if it were a real observation.</span>
          </div>
        )}
        {performancePreliminary && (
          <div className="report-prelim">
            <AlertTriangle size={ICON_SIZE.body} />
            <span>Here are preliminary statistics. AXOM needs about 5 days of use before the energy/performance rating becomes meaningfully personalized.</span>
          </div>
        )}
        <div className="report-insight-grid">
          <div>
            <b>Performance</b>
            <span>{performancePreliminary ? `Building baseline · ${reportSummary.activeDates.length}/5 active days with signal` : `${performance.performanceScore}/100 · ${performance.performanceLabel}`}</span>
          </div>
        </div>
        {readinessEvidenceIds.length > 0 && <div className="report-insight-grid">
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
        </div>}
      </GlassCard>

      <GlassCard pad data-tour="reports-top">
        <PanelHeader title="Effort trend" sub={`Minutes logged per day over the last ${range} days`}
          action={<Tag tone={bestDay && bestDay.minutes > 0 ? "cyan" : "neutral"}>{bestDay && bestDay.minutes > 0 ? `Best: ${bestDay.minutes}m on ${prettyDate(`${bestDay.key}T12:00:00`)}` : "No effort logged yet"}</Tag>} />
        <div className="report-trend">
          {days.map((d) => (
            <button type="button" className="report-trend-col" key={d.key} aria-label={`${prettyDate(`${d.key}T12:00:00`)}: ${d.minutes} minutes, ${d.cards} cards`}>
              <div className="report-trend-shell">
                <div className="report-trend-fill" style={{ height: `${Math.max(d.minutes ? 5 : 0, (d.minutes / maxMin) * 100)}%`, background: gradeColor(d.grade) }} />
              </div>
              <span>{d.date.getDate()}</span>
            </button>
          ))}
        </div>
        <div className="report-target-line"><span>{reportSummary.metrics["daily-success"].note}</span></div>
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
                    <div className="report-bar-fill" style={{ width: `${cov.ready}%`, background: cov.ready >= 70 ? PASS_COLOR.mastered : cov.ready >= 35 ? PASS_COLOR.young : "color-mix(in srgb, var(--cyan) 34%, transparent)" }} />
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

        </div>
      </details>

    </>
  );
}

function DayTrendDetail({ day, metric }: { day: ReportDayDatum; metric: ReportTrendMetric }) {
  return (
    <div className="report-day-detail" role="status">
      <b>{prettyDate(`${day.dayKey}T12:00:00`)}</b>
      <span>{reportTrendMetricValue(day, metric)} {metric} · {day.eligible ? day.status === "pending" ? "still in progress" : day.status === "met" ? "targets met" : "scheduled target not met" : "not scheduled"}</span>
      <small>{day.minutes} minutes · {day.questions} questions · {day.cards} cards · {day.requirementProgress}% target completion</small>
    </div>
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

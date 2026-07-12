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
import { buildCanonicalReportSummary, type ReportMetric } from "../lib/reports";

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
  const reportSummary = useMemo(() => buildCanonicalReportSummary(s, range), [s, range]);
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
    interpretation: readinessEvidenceIds.length ? readiness.recommendation : "AXOM will not present the default baseline as if you reported it.",
    action: "Open the full calculation",
    state: readinessEvidenceIds.length ? "ready" : "neutral",
  };
  const performanceSourceIds = [
    ...reportSummary.metrics.study.sourceRecordIds,
    ...reportSummary.metrics.tasks.sourceRecordIds,
    ...reportSummary.metrics["tracker-mastery"].sourceRecordIds,
  ];
  // The legacy performance engine still considers some lifetime journal/plan
  // signals. Never let those older records unlock a directional score for a
  // report window that does not yet contain five canonical active eligible days.
  const performancePreliminary = performance.preliminary || reportSummary.activeDates.length < 5;
  const performanceMetric: ReportMetric = {
    id: "performance",
    label: "Performance",
    value: performancePreliminary ? "Building baseline" : `${performance.performanceScore}`,
    note: performancePreliminary ? `${reportSummary.activeDates.length}/5 active days with signal` : performance.performanceLabel,
    numerator: performancePreliminary ? reportSummary.activeDates.length : performance.performanceScore,
    denominator: performancePreliminary ? 5 : 100,
    period: reportSummary.metrics.consistency.period,
    sourceLabel: "Eligible activity, tasks, plans, journal, and tracker state",
    sourceRecordIds: [...new Set(performanceSourceIds)],
    calculation: performancePreliminary
      ? "AXOM waits for at least five active eligible days before presenting a personalized score."
      : `Deterministic performance score ${performance.performanceScore}/100 (${performance.performanceLabel}).`,
    interpretation: performancePreliminary ? "There is not enough evidence for a directional claim yet." : performance.performanceLabel,
    action: performancePreliminary ? "Keep logging ordinary work" : "Review the performance calculation",
    state: performancePreliminary ? "low-data" : "ready",
  };
  const primaryMetrics: Array<{ metric: ReportMetric; icon: React.ReactNode }> = [
    { metric: reportSummary.metrics.study, icon: <Activity size={17} /> },
    { metric: reportSummary.metrics.streak, icon: <Flame size={17} /> },
    { metric: reportSummary.metrics.consistency, icon: <CalendarCheck size={17} /> },
    { metric: reportSummary.metrics["daily-success"], icon: <Target size={17} /> },
    { metric: readinessMetric, icon: <BatteryCharging size={17} /> },
    { metric: performanceMetric, icon: <Gauge size={17} /> },
    { metric: reportSummary.metrics["tracker-mastery"], icon: <Layers size={17} /> },
    { metric: reportSummary.metrics.tasks, icon: <ListChecks size={17} /> },
  ];

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
        {primaryMetrics.map(({ metric, icon }) => <ReportStat key={metric.label} icon={icon} metric={metric} />)}
      </div>

      <GlassCard pad className="report-performance-card">
        <PanelHeader title="Energy, readiness, and performance" sub="Deterministic calculations with visible local sources."
          action={<Tag tone={!readinessEvidenceIds.length ? "neutral" : performancePreliminary ? "orange" : "green"}>{!readinessEvidenceIds.length ? "No input" : performancePreliminary ? "Preliminary" : "Enough signal"}</Tag>} />
        {!readinessEvidenceIds.length && (
          <div className="report-prelim neutral">
            <BatteryCharging size={15} />
            <span>No readiness input yet. AXOM will not present its default baseline as if it were a real observation.</span>
          </div>
        )}
        {performancePreliminary && (
          <div className="report-prelim">
            <AlertTriangle size={15} />
            <span>Here are preliminary statistics. AXOM needs about 5 days of use before the energy/performance rating becomes meaningfully personalized.</span>
          </div>
        )}
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

    </>
  );
}

function ReportStat({ icon, metric }: { icon: React.ReactNode; metric: ReportMetric }) {
  const tone = metric.state === "neutral" ? "neutral" : metric.state === "low-data" ? "orange" : "cyan";
  return (
    <details className="glass-card pad stat-card report-stat report-stat-disclosure">
      <summary>
        <div className="report-stat-top">
          <span className={`report-stat-icon ${tone}`}>{icon}</span>
          <div className="stat-title">{metric.label}</div>
          <span className="report-stat-state">{metric.state === "low-data" ? "Low data" : metric.state === "neutral" ? "Neutral" : "Details"}</span>
        </div>
        <div className="stat-value">{metric.value}</div>
        <div className="stat-note">{metric.note}</div>
      </summary>
      <div className="report-stat-detail">
        <dl>
          <div><dt>Meaning</dt><dd>{metric.interpretation}</dd></div>
          <div><dt>Denominator</dt><dd>{metric.denominator || "None yet"} · {metric.period}</dd></div>
          <div><dt>Source</dt><dd>{metric.sourceLabel}</dd></div>
          <div><dt>Calculation</dt><dd>{metric.calculation}</dd></div>
          {metric.action && <div><dt>Next action</dt><dd>{metric.action}</dd></div>}
        </dl>
        <div className="report-source-records">
          <span>Source records</span>
          {metric.sourceRecordIds.length
            ? <code>{metric.sourceRecordIds.slice(0, 4).join(", ")}{metric.sourceRecordIds.length > 4 ? ` +${metric.sourceRecordIds.length - 4} more` : ""}</code>
            : <em>No source record contributed yet.</em>}
        </div>
      </div>
    </details>
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

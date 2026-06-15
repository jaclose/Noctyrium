import { useStore } from "../lib/store";
import { GlassCard, PanelHeader, Tag } from "../components/ui/primitives";
import { dayTotals, todayGrade, gradeColor, lastNDays, isoDate } from "../lib/scoring";

export function ReportsPage() {
  const s = useStore();

  // Last 14 study days → grade distribution + totals.
  const days = lastNDays(14).map((d) => {
    const key = isoDate(d);
    const { minutes, cards } = dayTotals(s.logs, key);
    return { key, minutes, cards, grade: todayGrade(minutes, cards), active: minutes > 0 || cards > 0 };
  });
  const activeDays = days.filter((d) => d.active);
  const totalMin = activeDays.reduce((a, d) => a + d.minutes, 0);
  const totalCards = activeDays.reduce((a, d) => a + d.cards, 0);
  const dist = { blue: 0, green: 0, orange: 0, red: 0 };
  activeDays.forEach((d) => dist[d.grade]++);

  const matureItems = s.tracker.filter((t) => t.passes >= 3).length;
  const masteredItems = s.tracker.filter((t) => t.passes >= 4).length;
  const completedTasks = s.tasks.filter((t) => t.done);
  const openTasks = s.tasks.filter((t) => !t.done);
  const latestStandups = s.journal.slice(0, 3);

  return (
    <>
      <div className="grid grid-stats">
        <ReportStat label="Study time · 14d" value={`${Math.round(totalMin / 60)}h`} note={`${totalMin} minutes`} />
        <ReportStat label="Cards · 14d" value={`${totalCards}`} note={`${activeDays.length} active days`} />
        <ReportStat label="Avg / active day" value={`${activeDays.length ? Math.round(totalMin / activeDays.length) : 0}m`} note="minutes" />
        <ReportStat label="Mature items" value={`${matureItems}`} note={`${masteredItems} mastered of ${s.tracker.length}`} />
        <ReportStat label="Tasks completed" value={`${completedTasks.length}`} note={`${openTasks.length} still open`} />
      </div>

      <GlassCard pad data-tour="reports-top">
        <PanelHeader title="Useful-day distribution" sub="Last 14 days that had any activity" />
        <div className="stack gap8">
          {(["blue", "green", "orange", "red"] as const).map((g) => {
            const n = dist[g];
            const pct = activeDays.length ? Math.round((n / activeDays.length) * 100) : 0;
            return (
              <div className="row gap12" key={g}>
                <div style={{ width: 64, fontWeight: 700, color: gradeColor(g), textTransform: "capitalize" }}>{g}</div>
                <div className="grow" style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: gradeColor(g), borderRadius: 6, transition: "width .4s ease" }} />
                </div>
                <div className="dim" style={{ width: 56, textAlign: "right" }}>{n} day{n === 1 ? "" : "s"}</div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="Course coverage" sub="Files + modules mapped per course" />
        <div className="stack gap8">
          {s.courses.map((c) => (
            <div className="int-row" key={c.id}>
              <div className="grow">
                <div style={{ fontWeight: 700 }}>{c.code}</div>
                <div className="sub">{c.name || "—"}</div>
              </div>
              <Tag tone="neutral">{c.files} files</Tag>
              <Tag tone="cyan">{c.modules.length} modules</Tag>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-2">
        <GlassCard pad>
          <PanelHeader title="Task report" sub="Completed work is the task archive" />
          <div className="stack gap8">
            {completedTasks.length === 0 && <div className="dim">No completed tasks yet.</div>}
            {completedTasks.slice(0, 8).map((t) => (
              <div className="report-row" key={t.id}>
                <div className="grow">
                  <div style={{ fontWeight: 700 }}>{t.title}</div>
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
                  <div style={{ fontWeight: 700 }}>{j.date.slice(0, 10)}</div>
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
          Reports read directly from your study log, tracker, and course data stored in this browser.
          No external service is involved — export a JSON backup any time from Settings to keep an audit trail.
        </div>
      </GlassCard>
    </>
  );
}

function ReportStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <GlassCard pad className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-title">{label}</div>
      <div className="stat-note">{note}</div>
    </GlassCard>
  );
}

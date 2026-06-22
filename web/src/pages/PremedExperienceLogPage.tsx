import { useMemo, useState } from "react";
import { Download, ShieldCheck, Stethoscope, Users, FlaskConical, Eye, Trophy } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, PanelHeader, Tag, EmptyState } from "../components/ui/primitives";
import { exportPremedExperienceWorkbook } from "../lib/premedExport";
import type { PremedExperienceEntry, PremedExperienceKind } from "../lib/types";

const TABS: Array<"Overview" | PremedExperienceKind> = ["Overview", "Clinical", "Service", "Research", "Shadowing", "Leadership"];
const ICONS: Record<PremedExperienceKind, JSX.Element> = {
  Clinical: <Stethoscope size={16} />,
  Service: <Users size={16} />,
  Research: <FlaskConical size={16} />,
  Shadowing: <Eye size={16} />,
  Leadership: <Trophy size={16} />,
};

export function PremedExperienceLogPage() {
  const entries = useStore((s) => s.premedExperiences ?? []);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const shown = tab === "Overview" ? entries : entries.filter((entry) => entry.kind === tab);
  const summary = useMemo(() => summarize(entries), [entries]);

  return (
    <div className="stack gap16">
      <GlassCard pad>
        <PanelHeader title="Pre-Med Experience Log" sub="Clinical, service, research, shadowing, leadership, verification, reflections, and evidence"
          action={<GButton size="sm" variant="primary" onClick={() => exportPremedExperienceWorkbook(entries)} disabled={!entries.length}><Download size={14} /> Export .xlsx</GButton>} />
        <div className="filter-bar" style={{ marginTop: 12 }}>
          {TABS.map((item) => (
            <button key={item} type="button" className={`filter-pill ${tab === item ? "on" : ""}`} onClick={() => setTab(item)}>{item}</button>
          ))}
        </div>
      </GlassCard>

      {tab === "Overview" && (
        <div className="grid grid-stats">
          {summary.map((item) => (
            <GlassCard pad className="premed-log-stat" key={item.kind}>
              <div className="stat-icon">{ICONS[item.kind]}</div>
              <div className="stat-value">{item.hours.toFixed(item.hours % 1 ? 1 : 0)}h</div>
              <div className="stat-label">{item.kind}</div>
              <div className="stat-note">{item.verified.toFixed(item.verified % 1 ? 1 : 0)}h verified · {item.entries} entries</div>
            </GlassCard>
          ))}
        </div>
      )}

      <GlassCard pad>
        <PanelHeader title={tab === "Overview" ? "All entries" : `${tab} entries`}
          sub={tab === "Overview" ? "Newest first across every experience category" : "Newest first within this category"}
          action={<Tag tone={shown.length ? "cyan" : "neutral"}>{shown.length} record{shown.length === 1 ? "" : "s"}</Tag>} />
        {!shown.length ? (
          <EmptyState title="No experiences logged yet" hint="Use Pre-Med / MCAT / DAT to add experiences, then return here for the full ledger." />
        ) : (
          <div className="premed-log-table">
            <div className="premed-log-head">
              <span>Date</span><span>Category</span><span>Hours</span><span>Activity</span><span>Evidence</span>
            </div>
            {shown.slice().sort(compareEntries).map((entry) => <ExperienceRow key={entry.id} entry={entry} />)}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function ExperienceRow({ entry }: { entry: PremedExperienceEntry }) {
  return (
    <div className="premed-log-row">
      <span className="mono">{entry.date}</span>
      <Tag tone={entry.verified ? "green" : "neutral"}>{entry.kind}</Tag>
      <span>{entry.hours}h</span>
      <span className="premed-log-main">
        <b>{entry.title}</b>
        <small>{entry.organization}{entry.contact ? ` · ${entry.contact}` : ""}</small>
        {entry.reflection && <em>{entry.reflection}</em>}
        {!!entry.competencyTags?.length && <small>{entry.competencyTags.map((tag) => `#${tag}`).join(" ")}</small>}
      </span>
      <span className="premed-log-evidence">
        {entry.verified && <Tag tone="green"><ShieldCheck size={11} /> Verified</Tag>}
        {entry.evidenceLink && <a className="gbtn tiny" href={entry.evidenceLink} target="_blank" rel="noreferrer noopener">Evidence</a>}
        {entry.notes && <small>{entry.notes}</small>}
      </span>
    </div>
  );
}

function summarize(entries: PremedExperienceEntry[]) {
  return (TABS.filter((item): item is PremedExperienceKind => item !== "Overview")).map((kind) => {
    const subset = entries.filter((entry) => entry.kind === kind);
    return {
      kind,
      entries: subset.length,
      hours: subset.reduce((sum, entry) => sum + entry.hours, 0),
      verified: subset.filter((entry) => entry.verified).reduce((sum, entry) => sum + entry.hours, 0),
    };
  });
}

function compareEntries(a: PremedExperienceEntry, b: PremedExperienceEntry) {
  return b.date.localeCompare(a.date) || b.created.localeCompare(a.created);
}

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, ExternalLink, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { GlassCard, GButton, PanelHeader, Tag } from "../components/ui/primitives";
import { ICON_SIZE } from "../lib/iconSize";
import {
  parseApplicationSchoolDataset,
  type ApplicationSchool,
  type ApplicationSchoolDataset,
  type SchoolVerificationStatus,
} from "../lib/applicationSchools";

const DATASET_URL = "./application-schools.json";
const STATUS: Record<SchoolVerificationStatus, { label: string; tone: "green" | "orange" | "neutral" | "cyan" }> = {
  verified: { label: "Verified", tone: "green" },
  incomplete: { label: "Incomplete", tone: "orange" },
  unknown: { label: "Unknown", tone: "neutral" },
  "needs-refresh": { label: "Needs refresh", tone: "cyan" },
  conflicting: { label: "Conflicting", tone: "orange" },
};

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; dataset: ApplicationSchoolDataset; warnings: string[] }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export function ApplicationCheckerPage() {
  const [loadKey, setLoadKey] = useState(0);
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SchoolVerificationStatus | "all">("all");
  const [program, setProgram] = useState("all");

  useEffect(() => {
    const controller = new AbortController();
    setState({ kind: "loading" });
    fetch(DATASET_URL, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 404) return setState({ kind: "empty" });
        if (!response.ok) throw new Error(`Dataset request failed (${response.status}).`);
        // Several SPA hosts answer a missing static asset with index.html and
        // status 200. That means "not connected", not "corrupt admissions data".
        if (!response.headers.get("content-type")?.includes("application/json")) {
          return setState({ kind: "empty" });
        }
        const result = parseApplicationSchoolDataset(await response.json());
        if (!result.ok) throw new Error(result.issues.map((issue) => `${issue.path}: ${issue.message}`).join(" "));
        setState({ kind: "ready", dataset: result.dataset, warnings: result.issues.map((issue) => `${issue.path}: ${issue.message}`) });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ kind: "error", message: error instanceof Error ? error.message : "School data could not be loaded." });
      });
    return () => controller.abort();
  }, [loadKey]);

  const schools = useMemo(() => state.kind === "ready" ? state.dataset.schools : [], [state]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return schools.filter((school) => {
      if (status !== "all" && school.verificationStatus !== status) return false;
      if (program !== "all" && school.programType !== program) return false;
      return !needle || [school.name, school.location, school.degree, school.programType, school.applicationPlatform]
        .some((value) => value?.toLocaleLowerCase().includes(needle));
    });
  }, [program, query, schools, status]);

  const programs = useMemo(() => [...new Set(schools.map((school) => school.programType).filter((value): value is string => Boolean(value)))].sort(), [schools]);

  return (
    <>
      <GlassCard pad>
        <div className="row gap12" style={{ alignItems: "center" }}>
          <span className="folder-icon" style={{ color: "var(--cyan)" }}><ClipboardCheck size={ICON_SIZE.control} /></span>
          <div className="grow">
            <div style={{ fontSize: 18, fontWeight: 800 }}>Application Checker</div>
            <div className="sub">Explore sourced school requirements without turning missing information into advice.</div>
          </div>
          <Tag tone="cyan">Data preview</Tag>
        </div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="Medical school data" sub="Verified means the record includes a retrievable source. Unknown remains unknown." />
        {state.kind === "loading" && <div className="application-state" role="status">Loading school data…</div>}
        {state.kind === "empty" && (
          <div className="application-state">
            <ShieldCheck size={ICON_SIZE.display} />
            <h3>No verified school dataset is connected yet</h3>
            <p className="sub">The review surface and versioned ingestion contract are ready. AXOM will not display placeholder admissions facts while the external source pipeline is being validated.</p>
          </div>
        )}
        {state.kind === "error" && (
          <div className="application-state" role="alert">
            <h3>School data needs attention</h3>
            <p className="sub">{state.message}</p>
            <GButton size="sm" onClick={() => setLoadKey((key) => key + 1)}><RefreshCw size={ICON_SIZE.body} /> Retry</GButton>
          </div>
        )}
        {state.kind === "ready" && (
          <>
            <div className="application-dataset-meta">
              <span>{schools.length} schools</span>
              <span>Dataset updated {formatDate(state.dataset.generatedAt)}</span>
              <span>{state.dataset.incompleteRecords} incomplete · {state.dataset.rejectedRecords} rejected</span>
              {state.warnings.length > 0 && <Tag tone="orange">{state.warnings.length} rejected row{state.warnings.length === 1 ? "" : "s"}</Tag>}
            </div>
            <div className="application-controls">
              <label className="application-search"><Search size={ICON_SIZE.body} /><span className="sr-only">Search schools</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search school, location, degree…" /></label>
              <label><span className="sr-only">Filter verification status</span><select value={status} onChange={(event) => setStatus(event.target.value as SchoolVerificationStatus | "all")}>
                <option value="all">All data states</option>
                {Object.entries(STATUS).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}
              </select></label>
              <label><span className="sr-only">Filter program type</span><select value={program} onChange={(event) => setProgram(event.target.value)}>
                <option value="all">All programs</option>
                {programs.map((value) => <option value={value} key={value}>{value.toUpperCase()}</option>)}
              </select></label>
            </div>
            {filtered.length ? <div className="application-school-grid">{filtered.map((school) => <SchoolCard school={school} key={school.id} />)}</div>
              : <div className="application-state"><h3>No matching schools</h3><button className="ghost-btn" type="button" onClick={() => { setQuery(""); setStatus("all"); setProgram("all"); }}>Clear search and filters</button></div>}
          </>
        )}
      </GlassCard>
    </>
  );
}

function SchoolCard({ school }: { school: ApplicationSchool }) {
  const meta = STATUS[school.verificationStatus];
  const source = school.sources[0];
  return (
    <article className="application-school-card">
      <div className="row"><div className="grow"><h3>{school.name}</h3><div className="sub">{[school.location, school.degree, school.programType].filter(Boolean).join(" · ") || "Details not supplied"}</div></div><Tag tone={meta.tone}>{meta.label}</Tag></div>
      <dl>
        <div><dt>Application</dt><dd>{school.applicationPlatform ?? "Unknown"}</dd></div>
        <div><dt>Deadline</dt><dd>{school.deadline ?? "Unknown"}</dd></div>
        <div><dt>MCAT policy</dt><dd>{school.mcatPolicy ?? "Unknown"}</dd></div>
      </dl>
      <div className="application-source">
        <span>{school.updatedAt ? `Record updated ${formatDate(school.updatedAt)}` : "Record update date unknown"}</span>
        {source ? <a href={source.url} target="_blank" rel="noreferrer noopener">Source <ExternalLink size={ICON_SIZE.microInline} /></a> : <span>No source supplied</span>}
      </div>
      <details className="application-school-details">
        <summary>Review available details</summary>
        <dl>
          <div><dt>Prerequisites</dt><dd>{school.prerequisiteCategories?.join(", ") ?? "Unknown"}</dd></div>
          <div><dt>CASPer</dt><dd>{school.casperPolicy ?? "Unknown"}</dd></div>
          <div><dt>PREview</dt><dd>{school.previewPolicy ?? "Unknown"}</dd></div>
          <div><dt>Letters</dt><dd>{school.letters ?? "Unknown"}</dd></div>
          <div><dt>Mission</dt><dd>{school.missionNotes ?? "Unknown"}</dd></div>
        </dl>
        {school.conflicts && <p className="application-conflict" role="alert">Conflicting fields need review: {Object.keys(school.conflicts).join(", ")}.</p>}
      </details>
    </article>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "unknown" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

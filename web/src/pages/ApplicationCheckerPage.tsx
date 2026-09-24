import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, ExternalLink, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { GlassCard, GButton, PanelHeader, Tag } from "../components/ui/primitives";
import { ICON_SIZE } from "../lib/iconSize";
import { useStore } from "../lib/store";
import { researchFactRevision, researchValue, type ApplicationResearchEntry } from "../lib/applicationResearch";
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
  const research = useStore(s => s.profile.applicationResearch);
  const [savedOnly, setSavedOnly] = useState(false);
  const [capturedOnly, setCapturedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
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
      if (savedOnly && !research?.some(entry => entry.schoolId === school.id && entry.shortlisted)) return false;
      if (capturedOnly && !school.researchFacts?.length) return false;
      if (status !== "all" && school.verificationStatus !== status) return false;
      if (program !== "all" && school.programType !== program) return false;
      return !needle || [school.name, school.location, school.degree, school.programType, school.applicationPlatform, ...(school.researchFacts ?? []).map(fact => fact.value)]
        .some((value) => value?.toLocaleLowerCase().includes(needle));
    });
  }, [program, query, schools, status, savedOnly, capturedOnly, research]);

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
          <Tag tone="cyan">Research workspace</Tag>
        </div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="Medical school data" sub="Historical research, not an eligibility decision. Confirm current policies and application cycles with each school." />
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
              <span>{schools.filter(school => school.researchFacts?.length).length} with collected research</span>
              {state.warnings.length > 0 && <Tag tone="orange">{state.warnings.length} data warning{state.warnings.length === 1 ? "" : "s"}</Tag>}
            </div>
            <p className="sub">A source link or historical official capture does not verify every requirement today. Unreported fields are not waived requirements. Your checkmarks record research reviewed, not requirements met.</p>
            <div className="row wrap gap12">
              <label><input type="checkbox" checked={savedOnly} onChange={event => setSavedOnly(event.target.checked)} /> Saved schools ({research?.filter(entry => entry.shortlisted).length ?? 0})</label>
              <label><input type="checkbox" checked={capturedOnly} onChange={event => setCapturedOnly(event.target.checked)} /> Has collected research</label>
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
            <p className="sub" role="status">Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} matching schools</p>
            {filtered.length ? <div className="application-school-grid">{filtered.slice(0, visibleCount).map((school) => <SchoolCard school={school} key={school.id} />)}</div>
              : <div className="application-state"><h3>No matching schools</h3><button className="ghost-btn" type="button" onClick={() => { setQuery(""); setStatus("all"); setProgram("all"); setSavedOnly(false); setCapturedOnly(false); }}>Clear search and filters</button></div>}
            {filtered.length > visibleCount && <GButton onClick={() => setVisibleCount(count => count + 24)}>Show more schools</GButton>}
          </>
        )}
      </GlassCard>
    </>
  );
}

function SchoolCard({ school }: { school: ApplicationSchool }) {
  const entry = useStore(s => s.profile.applicationResearch?.find(item => item.schoolId === school.id));
  function update(patch: Partial<ApplicationResearchEntry>) {
    const store = useStore.getState();
    const entries = store.profile.applicationResearch ?? [];
    const current = entries.find(item => item.schoolId === school.id) ?? { schoolId: school.id, shortlisted: false, reviewedFacts: {} };
    store.updateProfile({ applicationResearch: [...entries.filter(item => item.schoolId !== school.id), { ...current, ...patch }] });
  }
  const facts = school.researchFacts ?? [];
  const reviewed = facts.filter(fact => entry?.reviewedFacts[fact.id] === researchFactRevision(fact)).length;
  const capturedValue = (id: string) => { const fact = facts.find(item => item.id === id); return fact ? `${researchValue(fact.value)} (historical capture)` : "Unknown"; };
  const meta = STATUS[school.verificationStatus];
  const source = school.sources[0];
  return (
    <article className="application-school-card">
      <div className="row"><div className="grow"><h3>{school.name}</h3><div className="sub">{[school.location, school.degree, school.programType].filter(Boolean).join(" · ") || "Details not supplied"}</div></div><Tag tone={meta.tone}>{meta.label}</Tag></div>
      <button type="button" className={`filter-pill ${entry?.shortlisted ? "on" : ""}`} aria-pressed={entry?.shortlisted ?? false} onClick={() => update({ shortlisted: !entry?.shortlisted })}>{entry?.shortlisted ? "Saved school" : "Save school"}</button>
      <dl>
        <div><dt>Application</dt><dd>{school.applicationPlatform ?? capturedValue("application_process_raw.application_service")}</dd></div>
        <div><dt>Deadline</dt><dd>{school.deadline ?? capturedValue("application_process_raw.primary_deadline")}</dd></div>
        <div><dt>MCAT policy</dt><dd>{school.mcatPolicy ?? capturedValue("admissions_requirements_raw.mcat_recency_policy")}</dd></div>
      </dl>
      <div className="application-source">
        <span>{school.updatedAt ? `Record updated ${formatDate(school.updatedAt)}` : "Record update date unknown"}</span>
        {source ? <a href={source.url} target="_blank" rel="noreferrer noopener">Source <ExternalLink size={ICON_SIZE.microInline} /></a> : <span>No source supplied</span>}
      </div>
      <details className="application-school-details">
        <summary>Review available details{facts.length ? ` · ${reviewed}/${facts.length} reviewed` : ""}</summary>
        {facts.length > 0 && <div className="application-research-facts">
          <p className="sub">Read the source, then mark the information you have reviewed. This does not mean you meet a requirement. Checks reopen when evidence changes. Workspace save status is shown in the application header.</p>
          {facts.map(fact => <div className="application-research-fact" key={fact.id}>
            <label className="row gap8" style={{ alignItems: "flex-start" }}>
              <input type="checkbox" aria-label={`Reviewed ${fact.label}`} checked={entry?.reviewedFacts[fact.id] === researchFactRevision(fact)} onChange={event => {
                const latest = useStore.getState().profile.applicationResearch?.find(item => item.schoolId === school.id);
                const checks = { ...latest?.reviewedFacts };
                if (event.target.checked) checks[fact.id] = researchFactRevision(fact); else delete checks[fact.id];
                update({ reviewedFacts: checks });
              }} />
              <span><b>{fact.label}</b><br />{researchValue(fact.value)}</span>
            </label>
            <div className="sub">{fact.captureStatus === "official-capture" ? "Official-page capture" : "Unverified capture"} · {formatDate(fact.capturedAt)} · <a href={fact.url} target="_blank" rel="noreferrer noopener">Review source</a></div>
          </div>)}
        </div>}
        <dl>
          <div><dt>Prerequisites</dt><dd>{school.prerequisiteCategories?.join(", ") ?? "Unknown"}</dd></div>
          <div><dt>CASPer</dt><dd>{school.casperPolicy ?? "Unknown"}</dd></div>
          <div><dt>PREview</dt><dd>{school.previewPolicy ?? "Unknown"}</dd></div>
          <div><dt>Letters</dt><dd>{school.letters ?? "Unknown"}</dd></div>
          <div><dt>Mission</dt><dd>{school.missionNotes ?? "Unknown"}</dd></div>
        </dl>
        {school.conflicts && <p className="application-conflict" role="alert">Conflicting fields need review: {Object.keys(school.conflicts).join(", ")}.</p>}
        {school.conflicts && <dl>{Object.entries(school.conflicts).map(([field, conflict]) => <div key={field}><dt>{field}</dt><dd>{conflict.existing}<br />Other recorded value: {conflict.incoming}</dd></div>)}</dl>}
        {school.website && <a href={school.website} target="_blank" rel="noreferrer noopener">School website (roster link)</a>}
      </details>
    </article>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  // Research dates are date-only captures encoded at UTC midnight. Preserve
  // that source calendar date instead of displaying the previous local day.
  return Number.isNaN(date.valueOf()) ? "unknown" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

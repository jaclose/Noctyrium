// Blueprint Workbench — the installable operating-system UI for a pathway mode.
// Mode (USMLE vs Pre-Health) is fixed by the page; the lane bar only shows that
// mode's lanes. Installing a blueprint creates a rich container of mastery
// objects (not lecture passes), with duplicate prevention, macro/detailed views,
// node detail panels, search/filter, and source governance.
import { useMemo, useState } from "react";
import {
  Brain, Plus, ChevronDown, ChevronRight, Search, Layers, ListChecks, ClipboardCheck,
  FlaskConical, Trophy, ShieldCheck, ExternalLink, Trash2, Copy, ArrowRight, Target, Gauge,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag } from "../ui/primitives";
import { Modal } from "../ui/Modal";
import {
  BLUEPRINTS, blueprintsForLane, lanesForMode, blueprintById,
} from "../../lib/blueprintCatalog";
import type { BlueprintLaneId, BlueprintMode, BlueprintNodeStatus, BlueprintNodeType, InstalledBlueprint, InstalledBlueprintNode, SourceType } from "../../lib/types";

const DEPTH_KEY = "noctyrium-blueprint-depth";
const laneKey = (mode: BlueprintMode) => `noctyrium-blueprint-lane-${mode}`;

const TYPE_META: Record<BlueprintNodeType, { label: string; tone: "cyan" | "purple" | "orange" | "green" | "neutral" }> = {
  content: { label: "Content", tone: "cyan" },
  task: { label: "Task", tone: "purple" },
  tracker: { label: "Tracker", tone: "green" },
  queue: { label: "Queue", tone: "orange" },
  assessment: { label: "Assessment", tone: "orange" },
  evidence: { label: "Evidence", tone: "green" },
  metric: { label: "Metric", tone: "cyan" },
  planner: { label: "Planner", tone: "purple" },
};
const STATUS_ORDER: BlueprintNodeStatus[] = ["not-started", "in-progress", "blocked", "mastered", "done"];
const STATUS_LABEL: Record<BlueprintNodeStatus, string> = {
  "not-started": "Not started", "in-progress": "In progress", blocked: "Blocked", mastered: "Mastered", done: "Done",
};
const SOURCE_TONE: Record<SourceType, "green" | "cyan" | "neutral"> = { official: "green", tool: "cyan", internal: "neutral" };

function readDepth(): "macro" | "detailed" {
  try { return localStorage.getItem(DEPTH_KEY) === "detailed" ? "detailed" : "macro"; } catch { return "macro"; }
}

export function BlueprintWorkbench({ mode }: { mode: BlueprintMode }) {
  const lanes = useMemo(() => lanesForMode(mode), [mode]);
  const installs = useStore((s) => s.blueprintInstalls);
  const installBlueprint = useStore((s) => s.installBlueprint);

  const [activeLane, setActiveLane] = useState<BlueprintLaneId>(() => {
    try { const saved = localStorage.getItem(laneKey(mode)) as BlueprintLaneId | null; if (saved && lanes.some((l) => l.id === saved)) return saved; } catch { /* ignore */ }
    return lanes[0]?.id;
  });
  const [openInstallId, setOpenInstallId] = useState<string | null>(null);
  const [dupFor, setDupFor] = useState<string | null>(null);

  function selectLane(id: BlueprintLaneId) {
    setActiveLane(id);
    setOpenInstallId(null);
    try { localStorage.setItem(laneKey(mode), id); } catch { /* ignore */ }
  }

  const laneCatalog = blueprintsForLane(activeLane);
  const laneInstalls = installs.filter((i) => i.laneId === activeLane);
  const openInstall = installs.find((i) => i.id === openInstallId) ?? null;

  function handleInstall(blueprintId: string) {
    const existing = installs.find((i) => i.blueprintId === blueprintId);
    if (existing) { setDupFor(blueprintId); return; }
    const id = installBlueprint(blueprintId);
    if (id) setOpenInstallId(id);
  }

  return (
    <>
      <GlassCard pad className="bp-lanebar-card" data-tour="step">
        <div className="bp-lanebar-head">
          <div>
            <div className="bp-mode-kicker">{mode === "usmle" ? "USMLE Pathway" : "Pre-Health Pathway"}</div>
            <div className="bp-mode-title">Blueprint Prep</div>
          </div>
          <Tag tone="cyan"><Layers size={12} /> {installs.length} installed</Tag>
        </div>
        <div className="bp-lanebar">
          {lanes.map((lane) => (
            <button key={lane.id} type="button" className={`bp-lane-pill ${activeLane === lane.id ? "on" : ""}`}
              onClick={() => selectLane(lane.id)}>
              <b>{lane.label}</b>
              <span>{lane.sub}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {openInstall
        ? <ContainerView install={openInstall} onClose={() => setOpenInstallId(null)} />
        : <LaneCatalog laneInstalls={laneInstalls} catalogIds={laneCatalog.map((b) => b.id)} installs={installs}
            onInstall={handleInstall} onOpen={setOpenInstallId} />}

      {dupFor && (
        <DuplicateDialog blueprintId={dupFor} onClose={() => setDupFor(null)} onOpened={(id) => { setDupFor(null); setOpenInstallId(id); }} />
      )}
    </>
  );
}

function LaneCatalog({
  catalogIds, laneInstalls, installs, onInstall, onOpen,
}: {
  catalogIds: string[];
  laneInstalls: InstalledBlueprint[];
  installs: InstalledBlueprint[];
  onInstall: (blueprintId: string) => void;
  onOpen: (installId: string) => void;
}) {
  const remove = useStore((s) => s.removeBlueprintInstall);
  return (
    <>
      {laneInstalls.length > 0 && (
        <GlassCard pad>
          <PanelHeader title="Installed blueprints" sub="Your live containers under the Course Tracker mastery tree." />
          <div className="bp-installed-list">
            {laneInstalls.map((install) => {
              const stats = installStats(install);
              return (
                <div className="bp-installed-row" key={install.id}>
                  <span className="bp-installed-mark"><Brain size={16} /></span>
                  <button type="button" className="grow bp-installed-open" onClick={() => onOpen(install.id)}>
                    <b>{install.title}</b>
                    <span>{stats.mastered}/{stats.total} mastered · {stats.pct}% overall</span>
                  </button>
                  <div className="bp-mini-track"><span style={{ width: `${stats.pct}%` }} /></div>
                  <GhostButton title="Open" onClick={() => onOpen(install.id)}><ArrowRight size={15} /></GhostButton>
                  <GhostButton className="danger" title="Remove container" onClick={() => remove(install.id)}><Trash2 size={14} /></GhostButton>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      <GlassCard pad>
        <PanelHeader title="Blueprint catalog" sub="Install a source-backed operating system for this lane." />
        <div className="bp-catalog-grid">
          {catalogIds.map((id) => {
            const bp = blueprintById(id)!;
            const installed = installs.filter((i) => i.blueprintId === id);
            const nodeCount = bp.categories.reduce((sum, c) => sum + c.nodes.length, 0);
            return (
              <div className="bp-catalog-card" key={id}>
                <div className="bp-catalog-top">
                  <span className="bp-catalog-mark"><Brain size={17} /></span>
                  <SourceBadge type={bp.source.type} name={bp.source.name} url={bp.source.url} verification={bp.source.verification} />
                </div>
                <b>{bp.title}</b>
                <span className="bp-catalog-sum">{bp.summary}</span>
                <div className="bp-catalog-meta">
                  <span>{bp.categories.length} categories</span>
                  <span>{nodeCount} nodes</span>
                </div>
                <div className="bp-catalog-actions">
                  {installed.length > 0
                    ? <>
                        <GButton size="sm" onClick={() => onOpen(installed[0].id)}><ArrowRight size={13} /> Open</GButton>
                        <GButton size="sm" onClick={() => onInstall(id)}><Copy size={13} /> Duplicate</GButton>
                      </>
                    : <GButton size="sm" variant="primary" onClick={() => onInstall(id)}><Plus size={13} /> Install blueprint</GButton>}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </>
  );
}

function DuplicateDialog({ blueprintId, onClose, onOpened }: { blueprintId: string; onClose: () => void; onOpened: (id: string) => void }) {
  const installs = useStore((s) => s.blueprintInstalls);
  const installBlueprint = useStore((s) => s.installBlueprint);
  const existing = installs.find((i) => i.blueprintId === blueprintId);
  const bp = blueprintById(blueprintId);
  return (
    <Modal title="Already installed" onClose={onClose}
      footer={<GhostButton onClick={onClose}>Cancel</GhostButton>}>
      <p className="sub" style={{ marginBottom: 14 }}>
        “{bp?.title}” is already installed as a container. Open the existing one, or create a versioned duplicate to track a fresh run.
      </p>
      <div className="stack gap8">
        <GButton variant="primary" onClick={() => existing && onOpened(existing.id)}><ArrowRight size={14} /> Open existing blueprint</GButton>
        <GButton onClick={() => { const id = installBlueprint(blueprintId, { duplicate: true }); if (id) onOpened(id); }}><Copy size={14} /> Create a versioned duplicate</GButton>
      </div>
    </Modal>
  );
}

function ContainerView({ install, onClose }: { install: InstalledBlueprint; onClose: () => void }) {
  const reconcile = useStore((s) => s.reconcileBlueprintInstall);
  const [depth, setDepth] = useState<"macro" | "detailed">(readDepth);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BlueprintNodeStatus | "all">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [openNodeId, setOpenNodeId] = useState<string | null>(null);

  const bp = blueprintById(install.blueprintId);
  const needsUpdate = bp && install.catalogVersion < bp.version;
  const stats = installStats(install);
  const allTags = useMemo(() => [...new Set(install.nodes.flatMap((n) => n.tags))].sort(), [install.nodes]);

  function changeDepth(next: "macro" | "detailed") {
    setDepth(next);
    try { localStorage.setItem(DEPTH_KEY, next); } catch { /* ignore */ }
  }

  const q = query.trim().toLowerCase();
  const matches = (node: InstalledBlueprintNode) =>
    (statusFilter === "all" || node.status === statusFilter)
    && (tagFilter === "all" || node.tags.includes(tagFilter))
    && (!q || node.objective.toLowerCase().includes(q) || node.category.toLowerCase().includes(q) || node.tags.some((t) => t.includes(q)));

  const categories = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, InstalledBlueprintNode[]>();
    for (const node of install.nodes) {
      if (!map.has(node.category)) { map.set(node.category, []); order.push(node.category); }
      map.get(node.category)!.push(node);
    }
    return order.map((name) => ({ name, nodes: map.get(name)!.filter(matches) }))
      .filter((c) => c.nodes.length > 0);
  }, [install.nodes, q, statusFilter, tagFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GlassCard pad className="bp-container-card">
      <div className="bp-container-head">
        <GhostButton onClick={onClose} title="Back to catalog"><ChevronRight size={16} style={{ transform: "rotate(180deg)" }} /></GhostButton>
        <div className="grow">
          <div className="bp-container-title">{install.title}</div>
          <div className="bp-container-sub">
            {stats.mastered}/{stats.total} mastered · {stats.pct}% overall
            {bp && <> · <SourceBadge type={bp.source.type} name={bp.source.name} url={bp.source.url} verification={bp.source.verification} inline /></>}
          </div>
        </div>
        <div className="depth-toggle" title="Macro shows strategy; Detailed exposes objectives + trackers">
          <button type="button" className={`depth-pill ${depth === "macro" ? "on" : ""}`} onClick={() => changeDepth("macro")}>Macro</button>
          <button type="button" className={`depth-pill ${depth === "detailed" ? "on" : ""}`} onClick={() => changeDepth("detailed")}>Detailed</button>
        </div>
      </div>

      {needsUpdate && (
        <div className="bp-update-note">
          <ShieldCheck size={14} /> <span>A newer catalog version is available. Updating preserves your progress.</span>
          <GButton size="sm" onClick={() => reconcile(install.id)}>Update</GButton>
        </div>
      )}

      <div className="bp-toolbar">
        <div className="search-wrap bp-search">
          <Search size={15} />
          <input className="search-input" placeholder="Search objectives, categories, tags…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="field bp-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BlueprintNodeStatus | "all")} aria-label="Status filter">
          <option value="all">All statuses</option>
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        {allTags.length > 0 && (
          <select className="field bp-filter" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} aria-label="Tag filter">
            <option value="all">All tags</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      <div className="bp-category-list">
        {categories.map((category) => (
          <CategoryBlock key={category.name} name={category.name} nodes={category.nodes} depth={depth}
            installId={install.id} openNodeId={openNodeId} onOpenNode={setOpenNodeId} />
        ))}
        {categories.length === 0 && <div className="dim" style={{ padding: "8px 2px" }}>No nodes match the current filters.</div>}
      </div>
    </GlassCard>
  );
}

function CategoryBlock({
  name, nodes, depth, installId, openNodeId, onOpenNode,
}: {
  name: string;
  nodes: InstalledBlueprintNode[];
  depth: "macro" | "detailed";
  installId: string;
  openNodeId: string | null;
  onOpenNode: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const mastery = Math.round(nodes.reduce((sum, n) => sum + n.mastery, 0) / Math.max(1, nodes.length));
  const mastered = nodes.filter((n) => n.status === "mastered" || n.status === "done").length;

  if (depth === "macro") {
    return (
      <button type="button" className="bp-macro-cat" onClick={() => onOpenNode(openNodeId === `cat:${name}` ? null : `cat:${name}`)}>
        <span className="bp-cat-icon"><Target size={15} /></span>
        <span className="grow">
          <b>{name}</b>
          <small>{nodes.length} nodes · {mastered} mastered</small>
        </span>
        <span className="bp-cat-mastery">{mastery}%</span>
        <div className="bp-mini-track"><span style={{ width: `${mastery}%` }} /></div>
      </button>
    );
  }

  return (
    <div className={`bp-cat ${open ? "open" : ""}`}>
      <button type="button" className="bp-cat-head" onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        <span className="bp-cat-icon"><Target size={15} /></span>
        <b className="grow">{name}</b>
        <span className="bp-cat-count">{mastered}/{nodes.length}</span>
        <span className="bp-cat-mastery">{mastery}%</span>
      </button>
      {open && (
        <div className="bp-node-list">
          {nodes.map((node) => (
            <NodeRow key={node.id} node={node} installId={installId}
              open={openNodeId === node.id} onToggle={() => onOpenNode(openNodeId === node.id ? null : node.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function NodeRow({ node, installId, open, onToggle }: { node: InstalledBlueprintNode; installId: string; open: boolean; onToggle: () => void }) {
  const meta = TYPE_META[node.taskType];
  const done = node.status === "mastered" || node.status === "done";
  return (
    <div className={`bp-node ${open ? "open" : ""} ${done ? "done" : ""}`}>
      <button type="button" className="bp-node-row" onClick={onToggle}>
        <span className="bp-node-dot" style={{ background: masteryColor(node.mastery, node.status) }} />
        <span className="grow bp-node-main">
          <b>{node.objective}</b>
          <span className="bp-node-tags">
            <Tag tone={meta.tone}>{meta.label}</Tag>
            {node.sourceType && <i className={`bp-source-dot ${node.sourceType}`} title={`${node.sourceType} source`} />}
            {node.tags.slice(0, 3).map((t) => <em key={t}>#{t}</em>)}
          </span>
        </span>
        <span className="bp-node-status">{STATUS_LABEL[node.status]}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <NodeDetail node={node} installId={installId} />}
    </div>
  );
}

function NodeDetail({ node, installId }: { node: InstalledBlueprintNode; installId: string }) {
  const update = useStore((s) => s.updateBlueprintNode);
  const patch = (p: Partial<InstalledBlueprintNode>) => update(installId, node.id, p);
  const link = (key: "linkedQuestions" | "linkedAnki" | "linkedErrorLog" | "linkedAssessments", delta: number) =>
    patch({ [key]: Math.max(0, node[key] + delta) });

  return (
    <div className="bp-node-detail">
      {node.detail && <p className="bp-node-desc">{node.detail}</p>}

      <div className="bp-detail-row">
        <span className="bp-detail-label">Status</span>
        <div className="bp-status-pills">
          {STATUS_ORDER.map((s) => (
            <button key={s} type="button" className={`bp-status-pill s-${s} ${node.status === s ? "on" : ""}`} onClick={() => patch({ status: s })}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="bp-detail-row">
        <span className="bp-detail-label"><Gauge size={13} /> Mastery</span>
        <div className="bp-mastery-pills">
          {[0, 25, 50, 75, 100].map((m) => (
            <button key={m} type="button" className={`bp-mastery-pill ${node.mastery === m ? "on" : ""}`} onClick={() => patch({ mastery: m })}>{m}</button>
          ))}
          <span className="bp-mastery-val">{node.mastery}%</span>
        </div>
      </div>

      <div className="bp-link-grid">
        <LinkStepper icon={<ListChecks size={13} />} label="Questions" value={node.linkedQuestions} onStep={(d) => link("linkedQuestions", d)} />
        <LinkStepper icon={<Layers size={13} />} label="Anki" value={node.linkedAnki} onStep={(d) => link("linkedAnki", d)} />
        <LinkStepper icon={<FlaskConical size={13} />} label="Error log" value={node.linkedErrorLog} onStep={(d) => link("linkedErrorLog", d)} />
        <LinkStepper icon={<ClipboardCheck size={13} />} label="Assessments" value={node.linkedAssessments} onStep={(d) => link("linkedAssessments", d)} />
      </div>

      <div className="bp-detail-grid">
        <label className="stack gap6">
          <span className="field-label">Due date</span>
          <input className="field" type="date" value={node.dueDate ?? ""} onChange={(e) => patch({ dueDate: e.target.value || undefined })} />
        </label>
        <label className="stack gap6">
          <span className="field-label">Evidence of completion</span>
          <input className="field" placeholder="link, score, artifact…" value={node.evidenceOfCompletion ?? ""} onChange={(e) => patch({ evidenceOfCompletion: e.target.value || undefined })} />
        </label>
      </div>
      <label className="stack gap6">
        <span className="field-label">Notes</span>
        <textarea className="field" rows={2} value={node.notes ?? ""} onChange={(e) => patch({ notes: e.target.value || undefined })} />
      </label>

      <div className="bp-node-foot">
        {node.sourceUrl
          ? <a className="bp-node-source" href={node.sourceUrl} target="_blank" rel="noreferrer noopener"><ShieldCheck size={12} /> {node.sourceType} source <ExternalLink size={11} /></a>
          : <span className="bp-node-source dim"><ShieldCheck size={12} /> {node.sourceType ?? "internal"} source</span>}
        {node.resourceLinks.map((r) => (
          <a key={r.url} className={`bp-node-source kind-${r.kind}`} href={r.url} target="_blank" rel="noreferrer noopener">{r.label} <ExternalLink size={11} /></a>
        ))}
        {node.lastVerified && <span className="bp-node-verified">verified {node.lastVerified}</span>}
      </div>
    </div>
  );
}

function LinkStepper({ icon, label, value, onStep }: { icon: React.ReactNode; label: string; value: number; onStep: (delta: number) => void }) {
  return (
    <div className="bp-link-stepper">
      <span className="bp-link-label">{icon} {label}</span>
      <div className="bp-link-ctl">
        <button type="button" onClick={() => onStep(-1)} aria-label={`Decrease ${label}`}>−</button>
        <b>{value}</b>
        <button type="button" onClick={() => onStep(1)} aria-label={`Increase ${label}`}>+</button>
      </div>
    </div>
  );
}

function SourceBadge({ type, name, url, verification, inline }: { type: SourceType; name: string; url?: string; verification: string; inline?: boolean }) {
  const body = <>
    {type === "official" ? <ShieldCheck size={11} /> : type === "tool" ? <FlaskConical size={11} /> : <Trophy size={11} />}
    {type === "official" ? "Official" : type === "tool" ? "Tool" : "Internal"}
    {verification === "verified" && type === "official" ? " · verified" : ""}
  </>;
  if (inline) return <span className={`bp-source-inline kind-${type}`} title={name}>{body}</span>;
  return url
    ? <a className={`tag ${SOURCE_TONE[type] === "cyan" ? "" : SOURCE_TONE[type]} bp-source-tag`} href={url} target="_blank" rel="noreferrer noopener" title={name}>{body}</a>
    : <span className={`tag ${SOURCE_TONE[type] === "cyan" ? "" : SOURCE_TONE[type]}`} title={name}>{body}</span>;
}

function installStats(install: InstalledBlueprint) {
  const total = install.nodes.length;
  const mastered = install.nodes.filter((n) => n.status === "mastered" || n.status === "done").length;
  const pct = total ? Math.round(install.nodes.reduce((sum, n) => sum + n.mastery, 0) / total) : 0;
  return { total, mastered, pct };
}

function masteryColor(mastery: number, status: BlueprintNodeStatus): string {
  if (status === "blocked") return "var(--red)";
  if (status === "mastered" || status === "done" || mastery >= 90) return "var(--green)";
  if (mastery >= 50) return "var(--cyan)";
  if (mastery > 0 || status === "in-progress") return "var(--orange)";
  return "rgba(255,255,255,0.18)";
}

// Re-export the full catalog count for any callers that want a quick sanity number.
export const BLUEPRINT_COUNT = BLUEPRINTS.length;

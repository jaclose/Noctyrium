import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useUi } from "../lib/uiStore";
import {
  Plus, Trash2, ChevronRight, ChevronDown, ListPlus, RefreshCw, BookOpen, HelpCircle, Eye, Upload, Pencil, Brain, ExternalLink, Copy, X,
} from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../components/ui/primitives";
import { Modal, Field, SelectField, TextAreaField } from "../components/ui/Modal";
import {
  passStage, PASS_COLOR, PASS_LABEL, ankiColor, YIELD_LABEL,
  suggestMoves, scopeMastery, isCompletionKind, isQuestionKind,
} from "../lib/tracker";
import { BLUEPRINT_LANES } from "../lib/blueprintCatalog";
import { routeForBlueprintLane } from "../lib/blueprintRoutes";
import {
  appendWeekToPath,
  canonicalTrackerPath,
  compareTrackerPathSegment,
  detectWeekLabel,
  normalizeTrackerPath,
  splitLeadingWeekLabel,
  trackerItemKey,
  trackerPathKey,
} from "../lib/pathUtils";
import type { BlueprintNodeStatus, Course, InstalledBlueprint, InstalledBlueprintNode, Term, TrackerItem, TrackerKind, Yield } from "../lib/types";
import { extractPdfText, extractPlainText, type ExtractedText } from "../lib/extractText";
import { dismissAnnouncement, isAnnouncementDismissed, readDismissedAnnouncements } from "../lib/announcements";
import { pushToast } from "../lib/toast";
import { ModuleTour, type ModuleTourStep } from "../components/shell/ModuleTour";
import { ICON_SIZE } from "../lib/iconSize";

const KINDS: TrackerKind[] = ["Lecture", "DLA", "PQ", "Lab", "Reading", "Requirement", "Milestone", "Evidence", "Question Block", "Assessment", "Review Loop"];
const TABS = ["All", "Lecture", "DLA", "PQ", "Blueprint", "Extra"] as const;
type Tab = (typeof TABS)[number];
const BLUEPRINT_SCOPE_PREFIX = "blueprint:";
const BLUEPRINT_STATUS_LABEL: Record<BlueprintNodeStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  blocked: "Blocked",
  mastered: "Mastered",
  done: "Done",
};
const BLUEPRINT_STATUS_ORDER: BlueprintNodeStatus[] = ["not-started", "in-progress", "blocked", "mastered", "done"];
const TRACKER_INTRO_ANNOUNCEMENT_ID = "course-tracker-intro-v1";
export const COURSE_TRACKER_TOUR_STEPS: readonly ModuleTourStep[] = [
  { target: "tracker-import-add", title: "Import or add", body: "Import a course list or add a course and module manually. A provider is not required." },
  { target: "tracker-structure", title: "Organize the structure", body: "Use the mastery tree to choose a course or module and keep related work together." },
  { target: "tracker-passes", title: "Log passes", body: "Passes record meaningful revisits. Question rows and completion items use their own honest completion rules." },
  { target: "tracker-weak-items", title: "Find weak or untouched work", body: "Yield labels and pass state keep review items, high-value work, and untouched items visible." },
  { target: "tracker-suggestions", title: "Use suggestions", body: "Suggestions explain why an item is useful now. Opening one focuses the existing record; it does not change progress." },
] as const;
export const TRACKER_IMPORT_EXAMPLE = `Week 1:
Cell injury [Lecture] [high]
Inflammation questions [PQ] [review]
Daily learning activity [DLA]`;
const trackerIntroSession = new Set<string>();

type AnnouncementStorage = Pick<Storage, "getItem" | "setItem">;

export function announceCourseTrackerIntroOnce({
  storage = browserLocalStorage(),
  session = trackerIntroSession,
  notify = pushToast,
}: {
  storage?: AnnouncementStorage;
  session?: Set<string>;
  notify?: typeof pushToast;
} = {}): boolean {
  if (session.has(TRACKER_INTRO_ANNOUNCEMENT_ID)
    || isAnnouncementDismissed(TRACKER_INTRO_ANNOUNCEMENT_ID, readDismissedAnnouncements(storage))) return false;
  session.add(TRACKER_INTRO_ANNOUNCEMENT_ID);
  notify({
    title: "Course Tracker",
    body: "Course Tracker keeps lectures, DLAs, practice questions, and passes in one place. Start by importing or adding a module.",
    tone: "info",
    dedupe: TRACKER_INTRO_ANNOUNCEMENT_ID,
  });
  dismissAnnouncement(TRACKER_INTRO_ANNOUNCEMENT_ID, storage);
  return true;
}

function browserLocalStorage(): AnnouncementStorage | undefined {
  try { return typeof window === "undefined" ? undefined : window.localStorage; } catch { return undefined; }
}

export async function extractTrackerImportFile(
  file: File,
  pdfExtractor: (buffer: ArrayBuffer) => Promise<ExtractedText> = extractPdfText,
): Promise<{ fileName: string; extraction: ExtractedText }> {
  const lower = file.name.toLocaleLowerCase();
  if (file.type === "application/pdf" || lower.endsWith(".pdf")) {
    return { fileName: file.name, extraction: await pdfExtractor(await file.arrayBuffer()) };
  }
  if (/\.(?:txt|csv|md|markdown)$/.test(lower) || /^(?:text\/plain|text\/csv|text\/markdown)$/.test(file.type)) {
    return { fileName: file.name, extraction: extractPlainText(await file.text()) };
  }
  throw new Error("Choose a PDF, Markdown, TXT, or CSV file.");
}

const kindTone: Record<TrackerKind, "cyan" | "purple" | "orange" | "green" | "neutral"> = {
  Lecture: "cyan",
  DLA: "purple",
  PQ: "orange",
  Lab: "green",
  Reading: "neutral",
  Requirement: "green",
  Milestone: "cyan",
  Evidence: "purple",
  "Question Block": "orange",
  Assessment: "orange",
  "Review Loop": "cyan",
};
const YIELDS: Yield[] = ["none", "high", "review", "low"];
const yieldTone: Record<Yield, "cyan" | "green" | "orange" | "neutral"> = {
  none: "neutral", high: "green", review: "orange", low: "neutral",
};

export function CourseTrackerPage() {
  const s = useStore();
  const [scope, setScope] = useState<string>("");
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [moduleOpen, setModuleOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [moduleHelpOpen, setModuleHelpOpen] = useState(false);
  const [moduleTourOpen, setModuleTourOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("All");
  const [salt, setSalt] = useState(0);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const focusItemId = useUi((u) => u.focusItemId);
  const clearFocus = useUi((u) => u.clearFocus);

  useEffect(() => { announceCourseTrackerIntroOnce(); }, []);

  // Bring a specific item into view: select its scope, expand the tree, scroll
  // to it, and pulse a highlight briefly. Used by clickable suggested moves.
  function focusItem(id: string) {
    const it = s.tracker.find((t) => t.id === id);
    if (!it) return;
    setTab("All");
    setScope(it.path);
    setOpenNodes((prev) => {
      const next = new Set(prev);
      let acc = "";
      for (const p of it.path.split("/")) { acc = acc ? `${acc}/${p}` : p; next.add(acc); }
      return next;
    });
    setHighlightId(id);
    window.setTimeout(() => {
      document.querySelector(`[data-item-id="${id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 90);
    window.setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 2200);
  }

  // Consume a focus request handed over from a Dashboard suggested-move click.
  useEffect(() => {
    if (focusItemId) { focusItem(focusItemId); clearFocus(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusItemId]);

  const courseScopes = useMemo(() => collectCourseScopes(s.terms, s.courses), [s.terms, s.courses]);
  const tree = useMemo(() => buildTree(s.tracker, courseScopes), [s.tracker, courseScopes]);
  const scopeOptions = useMemo(() => mergeScopes(collectScopes(s.tracker), courseScopes), [s.tracker, courseScopes]);
  const blueprintScope = parseBlueprintScope(scope);
  const activeBlueprintInstall = blueprintScope
    ? s.blueprintInstalls.find((install) => install.id === blueprintScope.installId) ?? null
    : null;
  const activeBlueprintCategory = blueprintScope?.category;
  const activeBlueprintNodes = activeBlueprintInstall
    ? sortedBlueprintNodes(activeBlueprintInstall.nodes).filter((node) => !activeBlueprintCategory || node.category === activeBlueprintCategory)
    : [];
  const inBlueprintScope = Boolean(activeBlueprintInstall);
  const blueprintMastery = activeBlueprintNodes.length
    ? Math.round(activeBlueprintNodes.reduce((sum, node) => sum + node.mastery, 0) / activeBlueprintNodes.length)
    : 0;

  const inScope = useMemo(
    () => inBlueprintScope ? [] : scope ? s.tracker.filter((t) => t.path === scope || t.path.startsWith(scope + "/")) : s.tracker,
    [inBlueprintScope, scope, s.tracker],
  );
  const items = inScope.filter((t) => tabMatch(tab, t.kind));
  const mastery = inBlueprintScope ? blueprintMastery : scopeMastery(inScope);
  const suggestions = useMemo(() => inBlueprintScope ? [] : suggestMoves(inScope, 3, salt), [inBlueprintScope, inScope, salt]);

  function toggle(path: string) {
    setOpenNodes((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function renameCurrentScope() {
    if (!scope) return;
    const next = prompt("Rename this tracker group/path", scope);
    if (!next?.trim()) return;
    const cleaned = canonicalTrackerPath(next, scopeOptions.filter((p) => trackerPathKey(p) !== trackerPathKey(scope)));
    s.renameTrackerScope(scope, cleaned);
    setScope(cleaned);
  }

  function deleteCurrentScope() {
    if (!scope) return;
    setDeleteScope(scope);
  }

  return (
    <div className="tracker-page-shell">
      <div className="tracker-page-toolbar">
        <div><b>Course Tracker</b><span>Import structure, log passes, and keep the next useful move visible.</span></div>
        <GButton size="sm" onClick={() => setModuleHelpOpen((open) => !open)} aria-expanded={moduleHelpOpen} aria-controls={moduleHelpOpen ? "course-tracker-help" : undefined}>
          <HelpCircle size={ICON_SIZE.body} /> Help
        </GButton>
      </div>
      {moduleHelpOpen && <CourseTrackerHelpEntry onClose={() => setModuleHelpOpen(false)} onStartTour={() => { setModuleHelpOpen(false); setModuleTourOpen(true); }} />}
      <div className="tracker-grid">
        <aside className="tracker-utility-column" aria-label="Course Tracker utilities">
          <GlassCard pad data-tour="import" data-module-tour="tracker-structure">
            <PanelHeader title="Mastery tree" sub="Choose a course or module"
              action={<GhostButton title="Add one item" onClick={() => setAdding(true)}><Plus size={ICON_SIZE.emphasis} /></GhostButton>} />
            <div className="tree">
              <div className={`tree-node ${scope === "" ? "on" : ""}`} onClick={() => setScope("")}>
                <span style={{ width: 14 }} /><span>Everything</span><span className="tree-count">{s.tracker.length}</span>
              </div>
              {tree.map((node) => (
                <TreeNode key={node.path} node={node} depth={0}
                  openNodes={openNodes} onToggle={toggle} active={scope} onSelect={setScope} />
              ))}
              {tree.length === 0 && <EmptyState title="Empty tree" hint="Import or add a module to begin." />}
              <BlueprintTree installs={s.blueprintInstalls} openNodes={openNodes} onToggle={toggle} active={scope} onSelect={setScope} />
            </div>
            <div className="tracker-immediate-actions" data-module-tour="tracker-import-add">
              <GButton size="sm" className="primary" onClick={() => setBulkOpen(true)}>
                <ListPlus size={ICON_SIZE.body} /> Import lectures or items
              </GButton>
              <GButton size="sm" onClick={() => setModuleOpen(true)}>
                <BookOpen size={ICON_SIZE.body} /> Add course or module
              </GButton>
            </div>
          </GlassCard>

          <GlassCard pad className="tracker-suggestions-card" data-module-tour="tracker-suggestions">
            <PanelHeader title="Suggested next moves" sub="Based on passes, yield, and unfinished work"
              action={<GhostButton title="Refresh suggestions" onClick={() => setSalt((x) => x + 1)}><RefreshCw size={ICON_SIZE.body} /></GhostButton>} />
            {!inBlueprintScope && (
              <select className="scope-select" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Suggestion scope">
                <option value="">Everything</option>
                {scopeOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
            <div className="tracker-compact-suggestions">
              {inBlueprintScope && activeBlueprintInstall
                ? <BlueprintSuggestions install={activeBlueprintInstall} nodes={activeBlueprintNodes} />
                : suggestions.map((sg, i) => {
                  const item = sg.itemId ? s.tracker.find((candidate) => candidate.id === sg.itemId) : undefined;
                  return (
                    <div className="tracker-compact-suggestion" key={`${sg.title}-${i}`}>
                      <span className="sugg-dot" style={{ background: sg.color }} />
                      <div className="grow"><b>{sg.title}</b><span>{sg.reason}</span></div>
                      <small>~{suggestionEffortMinutes(item)} min</small>
                      <GButton size="tiny" onClick={() => sg.itemId ? focusItem(sg.itemId) : setBulkOpen(true)}>Open</GButton>
                    </div>
                  );
                })}
            </div>
          </GlassCard>
        </aside>

        <section className="tracker-work-area" aria-label="Selected Course Tracker scope">
          <GlassCard pad data-module-tour="tracker-summary">
          <div className="tk-hero">
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>
                {inBlueprintScope && activeBlueprintInstall
                  ? blueprintScope?.category ?? activeBlueprintInstall.title
                  : scope || "Everything"}
              </div>
              <div className="tk-mastery">
                {inBlueprintScope
                  ? `${activeBlueprintNodes.length} blueprint objects · ${activeBlueprintNodes.filter((n) => n.status === "done" || n.status === "mastered").length} complete · ${activeBlueprintNodes.filter((n) => n.sourceUrl).length} sourced`
                  : <>
                    {inScope.length} items · {inScope.filter((i) => i.kind === "Lecture").length} lec ·{" "}
                    {inScope.filter((i) => i.kind === "DLA").length} DLA · {inScope.filter((i) => i.passes >= 3).length} mature ·{" "}
                    {inScope.filter((i) => i.passes >= 4).length} mastered
                  </>}
              </div>
            </div>
            <div className="ring" style={{ width: 92, height: 92 }}>
              <svg width="92" height="92" viewBox="0 0 92 92">
                <circle cx="46" cy="46" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="11" />
                <circle cx="46" cy="46" r="40" fill="none" stroke="var(--cyan)" strokeWidth="11" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - mastery / 100)}
                  transform="rotate(-90 46 46)" style={{ transition: "stroke-dashoffset .5s ease" }} />
              </svg>
              <div className="ring-label" style={{ fontSize: 15 }}>{mastery}%</div>
            </div>
          </div>
          </GlassCard>

          <GlassCard pad data-tour="tracker-help" data-module-tour="tracker-passes">
          <PanelHeader title="Items" sub="Click pass boxes to fill or clear progress · click Anki blocks to cycle card mastery"
            action={
              <div className="row gap6">
                {scope && <GhostButton title="Rename selected tracker group" onClick={renameCurrentScope}><Pencil size={ICON_SIZE.body} /></GhostButton>}
                {scope && <GhostButton className="danger" title="Delete selected tracker group" onClick={deleteCurrentScope}><Trash2 size={ICON_SIZE.body} /></GhostButton>}
              </div>
            } />
          <details className="tracker-pass-help" data-module-tour="tracker-weak-items"><summary>How passes work</summary><TrackerGuide /></details>
          {inBlueprintScope && activeBlueprintInstall ? (
            <BlueprintTrackerItems install={activeBlueprintInstall} nodes={activeBlueprintNodes} category={blueprintScope?.category} />
          ) : (
            <>
              <div className="filter-bar" style={{ marginBottom: 12 }}>
                {TABS.map((t) => (
                  <button key={t} className={`filter-pill ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>{t}</button>
                ))}
              </div>
              {items.length === 0 && <EmptyState title="No items here" hint="Pick another scope, switch tabs, or import." />}
              {items.map((it) => <ItemRow key={it.id} item={it} highlight={it.id === highlightId} />)}
            </>
          )}
          </GlassCard>
        </section>
      </div>

      {adding && <TrackerEditor defaultPath={scope} onClose={() => setAdding(false)} />}
      {moduleOpen && <ModuleEditor onDone={(nextScope) => { setModuleOpen(false); if (nextScope) setScope(nextScope); }} />}
      {bulkOpen && <BulkImportModal defaultPath={scope} onClose={() => setBulkOpen(false)} />}
      {deleteScope && <DeleteScopeModal scope={deleteScope} onSelect={setScope} onClose={() => setDeleteScope(null)} />}
      {moduleTourOpen && <ModuleTour name="Course Tracker" route="tracker" steps={COURSE_TRACKER_TOUR_STEPS} onExit={() => setModuleTourOpen(false)} />}
    </div>
  );
}

function CourseTrackerHelpEntry({ onClose, onStartTour }: { onClose: () => void; onStartTour: () => void }) {
  return (
    <GlassCard pad className="tracker-help-entry" id="course-tracker-help">
      <div className="spread gap8">
        <div><b>Course Tracker help</b><span>A short guide to importing, organizing, passes, weak items, and suggestions.</span></div>
        <GhostButton aria-label="Close Course Tracker help" onClick={onClose}><X size={ICON_SIZE.body} /></GhostButton>
      </div>
      <ol>
        <li>Import a list or add a course/module.</li>
        <li>Organize work in the mastery tree.</li>
        <li>Log passes as you revisit an item.</li>
        <li>Use yield labels to mark weak or high-value work.</li>
        <li>Open a suggested move when you want a concrete next step.</li>
      </ol>
      <GButton size="sm" variant="primary" onClick={onStartTour}><HelpCircle size={ICON_SIZE.body} /> Start short tour</GButton>
    </GlassCard>
  );
}

function suggestionEffortMinutes(item?: TrackerItem) {
  if (!item) return 10;
  if (isCompletionKind(item.kind)) return 15;
  if (isQuestionKind(item.kind)) return item.yield === "review" ? 25 : 30;
  if (item.yield === "review") return 25;
  if (item.passes === 0) return 35;
  return item.passes === 1 ? 30 : 20;
}

function ItemRow({ item, highlight }: { item: TrackerItem; highlight?: boolean }) {
  const s = useStore();
  const questionStyle = isQuestionKind(item.kind);
  const completionStyle = isCompletionKind(item.kind);
  return (
    <div className={`dense-row tracker-item-row ${questionStyle ? "pq-row" : ""} ${completionStyle ? "milestone-row" : ""} ${highlight ? "row-highlight" : ""}`} data-item-id={item.id}>
      {!questionStyle && !completionStyle && <MasteryShard item={item} />}
      <div className="grow">
        <div className="dr-label">{item.label}</div>
        <div className="dr-type">{item.path}</div>
        {item.note && <div className="dr-note">{item.note}</div>}
      </div>

      <button className={`yield-badge y-${item.yield}`} onClick={() => s.cycleYield(item.id)} title="Cycle yield">
        {YIELD_LABEL[item.yield]}
      </button>
      <Tag tone={kindTone[item.kind]}>{item.kind}</Tag>

      {completionStyle ? <CompletionBlock item={item} /> : questionStyle ? <PQCompleteBlocks item={item} /> : <>
        <PassBlocks item={item} />
        <AnkiBlocks item={item} />
      </>}

      <GhostButton title="Rename item"
        onClick={() => {
          const label = prompt("Rename tracker item", item.label);
          if (label?.trim()) s.updateTrackerItem(item.id, { label: label.trim() });
        }}>
        <Pencil size={ICON_SIZE.body} />
      </GhostButton>
      <GhostButton className="danger" onClick={() => s.removeTrackerItem(item.id)}><Trash2 size={ICON_SIZE.body} /></GhostButton>
    </div>
  );
}

function PQCompleteBlocks({ item }: { item: TrackerItem }) {
  const s = useStore();
  const clamped = Math.min(item.passes, 3);
  return (
    <div className="pq-complete" aria-label="Practice question completion mastery">
      <span className="pq-label">{item.kind === "PQ" ? "Completed" : item.kind}</span>
      {[1, 2, 3].map((n) => {
        const active = clamped >= n;
        const stage = n === 1 ? "red" : n === 2 ? "young" : "mastered";
        const style = { "--block-color": PASS_COLOR[stage] } as CSSProperties;
        return (
          <button key={n}
            className={`pass-block pq-block ${active ? "on" : ""}`}
            style={style}
            onClick={() => s.setPasses(item.id, n)}
            title={`PQ completed level ${n}/3`}>
            <span>{n}</span>
          </button>
        );
      })}
      <span className="pass-num" style={{ color: clamped ? PASS_COLOR[passStage(clamped)] : PASS_COLOR.untouched }}>
        {clamped}/3
      </span>
    </div>
  );
}

function CompletionBlock({ item }: { item: TrackerItem }) {
  const s = useStore();
  const complete = item.passes > 0;
  return (
    <button className={`complete-ctl ${complete ? "done" : ""}`} onClick={() => s.setPasses(item.id, 1)}
      title={complete ? "Click to clear completion" : "Mark this requirement or milestone done"}>
      {complete ? "Done" : "Mark done"}
    </button>
  );
}

function MasteryShard({ item }: { item: TrackerItem }) {
  const stage = passStage(item.passes);
  const ankiTone = item.ankiPasses > 0 ? ankiColor(item.ankiPasses) : "rgba(255,255,255,0.12)";
  const style = {
    "--pass-color": PASS_COLOR[stage],
    "--anki-color": ankiTone,
  } as CSSProperties;

  return (
    <div className="mastery-shard" style={style}
      title={`${PASS_LABEL[stage]} · ${item.ankiPasses ? `Anki ${item.ankiPasses}/3` : "No Anki rounds yet"}`}>
      <span className="shard-pass"><Eye size={ICON_SIZE.body} /></span>
      <span className="shard-anki">A</span>
    </div>
  );
}

function PassBlocks({ item }: { item: TrackerItem }) {
  const s = useStore();
  return (
    <div className="pass-blocks" aria-label="Lecture passes">
      {[1, 2, 3, 4].map((n) => {
        const blockStage = passStage(n);
        const active = item.passes >= n;
        const style = { "--block-color": PASS_COLOR[blockStage] } as CSSProperties;
        return (
          <button key={n}
            className={`pass-block ${active ? "on" : ""} stage-${blockStage}`}
            style={style}
            onClick={() => s.setPasses(item.id, n)}
            title={`${n}${n === 4 ? "+" : ""} lecture pass${n > 1 ? "es" : ""}`}>
            <span>{n === 4 ? "4+" : n}</span>
          </button>
        );
      })}
      <span className="pass-num" style={{ color: PASS_COLOR[passStage(item.passes)] }}>
        {item.passes > 4 ? `${item.passes}` : PASS_LABEL[passStage(item.passes)]}
      </span>
    </div>
  );
}

function AnkiBlocks({ item }: { item: TrackerItem }) {
  const s = useStore();
  return (
    <button className="anki-ctl" title="Anki rounds (orange → yellow → purple)" onClick={() => s.cycleAnki(item.id)}>
      <span className="anki-label">Anki</span>
      <span className="anki-blocks">
        {[1, 2, 3].map((j) => (
          <span key={j} className="anki-block"
            style={{ background: item.ankiPasses >= j ? ankiColor(j) : "rgba(255,255,255,0.08)" }} />
        ))}
      </span>
    </button>
  );
}

function TrackerGuide() {
  return (
    <div className="tracker-guide">
      <p>Each focused review is one pass: 1 is fragile, 2 is forming, 3 is mature, and 4+ is mastered. Click the same level again to step back.</p>
      <p>Anki rounds are tracked separately. Practice-question rows use three completed levels, and yield labels help AXOM prioritize high-value or weak work.</p>
    </div>
  );
}

function BlueprintTree({
  installs, openNodes, onToggle, active, onSelect,
}: {
  installs: InstalledBlueprint[];
  openNodes: Set<string>;
  onToggle: (path: string) => void;
  active: string;
  onSelect: (scope: string) => void;
}) {
  if (installs.length === 0) {
    return (
      <div className="tracker-blueprint-spine empty" aria-label="Installed blueprints">
        <div className="tracker-blueprint-spine-head"><Brain size={ICON_SIZE.body} /> Blueprints & Exams</div>
        <a className="tracker-blueprint-empty" href="#step">Install a blueprint to spin up a container here <ChevronRight size={ICON_SIZE.body} /></a>
      </div>
    );
  }
  const byLane = new Map(installs.map((install) => [install.laneId, [] as InstalledBlueprint[]]));
  installs.forEach((install) => byLane.get(install.laneId)?.push(install));
  return (
    <div className="tracker-blueprint-spine" aria-label="Installed blueprints">
      <div className="tracker-blueprint-spine-head"><Brain size={ICON_SIZE.body} /> Blueprints & Exams</div>
      {BLUEPRINT_LANES.filter((lane) => byLane.has(lane.id)).map((lane) => {
        const laneInstalls = byLane.get(lane.id) ?? [];
        const laneKey = `bp-lane:${lane.id}`;
        const laneOpen = openNodes.has(laneKey);
        return (
          <div key={lane.id} className="tracker-blueprint-group">
            <button type="button" className="tree-node bp-tree-node" onClick={() => onToggle(laneKey)}>
              {laneOpen ? <ChevronDown size={ICON_SIZE.body} /> : <ChevronRight size={ICON_SIZE.body} />}
              <span>{lane.label}</span>
              <span className="tree-count">{laneInstalls.length}</span>
            </button>
            {laneOpen && (
              <div className="tree-children">
                <div className="tree-node bp-tree-label">
                  <span style={{ width: 14 }} />
                  <span>Installed Blueprints</span>
                  <span className="tree-count">{laneInstalls.length}</span>
                </div>
                {laneInstalls.map((install) => (
                  <BlueprintInstallTree key={install.id} install={install}
                    active={active} openNodes={openNodes} onToggle={onToggle} onSelect={onSelect} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BlueprintInstallTree({
  install, active, openNodes, onToggle, onSelect,
}: {
  install: InstalledBlueprint;
  active: string;
  openNodes: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (scope: string) => void;
}) {
  const scope = blueprintScope(install.id);
  const openKey = `bp-install:${install.id}`;
  const open = openNodes.has(openKey);
  const nodes = sortedBlueprintNodes(install.nodes);
  const categories = [...new Set(nodes.map((node) => node.category))];
  const total = nodes.length;
  const mastered = nodes.filter(isBlueprintNodeDone).length;
  const overall = total ? Math.round(nodes.reduce((sum, node) => sum + node.mastery, 0) / total) : 0;
  return (
    <div className="bp-install-tree">
      <button type="button" className={`tree-node bp-tree-node ${active === scope ? "on" : ""}`}
        onClick={() => { onToggle(openKey); onSelect(scope); }}>
        {open ? <ChevronDown size={ICON_SIZE.body} /> : <ChevronRight size={ICON_SIZE.body} />}
        <span className="grow">{install.title}</span>
        <span className="tree-count">{overall}%</span>
      </button>
      {open && (
        <div className="tree-children bp-cat-tree">
          <a className="tree-node bp-tree-open" href={`#${routeForBlueprintLane(install.laneId)}`}>
            <span style={{ width: 14 }} />
            <span>Open workbench</span>
            <ChevronRight size={ICON_SIZE.body} />
          </a>
          {categories.map((category) => {
            const catScope = blueprintScope(install.id, category);
            const catNodes = nodes.filter((node) => node.category === category);
            return (
              <button key={category} type="button" className={`tree-node bp-tree-category ${active === catScope ? "on" : ""}`}
                onClick={() => onSelect(catScope)}>
                <span style={{ width: 14 }} />
                <span className="grow">{category}</span>
                <span className="tree-count">{catNodes.filter(isBlueprintNodeDone).length}/{catNodes.length}</span>
              </button>
            );
          })}
          <div className="bp-tree-summary">{mastered}/{total} complete across this container</div>
        </div>
      )}
    </div>
  );
}

function BlueprintTrackerItems({ install, nodes, category }: { install: InstalledBlueprint; nodes: InstalledBlueprintNode[]; category?: string }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<BlueprintNodeStatus | "all">("all");
  const [tag, setTag] = useState("all");
  const tags = useMemo(() => [...new Set(nodes.flatMap((node) => node.tags))].sort(), [nodes]);
  const q = query.trim().toLowerCase();
  const filtered = sortedBlueprintNodes(nodes).filter((node) =>
    (status === "all" || node.status === status)
    && (tag === "all" || node.tags.includes(tag))
    && (!q
      || node.objective.toLowerCase().includes(q)
      || node.category.toLowerCase().includes(q)
      || node.tags.some((item) => item.toLowerCase().includes(q))),
  );

  return (
    <div className="bp-tracker-panel">
      <div className="bp-tracker-tools">
        <input className="field" placeholder={`Search ${category ?? install.title}`} value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="field" value={status} onChange={(e) => setStatus(e.target.value as BlueprintNodeStatus | "all")}>
          <option value="all">All statuses</option>
          {BLUEPRINT_STATUS_ORDER.map((item) => <option key={item} value={item}>{BLUEPRINT_STATUS_LABEL[item]}</option>)}
        </select>
        <select className="field" value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="all">All tags</option>
          {tags.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      {filtered.length === 0 && <EmptyState title="No Blueprint objects match" hint="Clear filters or pick another category in the Blueprint tree." />}
      {filtered.map((node) => <BlueprintTrackerRow key={node.id} install={install} node={node} />)}
    </div>
  );
}

function BlueprintTrackerRow({ install, node }: { install: InstalledBlueprint; node: InstalledBlueprintNode }) {
  const update = useStore((s) => s.updateBlueprintNode);
  const patch = (input: Partial<InstalledBlueprintNode>) => update(install.id, node.id, input);
  const move = (direction: -1 | 1) => moveBlueprintNode(install, node, direction, update);
  const linkedTotal = node.linkedQuestions + node.linkedAnki + node.linkedErrorLog + node.linkedAssessments;
  return (
    <div className={`bp-tracker-row ${isBlueprintNodeDone(node) ? "done" : ""}`}>
      <div className="bp-tracker-row-head">
        <span className="bp-node-dot" style={{ background: node.mastery >= 75 ? "var(--green)" : node.mastery >= 35 ? "var(--cyan)" : "rgba(255,255,255,0.22)" }} />
        <div className="grow">
          <b>{node.objective}</b>
          <span>{node.category}{node.subCategory ? ` / ${node.subCategory}` : ""}</span>
        </div>
        <div className="row gap6">
          <GhostButton title="Move up" onClick={() => move(-1)}><ChevronDown size={ICON_SIZE.body} style={{ transform: "rotate(180deg)" }} /></GhostButton>
          <GhostButton title="Move down" onClick={() => move(1)}><ChevronDown size={ICON_SIZE.body} /></GhostButton>
        </div>
      </div>
      {node.detail && <div className="dr-note">{node.detail}</div>}
      <div className="bp-tracker-edit-grid">
        <label className="stack gap6">
          <span className="field-label">Status</span>
          <select className="field" value={node.status} onChange={(e) => patch({ status: e.target.value as BlueprintNodeStatus })}>
            {BLUEPRINT_STATUS_ORDER.map((item) => <option key={item} value={item}>{BLUEPRINT_STATUS_LABEL[item]}</option>)}
          </select>
        </label>
        <label className="stack gap6">
          <span className="field-label">Mastery</span>
          <input className="field" type="range" min="0" max="100" step="5" value={node.mastery} onChange={(e) => patch({ mastery: Number(e.target.value) })} />
        </label>
        <label className="stack gap6">
          <span className="field-label">Due date</span>
          <input className="field" type="date" value={node.dueDate ?? ""} onChange={(e) => patch({ dueDate: e.target.value || undefined })} />
        </label>
        <label className="stack gap6">
          <span className="field-label">Tags</span>
          <input className="field" value={node.tags.join(", ")} onChange={(e) => patch({ tags: splitTags(e.target.value) })} />
        </label>
      </div>
      <div className="bp-linked-strip">
        <BlueprintLinkButton label="Questions" value={node.linkedQuestions} onStep={(delta) => patch({ linkedQuestions: Math.max(0, node.linkedQuestions + delta) })} />
        <BlueprintLinkButton label="Anki" value={node.linkedAnki} onStep={(delta) => patch({ linkedAnki: Math.max(0, node.linkedAnki + delta) })} />
        <BlueprintLinkButton label="Errors" value={node.linkedErrorLog} onStep={(delta) => patch({ linkedErrorLog: Math.max(0, node.linkedErrorLog + delta) })} />
        <BlueprintLinkButton label="Assessments" value={node.linkedAssessments} onStep={(delta) => patch({ linkedAssessments: Math.max(0, node.linkedAssessments + delta) })} />
        <Tag tone={linkedTotal ? "cyan" : "neutral"}>{linkedTotal} linked</Tag>
      </div>
      <div className="bp-tracker-edit-grid two">
        <label className="stack gap6">
          <span className="field-label">Evidence</span>
          <input className="field" placeholder="score, link, artifact, question set…" value={node.evidenceOfCompletion ?? ""} onChange={(e) => patch({ evidenceOfCompletion: e.target.value || undefined })} />
        </label>
        <label className="stack gap6">
          <span className="field-label">Notes</span>
          <input className="field" placeholder="what changed, what to retest, what to prove" value={node.notes ?? ""} onChange={(e) => patch({ notes: e.target.value || undefined })} />
        </label>
      </div>
      <div className="bp-tracker-foot">
        <Tag tone={node.priority === "high" ? "orange" : node.priority === "low" ? "neutral" : "cyan"}>{node.priority} priority</Tag>
        <Tag tone={node.sourceType === "official" ? "green" : node.sourceType === "tool" ? "cyan" : "neutral"}>{node.sourceType ?? "internal"} source</Tag>
        {node.sourceUrl && <a className="gbtn tiny" href={node.sourceUrl} target="_blank" rel="noreferrer noopener">Source <ExternalLink size={ICON_SIZE.microInline} /></a>}
        {node.sourceVersion && <span className="sub">{node.sourceVersion}</span>}
        {node.lastVerified && <span className="sub">source audited {node.lastVerified}</span>}
      </div>
    </div>
  );
}

function BlueprintSuggestions({ install, nodes }: { install: InstalledBlueprint; nodes: InstalledBlueprintNode[] }) {
  const next = sortedBlueprintNodes(nodes)
    .filter((node) => !isBlueprintNodeDone(node))
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority) || a.order - b.order)
    .slice(0, 3);
  if (!next.length) {
    return <div className="sugg"><span className="sugg-dot" style={{ background: "var(--green)" }} /><div className="grow"><div className="sugg-title">Container complete</div><div className="sugg-reason">All visible Blueprint objects are marked complete or mastered.</div></div></div>;
  }
  return (
    <>
      {next.map((node) => (
        <div className="tracker-compact-suggestion" key={node.id}>
          <span className="sugg-dot" style={{ background: node.priority === "high" ? "var(--orange)" : "var(--cyan)" }} />
          <div className="grow">
            <b>{node.objective}</b>
            <span>{install.title} · {node.category} · {node.mastery}% mastery</span>
          </div>
          <small>~{node.priority === "high" ? 30 : node.priority === "medium" ? 20 : 15} min</small>
          <a className="gbtn tiny" href={`#${routeForBlueprintLane(install.laneId)}`}>Open</a>
        </div>
      ))}
    </>
  );
}

function BlueprintLinkButton({ label, value, onStep }: { label: string; value: number; onStep: (delta: number) => void }) {
  return (
    <span className="bp-link-compact">
      <button type="button" onClick={() => onStep(-1)} aria-label={`Decrease ${label}`}>-</button>
      <b>{value}</b>
      <button type="button" onClick={() => onStep(1)} aria-label={`Increase ${label}`}>+</button>
      <em>{label}</em>
    </span>
  );
}

function blueprintScope(installId: string, category?: string): string {
  return `${BLUEPRINT_SCOPE_PREFIX}${installId}${category ? `::${encodeURIComponent(category)}` : ""}`;
}

function parseBlueprintScope(scope: string): { installId: string; category?: string } | null {
  if (!scope.startsWith(BLUEPRINT_SCOPE_PREFIX)) return null;
  const raw = scope.slice(BLUEPRINT_SCOPE_PREFIX.length);
  const [installId, encodedCategory] = raw.split("::");
  if (!installId) return null;
  return { installId, category: encodedCategory ? decodeURIComponent(encodedCategory) : undefined };
}

function sortedBlueprintNodes(nodes: InstalledBlueprintNode[]): InstalledBlueprintNode[] {
  return [...nodes].sort((a, b) => a.order - b.order || a.category.localeCompare(b.category) || a.objective.localeCompare(b.objective));
}

function isBlueprintNodeDone(node: InstalledBlueprintNode) {
  return node.status === "done" || node.status === "mastered";
}

function splitTags(input: string): string[] {
  return [...new Set(input.split(",").map((item) => item.trim().replace(/^#/, "")).filter(Boolean))];
}

function priorityWeight(priority: InstalledBlueprintNode["priority"]) {
  return priority === "high" ? 3 : priority === "medium" ? 2 : 1;
}

function moveBlueprintNode(
  install: InstalledBlueprint,
  node: InstalledBlueprintNode,
  direction: -1 | 1,
  update: (installId: string, nodeId: string, patch: Partial<InstalledBlueprintNode>) => void,
) {
  const siblings = sortedBlueprintNodes(install.nodes.filter((candidate) => candidate.category === node.category));
  const index = siblings.findIndex((candidate) => candidate.id === node.id);
  const target = siblings[index + direction];
  if (!target) return;
  update(install.id, node.id, { order: target.order });
  update(install.id, target.id, { order: node.order });
}

interface TNode { path: string; name: string; children: TNode[]; count: number; }

function buildTree(items: TrackerItem[], extraScopes: string[] = []): TNode[] {
  const root: TNode = { path: "", name: "", children: [], count: 0 };
  for (const scope of extraScopes) addScope(root, scope, 0);
  for (const it of items) {
    addScope(root, it.path, 1);
  }
  sortTree(root.children);
  return root.children;
}

function addScope(root: TNode, path: string, countDelta: number) {
  const parts = path.split("/").filter(Boolean);
  let cur = root;
  let acc = "";
  for (const p of parts) {
    acc = acc ? `${acc}/${p}` : p;
    let child = cur.children.find((c) => c.path === acc);
    if (!child) { child = { path: acc, name: p, children: [], count: 0 }; cur.children.push(child); }
    child.count += countDelta;
    cur = child;
  }
}

function sortTree(nodes: TNode[]) {
  nodes.sort((a, b) => compareTrackerPathSegment(a.name, b.name));
  nodes.forEach((n) => sortTree(n.children));
}

function collectScopes(items: TrackerItem[]): string[] {
  const set = new Set<string>();
  for (const it of items) {
    const parts = it.path.split("/");
    let acc = "";
    for (const p of parts) { acc = acc ? `${acc}/${p}` : p; set.add(acc); }
  }
  return [...set].sort();
}

function collectCourseScopes(terms: Term[], courses: Course[]): string[] {
  const termName = new Map(terms.map((t) => [t.id, t.name]));
  const scopes: string[] = [];
  for (const c of courses) {
    const term = termName.get(c.termId) ?? "Term";
    const courseBase = `${term}/${c.code}`;
    scopes.push(courseBase);
    c.modules.forEach((m) => scopes.push(`${courseBase}/${m.name}`));
  }
  return scopes;
}


function mergeScopes(a: string[], b: string[]) {
  return [...new Set([...a, ...b])].sort((x, y) => x.localeCompare(y));
}

function tabMatch(tab: Tab, kind: TrackerKind): boolean {
  if (tab === "All") return true;
  if (tab === "Extra") return kind === "Lab" || kind === "Reading";
  if (tab === "Blueprint") return isCompletionKind(kind) || kind === "Question Block" || kind === "Assessment" || kind === "Review Loop";
  return tab === kind;
}

function ModuleEditor({ onDone }: { onDone: (nextScope?: string) => void }) {
  const s = useStore();
  const [courseId, setCourseId] = useState(s.courses[0]?.id ?? "");
  const [name, setName] = useState("");
  const course = s.courses.find((c) => c.id === courseId);
  const term = course ? s.terms.find((t) => t.id === course.termId) : undefined;

  function save() {
    if (!course || !name.trim()) return;
    const moduleName = name.trim();
    s.addModule(course.id, moduleName);
    onDone(`${term?.name ?? "Term"}/${course.code}/${moduleName}`);
  }

  return (
    <Modal title="Add course module" onClose={() => onDone()}
      footer={<><GButton onClick={() => onDone()}>Cancel</GButton><GButton variant="primary" onClick={save}>Add module</GButton></>}>
      <SelectField label="Course" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
        {s.courses.map((c) => {
          const t = s.terms.find((termItem) => termItem.id === c.termId);
          return <option key={c.id} value={c.id}>{t?.name ?? "Term"} / {c.code}</option>;
        })}
      </SelectField>
      <Field label="Module name" placeholder="FTM 1, NB3, Cardio, Renal..." value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="sub">After saving, the module appears as a Course Tracker destination. Bulk-import lectures, DLAs, and PQs into that scope.</div>
    </Modal>
  );
}

function DeleteScopeModal({ scope, onSelect, onClose }: { scope: string; onSelect: (scope: string) => void; onClose: () => void }) {
  const s = useStore();
  const [mode, setMode] = useState<"move" | "delete">("move");
  const scopeOptions = useMemo(
    () => mergeScopes(collectScopes(s.tracker), collectCourseScopes(s.terms, s.courses))
      .filter((p) => trackerPathKey(p) !== trackerPathKey(scope) && !trackerPathKey(p).startsWith(`${trackerPathKey(scope)}/`)),
    [s.tracker, s.terms, s.courses, scope],
  );
  const [destination, setDestination] = useState(scopeOptions[0] ?? "");
  const contained = s.tracker.filter((t) => {
    const key = trackerPathKey(t.path);
    const current = trackerPathKey(scope);
    return key === current || key.startsWith(`${current}/`);
  });
  const canonicalDestination = canonicalTrackerPath(destination, scopeOptions);
  const canMove = Boolean(canonicalDestination && trackerPathKey(canonicalDestination) !== trackerPathKey(scope));

  function run() {
    if (contained.length === 0) {
      onClose();
      return;
    }
    if (mode === "move") {
      if (!canMove) return;
      s.renameTrackerScope(scope, canonicalDestination);
      onSelect(canonicalDestination);
    } else {
      s.removeTrackerScope(scope);
      onSelect("");
    }
    onClose();
  }

  return (
    <Modal title="Remove tracker directory" onClose={onClose}
      footer={<>
        <GButton onClick={onClose}>Cancel</GButton>
        <GButton variant={mode === "delete" ? undefined : "primary"} disabled={mode === "move" && !canMove} onClick={run}>
          {contained.length === 0 ? "Close" : mode === "move" ? "Move items" : "Delete items"}
        </GButton>
      </>}>
      <div className="stack gap12">
        <div className="form-warning">
          <b>{scope}</b> contains {contained.length} tracker item{contained.length === 1 ? "" : "s"}.
          {contained.length === 0 ? " Empty course shells live in the course map, so there is nothing destructive to remove here." : " Choose what should happen before AXOM touches the data."}
        </div>
        {contained.length > 0 && (
          <>
            <SelectField label="Action" value={mode} onChange={(e) => setMode(e.target.value as "move" | "delete")}>
              <option value="move">Move contained items elsewhere</option>
              <option value="delete">Delete contained items</option>
            </SelectField>
            {mode === "move" ? (
              <div>
                <Field label="Move to directory" value={destination} list="delete-scope-destinations"
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Choose or type a destination" />
                <datalist id="delete-scope-destinations">
                  {scopeOptions.map((p) => <option key={p} value={p} />)}
                </datalist>
                <div className="sub" style={{ marginTop: 4 }}>
                  {canMove
                    ? <>Destination: <span className="mono">{canonicalDestination}</span></>
                    : "Pick a destination outside the directory being removed."}
                </div>
              </div>
            ) : (
              <div className="form-warning danger">
                This permanently removes the contained tracker rows from Local Vault. Export a JSON backup first if you are unsure.
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

function TreeNode({
  node, depth, openNodes, onToggle, active, onSelect,
}: {
  node: TNode; depth: number; openNodes: Set<string>;
  onToggle: (p: string) => void; active: string; onSelect: (p: string) => void;
}) {
  const open = openNodes.has(node.path);
  const hasKids = node.children.length > 0;
  return (
    <>
      <div className={`tree-node depth${Math.min(depth, 2)} ${active === node.path ? "on" : ""}`}
        style={{ "--tree-indent": `${depth * 14}px` } as CSSProperties}
        onClick={() => { onSelect(node.path); if (hasKids) onToggle(node.path); }}>
        {hasKids ? (open ? <ChevronDown size={ICON_SIZE.body} /> : <ChevronRight size={ICON_SIZE.body} />) : <span style={{ width: 14 }} />}
        <span>{node.name}</span>
        <span className="tree-count">{node.count}</span>
      </div>
      {open && node.children.map((c) => (
        <TreeNode key={c.path} node={c} depth={depth + 1}
          openNodes={openNodes} onToggle={onToggle} active={active} onSelect={onSelect} />
      ))}
    </>
  );
}

function TrackerEditor({ defaultPath, onClose }: { defaultPath: string; onClose: () => void }) {
  const s = useStore();
  const scopeSuggestions = useMemo(() => mergeScopes(collectScopes(s.tracker), collectCourseScopes(s.terms, s.courses)), [s.tracker, s.terms, s.courses]);
  const [path, setPath] = useState(defaultPath || "Term 1/General/Lectures");
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<TrackerKind>("Lecture");
  const canonicalPath = canonicalTrackerPath(path, scopeSuggestions);
  return (
    <Modal title="Add tracker item" onClose={onClose}
      footer={<><GButton onClick={onClose}>Cancel</GButton>
        <GButton variant="primary" onClick={() => { if (label.trim()) { s.addTrackerItem({ path: canonicalPath, label: label.trim(), kind, passes: 0, ankiPasses: 0, yield: "none" }); onClose(); } }}>Add</GButton></>}>
      <Field label="Path (e.g. T2/NB3/Lectures)" value={path} list="single-tracker-scope-options" onChange={(e) => setPath(e.target.value)} />
      <datalist id="single-tracker-scope-options">
        {scopeSuggestions.map((p) => <option key={p} value={p} />)}
      </datalist>
      <Field label="Label" placeholder="NB 63 Anxiety Disorders" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
      <SelectField label="Kind" value={kind} onChange={(e) => setKind(e.target.value as TrackerKind)}>
        {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
      </SelectField>
      <div className="sub">The path builds the tree. Exact existing names are reused after trimming/case cleanup. Destination: <span className="mono">{canonicalPath || "—"}</span></div>
    </Modal>
  );
}

function BulkImportModal({ defaultPath, onClose }: { defaultPath: string; onClose: () => void }) {
  const s = useStore();
  const [path, setPath] = useState(defaultPath || "Term 2/NB3/Lectures");
  const [kind, setKind] = useState<TrackerKind>("Lecture");
  const [defaultYield, setDefaultYield] = useState<Yield>("none");
  const [text, setText] = useState("");
  const [stripNums, setStripNums] = useState(true);
  const [skipDupes, setSkipDupes] = useState(true);
  const [loadedFileName, setLoadedFileName] = useState("");
  const [fileWarnings, setFileWarnings] = useState<string[]>([]);
  const [fileError, setFileError] = useState("");
  const [exampleStatus, setExampleStatus] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const exampleRef = useRef<HTMLTextAreaElement>(null);

  // Existing destinations so the field autocompletes instead of spawning duplicate folders.
  const scopeSuggestions = useMemo(
    () => mergeScopes(collectScopes(s.tracker), collectCourseScopes(s.terms, s.courses)),
    [s.tracker, s.terms, s.courses],
  );
  const existing = useMemo(
    () => new Set(s.tracker.map((t) => trackerItemKey(t.path, t.label))),
    [s.tracker],
  );
  const canonicalPath = canonicalTrackerPath(path, scopeSuggestions);
  const pathIsNew = canonicalPath.trim() !== "" && !scopeSuggestions.some((p) => trackerPathKey(p) === trackerPathKey(canonicalPath));
  const rows = useMemo(
    () => parseImportRows(text, canonicalPath, kind, defaultYield, stripNums, existing, scopeSuggestions),
    [text, canonicalPath, kind, defaultYield, stripNums, existing, scopeSuggestions],
  );
  const toImport = rows.filter((r) => !r.duplicate || !skipDupes);
  const dupeCount = rows.length - toImport.length;
  const kindCounts = useMemo(() => {
    const counts: Partial<Record<TrackerKind, number>> = {};
    for (const r of toImport) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
    return counts;
  }, [toImport]);
  const yieldCounts = useMemo(() => {
    const counts: Partial<Record<Yield, number>> = {};
    for (const r of toImport) counts[r.yield] = (counts[r.yield] ?? 0) + 1;
    return counts;
  }, [toImport]);

  function run() {
    if (!toImport.length) return;
    s.bulkAddTrackerItems(
      toImport.map((r) => ({
        path: r.path,
        label: r.label,
        kind: r.kind,
        passes: r.passes,
        ankiPasses: isQuestionKind(r.kind) || isCompletionKind(r.kind) ? 0 : r.ankiPasses,
        yield: r.yield,
        note: r.note,
      })),
    );
    onClose();
  }

  async function loadFile(file: File) {
    setFileError("");
    setFileWarnings([]);
    try {
      const result = await extractTrackerImportFile(file);
      setLoadedFileName(result.fileName);
      setFileWarnings(result.extraction.warnings);
      setText(result.extraction.text);
    } catch (error) {
      setLoadedFileName(file.name);
      setFileError(error instanceof Error ? error.message : "This file could not be read.");
    }
  }

  async function copyExample() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(TRACKER_IMPORT_EXAMPLE);
      setExampleStatus("Example copied.");
    } catch {
      exampleRef.current?.focus();
      exampleRef.current?.select();
      setExampleStatus("Clipboard unavailable. The example is selected for manual copy.");
    }
  }

  return (
    <Modal title="Import tracker items" onClose={onClose}
      footer={<>
        <GButton onClick={onClose}>Cancel</GButton>
        <GButton variant="primary" disabled={!toImport.length} onClick={run}>
          Import {toImport.length || ""} item{toImport.length === 1 ? "" : "s"}
        </GButton>
      </>}>
      <p className="sub">Paste one item per line, or open a PDF, Markdown, TXT, or CSV file. AXOM extracts supported text locally and shows a preview before anything is added.</p>
      <div className="tracker-import-example">
        <div className="spread gap8"><b>Copyable format</b><GButton size="tiny" onClick={copyExample}><Copy size={ICON_SIZE.microInline} /> Copy example</GButton></div>
        <textarea ref={exampleRef} className="field" aria-label="Structured tracker import example" readOnly value={TRACKER_IMPORT_EXAMPLE} rows={4} />
        {exampleStatus && <span role="status">{exampleStatus}</span>}
      </div>
      <details className="tracker-import-details">
        <summary>Formatting details</summary>
        <ol className="import-steps">
          <li>Pick a destination, kind, and yield. Tags such as <span className="mono">[DLA]</span>, <span className="mono">[PQ]</span>, <span className="mono">[high]</span>, or <span className="mono">[review]</span> can override one line.</li>
          <li>CSV headers may include <span className="mono">label, kind, path, week, yield, passes, anki, note</span>. A line ending in “:” becomes a folder for the rows beneath it.</li>
          <li>Duplicate rows are skipped by default. You can review every parsed row before importing.</li>
        </ol>
      </details>
      <div className="row gap12">
        <div className="grow">
          <Field label="Destination path" value={path} list="tracker-scope-options"
            placeholder="Start typing — picks an existing folder" onChange={(e) => setPath(e.target.value)} />
          <datalist id="tracker-scope-options">
            {scopeSuggestions.map((p) => <option key={p} value={p} />)}
          </datalist>
          <div className="sub" style={{ marginTop: 4 }}>
            {pathIsNew
              ? <span style={{ color: "var(--orange)" }}>★ Add new directory: <span className="mono">{canonicalPath}</span>.</span>
              : <span style={{ color: "var(--green)" }}>✓ Existing directory selected: <span className="mono">{canonicalPath || "—"}</span>.</span>}
            {" "}Trim, double spaces, and case-only differences are normalized before import.
          </div>
        </div>
        <SelectField label="Default kind" value={kind} onChange={(e) => setKind(e.target.value as TrackerKind)}>
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </SelectField>
        <SelectField label="Default yield" value={defaultYield} onChange={(e) => setDefaultYield(e.target.value as Yield)}>
          {YIELDS.map((y) => <option key={y} value={y}>{YIELD_LABEL[y]}</option>)}
        </SelectField>
      </div>
      <TextAreaField label="One name per line"
        placeholder={"Module 3:\nNB 58 Emotions [Lecture] [high]\nNB 58 Introduction to Psychopathology [DLA] [review] [passes=1]\nNB 60 Biological Rhythms [PQ]\n\nCSV also works:\nlabel,kind,path,yield,passes,anki,note\nSleep and rhythms,Lecture,Term 2/BPM 501/NB3,review,1,1,Rewatch circadian section"}
        value={text} onChange={(e) => setText(e.target.value)} rows={9} autoFocus />
      <div className="row wrap gap12" style={{ alignItems: "center" }}>
        <label className="row gap8" style={{ fontSize: 13, color: "var(--text-60)", cursor: "pointer" }}>
          <input type="checkbox" checked={stripNums} onChange={(e) => setStripNums(e.target.checked)} />
          Strip leading numbering (“1.”, “1)”, “- ”)
        </label>
        <label className="row gap8" style={{ fontSize: 13, color: "var(--text-60)", cursor: "pointer" }}>
          <input type="checkbox" checked={skipDupes} onChange={(e) => setSkipDupes(e.target.checked)} />
          Skip duplicates already in tracker
        </label>
        <GButton size="sm" onClick={() => fileRef.current?.click()}>
          <Upload size={ICON_SIZE.body} /> Open PDF, Markdown, TXT, or CSV
        </GButton>
        <input ref={fileRef} type="file" accept=".pdf,.md,.markdown,.txt,.csv,application/pdf,text/markdown,text/plain,text/csv" hidden
          onChange={(e) => e.target.files?.[0] && void loadFile(e.target.files[0])} />
      </div>
      {loadedFileName && <div className="sub">Opened: <b>{loadedFileName}</b></div>}
      {fileWarnings.map((warning) => <div className="form-warning" key={warning}>{warning}</div>)}
      {fileError && <div className="form-warning danger" role="alert">{fileError}</div>}
      <div className="sub">No GPT or provider is required. If you choose an external formatting aid, review whether the file contains sensitive or private information before sharing it.</div>
      {rows.length > 0 && (
        <div className="import-preview">
          <div className="sub">
            {toImport.length} item{toImport.length === 1 ? "" : "s"} ready → <span className="mono">{canonicalPath || "—"}</span>
            {dupeCount > 0 && <> · <span style={{ color: "var(--orange)" }}>
              {dupeCount} duplicate{dupeCount === 1 ? "" : "s"}{skipDupes ? " skipped" : " will be re-added"}
            </span></>}
          </div>
          <div className="row wrap gap6" style={{ marginTop: 6 }}>
            {KINDS.filter((k) => kindCounts[k]).map((k) => (
              <Tag key={k} tone={kindTone[k]}>{kindCounts[k]} {k}</Tag>
            ))}
            {YIELDS.filter((y) => y !== "none" && yieldCounts[y]).map((y) => (
              <Tag key={y} tone={yieldTone[y]}>{yieldCounts[y]} {YIELD_LABEL[y]}</Tag>
            ))}
          </div>
          <div className="import-preview-list">
            {rows.slice(0, 8).map((r, i) => (
              <div key={i} className={`import-preview-row ${r.duplicate ? "dupe" : ""}`}>
                <span className="mono">{r.path}</span>
                <span>{r.label}</span>
                <Tag tone={kindTone[r.kind]}>{r.kind}</Tag>
                {r.yield !== "none" && <Tag tone={yieldTone[r.yield]}>{YIELD_LABEL[r.yield]}</Tag>}
                {(r.passes > 0 || r.ankiPasses > 0) && <Tag tone="neutral">{r.passes} pass{r.passes === 1 ? "" : "es"}{r.ankiPasses ? ` · Anki ${r.ankiPasses}` : ""}</Tag>}
                {r.duplicate && <Tag tone="orange">Duplicate</Tag>}
              </div>
            ))}
            {rows.length > 8 && <div className="sub">…and {rows.length - 8} more</div>}
          </div>
        </div>
      )}
    </Modal>
  );
}

interface ImportRow {
  path: string;
  label: string;
  kind: TrackerKind;
  yield: Yield;
  passes: number;
  ankiPasses: number;
  note?: string;
  duplicate: boolean;
}

const KIND_TAG_RE = /\[(lecture|dla|pq|lab|reading|requirement|milestone|evidence|question[-\s]?block|assessment|review[-\s]?loop)\]/i;
const YIELD_TAG_RE = /\[(high(?:[-\s]?yield)?|needs[-\s]?review|review|low(?:[-\s]?yield)?)\]/i;
const PASS_TAG_RE = /\[(?:passes?|p)=(\d+)\]/i;
const ANKI_TAG_RE = /\[(?:anki|a)=(\d+)\]/i;
const CSV_HEADERS = new Set(["label", "name", "title", "kind", "type", "path", "scope", "destination", "module", "week", "yield", "priority", "passes", "pass", "anki", "ankipasses", "note", "notes"]);

function parseImportRows(
  text: string,
  basePath: string,
  defaultKind: TrackerKind,
  defaultYield: Yield,
  stripNums: boolean,
  existing: Set<string>,
  scopeSuggestions: string[],
): ImportRow[] {
  const csv = parseCsvRows(text);
  const header = csv[0]?.map((cell) => normalizeHeader(cell)) ?? [];
  const hasHeader = header.some((cell) => CSV_HEADERS.has(cell)) && header.some((cell) => ["label", "name", "title"].includes(cell));
  if (hasHeader) {
    return csv.slice(1).flatMap((cells) => rowFromCsv(cells, header, basePath, defaultKind, defaultYield, stripNums, existing, scopeSuggestions));
  }

  const rows: ImportRow[] = [];
  let subPath = "";
  for (const raw of text.split("\n")) {
    let line = raw.trim();
    if (!line) { subPath = ""; continue; }

    const headerMatch = line.match(/^#*\s*(.+):$/);
    if (headerMatch && !KIND_TAG_RE.test(line) && !YIELD_TAG_RE.test(line)) {
      let header = headerMatch[1].trim();
      if (stripNums) header = header.replace(/^(\d+[.)]\s*|[-*•]\s*)/, "").trim();
      const week = detectWeekLabel(header);
      if (week) {
        subPath = week.label;
        continue;
      }
      subPath = header;
      continue;
    }

    if (stripNums) line = line.replace(/^(\d+[.)]\s*|[-*•]\s*)/, "").trim();
    if (!line) continue;

    const parsed = extractInlineMetadata(line, defaultKind, defaultYield);
    let kind = parsed.kind;
    let itemYield = parsed.yield;
    let passes = parsed.passes;
    let ankiPasses = parsed.ankiPasses;
    line = parsed.label;
    const leadingWeek = splitLeadingWeekLabel(line);
    if (leadingWeek.week) {
      subPath = leadingWeek.week.label;
      line = leadingWeek.label;
    }

    const commaIdx = line.indexOf(",");
    if (commaIdx > -1) {
      const cells = parseCsvLine(line);
      const first = cells[0]?.trim() ?? "";
      const maybeKind = parseKind(cells[1], kind);
      const maybePath = cells[2]?.trim();
      const maybeYield = parseYield(cells[3], itemYield);
      if (first && cells.length > 1) {
        kind = maybeKind;
        itemYield = maybeYield;
        line = first;
        if (cells[4]) passes = clampInt(Number(cells[4]), 0, maxPassesForKind(kind));
        if (cells[5]) ankiPasses = clampInt(Number(cells[5]), 0, 3);
        const fullPath = maybePath || appendWeekToPath(basePath, subPath);
        rows.push(makeImportRow(fullPath, line, kind, itemYield, passes, ankiPasses, cells[6], existing));
        continue;
      }
    }

    if (!line) continue;
    const fullPath = appendWeekToPath(basePath, subPath);
    rows.push(makeImportRow(fullPath, line, kind, itemYield, passes, ankiPasses, undefined, existing));
  }
  return rows;
}

function rowFromCsv(
  cells: string[],
  header: string[],
  basePath: string,
  defaultKind: TrackerKind,
  defaultYield: Yield,
  stripNums: boolean,
  existing: Set<string>,
  scopeSuggestions: string[],
): ImportRow[] {
  const get = (...names: string[]) => {
    const index = header.findIndex((h) => names.includes(h));
    return index >= 0 ? cells[index]?.trim() ?? "" : "";
  };
  let label = get("label", "name", "title");
  if (stripNums) label = label.replace(/^(\d+[.)]\s*|[-*•]\s*)/, "").trim();
  if (!label) return [];
  const kind = parseKind(get("kind", "type"), defaultKind);
  const itemYield = parseYield(get("yield", "priority"), defaultYield);
  const rawPath = get("path", "scope", "destination");
  const module = get("module");
  const week = get("week");
  const weekLabel = detectWeekLabel(week)?.label || week;
  const base = rawPath ? canonicalTrackerPath(rawPath, scopeSuggestions) : (module ? `${basePath}/${module}` : basePath);
  const path = appendWeekToPath(base, weekLabel);
  const passes = clampInt(Number(get("passes", "pass")), 0, maxPassesForKind(kind));
  const ankiPasses = isQuestionKind(kind) || isCompletionKind(kind) ? 0 : clampInt(Number(get("anki", "ankipasses")), 0, 3);
  return [makeImportRow(path, label, kind, itemYield, passes, ankiPasses, get("note", "notes"), existing)];
}

function makeImportRow(
  path: string,
  label: string,
  kind: TrackerKind,
  y: Yield,
  passes: number,
  ankiPasses: number,
  note: string | undefined,
  existing: Set<string>,
): ImportRow {
  const cleanPath = normalizeTrackerPath(path);
  const cleanLabel = label.trim();
  return {
    path: cleanPath,
    label: cleanLabel,
    kind,
    yield: y,
    passes: clampInt(passes, 0, maxPassesForKind(kind)),
    ankiPasses: isQuestionKind(kind) || isCompletionKind(kind) ? 0 : clampInt(ankiPasses, 0, 3),
    note: note?.trim() || undefined,
    duplicate: existing.has(trackerItemKey(cleanPath, cleanLabel)),
  };
}

function extractInlineMetadata(raw: string, defaultKind: TrackerKind, defaultYield: Yield) {
  let label = raw;
  let kind = defaultKind;
  let itemYield = defaultYield;
  let passes = 0;
  let ankiPasses = 0;

  const tagMatch = label.match(KIND_TAG_RE);
  if (tagMatch) {
    kind = parseKind(tagMatch[1], defaultKind);
    label = label.replace(KIND_TAG_RE, "").trim();
  }

  const prefixMatch = label.match(/^(lecture|dla|pq|lab|reading|requirement|milestone|evidence|question[-\s]?block|assessment|review[-\s]?loop)\s*[:|-]\s*/i);
  if (prefixMatch) {
    kind = parseKind(prefixMatch[1], kind);
    label = label.replace(prefixMatch[0], "").trim();
  }

  const yieldMatch = label.match(YIELD_TAG_RE);
  if (yieldMatch) {
    itemYield = parseYield(yieldMatch[1], defaultYield);
    label = label.replace(YIELD_TAG_RE, "").trim();
  }

  const passMatch = label.match(PASS_TAG_RE);
  if (passMatch) {
    passes = clampInt(Number(passMatch[1]), 0, maxPassesForKind(kind));
    label = label.replace(PASS_TAG_RE, "").trim();
  }

  const ankiMatch = label.match(ANKI_TAG_RE);
  if (ankiMatch) {
    ankiPasses = clampInt(Number(ankiMatch[1]), 0, 3);
    label = label.replace(ANKI_TAG_RE, "").trim();
  }

  return { label, kind, yield: itemYield, passes, ankiPasses };
}

function parseKind(value: unknown, fallback: TrackerKind): TrackerKind {
  const clean = String(value ?? "").trim().toLowerCase().replace(/[-_\s]+/g, "");
  return KINDS.find((k) => k.toLowerCase().replace(/[-_\s]+/g, "") === clean) ?? fallback;
}

function maxPassesForKind(kind: TrackerKind): number {
  if (isCompletionKind(kind)) return 1;
  if (isQuestionKind(kind)) return 3;
  return 12;
}

function parseYield(value: unknown, fallback: Yield): Yield {
  const clean = String(value ?? "").trim().toLowerCase().replace(/[-_\s]+/g, "");
  if (!clean) return fallback;
  if (clean === "high" || clean === "highyield" || clean === "hy") return "high";
  if (clean === "review" || clean === "needsreview" || clean === "weak") return "review";
  if (clean === "low" || clean === "lowyield") return "low";
  if (clean === "none" || clean === "normal") return "none";
  return fallback;
}

function parseCsvRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => parseCsvLine(line))
    .filter((row) => row.some((cell) => cell.trim()));
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      i++;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      out.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current.trim());
  return out;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z]/g, "");
}

function clampInt(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

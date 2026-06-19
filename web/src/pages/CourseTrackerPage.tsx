import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useUi } from "../lib/uiStore";
import {
  Plus, Trash2, ChevronRight, ChevronDown, ListPlus, RefreshCw, BookOpen, HelpCircle, Eye, Upload, Pencil,
} from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../components/ui/primitives";
import { Modal, Field, SelectField, TextAreaField } from "../components/ui/Modal";
import {
  passStage, PASS_COLOR, PASS_LABEL, ankiColor, YIELD_LABEL,
  suggestMoves, scopeMastery,
} from "../lib/tracker";
import { canonicalTrackerPath, normalizeTrackerPath, trackerItemKey, trackerPathKey } from "../lib/pathUtils";
import type { Course, Term, TrackerItem, TrackerKind, Yield } from "../lib/types";

const KINDS: TrackerKind[] = ["Lecture", "DLA", "PQ", "Lab", "Reading"];
const TABS = ["All", "Lecture", "DLA", "PQ", "Extra"] as const;
type Tab = (typeof TABS)[number];

const kindTone: Record<TrackerKind, "cyan" | "purple" | "orange" | "green" | "neutral"> = {
  Lecture: "cyan", DLA: "purple", PQ: "orange", Lab: "green", Reading: "neutral",
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
  const [guideOpen, setGuideOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("All");
  const [salt, setSalt] = useState(0);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const focusItemId = useUi((u) => u.focusItemId);
  const clearFocus = useUi((u) => u.clearFocus);

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

  const inScope = scope ? s.tracker.filter((t) => t.path === scope || t.path.startsWith(scope + "/")) : s.tracker;
  const items = inScope.filter((t) => tabMatch(tab, t.kind));
  const mastery = scopeMastery(inScope);
  const suggestions = useMemo(() => suggestMoves(inScope, 3, salt), [inScope, salt]);

  function toggle(path: string) {
    setOpenNodes((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
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
    <div className="tracker-grid">
      <GlassCard pad data-tour="import">
        <PanelHeader title="Mastery tree" sub="Click any group to expand or collapse it"
          action={
            <div className="row gap6">
              <GhostButton title="Add a course module" onClick={() => setModuleOpen(true)}><BookOpen size={16} /></GhostButton>
              <GhostButton title="Bulk import lectures" onClick={() => setBulkOpen(true)}><ListPlus size={16} /></GhostButton>
              <GhostButton title="Add one item" onClick={() => setAdding(true)}><Plus size={16} /></GhostButton>
            </div>} />
        <div className="tree">
          <div className={`tree-node ${scope === "" ? "on" : ""}`} onClick={() => setScope("")}>
            <span style={{ width: 14 }} /><span>Everything</span><span className="tree-count">{s.tracker.length}</span>
          </div>
          {tree.map((node) => (
            <TreeNode key={node.path} node={node} depth={0}
              openNodes={openNodes} onToggle={toggle} active={scope} onSelect={setScope} />
          ))}
          {tree.length === 0 && <EmptyState title="Empty tree" hint="Bulk-import your lectures to begin." />}
        </div>
        <GButton size="sm" className="primary" style={{ marginTop: 12, width: "100%" }} onClick={() => setBulkOpen(true)}>
          <ListPlus size={15} /> Import lectures by name
        </GButton>
        <GButton size="sm" style={{ marginTop: 8, width: "100%" }} onClick={() => setModuleOpen(true)}>
          <BookOpen size={15} /> Add course module
        </GButton>
      </GlassCard>

      <div className="stack gap16">
        {/* Adaptive suggested next move with scope dropdown + refresh */}
        <GlassCard pad>
          <PanelHeader title="Suggested next move" sub="Adaptive — by passes, yield, and how much is left"
            action={
              <div className="row gap6">
                <GButton size="sm" onClick={() => setGuideOpen((open) => !open)}>
                  <HelpCircle size={14} /> {guideOpen ? "Hide guide" : "How passes work"}
                </GButton>
                <select className="scope-select" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Scope">
                  <option value="">Everything</option>
                  {scopeOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <GhostButton title="Refresh suggestions" onClick={() => setSalt((x) => x + 1)}><RefreshCw size={15} /></GhostButton>
              </div>} />
          {guideOpen && <TrackerGuide />}
          <div className="stack gap8">
            {suggestions.map((sg, i) => (
              <div className={`sugg ${sg.itemId ? "clickable" : ""}`} key={i}
                onClick={() => sg.itemId && focusItem(sg.itemId)}>
                <span className="sugg-dot" style={{ background: sg.color }} />
                <div className="grow">
                  <div className="sugg-title">{sg.title}</div>
                  <div className="sugg-reason">{sg.reason}</div>
                </div>
                {sg.itemId && <PassPlus id={sg.itemId} />}
              </div>
            ))}
          </div>
          <div className="pass-legend">
            <span><i style={{ background: PASS_COLOR.untouched }} />0 pass: blue</span>
            <span><i style={{ background: PASS_COLOR.red }} />1 pass: red</span>
            <span><i style={{ background: PASS_COLOR.young }} />2 passes: young</span>
            <span><i style={{ background: PASS_COLOR.mature }} />3 passes: mature</span>
            <span><i style={{ background: PASS_COLOR.mastered }} />4+: mastered</span>
            <span><i style={{ background: ankiColor(1) }} />Anki 1</span>
            <span><i style={{ background: ankiColor(2) }} />Anki 2</span>
            <span><i style={{ background: ankiColor(3) }} />Anki 3</span>
          </div>
        </GlassCard>

        <GlassCard pad>
          <div className="tk-hero">
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{scope || "Everything"}</div>
              <div className="tk-mastery">
                {inScope.length} items · {inScope.filter((i) => i.kind === "Lecture").length} lec ·{" "}
                {inScope.filter((i) => i.kind === "DLA").length} DLA · {inScope.filter((i) => i.passes >= 3).length} mature ·{" "}
                {inScope.filter((i) => i.passes >= 4).length} mastered
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

        <GlassCard pad data-tour="tracker-help">
          <PanelHeader title="Items" sub="Click pass boxes to fill or clear progress · click Anki blocks to cycle card mastery"
            action={
              <div className="row gap6">
                {scope && <GhostButton title="Rename selected tracker group" onClick={renameCurrentScope}><Pencil size={14} /></GhostButton>}
                {scope && <GhostButton className="danger" title="Delete selected tracker group" onClick={deleteCurrentScope}><Trash2 size={14} /></GhostButton>}
                <GButton size="sm" onClick={() => setGuideOpen((open) => !open)}><HelpCircle size={14} /> {guideOpen ? "Hide" : "Help"}</GButton>
              </div>
            } />
          {guideOpen && <TrackerGuide />}
          <div className="filter-bar" style={{ marginBottom: 12 }}>
            {TABS.map((t) => (
              <button key={t} className={`filter-pill ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
          {items.length === 0 && <EmptyState title="No items here" hint="Pick another scope, switch tabs, or import." />}
          {items.map((it) => <ItemRow key={it.id} item={it} highlight={it.id === highlightId} />)}
        </GlassCard>
      </div>

      {adding && <TrackerEditor defaultPath={scope} onClose={() => setAdding(false)} />}
      {moduleOpen && <ModuleEditor onDone={(nextScope) => { setModuleOpen(false); if (nextScope) setScope(nextScope); }} />}
      {bulkOpen && <BulkImportModal defaultPath={scope} onClose={() => setBulkOpen(false)} />}
      {deleteScope && <DeleteScopeModal scope={deleteScope} onSelect={setScope} onClose={() => setDeleteScope(null)} />}
    </div>
  );
}

function ItemRow({ item, highlight }: { item: TrackerItem; highlight?: boolean }) {
  const s = useStore();
  const isPQ = item.kind === "PQ";
  return (
    <div className={`dense-row tracker-item-row ${isPQ ? "pq-row" : ""} ${highlight ? "row-highlight" : ""}`} data-item-id={item.id}>
      {!isPQ && <MasteryShard item={item} />}
      <div className="grow">
        <div className="dr-label">{item.label}</div>
        <div className="dr-type">{item.path}</div>
      </div>

      <button className={`yield-badge y-${item.yield}`} onClick={() => s.cycleYield(item.id)} title="Cycle yield">
        {YIELD_LABEL[item.yield]}
      </button>
      <Tag tone={kindTone[item.kind]}>{item.kind}</Tag>

      {isPQ ? <PQCompleteBlocks item={item} /> : <>
        <PassBlocks item={item} />
        <AnkiBlocks item={item} />
      </>}

      <GhostButton title="Rename item"
        onClick={() => {
          const label = prompt("Rename tracker item", item.label);
          if (label?.trim()) s.updateTrackerItem(item.id, { label: label.trim() });
        }}>
        <Pencil size={14} />
      </GhostButton>
      <GhostButton className="danger" onClick={() => s.removeTrackerItem(item.id)}><Trash2 size={14} /></GhostButton>
    </div>
  );
}

function PQCompleteBlocks({ item }: { item: TrackerItem }) {
  const s = useStore();
  const clamped = Math.min(item.passes, 3);
  return (
    <div className="pq-complete" aria-label="Practice question completion mastery">
      <span className="pq-label">Completed</span>
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
      <span className="shard-pass"><Eye size={13} /></span>
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
      <div className="guide-title">How the Course Tracker works</div>

      <div className="guide-section">
        <div className="guide-h"><span className="guide-num">1</span> Log a pass</div>
        <p>Every time you study an item, click its <b>pass boxes</b> (1 → 2 → 3 → 4+). Click a box again to clear back a level. The left edge changes colour as mastery grows:</p>
        <div className="guide-scale">
          <GuideStep color={PASS_COLOR.untouched} n="0" label="Untouched" note="exists, no pass yet" />
          <GuideStep color={PASS_COLOR.red} n="1" label="Red" note="first exposure — fragile" />
          <GuideStep color={PASS_COLOR.young} n="2" label="Young" note="recall forming" />
          <GuideStep color={PASS_COLOR.mature} n="3" label="Mature" note="solid for questions" />
          <GuideStep color={PASS_COLOR.mastered} n="4+" label="Mastered" note="keep alive w/ spaced review" />
        </div>
      </div>

      <div className="guide-section">
        <div className="guide-h"><span className="guide-num">2</span> Track Anki rounds</div>
        <p>The right-hand <b>Anki</b> blocks are a separate recall layer — click to cycle rounds:</p>
        <div className="guide-scale">
          <GuideStep color={ankiColor(1)} n="1" label="Orange" note="first card pass" />
          <GuideStep color={ankiColor(2)} n="2" label="Yellow" note="stabilizing" />
          <GuideStep color={ankiColor(3)} n="3" label="Purple" note="Anki mastery" />
        </div>
      </div>

      <div className="guide-section">
        <div className="guide-h"><span className="guide-num">3</span> Set yield &amp; rename</div>
        <p>
          Click the <b>yield badge</b> to cycle <i>Set yield → High → Needs review → Low</i> — this feeds “Suggested next move”.
          New items start at <b>Set yield</b>. <b>Rename</b> any item with the <Pencil size={11} /> pencil, or rename a whole
          group from the Items header. <b>PQ rows</b> use a simpler <b>Completed 1·2·3</b> (no Anki side).
        </p>
      </div>
    </div>
  );
}

function GuideStep({ color, n, label, note }: { color: string; n: string; label: string; note: string }) {
  return (
    <div className="guide-step">
      <span className="guide-step-dot" style={{ background: color }}>{n}</span>
      <div><b>{label}</b><small>{note}</small></div>
    </div>
  );
}

function PassPlus({ id }: { id: string }) {
  const bump = useStore((st) => st.bumpPasses);
  return (
    <button className="gbtn tiny" onClick={(e) => { e.stopPropagation(); bump(id, +1); }} title="Log a pass">
      <Plus size={12} /> Pass
    </button>
  );
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
  nodes.sort((a, b) => a.name.localeCompare(b.name));
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
          {contained.length === 0 ? " Empty course shells live in the course map, so there is nothing destructive to remove here." : " Choose what should happen before Noctyrium touches the data."}
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
        onClick={() => { onSelect(node.path); if (hasKids) onToggle(node.path); }}>
        {hasKids ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span style={{ width: 14 }} />}
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
  const [path, setPath] = useState(defaultPath || "T1/General/Lectures");
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
  const [path, setPath] = useState(defaultPath || "T2/NB3/Lectures");
  const [kind, setKind] = useState<TrackerKind>("Lecture");
  const [defaultYield, setDefaultYield] = useState<Yield>("none");
  const [text, setText] = useState("");
  const [stripNums, setStripNums] = useState(true);
  const [skipDupes, setSkipDupes] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

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
        ankiPasses: r.kind === "PQ" ? 0 : r.ankiPasses,
        yield: r.yield,
        note: r.note,
      })),
    );
    onClose();
  }

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return (
    <Modal title="Import tracker items" onClose={onClose}
      footer={<>
        <GButton onClick={onClose}>Cancel</GButton>
        <GButton variant="primary" disabled={!toImport.length} onClick={run}>
          Import {toImport.length || ""} item{toImport.length === 1 ? "" : "s"}
        </GButton>
      </>}>
      <ol className="import-steps">
        <li>Pick the <b>destination</b>, default <b>kind</b>, and default <b>yield</b>. Inline tags like <span className="mono">[DLA]</span>, <span className="mono">[PQ]</span>, <span className="mono">[high]</span>, <span className="mono">[review]</span>, <span className="mono">[passes=2]</span>, or <span className="mono">[anki=1]</span> override a single line.</li>
        <li>Paste one item per line, or upload CSV with headers: <span className="mono">label, kind, path, yield, passes, anki, note</span>. A plain line ending in “:” becomes a sub-folder for the lines beneath it.</li>
        <li>Preview duplicates, yield flags, and starting mastery before importing. Duplicate rows are skipped by default.</li>
      </ol>
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
          <Upload size={14} /> Upload .txt / .csv
        </GButton>
        <input ref={fileRef} type="file" accept=".txt,.csv,text/plain,text/csv" hidden
          onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
      </div>
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

const KIND_TAG_RE = /\[(lecture|dla|pq|lab|reading)\]/i;
const YIELD_TAG_RE = /\[(high(?:[-\s]?yield)?|needs[-\s]?review|review|low(?:[-\s]?yield)?)\]/i;
const PASS_TAG_RE = /\[(?:passes?|p)=(\d+)\]/i;
const ANKI_TAG_RE = /\[(?:anki|a)=(\d+)\]/i;
const CSV_HEADERS = new Set(["label", "name", "title", "kind", "type", "path", "scope", "destination", "module", "yield", "priority", "passes", "pass", "anki", "ankipasses", "note", "notes"]);

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
        if (cells[4]) passes = clampInt(Number(cells[4]), 0, kind === "PQ" ? 3 : 12);
        if (cells[5]) ankiPasses = clampInt(Number(cells[5]), 0, 3);
        const fullPath = maybePath || (subPath ? `${basePath}/${subPath}` : basePath);
        rows.push(makeImportRow(fullPath, line, kind, itemYield, passes, ankiPasses, cells[6], existing));
        continue;
      }
    }

    if (!line) continue;
    const fullPath = subPath ? `${basePath}/${subPath}` : basePath;
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
  const path = rawPath ? canonicalTrackerPath(rawPath, scopeSuggestions) : (module ? `${basePath}/${module}` : basePath);
  const passes = clampInt(Number(get("passes", "pass")), 0, kind === "PQ" ? 3 : 12);
  const ankiPasses = kind === "PQ" ? 0 : clampInt(Number(get("anki", "ankipasses")), 0, 3);
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
    passes: clampInt(passes, 0, kind === "PQ" ? 3 : 12),
    ankiPasses: kind === "PQ" ? 0 : clampInt(ankiPasses, 0, 3),
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

  const prefixMatch = label.match(/^(lecture|dla|pq|lab|reading)\s*[:|-]\s*/i);
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
    passes = clampInt(Number(passMatch[1]), 0, kind === "PQ" ? 3 : 12);
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
  const clean = String(value ?? "").trim().toLowerCase();
  return KINDS.find((k) => k.toLowerCase() === clean) ?? fallback;
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

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Plus, Trash2, ChevronRight, ChevronDown, ListPlus, RefreshCw, BookOpen, HelpCircle, Eye,
} from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../components/ui/primitives";
import { Modal, Field, SelectField, TextAreaField } from "../components/ui/Modal";
import {
  passStage, PASS_COLOR, PASS_LABEL, ankiColor, YIELD_LABEL,
  suggestMoves, scopeMastery,
} from "../lib/tracker";
import type { Course, Term, TrackerItem, TrackerKind } from "../lib/types";

const KINDS: TrackerKind[] = ["Lecture", "DLA", "PQ", "Lab", "Reading"];
const TABS = ["All", "Lecture", "DLA", "PQ", "Extra"] as const;
type Tab = (typeof TABS)[number];

const kindTone: Record<TrackerKind, "cyan" | "purple" | "orange" | "green" | "neutral"> = {
  Lecture: "cyan", DLA: "purple", PQ: "orange", Lab: "green", Reading: "neutral",
};

export function CourseTrackerPage() {
  const s = useStore();
  const [scope, setScope] = useState<string>("");
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [moduleOpen, setModuleOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("All");
  const [salt, setSalt] = useState(0);

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

  return (
    <div className="tracker-grid">
      <GlassCard pad>
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
                <GhostButton title="Open tracker guide" onClick={() => setGuideOpen((open) => !open)}>
                  <HelpCircle size={15} />
                </GhostButton>
                <select className="scope-select" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Scope">
                  <option value="">Everything</option>
                  {scopeOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <GhostButton title="Refresh suggestions" onClick={() => setSalt((x) => x + 1)}><RefreshCw size={15} /></GhostButton>
              </div>} />
          {guideOpen && <TrackerGuide />}
          <div className="stack gap8">
            {suggestions.map((sg, i) => (
              <div className="sugg" key={i} onClick={() => sg.itemId && setScope(scope)}>
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

        <GlassCard pad>
          <PanelHeader title="Items" sub="Click pass boxes to fill or clear progress · click Anki blocks to cycle card mastery" />
          <div className="filter-bar" style={{ marginBottom: 12 }}>
            {TABS.map((t) => (
              <button key={t} className={`filter-pill ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
          {items.length === 0 && <EmptyState title="No items here" hint="Pick another scope, switch tabs, or import." />}
          {items.map((it) => <ItemRow key={it.id} item={it} />)}
        </GlassCard>
      </div>

      {adding && <TrackerEditor defaultPath={scope} onClose={() => setAdding(false)} />}
      {moduleOpen && <ModuleEditor onDone={(nextScope) => { setModuleOpen(false); if (nextScope) setScope(nextScope); }} />}
      {bulkOpen && <BulkImportModal defaultPath={scope} onClose={() => setBulkOpen(false)} />}
    </div>
  );
}

function ItemRow({ item }: { item: TrackerItem }) {
  const s = useStore();
  return (
    <div className="dense-row tracker-item-row">
      <MasteryShard item={item} />
      <div className="grow">
        <div className="dr-label">{item.label}</div>
        <div className="dr-type">{item.path}</div>
      </div>

      <button className={`yield-badge y-${item.yield}`} onClick={() => s.cycleYield(item.id)} title="Cycle yield">
        {YIELD_LABEL[item.yield]}
      </button>
      <Tag tone={kindTone[item.kind]}>{item.kind}</Tag>

      <PassBlocks item={item} />
      <AnkiBlocks item={item} />

      <GhostButton className="danger" onClick={() => s.removeTrackerItem(item.id)}><Trash2 size={14} /></GhostButton>
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
      <div className="guide-title">Course Tracker guide</div>
      <div className="guide-grid">
        <GuideChip color={PASS_COLOR.untouched} label="Blue" note="Untouched. It exists in the tracker, but no pass has been logged." />
        <GuideChip color={PASS_COLOR.red} label="Red" note="One lecture/DLA/PQ pass. Fragile and should be reinforced soon." />
        <GuideChip color={PASS_COLOR.young} label="Light green" note="Two passes. Young memory; one more pass moves it to mature." />
        <GuideChip color={PASS_COLOR.mature} label="Green" note="Three passes. Mature enough for maintenance and questions." />
        <GuideChip color={PASS_COLOR.mastered} label="Dark green" note="Four or more passes. Mastered for this tracker cycle." />
        <GuideChip color={ankiColor(1)} label="Anki 1" note="First card pass/round. The right side of the shard turns on." />
        <GuideChip color={ankiColor(2)} label="Anki 2" note="Second card pass. More stable recall." />
        <GuideChip color={ankiColor(3)} label="Anki 3" note="Third card pass. Purple means Anki mastery." />
      </div>
      <div className="guide-note">
        Click a pass box to set lecture mastery directly. Click the Anki control to cycle 0 → 1 → 2 → 3 → 0.
        Yield stays separate and feeds suggested next moves.
      </div>
    </div>
  );
}

function GuideChip({ color, label, note }: { color: string; label: string; note: string }) {
  return (
    <div className="guide-chip">
      <span style={{ background: color }} />
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
  const [path, setPath] = useState(defaultPath || "T1/General/Lectures");
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<TrackerKind>("Lecture");
  return (
    <Modal title="Add tracker item" onClose={onClose}
      footer={<><GButton onClick={onClose}>Cancel</GButton>
        <GButton variant="primary" onClick={() => { if (label.trim()) { s.addTrackerItem({ path: path.trim(), label: label.trim(), kind, passes: 0, ankiPasses: 0, yield: "none" }); onClose(); } }}>Add</GButton></>}>
      <Field label="Path (e.g. T2/NB3/Lectures)" value={path} onChange={(e) => setPath(e.target.value)} />
      <Field label="Label" placeholder="NB 63 Anxiety Disorders" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
      <SelectField label="Kind" value={kind} onChange={(e) => setKind(e.target.value as TrackerKind)}>
        {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
      </SelectField>
      <div className="sub">The path builds the tree. Use “/” to nest, e.g. <span className="mono">T2/NB3/DLAs</span>.</div>
    </Modal>
  );
}

function BulkImportModal({ defaultPath, onClose }: { defaultPath: string; onClose: () => void }) {
  const s = useStore();
  const [path, setPath] = useState(defaultPath || "T2/NB3/Lectures");
  const [kind, setKind] = useState<TrackerKind>("Lecture");
  const [text, setText] = useState("");
  const [stripNums, setStripNums] = useState(true);

  const names = parseNames(text, stripNums);

  function run() {
    if (!names.length) return;
    s.bulkAddTrackerItems(
      names.map((label) => ({ path: path.trim(), label, kind, passes: 0, ankiPasses: 0, yield: "none" as const })),
    );
    onClose();
  }

  return (
    <Modal title="Import lectures by name" onClose={onClose}
      footer={<>
        <GButton onClick={onClose}>Cancel</GButton>
        <GButton variant="primary" disabled={!names.length} onClick={run}>
          Import {names.length || ""} item{names.length === 1 ? "" : "s"}
        </GButton>
      </>}>
      <div className="row gap12">
        <Field label="Destination path" value={path} onChange={(e) => setPath(e.target.value)} />
        <SelectField label="Kind" value={kind} onChange={(e) => setKind(e.target.value as TrackerKind)}>
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </SelectField>
      </div>
      <TextAreaField label="One name per line"
        placeholder={"NB 58 Emotions\nNB 58 Introduction to Psychopathology\nNB 60 Biological Rhythms"}
        value={text} onChange={(e) => setText(e.target.value)} rows={9} autoFocus />
      <label className="row gap8" style={{ fontSize: 13, color: "var(--text-60)", cursor: "pointer" }}>
        <input type="checkbox" checked={stripNums} onChange={(e) => setStripNums(e.target.checked)} />
        Strip leading numbering (“1.”, “1)”, “- ”)
      </label>
      <div className="sub">{names.length} item{names.length === 1 ? "" : "s"} → <span className="mono">{path || "—"}</span> as <b>{kind}</b>, all starting at <b>0 passes</b>.</div>
    </Modal>
  );
}

function parseNames(text: string, stripNums: boolean): string[] {
  return text.split("\n").map((l) => {
    let v = l.trim();
    if (stripNums) v = v.replace(/^(\d+[.)]\s*|[-*•]\s*)/, "").trim();
    return v;
  }).filter(Boolean);
}

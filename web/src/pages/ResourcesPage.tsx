import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Star, ExternalLink, Search, ListPlus, Link as LinkIcon } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../components/ui/primitives";
import { Modal, Field, SelectField, TextAreaField } from "../components/ui/Modal";
import type { Resource } from "../lib/types";

export function ResourcesPage() {
  const s = useStore();
  const [editing, setEditing] = useState<Resource | "new" | null>(null);
  const [bulk, setBulk] = useState(false);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  const categories = useMemo(
    () => ["All", "★ Favorites", ...Array.from(new Set(s.resources.map((r) => r.category)))],
    [s.resources],
  );

  const shown = s.resources.filter((r) => {
    if (cat === "★ Favorites" && !r.favorite) return false;
    if (cat !== "All" && cat !== "★ Favorites" && r.category !== cat) return false;
    if (q && !(`${r.title} ${r.url} ${r.tags.join(" ")} ${r.note ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <>
      <GlassCard pad>
        <PanelHeader title="Resources" sub="Saved hyperlinks — STEP 1 prep, references, decks, tools"
          action={
            <div className="row gap8">
              <GButton size="sm" onClick={() => setBulk(true)}><ListPlus size={15} /> Import links</GButton>
              <GButton size="sm" variant="primary" onClick={() => setEditing("new")}><Plus size={15} /> Add</GButton>
            </div>} />
        <div className="row gap8" style={{ marginBottom: 12 }}>
          <div className="search-wrap grow">
            <Search size={15} />
            <input className="search-input" placeholder="Search resources…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="filter-bar">
          {categories.map((c) => (
            <button key={c} className={`filter-pill ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </GlassCard>

      {shown.length === 0 && (
        <GlassCard pad><EmptyState icon={<LinkIcon size={26} />} title="No resources" hint="Add a link or import a batch to start your library." /></GlassCard>
      )}

      <div className="grid grid-courses">
        {shown.map((r) => (
          <GlassCard pad hoverable key={r.id} className="folder-card">
            <div className="card-hover-tools">
              <GhostButton onClick={() => setEditing(r)}><Pencil size={14} /></GhostButton>
              <GhostButton className="danger" onClick={() => s.removeResource(r.id)}><Trash2 size={14} /></GhostButton>
            </div>
            <div className="row gap8" style={{ alignItems: "flex-start" }}>
              <span className="folder-icon"><Favicon url={r.url} /></span>
              <button className={`star ${r.favorite ? "on" : ""}`} onClick={() => s.toggleResourceFavorite(r.id)} title="Favorite">
                <Star size={15} fill={r.favorite ? "currentColor" : "none"} />
              </button>
            </div>
            <div className="fc-name">{r.title}</div>
            <div className="fc-desc truncate">{hostOf(r.url)}</div>
            {r.note && <div className="fc-desc">{r.note}</div>}
            <div className="row wrap gap6">
              <Tag tone="cyan">{r.category}</Tag>
              {r.tags.slice(0, 3).map((t) => <Tag key={t} tone="neutral">#{t}</Tag>)}
            </div>
            <a className="gbtn sm" href={r.url} target="_blank" rel="noreferrer" style={{ marginTop: "auto" }}>
              Open <ExternalLink size={13} />
            </a>
          </GlassCard>
        ))}
      </div>

      {editing && <ResourceEditor resource={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {bulk && <BulkLinksModal onClose={() => setBulk(false)} />}
    </>
  );
}

function Favicon({ url }: { url: string }) {
  const host = hostOf(url);
  if (!host) return <LinkIcon size={18} />;
  return <img className="favicon" src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} alt="" width={18} height={18} />;
}

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function ResourceEditor({ resource, onClose }: { resource: Resource | null; onClose: () => void }) {
  const s = useStore();
  const [title, setTitle] = useState(resource?.title ?? "");
  const [url, setUrl] = useState(resource?.url ?? "");
  const [category, setCategory] = useState(resource?.category ?? "STEP 1");
  const [tags, setTags] = useState((resource?.tags ?? []).join(", "));
  const [note, setNote] = useState(resource?.note ?? "");

  function save() {
    if (!title.trim() || !url.trim()) return;
    const payload = {
      title: title.trim(), url: normalizeUrl(url.trim()), category: category.trim() || "General",
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean), note: note.trim() || undefined,
      favorite: resource?.favorite,
    };
    if (resource) s.updateResource(resource.id, payload);
    else s.addResource(payload);
    onClose();
  }

  return (
    <Modal title={resource ? "Edit resource" : "Add resource"} onClose={onClose}
      footer={<><GButton onClick={onClose}>Cancel</GButton><GButton variant="primary" onClick={save}>Save</GButton></>}>
      <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <Field label="URL" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
      <div className="row gap12">
        <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {["STEP 1", "Reference", "Anki", "Tools", "Videos", "Question Banks", "General"].map((c) => <option key={c}>{c}</option>)}
        </SelectField>
        <Field label="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>
      <TextAreaField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
    </Modal>
  );
}

/** Paste many links at once: "Title | URL" per line, or just URLs. */
function BulkLinksModal({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [category, setCategory] = useState("STEP 1");
  const [text, setText] = useState("");

  const parsed = parseLinks(text);

  function run() {
    if (!parsed.length) return;
    s.bulkAddResources(parsed.map((p) => ({ ...p, category, tags: [] })));
    onClose();
  }

  return (
    <Modal title="Import links" onClose={onClose}
      footer={<><GButton onClick={onClose}>Cancel</GButton>
        <GButton variant="primary" disabled={!parsed.length} onClick={run}>Import {parsed.length || ""}</GButton></>}>
      <SelectField label="Category for all" value={category} onChange={(e) => setCategory(e.target.value)}>
        {["STEP 1", "Reference", "Anki", "Tools", "Videos", "Question Banks", "General"].map((c) => <option key={c}>{c}</option>)}
      </SelectField>
      <TextAreaField label={'One per line — "Title | https://url" or just a URL'}
        placeholder={"Boards & Beyond | https://www.boardsbeyond.com\nhttps://www.uptodate.com"}
        value={text} onChange={(e) => setText(e.target.value)} rows={9} autoFocus />
      <div className="sub">{parsed.length} link{parsed.length === 1 ? "" : "s"} detected.</div>
    </Modal>
  );
}

function parseLinks(text: string): { title: string; url: string }[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
    const [a, b] = line.split("|").map((x) => x.trim());
    if (b) return { title: a, url: normalizeUrl(b) };
    const url = normalizeUrl(a);
    return { title: hostOf(url), url };
  }).filter((r) => /\./.test(r.url));
}

function normalizeUrl(u: string): string {
  if (!/^https?:\/\//i.test(u)) return `https://${u}`;
  return u;
}

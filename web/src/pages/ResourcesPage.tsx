import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Star, ExternalLink, Search, ListPlus, Link as LinkIcon, HardDrive } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../components/ui/primitives";
import { Modal, Field, SelectField, TextAreaField } from "../components/ui/Modal";
import type { Resource } from "../lib/types";

const CATEGORIES = ["STEP 1", "STEP 2", "Drives", "Reference", "Anki", "Tools", "Videos", "Question Banks", "General"];

export function ResourcesPage() {
  const s = useStore();
  const [editing, setEditing] = useState<Resource | "new" | null>(null);
  const [addDrive, setAddDrive] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  const drives = s.resources.filter((r) => r.category === "Drives");

  const categories = useMemo(
    () => ["All", "★ Favorites", ...Array.from(new Set(s.resources.map((r) => r.category)))],
    [s.resources],
  );

  const shown = s.resources.filter((r) => {
    if (r.category === "Drives") return false; // drives live in their own band
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

      {/* Shared Drives — curated, mostly SGU. Always visible. */}
      {(cat === "All" || cat === "Drives") && (
        <GlassCard pad className="drives-band">
          <PanelHeader title="Shared Drives" sub="Resource drives & packages — a lot of this is from SGU. These ship with the app for everyone."
            action={<GButton size="sm" onClick={() => setAddDrive(true)}><Plus size={15} /> Add drive</GButton>} />
          {drives.length === 0 ? (
            <EmptyState icon={<HardDrive size={24} />} title="No drives yet"
              hint="Paste an SGU shared-drive / Google Drive link — it stays here permanently." />
          ) : (
            <div className="grid grid-courses">
              {drives.map((r) => {
                const href = usableHref(r.url);
                const body = (
                  <>
                    <span className="folder-icon"><HardDrive size={18} /></span>
                    <div className="grow">
                      <div className="fc-name">{r.title}</div>
                      <div className="fc-desc truncate">{href ? hostOf(href) : "Missing or invalid drive link"}</div>
                    </div>
                    {href ? <ExternalLink size={14} /> : <Pencil size={14} />}
                  </>
                );
                return href
                  ? <a key={r.id} className="drive-tile" href={href} target="_blank" rel="noreferrer">{body}</a>
                  : <button key={r.id} className="drive-tile missing" onClick={() => setEditing(r)}>{body}</button>;
              })}
            </div>
          )}
        </GlassCard>
      )}

      {shown.length === 0 && cat !== "Drives" && (
        <GlassCard pad><EmptyState icon={<LinkIcon size={26} />} title="No resources" hint="Add a link or import a batch to start your library." /></GlassCard>
      )}

      <div className="grid grid-courses">
        {shown.map((r) => {
          const href = usableHref(r.url);
          return (
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
            <div className="fc-desc truncate">{href ? hostOf(href) : "Missing or invalid link"}</div>
            {r.note && <div className="fc-desc">{r.note}</div>}
            <div className="row wrap gap6">
              <Tag tone="cyan">{r.category}</Tag>
              {r.tags.slice(0, 3).map((t) => <Tag key={t} tone="neutral">#{t}</Tag>)}
            </div>
            {href
              ? <a className="gbtn sm" href={href} target="_blank" rel="noreferrer" style={{ marginTop: "auto" }}>
                  Open <ExternalLink size={13} />
                </a>
              : <button className="gbtn sm resource-missing" onClick={() => setEditing(r)} style={{ marginTop: "auto" }}>
                  Add working link
                </button>}
          </GlassCard>
        );})}
      </div>

      {editing && <ResourceEditor resource={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {addDrive && <ResourceEditor resource={null} defaultCategory="Drives" onClose={() => setAddDrive(false)} />}
      {bulk && <BulkLinksModal onClose={() => setBulk(false)} />}
    </>
  );
}

function Favicon({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const host = hostOf(url);
  if (!host || failed || !/\./.test(host)) return <LinkIcon size={18} />;
  return (
    <img className="favicon" src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
      alt="" width={18} height={18} loading="lazy" onError={() => setFailed(true)} />
  );
}

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function ResourceEditor({ resource, defaultCategory, onClose }: { resource: Resource | null; defaultCategory?: string; onClose: () => void }) {
  const s = useStore();
  const [title, setTitle] = useState(resource?.title ?? "");
  const [url, setUrl] = useState(resource?.url ?? "");
  const [category, setCategory] = useState(resource?.category ?? defaultCategory ?? "STEP 1");
  const [tags, setTags] = useState((resource?.tags ?? []).join(", "));
  const [note, setNote] = useState(resource?.note ?? "");

  const normalized = url.trim() ? normalizeUrl(url.trim()) : "";
  const urlValid = !url.trim() || Boolean(usableHref(normalized));

  function save() {
    if (!title.trim() || !url.trim()) return;
    if (!usableHref(normalized)) return;
    const payload = {
      title: title.trim(), url: normalized, category: category.trim() || "General",
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean), note: note.trim() || undefined,
      favorite: resource?.favorite,
    };
    if (resource) s.updateResource(resource.id, payload);
    else s.addResource(payload);
    onClose();
  }

  return (
    <Modal title={resource ? "Edit resource" : defaultCategory === "Drives" ? "Add shared drive" : "Add resource"} onClose={onClose}
      footer={<><GButton onClick={onClose}>Cancel</GButton><GButton variant="primary" onClick={save}>Save</GButton></>}>
      <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <Field label="URL" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
      {!urlValid && <div className="form-warning">Paste a complete http(s) URL. Google Drive links are welcome here.</div>}
      <div className="row gap12">
        <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
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
        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </SelectField>
      <ol className="import-steps">
        <li>Choose the bucket first: <b>Drives</b> for SGU / Google Drive packages, <b>STEP 1</b> or <b>STEP 2</b> for board resources.</li>
        <li>Paste one link per line. Use <span className="mono">Title | URL</span> when you want a clean name.</li>
        <li>Blank or malformed links are ignored, so dead placeholders will not be imported.</li>
      </ol>
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
  }).filter((r) => Boolean(usableHref(r.url)));
}

function normalizeUrl(u: string): string {
  if (!/^https?:\/\//i.test(u)) return `https://${u}`;
  return u;
}

function usableHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

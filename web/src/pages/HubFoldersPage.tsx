import { useState } from "react";
import type { ChangeEvent } from "react";
import { Archive, ArrowDown, ArrowUp, Plus, Trash2, Pencil, ExternalLink, Star } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, GhostButton, EmptyState } from "../components/ui/primitives";
import { Modal, Field, SelectField } from "../components/ui/Modal";
import { Icon, ICON_NAMES } from "../lib/icons";
import type { HubFolder } from "../lib/types";

export function HubFoldersPage() {
  const s = useStore();
  const [editing, setEditing] = useState<HubFolder | "new" | null>(null);
  const activeFolders = s.folders.filter((folder) => !folder.archived);
  const archivedFolders = s.folders.filter((folder) => folder.archived);

  function move(folder: HubFolder, direction: -1 | 1) {
    const list = activeFolders;
    const index = list.findIndex((item) => item.id === folder.id);
    const target = list[index + direction];
    if (!target) return;
    s.updateFolder(folder.id, { sortOrder: target.sortOrder ?? index + direction });
    s.updateFolder(target.id, { sortOrder: folder.sortOrder ?? index });
  }

  return (
    <>
      <GlassCard pad>
        <div className="sec-row">
          <div>
            <div className="panel-title">Hub Folders</div>
            <div className="panel-sub">High-level command layer for drives, repos, projects, study folders, and quick launch destinations</div>
          </div>
          <GButton variant="primary" size="sm" onClick={() => setEditing("new")}><Plus size={15} /> Add folder</GButton>
        </div>
      </GlassCard>

      {activeFolders.length === 0 && <GlassCard pad><EmptyState title="No active hub folders" hint="Add your first drive, repository, project, study folder, or external launch destination." /></GlassCard>}

      <div className="grid grid-courses">
        {activeFolders.map((f, index) => (
          <GlassCard pad hoverable key={f.id} className="folder-card">
            <div className="card-hover-tools">
              <GhostButton title="Move up" onClick={() => move(f, -1)} disabled={index === 0}><ArrowUp size={14} /></GhostButton>
              <GhostButton title="Move down" onClick={() => move(f, 1)} disabled={index === activeFolders.length - 1}><ArrowDown size={14} /></GhostButton>
              <GhostButton title={f.favorite ? "Unfavorite" : "Favorite"} onClick={() => s.updateFolder(f.id, { favorite: !f.favorite })}>
                <Star size={14} fill={f.favorite ? "currentColor" : "none"} />
              </GhostButton>
              <GhostButton onClick={() => setEditing(f)}><Pencil size={14} /></GhostButton>
              <GhostButton title="Archive" onClick={() => s.updateFolder(f.id, { archived: true })}><Archive size={14} /></GhostButton>
            </div>
            <span className="folder-icon" style={{ color: f.color || "var(--cyan)" }}><Icon name={f.icon} size={20} /></span>
            <div className="fc-name">{f.name}</div>
            {f.description && <div className="fc-desc">{f.description}</div>}
            {f.localPath && <div className="fc-path truncate">{f.localPath}</div>}
            <div className="row wrap gap6">
              {f.group && <span className="tag neutral">{f.group}</span>}
              {(f.tags ?? []).slice(0, 3).map((tag) => <span className="tag neutral" key={tag}>#{tag}</span>)}
            </div>
            {(f.link || f.localPath) && (
              <a className="gbtn sm" href={f.link || fileUrl(f.localPath)} target="_blank" rel="noreferrer" style={{ marginTop: "auto" }}>
                Open <ExternalLink size={13} />
              </a>
            )}
          </GlassCard>
        ))}
        <div className="add-tile" onClick={() => setEditing("new")} style={{ minHeight: 132 }}>
          <Plus size={16} /> Add folder
        </div>
      </div>

      {archivedFolders.length > 0 && (
        <GlassCard pad>
          <div className="sec-row">
            <div>
              <div className="panel-title">Archived folders</div>
              <div className="panel-sub">Hidden from the command layer, preserved for restore or permanent removal.</div>
            </div>
          </div>
          <div className="stack gap8" style={{ marginTop: 10 }}>
            {archivedFolders.map((folder) => (
              <div className="dense-row" key={folder.id}>
                <span className="folder-icon" style={{ color: folder.color || "var(--cyan)" }}><Icon name={folder.icon} size={17} /></span>
                <div className="grow"><b>{folder.name}</b><span className="sub">{folder.description || folder.link || folder.localPath || "Archived shortcut"}</span></div>
                <GButton size="sm" onClick={() => s.updateFolder(folder.id, { archived: false })}>Restore</GButton>
                <GhostButton className="danger" title="Remove permanently" onClick={() => confirm(`Remove “${folder.name}” from Hub Folders?`) && s.removeFolder(folder.id)}><Trash2 size={14} /></GhostButton>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {editing && <FolderEditor folder={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function FolderEditor({ folder, onClose }: { folder: HubFolder | null; onClose: () => void }) {
  const s = useStore();
  const [name, setName] = useState(folder?.name ?? "");
  const [description, setDescription] = useState(folder?.description ?? "");
  const [link, setLink] = useState(folder?.link ?? "");
  const [localPath, setLocalPath] = useState(folder?.localPath ?? "");
  const [icon, setIcon] = useState(folder?.icon ?? "Folder");
  const [color, setColor] = useState(folder?.color ?? "var(--cyan)");
  const [group, setGroup] = useState(folder?.group ?? "");
  const [tags, setTags] = useState((folder?.tags ?? []).join(", "));
  const [favorite, setFavorite] = useState(folder?.favorite ?? false);

  function save() {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      description: description.trim(),
      link: link.trim() || undefined,
      localPath: localPath.trim() || undefined,
      icon,
      color,
      group: group.trim() || undefined,
      tags: tags.split(",").map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean),
      favorite,
      archived: folder?.archived ?? false,
      sortOrder: folder?.sortOrder,
    };
    if (folder) s.updateFolder(folder.id, payload);
    else s.addFolder(payload);
    onClose();
  }

  function pickFolder(e: ChangeEvent<HTMLInputElement>) {
    const first = e.target.files?.[0];
    const rel = first?.webkitRelativePath;
    const root = rel?.split("/")[0];
    if (root && !name.trim()) setName(root);
    if (root && !description.trim()) setDescription(`Local folder shortcut: ${root}`);
  }

  return (
    <Modal title={folder ? "Edit folder" : "Add folder"} onClose={onClose}
      footer={<><GButton onClick={onClose}>Cancel</GButton><GButton variant="primary" onClick={save}>Save</GButton></>}>
      <Field label="Name" value={name} list="hub-folder-name-options" onChange={(e) => setName(e.target.value)} autoFocus />
      <datalist id="hub-folder-name-options">
        {s.folders.map((existing) => <option key={existing.id} value={existing.name} />)}
      </datalist>
      <Field label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Field label="Link (optional)" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} />
      <Field label="Local path (optional)" placeholder="/Users/you/Medical School/01 BPM 501" value={localPath} onChange={(e) => setLocalPath(e.target.value)} />
      <div className="row gap12">
        <Field label="Group" placeholder="Study folders, Repos, Drives…" value={group} onChange={(e) => setGroup(e.target.value)} />
        <Field label="Tags" placeholder="anki, step, research" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>
      <div className="row gap12">
        <Field label="Color" value={color} onChange={(e) => setColor(e.target.value)} />
        <label className="row gap8" style={{ alignItems: "center", marginTop: 20 }}>
          <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} />
          Favorite
        </label>
      </div>
      <label className="folder-picker">
        <input type="file" onChange={pickFolder} {...{ webkitdirectory: "", directory: "" }} />
        Import local folder name
      </label>
      <div className="sub">Existing folder names autocomplete; saving the same name or destination updates the existing shortcut instead of creating a duplicate.</div>
      <SelectField label="Icon" value={icon} onChange={(e) => setIcon(e.target.value)}>
        {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
      </SelectField>
    </Modal>
  );
}

function fileUrl(path?: string): string {
  if (!path) return "";
  if (/^(https?:|file:)/i.test(path)) return path;
  return `file://${encodeURI(path)}`;
}

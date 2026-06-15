import { useState } from "react";
import type { ChangeEvent } from "react";
import {
  Plus, Trash2, Pencil, ExternalLink, Sparkles, Bug, PlayCircle,
  Sunrise, Timer, BadgeCheck, Layers, Link2, Brain,
} from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, GhostButton, PanelHeader, EmptyState } from "../components/ui/primitives";
import { Modal, Field, SelectField } from "../components/ui/Modal";
import { Icon, ICON_NAMES } from "../lib/icons";
import type { HubFolder } from "../lib/types";

const BUG_EMAIL = "jdabbagh@sgu.edu";

const GUIDE = [
  { icon: Sunrise, title: "Win the day", body: "Set one intention each morning; close it at night." },
  { icon: Timer, title: "Log effort", body: "Minutes + Anki cards. Use −/+10 to fine-tune." },
  { icon: BadgeCheck, title: "Passes", body: "Tap 1→4 as you study. Green = mature, dark = mastered." },
  { icon: Layers, title: "Anki", body: "Cycle Anki rounds; draft cards in Anki Lab." },
  { icon: Link2, title: "Resources", body: "Saved links + the curated SGU drives, rated." },
  { icon: Brain, title: "Boards", body: "Install a big-picture Step blueprint into the tracker." },
];

function HelpGuide() {
  const s = useStore();
  const mailto = `mailto:${BUG_EMAIL}?subject=${encodeURIComponent("Noctyrium feedback — " + s.profile.versionLabel)}&body=${encodeURIComponent("What happened / what you'd like:\n\n\nPage:\nSteps to reproduce (if a bug):\n")}`;
  return (
    <GlassCard pad className="help-card">
      <PanelHeader title="Help & Guide" sub="The basics, the tour, and a direct line for bugs + ideas"
        action={
          <div className="row gap8">
            <GButton size="sm" onClick={() => { s.updateProfile({ tourDone: false }); location.hash = "dashboard"; }}>
              <PlayCircle size={15} /> Replay guided tour
            </GButton>
            <a className="gbtn sm primary" href={mailto}><Bug size={15} /> Report bug / suggest feature</a>
          </div>} />
      <div className="master-guide">
        {GUIDE.map((g) => {
          const I = g.icon;
          return (
            <div className="guide-tile" key={g.title}>
              <span className="guide-tile-icon"><I size={18} /></span>
              <div><b>{g.title}</b><span>{g.body}</span></div>
            </div>
          );
        })}
      </div>
      <div className="help-foot">
        <Sparkles size={14} /> Replaying the tour ends with the promise again. Feedback goes straight to {BUG_EMAIL}.
      </div>
    </GlassCard>
  );
}

export function HubFoldersPage() {
  const s = useStore();
  const [editing, setEditing] = useState<HubFolder | "new" | null>(null);

  return (
    <>
      <GlassCard pad>
        <div className="sec-row">
          <div>
            <div className="panel-title">Hub Folders</div>
            <div className="panel-sub">Your modular folders and shortcuts — add as many as you like</div>
          </div>
          <GButton variant="primary" size="sm" onClick={() => setEditing("new")}><Plus size={15} /> Add folder</GButton>
        </div>
      </GlassCard>

      {s.folders.length === 0 && <GlassCard pad><EmptyState title="No folders yet" hint="Create your first hub folder." /></GlassCard>}

      <div className="grid grid-courses">
        {s.folders.map((f) => (
          <GlassCard pad hoverable key={f.id} className="folder-card">
            <div className="card-hover-tools">
              <GhostButton onClick={() => setEditing(f)}><Pencil size={14} /></GhostButton>
              <GhostButton className="danger" onClick={() => s.removeFolder(f.id)}><Trash2 size={14} /></GhostButton>
            </div>
            <span className="folder-icon" style={{ color: f.color || "var(--cyan)" }}><Icon name={f.icon} size={20} /></span>
            <div className="fc-name">{f.name}</div>
            {f.description && <div className="fc-desc">{f.description}</div>}
            {f.localPath && <div className="fc-path truncate">{f.localPath}</div>}
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

      <HelpGuide />

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

  function save() {
    if (!name.trim()) return;
    const payload = { name: name.trim(), description: description.trim(), link: link.trim() || undefined, localPath: localPath.trim() || undefined, icon };
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
      <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <Field label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Field label="Link (optional)" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} />
      <Field label="Local path (optional)" placeholder="/Users/you/Medical School/01 BPM 501" value={localPath} onChange={(e) => setLocalPath(e.target.value)} />
      <label className="folder-picker">
        <input type="file" onChange={pickFolder} {...{ webkitdirectory: "", directory: "" }} />
        Import local folder name
      </label>
      <div className="sub">Browsers hide full local paths for safety. In a local/package runtime, paste the folder path to make the Open button target it directly.</div>
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

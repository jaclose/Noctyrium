import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Copy, Check } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../components/ui/primitives";
import { Modal, Field, TextAreaField } from "../components/ui/Modal";
import type { Prompt } from "../lib/types";

export function PromptLibraryPage() {
  const s = useStore();
  const [editing, setEditing] = useState<Prompt | "new" | null>(null);
  const [filter, setFilter] = useState("All");
  const [copied, setCopied] = useState<string | null>(null);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(s.prompts.map((p) => p.category)))],
    [s.prompts],
  );
  const shown = filter === "All" ? s.prompts : s.prompts.filter((p) => p.category === filter);

  function copy(p: Prompt) {
    navigator.clipboard?.writeText(p.body);
    setCopied(p.id);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <>
      <GlassCard pad>
        <PanelHeader title="Prompt Library" sub="Reusable AI prompts for study workflows"
          action={<GButton variant="primary" size="sm" onClick={() => setEditing("new")}><Plus size={15} /> New prompt</GButton>} />
        <div className="filter-bar">
          {categories.map((c) => (
            <button key={c} className={`filter-pill ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
      </GlassCard>

      {shown.length === 0 && <GlassCard pad><EmptyState title="No prompts" hint="Add a prompt to build your library." /></GlassCard>}

      <div className="grid grid-2">
        {shown.map((p) => (
          <GlassCard pad key={p.id} className="prompt-card">
            <div className="card-hover-tools">
              <GhostButton onClick={() => setEditing(p)}><Pencil size={14} /></GhostButton>
              <GhostButton className="danger" onClick={() => s.removePrompt(p.id)}><Trash2 size={14} /></GhostButton>
            </div>
            <div className="row gap8"><Tag>{p.category}</Tag></div>
            <div className="pc-title">{p.title}</div>
            <div className="pc-preview">{p.body}</div>
            <div className="pc-foot">
              {p.tags.map((t) => <Tag key={t} tone="neutral">#{t}</Tag>)}
              <GButton className="right" size="sm" onClick={() => copy(p)}>
                {copied === p.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </GButton>
            </div>
          </GlassCard>
        ))}
      </div>

      {editing && <PromptEditor prompt={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function PromptEditor({ prompt, onClose }: { prompt: Prompt | null; onClose: () => void }) {
  const s = useStore();
  const [title, setTitle] = useState(prompt?.title ?? "");
  const [category, setCategory] = useState(prompt?.category ?? "General");
  const [tags, setTags] = useState((prompt?.tags ?? []).join(", "));
  const [body, setBody] = useState(prompt?.body ?? "");

  function save() {
    if (!title.trim() || !body.trim()) return;
    const payload = {
      title: title.trim(), category: category.trim() || "General",
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean), body,
    };
    if (prompt) s.updatePrompt(prompt.id, payload);
    else s.addPrompt(payload);
    onClose();
  }

  return (
    <Modal title={prompt ? "Edit prompt" : "New prompt"} onClose={onClose}
      footer={<><GButton onClick={onClose}>Cancel</GButton><GButton variant="primary" onClick={save}>Save</GButton></>}>
      <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <div className="row gap12">
        <Field label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <Field label="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>
      <TextAreaField label="Prompt body" value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
    </Modal>
  );
}

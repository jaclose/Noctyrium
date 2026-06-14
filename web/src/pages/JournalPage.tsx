import { useState } from "react";
import { CheckCircle2, Circle, ListChecks, Plus, Trash2, Pencil } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../components/ui/primitives";
import { Modal, Field, TextAreaField, SelectField } from "../components/ui/Modal";
import { prettyDate } from "../lib/scoring";
import type { JournalEntry } from "../lib/types";

const energyTone = { Low: "red", Medium: "orange", High: "green", "": "neutral" } as const;

export function JournalPage() {
  const s = useStore();
  const [editing, setEditing] = useState<JournalEntry | "new" | null>(null);

  return (
    <>
      <GlassCard pad>
        <PanelHeader title="Journal Archive" sub="Daily standups, review, blockers, and tomorrow's plan"
          action={<GButton variant="primary" size="sm" onClick={() => setEditing("new")}><Plus size={15} /> New standup</GButton>} />
        {s.journal.length === 0 && <EmptyState title="No standups yet" hint="Log your first daily standup." />}
      </GlassCard>

      {s.journal.map((j) => (
        <GlassCard pad key={j.id} className="journal-card">
          <div className="card-hover-tools">
            <GhostButton onClick={() => setEditing(j)}><Pencil size={14} /></GhostButton>
            <GhostButton className="danger" onClick={() => s.removeJournal(j.id)}><Trash2 size={14} /></GhostButton>
          </div>
          <div className="jc-date">{prettyDate(j.date)}</div>
          <div className="jc-line"><b>Today:</b> {j.today}</div>
          {j.tomorrow && <div className="jc-line dim"><b>Tomorrow:</b> {j.tomorrow}</div>}
          {j.blockers && <div className="jc-line dim"><b>Blockers:</b> {j.blockers}</div>}
          <div className="jc-meta">
            {j.energy && <Tag tone={energyTone[j.energy]}>Energy: {j.energy}</Tag>}
            {j.rating && <Tag tone="neutral">Rating: {j.rating}</Tag>}
          </div>
        </GlassCard>
      ))}

      {editing && <JournalEditor entry={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function JournalEditor({ entry, onClose }: { entry: JournalEntry | null; onClose: () => void }) {
  const s = useStore();
  const [today, setToday] = useState(entry?.today ?? "");
  const [tomorrow, setTomorrow] = useState(entry?.tomorrow ?? "");
  const [blockers, setBlockers] = useState(entry?.blockers ?? "");
  const [energy, setEnergy] = useState<JournalEntry["energy"]>(entry?.energy ?? "Medium");
  const [rating, setRating] = useState(entry?.rating ?? "Useful");
  const openTasks = s.tasks.filter((t) => !t.done && !t.archived).slice(0, 6);

  function save() {
    if (!today.trim()) return;
    const payload = { date: entry?.date ?? new Date().toISOString(), today: today.trim(), tomorrow, blockers, energy, rating };
    if (entry) s.updateJournal(entry.id, payload);
    else s.addJournal(payload);
    onClose();
  }

  return (
    <Modal title={entry ? "Edit standup" : "New standup"} onClose={onClose}
      footer={<><GButton onClick={onClose}>Cancel</GButton><GButton variant="primary" onClick={save}>Save</GButton></>}>
      <TextAreaField label="Today — what did you do?" value={today} onChange={(e) => setToday(e.target.value)} autoFocus />
      <TextAreaField label="Tomorrow — the plan" value={tomorrow} onChange={(e) => setTomorrow(e.target.value)} />
      <Field label="Blockers" value={blockers} onChange={(e) => setBlockers(e.target.value)} />
      <div className="standup-task-log">
        <div className="spread">
          <span className="field-label">Task quick log</span>
          <a className="gbtn tiny" href="#tasks"><ListChecks size={12} /> Tasks</a>
        </div>
        {openTasks.length ? openTasks.map((task) => (
          <button key={task.id} className="standup-task" onClick={() => s.toggleTask(task.id)}>
            <Circle size={14} />
            <span>{task.title}</span>
            {task.scope && <em>{task.scope}</em>}
          </button>
        )) : (
          <div className="standup-task empty-line"><CheckCircle2 size={14} /> No open tasks to log.</div>
        )}
      </div>
      <div className="row gap12">
        <SelectField label="Energy" value={energy} onChange={(e) => setEnergy(e.target.value as JournalEntry["energy"])}>
          <option>Low</option><option>Medium</option><option>High</option>
        </SelectField>
        <Field label="Rating" value={rating} onChange={(e) => setRating(e.target.value)} />
      </div>
    </Modal>
  );
}

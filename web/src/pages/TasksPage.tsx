import { useState } from "react";
import { Check, Trash2, Plus, Calendar, Archive } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../components/ui/primitives";
import { prettyDate } from "../lib/scoring";
import type { Course, Task } from "../lib/types";

type TaskView = "open" | "archive" | "all";

export function TasksPage() {
  const s = useStore();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [scope, setScope] = useState("");
  const [view, setView] = useState<TaskView>("open");

  const inferredScope = scope.trim() || inferTaskScope(title, s.courses);
  const open = s.tasks.filter((t) => !t.done);
  const done = s.tasks.filter((t) => t.done);
  const visible = view === "open" ? open : view === "archive" ? done : s.tasks;

  function add() {
    if (!title.trim()) return;
    s.addTask(title.trim(), due || undefined, inferredScope || undefined);
    setTitle(""); setDue(""); setScope("");
  }

  return (
    <>
      <GlassCard pad>
        <PanelHeader title="Add a task" sub="Tasks auto-scope to courses/modules when the title matches" />
        <div className="row wrap gap8">
          <input className="field grow" placeholder="What needs doing?" value={title}
            onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <input className="field" type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ width: 160 }} />
          <input className="field" placeholder={inferTaskScope(title, s.courses) || "Scope (auto)"} value={scope}
            onChange={(e) => setScope(e.target.value)} style={{ width: 190 }} />
          <GButton variant="primary" onClick={add}><Plus size={15} /> Add</GButton>
        </div>
        {inferredScope && <div className="sub" style={{ marginTop: 10 }}>Will file under <span className="mono">{inferredScope}</span>.</div>}
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="Tasks" sub={`${open.length} open · ${done.length} archived`}
          action={
            <div className="filter-bar">
              <button className={`filter-pill ${view === "open" ? "on" : ""}`} onClick={() => setView("open")}>Open</button>
              <button className={`filter-pill ${view === "archive" ? "on" : ""}`} onClick={() => setView("archive")}>Archive</button>
              <button className={`filter-pill ${view === "all" ? "on" : ""}`} onClick={() => setView("all")}>All</button>
            </div>
          } />
        {visible.length === 0 && (
          <EmptyState title={view === "open" ? "Inbox zero" : "Nothing here yet"} hint={view === "open" ? "No open tasks. Nice." : "Completed tasks will collect here."} />
        )}
        {visible.map((t) => <TaskRow key={t.id} task={t} />)}
      </GlassCard>
    </>
  );
}

function TaskRow({ task }: { task: Task }) {
  const s = useStore();
  return (
    <div className={`task-row ${task.done ? "done" : ""}`}>
      <button className={`check ${task.done ? "on" : ""}`} onClick={() => s.toggleTask(task.id)} aria-label={task.done ? "Reopen" : "Complete"}>
        <Check size={14} />
      </button>
      <div className="grow">
        <div className="tk-title">{task.title}</div>
        <div className="row wrap gap8" style={{ marginTop: 4 }}>
          {task.due && <div className="tk-due"><Calendar size={11} /> Due {prettyDate(task.due)}</div>}
          {task.scope && <Tag tone="neutral">{task.scope}</Tag>}
          {task.done && <Tag tone="green"><Archive size={11} /> archived</Tag>}
        </div>
      </div>
      <GhostButton className="danger" onClick={() => s.removeTask(task.id)}><Trash2 size={14} /></GhostButton>
    </div>
  );
}

function inferTaskScope(title: string, courses: Course[]): string {
  const q = title.toLowerCase();
  if (!q.trim()) return "";
  if (/\bstep\s*1\b|\busmle\s*1\b/.test(q)) return "STEP 1";
  if (/\bstep\s*2\b|\bck\b|\busmle\s*2\b/.test(q)) return "STEP 2 CK";
  if (/\banki\b|cards?/.test(q)) return "Anki";
  for (const c of courses) {
    if (c.code && q.includes(c.code.toLowerCase())) return c.code;
    if (c.name && q.includes(c.name.toLowerCase())) return c.code;
    const mod = c.modules.find((m) => q.includes(m.name.toLowerCase()));
    if (mod) return `${c.code}/${mod.name}`;
  }
  return "";
}

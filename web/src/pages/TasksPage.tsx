import { useMemo, useState } from "react";
import { Check, Trash2, Plus, Calendar, Archive, Repeat, X, Sparkles } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../components/ui/primitives";
import { prettyDate } from "../lib/scoring";
import { pushToast } from "../lib/toast";
import { suggestTemplateForDraft, FREQUENCY_LABEL, type TaskFrequency } from "../lib/taskAutofill";
import type { Course, Task, TaskTemplate } from "../lib/types";

type TaskView = "open" | "archive" | "all";

export function TasksPage() {
  const s = useStore();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [scope, setScope] = useState("");
  const [view, setView] = useState<TaskView>("open");
  const [dismissedSigs, setDismissedSigs] = useState<Set<string>>(new Set());

  const inferredScope = scope.trim() || inferTaskScope(title, s.courses);
  const open = s.tasks.filter((t) => !t.done);
  const done = s.tasks.filter((t) => t.done);
  const visible = view === "open" ? open : view === "archive" ? done : s.tasks;

  const autofillOff = s.profile.taskAutofillDisabled === true;
  const templates = useMemo(() => s.profile.taskTemplates ?? [], [s.profile.taskTemplates]);
  const savedSigs = useMemo(() => new Set(templates.map((t) => t.signature)), [templates]);

  // Local, private detection — only suggests after a phrase has been typed >2×.
  const suggestion = useMemo(() => {
    if (autofillOff) return null;
    const match = suggestTemplateForDraft(title, s.tasks);
    if (!match) return null;
    if (savedSigs.has(match.signature) || dismissedSigs.has(match.signature)) return null;
    return match;
  }, [autofillOff, title, s.tasks, savedSigs, dismissedSigs]);

  function add() {
    if (!title.trim()) return;
    s.addTask(title.trim(), due || undefined, inferredScope || undefined);
    setTitle(""); setDue(""); setScope("");
  }

  function saveTemplate(frequency: TaskFrequency) {
    if (!suggestion) return;
    const tpl: TaskTemplate = {
      id: crypto.randomUUID(),
      signature: suggestion.signature,
      title: title.trim() || suggestion.title,
      frequency,
      scope: suggestion.scope || inferredScope || undefined,
      createdAt: new Date().toISOString(),
    };
    s.updateProfile({ taskTemplates: [tpl, ...templates.filter((t) => t.signature !== tpl.signature)] });
    // Adding the task is still an explicit, confirmed action — never automatic.
    s.addTask(tpl.title, due || undefined, tpl.scope);
    setTitle(""); setDue(""); setScope("");
    pushToast({ title: "Template saved", body: `“${tpl.title}” saved as a ${FREQUENCY_LABEL[frequency].toLowerCase()} template.`, tone: "success" });
  }

  function dismissSuggestion() {
    if (suggestion) setDismissedSigs((prev) => new Set(prev).add(suggestion.signature));
  }

  function removeTemplate(id: string) {
    s.updateProfile({ taskTemplates: templates.filter((t) => t.id !== id) });
  }

  return (
    <>
      <GlassCard pad data-tour="tasks">
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

        {suggestion && (
          <div className="autofill-suggest" role="status">
            <div className="autofill-suggest-copy">
              <Repeat size={15} />
              <span>You've entered a similar task {suggestion.count} times. Save as a recurring template?</span>
            </div>
            <div className="autofill-suggest-actions">
              {(["daily", "weekdays", "weekly", "custom"] as TaskFrequency[]).map((freq) => (
                <button key={freq} type="button"
                  className={`filter-pill ${suggestion.frequency === freq ? "on" : ""}`}
                  onClick={() => saveTemplate(freq)}>
                  {FREQUENCY_LABEL[freq]}
                </button>
              ))}
              <button type="button" className="filter-pill ghost" onClick={dismissSuggestion}>Not now</button>
              <button type="button" className="filter-pill ghost"
                onClick={() => { dismissSuggestion(); s.updateProfile({ taskAutofillDisabled: true }); }}>
                Never suggest again
              </button>
            </div>
          </div>
        )}

        {templates.length > 0 && (
          <div className="task-templates">
            <div className="task-templates-head"><Sparkles size={13} /> Reusable templates</div>
            <div className="row wrap gap8">
              {templates.map((tpl) => (
                <span key={tpl.id} className="task-template-chip">
                  <button type="button" className="task-template-add"
                    title={`Add “${tpl.title}”${tpl.scope ? ` · ${tpl.scope}` : ""}`}
                    onClick={() => s.addTask(tpl.title, undefined, tpl.scope)}>
                    <Plus size={12} /> {tpl.title}
                    <em>{FREQUENCY_LABEL[tpl.frequency]}</em>
                  </button>
                  <button type="button" className="task-template-del" aria-label={`Remove template ${tpl.title}`} onClick={() => removeTemplate(tpl.id)}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
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

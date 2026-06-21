import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, Circle, ListChecks, Plus, Trash2, Pencil, Sparkles, Lock, CalendarClock, Trophy,
} from "lucide-react";
import { useStore } from "../lib/store";
import { useUi } from "../lib/uiStore";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../components/ui/primitives";
import { Modal, Field, TextAreaField, SelectField } from "../components/ui/Modal";
import { dayKey, isoDate, prettyDate } from "../lib/scoring";
import { missedStandupDays, planForDay, reflectionPrompts, standupStatusToday } from "../lib/journal";
import type { DayPlan, JournalEntry } from "../lib/types";

const energyTone = { Low: "red", Medium: "orange", High: "green", "": "neutral" } as const;
const outcomeTone = { won: "green", partial: "orange", missed: "red" } as const;

export function JournalPage() {
  const s = useStore();
  const journalDay = useUi((u) => u.journalDay);
  const clearJournalDay = useUi((u) => u.clearJournalDay);
  const [editing, setEditing] = useState<JournalEntry | "new" | null>(null);
  const [draft, setDraft] = useState<Partial<JournalEntry> | null>(null);
  const [forDay, setForDay] = useState<string | null>(null);
  const todayPlan = s.dayPlans.find((plan) => plan.dayKey === dayKey());
  const reviewTime = s.profile.journalReviewTime ?? "20:00";
  const missed = useMemo(() => missedStandupDays(s), [s.journal, s.logs, s.dayPlans]);
  const status = standupStatusToday(s);

  // The dashboard can route here asking to remediate a specific day's standup.
  useEffect(() => {
    if (!journalDay) return;
    setForDay(journalDay);
    setDraft(null);
    setEditing("new");
    clearJournalDay();
  }, [journalDay, clearJournalDay]);

  function openForDay(key: string | null) {
    setForDay(key);
    setDraft(null);
    setEditing("new");
  }

  return (
    <>
      {missed.length > 0 && (
        <GlassCard pad className="standup-remediate-card">
          <PanelHeader title="Catch up on missed standups"
            sub="Active days with no standup yet — close the loop while you still remember the day"
            action={<Tag tone="orange">{missed.length} to remediate</Tag>} />
          <div className="remediate-chips">
            {missed.map((key) => {
              const plan = planForDay(s.dayPlans, key);
              return (
                <button key={key} type="button" className="remediate-chip" onClick={() => openForDay(key)}>
                  <CalendarClock size={15} />
                  <div className="grow">
                    <b>{prettyDate(`${key}T12:00:00`)}</b>
                    <span>{plan ? `“${plan.intention}”` : "No intention was set — log what happened"}</span>
                  </div>
                  <Plus size={15} />
                </button>
              );
            })}
          </div>
        </GlassCard>
      )}

      {todayPlan && (
        <GlassCard pad className="journal-followup-card">
          <PanelHeader title="Today’s intention follow-up"
            sub={`Set for ${todayPlan.dayKey}. Your dashboard standup prompt opens around ${reviewTime} local time.`}
            action={status === "done"
              ? <Tag tone="green"><CheckCircle2 size={12} /> Logged today</Tag>
              : <GButton size="sm" variant="primary" onClick={() => {
                  setDraft({
                    tomorrow: todayPlan.wins.length ? `Carry forward: ${todayPlan.wins.join("; ")}` : "",
                    blockers: todayPlan.reviewNote ?? "",
                    energy: "Medium",
                    rating: todayPlan.outcome ? `Outcome: ${todayPlan.outcome}` : "Daily review",
                  });
                  openForDay(dayKey());
                }}>
                  <Plus size={15} /> Write follow-up
                </GButton>} />
          <div className="jc-line"><b>Intention:</b> {todayPlan.intention}</div>
          {todayPlan.wins.length > 0 && <div className="jc-line dim"><b>Win conditions:</b> {todayPlan.wins.join(" · ")}</div>}
          {todayPlan.outcome && <Tag tone={outcomeTone[todayPlan.outcome]}>{todayPlan.outcome}</Tag>}
        </GlassCard>
      )}

      <GlassCard pad>
        <PanelHeader title="Journal Archive" sub="Daily standups, review, blockers, and tomorrow's plan"
          action={<GButton variant="primary" size="sm" onClick={() => openForDay(null)}><Plus size={15} /> New standup</GButton>} />
        {s.journal.length === 0 && <EmptyState title="No standups yet" hint="Log your first daily standup." />}
      </GlassCard>

      {s.journal.map((j) => (
        <GlassCard pad key={j.id} className="journal-card">
          <div className="card-hover-tools">
            <GhostButton onClick={() => { setForDay(null); setEditing(j); }}><Pencil size={14} /></GhostButton>
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

      {editing && <JournalEditor entry={editing === "new" ? null : editing} draft={draft ?? undefined} forDay={forDay}
        onClose={() => { setEditing(null); setDraft(null); setForDay(null); }} />}
    </>
  );
}

function JournalEditor({
  entry, draft, forDay, onClose,
}: {
  entry: JournalEntry | null;
  draft?: Partial<JournalEntry>;
  forDay?: string | null;
  onClose: () => void;
}) {
  const s = useStore();
  const day = forDay ?? (entry ? isoDate(new Date(entry.date)) : dayKey());
  const plan = planForDay(s.dayPlans, day);
  const isPast = day < dayKey();
  const prompts = useMemo(() => reflectionPrompts(plan), [plan]);

  const [today, setToday] = useState(entry?.today ?? draft?.today ?? "");
  const [tomorrow, setTomorrow] = useState(entry?.tomorrow ?? draft?.tomorrow ?? "");
  const [blockers, setBlockers] = useState(entry?.blockers ?? draft?.blockers ?? "");
  const [energy, setEnergy] = useState<JournalEntry["energy"]>(entry?.energy ?? draft?.energy ?? "Medium");
  const [rating, setRating] = useState(entry?.rating ?? draft?.rating ?? (plan?.outcome ? `Outcome: ${plan.outcome}` : "Useful"));
  const openTasks = s.tasks.filter((t) => !t.done && !t.archived).slice(0, 6);

  function save() {
    if (!today.trim()) return;
    // Past-day remediation is stamped at local noon of that day so it files under
    // the right calendar date; a fresh standup keeps the real timestamp.
    const date = entry?.date ?? (forDay ? `${forDay}T12:00:00` : new Date().toISOString());
    const payload = { date, today: today.trim(), tomorrow, blockers, energy, rating };
    if (entry) s.updateJournal(entry.id, payload);
    else s.addJournal(payload);
    onClose();
  }

  const title = entry ? "Edit standup" : forDay && isPast ? `Remediate standup — ${prettyDate(`${day}T12:00:00`)}` : "New standup";

  return (
    <Modal title={title} onClose={onClose}
      footer={<><GButton onClick={onClose}>Cancel</GButton><GButton variant="primary" onClick={save}>Save</GButton></>}>
      {plan && <PreviousIntention plan={plan} />}
      <div className="standup-reflection">
        <div className="sr-head"><Sparkles size={13} /> Reflection</div>
        <ul>{prompts.map((prompt, i) => <li key={i}>{prompt}</li>)}</ul>
      </div>
      <TextAreaField label="Today — did you do what you set out to do?" value={today} onChange={(e) => setToday(e.target.value)} autoFocus />
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

// The day's intention, shown read-only above a standup so you reflect against
// what you actually committed to (you can't edit the past intention).
function PreviousIntention({ plan }: { plan: DayPlan }) {
  return (
    <div className="standup-prev-intention">
      <div className="spi-head"><Lock size={11} /> Intention set {prettyDate(`${plan.dayKey}T12:00:00`)} · locked</div>
      <p>“{plan.intention}”</p>
      {plan.wins.length > 0 && (
        <div className="spi-wins">{plan.wins.map((win, i) => <span key={i}>{win}</span>)}</div>
      )}
      {plan.outcome && (
        <Tag tone={outcomeTone[plan.outcome]}><Trophy size={11} /> Marked {plan.outcome}</Tag>
      )}
    </div>
  );
}

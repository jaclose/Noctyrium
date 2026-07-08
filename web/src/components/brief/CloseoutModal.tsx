// ===========================================================================
// Daily Closeout (directive §3) — a 30–90 second end-of-day flow. Prefills as
// much as possible from today's data so the user mostly confirms, not writes.
// Saving updates tomorrow's Command Brief (first task + mode preference).
// ===========================================================================
import { useState } from "react";
import { useStore } from "../../lib/store";
import { closeoutForDay, type EnergyVsMorning } from "../../lib/closeout";
import { MODE_LABEL, type BriefMode } from "../../lib/commandBrief";
import type { DailyCloseout } from "../../lib/closeout";
import { Modal, Field, TextAreaField } from "../ui/Modal";
import { GButton } from "../ui/primitives";

const MODES: Array<"auto" | BriefMode> = ["auto", "maintain", "catch-up", "recovery", "sprint", "exam-week"];

export function CloseoutModal({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const existing = closeoutForDay(s.closeouts ?? [], s.activeDayKey);

  const today = s.activeDayKey;
  const doneToday = s.tasks.filter((t) => t.done && t.completedAt?.slice(0, 10) === today).map((t) => t.title);
  const sessionsToday = (s.sessions ?? []).filter((x) => x.dayKey === today && x.status === "completed");
  const openCount = s.tasks.filter((t) => !t.done && !t.archived).length;

  const [completed, setCompleted] = useState(
    existing?.completedSummary
      ?? [
        sessionsToday.length ? `${sessionsToday.length} session${sessionsToday.length === 1 ? "" : "s"} completed` : "",
        doneToday.length ? `Tasks: ${doneToday.slice(0, 3).join(", ")}${doneToday.length > 3 ? "…" : ""}` : "",
      ].filter(Boolean).join(" · "),
  );
  const [remaining, setRemaining] = useState(existing?.remainingSummary ?? (openCount ? `${openCount} open task${openCount === 1 ? "" : "s"}` : ""));
  const [blocker, setBlocker] = useState(existing?.blocker ?? "");
  const [firstTask, setFirstTask] = useState(existing?.tomorrowFirstTask ?? "");
  const [energy, setEnergy] = useState<EnergyVsMorning | undefined>(existing?.energyVsMorning);
  const [mode, setMode] = useState<"auto" | BriefMode>(existing?.tomorrowMode ?? "auto");

  function save() {
    const record: Omit<DailyCloseout, "id" | "createdAt" | "updatedAt"> = {
      dayKey: s.activeDayKey,
      completedSummary: completed.trim() || "Nothing logged",
      remainingSummary: remaining.trim() || undefined,
      blocker: blocker.trim() || undefined,
      tomorrowFirstTask: firstTask.trim() || undefined,
      energyVsMorning: energy,
      tomorrowMode: mode,
    };
    s.saveCloseout(record);
    onClose();
  }

  return (
    <Modal
      title="Daily closeout"
      onClose={onClose}
      footer={<GButton variant="primary" onClick={save}>Close the day</GButton>}
    >
      <div className="sub">Ninety seconds, tops. Tomorrow's brief starts from what you write here.</div>
      <TextAreaField label="What got done" rows={2} value={completed} onChange={(e) => setCompleted(e.target.value)} />
      <Field label="What remains (short)" value={remaining} onChange={(e) => setRemaining(e.target.value)} placeholder="e.g. 2 lectures, PQ set 4" />
      <Field label="What blocked you (optional)" value={blocker} onChange={(e) => setBlocker(e.target.value)} placeholder="one sentence is enough" />
      <Field label="Tomorrow should start with…" value={firstTask} onChange={(e) => setFirstTask(e.target.value)} placeholder="the brief will put this on top" />

      <div className="stack gap6">
        <span className="field-label">Energy vs this morning</span>
        <div className="row">
          {(["lower", "same", "higher"] as const).map((v) => (
            <button key={v} className={`filter-pill ${energy === v ? "on" : ""}`} onClick={() => setEnergy(v)}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="stack gap6">
        <span className="field-label">Tomorrow's mode</span>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {MODES.map((m) => (
            <button key={m} className={`filter-pill ${mode === m ? "on" : ""}`} onClick={() => setMode(m)}>
              {m === "auto" ? "Auto-decide" : MODE_LABEL[m]}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

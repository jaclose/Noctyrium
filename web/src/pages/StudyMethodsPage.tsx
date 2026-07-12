// ===========================================================================
// Study Methods (directive §15) — the technique library. Every method carries
// honest "when NOT to use it" guidance; the recommender is rules-based today
// and AI-replaceable through the same input shape later.
// ===========================================================================
import { useMemo, useState } from "react";
import { BookOpenCheck, Play, Plus } from "lucide-react";
import { useStore } from "../lib/store";
import { recommendMethod, STUDY_METHODS, type StudyMethod } from "../lib/studyMethods";
import { pickFocusExam, daysUntilExam } from "../lib/examPlan";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag } from "../components/ui/primitives";
import { Modal } from "../components/ui/Modal";
import { pushToast } from "../lib/toast";

export function StudyMethodsPage() {
  const s = useStore();
  const [open, setOpen] = useState<StudyMethod | null>(null);
  const [energy, setEnergy] = useState<"low" | "medium" | "high">("medium");
  const [minutes, setMinutes] = useState<number>(50);

  const examId = pickFocusExam(s.boardPrep, s.activeDayKey);
  const examPrep = examId ? s.boardPrep?.[examId] : undefined;
  const examDaysAway = examPrep ? daysUntilExam(examPrep.examDate, s.activeDayKey) : null;
  const inRecovery = (s.recoveryPlans ?? []).some((p) =>
    (p.status === "accepted" || p.status === "edited")
    && (p.dayKey ?? p.createdAt.slice(0, 10)) === s.activeDayKey);

  const recommended = useMemo(
    () => recommendMethod({ energy, minutesAvailable: minutes, examDaysAway, inRecovery }),
    [energy, minutes, examDaysAway, inRecovery],
  );

  function addToPlan(method: StudyMethod) {
    s.addTask(`${method.name} — ${method.summary}`, s.activeDayKey, "Study Methods");
    pushToast({ title: "Added to today's tasks", body: method.name, tone: "success" });
  }

  function beginWith(method: StudyMethod) {
    s.startSession({
      title: method.name,
      link: { kind: "free", label: method.name, context: "Study Methods" },
      plannedMinutes: method.timeEstimateMinutes,
      resources: method.materials,
      reason: method.whenToUse,
      source: "manual",
    });
    setOpen(null);
  }

  return (
    <>
      <GlassCard>
        <PanelHeader title="What fits right now?" sub="Honest matching — energy and time first, ambition second." />
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          <span className="field-label">Energy</span>
          {(["low", "medium", "high"] as const).map((e) => (
            <button key={e} className={`filter-pill ${energy === e ? "on" : ""}`} onClick={() => setEnergy(e)}>{e}</button>
          ))}
          <span className="field-label" style={{ marginLeft: 12 }}>Time</span>
          {[15, 30, 50, 90, 120].map((m) => (
            <button key={m} className={`filter-pill ${minutes === m ? "on" : ""}`} onClick={() => setMinutes(m)}>{m}m</button>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12, gap: 10, flexWrap: "wrap" }}>
          <Tag tone="cyan">{recommended.name}</Tag>
          <span className="sub grow">{recommended.summary}</span>
          <GButton size="sm" variant="primary" onClick={() => setOpen(recommended)}>See the steps</GButton>
        </div>
      </GlassCard>

      <div className="grid grid-courses">
        {STUDY_METHODS.map((m) => (
          <GlassCard key={m.id} hoverable onClick={() => setOpen(m)}>
            <div className="stack" style={{ gap: 6 }}>
              <div className="row">
                <BookOpenCheck size={15} style={{ color: "var(--cyan)" }} />
                <b>{m.name}</b>
                <span className="dim right">~{m.timeEstimateMinutes}m</span>
              </div>
              <div className="sub">{m.summary}</div>
              <div className="row" style={{ flexWrap: "wrap", gap: 4 }}>
                {m.tags.map((t) => <Tag key={t} tone="neutral">{t}</Tag>)}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {open && (
        <Modal
          title={open.name}
          onClose={() => setOpen(null)}
          footer={
            <>
              <GhostButton onClick={() => addToPlan(open)}><Plus size={13} /> Add to today</GhostButton>
              <GButton variant="primary" onClick={() => beginWith(open)}><Play size={13} /> Begin session with this</GButton>
            </>
          }
        >
          <div className="sub">{open.summary}</div>
          <div className="stack gap6">
            <span className="field-label">When to use it</span>
            <div>{open.whenToUse}</div>
          </div>
          <div className="stack gap6">
            <span className="field-label">When NOT to use it</span>
            <div>{open.whenNotToUse}</div>
          </div>
          <div className="stack gap6">
            <span className="field-label">You'll need · ~{open.timeEstimateMinutes} minutes</span>
            <div className="sub">{open.materials.join(" · ")}</div>
          </div>
          <div className="stack gap6">
            <span className="field-label">Exact steps</span>
            <ol className="method-steps">
              {open.steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
          <div className="stack gap6">
            <span className="field-label">Common mistakes</span>
            <ul className="method-steps">
              {open.commonMistakes.map((mst, i) => <li key={i}>{mst}</li>)}
            </ul>
          </div>
        </Modal>
      )}
    </>
  );
}

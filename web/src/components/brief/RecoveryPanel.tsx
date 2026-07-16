// ===========================================================================
// Recovery Protocol UI (directive §4). States the situation without shame,
// shows the gap estimate, the four triage buckets (user-editable), and the
// 24h restart / 72h stabilization plans. Accept / edit / defer / reset.
// ===========================================================================
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Play } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  BUCKET_LABEL, buildRecoveryPlan,
  type RecoveryBucket, type RecoveryPlan, type RecoveryTrigger,
} from "../../lib/recovery";
import type { BriefSignals } from "../../lib/commandBrief";
import { Modal } from "../ui/Modal";
import { GButton, GhostButton, Tag } from "../ui/primitives";
import { ICON_SIZE } from "../../lib/iconSize";

const BUCKETS: RecoveryBucket[] = ["non-negotiable", "high-yield", "deferrable", "drop-for-now"];
const BUCKET_TONE: Record<RecoveryBucket, "red" | "green" | "neutral" | "purple"> = {
  "non-negotiable": "red",
  "high-yield": "green",
  deferrable: "neutral",
  "drop-for-now": "purple",
};

export function RecoveryPanel({
  signals, trigger, onClose,
}: {
  signals: BriefSignals;
  trigger: RecoveryTrigger;
  onClose: () => void;
}) {
  const s = useStore();
  const activePlan = useMemo(
    () => (s.recoveryPlans ?? []).find((p) =>
      (p.status === "accepted" || p.status === "edited")
      && (p.dayKey ?? p.createdAt.slice(0, 10)) === s.activeDayKey),
    [s.recoveryPlans, s.activeDayKey],
  );
  const [plan, setPlan] = useState<RecoveryPlan>(() =>
    activePlan ?? buildRecoveryPlan({
      tasks: s.tasks,
      tracker: s.tracker,
      signals,
      trigger,
      activeDayKey: s.activeDayKey,
      logs: s.logs,
      dailyTargetMinutes: s.profile.dailyMinuteTarget,
    }));
  const [edited, setEdited] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);

  function setBucket(itemId: string, bucket: RecoveryBucket) {
    setPlan((p) => ({ ...p, items: p.items.map((i) => (i.id === itemId ? { ...i, bucket } : i)) }));
    setEdited(true);
  }
  function toggleStep(stepId: string) {
    const next = { ...plan, steps: plan.steps.map((st) => (st.id === stepId ? { ...st, done: !st.done } : st)) };
    setPlan(next);
    if (activePlan) s.saveRecoveryPlan({ ...next, updatedAt: new Date().toISOString() });
  }
  function accept() {
    for (const existing of s.recoveryPlans ?? []) {
      if (existing.id !== plan.id
        && (existing.status === "accepted" || existing.status === "edited")
        && (existing.dayKey ?? existing.createdAt.slice(0, 10)) === s.activeDayKey) {
        s.updateRecoveryPlan(existing.id, { status: "dismissed" });
      }
    }
    s.saveRecoveryPlan({ ...plan, status: edited ? "edited" : "accepted", updatedAt: new Date().toISOString() });
    onClose();
  }
  function keepPlan() {
    onClose();
  }
  function dismissToday() {
    s.saveRecoveryPlan({ ...plan, status: "deferred", updatedAt: new Date().toISOString() });
    onClose();
  }
  function restore() {
    if (activePlan) s.updateRecoveryPlan(activePlan.id, { status: "dismissed" });
    onClose();
  }
  function reset() {
    setPlan(buildRecoveryPlan({
      tasks: s.tasks,
      tracker: s.tracker,
      signals,
      trigger,
      activeDayKey: s.activeDayKey,
      logs: s.logs,
      dailyTargetMinutes: s.profile.dailyMinuteTarget,
    }));
    setEdited(false);
  }
  function startFirstStep() {
    const firstItem = plan.items.find((i) => i.bucket === "non-negotiable") ?? plan.items[0];
    s.startSession({
      title: firstItem ? firstItem.title : "25-minute restart session",
      link: firstItem?.link
        ? { kind: firstItem.link.kind, id: firstItem.link.id, label: firstItem.title }
        : { kind: "free", label: "Restart session" },
      plannedMinutes: 25,
      reason: "Recovery protocol: one small session restarts the loop.",
      source: "recovery",
    });
    accept();
  }

  const byBucket = (bucket: RecoveryBucket) => plan.items.filter((i) => i.bucket === bucket);

  return (
    <Modal
      title="Recovery protocol"
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={() => setShowCalculation((shown) => !shown)} aria-expanded={showCalculation}>
            {showCalculation ? <ChevronUp size={ICON_SIZE.body} /> : <ChevronDown size={ICON_SIZE.body} />} Show calculation
          </GhostButton>
          {activePlan && <GhostButton onClick={restore}>Restore original plan</GhostButton>}
          <GhostButton onClick={keepPlan}>Keep plan</GhostButton>
          <GhostButton onClick={dismissToday}>Dismiss for today</GhostButton>
          {edited && <GhostButton onClick={reset}>Reset preview</GhostButton>}
          <GButton onClick={accept}>{edited ? "Use edited reduced plan" : "Reduce load"}</GButton>
          <GButton variant="primary" onClick={startFirstStep}><Play size={ICON_SIZE.body} /> Reduce load &amp; start 25 min</GButton>
        </>
      }
    >
      <div className="stack" style={{ gap: 6 }}>
        <Tag tone="neutral">Optional preview · your tasks have not changed</Tag>
        <div>{plan.situation}</div>
        <div className="sub">{plan.gapEstimate}</div>
      </div>

      {showCalculation && plan.loadAssessment && (
        <section className="backup-actions-panel" aria-label="Recovery calculation">
          <div className="sync-title">Why AXOM suggested this</div>
          <div className="sub">
            Trigger severity: <b>{trigger.severity}</b> ({trigger.score} point{trigger.score === 1 ? "" : "s"}).
            {trigger.components.length ? ` ${trigger.components.map((component) => `${component.label} +${component.points}`).join("; ")}.` : " No trigger components."}
          </div>
          <div className="data-health-grid">
            <div className="data-health-cell"><b>{plan.loadAssessment.openTaskCount}</b><span className="sub">Open tasks</span></div>
            <div className="data-health-cell"><b>{plan.loadAssessment.belowTargetItemCount}</b><span className="sub">Below-target items</span></div>
            <div className="data-health-cell"><b>{plan.loadAssessment.activeItemCount}</b><span className="sub">Active items</span></div>
            <div className="data-health-cell"><b>{plan.loadAssessment.configuredDailyTargetMinutes ?? "—"}m</b><span className="sub">Configured daily target</span></div>
          </div>
          <div className="sub">
            Usual completed range: {plan.loadAssessment.usualCompletedMinutes
              ? `${plan.loadAssessment.usualCompletedMinutes.low}–${plan.loadAssessment.usualCompletedMinutes.high} minutes across ${plan.loadAssessment.historyEvidenceDays} recent active days`
              : `not enough history (${plan.loadAssessment.historyEvidenceDays} active day${plan.loadAssessment.historyEvidenceDays === 1 ? "" : "s"}; 3 required)`}.
            Estimate assumptions: 30 minutes per open task and 35 minutes per below-target tracker item (first 30).
          </div>
          <div className="sub"><b>What stays unchanged:</b> no task is deleted, archived, rescheduled, or edited. Choosing Reduce load saves this triage preview only.</div>
        </section>
      )}

      <div className="stack gap6">
        <span className="field-label">Next 24 hours — restart</span>
        {plan.steps.filter((st) => st.window === "24h").map((st) => (
          <label key={st.id} className="row recovery-step">
            <input type="checkbox" checked={st.done} onChange={() => toggleStep(st.id)} />
            <span className={st.done ? "dim" : ""}>{st.title}</span>
            <span className="dim right">~{st.minutes}m</span>
          </label>
        ))}
      </div>

      <div className="stack gap6">
        <span className="field-label">Next 72 hours — stabilize</span>
        {plan.steps.filter((st) => st.window === "72h").map((st) => (
          <label key={st.id} className="row recovery-step">
            <input type="checkbox" checked={st.done} onChange={() => toggleStep(st.id)} />
            <span className={st.done ? "dim" : ""}>{st.title}</span>
            <span className="dim right">~{st.minutes}m</span>
          </label>
        ))}
      </div>

      <div className="stack gap6">
        <span className="field-label">Triage — move items between buckets if the plan got it wrong</span>
        {BUCKETS.map((bucket) => {
          const items = byBucket(bucket);
          if (!items.length) return null;
          return (
            <div key={bucket} className="stack" style={{ gap: 4 }}>
              <Tag tone={BUCKET_TONE[bucket]}>{BUCKET_LABEL[bucket]} · {items.length}</Tag>
              {items.slice(0, 8).map((item) => (
                <div key={item.id} className="row recovery-item">
                  <span className="grow truncate">{item.title}</span>
                  {item.note && <span className="dim truncate" style={{ maxWidth: 160 }}>{item.note}</span>}
                  <select
                    className="field recovery-bucket-select"
                    value={item.bucket}
                    aria-label={`Bucket for ${item.title}`}
                    onChange={(e) => setBucket(item.id, e.target.value as RecoveryBucket)}
                  >
                    {BUCKETS.map((b) => <option key={b} value={b}>{BUCKET_LABEL[b]}</option>)}
                  </select>
                </div>
              ))}
              {items.length > 8 && <div className="sub">+ {items.length - 8} more in this bucket</div>}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

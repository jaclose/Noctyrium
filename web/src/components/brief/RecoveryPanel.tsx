// ===========================================================================
// Recovery Protocol UI (directive §4). States the situation without shame,
// shows the gap estimate, the four triage buckets (user-editable), and the
// 24h restart / 72h stabilization plans. Accept / edit / defer / reset.
// ===========================================================================
import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  BUCKET_LABEL, buildRecoveryPlan,
  type RecoveryBucket, type RecoveryPlan, type RecoveryTrigger,
} from "../../lib/recovery";
import type { BriefSignals } from "../../lib/commandBrief";
import { Modal } from "../ui/Modal";
import { GButton, GhostButton, Tag } from "../ui/primitives";

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
    () => (s.recoveryPlans ?? []).find((p) => p.status === "accepted" || p.status === "edited"),
    [s.recoveryPlans],
  );
  const [plan, setPlan] = useState<RecoveryPlan>(() =>
    activePlan ?? buildRecoveryPlan({ tasks: s.tasks, tracker: s.tracker, signals, trigger, activeDayKey: s.activeDayKey }));
  const [edited, setEdited] = useState(false);

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
    s.saveRecoveryPlan({ ...plan, status: edited ? "edited" : "accepted", updatedAt: new Date().toISOString() });
    onClose();
  }
  function defer() {
    s.saveRecoveryPlan({ ...plan, status: "deferred", updatedAt: new Date().toISOString() });
    onClose();
  }
  function reset() {
    setPlan(buildRecoveryPlan({ tasks: s.tasks, tracker: s.tracker, signals, trigger, activeDayKey: s.activeDayKey }));
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
          <GhostButton onClick={reset}>Reset plan</GhostButton>
          <GhostButton onClick={defer}>Not today</GhostButton>
          <GButton onClick={accept}>{edited ? "Save edited plan" : "Accept plan"}</GButton>
          <GButton variant="primary" onClick={startFirstStep}><Play size={14} /> Start the 25-min restart</GButton>
        </>
      }
    >
      <div className="stack" style={{ gap: 6 }}>
        <div>{plan.situation}</div>
        <div className="sub">{plan.gapEstimate}</div>
      </div>

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

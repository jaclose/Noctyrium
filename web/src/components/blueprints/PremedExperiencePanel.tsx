// Pre-Med experience log — hours by category with stacked verified/unverified
// bars and recommended/competitive tick marks. Extracted so the Blueprint
// Workbench (Pre-Health mode) can render it alongside the Applicant OS lane.
import { useState } from "react";
import { useStore } from "../../lib/store";
import { GlassCard, GButton, PanelHeader, Tag } from "../ui/primitives";
import { Field, SelectField, TextAreaField } from "../ui/Modal";
import { dayKey } from "../../lib/scoring";
import type { PremedExperienceKind } from "../../lib/types";

const PREMED_KINDS: PremedExperienceKind[] = ["Clinical", "Service", "Research", "Shadowing", "Leadership"];

// Ballpark hour benchmarks for a competitive MD/DO applicant (guidance, not gospel).
const HOUR_BENCHMARKS: Record<PremedExperienceKind, { recommended: number; competitive: number }> = {
  Clinical: { recommended: 100, competitive: 250 },
  Service: { recommended: 100, competitive: 200 },
  Research: { recommended: 100, competitive: 350 },
  Shadowing: { recommended: 40, competitive: 100 },
  Leadership: { recommended: 50, competitive: 150 },
};

export function PremedExperiencePanel() {
  const s = useStore();
  const [kind, setKind] = useState<PremedExperienceKind>("Clinical");
  const [date, setDate] = useState(dayKey());
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [contact, setContact] = useState("");
  const [hours, setHours] = useState("2");
  const [verified, setVerified] = useState(false);
  const [reflection, setReflection] = useState("");
  const entries = s.premedExperiences ?? [];
  const totals = PREMED_KINDS.map((k) => ({
    kind: k,
    hours: entries.filter((entry) => entry.kind === k).reduce((sum, entry) => sum + entry.hours, 0),
    verified: entries.filter((entry) => entry.kind === k && entry.verified).reduce((sum, entry) => sum + entry.hours, 0),
  }));
  const totalHours = totals.reduce((sum, item) => sum + item.hours, 0);
  const verifiedHours = totals.reduce((sum, item) => sum + item.verified, 0);
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  function save() {
    const amount = Math.max(0, Number(hours) || 0);
    if (!title.trim() || !organization.trim() || amount <= 0) return;
    s.addPremedExperience({
      date, kind, title: title.trim(), organization: organization.trim(),
      contact: contact.trim() || undefined, hours: amount, verified, reflection: reflection.trim(),
    });
    setTitle(""); setOrganization(""); setContact(""); setHours("2"); setVerified(false); setReflection("");
  }

  return (
    <GlassCard pad className="premed-hours-card">
      <PanelHeader title="Pre-Med Experience Log" sub="Clinical exposure, service, research, shadowing, leadership, and verification evidence"
        action={<Tag tone={verifiedHours >= 50 ? "green" : verifiedHours > 0 ? "cyan" : "neutral"}>{verifiedHours} verified hours</Tag>} />
      <div className="premed-hours-layout">
        <div className="premed-hours-form">
          <div className="step-form-grid">
            <SelectField label="Category" value={kind} onChange={(e) => setKind(e.target.value as PremedExperienceKind)}>
              {PREMED_KINDS.map((k) => <option key={k}>{k}</option>)}
            </SelectField>
            <Field label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Field label="Hours" type="number" min="0" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <Field label="What did you do?" placeholder="e.g. Shadowed cardiology clinic" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="step-form-grid">
            <Field label="Organization / physician / service" value={organization} onChange={(e) => setOrganization(e.target.value)} />
            <Field label="Verification contact" placeholder="email, supervisor, club officer" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <TextAreaField label="Reflection / evidence" placeholder="What mattered? What did you learn? What proof exists?" value={reflection} onChange={(e) => setReflection(e.target.value)} />
          <div className="premed-log-actions">
            <label className="promise-check compact">
              <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
              <span>Verified or verification path exists</span>
            </label>
            <GButton variant="primary" onClick={save}>Log experience</GButton>
          </div>
        </div>
        <div className="premed-hours-dashboard">
          <div className="premed-hours-total">
            <b>{totalHours}</b>
            <span>total hours logged</span>
          </div>
          <div className="premed-hour-bars">
            {totals.map((item) => {
              const bench = HOUR_BENCHMARKS[item.kind];
              const scaleMax = Math.max(bench.competitive * 1.15, item.hours, 1);
              const unverified = Math.max(0, item.hours - item.verified);
              const verifiedPct = (item.verified / scaleMax) * 100;
              const unverifiedPct = (unverified / scaleMax) * 100;
              const recPct = Math.min(100, (bench.recommended / scaleMax) * 100);
              const compPct = Math.min(100, (bench.competitive / scaleMax) * 100);
              return (
                <div className="premed-hour-bar" key={item.kind}>
                  <div className="spread"><span>{item.kind}</span><b>{item.hours}h</b></div>
                  <div className="track premed-track">
                    <div className="track-fill unverified" style={{ width: `${unverifiedPct}%` }} />
                    <div className="track-fill verified" style={{ width: `${verifiedPct}%` }} />
                    <span className="hour-tick rec" style={{ left: `${recPct}%` }} title={`Recommended ~${bench.recommended}h`} />
                    <span className="hour-tick comp" style={{ left: `${compPct}%` }} title={`Competitive ~${bench.competitive}h`} />
                  </div>
                  <small>
                    <span className="hour-legend-v">{item.verified}h verified</span> ·{" "}
                    rec {bench.recommended}h · competitive {bench.competitive}h
                  </small>
                </div>
              );
            })}
          </div>
          <div className="premed-bar-key">
            <span><i className="unverified" /> logged</span>
            <span><i className="verified" /> verified</span>
            <span><i className="tick" /> recommended / competitive</span>
          </div>
          <div className="premed-trend-note">
            {entries.length
              ? `${recent[0].kind} was your latest signal. Keep reflections specific enough to become application material later.`
              : "Start with one honest entry. Verified hours are useful; reflective detail is what makes them usable."}
          </div>
        </div>
      </div>
      {recent.length > 0 && (
        <div className="premed-recent-list">
          {recent.map((entry) => (
            <div className="premed-recent-row" key={entry.id}>
              <Tag tone={entry.verified ? "green" : "neutral"}>{entry.kind}</Tag>
              <div className="grow">
                <b>{entry.title}</b>
                <span>{entry.date} - {entry.organization} - {entry.hours}h{entry.verified ? " - verified" : ""}</span>
              </div>
              <button type="button" className="ghost-btn danger" onClick={() => s.removePremedExperience(entry.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

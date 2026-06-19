import { ClipboardCheck, GraduationCap, Stethoscope, HeartPulse, Syringe } from "lucide-react";
import { GlassCard, PanelHeader, Tag } from "../components/ui/primitives";

const TRACKS = [
  { icon: GraduationCap, title: "Medical School", body: "AMCAS/AACOMAS timeline, secondaries, interviews, decisions — the primary focus.", tone: "cyan" as const, planned: true },
  { icon: Stethoscope, title: "Residency / Match", body: "ERAS, programs, LORs, interviews, rank list, and Match milestones.", tone: "purple" as const, planned: true },
];

const INTEGRATIONS = [
  { icon: HeartPulse, title: "Nursing School", body: "NursingCAS application tracking." },
  { icon: Syringe, title: "PA School", body: "CASPA application tracking." },
];

export function ApplicationCheckerPage() {
  return (
    <>
      <GlassCard pad>
        <div className="row gap12" style={{ alignItems: "center" }}>
          <span className="folder-icon" style={{ color: "var(--cyan)" }}><ClipboardCheck size={20} /></span>
          <div className="grow">
            <div style={{ fontSize: 18, fontWeight: 800 }}>Application Checker</div>
            <div className="sub">Track applications end to end — built primarily for medical school and residency.</div>
          </div>
          <Tag tone="orange">Alpha 2 · coming soon</Tag>
        </div>
      </GlassCard>

      <GlassCard pad className="under-construction">
        <span className="uc-tape t1">Under Construction</span>
        <span className="uc-tape t2">Alpha 2</span>
        <span className="uc-badge"><ClipboardCheck size={15} /> Application tracking — coming soon</span>
        <div className="uc-inner">
          <PanelHeader title="Primary tracks" sub="Stage-by-stage checklists, deadlines, and status" />
          <div className="grid grid-2">
            {TRACKS.map((t) => {
              const I = t.icon;
              return (
                <div className="int-row" key={t.title}>
                  <span className="folder-icon" style={{ color: `var(--${t.tone})` }}><I size={18} /></span>
                  <div className="grow"><div style={{ fontWeight: 700 }}>{t.title}</div><div className="sub">{t.body}</div></div>
                  <Tag tone={t.tone}>Planned</Tag>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      <GlassCard pad className="under-construction">
        <span className="uc-tape t1">Under Construction</span>
        <span className="uc-badge"><HeartPulse size={15} /> PA / Nursing integrations — coming soon</span>
        <div className="uc-inner">
          <PanelHeader title="Other pathways" sub="Optional integrations for adjacent health-professions applications" />
          <div className="grid grid-2">
            {INTEGRATIONS.map((t) => {
              const I = t.icon;
              return (
                <div className="int-row" key={t.title}>
                  <span className="folder-icon"><I size={18} /></span>
                  <div className="grow"><div style={{ fontWeight: 700 }}>{t.title}</div><div className="sub">{t.body}</div></div>
                  <Tag tone="neutral">Under construction</Tag>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </>
  );
}

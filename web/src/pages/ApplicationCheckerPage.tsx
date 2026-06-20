import {
  ClipboardCheck, GraduationCap, Stethoscope, HeartPulse, Syringe, BookOpen,
  FlaskConical, FileText, HandHeart, Microscope, Mail, Award,
} from "lucide-react";
import { GlassCard, PanelHeader, Tag } from "../components/ui/primitives";

const TRACKS = [
  { icon: GraduationCap, title: "Medical School", body: "AMCAS/AACOMAS timeline, secondaries, interviews, decisions — the primary focus.", tone: "cyan" as const },
  { icon: Stethoscope, title: "Residency / Match", body: "ERAS, programs, LORs, interviews, rank list, and Match milestones.", tone: "purple" as const },
];

// Ordered top → bottom per the roadmap: graduate research, then undergrad,
// then the adjacent health professions (PA / Nursing) nearer the bottom.
const PATHWAYS = [
  { icon: FlaskConical, title: "PhD / Master's Programs", body: "Research-degree apps: statements of purpose, PI outreach, GRE where required, and funding." },
  { icon: BookOpen, title: "Undergraduate", body: "College apps + major planning, transfer pathways, and pre-req mapping before pre-med." },
  { icon: HeartPulse, title: "Nursing School", body: "NursingCAS application tracking." },
  { icon: Syringe, title: "PA School", body: "CASPA application tracking, patient-care hours, and prerequisites." },
];

// The bigger vision this page grows into (kept honest with "planned").
const PLANNED_CAPABILITIES = [
  { icon: BookOpen, title: "Major & DARS import", body: "Drop in your DARS (or equivalent) audit; see required courses left and track them to graduation." },
  { icon: HandHeart, title: "Experience hours", body: "Log clinical & non-clinical hours, volunteering, and work — totaled toward your goals." },
  { icon: Microscope, title: "Research & projects", body: "Track research, posters, presentations, and publications in one place." },
  { icon: Mail, title: "Letters of rec", body: "Who's writing, what they have, and when each is committed and submitted." },
  { icon: Award, title: "Grades & GPA", body: "Science vs. cumulative GPA trends to protect the number that matters." },
  { icon: FileText, title: "Application guide", body: "Step-by-step AMCAS / AACOMAS (or program-specific) guide when you're ready to apply." },
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
        <span className="uc-badge"><GraduationCap size={15} /> More pathways — coming soon</span>
        <div className="uc-inner">
          <PanelHeader title="Other pathways" sub="From graduate research down to adjacent health professions — pick the lane that fits" />
          <div className="grid grid-2">
            {PATHWAYS.map((t) => {
              const I = t.icon;
              return (
                <div className="int-row" key={t.title}>
                  <span className="folder-icon"><I size={18} /></span>
                  <div className="grow"><div style={{ fontWeight: 700 }}>{t.title}</div><div className="sub">{t.body}</div></div>
                  <Tag tone="neutral">Planned</Tag>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      <GlassCard pad className="under-construction">
        <span className="uc-tape t1">Under Construction</span>
        <span className="uc-badge"><FileText size={15} /> Full applicant tracker — planned</span>
        <div className="uc-inner">
          <PanelHeader title="What this grows into" sub="A complete applicant dashboard — majors, experiences, and the application itself" />
          <div className="grid grid-2">
            {PLANNED_CAPABILITIES.map((t) => {
              const I = t.icon;
              return (
                <div className="int-row" key={t.title}>
                  <span className="folder-icon"><I size={18} /></span>
                  <div className="grow"><div style={{ fontWeight: 700 }}>{t.title}</div><div className="sub">{t.body}</div></div>
                  <Tag tone="neutral">Planned</Tag>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </>
  );
}

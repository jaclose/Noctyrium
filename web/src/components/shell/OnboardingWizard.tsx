import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles, GraduationCap, FlaskConical, Stethoscope, BookOpen, Brain,
  Activity, Compass, ArrowRight, ArrowLeft, Check, Wand2, LineChart,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { GButton, GhostButton, Tag } from "../ui/primitives";
import { Field } from "../ui/Modal";
import type { AcademicPhase } from "../../lib/types";

interface PhaseOption {
  id: AcademicPhase;
  label: string;
  blurb: string;
  icon: LucideIcon;
  cardTarget: number;
  minuteTarget: number;
  tagline: string;
}

const PHASES: PhaseOption[] = [
  {
    id: "pre-med",
    label: "Pre-Med",
    blurb: "Building prerequisites and the application — light, sustainable daily reps.",
    icon: Compass,
    cardTarget: 60,
    minuteTarget: 120,
    tagline: "Building the foundation, one rep at a time.",
  },
  {
    id: "mcat",
    label: "MCAT Prep",
    blurb: "Content review, full-lengths, and a question-bank-first routine.",
    icon: Brain,
    cardTarget: 80,
    minuteTarget: 180,
    tagline: "MCAT-focused execution — content, then questions, then review.",
  },
  {
    id: "preclinical",
    label: "Medical School (Term 1-5)",
    blurb: "Coursework-driven — lectures, DLAs, and PQs with Anki running alongside.",
    icon: BookOpen,
    cardTarget: 120,
    minuteTarget: 240,
    tagline: "Designed for execution, not decoration.",
  },
  {
    id: "step1-dedicated",
    label: "STEP 1 Dedicated",
    blurb: "Full-time board prep — high-volume review with a tight resource set.",
    icon: GraduationCap,
    cardTarget: 200,
    minuteTarget: 360,
    tagline: "Dedicated. Locked in. One blueprint, one pass at a time.",
  },
  {
    id: "clinical",
    label: "Clinical / Rotations",
    blurb: "Ward hours plus shelf prep — protect a small, durable daily floor.",
    icon: Stethoscope,
    cardTarget: 60,
    minuteTarget: 120,
    tagline: "Balancing the wards and the books.",
  },
  {
    id: "step2-dedicated",
    label: "STEP 2 CK Dedicated",
    blurb: "Final stretch before STEP 2 — case-based review and timed blocks.",
    icon: Activity,
    cardTarget: 180,
    minuteTarget: 300,
    tagline: "STEP 2 CK — the final stretch.",
  },
  {
    id: "other",
    label: "Other / Custom",
    blurb: "Set your own pace — defaults stay editable any time in Settings.",
    icon: FlaskConical,
    cardTarget: 100,
    minuteTarget: 180,
    tagline: "Designed for execution, not decoration.",
  },
];

const STEP_TITLES = ["Welcome", "Your phase", "Daily targets", "AI tools", "You're set"];

export function OnboardingWizard() {
  const store = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(store.profile.name === "Noctyrium" ? "" : store.profile.name);
  const [phaseId, setPhaseId] = useState<AcademicPhase>("preclinical");
  const [cardTarget, setCardTarget] = useState(120);
  const [minuteTarget, setMinuteTarget] = useState(240);

  const phase = PHASES.find((p) => p.id === phaseId) ?? PHASES[2];
  const last = STEP_TITLES.length - 1;

  function selectPhase(p: PhaseOption) {
    setPhaseId(p.id);
    setCardTarget(p.cardTarget);
    setMinuteTarget(p.minuteTarget);
  }

  function finish() {
    store.updateProfile({
      name: name.trim() || "Noctyrium",
      phase: phaseId,
      tagline: phase.tagline,
      dailyCardTarget: cardTarget,
      dailyMinuteTarget: minuteTarget,
      onboarded: true,
    });
  }

  return (
    <div className="onboarding-scrim">
      <div className="onboarding-card">
        <div className="onboarding-steps">
          {STEP_TITLES.map((title, i) => (
            <div key={title} className={`onboarding-step-dot ${i === step ? "on" : ""} ${i < step ? "done" : ""}`}>
              <span>{i < step ? <Check size={11} /> : i + 1}</span>
              <small>{title}</small>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="onboarding-body">
            <div className="onboarding-mark"><Sparkles size={26} /></div>
            <h2>Welcome to Noctyrium</h2>
            <p className="onboarding-lede">
              Your local-first command center for medical school — course tracking, Anki-aware
              mastery, productivity, journaling, and STEP prep in one premium workspace. Your
              data stays on this device unless you export or sync it.
            </p>
            <Field label="What should we call you?" placeholder="Your name" value={name}
              onChange={(e) => setName(e.target.value)} autoFocus />
            <div className="onboarding-actions">
              <span className="sub">Takes under a minute — fully editable later in Settings.</span>
              <GButton variant="primary" onClick={() => setStep(1)}>
                Get started <ArrowRight size={15} />
              </GButton>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-body">
            <h2>Where are you right now?</h2>
            <p className="onboarding-lede">
              This tailors your daily targets, dashboard emphasis, and AI suggestions. You can
              change it any time in Settings.
            </p>
            <div className="onboarding-phase-grid">
              {PHASES.map((p) => {
                const Icon = p.icon;
                const on = p.id === phaseId;
                return (
                  <button key={p.id} className={`onboarding-phase ${on ? "on" : ""}`} onClick={() => selectPhase(p)}>
                    <span className="onboarding-phase-icon"><Icon size={18} /></span>
                    <div>
                      <b>{p.label}</b>
                      <span>{p.blurb}</span>
                    </div>
                    {on && <Tag tone="cyan"><Check size={11} /> Selected</Tag>}
                  </button>
                );
              })}
            </div>
            <div className="onboarding-actions">
              <GhostButton onClick={() => setStep(0)}><ArrowLeft size={15} /> Back</GhostButton>
              <GButton variant="primary" onClick={() => setStep(2)}>
                Continue <ArrowRight size={15} />
              </GButton>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-body">
            <h2>Set your daily targets</h2>
            <p className="onboarding-lede">
              These are a "good enough" line, not a ceiling — the dashboard nudges you to stop
              once you hit them. Recommended for <b>{phase.label}</b>, but fully yours to set.
            </p>
            <div className="row gap12">
              <Field label="Daily Anki cards" type="number" value={String(cardTarget)}
                onChange={(e) => setCardTarget(Number(e.target.value) || 0)} />
              <Field label="Daily study minutes" type="number" value={String(minuteTarget)}
                onChange={(e) => setMinuteTarget(Number(e.target.value) || 0)} />
            </div>
            <div className="onboarding-presets">
              {PHASES.map((p) => (
                <button key={p.id} className={`onboarding-preset ${p.id === phaseId ? "on" : ""}`}
                  onClick={() => { setCardTarget(p.cardTarget); setMinuteTarget(p.minuteTarget); }}>
                  {p.label}: {p.cardTarget} cards / {p.minuteTarget}m
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <GhostButton onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</GhostButton>
              <GButton variant="primary" onClick={() => setStep(3)}>
                Continue <ArrowRight size={15} />
              </GButton>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-body">
            <h2>AI strategy layer</h2>
            <p className="onboarding-lede">
              Noctyrium ships with safe local/mock AI behavior and Vercel-ready endpoints. The app can suggest next moves, draft Anki cards, plan Step prep, and summarize daily progress without exposing provider keys to the browser.
            </p>
            <div className="onboarding-ai-grid">
              <div><Brain size={17} /><b>Next move</b><span>Uses tracker, tasks, due reviews, and board prep status.</span></div>
              <div><Wand2 size={17} /><b>Anki draft</b><span>Turns pasted lectures or objectives into import-friendly cards.</span></div>
              <div><GraduationCap size={17} /><b>Step planner</b><span>Builds blueprint-aware plans for Step 1 and Step 2 CK.</span></div>
              <div><LineChart size={17} /><b>Daily report</b><span>Summarizes logs, tasks, and journal entries into an action readout.</span></div>
            </div>
            <div className="backup-note">
              <Sparkles size={15} />
              <span>Alpha mode uses local fallbacks when `/api/ai/*` is unavailable. Add provider keys in Vercel later for real model output.</span>
            </div>
            <div className="onboarding-actions">
              <GhostButton onClick={() => setStep(2)}><ArrowLeft size={15} /> Back</GhostButton>
              <GButton variant="primary" onClick={() => setStep(4)}>
                Continue <ArrowRight size={15} />
              </GButton>
            </div>
          </div>
        )}

        {step === last && (
          <div className="onboarding-body">
            <div className="onboarding-mark good"><Check size={26} /></div>
            <h2>You're all set, {name.trim() || "there"}.</h2>
            <p className="onboarding-lede">
              Noctyrium is configured for <b>{phase.label}</b>. Here's what carries into your dashboard:
            </p>
            <div className="onboarding-summary">
              <div><span>Phase</span><b>{phase.label}</b></div>
              <div><span>Daily Anki target</span><b>{cardTarget} cards</b></div>
              <div><span>Daily study target</span><b>{minuteTarget} minutes</b></div>
              <div><span>Tagline</span><b>{phase.tagline}</b></div>
            </div>
            <div className="onboarding-actions">
              <GhostButton onClick={() => setStep(3)}><ArrowLeft size={15} /> Back</GhostButton>
              <GButton variant="primary" onClick={finish}>
                Enter dashboard <ArrowRight size={15} />
              </GButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles, GraduationCap, Stethoscope, BookOpen, Brain, Activity, Compass,
  ArrowRight, ArrowLeft, Check, Wand2, LineChart, Layers, ShieldCheck,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { GButton, GhostButton, Tag } from "../ui/primitives";
import { Field } from "../ui/Modal";
import { FOCUS_OPTIONS, focusOption, normalizedFocusIds } from "../../lib/experience";
import type { ExperienceFocusId } from "../../lib/types";

const STEP_TITLES = ["Welcome", "Focus", "Targets", "AI tools", "Ready"];

const GROUP_ICONS: Record<string, LucideIcon> = {
  "SGU Terms": BookOpen,
  Boards: GraduationCap,
  "Pre-Med": Compass,
};

const FOCUS_ICONS: Partial<Record<ExperienceFocusId, LucideIcon>> = {
  term1: BookOpen,
  term2: BookOpen,
  term3: BookOpen,
  term4: Stethoscope,
  term5: Layers,
  cbse: Brain,
  step1: GraduationCap,
  step2: Activity,
  step3: Stethoscope,
  shelf: Stethoscope,
  mcat: Brain,
  premed: Compass,
};

export function OnboardingWizard() {
  const store = useStore();
  const savedSubscriptions = normalizedFocusIds(store.profile.focusSubscriptions);
  const savedActive = store.profile.activeFocusId && savedSubscriptions.includes(store.profile.activeFocusId)
    ? store.profile.activeFocusId
    : savedSubscriptions[0];
  const initialFocus = focusOption(savedActive) ?? FOCUS_OPTIONS[0];
  const [step, setStep] = useState(0);
  const [name, setName] = useState(store.profile.name === "Noctyrium" ? "" : store.profile.name);
  const [activeFocusId, setActiveFocusId] = useState<ExperienceFocusId>(initialFocus.id);
  const [subscriptions, setSubscriptions] = useState<Set<ExperienceFocusId>>(() => new Set(savedSubscriptions));
  const [cardTarget, setCardTarget] = useState(store.profile.dailyCardTarget || initialFocus.cardTarget);
  const [minuteTarget, setMinuteTarget] = useState(store.profile.dailyMinuteTarget || initialFocus.minuteTarget);

  const activeFocus = focusOption(activeFocusId) ?? initialFocus;
  const last = STEP_TITLES.length - 1;

  const grouped = useMemo(() => {
    const map = new Map<string, typeof FOCUS_OPTIONS>();
    for (const option of FOCUS_OPTIONS) {
      const items = map.get(option.group) ?? [];
      items.push(option);
      map.set(option.group, items);
    }
    return [...map.entries()];
  }, []);

  function choosePrimary(id: ExperienceFocusId) {
    const option = focusOption(id);
    if (!option) return;
    setActiveFocusId(id);
    setSubscriptions((prev) => new Set(prev).add(id));
    setCardTarget(option.cardTarget);
    setMinuteTarget(option.minuteTarget);
  }

  function toggleSubscription(id: ExperienceFocusId) {
    setSubscriptions((prev) => {
      const next = new Set(prev);
      if (next.has(id) && id !== activeFocusId) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function finish() {
    const nextSubscriptions = [...new Set([activeFocusId, ...subscriptions])];
    store.updateProfile({
      name: name.trim() || "Noctyrium",
      phase: activeFocus.phase,
      activeFocusId,
      focusSubscriptions: nextSubscriptions,
      tagline: activeFocus.tagline,
      dailyCardTarget: cardTarget,
      dailyMinuteTarget: minuteTarget,
      onboarded: true,
    });
  }

  return (
    <div className="onboarding-scrim">
      <div className="onboarding-card wide">
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
            <h2>Personalize Noctyrium</h2>
            <p className="onboarding-lede">
              Choose the academic lanes you want visible: SGU terms, CBSE, board prep, shelf exams,
              MCAT, or pre-med. This only shapes the dashboard and suggestions. It never erases
              imported courses, tracker rows, logs, folders, or backups.
            </p>
            <Field label="What should we call you?" placeholder="Your name" value={name}
              onChange={(e) => setName(e.target.value)} autoFocus />
            <div className="onboarding-actions">
              <span className="sub">You can rerun this later from Settings without resetting data.</span>
              <GButton variant="primary" onClick={() => setStep(1)}>
                Start setup <ArrowRight size={15} />
              </GButton>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-body">
            <h2>Choose your focus stack</h2>
            <p className="onboarding-lede">
              Select every lane you want Noctyrium to track, then mark one as your current primary
              focus. The app uses this for targets, command-center copy, and AI context.
            </p>
            <div className="focus-group-stack">
              {grouped.map(([group, options]) => {
                const GroupIcon = GROUP_ICONS[group] ?? Sparkles;
                return (
                  <div className="focus-group" key={group}>
                    <div className="focus-group-title"><GroupIcon size={15} /> {group}</div>
                    <div className="focus-card-grid">
                      {options.map((option) => {
                        const Icon = FOCUS_ICONS[option.id] ?? Sparkles;
                        const subscribed = subscriptions.has(option.id);
                        const primary = activeFocusId === option.id;
                        return (
                          <button
                            key={option.id}
                            className={`focus-card ${subscribed ? "subscribed" : ""} ${primary ? "primary" : ""}`}
                            onClick={() => choosePrimary(option.id)}
                            type="button"
                          >
                            <span className="focus-card-icon"><Icon size={18} /></span>
                            <span className="focus-card-copy">
                              <b>{option.label}</b>
                              <small>{option.blurb}</small>
                            </span>
                            <span
                              className={`focus-check ${subscribed ? "on" : ""}`}
                              onClick={(e) => { e.stopPropagation(); toggleSubscription(option.id); }}
                              title={subscribed ? "Subscribed" : "Subscribe"}
                            >
                              {subscribed && <Check size={12} />}
                            </span>
                            {primary && <Tag tone="cyan">Primary</Tag>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
            <h2>Set your daily floor</h2>
            <p className="onboarding-lede">
              Recommended for <b>{activeFocus.label}</b>. This is a sustainable floor for the
              dashboard, not a ceiling or a guilt engine.
            </p>
            <div className="row gap12">
              <Field label="Daily Anki cards" type="number" value={String(cardTarget)}
                onChange={(e) => setCardTarget(Number(e.target.value) || 0)} />
              <Field label="Daily study minutes" type="number" value={String(minuteTarget)}
                onChange={(e) => setMinuteTarget(Number(e.target.value) || 0)} />
            </div>
            <div className="onboarding-presets">
              {FOCUS_OPTIONS.filter((option) => subscriptions.has(option.id)).map((option) => (
                <button
                  key={option.id}
                  className={`onboarding-preset ${option.id === activeFocusId ? "on" : ""}`}
                  onClick={() => {
                    choosePrimary(option.id);
                    setCardTarget(option.cardTarget);
                    setMinuteTarget(option.minuteTarget);
                  }}
                  type="button"
                >
                  {option.label}: {option.cardTarget} cards / {option.minuteTarget}m
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
              Alpha ships with local/mock AI behavior and Vercel-ready endpoints. The app can
              suggest next moves, draft Anki cards, plan board prep, and summarize daily progress
              without exposing provider keys in the browser.
            </p>
            <div className="onboarding-ai-grid">
              <div><Brain size={17} /><b>Next move</b><span>Uses tracker rows, due tasks, weak areas, and board prep status.</span></div>
              <div><Wand2 size={17} /><b>Anki draft</b><span>Turns pasted lectures or objectives into import-friendly cards.</span></div>
              <div><GraduationCap size={17} /><b>Blueprint planner</b><span>Builds broad Step, Shelf, MCAT, or CBSE schedules first.</span></div>
              <div><LineChart size={17} /><b>Daily report</b><span>Summarizes logs, tasks, and journal entries into an action readout.</span></div>
            </div>
            <div className="backup-note">
              <ShieldCheck size={15} />
              <span>Local-first remains the source of truth. Cloud sync and AI providers are optional upgrades.</span>
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
            <h2>Ready, {name.trim() || "there"}.</h2>
            <p className="onboarding-lede">
              Noctyrium is configured around <b>{activeFocus.label}</b> with {subscriptions.size} subscribed lane{subscriptions.size === 1 ? "" : "s"}.
            </p>
            <div className="onboarding-summary">
              <div><span>Primary focus</span><b>{activeFocus.label}</b></div>
              <div><span>Visible lanes</span><b>{[...subscriptions].map((id) => focusOption(id)?.label ?? id).join(", ")}</b></div>
              <div><span>Daily Anki floor</span><b>{cardTarget} cards</b></div>
              <div><span>Daily study floor</span><b>{minuteTarget} minutes</b></div>
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

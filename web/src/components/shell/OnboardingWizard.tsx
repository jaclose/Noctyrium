import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles, GraduationCap, Stethoscope, BookOpen, Brain, Activity, Compass,
  ArrowRight, ArrowLeft, Check, Layers, ShieldCheck,
  HeartPulse, Syringe, HardDrive,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { GButton, GhostButton, Tag } from "../ui/primitives";
import { Field } from "../ui/Modal";
import { FOCUS_OPTIONS, focusOption } from "../../lib/experience";
import { groupedTracks, resolveTrack } from "../../lib/tracks";
import type { EducationTrackId, ExperienceFocusId } from "../../lib/types";

const STEP_TITLES = ["Welcome", "Program", "Focus", "Targets", "Ready"];

const TRACK_ICONS: Record<string, LucideIcon> = {
  GraduationCap, Stethoscope, Compass, Brain, BookOpen, HeartPulse, Syringe,
};

const GROUP_ICONS: Record<string, LucideIcon> = {
  "Medical School": Stethoscope,
  "Pre-Health": Compass,
  "Other Health Professions": HeartPulse,
};

const FOCUS_ICONS: Partial<Record<ExperienceFocusId, LucideIcon>> = {
  term1: BookOpen, term2: BookOpen, term3: BookOpen, term4: Stethoscope, term5: Layers,
  cbse: Brain, step1: GraduationCap, step2: Activity, step3: Stethoscope, shelf: Stethoscope,
  mcat: Brain, premed: Compass,
};

export function OnboardingWizard() {
  const store = useStore();
  const wasOnboarded = useMemo(() => store.profile.onboarded, []); // re-run vs first run
  const initialTrack = resolveTrack(store.profile.educationTrack);
  const initialFocus = focusOption(store.profile.activeFocusId) ?? focusOption(initialTrack.defaultFocusId)!;

  const [step, setStep] = useState(0);
  const [name, setName] = useState(store.profile.name === "Noctyrium" ? "" : store.profile.name);
  const [trackId, setTrackId] = useState<EducationTrackId>(initialTrack.id);
  const [activeFocusId, setActiveFocusId] = useState<ExperienceFocusId>(initialFocus.id);
  const [subscriptions, setSubscriptions] = useState<Set<ExperienceFocusId>>(() => new Set(initialTrack.focusIds));
  const [showSgu, setShowSgu] = useState(initialTrack.showsSguResources);
  const [cardTarget, setCardTarget] = useState(store.profile.dailyCardTarget || initialFocus.cardTarget);
  const [minuteTarget, setMinuteTarget] = useState(store.profile.dailyMinuteTarget || initialFocus.minuteTarget);

  const track = resolveTrack(trackId);
  const activeFocus = focusOption(activeFocusId) ?? initialFocus;
  // Only the lanes this program cares about are offered.
  const laneOptions = FOCUS_OPTIONS.filter((o) => track.focusIds.includes(o.id));
  const last = STEP_TITLES.length - 1;

  function chooseTrack(id: EducationTrackId) {
    const next = resolveTrack(id);
    setTrackId(id);
    setShowSgu(next.showsSguResources);
    setSubscriptions(new Set(next.focusIds));
    setActiveFocusId(next.defaultFocusId);
    const focus = focusOption(next.defaultFocusId);
    if (focus) { setCardTarget(focus.cardTarget); setMinuteTarget(focus.minuteTarget); }
  }

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
      tagline: activeFocus.tagline,
      onboarded: true,
    });
    store.applyEducationTrack(trackId, {
      focusSubscriptions: nextSubscriptions,
      activeFocusId,
      showSguResources: showSgu,
      cardTarget,
      minuteTarget,
      // Only install the starter structure on a genuine first run, so re-running
      // setup later never overwrites courses the user has built.
      seedStructure: !wasOnboarded,
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
              Next you'll pick your program — SGU, US MD/DO, pre-med, MCAT, undergrad, nursing, or PA.
              That choice tailors your starter courses, the resources you see, and the study lanes on
              your dashboard. It never erases anything you import later.
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
            <h2>Choose your program</h2>
            <p className="onboarding-lede">
              This is the big one. It decides your starter structure: <b>SGU</b> loads Terms 1–5 and the
              SGU drives; <b>US MD/DO</b> load a generic systems spine; <b>pre-med</b> turns prerequisites
              into real courses. Nursing, PA, and general undergrad are lighter for now.
            </p>
            <div className="focus-group-stack">
              {groupedTracks().map(([group, tracks]) => {
                const GroupIcon = GROUP_ICONS[group] ?? Sparkles;
                return (
                  <div className="focus-group" key={group}>
                    <div className="focus-group-title"><GroupIcon size={15} /> {group}</div>
                    <div className="focus-card-grid">
                      {tracks.map((t) => {
                        const Icon = TRACK_ICONS[t.icon] ?? Sparkles;
                        const chosen = trackId === t.id;
                        return (
                          <button key={t.id} className={`focus-card ${chosen ? "primary" : ""}`}
                            onClick={() => chooseTrack(t.id)} type="button">
                            <span className="focus-card-icon"><Icon size={18} /></span>
                            <span className="focus-card-copy">
                              <b>{t.short}</b>
                              <small>{t.blurb}</small>
                            </span>
                            {t.status === "planned"
                              ? <Tag tone="orange">Lighter</Tag>
                              : chosen && <Tag tone="cyan">Selected</Tag>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="onboarding-track-note">
              <ShieldCheck size={15} />
              <span>{track.progress.summary}</span>
            </div>
            <div className="onboarding-actions">
              <GhostButton onClick={() => setStep(0)}><ArrowLeft size={15} /> Back</GhostButton>
              <GButton variant="primary" onClick={() => setStep(2)}>Continue <ArrowRight size={15} /></GButton>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-body">
            <h2>Choose your focus lanes</h2>
            <p className="onboarding-lede">
              These are the {track.short} lanes Noctyrium will track. Subscribe to the ones you want
              visible, then mark one as your current primary focus for targets and AI context.
            </p>
            <div className="focus-card-grid">
              {laneOptions.map((option) => {
                const Icon = FOCUS_ICONS[option.id] ?? Sparkles;
                const subscribed = subscriptions.has(option.id);
                const primary = activeFocusId === option.id;
                return (
                  <button key={option.id}
                    className={`focus-card ${subscribed ? "subscribed" : ""} ${primary ? "primary" : ""}`}
                    onClick={() => choosePrimary(option.id)} type="button">
                    <span className="focus-card-icon"><Icon size={18} /></span>
                    <span className="focus-card-copy">
                      <b>{option.label}</b>
                      <small>{option.blurb}</small>
                    </span>
                    <span className={`focus-check ${subscribed ? "on" : ""}`}
                      onClick={(e) => { e.stopPropagation(); toggleSubscription(option.id); }}
                      title={subscribed ? "Subscribed" : "Subscribe"}>
                      {subscribed && <Check size={12} />}
                    </span>
                    {primary && <Tag tone="cyan">Primary</Tag>}
                  </button>
                );
              })}
            </div>
            {(track.id === "sgu" || track.showsSguResources) && (
              <div className="onboarding-toggle-row">
                <span className="onboarding-toggle-copy">
                  <HardDrive size={15} />
                  <span><b>Show SGU shared drives</b><small>SGU Materials, Silly Goose Wiki, term review packs. Your personal drive always stays.</small></span>
                </span>
                <button type="button" className={`onboarding-switch ${showSgu ? "on" : ""}`}
                  onClick={() => setShowSgu((v) => !v)}
                  aria-label="Show SGU shared drives" title={showSgu ? "SGU drives shown" : "SGU drives hidden"}>
                  <span />
                </button>
              </div>
            )}
            <div className="onboarding-actions">
              <GhostButton onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</GhostButton>
              <GButton variant="primary" onClick={() => setStep(3)}>Continue <ArrowRight size={15} /></GButton>
            </div>
          </div>
        )}

        {step === 3 && (
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
              {laneOptions.filter((option) => subscriptions.has(option.id)).map((option) => (
                <button key={option.id} className={`onboarding-preset ${option.id === activeFocusId ? "on" : ""}`}
                  onClick={() => { choosePrimary(option.id); setCardTarget(option.cardTarget); setMinuteTarget(option.minuteTarget); }}
                  type="button">
                  {option.label}: {option.cardTarget} cards / {option.minuteTarget}m
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <GhostButton onClick={() => setStep(2)}><ArrowLeft size={15} /> Back</GhostButton>
              <GButton variant="primary" onClick={() => setStep(4)}>Continue <ArrowRight size={15} /></GButton>
            </div>
          </div>
        )}

        {step === last && (
          <div className="onboarding-body">
            <div className="onboarding-mark good"><Check size={26} /></div>
            <h2>Ready, {name.trim() || "there"}.</h2>
            <p className="onboarding-lede">
              Noctyrium is set up for <b>{track.label}</b>, focused on <b>{activeFocus.label}</b>.
              {!wasOnboarded && track.seedsStructure ? ` Your ${track.progress.unit} structure is loading now.` : ""}
            </p>
            <div className="onboarding-summary">
              <div><span>Program</span><b>{track.label}</b></div>
              <div><span>Primary focus</span><b>{activeFocus.label}</b></div>
              <div><span>Visible lanes</span><b>{[...subscriptions].map((id) => focusOption(id)?.label ?? id).join(", ")}</b></div>
              <div><span>SGU drives</span><b>{showSgu ? "Shown" : "Hidden"}</b></div>
              <div><span>Daily floor</span><b>{cardTarget} cards · {minuteTarget} min</b></div>
            </div>
            <div className="onboarding-track-note">
              <ShieldCheck size={15} />
              <span><b>How progress works here:</b> {track.progress.passMeaning} {track.progress.doneMeaning}</span>
            </div>
            <div className="onboarding-actions">
              <GhostButton onClick={() => setStep(3)}><ArrowLeft size={15} /> Back</GhostButton>
              <GButton variant="primary" onClick={finish}>Enter dashboard <ArrowRight size={15} /></GButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

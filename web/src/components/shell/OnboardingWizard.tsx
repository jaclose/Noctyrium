import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  Database,
  Download,
  HardDrive,
  LayoutDashboard,
  ListTree,
  ShieldCheck,
} from "lucide-react";
import { exportState } from "../../lib/backup";
import { focusOption, FOCUS_OPTIONS } from "../../lib/experience";
import {
  clearOnboardingDraft,
  readOnboardingDraft,
  writeOnboardingDraft,
  type OnboardingDestination,
  type OnboardingDraft,
  type OnboardingMode,
  type OnboardingQuickRequirement,
  type OnboardingWidgetPreset,
} from "../../lib/onboardingProgress";
import { DEFAULT_HIDDEN_DASHBOARD_WIDGETS } from "../../lib/seed";
import { useStore } from "../../lib/store";
import { academicStagesForTrack, EDUCATION_TRACKS, resolveTrack } from "../../lib/tracks";
import { makeDailyRequirement } from "../../lib/dailySuccess";
import { localDateKey } from "../../lib/dailyRollover";
import type { AcademicStageId, ExperienceFocusId } from "../../lib/types";
import { AxomMark, AxomWordmark } from "../ui/BrandMark";
import { Field, SelectField } from "../ui/Modal";
import { GButton, GhostButton } from "../ui/primitives";
import { ThemeToggle } from "../ui/ThemeToggle";

const STEP_TITLES = ["Identity", "Core setup", "Workspace", "Data safety"] as const;

const WORKFLOWS: Array<{
  id: OnboardingDestination;
  title: string;
  detail: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "dashboard", title: "Current plan", detail: "Start with today's plan and next move.", icon: LayoutDashboard },
  { id: "tracker", title: "Course Tracker", detail: "Map courses, modules, and study passes first.", icon: ListTree },
  { id: "questions", title: "Question Bank import", detail: "Open the trusted import flow after setup.", icon: BookOpen },
];

export function OnboardingWizard({
  mode,
  onComplete,
  onCancel,
}: {
  mode?: OnboardingMode;
  onComplete?: (destination: OnboardingDestination) => void;
  onCancel?: () => void;
}) {
  const store = useStore();
  const effectiveMode = mode ?? (store.profile.onboarded ? "rerun" : "first-run");
  const [draft, setDraft] = useState<OnboardingDraft>(() => {
    const fallback = defaultDraft(store, effectiveMode);
    return readOnboardingDraft(fallback);
  });
  const [notificationStatus, setNotificationStatus] = useState(() => notificationPermission());
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const track = resolveTrack(draft.trackId);
  const stageChoices = academicStagesForTrack(track.id).options;
  const focusChoices = FOCUS_OPTIONS.filter((option) => track.focusIds.includes(option.id));
  const activeFocus = focusOption(draft.focusId) ?? focusOption(track.defaultFocusId)!;

  useEffect(() => writeOnboardingDraft(draft), [draft]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [draft.step]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && effectiveMode === "rerun") {
        event.preventDefault();
        clearOnboardingDraft();
        onCancel?.();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = focusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [effectiveMode, onCancel]);

  function updateDraft(patch: Partial<OnboardingDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function chooseTrack(trackId: OnboardingDraft["trackId"]) {
    const next = resolveTrack(trackId);
    const stages = academicStagesForTrack(trackId);
    updateDraft({
      trackId,
      focusId: next.defaultFocusId,
      stageId: stages.defaultStageId,
      customStage: "",
    });
  }

  function move(step: number) {
    updateDraft({ step: Math.max(0, Math.min(STEP_TITLES.length - 1, step)) });
  }

  function skipOrCancel() {
    clearOnboardingDraft();
    if (effectiveMode === "first-run") {
      store.updateProfile({ onboarded: true, tourDone: true });
      onComplete?.("dashboard");
      return;
    }
    onCancel?.();
  }

  function finish(downloadBackup: boolean) {
    const chosenTrack = resolveTrack(draft.trackId);
    const chosenFocus = focusOption(draft.focusId) ?? focusOption(chosenTrack.defaultFocusId)!;
    const name = draft.name.trim();
    const currentProfile = useStore.getState().profile;
    const initialWidgetPreset: OnboardingWidgetPreset = (currentProfile.hiddenDashboardWidgets ?? DEFAULT_HIDDEN_DASHBOARD_WIDGETS).length === 0
      ? "expanded"
      : "focused";
    const shouldApplyWidgets = effectiveMode === "first-run" || draft.widgetPreset !== initialWidgetPreset;
    const profilePatch = {
      ...(name ? { name } : {}),
      onboarded: true,
      academicStageId: draft.stageId,
      customAcademicStage: draft.stageId === "other" ? draft.customStage.trim() || undefined : undefined,
      ...(shouldApplyWidgets ? {
        hiddenDashboardWidgets: draft.widgetPreset === "focused"
          ? focusedHiddenWidgets(chosenTrack.group === "Medical School")
          : [],
      } : {}),
      ...(effectiveMode === "first-run" || draft.launchTour ? { tourDone: !draft.launchTour } : {}),
    };
    store.updateProfile(profilePatch);
    applyQuickRequirements(draft.quickRequirements);
    const shouldApplyTrack = effectiveMode === "first-run"
      || draft.trackId !== currentProfile.educationTrack
      || draft.focusId !== currentProfile.activeFocusId;
    if (shouldApplyTrack) {
      store.applyEducationTrack(draft.trackId, {
        focusSubscriptions: [...chosenTrack.focusIds],
        activeFocusId: chosenFocus.id,
        showSguResources: chosenTrack.showsSguResources,
        cardTarget: chosenFocus.cardTarget,
        minuteTarget: chosenFocus.minuteTarget,
        // Onboarding is additive. Replacing existing term/course shells is an
        // explicit Settings action, never a side effect of first run or rerun.
        seedStructure: false,
      });
    }
    addFirstCourse(draft.firstCourse);
    clearOnboardingDraft();
    if (downloadBackup) exportState(useStore.getState());
    onComplete?.(draft.launchTour ? "dashboard" : draft.destination);
  }

  function applyQuickRequirements(selected: OnboardingQuickRequirement[]) {
    const current = useStore.getState().profile.dailySuccess;
    // A completed first run always leaves an explicit configuration. An empty
    // selection records "no requirements selected" so a new profile is neutral
    // instead of inheriting the legacy minutes+cards defaults. Reruns without a
    // selection leave the existing configuration untouched.
    if (!selected.length && (current || effectiveMode !== "first-run")) return;
    const today = useStore.getState().activeDayKey || localDateKey();
    const existing = current?.requirements ?? [];
    const additions = selected.map((id) => id === "study-minutes"
      ? makeDailyRequirement({
          id: "onboarding-study-minutes-v1",
          label: "Focused study",
          source: { kind: "study-minutes" },
          target: 60,
          unit: "minutes",
          trackingStartsAt: today,
        }, today)
      : makeDailyRequirement({
          id: "onboarding-closeout-v1",
          label: "Daily closeout",
          source: { kind: "journal-closeout" },
          target: 1,
          unit: "closeout",
          trackingStartsAt: today,
        }, today));
    const byId = new Map(existing.map((requirement) => [requirement.id, requirement]));
    for (const addition of additions) {
      if (!byId.has(addition.id)) byId.set(addition.id, addition);
    }
    store.updateProfile({
      dailySuccess: {
        version: 1,
        configuredAt: current?.configuredAt ?? today,
        requirements: [...byId.values()],
      },
    });
  }

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      setNotificationStatus("unavailable");
      return;
    }
    try {
      setNotificationStatus(await Notification.requestPermission());
    } catch {
      setNotificationStatus(Notification.permission);
    }
  }

  function addFirstCourse(value: string) {
    const courseName = value.trim();
    if (!courseName) return;
    let state = useStore.getState();
    if (state.courses.some((course) =>
      course.code.trim().toLocaleLowerCase() === courseName.toLocaleLowerCase()
      || course.name.trim().toLocaleLowerCase() === courseName.toLocaleLowerCase())) return;
    if (!state.terms[0]) {
      state.addTerm("Current term");
      state = useStore.getState();
    }
    const termId = state.terms[0]?.id;
    if (!termId) return;
    state.addCourse({ termId, code: courseName, name: "", files: 0 });
  }

  const stepTitle = STEP_TITLES[draft.step];

  return (
    <div className="onboarding-scrim">
      <div
        ref={dialogRef}
        className="onboarding-card wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <div className="onboarding-progress-row">
          <ol className="onboarding-steps" aria-label="Setup progress">
            {STEP_TITLES.map((title, index) => (
              <li
                key={title}
                className={`onboarding-step-dot ${index === draft.step ? "on" : ""} ${index < draft.step ? "done" : ""}`}
                aria-current={index === draft.step ? "step" : undefined}
              >
                <span aria-hidden="true">{index < draft.step ? <Check size={11} /> : index + 1}</span>
                <small>{title}</small>
              </li>
            ))}
          </ol>
          <button type="button" className="onboarding-skip" onClick={skipOrCancel}>
            {effectiveMode === "rerun" ? "Cancel" : "Skip setup"}
          </button>
        </div>

        {draft.step === 0 && (
          <div className="onboarding-body">
            <div className="onboarding-mark axom" aria-hidden="true"><AxomMark size={30} /></div>
            <h2 id={titleId} ref={headingRef} tabIndex={-1}>{stepTitle}</h2>
            <p className="onboarding-lede" id={descriptionId}>
              Tell <AxomWordmark /> what you are studying. Your path supplies sensible focus defaults, and every field can be changed later.
            </p>
            <Field
              label="Display name (optional)"
              placeholder="Your name (optional)"
              value={draft.name}
              onChange={(event) => updateDraft({ name: event.target.value })}
            />
            <SelectField label="Study path" value={draft.trackId}
              onChange={(event) => chooseTrack(event.target.value as OnboardingDraft["trackId"])}>
              {EDUCATION_TRACKS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}{option.status === "planned" ? " — lighter setup" : ""}</option>
              ))}
            </SelectField>
            <SelectField label="Current stage" value={draft.stageId}
              onChange={(event) => updateDraft({ stageId: event.target.value as AcademicStageId })}>
              {stageChoices.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </SelectField>
            {draft.stageId === "other" && (
              <Field
                label="Your stage (optional)"
                placeholder="Describe your current stage"
                value={draft.customStage}
                onChange={(event) => updateDraft({ customStage: event.target.value })}
              />
            )}
            <details className="onboarding-disclosure">
              <summary>Exam or term focus</summary>
              <p className="sub">Optional. This tunes study lanes and targets; it does not define your training stage.</p>
              <SelectField label="Current focus" value={draft.focusId}
                onChange={(event) => updateDraft({ focusId: event.target.value as ExperienceFocusId })}>
                {focusChoices.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </SelectField>
            </details>
            <div className="onboarding-track-note">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>{track.progress.summary} No course or imported work is removed when you change this later.</span>
            </div>
            <StepActions onNext={() => move(1)} />
          </div>
        )}

        {draft.step === 1 && (
          <div className="onboarding-body">
            <h2 id={titleId} ref={headingRef} tabIndex={-1}>{stepTitle}</h2>
            <p className="onboarding-lede" id={descriptionId}>
              Add one useful starting point, or leave it blank and begin with the structure for {track.short}.
            </p>
            <Field
              label="First course (optional)"
              placeholder="e.g. Cardiology"
              value={draft.firstCourse}
              onChange={(event) => updateDraft({ firstCourse: event.target.value })}
            />
            <fieldset className="onboarding-choice-group">
              <legend>Primary workflow</legend>
              <div className="onboarding-choice-grid">
                {WORKFLOWS.map((workflow) => {
                  const Icon = workflow.icon;
                  return (
                    <label className={`onboarding-choice ${draft.destination === workflow.id ? "on" : ""}`} key={workflow.id}>
                      <input type="radio" name="onboarding-workflow" value={workflow.id}
                        checked={draft.destination === workflow.id}
                        onChange={() => updateDraft({ destination: workflow.id })} />
                      <Icon size={18} aria-hidden="true" />
                      <span><b>{workflow.title}</b><small>{workflow.detail}</small></span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div className="onboarding-track-note">
              <BookOpen size={15} aria-hidden="true" />
              <span>Question import is optional and uses the same review-first workflow as the main Question Bank.</span>
            </div>
            <details className="onboarding-disclosure">
              <summary>Optional daily requirements</summary>
              <p className="sub">Choose up to two calm starting signals. Cards/Anki stays off unless you add it later.</p>
              <div className="onboarding-quick-requirements">
                {([
                  ["study-minutes", "Focused study", "60 minutes a day"],
                  ["journal-closeout", "Daily closeout", "One short reflection"],
                ] as Array<[OnboardingQuickRequirement, string, string]>).map(([id, title, detail]) => (
                  <label key={id}>
                    <input
                      type="checkbox"
                      checked={draft.quickRequirements.includes(id)}
                      onChange={(event) => updateDraft({
                        quickRequirements: event.target.checked
                          ? [...new Set([...draft.quickRequirements, id])].slice(0, 2)
                          : draft.quickRequirements.filter((item) => item !== id),
                      })}
                    />
                    <span><b>{title}</b><small>{detail}</small></span>
                  </label>
                ))}
              </div>
            </details>
            <StepActions onBack={() => move(0)} onNext={() => move(2)} />
          </div>
        )}

        {draft.step === 2 && (
          <div className="onboarding-body">
            <h2 id={titleId} ref={headingRef} tabIndex={-1}>{stepTitle}</h2>
            <p className="onboarding-lede" id={descriptionId}>
              Choose a calm starting layout. Theme and widget choices remain available in Settings and Customize.
            </p>
            <ThemeToggle />
            <fieldset className="onboarding-choice-group">
              <legend>Dashboard widgets</legend>
              <div className="onboarding-choice-grid two">
                {([
                  ["focused", "Focused", "Core plan, score, timer, and weekly rhythm."],
                  ["expanded", "Expanded", "Show every available dashboard widget."],
                ] as Array<[OnboardingWidgetPreset, string, string]>).map(([id, title, detail]) => (
                  <label className={`onboarding-choice ${draft.widgetPreset === id ? "on" : ""}`} key={id}>
                    <input type="radio" name="onboarding-widgets" value={id}
                      checked={draft.widgetPreset === id}
                      onChange={() => updateDraft({ widgetPreset: id })} />
                    <LayoutDashboard size={18} aria-hidden="true" />
                    <span><b>{title}</b><small>{detail}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="onboarding-notification-row">
              <div>
                <b><Bell size={15} aria-hidden="true" /> Focus-timer notifications</b>
                <span>{notificationCopy(notificationStatus)}</span>
              </div>
              {notificationStatus === "default" && (
                <GButton size="sm" onClick={enableNotifications}>Enable</GButton>
              )}
            </div>
            <div className="sub">Motion follows your device’s reduced-motion setting. No AI provider is required.</div>
            <StepActions onBack={() => move(1)} onNext={() => move(3)} />
          </div>
        )}

        {draft.step === 3 && (
          <div className="onboarding-body">
            <h2 id={titleId} ref={headingRef} tabIndex={-1}>{stepTitle}</h2>
            <p className="onboarding-lede" id={descriptionId}>
              Your AXOM workspace is stored on this device. Automatic local recovery snapshots help protect updates and migrations. Export a backup to keep a portable copy.
            </p>
            <div className="onboarding-safety-grid">
              <div><Database size={18} aria-hidden="true" /><span><b>Local workspace</b><small>Work saves on this device. Nothing is automatically uploaded to a cloud account.</small></span></div>
              <div><HardDrive size={18} aria-hidden="true" /><span><b>Recovery snapshots</b><small>AXOM makes local safety copies before storage migrations when needed.</small></span></div>
              <div><Download size={18} aria-hidden="true" /><span><b>Portable backup</b><small>An exported JSON file is the copy you can keep or move to another device.</small></span></div>
            </div>
            <label className="onboarding-tour-choice">
              <input type="checkbox" checked={draft.launchTour}
                onChange={(event) => updateDraft({ launchTour: event.target.checked })} />
              <span><b>Show the optional seven-step guide after setup</b><small>You can skip or replay it later from Help.</small></span>
            </label>
            <div className="onboarding-summary compact">
              <div><span>Study path</span><b>{track.label}</b></div>
              <div><span>Current stage</span><b>{draft.stageId === "other" ? draft.customStage.trim() || "Custom" : stageChoices.find((stage) => stage.id === draft.stageId)?.label}</b></div>
              <div><span>Current focus</span><b>{activeFocus.label}</b></div>
              <div><span>Start in</span><b>{WORKFLOWS.find((workflow) => workflow.id === draft.destination)?.title}</b></div>
              <div><span>Backup</span><b>Optional</b></div>
            </div>
            <div className="onboarding-actions">
              <GhostButton onClick={() => move(2)}><ArrowLeft size={15} /> Back</GhostButton>
              <div className="row wrap gap8 onboarding-finish-actions">
                <GButton onClick={() => finish(true)}><Download size={15} /> Finish and export backup</GButton>
                <GButton variant="primary" onClick={() => finish(false)}>
                  Finish <ArrowRight size={15} />
                </GButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function focusedHiddenWidgets(medical: boolean) {
  return [...new Set([
    ...DEFAULT_HIDDEN_DASHBOARD_WIDGETS,
    ...(medical ? [] : ["examCountdown", "weekly"] as const),
  ])];
}

function StepActions({ onBack, onNext }: { onBack?: () => void; onNext: () => void }) {
  return (
    <div className="onboarding-actions">
      {onBack ? <GhostButton onClick={onBack}><ArrowLeft size={15} /> Back</GhostButton> : <span />}
      <GButton variant="primary" onClick={onNext}>Continue <ArrowRight size={15} /></GButton>
    </div>
  );
}

function defaultDraft(store: ReturnType<typeof useStore.getState>, mode: OnboardingMode): OnboardingDraft {
  const track = resolveTrack(store.profile.educationTrack);
  const focus = store.profile.activeFocusId && track.focusIds.includes(store.profile.activeFocusId)
    ? store.profile.activeFocusId
    : track.defaultFocusId;
  const hidden = store.profile.hiddenDashboardWidgets ?? DEFAULT_HIDDEN_DASHBOARD_WIDGETS;
  const stages = academicStagesForTrack(track.id);
  const stageId = store.profile.academicStageId && stages.options.some((stage) => stage.id === store.profile.academicStageId)
    ? store.profile.academicStageId
    : stages.defaultStageId;
  const quickRequirements: OnboardingQuickRequirement[] = [];
  if (store.profile.dailySuccess?.requirements.some((requirement) => requirement.id === "onboarding-study-minutes-v1" && requirement.enabled)) {
    quickRequirements.push("study-minutes");
  }
  if (store.profile.dailySuccess?.requirements.some((requirement) => requirement.id === "onboarding-closeout-v1" && requirement.enabled)) {
    quickRequirements.push("journal-closeout");
  }
  return {
    version: 1,
    mode,
    step: 0,
    name: /^(axom|noctyrium)$/i.test(store.profile.name) ? "" : store.profile.name,
    trackId: track.id,
    stageId,
    customStage: store.profile.customAcademicStage ?? "",
    focusId: focus,
    firstCourse: "",
    destination: "dashboard",
    widgetPreset: hidden.length === 0 ? "expanded" : "focused",
    launchTour: false,
    quickRequirements,
  };
}

function notificationPermission(): NotificationPermission | "unavailable" {
  return typeof Notification === "undefined" ? "unavailable" : Notification.permission;
}

function notificationCopy(status: NotificationPermission | "unavailable") {
  if (status === "granted") return "Enabled for completed focus timers on this device.";
  if (status === "denied") return "Blocked by this browser. You can change that in browser settings.";
  if (status === "unavailable") return "Browser notifications are unavailable here.";
  return "Optional. AXOM asks only after you choose Enable.";
}

function focusableElements(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
}

import { EDUCATION_TRACKS, resolveTrack } from "./tracks";
import type { EducationTrackId, ExperienceFocusId } from "./types";

export type OnboardingMode = "first-run" | "rerun";
export type OnboardingDestination = "dashboard" | "tracker" | "questions";
export type OnboardingWidgetPreset = "focused" | "expanded";

export interface OnboardingDraft {
  version: 1;
  mode: OnboardingMode;
  step: number;
  name: string;
  trackId: EducationTrackId;
  focusId: ExperienceFocusId;
  firstCourse: string;
  destination: OnboardingDestination;
  widgetPreset: OnboardingWidgetPreset;
  launchTour: boolean;
}

export const ONBOARDING_DRAFT_KEY = "axom.onboarding-draft.v1";
export const TOUR_PROGRESS_KEY = "axom.guided-tour-step.v1";

type SessionStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserSessionStorage(): SessionStore | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function readOnboardingDraftMode(
  storage: Pick<Storage, "getItem"> | undefined = browserSessionStorage(),
): OnboardingMode | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { mode?: unknown };
    return parsed.mode === "first-run" || parsed.mode === "rerun" ? parsed.mode : null;
  } catch {
    return null;
  }
}

export function readOnboardingDraft(
  fallback: OnboardingDraft,
  storage: Pick<Storage, "getItem"> | undefined = browserSessionStorage(),
): OnboardingDraft {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.version !== 1 || parsed.mode !== fallback.mode) return fallback;

    const trackId = isTrackId(parsed.trackId) ? parsed.trackId : fallback.trackId;
    const track = resolveTrack(trackId);
    const focusId = typeof parsed.focusId === "string" && track.focusIds.includes(parsed.focusId as ExperienceFocusId)
      ? parsed.focusId as ExperienceFocusId
      : track.defaultFocusId;

    return {
      version: 1,
      mode: fallback.mode,
      step: clampStep(parsed.step),
      name: safeText(parsed.name, fallback.name, 120),
      trackId,
      focusId,
      firstCourse: safeText(parsed.firstCourse, fallback.firstCourse, 160),
      destination: isDestination(parsed.destination) ? parsed.destination : fallback.destination,
      widgetPreset: parsed.widgetPreset === "expanded" || parsed.widgetPreset === "focused"
        ? parsed.widgetPreset
        : fallback.widgetPreset,
      launchTour: typeof parsed.launchTour === "boolean" ? parsed.launchTour : fallback.launchTour,
    };
  } catch {
    return fallback;
  }
}

export function writeOnboardingDraft(
  draft: OnboardingDraft,
  storage: Pick<Storage, "setItem"> | undefined = browserSessionStorage(),
) {
  try {
    storage?.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ ...draft, step: clampStep(draft.step) }));
  } catch {
    // Resume is best-effort; onboarding still works when session storage is blocked.
  }
}

export function clearOnboardingDraft(
  storage: Pick<Storage, "removeItem"> | undefined = browserSessionStorage(),
) {
  try {
    storage?.removeItem(ONBOARDING_DRAFT_KEY);
  } catch {
    // Best effort.
  }
}

export function readTourStep(
  total: number,
  storage: Pick<Storage, "getItem"> | undefined = browserSessionStorage(),
): number {
  if (!storage || total <= 0) return 0;
  try {
    const value = Number(storage.getItem(TOUR_PROGRESS_KEY));
    return Number.isInteger(value) && value >= 0 && value < total ? value : 0;
  } catch {
    return 0;
  }
}

export function writeTourStep(
  step: number,
  storage: Pick<Storage, "setItem"> | undefined = browserSessionStorage(),
) {
  try {
    if (Number.isInteger(step) && step >= 0) storage?.setItem(TOUR_PROGRESS_KEY, String(step));
  } catch {
    // Best effort.
  }
}

export function clearTourProgress(
  storage: Pick<Storage, "removeItem"> | undefined = browserSessionStorage(),
) {
  try {
    storage?.removeItem(TOUR_PROGRESS_KEY);
  } catch {
    // Best effort.
  }
}

function clampStep(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) ? Math.max(0, Math.min(3, number)) : 0;
}

function safeText(value: unknown, fallback: string, maxLength: number) {
  return typeof value === "string" ? value.slice(0, maxLength) : fallback;
}

function isTrackId(value: unknown): value is EducationTrackId {
  return typeof value === "string" && EDUCATION_TRACKS.some((track) => track.id === value);
}

function isDestination(value: unknown): value is OnboardingDestination {
  return value === "dashboard" || value === "tracker" || value === "questions";
}

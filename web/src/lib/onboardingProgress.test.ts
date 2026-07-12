// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearOnboardingDraft,
  clearTourProgress,
  ONBOARDING_DRAFT_KEY,
  readOnboardingDraft,
  readOnboardingDraftMode,
  readTourStep,
  TOUR_PROGRESS_KEY,
  writeOnboardingDraft,
  writeTourStep,
  type OnboardingDraft,
} from "./onboardingProgress";

const fallback: OnboardingDraft = {
  version: 1,
  mode: "first-run",
  step: 0,
  name: "",
  trackId: "sgu",
  stageId: "preclinical",
  customStage: "",
  focusId: "term1",
  firstCourse: "",
  destination: "dashboard",
  widgetPreset: "focused",
  launchTour: false,
  quickRequirements: [],
};

const values = new Map<string, string>();
const memorySession = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: (key: string) => values.get(key) ?? null,
  key: (index: number) => [...values.keys()][index] ?? null,
  removeItem: (key: string) => { values.delete(key); },
  setItem: (key: string, value: string) => { values.set(key, String(value)); },
};

describe("onboarding session progress", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", memorySession);
    sessionStorage.clear();
  });

  it("round-trips a valid draft in the supplied session store", () => {
    const draft = { ...fallback, step: 2, name: "Ada", destination: "questions" as const };
    writeOnboardingDraft(draft, sessionStorage);

    expect(readOnboardingDraft(fallback, sessionStorage)).toEqual(draft);
    expect(readOnboardingDraftMode(sessionStorage)).toBe("first-run");
  });

  it("sanitizes invalid steps, tracks, focuses, and enum values", () => {
    sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({
      ...fallback,
      step: 99,
      trackId: "unknown",
      focusId: "unknown",
      destination: "cloud",
      widgetPreset: "everything",
      name: 42,
    }));

    expect(readOnboardingDraft(fallback, sessionStorage)).toEqual({ ...fallback, step: 3 });
  });

  it("does not resume a draft from a different onboarding mode", () => {
    sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ ...fallback, mode: "rerun", step: 2 }));
    expect(readOnboardingDraft(fallback, sessionStorage)).toEqual(fallback);
  });

  it("clears onboarding and tour progress independently", () => {
    writeOnboardingDraft(fallback, sessionStorage);
    writeTourStep(4, sessionStorage);
    expect(readTourStep(7, sessionStorage)).toBe(4);

    clearOnboardingDraft(sessionStorage);
    expect(sessionStorage.getItem(ONBOARDING_DRAFT_KEY)).toBeNull();
    expect(sessionStorage.getItem(TOUR_PROGRESS_KEY)).toBe("4");

    clearTourProgress(sessionStorage);
    expect(readTourStep(7, sessionStorage)).toBe(0);
  });

  it("rejects stale or out-of-range tour steps", () => {
    sessionStorage.setItem(TOUR_PROGRESS_KEY, "7");
    expect(readTourStep(7, sessionStorage)).toBe(0);
    sessionStorage.setItem(TOUR_PROGRESS_KEY, "NaN");
    expect(readTourStep(7, sessionStorage)).toBe(0);
  });
});

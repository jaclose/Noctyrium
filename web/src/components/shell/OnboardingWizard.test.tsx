// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportState } from "../../lib/backup";
import { evaluateDailySuccess } from "../../lib/dailySuccess";
import { localDateKey } from "../../lib/dailyRollover";
import { ONBOARDING_DRAFT_KEY } from "../../lib/onboardingProgress";
import { makeSeed } from "../../lib/seed";
import { useStore } from "../../lib/store";
import { OnboardingWizard } from "./OnboardingWizard";

vi.mock("../../lib/backup", () => ({ exportState: vi.fn() }));

const sessionValues = new Map<string, string>();
const memorySession = {
  get length() { return sessionValues.size; },
  clear: () => sessionValues.clear(),
  getItem: (key: string) => sessionValues.get(key) ?? null,
  key: (index: number) => [...sessionValues.keys()][index] ?? null,
  removeItem: (key: string) => { sessionValues.delete(key); },
  setItem: (key: string, value: string) => { sessionValues.set(key, String(value)); },
};

beforeEach(() => {
  vi.stubGlobal("sessionStorage", memorySession);
  sessionStorage.clear();
  useStore.setState(makeSeed());
  useStore.getState().updateProfile({ onboarded: false, tourDone: undefined });
  vi.mocked(exportState).mockClear();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

function continueSetup(count = 1) {
  for (let index = 0; index < count; index += 1) {
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  }
}

describe("OnboardingWizard", () => {
  it("presents exactly four accessible, optional setup steps", () => {
    render(<OnboardingWizard mode="first-run" />);

    expect(screen.getByRole("dialog", { name: "Identity" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("list", { name: "Setup progress" }).querySelector('[aria-current="step"]')?.textContent).toContain("Identity");
    expect(screen.getByLabelText("Display name (optional)")).toBeTruthy();
    expect(screen.getByLabelText("Study path")).toBeTruthy();
    expect(screen.getByLabelText("Current stage")).toBeTruthy();
    expect(screen.getByLabelText("Current focus")).toBeTruthy();

    continueSetup();
    expect(screen.getByRole("dialog", { name: "Core setup" })).toBeTruthy();
    expect(screen.getByLabelText("First course (optional)")).toBeTruthy();
    expect(screen.getByLabelText(/Question Bank import/)).toBeTruthy();

    continueSetup();
    expect(screen.getByRole("dialog", { name: "Workspace" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Appearance" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Dashboard widgets" })).toBeTruthy();
    expect(screen.getByText("No AI provider is required.", { exact: false })).toBeTruthy();

    continueSetup();
    expect(screen.getByRole("dialog", { name: "Data safety" })).toBeTruthy();
    expect(screen.getByText(/workspace is stored on this device/)).toBeTruthy();
    expect(screen.getByText(/Nothing is automatically uploaded to a cloud account/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Finish and export backup/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Finish" })).toBeTruthy();
  });

  it("offers inclusive medical stages and optional non-Anki requirements without duplication", () => {
    render(<OnboardingWizard mode="first-run" />);
    const path = screen.getByLabelText("Study path") as HTMLSelectElement;
    fireEvent.change(path, { target: { value: "usmd" } });
    const stage = screen.getByLabelText("Current stage") as HTMLSelectElement;
    expect([...stage.options].map((option) => option.text)).toEqual([
      "Pre-clinical",
      "Clinical rotations",
      "Dedicated board preparation",
      "Residency application",
      "Other / Custom",
    ]);
    fireEvent.change(path, { target: { value: "do" } });
    expect([...stage.options].map((option) => option.text)).toContain("Pre-clinical");
    fireEvent.change(stage, { target: { value: "other" } });
    fireEvent.change(screen.getByLabelText("Your stage (optional)"), { target: { value: "Research year" } });

    continueSetup();
    expect(screen.queryByText(/Anki/, { selector: "label" })).toBeNull();
    fireEvent.click(screen.getByLabelText(/Focused study/));
    fireEvent.click(screen.getByLabelText(/Daily closeout/));
    continueSetup(2);
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));

    const profile = useStore.getState().profile;
    expect(profile).toMatchObject({
      educationTrack: "do",
      academicStageId: "other",
      customAcademicStage: "Research year",
    });
    expect(profile.dailySuccess?.requirements.map((item) => item.id)).toEqual([
      "onboarding-study-minutes-v1",
      "onboarding-closeout-v1",
    ]);

    cleanup();
    render(<OnboardingWizard mode="rerun" />);
    continueSetup(3);
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(useStore.getState().profile.dailySuccess?.requirements).toHaveLength(2);
  });

  it("records an explicit empty configuration when a first run selects no requirements", () => {
    render(<OnboardingWizard mode="first-run" />);
    continueSetup(3);
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));

    const profile = useStore.getState().profile;
    // A new profile is explicitly configured as "nothing selected" — it must not
    // fall back to the legacy minutes+cards defaults (no Anki by default).
    expect(profile.dailySuccess).toBeDefined();
    expect(profile.dailySuccess?.requirements).toEqual([]);
    const evaluated = evaluateDailySuccess({ ...useStore.getState(), activeDayKey: localDateKey() });
    expect(evaluated.status).toBe("neutral");
    expect(evaluated.statusLabel).toBe("No requirements selected");
    expect(evaluated.requirements.some((item) => item.requirement.source.kind === "cards-reviewed")).toBe(false);
  });

  it("sanely resumes the current step and draft after reload", async () => {
    const first = render(<OnboardingWizard mode="first-run" />);
    fireEvent.change(screen.getByLabelText("Display name (optional)"), { target: { value: "Ada" } });
    continueSetup();
    fireEvent.change(screen.getByLabelText("First course (optional)"), { target: { value: "Cardiology" } });

    await waitFor(() => expect(sessionStorage.getItem(ONBOARDING_DRAFT_KEY)).toContain("Cardiology"));
    first.unmount();
    render(<OnboardingWizard mode="first-run" />);

    expect(screen.getByRole("dialog", { name: "Core setup" })).toBeTruthy();
    expect((screen.getByLabelText("First course (optional)") as HTMLInputElement).value).toBe("Cardiology");
  });

  it("applies existing track defaults, adds an optional course, and routes explicitly", () => {
    const onComplete = vi.fn();
    render(<OnboardingWizard mode="first-run" onComplete={onComplete} />);
    fireEvent.change(screen.getByLabelText("Display name (optional)"), { target: { value: "Ada" } });
    continueSetup();
    fireEvent.change(screen.getByLabelText("First course (optional)"), { target: { value: "Cardiology" } });
    fireEvent.click(screen.getByLabelText(/Question Bank import/));
    continueSetup();
    fireEvent.click(screen.getByLabelText(/Expanded/));
    continueSetup();
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));

    const state = useStore.getState();
    expect(state.profile).toMatchObject({
      name: "Ada",
      onboarded: true,
      tourDone: true,
      hiddenDashboardWidgets: [],
      educationTrack: "sgu",
      activeFocusId: "term1",
    });
    expect(state.courses.some((course) => course.code === "Cardiology")).toBe(true);
    expect(onComplete).toHaveBeenCalledWith("questions");
    expect(sessionStorage.getItem(ONBOARDING_DRAFT_KEY)).toBeNull();
    expect(exportState).not.toHaveBeenCalled();
  });

  it("never seeds or replaces course structure during a rerun", () => {
    const state = useStore.getState();
    state.updateProfile({
      onboarded: true,
      name: "Existing user",
      tagline: "Keep my goal",
      dailyMinuteTarget: 137,
      hiddenDashboardWidgets: ["schedule"],
    });
    useStore.setState({
      terms: [{ id: "custom-term", name: "My term" }],
      courses: [{ id: "custom-course", termId: "custom-term", code: "KEEP 101", name: "Keep me", files: 0, modules: [] }],
      tracker: [],
    });
    const onComplete = vi.fn();
    render(<OnboardingWizard mode="rerun" onComplete={onComplete} />);
    continueSetup(3);
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));

    expect(useStore.getState().courses).toEqual([
      expect.objectContaining({ id: "custom-course", code: "KEEP 101", name: "Keep me" }),
    ]);
    expect(useStore.getState().terms).toEqual([{ id: "custom-term", name: "My term" }]);
    expect(useStore.getState().profile).toMatchObject({
      tagline: "Keep my goal",
      dailyMinuteTarget: 137,
      hiddenDashboardWidgets: ["schedule"],
    });
    expect(onComplete).toHaveBeenCalledWith("dashboard");
  });

  it("skips first-run setup without applying track changes and cancels reruns without changing profile data", () => {
    const firstComplete = vi.fn();
    render(<OnboardingWizard mode="first-run" onComplete={firstComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip setup" }));
    expect(useStore.getState().profile).toMatchObject({ onboarded: true, tourDone: true });
    expect(firstComplete).toHaveBeenCalledWith("dashboard");

    cleanup();
    const originalName = useStore.getState().profile.name;
    const onCancel = vi.fn();
    render(<OnboardingWizard mode="rerun" onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText("Display name (optional)"), { target: { value: "Not saved" } });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
    expect(useStore.getState().profile.name).toBe(originalName);
  });

  it("exports a real post-setup snapshot only when explicitly requested", () => {
    render(<OnboardingWizard mode="first-run" />);
    continueSetup(3);
    fireEvent.click(screen.getByRole("button", { name: /Finish and export backup/ }));

    expect(exportState).toHaveBeenCalledOnce();
    expect(vi.mocked(exportState).mock.calls[0][0].profile.onboarded).toBe(true);
  });
});

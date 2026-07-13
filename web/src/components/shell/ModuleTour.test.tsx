// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TOUR_PROGRESS_KEY } from "../../lib/onboardingProgress";
import { ModuleTour, type ModuleTourStep } from "./ModuleTour";

const steps: readonly ModuleTourStep[] = [
  { target: "first", title: "First", body: "First step" },
  { target: "missing", title: "Missing", body: "Missing target remains usable" },
] as const;

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ModuleTour", () => {
  it("reuses focus, reduced-motion, missing-target, Escape, and non-persistent behavior", () => {
    const onExit = vi.fn();
    sessionStorage.setItem(TOUR_PROGRESS_KEY, "5");
    render(<><div data-module-tour="first">Target</div><ModuleTour name="Test module" route="test" steps={steps} onExit={onExit} /></>);

    const dialog = screen.getByRole("dialog", { name: "First" });
    expect(document.activeElement).toBe(dialog);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "auto" });
    expect(screen.getByRole("progressbar", { name: "Test module tour progress" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Missing" }).classList.contains("centered")).toBe(true);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onExit).toHaveBeenCalledWith("escape");
    expect(sessionStorage.getItem(TOUR_PROGRESS_KEY)).toBe("5");
  });

  it("supports module-specific skip and explicit replay from step one", () => {
    const onExit = vi.fn();
    const first = render(<ModuleTour name="Test module" route="test" steps={steps} onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip Test module tour" }));
    expect(onExit).toHaveBeenCalledWith("skip");
    first.unmount();

    render(<ModuleTour name="Test module" route="test" steps={steps} onExit={onExit} />);
    expect(screen.getByRole("dialog", { name: "First" })).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
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
  HTMLElement.prototype.scrollTo = vi.fn(function scrollTo(this: HTMLElement, options?: ScrollToOptions | number, y?: number) {
    if (typeof options === "number") {
      this.scrollLeft = options;
      this.scrollTop = y ?? 0;
      return;
    }
    this.scrollLeft = options?.left ?? this.scrollLeft;
    this.scrollTop = options?.top ?? this.scrollTop;
  });
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  document.documentElement.className = "";
  document.documentElement.style.removeProperty("--tour-test");
  document.body.className = "";
  document.body.style.removeProperty("--tour-test");
  document.querySelectorAll(".tour-test-scroll-owner").forEach((element) => element.remove());
  delete (HTMLElement.prototype as Partial<HTMLElement>).scrollTo;
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
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "center", inline: "nearest", behavior: "auto" });
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

  it.each([
    { exit: "finish" as const, expectedReason: "complete" as const },
    { exit: "skip" as const, expectedReason: "skip" as const },
    { exit: "escape" as const, expectedReason: "escape" as const },
  ])("restores its scroll owner and leaves document styles untouched after $exit", ({ exit, expectedReason }) => {
    const onExit = vi.fn();
    document.documentElement.className = "html-sentinel";
    document.documentElement.style.setProperty("--tour-test", "html");
    document.body.className = "body-sentinel";
    document.body.style.setProperty("--tour-test", "body");
    sessionStorage.setItem(TOUR_PROGRESS_KEY, "5");

    const { surface } = renderScrollHarness(onExit);
    expect(surface.scrollTop).not.toBe(286);
    expect(document.body.querySelector(".tour-overlay")).toBeTruthy();

    if (exit === "finish") {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    } else if (exit === "skip") {
      fireEvent.click(screen.getByRole("button", { name: "Skip Test module tour" }));
    } else {
      fireEvent.keyDown(window, { key: "Escape" });
    }

    expect(onExit).toHaveBeenCalledWith(expectedReason);
    expect(surface.scrollTop).toBe(286);
    expect(document.body.querySelector(".tour-overlay")).toBeNull();
    expect(document.documentElement.className).toBe("html-sentinel");
    expect(document.documentElement.style.getPropertyValue("--tour-test")).toBe("html");
    expect(document.body.className).toBe("body-sentinel");
    expect(document.body.style.getPropertyValue("--tour-test")).toBe("body");
    expect(sessionStorage.getItem(TOUR_PROGRESS_KEY)).toBe("5");
  });

  it("restores scrolling and removes the portalled overlay when its owner unmounts", () => {
    const { unmount, surface } = renderScrollHarness(() => {});
    expect(surface.scrollTop).not.toBe(286);
    expect(document.body.querySelector(".tour-overlay")).toBeTruthy();

    unmount();

    expect(surface.scrollTop).toBe(286);
    expect(document.body.querySelector(".tour-overlay")).toBeNull();
  });
});

function ScrollHarness({ onExit }: { onExit: (reason: "complete" | "skip" | "escape") => void }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <div data-module-tour="first">Target</div>
      {open && (
        <ModuleTour
          name="Test module"
          route="test"
          steps={[
            { target: "first", title: "First", body: "First step" },
            { target: "missing", title: "Missing", body: "Missing target remains usable" },
          ]}
          onExit={(reason) => {
            onExit(reason);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function renderScrollHarness(onExit: (reason: "complete" | "skip" | "escape") => void) {
  const surface = document.createElement("div");
  surface.className = "surface-scroll tour-test-scroll-owner";
  surface.dataset.testid = "tour-scroll-owner";
  surface.scrollTop = 286;
  const host = document.createElement("div");
  surface.append(host);
  document.body.append(surface);
  const result = render(<ScrollHarness onExit={onExit} />, { container: host });
  return { ...result, surface };
}

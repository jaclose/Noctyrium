// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuidedTour } from "./GuidedTour";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete (Element.prototype as Partial<Element>).scrollIntoView;
});

function TourHarness() {
  const [route, setRoute] = useState("dashboard");
  return (
    <>
      <div data-tour="question-bank-entry">Question Bank entry target</div>
      <output aria-label="Current tour route">{route}</output>
      <GuidedTour onExit={() => {}} onNavigate={setRoute} currentRoute={route} />
    </>
  );
}

function reachQuestionBankStep() {
  for (let index = 0; index < 8; index += 1) {
    fireEvent.click(screen.getByRole("button", { name: /begin the tour|next/i }));
  }
}

describe("GuidedTour Question Bank step", () => {
  it.each([
    { reducedMotion: true, expectedBehavior: "auto" as const },
    { reducedMotion: false, expectedBehavior: "smooth" as const },
  ])("uses $expectedBehavior scrolling when reduced motion is $reducedMotion", async ({ reducedMotion, expectedBehavior }) => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => ({
      matches: reducedMotion && query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));

    render(<TourHarness />);
    reachQuestionBankStep();

    expect(screen.getByText("Question Bank", { selector: ".tour-tip-title" })).toBeTruthy();
    expect(screen.getByText(/Import → Review → Practice → Understand/)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByRole("status", { name: "Current tour route" }).textContent).toBe("questions");
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: expectedBehavior });
    });
  });
});

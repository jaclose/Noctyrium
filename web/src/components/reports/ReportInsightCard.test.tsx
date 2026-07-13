// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReportMetric } from "../../lib/reports";
import { ReportInsightCard } from "./ReportInsightCard";

const metric: ReportMetric = {
  id: "consistency",
  label: "Consistency",
  value: "75%",
  note: "3/4 days",
  numerator: 3,
  denominator: 4,
  period: "4 eligible days",
  sourceLabel: "Activity log",
  sourceRecordIds: ["a"],
  calculation: "3 ÷ 4",
  interpretation: "Activity appeared on most eligible days.",
  action: "Keep one small repeatable action",
  state: "ready",
};

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("ReportInsightCard", () => {
  it("keeps meaning visible, reveals on focus, and closes on blur", () => {
    render(<ReportInsightCard icon={<span />} metric={metric} insight={{ change: "Up 10%", strongestContributor: "Questions" }} />);
    const trigger = screen.getByRole("button", { name: /Consistency/ });
    expect(screen.getByText("Activity appeared on most eligible days.")).toBeTruthy();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.mouseEnter(trigger.closest("article")!);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.mouseLeave(trigger.closest("article")!);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.focus(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Up 10%").closest("[aria-hidden]")?.getAttribute("aria-hidden")).toBe("false");
    fireEvent.blur(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("pins with click or Enter and Escape closes the pinned layer", () => {
    render(<ReportInsightCard icon={<span />} metric={metric} />);
    const trigger = screen.getByRole("button", { name: /Consistency/ });
    fireEvent.click(trigger);
    fireEvent.blur(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.keyDown(trigger, { key: " " });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(trigger, { key: "Escape" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("shows the insight immediately for reduced-motion users", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    render(<ReportInsightCard icon={<span />} metric={metric} />);
    expect(screen.getByRole("button", { name: /Consistency/ }).getAttribute("aria-expanded")).toBe("true");
  });
});

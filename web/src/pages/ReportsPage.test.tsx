// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeSeed } from "../lib/seed";
import { useStore } from "../lib/store";
import { ReportsPage } from "./ReportsPage";

beforeEach(() => {
  const seed = makeSeed();
  seed.logs = [];
  seed.tasks = [];
  seed.tracker = [];
  seed.journal = [];
  seed.energyFactors = [];
  seed.profile.dailySuccess = { version: 1, configuredAt: seed.activeDayKey, requirements: [] };
  useStore.setState(seed);
});

afterEach(cleanup);

describe("ReportsPage", () => {
  it("uses honest low-data states and removes future/developer placeholders", () => {
    render(<ReportsPage />);
    expect(screen.getByText("No targets")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Today" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Trend" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Study system" })).toBeTruthy();
    expect(screen.getAllByText("No readiness input yet").length).toBeGreaterThan(0);
    expect(screen.queryByText(/31 failed days/i)).toBeNull();
    expect(screen.queryByText("Hourly week map")).toBeNull();
    expect(screen.queryByText("Traceability")).toBeNull();
  });

  it("reveals insight on focus and keeps technical detail secondary", () => {
    render(<ReportsPage />);
    const trigger = screen.getByRole("button", { name: /Consistency/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.focus(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const detail = document.getElementById(trigger.getAttribute("aria-controls")!);
    expect(detail?.textContent).toContain("What changed");
    expect(detail?.textContent).toContain("Source");
    expect(detail?.textContent).toContain("Technical details");
    fireEvent.blur(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("gives trend columns keyboard-focusable accessible names", () => {
    render(<ReportsPage />);
    const trend = screen.getAllByRole("button", { name: /0 minutes; not scheduled/ })[0];
    expect(trend.tagName).toBe("BUTTON");
  });

  it("does not treat a trivial activity as readiness evidence", () => {
    const dayKey = useStore.getState().activeDayKey;
    useStore.setState({
      logs: [{
        id: "one-minute",
        dayKey,
        ts: `${dayKey}T12:00:00.000Z`,
        type: "Study",
        minutes: 1,
        cards: 0,
        academic: true,
        productive: true,
      }],
    });
    render(<ReportsPage />);
    expect(screen.getAllByText("No readiness input yet").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Completed meaningful work/)).toBeNull();
  });

  it("accepts an activity only when it produces a real readiness contribution", () => {
    const dayKey = useStore.getState().activeDayKey;
    useStore.setState({
      logs: [{
        id: "meaningful-work",
        dayKey,
        ts: `${dayKey}T12:00:00.000Z`,
        type: "Study",
        minutes: 60,
        cards: 0,
        academic: true,
        productive: true,
      }],
    });
    render(<ReportsPage />);
    expect(screen.queryByText("No readiness input yet")).toBeNull();
    expect(screen.getAllByText(/Completed meaningful work/).length).toBeGreaterThan(0);
  });

  it("keeps performance preliminary when only lifetime journal history has enough days", () => {
    useStore.setState({
      journal: Array.from({ length: 5 }, (_, index) => ({
        id: `old-journal-${index}`,
        date: `2026-06-0${index + 1}T20:00:00.000Z`,
        today: "Completed old work",
        tomorrow: "Continue",
        blockers: "",
        energy: "High",
        rating: "Useful",
      })),
    });
    render(<ReportsPage />);
    fireEvent.click(screen.getByText("More reports and technical detail"));
    expect(screen.getByText(/Building baseline/)).toBeTruthy();
    expect(screen.getByText(/0\/5 active days with signal/)).toBeTruthy();
  });
});

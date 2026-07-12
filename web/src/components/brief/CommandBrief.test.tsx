// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { calculateReadiness } from "../../lib/energy";
import { makeSeed } from "../../lib/seed";
import { useStore } from "../../lib/store";
import { useUi } from "../../lib/uiStore";
import { CommandBrief } from "./CommandBrief";

beforeEach(() => {
  const seed = makeSeed();
  useStore.setState({
    ...seed,
    activeDayKey: "2026-07-12",
    tasks: [],
    tracker: [],
    logs: [],
    sessions: [],
    closeouts: [],
    recoveryPlans: [],
    questions: [],
    ankiCards: [],
    dayPlans: [],
    energyFactors: [],
    journal: [{
      id: "today",
      date: "2026-07-12T12:00:00",
      today: "Low energy today.",
      tomorrow: "",
      blockers: "",
      energy: "Low",
      rating: "",
    }],
  });
  useUi.setState({ journalDay: null });
  window.location.hash = "#dashboard";
});

afterEach(cleanup);

describe("CommandBrief recommendation provenance", () => {
  it("explains the threshold, calculation, unchanged data, and user overrides", () => {
    const state = useStore.getState();
    const readiness = calculateReadiness({
      date: state.activeDayKey,
      factors: state.energyFactors,
      journal: state.journal,
      logs: state.logs,
      tasks: state.tasks,
      dayPlans: state.dayPlans,
      productivityTrackers: state.productivityTrackers,
    });
    render(<CommandBrief readiness={readiness} />);

    expect(screen.getByRole("heading", { name: "Lower-energy option" })).toBeTruthy();
    expect(screen.getByText(/Self-reported energy:/i).textContent).toMatch(/35\/100/);
    expect(screen.getByText(/suggestion threshold:/i).textContent).toMatch(/40\/100/);
    expect(screen.getByText(/Tasks and deadlines/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /show calculation/i }));
    expect(screen.getByText(/Baseline 62\/100/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Update energy" }));
    expect(useUi.getState().journalDay).toBe("2026-07-12");
    expect(window.location.hash).toBe("#journal");

    fireEvent.click(screen.getByRole("button", { name: "Restore original plan" }));
    expect(screen.queryByRole("heading", { name: "Lower-energy option" })).toBeNull();
    expect(useStore.getState().tasks).toEqual([]);
    expect(useStore.getState().dayPlans).toEqual([]);
  });
});

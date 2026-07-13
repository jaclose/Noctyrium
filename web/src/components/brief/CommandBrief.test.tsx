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
  it("renders a neutral evidence checklist for a seed-only workspace", () => {
    useStore.setState({ ...makeSeed(), activeDayKey: "2026-07-12" });
    render(<CommandBrief />);

    expect(screen.getByRole("heading", { name: "Command Brief" })).toBeTruthy();
    expect(screen.getByText("AXOM is learning your current workload.")).toBeTruthy();
    expect(screen.getByRole("list", { name: "Command Brief evidence readiness" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Add or import workload" }).getAttribute("href")).toBe("#tracker");
    expect(screen.queryByText("Next best move")).toBeNull();
    expect(screen.queryByText(/Minimum viable win/i)).toBeNull();
    expect(screen.queryByText(/Since yesterday/i)).toBeNull();
  });

  it("explains the threshold, calculation, unchanged data, and user overrides", () => {
    useStore.setState({
      courses: [{ id: "course-real", termId: "term-real", code: "RENAL", name: "Renal block", files: 0, modules: [] }],
      tracker: [
        { id: "tracker-real-1", path: "Renal/Lectures", label: "Glomerular physiology", kind: "Lecture", passes: 0, ankiPasses: 0, yield: "high", updated: "2026-07-12T08:00:00.000Z" },
        { id: "tracker-real-2", path: "Renal/PQs", label: "Renal practice", kind: "PQ", passes: 1, ankiPasses: 0, yield: "review", updated: "2026-07-12T08:00:00.000Z" },
      ],
      logs: [{ id: "log-real", dayKey: "2026-07-12", ts: "2026-07-12T09:00:00.000Z", type: "Study", minutes: 30, cards: 0, academic: true, productive: true }],
    });
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

  it("renders the accepted brief once every evidence criterion is ready", () => {
    useStore.setState({
      courses: [{ id: "course-real", termId: "term-real", code: "RENAL", name: "Renal block", files: 0, modules: [] }],
      tracker: [
        { id: "tracker-real-1", path: "Renal/Lectures", label: "Glomerular physiology", kind: "Lecture", passes: 0, ankiPasses: 0, yield: "high", updated: "2026-07-12T08:00:00.000Z" },
        { id: "tracker-real-2", path: "Renal/PQs", label: "Renal practice", kind: "PQ", passes: 1, ankiPasses: 0, yield: "review", updated: "2026-07-12T08:00:00.000Z" },
      ],
      logs: [{ id: "log-real", dayKey: "2026-07-12", ts: "2026-07-12T09:00:00.000Z", type: "Study", minutes: 30, cards: 0, academic: true, productive: true }],
    });

    render(<CommandBrief />);
    expect(screen.queryByText("AXOM is learning your current workload.")).toBeNull();
    expect(screen.getByText("Current state")).toBeTruthy();
    expect(screen.getByText("Next best move")).toBeTruthy();
    expect(screen.getByText(/Alternate small win/i)).toBeTruthy();
    expect(screen.getByText(/Since yesterday/i)).toBeTruthy();

    const disclosure = screen.getByText("Why this suggestion?");
    const details = disclosure.closest("details");
    expect(details?.hasAttribute("open")).toBe(false);
    fireEvent.click(disclosure);
    expect(details?.hasAttribute("open")).toBe(true);
    expect(screen.getByText(/Evidence score: \d+/)).toBeTruthy();
    expect(screen.getByRole("list", { name: "Suggestion evidence" })).toBeTruthy();
    expect(screen.getAllByText("Course Tracker", { exact: false }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Recovery plan" })).toBeNull();
  });
});

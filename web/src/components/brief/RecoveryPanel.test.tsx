// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeSeed } from "../../lib/seed";
import { useStore } from "../../lib/store";
import { detectRecoveryTriggers } from "../../lib/recovery";
import type { BriefSignals } from "../../lib/commandBrief";
import { RecoveryPanel } from "./RecoveryPanel";

const signals: BriefSignals = {
  daysSinceLastStudy: 4,
  missedDaysLast7: 4,
  overdueTasks: 3,
  carriedTasks: 0,
  openTasks: 3,
  backlogScore: 60,
  examDaysAway: null,
  reviewFlagged: 0,
  dueQuestionCount: 0,
  dueCardCount: 0,
  yesterdayMinutes: 0,
  todayMinutes: 0,
};

beforeEach(() => {
  const seed = makeSeed();
  useStore.setState({
    ...seed,
    activeDayKey: "2026-07-12",
    tasks: [
      { id: "one", title: "One", done: false, archived: false, due: "2026-07-10", created: "2026-07-01" },
      { id: "two", title: "Two", done: false, archived: false, due: "2026-07-11", created: "2026-07-01" },
      { id: "three", title: "Three", done: false, archived: false, due: "2026-07-11", created: "2026-07-01" },
    ],
    tracker: [],
    logs: [],
    recoveryPlans: [],
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("RecoveryPanel provenance and overrides", () => {
  it("shows the canonical calculation and keeps the suggested reduction a non-destructive preview", () => {
    const originalTasks = structuredClone(useStore.getState().tasks);
    render(<RecoveryPanel signals={signals} trigger={detectRecoveryTriggers(signals)} onClose={() => {}} />);

    expect(screen.getByText(/optional preview · your tasks have not changed/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /show calculation/i }));
    expect(screen.getByText(/Trigger severity:/i).textContent).toMatch(/serious/i);
    expect(screen.getAllByText("3", { selector: ".data-health-cell > b" })).toHaveLength(2);
    expect(screen.getByText(/no task is deleted, archived, rescheduled, or edited/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^Reduce load$/ }));
    expect(useStore.getState().tasks).toEqual(originalTasks);
    expect(useStore.getState().recoveryPlans[0]).toMatchObject({
      status: "accepted",
      dayKey: "2026-07-12",
    });
  });

  it("keeps the ordinary plan without persisting and can dismiss suggestions for today", () => {
    const firstClose = vi.fn();
    const first = render(<RecoveryPanel signals={signals} trigger={detectRecoveryTriggers(signals)} onClose={firstClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Keep plan" }));
    expect(firstClose).toHaveBeenCalledOnce();
    expect(useStore.getState().recoveryPlans).toHaveLength(0);
    first.unmount();

    render(<RecoveryPanel signals={signals} trigger={detectRecoveryTriggers(signals)} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss for today" }));
    expect(useStore.getState().recoveryPlans[0]).toMatchObject({ status: "deferred", dayKey: "2026-07-12" });
  });

  it("restores the original view by dismissing only the accepted preview", () => {
    const first = render(<RecoveryPanel signals={signals} trigger={detectRecoveryTriggers(signals)} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /^Reduce load$/ }));
    first.unmount();

    render(<RecoveryPanel signals={signals} trigger={detectRecoveryTriggers(signals)} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Restore original plan" }));
    expect(useStore.getState().recoveryPlans[0].status).toBe("dismissed");
  });
});

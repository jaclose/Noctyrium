// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { HabitTrackerPage } from "./HabitTrackerPage";
import { useStore } from "../lib/store";

beforeEach(() => {
  cleanup();
  // Reset to a known baseline: flag off, no habits.
  useStore.setState((s) => ({
    profile: { ...s.profile, experimentalFlags: undefined },
    habits: [],
    habitEntries: [],
  }));
});

describe("HabitTrackerPage (render smoke)", () => {
  it("shows the opt-in empty state when the flag is off", () => {
    render(<HabitTrackerPage />);
    expect(screen.getByText(/this is an early feature/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /enable habit tracker/i })).toBeTruthy();
  });

  it("renders the tracker, a created habit, and its check-in controls when enabled", () => {
    useStore.getState().updateProfile({ experimentalFlags: { habits: true } });
    useStore.getState().addHabit({ name: "Morning sunlight", type: "binary" });
    render(<HabitTrackerPage />);
    expect(screen.getByText("Morning sunlight")).toBeTruthy();
    // Non-punitive check-in options must all be present.
    for (const label of ["Done", "Partial", "Skipped", "Missed"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DASHBOARD_WIDGETS, makeSeed } from "../lib/seed";
import { useStore } from "../lib/store";
import { DashboardPage } from "./DashboardPage";

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    disconnect() {}
    unobserve() {}
  });
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  const seed = makeSeed();
  seed.profile.hiddenDashboardWidgets = DEFAULT_DASHBOARD_WIDGETS.filter((id) => id !== "todayScore");
  seed.profile.dashboardWidgetOrder = [...DEFAULT_DASHBOARD_WIDGETS];
  seed.profile.dailySuccess = { version: 1, configuredAt: seed.activeDayKey, requirements: [] };
  useStore.setState(seed);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("DashboardPage declutter", () => {
  it("removes primary diagnostics and the duplicated five-card stat row", () => {
    const { container } = render(<DashboardPage />);
    expect(screen.getByText("Today's requirements")).toBeTruthy();
    expect(screen.getByText("No requirements selected")).toBeTruthy();
    expect(screen.queryByText(/Schema 32/)).toBeNull();
    expect(screen.queryByText(/Version v/)).toBeNull();
    expect(screen.queryByText(/active map nodes/)).toBeNull();
    expect(container.querySelector(".dashboard-stat-row")).toBeNull();
  });

  it("preserves returning-user widget order and hidden data on render", () => {
    const beforeOrder = [...(useStore.getState().profile.dashboardWidgetOrder ?? [])];
    const beforeHidden = [...(useStore.getState().profile.hiddenDashboardWidgets ?? [])];
    render(<DashboardPage />);
    expect(useStore.getState().profile.dashboardWidgetOrder).toEqual(beforeOrder);
    expect(useStore.getState().profile.hiddenDashboardWidgets).toEqual(beforeHidden);
    expect(useStore.getState().tracker.length).toBeGreaterThan(0);
  });
});

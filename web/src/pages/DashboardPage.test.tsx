// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DASHBOARD_WIDGETS, DEFAULT_HIDDEN_DASHBOARD_WIDGETS, makeSeed } from "../lib/seed";
import { useStore } from "../lib/store";
import { DashboardPage } from "./DashboardPage";
import { STORAGE_KEYS } from "../lib/brand";
import { AXOM_QUOTES } from "../data/quotes";

const localValues = new Map<string, string>();
const memoryLocalStorage = {
  get length() { return localValues.size; },
  clear: () => localValues.clear(),
  getItem: (key: string) => localValues.get(key) ?? null,
  key: (index: number) => [...localValues.keys()][index] ?? null,
  removeItem: (key: string) => { localValues.delete(key); },
  setItem: (key: string, value: string) => { localValues.set(key, String(value)); },
};

beforeEach(() => {
  localValues.clear();
  vi.stubGlobal("localStorage", memoryLocalStorage);
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
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
  it("renders a stable, non-guilt quote with honest attribution and user-controlled actions", () => {
    render(<DashboardPage />);
    const region = screen.getByRole("region", { name: "Daily quote" });
    const firstText = region.querySelector("blockquote")?.textContent ?? "";
    const source = AXOM_QUOTES.find((quote) => firstText.includes(quote.text));
    expect(source).toBeTruthy();
    expect(source?.guilt).toBe(false);
    expect(withinRegion(region, source!.author)).toBeTruthy();
    expect(screen.getByText(attributionText(source!.attributionStatus))).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next quote" }));
    expect(region.querySelector("blockquote")?.textContent).not.toBe(firstText);
    fireEvent.click(screen.getByRole("button", { name: "Favorite quote" }));
    expect(screen.getByRole("button", { name: "Remove favorite quote" }).getAttribute("aria-pressed")).toBe("true");
    expect(localStorage.getItem(STORAGE_KEYS.quotePreferences)).toContain("favoriteQuoteIds");

    const beforeHide = region.querySelector("blockquote")?.textContent;
    fireEvent.click(screen.getByRole("button", { name: "Hide this quote" }));
    expect(region.querySelector("blockquote")?.textContent).not.toBe(beforeHide);
  });

  it("keeps guilt/shame off by default and exposes bounded quote preferences", () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: "Quote settings" }));
    expect((screen.getByLabelText("Include guilt/shame category") as HTMLInputElement).checked).toBe(false);
    fireEvent.click(screen.getByLabelText("Show daily quote"));
    expect(screen.getByText("Daily quote hidden")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show quote" }));
    expect(screen.getByRole("region", { name: "Daily quote" }).querySelector("blockquote")).toBeTruthy();
  });

  it("keeps welcome first and quote second for a clean 390px structural stack", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    const { container } = render(<DashboardPage />);
    const welcome = container.querySelector(".alpha-build-copy")!;
    const quote = container.querySelector(".dashboard-quote")!;
    expect(welcome.compareDocumentPosition(quote) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText("Welcome, JD", { exact: true })).toBeNull();
  });

  it("hides both suggestion widgets in focused defaults without invalidating explicit preferences", () => {
    expect(DEFAULT_HIDDEN_DASHBOARD_WIDGETS).toEqual(expect.arrayContaining(["suggested", "aiActions"]));
    useStore.getState().updateProfile({ hiddenDashboardWidgets: ["aiActions"] });
    render(<DashboardPage />);
    expect(useStore.getState().profile.hiddenDashboardWidgets).toEqual(["aiActions"]);
  });

  it("never infers JD and lets a nameless user add an explicit name", () => {
    useStore.getState().updateProfile({ name: "AXOM" });
    render(<DashboardPage />);

    expect(screen.getByText("Welcome", { exact: true })).toBeTruthy();
    expect(screen.queryByText("Welcome, JD", { exact: true })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add your name" }));
    const input = screen.getByLabelText("Display name") as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "Ada" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Welcome, Ada", { exact: true })).toBeTruthy();
    expect(useStore.getState().profile.name).toBe("Ada");
  });

  it("preserves an explicitly stored user named JD", () => {
    useStore.getState().updateProfile({ name: "JD" });
    render(<DashboardPage />);

    expect(screen.getByText("Welcome, JD", { exact: true })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add your name" })).toBeNull();
  });

  it("cancels name editing without creating a placeholder identity", () => {
    useStore.getState().updateProfile({ name: "" });
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: "Add your name" }));
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Temporary" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(useStore.getState().profile.name).toBe("");
    expect(screen.getByText("Welcome", { exact: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add your name" })).toBeTruthy();
  });

  it("removes primary diagnostics and the duplicated five-card stat row", () => {
    const { container } = render(<DashboardPage />);
    expect(screen.getByText("Today's targets")).toBeTruthy();
    expect(screen.getByText("No targets selected")).toBeTruthy();
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

function withinRegion(region: HTMLElement, text: string) {
  return [...region.querySelectorAll("span")].find((element) => element.textContent === text);
}

function attributionText(status: (typeof AXOM_QUOTES)[number]["attributionStatus"]) {
  if (status === "axom-original") return "AXOM original";
  if (status === "commonly-attributed") return "Commonly attributed";
  if (status === "paraphrased") return "Paraphrased";
  if (status === "verified") return "Verified";
  return "Attribution unverified";
}

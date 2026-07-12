// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeSeed, SCHEMA_VERSION } from "../../lib/seed";
import { useStore } from "../../lib/store";
import { SettingsModal } from "./SettingsModal";

const storageValues = new Map<string, string>();
const storage = {
  get length() { return storageValues.size; },
  clear: () => storageValues.clear(),
  getItem: (key: string) => storageValues.get(key) ?? null,
  key: (index: number) => [...storageValues.keys()][index] ?? null,
  removeItem: (key: string) => { storageValues.delete(key); },
  setItem: (key: string, value: string) => { storageValues.set(key, String(value)); },
};

beforeEach(() => {
  vi.stubGlobal("localStorage", storage);
  localStorage.clear();
  useStore.setState(makeSeed());
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
    matches: false,
    media: "",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Settings information architecture", () => {
  it("uses five accessible sections with only the active tab owning its mounted panel", async () => {
    const user = userEvent.setup();
    render(<SettingsModal onClose={() => {}} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      "Profile", "Data", "Backup", "Personalization", "Advanced",
    ]);
    for (const tab of tabs) {
      const controls = tab.getAttribute("aria-controls");
      if (controls) expect(document.getElementById(controls)).toBeTruthy();
    }
    expect(screen.getByRole("tab", { name: "Profile" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Data" }).hasAttribute("aria-controls")).toBe(false);

    await user.click(screen.getByRole("tab", { name: "Data" }));
    const dataTab = screen.getByRole("tab", { name: "Data" });
    expect(document.getElementById(dataTab.getAttribute("aria-controls")!)).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Profile" }).hasAttribute("aria-controls")).toBe(false);

    fireEvent.keyDown(dataTab, { key: "End" });
    expect(screen.getByRole("tab", { name: "Advanced" }).getAttribute("aria-selected")).toBe("true");
  });

  it("states accurate local-first semantics without promising a cloud account", async () => {
    const user = userEvent.setup();
    render(<SettingsModal onClose={() => {}} initialTab="data" />);
    expect(screen.getByText(/workspace is stored on this device/i)).toBeTruthy();
    expect(screen.getByText(/not automatically synced to an account or uploaded to the cloud/i)).toBeTruthy();
    expect(screen.queryByText(/your account is synced/i)).toBeNull();
    expect(screen.queryByText(/workspace follows you across devices/i)).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Personalization" }));
    expect(screen.getByText("Theme", { selector: ".sync-title" })).toBeTruthy();
  });

  it("presents portable backup actions once and keeps technical details in Advanced", async () => {
    const user = userEvent.setup();
    render(<SettingsModal onClose={() => {}} initialTab="backup" />);
    expect(screen.getAllByRole("button", { name: /export backup/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /import \/ restore/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /merge backup/i })).toHaveLength(1);
    expect(screen.getAllByText(/automatic local recovery snapshots/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("tab", { name: "Advanced" }));
    expect(screen.getByDisplayValue(`v${SCHEMA_VERSION}`)).toBeTruthy();
    expect(screen.getByText(/AI and provider settings \(optional\)/i)).toBeTruthy();
    expect(screen.queryByText(/Cloud copy/i)).toBeNull();
  });

  it("keeps destructive reset confirmation-gated", async () => {
    const user = userEvent.setup();
    const reset = vi.spyOn(useStore.getState(), "resetToSeed");
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<SettingsModal onClose={() => {}} initialTab="advanced" />);
    await user.click(screen.getByRole("button", { name: /reset to starter data/i }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(reset).not.toHaveBeenCalled();
  });
});

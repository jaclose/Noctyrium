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

  it("keeps Daily Games disabled by default and preserves history across enable and disable", async () => {
    const user = userEvent.setup();
    useStore.setState({
      dailyWordPuzzles: [{
        puzzleId: "daily-word:general-1:2026-07-12",
        puzzleDate: "2026-07-12",
        timezone: "America/Grenada",
        wordListVersion: "general-1",
        guesses: ["APPLE"],
        completed: false,
        won: false,
        startedAt: "2026-07-12T10:00:00.000Z",
        updatedAt: "2026-07-12T10:01:00.000Z",
      }],
    });
    render(<SettingsModal onClose={() => {}} initialTab="personalization" />);

    const toggle = screen.getByRole("checkbox", { name: "Enable Daily Games" });
    expect((toggle as HTMLInputElement).checked).toBe(false);
    expect(useStore.getState().profile.experimentalFlags?.dailyGames).toBe(false);

    await user.click(toggle);
    expect((toggle as HTMLInputElement).checked).toBe(true);
    expect(useStore.getState().profile.experimentalFlags?.dailyGames).toBe(true);
    expect(useStore.getState().dailyWordPuzzles).toHaveLength(1);

    await user.click(toggle);
    expect((toggle as HTMLInputElement).checked).toBe(false);
    expect(useStore.getState().profile.experimentalFlags?.dailyGames).toBe(false);
    expect(useStore.getState().dailyWordPuzzles).toHaveLength(1);
  });

  it("persists clock controls and rejects an invalid custom timezone without replacing the last valid value", async () => {
    const user = userEvent.setup();
    useStore.setState((state) => ({
      profile: {
        ...state.profile,
        timeZonePreference: { mode: "custom", customTimezone: "America/Grenada" },
      },
    }));
    render(<SettingsModal onClose={() => {}} initialTab="personalization" />);

    await user.click(screen.getByRole("checkbox", { name: "Digital seconds" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Hour cycle" }), "24");
    await user.click(screen.getByRole("checkbox", { name: "Show clock" }));
    expect(useStore.getState().profile.clockPreferences).toMatchObject({
      enabled: false,
      showDigitalSeconds: true,
      hourCycle: "24",
    });

    const input = screen.getByRole("textbox", { name: "Custom timezone" });
    await user.clear(input);
    await user.type(input, "Mars/Olympus");
    await user.click(screen.getByRole("button", { name: "Apply timezone" }));
    expect(screen.getByRole("alert").textContent).toMatch(/valid IANA timezone/i);
    expect(useStore.getState().profile.timeZonePreference).toEqual({
      mode: "custom",
      customTimezone: "America/Grenada",
    });

    await user.clear(input);
    await user.type(input, "America/New_York");
    await user.click(screen.getByRole("button", { name: "Apply timezone" }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(useStore.getState().profile.timeZonePreference).toEqual({
      mode: "custom",
      customTimezone: "America/New_York",
    });
  });

  it("shows canonical daily-loop reminder defaults and persists personalized times and enablement", async () => {
    const user = userEvent.setup();
    useStore.setState((state) => ({
      profile: { ...state.profile, dailyLoopReminders: undefined },
    }));
    render(<SettingsModal onClose={() => {}} initialTab="personalization" />);

    const checkInToggle = screen.getByRole("checkbox", { name: "Enable Daily Check-In" });
    const closeoutToggle = screen.getByRole("checkbox", { name: "Enable evening closeout" });
    const checkInTime = screen.getByLabelText("Daily Check-In time") as HTMLInputElement;
    const closeoutTime = screen.getByLabelText("Evening closeout time") as HTMLInputElement;
    const quietHoursToggle = screen.getByRole("checkbox", { name: "Enable quiet hours" });
    const quietHoursStart = screen.getByLabelText("Quiet hours start") as HTMLInputElement;
    const quietHoursEnd = screen.getByLabelText("Quiet hours end") as HTMLInputElement;

    expect((checkInToggle as HTMLInputElement).checked).toBe(true);
    expect((closeoutToggle as HTMLInputElement).checked).toBe(true);
    expect(checkInTime.value).toBe("08:00");
    expect(closeoutTime.value).toBe("20:30");
    expect((quietHoursToggle as HTMLInputElement).checked).toBe(false);
    expect(quietHoursStart.value).toBe("22:00");
    expect(quietHoursEnd.value).toBe("07:00");
    expect(quietHoursStart.disabled).toBe(true);
    expect(quietHoursEnd.disabled).toBe(true);
    expect(screen.getByText(/optional in-app prompts use this device's local time.*at most once per day/i)).toBeTruthy();

    fireEvent.change(checkInTime, { target: { value: "07:15" } });
    fireEvent.change(closeoutTime, { target: { value: "21:45" } });
    await user.click(quietHoursToggle);
    fireEvent.change(quietHoursStart, { target: { value: "23:15" } });
    fireEvent.change(quietHoursEnd, { target: { value: "06:30" } });
    await user.click(checkInToggle);
    await user.click(closeoutToggle);

    expect(useStore.getState().profile.dailyLoopReminders).toEqual({
      checkInEnabled: false,
      checkInTime: "07:15",
      closeoutEnabled: false,
      closeoutTime: "21:45",
      quietHoursEnabled: true,
      quietHoursStart: "23:15",
      quietHoursEnd: "06:30",
    });
    expect(checkInTime.disabled).toBe(true);
    expect(closeoutTime.disabled).toBe(true);
  });

  it("normalizes malformed persisted reminder preferences before editing", () => {
    useStore.setState((state) => ({
      profile: {
        ...state.profile,
        dailyLoopReminders: {
          checkInEnabled: false,
          checkInTime: "99:99",
          closeoutTime: "not-a-time",
          quietHoursEnabled: true,
          quietHoursStart: "25:00",
          quietHoursEnd: "sunrise",
        },
      },
    }));
    render(<SettingsModal onClose={() => {}} initialTab="personalization" />);

    expect((screen.getByRole("checkbox", { name: "Enable Daily Check-In" }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("checkbox", { name: "Enable evening closeout" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("Daily Check-In time") as HTMLInputElement).value).toBe("08:00");
    expect((screen.getByLabelText("Evening closeout time") as HTMLInputElement).value).toBe("20:30");
    expect((screen.getByRole("checkbox", { name: "Enable quiet hours" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("Quiet hours start") as HTMLInputElement).value).toBe("22:00");
    expect((screen.getByLabelText("Quiet hours end") as HTMLInputElement).value).toBe("07:00");
  });

  it("confirmation-gates the scoped Daily Word reset without changing enablement or unrelated data", async () => {
    const user = userEvent.setup();
    useStore.setState((state) => ({
      profile: {
        ...state.profile,
        experimentalFlags: { ...state.profile.experimentalFlags, dailyGames: true },
      },
      dailyWordPuzzles: [{
        puzzleId: "daily-word:general-1:2026-07-12",
        puzzleDate: "2026-07-12",
        timezone: "America/Grenada",
        wordListVersion: "general-1",
        guesses: ["APPLE"],
        completed: false,
        won: false,
        startedAt: "2026-07-12T10:00:00.000Z",
        updatedAt: "2026-07-12T10:01:00.000Z",
      }],
    }));
    const tasks = structuredClone(useStore.getState().tasks);
    const confirm = vi.spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    render(<SettingsModal onClose={() => {}} initialTab="personalization" />);

    const reset = screen.getByRole("button", { name: "Reset Daily Word" });
    await user.click(reset);
    expect(useStore.getState().dailyWordPuzzles).toHaveLength(1);

    await user.click(reset);
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(useStore.getState().dailyWordPuzzles).toEqual([]);
    expect(useStore.getState().profile.experimentalFlags?.dailyGames).toBe(true);
    expect(useStore.getState().tasks).toEqual(tasks);
  });
});

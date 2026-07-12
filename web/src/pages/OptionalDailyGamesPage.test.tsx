// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { makeSeed } from "../lib/seed";
import { useStore } from "../lib/store";

beforeEach(() => {
  const seed = makeSeed();
  useStore.setState({
    ...seed,
    profile: {
      ...seed.profile,
      onboarded: true,
      tourDone: true,
      experimentalFlags: { ...seed.profile.experimentalFlags, dailyGames: false },
    },
  });
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
    matches: true,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
});

afterEach(() => {
  cleanup();
  window.location.hash = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("optional Daily Games route gate", () => {
  it("keeps the Daily Word engine gated until its real Enable action is used", async () => {
    window.location.hash = "#daily-word";
    render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Daily Games is currently disabled" })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1, name: "AXOM Daily Word" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Enable Daily Games" }));
    expect(await screen.findByRole("heading", { level: 1, name: "AXOM Daily Word" })).toBeTruthy();
    expect(useStore.getState().profile.experimentalFlags?.dailyGames).toBe(true);
  });

  it("does not reveal the Doctordle WIP route while the module is disabled", async () => {
    window.location.hash = "#doctordle";
    render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Daily Games is currently disabled" })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1, name: "Doctordle" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Enable Daily Games" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Doctordle" })).toBeTruthy();
    expect(screen.getAllByText("Integration pending collaboration approval.").length).toBeGreaterThanOrEqual(1);
  });
});

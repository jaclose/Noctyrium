// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { makeSeed } from "./lib/seed";
import { useStore } from "./lib/store";

beforeEach(() => {
  const seed = makeSeed();
  seed.profile.onboarded = true;
  seed.profile.tourDone = false;
  seed.profile.promise = undefined;
  seed.profile.promisePromptStatus = undefined;
  useStore.setState(seed);
  window.location.hash = "dashboard";
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} unobserve() {} });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} unobserve() {} });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("post-global-guide promise flow", () => {
  it("offers after the global guide is skipped and persists Review later", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Skip guided tour" }));
    expect(screen.getByRole("dialog", { name: "One optional promise" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Review later" }));
    expect(useStore.getState().profile.promisePromptStatus).toMatchObject({ state: "deferred", promptVersion: "promise-prompt-v1" });
  });

  it("does not offer after global exit when already signed", () => {
    useStore.setState((state) => ({
      profile: { ...state.profile, promise: { signedName: "Ada", signedAt: "2026-07-12T12:00:00.000Z" } },
    }));
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Skip guided tour" }));
    expect(screen.queryByRole("dialog", { name: "One optional promise" })).toBeNull();
  });

  it("opens the signing flow and versions Skip for now", () => {
    const first = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Skip guided tour" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign now" }));
    expect(screen.getByRole("dialog", { name: "Promise of Use" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(useStore.getState().profile.promisePromptStatus?.state).toBe("deferred");
    first.unmount();

    const seed = makeSeed();
    seed.profile.onboarded = true;
    seed.profile.tourDone = false;
    useStore.setState(seed);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Skip guided tour" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(useStore.getState().profile.promisePromptStatus).toMatchObject({ state: "skipped", promptVersion: "promise-prompt-v1" });
  });

  it("marks Escape as tour exit without opening the promise prompt", () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(useStore.getState().profile.tourDone).toBe(true);
    expect(screen.queryByRole("dialog", { name: "One optional promise" })).toBeNull();
  });
});

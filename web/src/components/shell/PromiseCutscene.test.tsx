// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeSeed } from "../../lib/seed";
import { useStore } from "../../lib/store";
import { PromiseCutscene } from "./PromiseCutscene";

beforeEach(() => {
  useStore.setState(makeSeed());
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal("scrollTo", vi.fn());
  Element.prototype.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PromiseCutscene", () => {
  it("skips the timed reveal for reduced motion and lets Escape defer", () => {
    const onDone = vi.fn();
    render(<PromiseCutscene onDone={onDone} />);
    expect(screen.getByRole("dialog", { name: "A promise to yourself" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "AXOM" })).toBeTruthy();
    expect(screen.getByText("This is not a legal contract.", { exact: false })).toBeTruthy();
    const name = screen.getByLabelText("Sign your name");
    const later = screen.getByRole("button", { name: "Maybe later" });
    later.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(name);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("preserves signing data and clears its completion timer on unmount", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    const view = render(<PromiseCutscene onDone={onDone} />);
    fireEvent.change(screen.getByLabelText("Sign your name"), { target: { value: "Ada" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "I make this promise to myself." }));
    fireEvent.click(screen.getByRole("button", { name: "Sign the promise" }));
    expect(useStore.getState().profile.promise?.signedName).toBe("Ada");
    expect(useStore.getState().profile.promise?.promiseTextVersion).toBe("promise-of-use-v1");
    expect(useStore.getState().journal.at(-1)?.rating).toBe("Promise");
    expect(screen.getByLabelText("Signed by Ada").querySelector("svg path")).toBeTruthy();
    expect(screen.queryByText(/Contract signed/)).toBeNull();
    view.unmount();
    vi.runAllTimers();
    expect(onDone).not.toHaveBeenCalled();
  });
});

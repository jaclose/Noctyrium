// @vitest-environment jsdom
import { createRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import App from "../../App";
import { useStore } from "../../lib/store";

beforeEach(() => {
  window.location.hash = "#dashboard";
  useStore.setState((state) => ({
    profile: { ...state.profile, onboarded: true, tourDone: true },
  }));
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(max-width: 880px)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  Object.defineProperty(window, "requestAnimationFrame", {
    configurable: true,
    writable: true,
    value: (callback: FrameRequestCallback) => { callback(0); return 1; },
  });
  Object.defineProperty(window, "cancelAnimationFrame", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("mobile sidebar accessibility", () => {
  it("makes the offscreen drawer inert, then exposes and focuses it when opened", () => {
    const onClose = vi.fn();
    const props = {
      active: "dashboard",
      onSelect: vi.fn(),
      onOpenSettings: vi.fn(),
      onClose,
    };
    const { container, rerender } = render(<Sidebar {...props} collapsed={false} />);
    const sidebar = container.querySelector<HTMLElement>("#app-sidebar")!;

    expect(sidebar.getAttribute("aria-hidden")).toBe("true");
    expect(sidebar.hasAttribute("inert")).toBe(true);

    rerender(<Sidebar {...props} collapsed />);
    expect(sidebar.hasAttribute("aria-hidden")).toBe(false);
    expect(sidebar.hasAttribute("inert")).toBe(false);
    expect(document.activeElement).toBe(sidebar);

    fireEvent.click(screen.getByRole("button", { name: "Close navigation menu" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("connects the menu trigger to the drawer and reports expanded state", () => {
    const menuButtonRef = createRef<HTMLButtonElement>();
    const onMenu = vi.fn();
    const { rerender } = render(
      <TopBar
        title="Dashboard"
        subtitle="Overview"
        onMenu={onMenu}
        menuButtonRef={menuButtonRef}
        drawerOpen={false}
        onRefresh={() => {}}
        refreshing={false}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Open navigation menu" });
    expect(trigger.getAttribute("aria-controls")).toBe("app-sidebar");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(menuButtonRef.current).toBe(trigger);
    fireEvent.click(trigger);
    expect(onMenu).toHaveBeenCalledOnce();

    rerender(
      <TopBar
        title="Dashboard"
        subtitle="Overview"
        onMenu={onMenu}
        menuButtonRef={menuButtonRef}
        drawerOpen
        onRefresh={() => {}}
        refreshing={false}
      />,
    );
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("closes on Escape and restores focus to the menu trigger", () => {
    render(<App />);
    const trigger = screen.getByRole("button", { name: "Open navigation menu" });

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: "Close navigation menu" })).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: "Close navigation menu" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../../lib/brand";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
      clear: () => values.clear(),
    });
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    document.head.innerHTML = '<meta name="theme-color" content="#0d0d0e">';
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("exposes a native radio group and persists the selected preference", () => {
    render(<ThemeToggle />);
    const light = screen.getByRole<HTMLInputElement>("radio", { name: /Light/ });
    const dark = screen.getByRole<HTMLInputElement>("radio", { name: /Dark/ });
    const system = screen.getByRole<HTMLInputElement>("radio", { name: /System/ });

    expect(system.checked).toBe(true);
    expect(light.checked).toBe(false);
    expect(dark.checked).toBe(false);

    fireEvent.click(dark);
    expect(dark.checked).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.themePreference)).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.themePreference).toBe("dark");
  });
});

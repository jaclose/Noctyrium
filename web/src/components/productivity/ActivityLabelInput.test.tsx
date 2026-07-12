// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ACTIVITY_PLACEHOLDERS, ActivityLabelInput } from "./ActivityLabelInput";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ActivityLabelInput", () => {
  it("cycles examples only while empty and unfocused", () => {
    vi.useFakeTimers();
    const { rerender } = render(<ActivityLabelInput value="" onChange={() => undefined} />);
    const input = screen.getByLabelText("Activity") as HTMLInputElement;
    expect(input.placeholder).toBe(ACTIVITY_PLACEHOLDERS[0]);
    act(() => vi.advanceTimersByTime(3200));
    expect(input.placeholder).toBe(ACTIVITY_PLACEHOLDERS[1]);
    fireEvent.focus(input);
    act(() => vi.advanceTimersByTime(6400));
    expect(input.placeholder).toBe(ACTIVITY_PLACEHOLDERS[1]);
    fireEvent.blur(input);
    rerender(<ActivityLabelInput value="Reading" onChange={() => undefined} />);
    act(() => vi.advanceTimersByTime(6400));
    expect(input.placeholder).toBe(ACTIVITY_PLACEHOLDERS[1]);
  });

  it("uses a static example for reduced-motion users", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    render(<ActivityLabelInput value="" onChange={() => undefined} />);
    const input = screen.getByLabelText("Activity") as HTMLInputElement;
    act(() => vi.advanceTimersByTime(9600));
    expect(input.placeholder).toBe(ACTIVITY_PLACEHOLDERS[0]);
  });
});

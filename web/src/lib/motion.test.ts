// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  clamp01,
  pct,
  resolveDuration,
  scrollProgressFor,
  motionLevel,
  prefersReducedMotion,
  useReducedMotion,
  MOTION_TOKENS,
} from "./motion";

function stubMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("clamp01", () => {
  it("clamps into the 0..1 range", () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(5)).toBe(1);
  });
  it("treats non-finite input as 0", () => {
    expect(clamp01(NaN)).toBe(0);
    expect(clamp01(Infinity)).toBe(0);
    expect(clamp01(-Infinity)).toBe(0);
  });
});

describe("pct", () => {
  it("computes a clamped percent", () => {
    expect(pct(30, 60)).toBe(50);
    expect(pct(90, 60)).toBe(100);
    expect(pct(0, 60)).toBe(0);
  });
  it("returns 0 for non-positive max or bad input", () => {
    expect(pct(10, 0)).toBe(0);
    expect(pct(10, -5)).toBe(0);
    expect(pct(NaN, 60)).toBe(0);
  });
});

describe("resolveDuration", () => {
  it("passes through when motion is allowed", () => {
    expect(resolveDuration(520, false)).toBe(520);
  });
  it("collapses to 0 under reduced motion", () => {
    expect(resolveDuration(520, true)).toBe(0);
  });
  it("never returns negative", () => {
    expect(resolveDuration(-100, false)).toBe(0);
  });
});

describe("scrollProgressFor", () => {
  it("is ~0 when the element is at the bottom of the viewport", () => {
    expect(scrollProgressFor({ top: 800, height: 200 }, 800)).toBe(0);
  });
  it("is ~1 when the element has scrolled past the top", () => {
    expect(scrollProgressFor({ top: -200, height: 200 }, 800)).toBe(1);
  });
  it("is between 0 and 1 mid-scroll", () => {
    const p = scrollProgressFor({ top: 400, height: 200 }, 800);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });
  it("returns 0 for a zero-height viewport", () => {
    expect(scrollProgressFor({ top: 0, height: 100 }, 0)).toBe(0);
  });
});

describe("motionLevel + tokens", () => {
  it("maps the reduced flag to a level", () => {
    expect(motionLevel(true)).toBe("reduced");
    expect(motionLevel(false)).toBe("full");
  });
  it("exposes stable duration + easing tokens", () => {
    expect(MOTION_TOKENS.durationSlow).toBeGreaterThan(MOTION_TOKENS.durationFast);
    expect(MOTION_TOKENS.easeOut).toContain("cubic-bezier");
  });
});

describe("prefersReducedMotion / useReducedMotion", () => {
  it("reflects the matchMedia result", () => {
    stubMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
    stubMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("useReducedMotion returns the current preference", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("useReducedMotion is false when reduce is not requested", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});

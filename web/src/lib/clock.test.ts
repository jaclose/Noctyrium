import { describe, expect, it, vi } from "vitest";
import {
  analogClockAngles,
  canonicalTimeZone,
  clockPrecision,
  createClockTicker,
  formatClockDate,
  formatClockTime,
  getZonedTimeParts,
  millisecondsUntilBoundary,
  normalizeClockPreferences,
  normalizeTimeZonePreference,
  resolveTimeZone,
} from "./clock";
import { DEFAULT_CLOCK_PREFERENCES } from "./seed";

describe("clock preferences and IANA formatting", () => {
  it("canonicalizes valid IANA zones and rejects invalid custom values", () => {
    expect(canonicalTimeZone(" America/Grenada ")).toBe("America/Grenada");
    expect(canonicalTimeZone("Not/A_Timezone")).toBeUndefined();
    expect(normalizeTimeZonePreference({ mode: "custom", customTimezone: "America/Grenada" })).toEqual({
      mode: "custom",
      customTimezone: "America/Grenada",
    });
    expect(normalizeTimeZonePreference({ mode: "custom", customTimezone: "Mars/Olympus" })).toEqual({
      mode: "system",
    });
    expect(resolveTimeZone({ mode: "system" }, "America/New_York")).toBe("America/New_York");
  });

  it("fills safe defaults without accepting malformed preference values", () => {
    expect(normalizeClockPreferences({ enabled: false, hourCycle: "24", showDate: true })).toEqual({
      ...DEFAULT_CLOCK_PREFERENCES,
      enabled: false,
      hourCycle: "24",
      showDate: true,
    });
    expect(normalizeClockPreferences({ enabled: "yes", hourCycle: "13" })).toEqual(DEFAULT_CLOCK_PREFERENCES);
  });

  it("formats fixed-offset Grenada time, 12/24-hour output, date, and seconds through Intl", () => {
    const date = new Date("2026-07-12T14:05:06.000Z");
    expect(formatClockTime(date, "America/Grenada", {
      hourCycle: "12",
      showDigitalSeconds: false,
    }, "en-US")).toBe("10:05 AM");
    expect(formatClockTime(date, "America/Grenada", {
      hourCycle: "24",
      showDigitalSeconds: true,
    }, "en-US")).toBe("10:05:06");
    expect(formatClockDate(date, "America/Grenada", "en-US")).toBe("Sun, Jul 12, 2026");
  });

  it("uses timezone database transitions instead of manual offset arithmetic", () => {
    const before = getZonedTimeParts(new Date("2026-03-08T06:59:30.000Z"), "America/New_York");
    const after = getZonedTimeParts(new Date("2026-03-08T07:00:30.000Z"), "America/New_York");
    expect(before).toMatchObject({ hour: 1, minute: 59, second: 30 });
    expect(after).toMatchObject({ hour: 3, minute: 0, second: 30 });
  });
});

describe("analog angles and precision", () => {
  it("calculates hour, minute, and second angles with optional interpolation", () => {
    const parts = { hour: 3, minute: 15, second: 30, millisecond: 0 };
    expect(analogClockAngles(parts)).toEqual({ hour: 97.75, minute: 93, second: 180 });
    expect(analogClockAngles(parts, false)).toEqual({ hour: 97.5, minute: 90, second: 180 });
  });

  it("selects second precision only while a visible feature needs it", () => {
    expect(clockPrecision({ showDigitalSeconds: false, showAnalogSeconds: true }, false)).toBe("minute");
    expect(clockPrecision({ showDigitalSeconds: false, showAnalogSeconds: true }, true)).toBe("second");
    expect(clockPrecision({ showDigitalSeconds: true, showAnalogSeconds: false }, false)).toBe("second");
    expect(millisecondsUntilBoundary(Date.UTC(2026, 0, 1, 12, 34, 45, 250), "minute")).toBe(14_750);
    expect(millisecondsUntilBoundary(Date.UTC(2026, 0, 1, 12, 34, 45, 250), "second")).toBe(750);
  });
});

describe("aligned external clock ticker", () => {
  it("shares one aligned timer and reconciles focus, visibility, pageshow, and sleep", () => {
    let now = Date.UTC(2026, 0, 1, 12, 34, 45, 250);
    let id = 0;
    const timers = new Map<number, { callback: () => void; delay: number }>();
    const windowTarget = new EventTarget();
    const documentTarget = Object.assign(new EventTarget(), { hidden: false });
    const setTimeout = vi.fn((callback: () => void, delay: number) => {
      const timerId = ++id;
      timers.set(timerId, { callback, delay });
      return timerId;
    });
    const clearTimeout = vi.fn((timerId: number) => { timers.delete(timerId); });
    const ticker = createClockTicker({
      now: () => now,
      setTimeout,
      clearTimeout,
      windowTarget,
      documentTarget,
    });
    const minuteListener = vi.fn();
    const secondListener = vi.fn();

    const unsubscribeMinute = ticker.subscribe(minuteListener, "minute");
    expect([...timers.values()]).toHaveLength(1);
    expect([...timers.values()][0].delay).toBe(14_750);

    const unsubscribeSecond = ticker.subscribe(secondListener, "second");
    expect([...timers.values()]).toHaveLength(1);
    expect([...timers.values()][0].delay).toBe(750);

    now += 5 * 60_000; // browser slept; no interval bookkeeping is trusted
    windowTarget.dispatchEvent(new Event("focus"));
    expect(ticker.getSnapshot()).toBe(now);
    expect(minuteListener).toHaveBeenCalled();
    expect(secondListener).toHaveBeenCalled();

    documentTarget.hidden = true;
    now += 1000;
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    expect(ticker.getSnapshot()).toBe(now - 1000);
    documentTarget.hidden = false;
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    expect(ticker.getSnapshot()).toBe(now);

    now += 1000;
    windowTarget.dispatchEvent(new Event("pageshow"));
    expect(ticker.getSnapshot()).toBe(now);

    unsubscribeSecond();
    expect([...timers.values()]).toHaveLength(1);
    expect([...timers.values()][0].delay).toBeLessThanOrEqual(60_000);
    unsubscribeMinute();
    expect(timers.size).toBe(0);

    const stoppedAt = ticker.getSnapshot();
    now += 60_000;
    windowTarget.dispatchEvent(new Event("focus"));
    expect(ticker.getSnapshot()).toBe(stoppedAt);
  });
});

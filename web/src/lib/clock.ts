import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_CLOCK_PREFERENCES, DEFAULT_TIME_ZONE_PREFERENCE } from "./seed";
import type { ClockPreferences, TimeZonePreference } from "./types";

export type { ClockPreferences, TimeZonePreference } from "./types";

export type ClockPrecision = "minute" | "second";
export type ClockHourCycle = "12" | "24";

export interface ZonedTimeParts {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

export interface AnalogClockAngles {
  hour: number;
  minute: number;
  second: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Return the canonical IANA identifier accepted by this browser. */
export function canonicalTimeZone(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: value.trim() }).resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export function isValidIanaTimeZone(value: unknown): value is string {
  return canonicalTimeZone(value) !== undefined;
}

export function systemTimeZone(): string {
  try {
    return canonicalTimeZone(new Intl.DateTimeFormat().resolvedOptions().timeZone) ?? "UTC";
  } catch {
    return "UTC";
  }
}

export function normalizeTimeZonePreference(value: unknown): TimeZonePreference {
  if (!isRecord(value) || value.mode !== "custom") return { ...DEFAULT_TIME_ZONE_PREFERENCE };
  const customTimezone = canonicalTimeZone(value.customTimezone);
  return customTimezone ? { mode: "custom", customTimezone } : { ...DEFAULT_TIME_ZONE_PREFERENCE };
}

export function resolveTimeZone(
  preference: unknown,
  fallbackSystemTimeZone = systemTimeZone(),
): string {
  const normalized = normalizeTimeZonePreference(preference);
  if (normalized.mode === "custom" && normalized.customTimezone) return normalized.customTimezone;
  return canonicalTimeZone(fallbackSystemTimeZone) ?? "UTC";
}

export function normalizeClockPreferences(value: unknown): ClockPreferences {
  const record = isRecord(value) ? value : {};
  const bool = (key: keyof ClockPreferences) => (
    typeof record[key] === "boolean"
      ? record[key] as boolean
      : DEFAULT_CLOCK_PREFERENCES[key] as boolean
  );
  return {
    enabled: bool("enabled"),
    showDigital: bool("showDigital"),
    showAnalog: bool("showAnalog"),
    showDigitalSeconds: bool("showDigitalSeconds"),
    showAnalogSeconds: bool("showAnalogSeconds"),
    showDate: bool("showDate"),
    showTimezoneLabel: bool("showTimezoneLabel"),
    hourCycle: record.hourCycle === "24" ? "24" : "12",
  };
}

function validDate(date: Date): Date {
  if (!Number.isFinite(date.getTime())) throw new RangeError("Clock date must be valid");
  return date;
}

export function formatClockTime(
  date: Date,
  timeZone: string,
  preferences: Pick<ClockPreferences, "hourCycle" | "showDigitalSeconds">,
  locale?: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: canonicalTimeZone(timeZone) ?? "UTC",
    hour: "numeric",
    minute: "2-digit",
    second: preferences.showDigitalSeconds ? "2-digit" : undefined,
    hourCycle: preferences.hourCycle === "24" ? "h23" : "h12",
  }).format(validDate(date));
}

export function formatClockDate(date: Date, timeZone: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: canonicalTimeZone(timeZone) ?? "UTC",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(validDate(date));
}

/**
 * Extract wall-clock fields through Intl. No UTC-offset math is used, so DST and
 * fixed-offset IANA zones follow the browser's timezone database.
 */
export function getZonedTimeParts(date: Date, timeZone: string): ZonedTimeParts {
  const safeDate = validDate(date);
  const parts = new Intl.DateTimeFormat("en-US-u-nu-latn", {
    timeZone: canonicalTimeZone(timeZone) ?? "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(safeDate);
  const numberPart = (type: Intl.DateTimeFormatPartTypes) => {
    const value = Number(parts.find((part) => part.type === type)?.value ?? 0);
    return Number.isFinite(value) ? value : 0;
  };
  return {
    hour: numberPart("hour"),
    minute: numberPart("minute"),
    second: numberPart("second"),
    millisecond: safeDate.getMilliseconds(),
  };
}

export function analogClockAngles(
  parts: ZonedTimeParts,
  interpolateSeconds = true,
): AnalogClockAngles {
  const hour = Math.max(0, Math.min(23, Math.trunc(parts.hour)));
  const minute = Math.max(0, Math.min(59, Math.trunc(parts.minute)));
  const second = Math.max(0, Math.min(59, Math.trunc(parts.second)));
  const millisecond = Math.max(0, Math.min(999, Math.trunc(parts.millisecond)));
  const preciseSecond = second + (interpolateSeconds ? millisecond / 1000 : 0);
  return {
    hour: (hour % 12) * 30 + minute * 0.5 + (interpolateSeconds ? preciseSecond / 120 : 0),
    minute: minute * 6 + (interpolateSeconds ? preciseSecond * 0.1 : 0),
    second: preciseSecond * 6,
  };
}

export function clockPrecision(
  preferences: Pick<ClockPreferences, "showDigitalSeconds" | "showAnalogSeconds">,
  popoverOpen = false,
): ClockPrecision {
  return preferences.showDigitalSeconds || (popoverOpen && preferences.showAnalogSeconds)
    ? "second"
    : "minute";
}

export function millisecondsUntilBoundary(nowMs: number, precision: ClockPrecision): number {
  const unit = precision === "second" ? 1000 : 60_000;
  if (!Number.isFinite(nowMs)) return unit;
  const remainder = ((Math.floor(nowMs) % unit) + unit) % unit;
  return remainder === 0 ? unit : unit - remainder;
}

type ClockListener = () => void;
type EventListenerTarget = Pick<EventTarget, "addEventListener" | "removeEventListener">;
type VisibilityTarget = EventListenerTarget & Pick<Document, "hidden">;

export interface ClockTickerOptions {
  now?: () => number;
  setTimeout?: (callback: () => void, delay: number) => number;
  clearTimeout?: (id: number) => void;
  windowTarget?: EventListenerTarget;
  documentTarget?: VisibilityTarget;
}

export interface ClockTicker {
  getSnapshot: () => number;
  getServerSnapshot: () => number;
  subscribe: (listener: ClockListener, precision: ClockPrecision) => () => void;
  reconcile: () => void;
}

/**
 * One aligned external clock for every visible clock control. It owns no user
 * data: only subscribers receive wall-clock snapshots, and no tick is persisted.
 */
export function createClockTicker(options: ClockTickerOptions = {}): ClockTicker {
  const readNow = options.now ?? (() => Date.now());
  const scheduleTimeout = options.setTimeout ?? ((callback, delay) => (
    typeof window === "undefined"
      ? globalThis.setTimeout(callback, delay) as unknown as number
      : window.setTimeout(callback, delay)
  ));
  const cancelTimeout = options.clearTimeout ?? ((id) => globalThis.clearTimeout(id));
  const windowTarget = options.windowTarget
    ?? (typeof window === "undefined" ? undefined : window);
  const documentTarget = options.documentTarget
    ?? (typeof document === "undefined" ? undefined : document);
  const listeners = new Map<ClockListener, ClockPrecision>();
  let snapshot = readNow();
  let timer: number | undefined;
  let lifecycleInstalled = false;

  const notify = () => [...listeners.keys()].forEach((listener) => listener());
  const fastestPrecision = (): ClockPrecision => (
    [...listeners.values()].includes("second") ? "second" : "minute"
  );

  const clearScheduled = () => {
    if (timer === undefined) return;
    cancelTimeout(timer);
    timer = undefined;
  };

  const schedule = () => {
    clearScheduled();
    if (!listeners.size) return;
    const delay = millisecondsUntilBoundary(readNow(), fastestPrecision());
    timer = scheduleTimeout(() => {
      timer = undefined;
      snapshot = readNow();
      notify();
      schedule();
    }, delay);
  };

  const reconcile = () => {
    const next = readNow();
    if (next !== snapshot) {
      snapshot = next;
      notify();
    }
    schedule();
  };

  const onVisible = () => {
    if (!documentTarget?.hidden) reconcile();
  };
  const onLifecycle = () => reconcile();

  const installLifecycle = () => {
    if (lifecycleInstalled) return;
    lifecycleInstalled = true;
    windowTarget?.addEventListener("focus", onLifecycle);
    windowTarget?.addEventListener("pageshow", onLifecycle);
    documentTarget?.addEventListener("visibilitychange", onVisible);
  };

  const removeLifecycle = () => {
    if (!lifecycleInstalled) return;
    lifecycleInstalled = false;
    windowTarget?.removeEventListener("focus", onLifecycle);
    windowTarget?.removeEventListener("pageshow", onLifecycle);
    documentTarget?.removeEventListener("visibilitychange", onVisible);
  };

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => snapshot,
    subscribe(listener, precision) {
      listeners.set(listener, precision);
      installLifecycle();
      reconcile();
      return () => {
        listeners.delete(listener);
        if (listeners.size) schedule();
        else {
          clearScheduled();
          removeLifecycle();
        }
      };
    },
    reconcile,
  };
}

export const clockTicker = createClockTicker();

export function useClockNow(
  precision: ClockPrecision,
  ticker: ClockTicker = clockTicker,
): Date {
  const subscribe = useCallback(
    (listener: ClockListener) => ticker.subscribe(listener, precision),
    [precision, ticker],
  );
  const snapshot = useSyncExternalStore(subscribe, ticker.getSnapshot, ticker.getServerSnapshot);
  return new Date(snapshot);
}

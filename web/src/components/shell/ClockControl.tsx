import { Clock3, Settings2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  analogClockAngles,
  clockPrecision,
  formatClockDate,
  formatClockTime,
  getZonedTimeParts,
  normalizeClockPreferences,
  normalizeTimeZonePreference,
  resolveTimeZone,
  useClockNow,
  type ClockPreferences,
  type ClockTicker,
  type TimeZonePreference,
} from "../../lib/clock";
import { useReducedMotion } from "../../lib/motion";
import { ICON_SIZE } from "../../lib/iconSize";

export interface ClockControlProps {
  clockPreferences?: ClockPreferences;
  timeZonePreference?: TimeZonePreference;
  onOpenPreferences: () => void;
  locale?: string;
  /** Test/host injection; production uses the shared singleton ticker. */
  ticker?: ClockTicker;
}

export function ClockControl({
  clockPreferences,
  timeZonePreference,
  onOpenPreferences,
  locale,
  ticker,
}: ClockControlProps) {
  const preferences = normalizeClockPreferences(clockPreferences);
  const timezone = normalizeTimeZonePreference(timeZonePreference);
  if (!preferences.enabled) return null;
  return (
    <LiveClockControl
      preferences={preferences}
      timeZonePreference={timezone}
      onOpenPreferences={onOpenPreferences}
      locale={locale}
      ticker={ticker}
    />
  );
}

function LiveClockControl({
  preferences,
  timeZonePreference,
  onOpenPreferences,
  locale,
  ticker,
}: {
  preferences: ClockPreferences;
  timeZonePreference: TimeZonePreference;
  onOpenPreferences: () => void;
  locale?: string;
  ticker?: ClockTicker;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const now = useClockNow(clockPrecision(preferences, open), ticker);
  const timeZone = resolveTimeZone(timeZonePreference);
  const time = formatClockTime(now, timeZone, preferences, locale);
  const date = formatClockDate(now, timeZone, locale);

  function closeClock(restoreFocus: boolean) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeClock(true);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      closeClock(true);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="clock-control" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="clock-trigger"
        aria-label={`Open clock, ${time}, ${timeZone}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => open ? closeClock(true) : setOpen(true)}
      >
        <Clock3 size={ICON_SIZE.emphasis} aria-hidden="true" />
        {preferences.showDigital && <time dateTime={now.toISOString()}>{time}</time>}
        {preferences.showDate && <span className="clock-trigger-date" aria-hidden="true">{date}</span>}
        {preferences.showTimezoneLabel && <span className="clock-trigger-zone" aria-hidden="true">{timeZone}</span>}
      </button>

      {open && (
        <div
          id={panelId}
          className="clock-popover"
          role="dialog"
          aria-labelledby={titleId}
        >
          <div className="clock-popover-head">
            <div>
              <div id={titleId} className="clock-popover-title">Clock</div>
              <div className="clock-popover-zone">{timeZone}</div>
            </div>
            <button ref={closeRef} type="button" className="clock-icon-button" onClick={() => closeClock(true)} aria-label="Close clock">
              <X size={ICON_SIZE.emphasis} aria-hidden="true" />
            </button>
          </div>

          {preferences.showAnalog && (
            <AnalogClock date={now} timeZone={timeZone} showSeconds={preferences.showAnalogSeconds} />
          )}

          <time
            dateTime={now.toISOString()}
            className={preferences.showDigital ? "clock-popover-time" : "clock-visually-hidden"}
          >
            {time}
          </time>
          {preferences.showDate && <div className="clock-popover-date">{date}</div>}

          <button
            type="button"
            className="clock-preferences-button"
            onClick={() => {
              setOpen(false);
              onOpenPreferences();
            }}
          >
            <Settings2 size={ICON_SIZE.body} aria-hidden="true" /> Clock preferences
          </button>
        </div>
      )}
    </div>
  );
}

export function AnalogClock({
  date,
  timeZone,
  showSeconds,
}: {
  date: Date;
  timeZone: string;
  showSeconds: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const angles = analogClockAngles(getZonedTimeParts(date, timeZone), showSeconds);
  return (
    <svg
      className={`analog-clock ${reducedMotion ? "reduced" : ""}`}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="analog-clock-face" cx="50" cy="50" r="45" />
      {Array.from({ length: 12 }, (_, index) => (
        <line
          key={index}
          className="analog-clock-tick"
          x1="50"
          y1="8"
          x2="50"
          y2={index % 3 === 0 ? "14" : "11"}
          transform={`rotate(${index * 30} 50 50)`}
        />
      ))}
      <line className="analog-clock-hand hour" x1="50" y1="50" x2="50" y2="28" transform={`rotate(${angles.hour} 50 50)`} />
      <line className="analog-clock-hand minute" x1="50" y1="50" x2="50" y2="18" transform={`rotate(${angles.minute} 50 50)`} />
      {showSeconds && (
        <line className="analog-clock-hand second" x1="50" y1="56" x2="50" y2="15" transform={`rotate(${angles.second} 50 50)`} />
      )}
      <circle className="analog-clock-pin" cx="50" cy="50" r="2.4" />
    </svg>
  );
}

import { describe, expect, it } from "vitest";
import {
  closeOpenSegment, findLiveSession, formatElapsed, hasOpenSegment, isSessionStale,
  openNewSegment, restoreSession, sessionElapsedMinutes, sessionElapsedMs,
  STALE_SESSION_MS, type StudySession,
} from "./sessions";

function makeSession(patch: Partial<StudySession> = {}): StudySession {
  return {
    id: "s1",
    title: "Review Complement Deficiencies",
    link: { kind: "tracker", id: "t1", label: "Complement Deficiencies" },
    segments: [],
    status: "active",
    quickLogs: [],
    source: "command-brief",
    dayKey: "2026-07-07",
    createdAt: "2026-07-07T08:00:00.000Z",
    ...patch,
  };
}

describe("session timing from absolute timestamps", () => {
  it("sums closed segments exactly", () => {
    const session = makeSession({
      segments: [
        { startedAt: "2026-07-07T08:00:00.000Z", endedAt: "2026-07-07T08:25:00.000Z" },
        { startedAt: "2026-07-07T09:00:00.000Z", endedAt: "2026-07-07T09:10:00.000Z" },
      ],
    });
    expect(sessionElapsedMinutes(session)).toBe(35);
  });

  it("counts an open segment up to now — survives reload/sleep because nothing ticks", () => {
    const session = makeSession({ segments: [{ startedAt: "2026-07-07T08:00:00.000Z" }] });
    const now = new Date("2026-07-07T08:47:30.000Z");
    expect(sessionElapsedMs(session, now)).toBe(47.5 * 60_000);
    expect(hasOpenSegment(session)).toBe(true);
  });

  it("is unaffected by a simulated tab background / laptop sleep gap", () => {
    // Timer 'stops ticking' for 3 hours — elapsed is still wall-clock correct.
    const session = makeSession({ segments: [{ startedAt: "2026-07-07T08:00:00.000Z" }] });
    const afterSleep = new Date("2026-07-07T11:00:00.000Z");
    expect(sessionElapsedMinutes(session, afterSleep)).toBe(180);
  });

  it("ignores malformed segment timestamps instead of corrupting totals", () => {
    const session = makeSession({
      segments: [
        { startedAt: "not-a-date", endedAt: "2026-07-07T09:00:00.000Z" },
        { startedAt: "2026-07-07T08:00:00.000Z", endedAt: "2026-07-07T08:30:00.000Z" },
      ],
    });
    expect(sessionElapsedMinutes(session)).toBe(30);
  });
});

describe("segment lifecycle", () => {
  it("closeOpenSegment is idempotent", () => {
    const at = new Date("2026-07-07T09:00:00.000Z");
    const closed = closeOpenSegment([{ startedAt: "2026-07-07T08:00:00.000Z" }], at);
    expect(closed[0].endedAt).toBe(at.toISOString());
    expect(closeOpenSegment(closed, new Date("2026-07-07T10:00:00.000Z"))).toEqual(closed);
  });

  it("openNewSegment refuses a second concurrent open segment", () => {
    const open = openNewSegment([], new Date("2026-07-07T08:00:00.000Z"));
    expect(open).toHaveLength(1);
    expect(openNewSegment(open, new Date("2026-07-07T09:00:00.000Z"))).toHaveLength(1);
  });
});

describe("restoration after reload", () => {
  it("restores an active session untouched when the open segment is fresh", () => {
    const session = makeSession({ segments: [{ startedAt: "2026-07-07T08:00:00.000Z" }] });
    const now = new Date("2026-07-07T09:00:00.000Z");
    expect(isSessionStale(session, now)).toBe(false);
    expect(restoreSession(session, now)).toBe(session);
  });

  it("caps a stale overnight session instead of crediting phantom hours", () => {
    const session = makeSession({ segments: [{ startedAt: "2026-07-07T08:00:00.000Z" }] });
    const nextMorning = new Date("2026-07-08T07:00:00.000Z"); // 23h later
    expect(isSessionStale(session, nextMorning)).toBe(true);
    const restored = restoreSession(session, nextMorning);
    expect(restored.status).toBe("paused");
    expect(sessionElapsedMs(restored, nextMorning)).toBe(STALE_SESSION_MS);
    // The truncation is visible, not silent.
    expect(restored.quickLogs.at(-1)?.note).toMatch(/capped/i);
  });

  it("findLiveSession prefers active over paused and ignores finished ones", () => {
    const done = makeSession({ id: "a", status: "completed" });
    const paused = makeSession({ id: "b", status: "paused" });
    const active = makeSession({ id: "c", status: "active" });
    expect(findLiveSession([done, paused, active])?.id).toBe("c");
    expect(findLiveSession([done, paused])?.id).toBe("b");
    expect(findLiveSession([done])).toBeUndefined();
  });
});

describe("formatElapsed", () => {
  it("renders m:ss and h:mm:ss", () => {
    expect(formatElapsed(5 * 60_000 + 7000)).toBe("5:07");
    expect(formatElapsed(3 * 3600_000 + 61_000)).toBe("3:01:01");
  });
});

// ===========================================================================
// Study sessions — the "Begin Session" engine behind the Command Brief.
// A session is a first-class record linked to a task/tracker item/question set.
// Time is derived ONLY from absolute timestamp segments, never from a ticking
// counter, so elapsed time stays correct across tab switches, laptop sleep,
// refreshes, and app updates. Pure helpers here; persistence in store.ts.
// ===========================================================================
import type { ID } from "./types";

export type SessionStatus = "active" | "paused" | "completed" | "abandoned";

/** Quick in-session log states (directive §2). */
export type SessionQuickLog =
  | "completed"
  | "partial"
  | "blocked"
  | "rescheduled"
  | "too-difficult"
  | "misunderstood"
  | "needs-review";

export const QUICK_LOG_LABEL: Record<SessionQuickLog, string> = {
  completed: "Completed",
  partial: "Partially completed",
  blocked: "Blocked",
  rescheduled: "Rescheduled",
  "too-difficult": "Too difficult",
  misunderstood: "Misunderstood",
  "needs-review": "Needs review",
};

export type SessionLinkKind = "task" | "tracker" | "question-set" | "blueprint-node" | "card-review" | "free";

export interface SessionLink {
  kind: SessionLinkKind;
  id?: ID;
  label: string;
  /** e.g. "BPM3 Immunology · Lecture 39" */
  context?: string;
}

/** One contiguous stretch of focused time. Open segment = no endedAt. */
export interface SessionSegment {
  startedAt: string; // ISO
  endedAt?: string; // ISO — absent while running
}

export interface SessionCapture {
  outcome: SessionQuickLog;
  confidence?: 1 | 2 | 3 | 4 | 5;
  takeaway?: string;
  blocker?: string;
  energyAfter?: "Low" | "Medium" | "High";
}

export interface StudySession {
  id: ID;
  title: string;
  link: SessionLink;
  plannedMinutes?: number;
  resources?: string[];
  reason?: string;
  segments: SessionSegment[];
  status: SessionStatus;
  quickLogs: Array<{ at: string; log: SessionQuickLog; note?: string }>;
  capture?: SessionCapture;
  source: "command-brief" | "minimum-viable-win" | "recovery" | "manual";
  dayKey: string; // local study day the session started on
  createdAt: string;
  endedAt?: string;
}

/** Elapsed milliseconds across all segments (open segment counts up to `now`). */
export function sessionElapsedMs(session: Pick<StudySession, "segments">, now: Date = new Date()): number {
  let total = 0;
  for (const seg of session.segments) {
    const start = Date.parse(seg.startedAt);
    if (Number.isNaN(start)) continue;
    const end = seg.endedAt ? Date.parse(seg.endedAt) : now.getTime();
    if (!Number.isNaN(end) && end > start) total += end - start;
  }
  return total;
}

export function sessionElapsedMinutes(session: Pick<StudySession, "segments">, now: Date = new Date()): number {
  return Math.floor(sessionElapsedMs(session, now) / 60_000);
}

export function hasOpenSegment(session: Pick<StudySession, "segments">): boolean {
  return session.segments.some((seg) => !seg.endedAt);
}

/** Close any open segment at `at` (idempotent). */
export function closeOpenSegment(segments: SessionSegment[], at: Date = new Date()): SessionSegment[] {
  return segments.map((seg) => (seg.endedAt ? seg : { ...seg, endedAt: at.toISOString() }));
}

export function openNewSegment(segments: SessionSegment[], at: Date = new Date()): SessionSegment[] {
  if (segments.some((seg) => !seg.endedAt)) return segments;
  return [...segments, { startedAt: at.toISOString() }];
}

/**
 * A session left "active" with an open segment for longer than this is stale:
 * the laptop was probably closed for the night. On restore the UI asks the
 * user what really happened instead of silently crediting phantom hours.
 */
export const STALE_SESSION_MS = 6 * 60 * 60 * 1000;

export function isSessionStale(session: StudySession, now: Date = new Date()): boolean {
  if (session.status !== "active") return false;
  const open = session.segments.find((seg) => !seg.endedAt);
  if (!open) return false;
  const start = Date.parse(open.startedAt);
  return !Number.isNaN(start) && now.getTime() - start > STALE_SESSION_MS;
}

/**
 * Restore an active/paused session after reload. Stale open segments are
 * truncated to the stale cap so a closed laptop never books phantom time;
 * the truncation is recorded as a quick log so nothing happens silently.
 */
export function restoreSession(session: StudySession, now: Date = new Date()): StudySession {
  if (session.status !== "active" || !isSessionStale(session, now)) return session;
  const cappedEnd = (startedAt: string) =>
    new Date(Math.min(Date.parse(startedAt) + STALE_SESSION_MS, now.getTime())).toISOString();
  return {
    ...session,
    status: "paused",
    segments: session.segments.map((seg) =>
      seg.endedAt ? seg : { ...seg, endedAt: cappedEnd(seg.startedAt) }),
    quickLogs: [
      ...session.quickLogs,
      { at: now.toISOString(), log: "partial", note: "Auto-paused: the timer was left running (capped at 6h)." },
    ],
  };
}

/** The single session the UI should surface (active first, else paused). */
export function findLiveSession(sessions: StudySession[]): StudySession | undefined {
  return sessions.find((s) => s.status === "active") ?? sessions.find((s) => s.status === "paused");
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

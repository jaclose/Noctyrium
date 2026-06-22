// ===========================================================================
// AnkiConnect client. AnkiConnect is an Anki add-on that exposes a localhost
// HTTP API (default http://127.0.0.1:8765). With Anki open and the add-on
// installed, we can read review counts + deck stats and pull them into the
// productivity log. Everything stays local — the request never leaves the
// machine. Config (endpoint, auto-sync, per-day sync ledger) lives in
// localStorage so it isn't bundled into the persisted vault/backup.
// ===========================================================================
import { dayKey } from "./scoring";

export const DEFAULT_ANKI_ENDPOINT = "http://127.0.0.1:8765";
const ENDPOINT_KEY = "noctyrium-anki-endpoint";
const AUTOSYNC_KEY = "noctyrium-anki-autosync";
const SYNC_KEY = "noctyrium-anki-sync";

export function getAnkiEndpoint(): string {
  try { return localStorage.getItem(ENDPOINT_KEY)?.trim() || DEFAULT_ANKI_ENDPOINT; } catch { return DEFAULT_ANKI_ENDPOINT; }
}
export function setAnkiEndpoint(url: string) {
  try { localStorage.setItem(ENDPOINT_KEY, url.trim()); } catch { /* storage unavailable */ }
}
export function getAnkiAutoSync(): boolean {
  try { return localStorage.getItem(AUTOSYNC_KEY) === "1"; } catch { return false; }
}
export function setAnkiAutoSync(value: boolean) {
  try { localStorage.setItem(AUTOSYNC_KEY, value ? "1" : "0"); } catch { /* storage unavailable */ }
}

export type AnkiErrorKind =
  | "malformed-endpoint"
  | "endpoint-unreachable"
  | "local-network-blocked"
  | "mixed-content-blocked"
  | "cors-blocked"
  | "anki-connect-absent"
  | "permission-denied"
  | "api-incompatibility"
  | "network"
  | "anki";
export class AnkiError extends Error {
  kind: AnkiErrorKind;
  constructor(message: string, kind: AnkiErrorKind) {
    super(message);
    this.name = "AnkiError";
    this.kind = kind;
  }
}

export type AnkiDiagnosticStepId = "endpoint" | "version" | "decks" | "reviews";
export type AnkiDiagnosticStatus = "pending" | "running" | "ok" | "failed";
export interface AnkiDiagnosticStep {
  id: AnkiDiagnosticStepId;
  label: string;
  status: AnkiDiagnosticStatus;
  detail?: string;
}

export const ANKI_DIAGNOSTIC_TEMPLATE: AnkiDiagnosticStep[] = [
  { id: "endpoint", label: "Checking endpoint", status: "pending" },
  { id: "version", label: "Testing AnkiConnect version", status: "pending" },
  { id: "decks", label: "Reading decks", status: "pending" },
  { id: "reviews", label: "Reading review counts", status: "pending" },
];

interface LocalFetchInit extends RequestInit {
  // Chrome Local Network Access hint. It is not in TypeScript's DOM lib yet.
  targetAddressSpace?: "local";
}

function endpointUrl(endpoint: string): URL {
  let url: URL;
  try {
    url = new URL(endpoint.trim());
  } catch {
    throw new AnkiError("The endpoint is not a valid URL. Use the default local AnkiConnect endpoint: http://127.0.0.1:8765", "malformed-endpoint");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new AnkiError("The endpoint must start with http:// or https://. AnkiConnect normally uses http://127.0.0.1:8765.", "malformed-endpoint");
  }
  return url;
}

async function invoke<T>(action: string, params: Record<string, unknown>, endpoint: string): Promise<T> {
  let res: Response;
  const url = endpointUrl(endpoint);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const init: LocalFetchInit = {
      method: "POST",
      mode: "cors",
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, version: 6, params }),
      signal: controller.signal,
      targetAddressSpace: targetAddressSpace(url),
    };
    res = await fetch(url.toString(), init);
  } catch (err) {
    throw classifyFetchFailure(err, url);
  } finally {
    window.clearTimeout(timeout);
  }
  const data = await res.json().catch(() => {
    throw new AnkiError("The endpoint answered, but it did not look like AnkiConnect JSON. Confirm the AnkiConnect add-on is installed and bound to this port.", "anki-connect-absent");
  });
  if (data && data.error) throw new AnkiError(String(data.error), "anki");
  return data.result as T;
}

function targetAddressSpace(_endpoint: URL): "local" {
  return "local";
}

function classifyFetchFailure(err: unknown, endpoint: URL): AnkiError {
  const origin = typeof window !== "undefined" ? window.location.origin : "this site";
  const timedOut = err instanceof DOMException && err.name === "AbortError";
  const localHost = /^(127\.|localhost$|::1$)/i.test(endpoint.hostname);
  const hostedLocal = typeof window !== "undefined" && window.location.protocol === "https:" && endpoint.protocol === "http:" && localHost;
  if (timedOut) {
    return new AnkiError(`AnkiConnect did not answer within 8 seconds at ${endpoint}. Confirm Anki is open, then try Test endpoint.`, "endpoint-unreachable");
  }
  if (hostedLocal) {
    return new AnkiError(`Chrome blocked this hosted page from reaching local AnkiConnect at ${endpoint}. Allow Local Network / Apps on device for ${origin}, or run Noctyrium locally from http://127.0.0.1:5173.`, "local-network-blocked");
  }
  try {
    if (typeof window !== "undefined" && window.location.protocol === "https:" && endpoint.protocol === "http:" && !localHost) {
      return new AnkiError("The browser blocked an HTTPS page from calling an insecure HTTP endpoint. Use the local app URL or a secure bridge.", "mixed-content-blocked");
    }
  } catch {
    /* ignore */
  }
  if (localHost) {
    return new AnkiError(`Could not reach AnkiConnect at ${endpoint}. Most often Anki is closed, AnkiConnect is not installed, or it is bound to a different port.`, "endpoint-unreachable");
  }
  return new AnkiError(`Could not reach AnkiConnect. If the endpoint is correct, check webCorsOriginList for this exact origin: ${origin}`, "cors-blocked");
}

export interface AnkiPermission {
  permission: "granted" | "denied";
  requireApiKey?: boolean;
  version?: number;
}

export const requestAnkiPermission = (endpoint: string) => invoke<AnkiPermission>("requestPermission", {}, endpoint);
export const ankiVersion = (endpoint: string) => invoke<number>("version", {}, endpoint);
export const reviewsToday = (endpoint: string) => invoke<number>("getNumCardsReviewedToday", {}, endpoint);
export const reviewsByDay = (endpoint: string) => invoke<[string, number][]>("getNumCardsReviewedByDay", {}, endpoint);

export interface DeckStat {
  deck_id: number;
  name: string;
  new_count: number;
  learn_count: number;
  review_count: number;
  total_in_deck: number;
}

export async function deckStats(endpoint: string): Promise<DeckStat[]> {
  const names = await invoke<string[]>("deckNames", {}, endpoint);
  const stats = await invoke<Record<string, DeckStat>>("getDeckStats", { decks: names }, endpoint);
  return Object.values(stats)
    .filter((deck) => deck.total_in_deck > 0 || deck.name !== "Default") // hide the empty default deck
    .sort((a, b) => (b.review_count + b.new_count + b.learn_count) - (a.review_count + a.new_count + a.learn_count));
}

export interface AnkiSnapshot {
  version: number;
  today: number;
  decks: DeckStat[];
  byDay: [string, number][];
}

export async function fetchAnkiSnapshot(endpoint: string, onStep?: (id: AnkiDiagnosticStepId, status: AnkiDiagnosticStatus, detail?: string) => void): Promise<AnkiSnapshot> {
  onStep?.("endpoint", "running");
  endpointUrl(endpoint);
  onStep?.("endpoint", "ok", endpoint);
  onStep?.("version", "running");
  const version = await ankiVersion(endpoint);
  if (typeof version !== "number" || version < 5) {
    throw new AnkiError(`Unsupported AnkiConnect API version: ${String(version)}. Noctyrium expects version 5 or newer.`, "api-incompatibility");
  }
  onStep?.("version", "ok", `v${version}`);
  onStep?.("decks", "running");
  const decks = await deckStats(endpoint);
  onStep?.("decks", "ok", `${decks.length} deck${decks.length === 1 ? "" : "s"}`);
  onStep?.("reviews", "running");
  const [today, byDay] = await Promise.all([
    reviewsToday(endpoint),
    reviewsByDay(endpoint).catch(() => [] as [string, number][]),
  ]);
  onStep?.("reviews", "ok", `${today} review${today === 1 ? "" : "s"} today`);
  return { version, today, decks, byDay };
}

// --- Per-day sync ledger: only log the *new* reviews since the last sync, so
// repeated syncs in one day never double-count into productivity. ---
interface AnkiSyncLedger { day: string; synced: number }

function readLedger(): AnkiSyncLedger {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AnkiSyncLedger;
      if (typeof parsed.day === "string" && typeof parsed.synced === "number") return parsed;
    }
  } catch { /* ignore */ }
  return { day: "", synced: 0 };
}
function writeLedger(ledger: AnkiSyncLedger) {
  try { localStorage.setItem(SYNC_KEY, JSON.stringify(ledger)); } catch { /* storage unavailable */ }
}

/** How many of today's reviews have already been synced into productivity. */
export function alreadySyncedToday(): number {
  const ledger = readLedger();
  return ledger.day === dayKey() ? ledger.synced : 0;
}

/** The increment to log given AnkiConnect's current reviews-today count. */
export function pendingSyncDelta(reviewsTodayCount: number): number {
  return Math.max(0, reviewsTodayCount - alreadySyncedToday());
}

/** Record that we've now synced up to `reviewsTodayCount` for today. */
export function commitSync(reviewsTodayCount: number) {
  writeLedger({ day: dayKey(), synced: reviewsTodayCount });
}

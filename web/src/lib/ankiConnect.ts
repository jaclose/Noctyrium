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

export type AnkiErrorKind = "network" | "anki";
export class AnkiError extends Error {
  kind: AnkiErrorKind;
  constructor(message: string, kind: AnkiErrorKind) {
    super(message);
    this.name = "AnkiError";
    this.kind = kind;
  }
}

async function invoke<T>(action: string, params: Record<string, unknown>, endpoint: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, version: 6, params }),
    });
  } catch {
    // Network/CORS/mixed-content failures all surface here as a TypeError.
    throw new AnkiError("Could not reach Anki. Make sure Anki is open with the AnkiConnect add-on installed and this origin is allow-listed.", "network");
  }
  const data = await res.json().catch(() => ({ error: "Unexpected AnkiConnect response." }));
  if (data && data.error) throw new AnkiError(String(data.error), "anki");
  return data.result as T;
}

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

export async function fetchAnkiSnapshot(endpoint: string): Promise<AnkiSnapshot> {
  const version = await ankiVersion(endpoint); // also the connection test
  const [today, decks, byDay] = await Promise.all([
    reviewsToday(endpoint),
    deckStats(endpoint),
    reviewsByDay(endpoint).catch(() => [] as [string, number][]),
  ]);
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

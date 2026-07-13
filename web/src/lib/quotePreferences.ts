import type { AxomQuote } from "../data/quotes";
import { STORAGE_KEYS } from "./brand";

export interface QuotePreferences {
  version: 1;
  quoteVisible: boolean;
  includeGuilt: boolean;
  favoriteQuoteIds: string[];
  hiddenQuoteIds: string[];
}

export const DEFAULT_QUOTE_PREFERENCES: QuotePreferences = {
  version: 1,
  quoteVisible: true,
  includeGuilt: false,
  favoriteQuoteIds: [],
  hiddenQuoteIds: [],
};

const MAX_QUOTE_IDS = 100;
type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): PreferenceStorage | undefined {
  try { return typeof window === "undefined" ? undefined : window.localStorage; } catch { return undefined; }
}

function quoteIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => validQuoteId(item)))]
    .slice(-MAX_QUOTE_IDS);
}

function validQuoteId(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = value.match(/^quote-(\d{3})$/);
  if (!match) return false;
  const number = Number(match[1]);
  return number >= 1 && number <= MAX_QUOTE_IDS;
}

export function normalizeQuotePreferences(value: unknown): QuotePreferences {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    version: 1,
    quoteVisible: typeof record.quoteVisible === "boolean" ? record.quoteVisible : true,
    includeGuilt: record.includeGuilt === true,
    favoriteQuoteIds: quoteIds(record.favoriteQuoteIds),
    hiddenQuoteIds: quoteIds(record.hiddenQuoteIds),
  };
}

export function readQuotePreferences(storage: Pick<Storage, "getItem"> | undefined = browserStorage()): QuotePreferences {
  if (!storage) return { ...DEFAULT_QUOTE_PREFERENCES };
  try {
    return normalizeQuotePreferences(JSON.parse(storage.getItem(STORAGE_KEYS.quotePreferences) ?? "null"));
  } catch {
    return { ...DEFAULT_QUOTE_PREFERENCES };
  }
}

export function writeQuotePreferences(
  value: QuotePreferences,
  storage: Pick<Storage, "setItem"> | undefined = browserStorage(),
): QuotePreferences {
  const normalized = normalizeQuotePreferences(value);
  try { storage?.setItem(STORAGE_KEYS.quotePreferences, JSON.stringify(normalized)); } catch { /* device preference is best effort */ }
  return normalized;
}

export function selectQuoteForDay(
  quotes: readonly AxomQuote[],
  preferences: QuotePreferences,
  dayKey: string,
  offset = 0,
): AxomQuote | null {
  const hidden = new Set(preferences.hiddenQuoteIds);
  const eligible = quotes.filter((quote) => !hidden.has(quote.id) && (preferences.includeGuilt || !quote.guilt));
  if (!eligible.length) return null;
  const start = fnv1a32(dayKey) % eligible.length;
  const index = ((start + Math.trunc(offset)) % eligible.length + eligible.length) % eligible.length;
  return eligible[index];
}

export function toggleFavoriteQuote(preferences: QuotePreferences, quoteId: string): QuotePreferences {
  const current = new Set(preferences.favoriteQuoteIds);
  if (current.has(quoteId)) current.delete(quoteId);
  else current.add(quoteId);
  return normalizeQuotePreferences({ ...preferences, favoriteQuoteIds: [...current] });
}

export function hideQuote(preferences: QuotePreferences, quoteId: string): QuotePreferences {
  return normalizeQuotePreferences({
    ...preferences,
    hiddenQuoteIds: [...preferences.hiddenQuoteIds, quoteId],
    favoriteQuoteIds: preferences.favoriteQuoteIds.filter((id) => id !== quoteId),
  });
}

function fnv1a32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

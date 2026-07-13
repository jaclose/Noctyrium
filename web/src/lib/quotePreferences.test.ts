import { describe, expect, it } from "vitest";
import { AXOM_QUOTES } from "../data/quotes";
import { STORAGE_KEYS } from "./brand";
import {
  DEFAULT_QUOTE_PREFERENCES,
  hideQuote,
  normalizeQuotePreferences,
  readQuotePreferences,
  selectQuoteForDay,
  toggleFavoriteQuote,
  writeQuotePreferences,
} from "./quotePreferences";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("bounded device-only quote preferences", () => {
  it("defaults guilt/shame off and selects a stable daily quote", () => {
    const first = selectQuoteForDay(AXOM_QUOTES, DEFAULT_QUOTE_PREFERENCES, "2026-07-12");
    const repeated = selectQuoteForDay(AXOM_QUOTES, DEFAULT_QUOTE_PREFERENCES, "2026-07-12");
    expect(first).toEqual(repeated);
    expect(first?.guilt).toBe(false);
    for (let offset = 0; offset < 100; offset += 1) {
      expect(selectQuoteForDay(AXOM_QUOTES, DEFAULT_QUOTE_PREFERENCES, "2026-07-12", offset)?.guilt).toBe(false);
    }
  });

  it("bounds and validates favorite/hidden ids", () => {
    const ids = Array.from({ length: 140 }, (_, index) => `quote-${String(index).padStart(3, "0")}`);
    const normalized = normalizeQuotePreferences({ favoriteQuoteIds: [...ids, "bad id", 4], hiddenQuoteIds: ids });
    expect(normalized.favoriteQuoteIds).toHaveLength(100);
    expect(normalized.hiddenQuoteIds).toHaveLength(100);
    expect(normalized.favoriteQuoteIds.every((id) => /^quote-\d{3}$/.test(id))).toBe(true);
  });

  it("persists only bounded ids and toggles, never quote or workspace content", () => {
    const storage = memoryStorage();
    let preferences = toggleFavoriteQuote(DEFAULT_QUOTE_PREFERENCES, "quote-001");
    preferences = hideQuote(preferences, "quote-002");
    writeQuotePreferences(preferences, storage);
    const raw = storage.getItem(STORAGE_KEYS.quotePreferences)!;
    expect(readQuotePreferences(storage)).toEqual(preferences);
    expect(raw).toContain("quote-001");
    expect(raw).not.toContain(AXOM_QUOTES[0].text);
    expect(raw).not.toContain("profile");
  });

  it("never resurrects a hidden quote when every eligible quote is hidden", () => {
    const eligibleIds = AXOM_QUOTES.filter((quote) => !quote.guilt).map((quote) => quote.id);
    expect(selectQuoteForDay(AXOM_QUOTES, {
      ...DEFAULT_QUOTE_PREFERENCES,
      hiddenQuoteIds: eligibleIds,
    }, "2026-07-12")).toBeNull();
  });
});

import { describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "./brand";
import {
  announceJournalEnergyOnce,
  JOURNAL_ENERGY_ANNOUNCEMENT_BODY,
  JOURNAL_ENERGY_ANNOUNCEMENT_ID,
} from "./journalAnnouncement";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("Journal energy announcement", () => {
  it("shows the truthful deterministic explanation once per version", () => {
    const storage = memoryStorage();
    const session = new Set<string>();
    const notify = vi.fn();
    expect(announceJournalEnergyOnce({ storage, session, notify })).toBe(true);
    expect(announceJournalEnergyOnce({ storage, session, notify })).toBe(false);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({
      body: JOURNAL_ENERGY_ANNOUNCEMENT_BODY,
      duration: 8_000,
      dedupe: JOURNAL_ENERGY_ANNOUNCEMENT_ID,
    }));
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.dismissedAnnouncements)!)).toEqual([JOURNAL_ENERGY_ANNOUNCEMENT_ID]);
  });

  it("uses an in-memory guard when device metadata storage is blocked", () => {
    const storage = {
      getItem: vi.fn(() => { throw new Error("blocked"); }),
      setItem: vi.fn(() => { throw new Error("blocked"); }),
    };
    const session = new Set<string>();
    const notify = vi.fn();
    expect(announceJournalEnergyOnce({ storage, session, notify })).toBe(true);
    expect(announceJournalEnergyOnce({ storage, session, notify })).toBe(false);
    expect(notify).toHaveBeenCalledOnce();
  });
});

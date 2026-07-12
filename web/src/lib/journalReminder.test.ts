import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "./brand";
import { createJournalReminderLedger } from "./journalReminder";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(STORAGE_KEYS.missedStandupReminder, initial);
  return {
    values,
    storage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    },
  };
}

describe("journal reminder ledger", () => {
  it("selects the newest available target and deduplicates each target for the day", () => {
    const { storage } = memoryStorage();
    const ledger = createJournalReminderLedger(() => storage);
    const missed = ["2026-07-10", "2026-07-09"];

    expect(ledger.nextTarget("2026-07-11", missed)).toBe("2026-07-10");
    ledger.markShown("2026-07-11", "2026-07-10");
    expect(ledger.nextTarget("2026-07-11", missed)).toBeUndefined();
    ledger.skip("2026-07-11", "2026-07-10");
    expect(ledger.nextTarget("2026-07-11", missed)).toBe("2026-07-09");
    ledger.skip("2026-07-11", "2026-07-09");
    expect(ledger.nextTarget("2026-07-11", missed)).toBeUndefined();

    // A new reminder day starts a fresh, deterministic pass over missed dates.
    expect(ledger.nextTarget("2026-07-12", missed)).toBe("2026-07-10");
  });

  it("stores only date metadata and supports muting the whole reminder day", () => {
    const { storage, values } = memoryStorage();
    const ledger = createJournalReminderLedger(() => storage);

    ledger.markShown("2026-07-11", "2026-07-10");
    ledger.muteForDay("2026-07-11");

    const raw = values.get(STORAGE_KEYS.missedStandupReminder)!;
    expect([...values.keys()]).toEqual([STORAGE_KEYS.missedStandupReminder]);
    expect(JSON.parse(raw)).toEqual({
      day: "2026-07-11",
      shownTargets: ["2026-07-10"],
      skippedTargets: [],
      muted: true,
    });
    expect(ledger.nextTarget("2026-07-11", ["2026-07-09"])).toBeUndefined();
  });

  it("honors the legacy once-per-day marker after an update", () => {
    const { storage } = memoryStorage("2026-07-11");
    const ledger = createJournalReminderLedger(() => storage);
    expect(ledger.nextTarget("2026-07-11", ["2026-07-10"])).toBeUndefined();
    expect(ledger.nextTarget("2026-07-12", ["2026-07-10"])).toBe("2026-07-10");
  });

  it("keeps in-session dedupe when device storage is unavailable", () => {
    const blocked = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    const ledger = createJournalReminderLedger(() => blocked);

    expect(ledger.nextTarget("2026-07-11", ["2026-07-10"])).toBe("2026-07-10");
    ledger.markShown("2026-07-11", "2026-07-10");
    expect(ledger.nextTarget("2026-07-11", ["2026-07-10"])).toBeUndefined();
  });
});

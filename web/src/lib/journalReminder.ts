import { STORAGE_KEYS } from "./brand";

/**
 * Device-only reminder metadata. It intentionally stores only calendar keys;
 * journal text and the workspace remain in the IndexedDB-backed vault.
 */
interface JournalReminderMetadata {
  day: string;
  shownTargets: string[];
  skippedTargets: string[];
  muted: boolean;
}

type ReminderStorage = Pick<Storage, "getItem" | "setItem">;
type StorageProvider = () => ReminderStorage | undefined;

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TARGETS = 20;

function emptyMetadata(day: string): JournalReminderMetadata {
  return { day, shownTargets: [], skippedTargets: [], muted: false };
}

function validTargets(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && DAY_KEY.test(item)))].slice(0, MAX_TARGETS);
}

function parseMetadata(raw: string | null, day: string): JournalReminderMetadata {
  if (!raw) return emptyMetadata(day);
  // Older builds stored today's date directly after showing one aggregate alert.
  // Respect that marker for the rest of the day so an update cannot re-notify.
  if (raw === day) return { ...emptyMetadata(day), muted: true };
  try {
    const value = JSON.parse(raw) as Partial<JournalReminderMetadata>;
    if (value.day !== day) return emptyMetadata(day);
    return {
      day,
      shownTargets: validTargets(value.shownTargets),
      skippedTargets: validTargets(value.skippedTargets),
      muted: value.muted === true,
    };
  } catch {
    return emptyMetadata(day);
  }
}

function mergeMetadata(a: JournalReminderMetadata, b: JournalReminderMetadata): JournalReminderMetadata {
  return {
    day: a.day,
    shownTargets: validTargets([...a.shownTargets, ...b.shownTargets]),
    skippedTargets: validTargets([...a.skippedTargets, ...b.skippedTargets]),
    muted: a.muted || b.muted,
  };
}

function browserStorage(): ReminderStorage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Creates a reminder ledger with an in-memory fallback. The fallback prevents
 * repeat alerts within a session even when browser storage is blocked.
 */
export function createJournalReminderLedger(getStorage: StorageProvider = browserStorage) {
  let session = emptyMetadata("");

  function read(day: string): JournalReminderMetadata {
    const inMemory = session.day === day ? session : emptyMetadata(day);
    try {
      const persisted = parseMetadata(getStorage()?.getItem(STORAGE_KEYS.missedStandupReminder) ?? null, day);
      return mergeMetadata(inMemory, persisted);
    } catch {
      return inMemory;
    }
  }

  function write(value: JournalReminderMetadata) {
    session = value;
    try {
      getStorage()?.setItem(STORAGE_KEYS.missedStandupReminder, JSON.stringify(value));
    } catch {
      // The session copy still provides dedupe when device storage is blocked.
    }
  }

  return {
    nextTarget(day: string, missedDays: string[]): string | undefined {
      const state = read(day);
      if (state.muted) return undefined;
      const shown = new Set(state.shownTargets);
      const skipped = new Set(state.skippedTargets);
      for (const target of missedDays) {
        if (!DAY_KEY.test(target) || skipped.has(target)) continue;
        // Keep one unresolved reminder in flight. This also makes React's
        // development StrictMode effect replay unable to surface an older day.
        if (shown.has(target)) return undefined;
        return target;
      }
      return undefined;
    },

    markShown(day: string, target: string) {
      if (!DAY_KEY.test(target)) return;
      const state = read(day);
      write({ ...state, shownTargets: validTargets([...state.shownTargets, target]) });
    },

    skip(day: string, target: string) {
      if (!DAY_KEY.test(target)) return;
      const state = read(day);
      write({
        ...state,
        shownTargets: validTargets([...state.shownTargets, target]),
        skippedTargets: validTargets([...state.skippedTargets, target]),
      });
    },

    muteForDay(day: string) {
      write({ ...read(day), muted: true });
    },
  };
}

export const journalReminderLedger = createJournalReminderLedger();

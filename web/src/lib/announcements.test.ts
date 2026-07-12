import { describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "./brand";
import {
  dismissAnnouncement,
  isAnnouncementDismissed,
  readDismissedAnnouncements,
} from "./announcements";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(STORAGE_KEYS.dismissedAnnouncements, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("device announcement dismissal", () => {
  it("normalizes the bounded id-only ledger and rejects malformed content", () => {
    const storage = memoryStorage(JSON.stringify([
      "question-bank-entry-v1",
      "question-bank-entry-v1",
      "bad id with spaces",
      42,
      "daily-word-launch-v1",
    ]));
    expect(readDismissedAnnouncements(storage)).toEqual([
      "question-bank-entry-v1",
      "daily-word-launch-v1",
    ]);
    expect(isAnnouncementDismissed("daily-word-launch-v1", readDismissedAnnouncements(storage))).toBe(true);
    expect(isAnnouncementDismissed("study-methods-library-v1", readDismissedAnnouncements(storage))).toBe(false);
  });

  it("persists each stable id once and caps old announcements", () => {
    const storage = memoryStorage();
    for (let index = 0; index < 70; index += 1) {
      dismissAnnouncement(`announcement-${index}`, storage);
    }
    const dismissed = readDismissedAnnouncements(storage);
    expect(dismissed).toHaveLength(64);
    expect(dismissed[0]).toBe("announcement-6");
    expect(dismissAnnouncement("announcement-69", storage)).toEqual(dismissed);
  });

  it("fails safely when device storage is unavailable", () => {
    const blocked = {
      getItem: vi.fn(() => { throw new Error("blocked"); }),
      setItem: vi.fn(() => { throw new Error("blocked"); }),
    };
    expect(readDismissedAnnouncements(blocked)).toEqual([]);
    expect(dismissAnnouncement("question-bank-entry-v1", blocked)).toEqual(["question-bank-entry-v1"]);
  });
});

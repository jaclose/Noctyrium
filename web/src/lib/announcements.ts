import { STORAGE_KEYS } from "./brand";

const MAX_DISMISSED_ANNOUNCEMENTS = 64;
const MAX_ANNOUNCEMENT_ID_LENGTH = 120;

type AnnouncementStorage = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): AnnouncementStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function validAnnouncementId(value: unknown): value is string {
  return typeof value === "string"
    && value.length > 0
    && value.length <= MAX_ANNOUNCEMENT_ID_LENGTH
    && /^[a-z0-9][a-z0-9._:-]*$/i.test(value);
}

/** Read the small device-only badge ledger. Invalid or blocked storage is empty. */
export function readDismissedAnnouncements(
  storage: Pick<Storage, "getItem"> | undefined = browserStorage(),
): string[] {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEYS.dismissedAnnouncements) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter(validAnnouncementId))].slice(-MAX_DISMISSED_ANNOUNCEMENTS);
  } catch {
    return [];
  }
}

export function isAnnouncementDismissed(
  announcementId: string | undefined,
  dismissed: readonly string[],
): boolean {
  return Boolean(announcementId && dismissed.includes(announcementId));
}

/**
 * Persist one stable id without recording a route visit or any user content.
 * Returns the normalized ledger so the caller can update its local view.
 */
export function dismissAnnouncement(
  announcementId: string,
  storage: AnnouncementStorage | undefined = browserStorage(),
): string[] {
  if (!validAnnouncementId(announcementId)) return readDismissedAnnouncements(storage);
  const next = [...new Set([...readDismissedAnnouncements(storage), announcementId])]
    .slice(-MAX_DISMISSED_ANNOUNCEMENTS);
  try {
    storage?.setItem(STORAGE_KEYS.dismissedAnnouncements, JSON.stringify(next));
  } catch {
    // Badge dismissal remains best-effort when device storage is blocked.
  }
  return next;
}

import { dismissAnnouncement, isAnnouncementDismissed, readDismissedAnnouncements } from "./announcements";
import { pushToast } from "./toast";

export const JOURNAL_ENERGY_ANNOUNCEMENT_ID = "journal-energy-explanation-v1";
export const JOURNAL_ENERGY_ANNOUNCEMENT_BODY = "AXOM can estimate energy from your check-in, activity, and journal signals. You can always adjust the result.";

const journalAnnouncementSession = new Set<string>();
type AnnouncementStorage = Pick<Storage, "getItem" | "setItem">;

export function announceJournalEnergyOnce({
  storage = browserStorage(),
  session = journalAnnouncementSession,
  notify = pushToast,
}: {
  storage?: AnnouncementStorage;
  session?: Set<string>;
  notify?: typeof pushToast;
} = {}): boolean {
  if (session.has(JOURNAL_ENERGY_ANNOUNCEMENT_ID)
    || isAnnouncementDismissed(JOURNAL_ENERGY_ANNOUNCEMENT_ID, readDismissedAnnouncements(storage))) return false;
  session.add(JOURNAL_ENERGY_ANNOUNCEMENT_ID);
  notify({
    title: "How energy estimates work",
    body: JOURNAL_ENERGY_ANNOUNCEMENT_BODY,
    tone: "info",
    duration: 8_000,
    dedupe: JOURNAL_ENERGY_ANNOUNCEMENT_ID,
  });
  dismissAnnouncement(JOURNAL_ENERGY_ANNOUNCEMENT_ID, storage);
  return true;
}

function browserStorage(): AnnouncementStorage | undefined {
  try { return typeof window === "undefined" ? undefined : window.localStorage; } catch { return undefined; }
}

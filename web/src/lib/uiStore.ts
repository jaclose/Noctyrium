import { create } from "zustand";

// Ephemeral (non-persisted) UI state. Used to hand a "focus this tracker item"
// request from a suggested-move click to the Course Tracker page, which then
// selects its scope, scrolls to it, and briefly highlights it.
interface UiState {
  focusItemId: string | null;
  focusItem: (id: string) => void;
  clearFocus: () => void;
  // A day the Journal page should open a standup editor for (remediation).
  journalDay: string | null;
  remediateStandup: (dayKey: string) => void;
  clearJournalDay: () => void;
}

export const useUi = create<UiState>((set) => ({
  focusItemId: null,
  focusItem: (id) => set({ focusItemId: id }),
  clearFocus: () => set({ focusItemId: null }),
  journalDay: null,
  remediateStandup: (dayKey) => set({ journalDay: dayKey }),
  clearJournalDay: () => set({ journalDay: null }),
}));

/** Navigate to the Course Tracker focused on a specific item. */
export function gotoTrackerItem(id: string) {
  useUi.getState().focusItem(id);
  location.hash = "tracker";
}

/** Navigate to the Journal to write/remediate the standup for a given day. */
export function gotoJournalDay(dayKey: string) {
  useUi.getState().remediateStandup(dayKey);
  location.hash = "journal";
}

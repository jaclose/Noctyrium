import { create } from "zustand";

// Ephemeral (non-persisted) UI state. Used to hand a "focus this tracker item"
// request from a suggested-move click to the Course Tracker page, which then
// selects its scope, scrolls to it, and briefly highlights it.
interface UiState {
  focusItemId: string | null;
  focusItem: (id: string) => void;
  clearFocus: () => void;
}

export const useUi = create<UiState>((set) => ({
  focusItemId: null,
  focusItem: (id) => set({ focusItemId: id }),
  clearFocus: () => set({ focusItemId: null }),
}));

/** Navigate to the Course Tracker focused on a specific item. */
export function gotoTrackerItem(id: string) {
  useUi.getState().focusItem(id);
  location.hash = "tracker";
}

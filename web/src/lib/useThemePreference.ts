import { useSyncExternalStore } from "react";
import { THEME_CHANGE_EVENT, readThemePreference, type ThemePreference } from "./theme";

function subscribe(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(THEME_CHANGE_EVENT, listener);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, listener);
}

function getSnapshot(): ThemePreference {
  return readThemePreference();
}

function getServerSnapshot(): ThemePreference {
  return "system";
}

/** One reactive view over the canonical device theme preference. */
export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

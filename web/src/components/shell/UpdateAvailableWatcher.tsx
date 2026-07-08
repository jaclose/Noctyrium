// ===========================================================================
// Update detection (directive §6). Polls the deployed version manifest and
// shows a calm notice: local progress is never touched, reload is never forced,
// and the notice stays quiet while a study session is running. "Later" defers
// that version until the next app load.
// ===========================================================================
import { useEffect } from "react";
import { useStore } from "../../lib/store";
import { findLiveSession } from "../../lib/sessions";
import { APP_RELEASE_VERSION, BRAND, STORAGE_KEYS } from "../../lib/brand";
import { pushToast } from "../../lib/toast";

interface VersionManifest {
  version?: string;
  channel?: string;
  updatedAt?: string;
  notes?: string[];
}

function deferredVersion(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.updateDeferredVersion);
  } catch {
    return null;
  }
}

function deferVersion(version: string) {
  try {
    sessionStorage.setItem(STORAGE_KEYS.updateDeferredVersion, version);
  } catch { /* best effort */ }
}

export function UpdateAvailableWatcher() {
  useEffect(() => {
    let stopped = false;

    async function check() {
      // Never interrupt an active session with update chrome; the next poll
      // (or reopen) will catch it once the session is closed.
      if (findLiveSession(useStore.getState().sessions ?? [])) return;
      try {
        const res = await fetch(`./version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const manifest = await res.json() as VersionManifest;
        if (stopped || !manifest.version) return;
        // Any deployed version that differs from this running build is an
        // update — deploy detection, not semver ordering, so version-line
        // resets (e.g. alpha → pre-beta) still reach users.
        if (manifest.version === APP_RELEASE_VERSION) return;
        if (deferredVersion() === manifest.version) return;
        const notes = (manifest.notes ?? []).slice(0, 3).join(" · ");
        deferVersion(manifest.version); // shown once per app load; reload re-offers
        pushToast({
          title: `Update available — v${manifest.version}`,
          body: `Your local progress will remain intact.${notes ? ` What's new: ${notes}` : ""} Full changelog is on the About page. Dismiss to update later.`,
          tone: "info",
          actionLabel: "Update now",
          duration: 0,
          dedupe: `app-update-${manifest.version}`,
          onAction: () => window.location.reload(),
        });
      } catch {
        // Offline/local packaged mode stays quiet.
      }
    }

    check();
    const timer = window.setInterval(check, 15 * 60_000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, []);

  return null;
}

/** Exposed for the About page: what channel/product this build is. */
export const UPDATE_CHANNEL = BRAND.channel;

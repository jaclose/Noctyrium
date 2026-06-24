import { useEffect } from "react";
import { APP_RELEASE_VERSION } from "../../lib/seed";
import { pushToast } from "../../lib/toast";

interface VersionManifest {
  version?: string;
  channel?: string;
  updatedAt?: string;
}

export function UpdateAvailableWatcher() {
  useEffect(() => {
    let stopped = false;

    async function check() {
      try {
        const res = await fetch(`./version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const manifest = await res.json() as VersionManifest;
        if (stopped || !manifest.version || manifest.version === APP_RELEASE_VERSION) return;
        pushToast({
          title: "Update available",
          body: `Noctyrium ${manifest.version} is available. Export or finish active work, then refresh when ready.`,
          tone: "warn",
          actionLabel: "Refresh",
          duration: 12000,
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

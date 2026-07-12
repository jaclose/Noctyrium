// ===========================================================================
// Brand + version configuration — the single source of truth for every visible
// product-name string, icon reference, and release version. The product will be
// rebranded later: change values here (and public/version.json), never inline
// strings in components. Storage keys are FROZEN legacy identifiers — they must
// survive any rebrand so existing local data keeps loading (migrations depend
// on them). Do not derive storage keys from the display name.
// ===========================================================================

export const BRAND = {
  productName: "AXOM",
  /** The brand descriptor from the identity guide. */
  tagline: "Private academic operating system",
  /** Short descriptor used in update notices and About copy. */
  productKind: "private academic operating system",
  /** Release channel shown next to versions. */
  channel: "pre-beta",
  /** Public URLs (hosted preview, changelog). */
  hostedUrl: "https://noctyrium-cktjdhuhw-jacloses-projects.vercel.app/#dashboard",
  changelogRoute: "about",
} as const;

/** Axom identity palette (06 · color palette in the brand guide). */
export const BRAND_COLORS = {
  ink: "#0d0d0e", // near-black ground
  graphite: "#1c1c1e", // dark surface
  bone: "#e6e2d6", // ivory foreground / light mark
  gold: "#c8a96a", // muted gold accent
} as const;

/** FROZEN storage identifiers — never rename (rebrand-safe persistence). */
export const STORAGE_KEYS = {
  vaultDb: "noctyrium-local-vault",
  persistedState: "noctyrium-state",
  pomodoroSession: "noctyrium-pomodoro-session",
  activeStudySession: "noctyrium-active-session",
  aiSettings: "noctyrium-ai-settings",
  lastBackupAt: "noctyrium-last-backup-at",
  preMigrationSnapshot: "noctyrium-premigration-snapshot",
  updateDeferredVersion: "noctyrium-update-deferred",
  storageSchemaVersion: "axom.storage.schemaVersion",
  lastSeenBuild: "axom.lastSeenBuild",
  /** Small device-only UI preference; never part of the workspace payload. */
  themePreference: "axom.theme",
  /** Small device-only reminder ledger; contains date keys only, never journal content. */
  missedStandupReminder: "noctyrium-missed-standup-alert",
  localBackupPrefix: "axom.backups.local.",
  aiGenerations: "axom.ai.generations",
  migrationFailure: "axom.storage.migrationFailure",
} as const;

// Single source of truth for the release line. version.json, sw.js cache name,
// and api/health.ts must be updated together with this (see release checklist
// in docs/ALPHA-RELEASE.md).
export const APP_RELEASE_VERSION = "0.0.1-prebeta";
export const APP_BUILD_LABEL = `${BRAND.productName} Pre-Beta · v${APP_RELEASE_VERSION}`;
export const APP_VERSION_LABEL = `${APP_BUILD_LABEL} · web`;

/** True when `candidate` is a newer semver-ish version than `current`. */
export function isNewerVersion(candidate: string | undefined, current: string = APP_RELEASE_VERSION): boolean {
  if (!candidate || candidate === current) return false;
  const parse = (v: string) => {
    const [core, pre = ""] = v.split("-", 2);
    const nums = core.split(".").map((n) => Number.parseInt(n, 10) || 0);
    while (nums.length < 3) nums.push(0);
    return { nums, pre };
  };
  const a = parse(candidate);
  const b = parse(current);
  for (let i = 0; i < 3; i++) {
    if (a.nums[i] !== b.nums[i]) return a.nums[i] > b.nums[i];
  }
  // Same core: a release (no pre tag) beats a pre-release; otherwise compare tags.
  if (a.pre === b.pre) return false;
  if (!a.pre) return true;
  if (!b.pre) return false;
  return a.pre.localeCompare(b.pre, undefined, { numeric: true }) > 0;
}

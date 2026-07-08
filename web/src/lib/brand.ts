// ===========================================================================
// Brand + version configuration — the single source of truth for every visible
// product-name string, icon reference, and release version. The product will be
// rebranded later: change values here (and public/version.json), never inline
// strings in components. Storage keys are FROZEN legacy identifiers — they must
// survive any rebrand so existing local data keeps loading (migrations depend
// on them). Do not derive storage keys from the display name.
// ===========================================================================

export const BRAND = {
  /** Working title only — not the final product name. */
  productName: "Noctyrium",
  tagline: "Designed for execution, not decoration.",
  /** Short descriptor used in update notices and About copy. */
  productKind: "local-first academic command center",
  /** Release channel shown next to versions. */
  channel: "alpha",
  /** Public URLs (hosted preview, changelog). */
  hostedUrl: "https://noctyrium-cktjdhuhw-jacloses-projects.vercel.app/#dashboard",
  changelogRoute: "about",
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
} as const;

export const APP_RELEASE_VERSION = "0.2.0-alpha.1";
export const APP_BUILD_LABEL = `${BRAND.productName} Alpha 2 · v${APP_RELEASE_VERSION}`;
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

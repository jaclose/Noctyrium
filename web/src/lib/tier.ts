// ===========================================================================
// Feature-tier scaffold (pre-beta §14). Everything currently ships free; this
// exists so future premium gating has one honest switch instead of scattered
// checks. No paywalls block anything during beta — the internal flag simply
// labels surfaces that may become premium later.
// ===========================================================================

export type FeatureTier = "free" | "premium" | "beta-internal";

const TIER_KEY = "noctyrium-feature-tier"; // frozen-style local key, device-scoped

/** Features earmarked as potentially premium later. Informational only for now. */
export const PREMIUM_CANDIDATES = [
  "large-imports",
  "advanced-question-analytics",
  "extra-ai-actions",
  "cloud-backup",
  "advanced-anki-generation",
  "export-packs",
  "native-desktop",
] as const;

export function currentTier(): FeatureTier {
  try {
    const raw = localStorage.getItem(TIER_KEY);
    if (raw === "premium" || raw === "beta-internal") return raw;
  } catch { /* storage unavailable */ }
  return "free";
}

export function setTier(tier: FeatureTier): void {
  try {
    localStorage.setItem(TIER_KEY, tier);
  } catch { /* best effort */ }
}

/**
 * Gate check. During beta everything resolves true so testing is never
 * blocked; the function exists so call sites are already wired when real
 * tiers activate.
 */
export function hasFeature(_feature: (typeof PREMIUM_CANDIDATES)[number]): boolean {
  return true;
}

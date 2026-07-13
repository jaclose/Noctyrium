import type { Profile } from "./types";

export const PROMISE_PROMPT_VERSION = "promise-prompt-v1";
export const PROMISE_DEFER_DAYS = 14;

export function promisePromptStatus(
  state: "deferred" | "skipped",
  now: Date = new Date(),
): NonNullable<Profile["promisePromptStatus"]> {
  return { state, updatedAt: now.toISOString(), promptVersion: PROMISE_PROMPT_VERSION };
}

/** Pure eligibility rule; call only at an explicit safe post-onboarding moment. */
export function shouldOfferPromisePrompt(
  profile: Pick<Profile, "promise" | "promisePromptStatus">,
  now: Date = new Date(),
): boolean {
  if (profile.promise?.signedName) return false;
  const status = profile.promisePromptStatus;
  if (!status) return true;
  if (status.state === "skipped") {
    // This prompt was not previously wired, but preserve any legacy skip as v1.
    return (status.promptVersion ?? PROMISE_PROMPT_VERSION) !== PROMISE_PROMPT_VERSION;
  }
  const updated = Date.parse(status.updatedAt);
  if (!Number.isFinite(updated)) return true;
  return now.getTime() - updated >= PROMISE_DEFER_DAYS * 86_400_000;
}

export function shouldOfferPromiseAfterGlobalTour(
  reason: "complete" | "skip" | "escape",
  profile: Pick<Profile, "promise" | "promisePromptStatus">,
  now: Date = new Date(),
): boolean {
  // Every way out of the *global* guide is a post-onboarding guide decision.
  // Module tours never call this helper, so their Finish/Skip/Escape events
  // remain completely separate from the one-time Promise presentation.
  const isGlobalGuideDecision = reason === "complete" || reason === "skip" || reason === "escape";
  return isGlobalGuideDecision && shouldOfferPromisePrompt(profile, now);
}

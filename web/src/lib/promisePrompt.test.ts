import { describe, expect, it } from "vitest";
import { PROMISE_DEFER_DAYS, PROMISE_PROMPT_VERSION, promisePromptStatus, shouldOfferPromiseAfterGlobalTour, shouldOfferPromisePrompt } from "./promisePrompt";

const NOW = new Date("2026-07-12T12:00:00.000Z");

describe("post-guide promise eligibility", () => {
  it("accepts global completion and skip, but not Escape", () => {
    expect(shouldOfferPromiseAfterGlobalTour("complete", {}, NOW)).toBe(true);
    expect(shouldOfferPromiseAfterGlobalTour("skip", {}, NOW)).toBe(true);
    expect(shouldOfferPromiseAfterGlobalTour("escape", {}, NOW)).toBe(false);
  });

  it("offers only when unsigned and unsuppressed", () => {
    expect(shouldOfferPromisePrompt({}, NOW)).toBe(true);
    expect(shouldOfferPromisePrompt({ promise: { signedName: "Ada", signedAt: NOW.toISOString() } }, NOW)).toBe(false);
  });

  it("defers for fourteen days, then becomes eligible", () => {
    const status = promisePromptStatus("deferred", NOW);
    expect(shouldOfferPromisePrompt({ promisePromptStatus: status }, new Date(NOW.getTime() + (PROMISE_DEFER_DAYS - 1) * 86_400_000))).toBe(false);
    expect(shouldOfferPromisePrompt({ promisePromptStatus: status }, new Date(NOW.getTime() + PROMISE_DEFER_DAYS * 86_400_000))).toBe(true);
  });

  it("suppresses current and legacy skips but allows a future prompt version", () => {
    const updatedAt = NOW.toISOString();
    expect(shouldOfferPromisePrompt({ promisePromptStatus: { state: "skipped", updatedAt } }, NOW)).toBe(false);
    expect(shouldOfferPromisePrompt({ promisePromptStatus: { state: "skipped", updatedAt, promptVersion: PROMISE_PROMPT_VERSION } }, NOW)).toBe(false);
    expect(shouldOfferPromisePrompt({ promisePromptStatus: { state: "skipped", updatedAt, promptVersion: "older-version" } }, NOW)).toBe(true);
  });
});

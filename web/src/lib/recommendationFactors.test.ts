import { describe, expect, it } from "vitest";
import { personalizedSuggestions, rankTrackerItems } from "./recommendationFactors";
import type { TrackerItem } from "./types";

const make = (patch: Partial<TrackerItem>): TrackerItem => ({ id: crypto.randomUUID(), path: "Course", label: "Item", kind: "Lecture", passes: 0, ankiPasses: 0, yield: "none", updated: "2026-08-01T00:00:00Z", ...patch });
const now = new Date("2026-08-08T00:00:00Z");

describe("deterministic recommendation factors", () => {
  it("lets a high-yield untouched lecture outrank an already-covered DLA", () => {
    const lecture = make({ id: "lecture", label: "Renal clearance", yield: "high" });
    const dla = make({ id: "dla", label: "DLA", kind: "DLA", passes: 1, updated: "2026-08-07T20:00:00Z" });
    expect(rankTrackerItems([dla, lecture], { now })[0].item.id).toBe("lecture");
  });

  it("raises a second pass after the learner review window", () => {
    const due = make({ id: "due", passes: 1, updated: "2026-08-03T00:00:00Z" });
    const fresh = make({ id: "fresh", passes: 1, updated: "2026-08-07T12:00:00Z" });
    const ranked = rankTrackerItems([fresh, due], { now, preferences: { configured: true, reviewAfterDays: 3 } });
    expect(ranked[0].item.id).toBe("due");
    expect(ranked[0].factors.some((factor) => factor.id === "stale-review")).toBe(true);
  });

  it("does not force Anki for a learner who disabled it", () => {
    const suggestions = personalizedSuggestions([make({ id: "x", passes: 2 })], 3, { now, preferences: { configured: true, methods: [{ id: "anki", enabled: false }, { id: "practice-questions", enabled: true }] } });
    expect(suggestions.map((suggestion) => `${suggestion.title} ${suggestion.reason}`).join(" ")).not.toMatch(/anki/i);
  });

  it("returns stable ordering for identical evidence", () => {
    const items = [make({ id: "b" }), make({ id: "a" })];
    expect(rankTrackerItems(items, { now }).map((entry) => entry.item.id)).toEqual(["a", "b"]);
    expect(rankTrackerItems(items, { now }).map((entry) => entry.item.id)).toEqual(["a", "b"]);
  });
});

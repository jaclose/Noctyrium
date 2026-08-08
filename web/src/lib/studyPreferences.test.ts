import { describe, expect, it } from "vitest";
import { normalizeStudyWorkflow, resolveStudyPlan } from "./studyPreferences";
import type { Course, TrackerItem } from "./types";

const item: TrackerItem = { id: "i", path: "CARD 101/Week 1", label: "Renal", kind: "Lecture", passes: 0, ankiPasses: 0, yield: "high", updated: "2026-08-01T00:00:00Z" };
const course: Course = { id: "c", termId: "t", code: "CARD 101", name: "Cardiology", files: 0, modules: [], studyPlanOverride: { lecturePasses: 3 } };

describe("study workflow resolution", () => {
  it("resolves learner, course, kind, and item layers in order", () => {
    const plan = resolveStudyPlan({ configured: true, lecturePasses: 2, methods: [{ id: "anki", enabled: true }], itemKindDefaults: { Lecture: { reviewAfterDays: 4 } } }, course, { ...item, studyPlanOverride: { lecturePasses: 1, methods: [{ id: "anki", enabled: false }, { id: "notes", enabled: true }] } });
    expect(plan.lecturePasses).toBe(1);
    expect(plan.reviewAfterDays).toBe(4);
    expect(plan.methods.find((method) => method.id === "anki")?.enabled).toBe(false);
    expect(plan.methods.find((method) => method.id === "notes")?.enabled).toBe(true);
    expect(plan.sources).toEqual(["learner defaults", "course override", "item-kind default", "item override"]);
  });

  it("preserves bounded free text and rejects unknown methods", () => {
    const normalized = normalizeStudyWorkflow({ configured: true, customContext: "x".repeat(700), methods: [{ id: "anki", enabled: true }, { id: "telepathy", enabled: true }] });
    expect(normalized.customContext).toHaveLength(500);
    expect(normalized.methods).toEqual([{ id: "anki", enabled: true, label: undefined, timing: undefined }]);
  });
});

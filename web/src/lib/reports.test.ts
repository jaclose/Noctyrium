import { describe, expect, it } from "vitest";
import { makeDailyRequirement } from "./dailySuccess";
import { buildCanonicalReportSummary, reportDateKeys } from "./reports";
import { makeSeed } from "./seed";
import type { StudyLog } from "./types";

const TODAY = "2026-07-12";

function log(id: string, dayKey: string, minutes: number): StudyLog {
  return { id, dayKey, ts: `${dayKey}T12:00:00.000Z`, type: "Study", minutes, cards: 0, academic: true, productive: true };
}

describe("canonical reports", () => {
  it("anchors ranges to the active day and never includes future dates", () => {
    expect(reportDateKeys(TODAY, 3)).toEqual(["2026-07-10", "2026-07-11", TODAY]);
  });

  it("does not create pre-creation failures or denominator days", () => {
    const state = makeSeed();
    state.activeDayKey = TODAY;
    state.profile.dailySuccess = {
      version: 1,
      configuredAt: "2026-07-11",
      requirements: [makeDailyRequirement({
        id: "minutes", label: "Study", source: { kind: "study-minutes" }, target: 30,
        unit: "minutes", trackingStartsAt: "2026-07-11",
      }, "2026-07-11")],
    };
    state.logs = [log("old", "2026-07-01", 60), log("current", TODAY, 15)];
    const summary = buildCanonicalReportSummary(state, 14);
    expect(summary.observedDates).toEqual(["2026-07-11", TODAY]);
    expect(summary.eligibleDates).toEqual(["2026-07-11", TODAY]);
    expect(summary.scoredDates).toEqual(["2026-07-11"]);
    expect(summary.metrics.consistency.denominator).toBe(1);
    expect(summary.metrics["daily-success"].denominator).toBe(1);
    expect(summary.metrics.study.sourceRecordIds).toEqual(["current"]);
  });

  it("exposes useful denominators and source record provenance", () => {
    const state = makeSeed();
    state.activeDayKey = TODAY;
    state.profile.dailySuccess = {
      version: 1,
      configuredAt: "2026-07-10",
      requirements: [makeDailyRequirement({
        id: "minutes", label: "Study", source: { kind: "study-minutes" }, target: 30,
        unit: "minutes", trackingStartsAt: "2026-07-10",
      }, "2026-07-10")],
    };
    state.logs = [log("a", "2026-07-10", 30), log("b", "2026-07-11", 45)];
    const summary = buildCanonicalReportSummary(state, 14);
    expect(summary.metrics.consistency).toMatchObject({ numerator: 2, denominator: 2, value: "100%" });
    expect(summary.metrics["daily-success"]).toMatchObject({ numerator: 2, denominator: 2, value: "100%" });
    expect(summary.metrics["daily-success"].sourceRecordIds).toEqual(["a", "b"]);
    expect(summary.metrics.consistency.calculation).toContain("eligible days");
  });

  it("keeps an unconfigured new workspace neutral instead of claiming failures", () => {
    const state = makeSeed();
    state.activeDayKey = TODAY;
    state.profile.dailySuccess = { version: 1, configuredAt: TODAY, requirements: [] };
    state.logs = [];
    const summary = buildCanonicalReportSummary(state, 30);
    expect(summary.eligibleDates).toEqual([]);
    expect(summary.scoredDates).toEqual([]);
    expect(summary.metrics.consistency).toMatchObject({ state: "neutral", denominator: 0, note: "0/0 completed eligible days had activity" });
    expect(summary.metrics["daily-success"]).toMatchObject({ state: "neutral", value: "Not configured", denominator: 0 });
    expect(summary.metrics.streak.value).toBe("Building");
  });

  it("excludes off-schedule weekdays from eligible denominators", () => {
    const state = makeSeed();
    state.activeDayKey = TODAY; // Sunday
    state.profile.dailySuccess = {
      version: 1,
      configuredAt: "2026-07-06",
      requirements: [makeDailyRequirement({
        id: "weekday-minutes", label: "Weekday study", source: { kind: "study-minutes" }, target: 30,
        unit: "minutes", schedule: { kind: "weekdays", weekdays: [1, 2, 3, 4, 5] }, trackingStartsAt: "2026-07-06",
      }, "2026-07-06")],
    };
    state.logs = [log("mon", "2026-07-06", 30), log("tue", "2026-07-07", 30), log("sun", TODAY, 90)];
    const summary = buildCanonicalReportSummary(state, 7);
    expect(summary.eligibleDates).toEqual(["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10"]);
    expect(summary.scoredDates).toEqual(summary.eligibleDates);
    expect(summary.metrics.consistency).toMatchObject({ numerator: 2, denominator: 5, value: "40%" });
    expect(summary.metrics["daily-success"]).toMatchObject({ numerator: 2, denominator: 5, value: "40%" });
  });

  it("nets signed study corrections per day while retaining source provenance", () => {
    const state = makeSeed();
    state.activeDayKey = TODAY;
    state.profile.dailySuccess = { version: 1, configuredAt: TODAY, requirements: [] };
    state.logs = [log("add", TODAY, 60), log("correction", TODAY, -20)];
    const summary = buildCanonicalReportSummary(state, 14);
    expect(summary.metrics.study).toMatchObject({ numerator: 40, note: expect.stringContaining("40 minutes") });
    expect(summary.metrics.study.calculation).toContain("signed corrections");
    expect(summary.metrics.study.sourceRecordIds).toEqual(["add", "correction"]);
  });

  it("uses each tracker kind's canonical completion target for mastery", () => {
    const state = makeSeed();
    state.activeDayKey = TODAY;
    state.profile.dailySuccess = { version: 1, configuredAt: TODAY, requirements: [] };
    state.tracker = [
      { id: "pq", path: "Course", label: "Questions", kind: "PQ", passes: 3, ankiPasses: 0, yield: "none", updated: "" },
      { id: "requirement", path: "Course", label: "Requirement", kind: "Requirement", passes: 1, ankiPasses: 0, yield: "none", updated: "" },
      { id: "reading", path: "Course", label: "Reading", kind: "Reading", passes: 2, ankiPasses: 0, yield: "low", updated: "" },
      { id: "lecture", path: "Course", label: "Lecture", kind: "Lecture", passes: 4, ankiPasses: 0, yield: "high", updated: "" },
    ];
    const mastery = buildCanonicalReportSummary(state, 14).metrics["tracker-mastery"];
    expect(mastery).toMatchObject({ numerator: 4, denominator: 4, value: "100%", note: "4 completed · 0 active" });
  });

  it("separates mastery, review, Anki linkage, and in-period task states", () => {
    const state = makeSeed();
    state.activeDayKey = TODAY;
    state.logs = [];
    state.profile.dailySuccess = { version: 1, configuredAt: TODAY, requirements: [] };
    state.tracker = [
      { id: "done", path: "Course", label: "Done", kind: "Lecture", passes: 4, ankiPasses: 1, yield: "none", updated: "" },
      { id: "active", path: "Course", label: "Active", kind: "Lecture", passes: 1, ankiPasses: 0, yield: "review", updated: "" },
    ];
    state.tasks = [
      { id: "complete", title: "Done", done: true, created: "", completedAt: `${TODAY}T10:00:00.000Z` },
      { id: "due", title: "Due", done: false, created: "", due: "2026-07-11" },
      { id: "archived", title: "Archived", done: false, archived: true, created: "", due: "2026-07-11" },
    ];
    const summary = buildCanonicalReportSummary(state, 14);
    expect(summary.metrics["tracker-mastery"].calculation).toContain("2 reviewed; 1 Anki-linked");
    expect(summary.metrics.tasks).toMatchObject({ value: "1/2", note: "1 completed · 1 due · 1 overdue" });
    expect(summary.metrics.tasks.sourceRecordIds).toEqual(["complete", "due"]);
  });
});

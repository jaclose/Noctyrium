import { describe, expect, it } from "vitest";
import { evaluateDailySuccess, makeDailyRequirement, normalizeDailySuccessConfig, type DailySuccessState } from "./dailySuccess";
import type { DailySuccessRequirement, Habit, HabitEntry, StudyLog } from "./types";

const TODAY = "2026-07-12";

function requirement(partial: Partial<DailySuccessRequirement> = {}): DailySuccessRequirement {
  const base = makeDailyRequirement({
    id: "minutes",
    label: "Focused study",
    source: { kind: "study-minutes" },
    target: 60,
    unit: "minutes",
    trackingStartsAt: TODAY,
    createdAt: "2026-07-12T12:00:00.000Z",
    updatedAt: "2026-07-12T12:00:00.000Z",
  }, TODAY);
  return { ...base, ...partial };
}

function state(requirements: DailySuccessRequirement[] | undefined, logs: StudyLog[] = []): DailySuccessState {
  return {
    profile: {
      name: "Test",
      userId: "test",
      versionLabel: "test",
      tagline: "",
      dailyCardTarget: 120,
      dailyMinuteTarget: 240,
      onboarded: true,
      focusSubscriptions: [],
      ...(requirements === undefined ? {} : {
        dailySuccess: { version: 1, configuredAt: TODAY, requirements },
      }),
    },
    logs,
    productivityTrackers: [],
    habits: [],
    habitEntries: [],
    closeouts: [],
    activeDayKey: TODAY,
  };
}

function log(partial: Partial<StudyLog>): StudyLog {
  return {
    id: partial.id ?? crypto.randomUUID(),
    dayKey: TODAY,
    ts: "2026-07-12T12:00:00.000Z",
    type: "Study",
    minutes: 0,
    cards: 0,
    ...partial,
  };
}

describe("daily success", () => {
  it("keeps a configured day neutral when no requirement is selected", () => {
    const result = evaluateDailySuccess(state([]));
    expect(result.mode).toBe("configured");
    expect(result.status).toBe("neutral");
    expect(result.statusLabel).toBe("No requirements selected");
  });

  it("does not call a blank current day a failure", () => {
    const result = evaluateDailySuccess(state([requirement()]));
    expect(result.status).toBe("neutral");
    expect(result.requirements[0].status).toBe("awaiting");
    expect(result.statusLabel).toBe("Awaiting first activity");
  });

  it("evaluates only enabled, eligible requirements", () => {
    const future = requirement({ id: "future", trackingStartsAt: "2026-07-13" });
    const disabled = requirement({ id: "disabled", enabled: false });
    const active = requirement({ id: "active", target: 30 });
    const result = evaluateDailySuccess(state([future, disabled, active], [log({ minutes: 15 })]));
    expect(result.eligibleCount).toBe(1);
    expect(result.progress).toBe(50);
    expect(result.requirements.map((item) => item.status)).toEqual(["not-eligible", "not-eligible", "in-progress"]);
  });

  it("supports selected weekdays without creating off-day misses", () => {
    const weekdays = requirement({ schedule: { kind: "weekdays", weekdays: [1, 2, 3, 4, 5] } });
    const result = evaluateDailySuccess(state([weekdays])); // Sunday
    expect(result.eligibleCount).toBe(0);
    expect(result.requirements[0].status).toBe("not-eligible");
    expect(result.statusLabel).toBe("No requirements scheduled today");
  });

  it("distinguishes an unavailable selected source from an explicit empty configuration", () => {
    const linked = requirement({ source: { kind: "habit", habitId: "removed" } });
    expect(evaluateDailySuccess(state([linked])).statusLabel).toBe("Requirement source unavailable");
    expect(evaluateDailySuccess(state([])).statusLabel).toBe("No requirements selected");
  });

  it("counts practice-question quantities independently from cards", () => {
    const questions = requirement({
      id: "questions",
      label: "Practice questions",
      source: { kind: "practice-questions" },
      target: 30,
      unit: "questions",
    });
    const result = evaluateDailySuccess(state([questions], [
      log({ quantityKind: "questions", quantity: 20, type: "Question block" }),
      log({ cards: 100, quantityKind: "cards", quantity: 100, type: "Anki" }),
    ]));
    expect(result.requirements[0].current).toBe(20);
    expect(result.progress).toBe(67);
  });

  it("nets signed minute and card corrections before clamping observations", () => {
    const cards = requirement({
      id: "cards",
      source: { kind: "cards-reviewed" },
      target: 100,
      unit: "cards",
    });
    const current = state([requirement(), cards], [
      log({ id: "minutes-add", minutes: 60 }),
      log({ id: "minutes-correction", minutes: -30 }),
      log({ id: "cards-add", cards: 100, type: "Cards" }),
      log({ id: "cards-correction", cards: -60, type: "Cards correction" }),
    ]);
    const result = evaluateDailySuccess(current);
    expect(result.requirements[0]).toMatchObject({ current: 30, status: "in-progress" });
    expect(result.requirements[0].sourceRecordIds).toEqual(["minutes-add", "minutes-correction"]);
    expect(result.requirements[1]).toMatchObject({ current: 40, status: "in-progress" });
    expect(result.requirements[1].sourceRecordIds).toEqual(["cards-add", "cards-correction"]);
  });

  it("nets modern card quantities while retaining legacy card fallback", () => {
    const cards = requirement({
      id: "cards",
      source: { kind: "cards-reviewed" },
      target: 100,
      unit: "cards",
    });
    const result = evaluateDailySuccess(state([cards], [
      log({ id: "modern-add", cards: 80, quantity: 80, quantityKind: "cards" }),
      log({ id: "modern-correction", cards: -25, quantity: -25, quantityKind: "cards" }),
      log({ id: "legacy-add", cards: 20 }),
    ]));
    expect(result.requirements[0]).toMatchObject({ current: 75, status: "in-progress" });
    expect(result.requirements[0].sourceRecordIds).toEqual(["modern-add", "modern-correction", "legacy-add"]);
  });

  it("handles a weekly habit fairly and never backfills before creation", () => {
    const weekly = requirement({
      id: "gym",
      label: "Gym",
      source: { kind: "habit", habitId: "gym-habit" },
      target: 1,
      unit: "visit",
      schedule: { kind: "times-per-week", times: 4, weekStartsOn: 1 },
      trackingStartsAt: "2026-07-08",
    });
    const habit: Habit = {
      id: "gym-habit",
      name: "Gym",
      type: "weekly",
      weeklyTarget: 4,
      createdAt: "2026-07-08T12:00:00.000Z",
      updatedAt: "2026-07-08T12:00:00.000Z",
    };
    const entries: HabitEntry[] = ["2026-07-08", "2026-07-09", "2026-07-11"].map((date, index) => ({
      id: `entry-${index}`,
      habitId: habit.id,
      date,
      status: "done",
      createdAt: `${date}T12:00:00.000Z`,
    }));
    const current = state([weekly]);
    current.habits = [habit];
    current.habitEntries = entries;
    expect(evaluateDailySuccess(current).requirements[0]).toMatchObject({ current: 3, target: 4, status: "in-progress" });
    expect(evaluateDailySuccess(current, "2026-07-07").requirements[0].status).toBe("not-eligible");
  });

  it("prorates a newly-created weekly quota to the opportunities left in its first week", () => {
    const weekly = requirement({
      id: "new-gym",
      source: { kind: "habit", habitId: "new-gym-habit" },
      target: 1,
      unit: "visit",
      schedule: { kind: "times-per-week", times: 4, weekStartsOn: 1 },
      trackingStartsAt: "2026-07-11", // Saturday, two days remain in a Mon–Sun week
    });
    const current = state([weekly]);
    current.habits = [{
      id: "new-gym-habit", name: "Gym", type: "weekly", weeklyTarget: 4,
      createdAt: "2026-07-11T12:00:00.000Z", updatedAt: "2026-07-11T12:00:00.000Z",
    }];
    current.habitEntries = ["2026-07-11", TODAY].map((date, index) => ({
      id: `new-entry-${index}`, habitId: "new-gym-habit", date, status: "done", createdAt: `${date}T12:00:00.000Z`,
    }));
    expect(evaluateDailySuccess(current).requirements[0]).toMatchObject({ current: 2, target: 2, status: "met" });
  });

  it("scores a weekly quota once at the historical week boundary, not on every prior day", () => {
    const weekly = requirement({
      id: "weekly-reading",
      source: { kind: "habit", habitId: "reading-habit" },
      target: 1,
      unit: "session",
      schedule: { kind: "times-per-week", times: 2, weekStartsOn: 1 },
      trackingStartsAt: "2026-06-29",
    });
    const current = state([weekly]);
    current.habits = [{ id: "reading-habit", name: "Reading", type: "weekly", weeklyTarget: 2, createdAt: "2026-06-29T12:00:00.000Z", updatedAt: "2026-06-29T12:00:00.000Z" }];
    current.habitEntries = ["2026-06-30", "2026-07-03"].map((date, index) => ({ id: `read-${index}`, habitId: "reading-habit", date, status: "done", createdAt: `${date}T12:00:00.000Z` }));

    expect(evaluateDailySuccess(current, "2026-07-01", TODAY).requirements[0].status).toBe("not-eligible");
    expect(evaluateDailySuccess(current, "2026-07-05", TODAY).requirements[0]).toMatchObject({ eligible: true, current: 2, target: 2, status: "met" });
  });

  it("reports removed linked sources as unavailable without deleting history", () => {
    const linked = requirement({ source: { kind: "habit", habitId: "removed" } });
    const current = state([linked]);
    current.habitEntries = [{
      id: "preserved",
      habitId: "removed",
      date: TODAY,
      status: "done",
      createdAt: "2026-07-12T12:00:00.000Z",
    }];
    const result = evaluateDailySuccess(current);
    expect(result.requirements[0].status).toBe("unavailable");
    expect(current.habitEntries).toHaveLength(1);
  });

  it("preserves the legacy adapter when configuration is absent", () => {
    const result = evaluateDailySuccess(state(undefined, [log({ minutes: 240 })]));
    expect(result.mode).toBe("legacy");
    expect(result.requirements.map((item) => item.requirement.id)).toEqual([
      "legacy-study-minutes",
      "legacy-cards-reviewed",
    ]);
    expect(result.progress).toBe(50);
  });

  it("does not invent a legacy miss when a no-log workspace views a historical day", () => {
    const result = evaluateDailySuccess(state(undefined), "2026-07-11", TODAY);
    expect(result.mode).toBe("legacy");
    expect(result.status).toBe("neutral");
    expect(result.eligibleCount).toBe(0);
    expect(result.requirements.every((item) => item.status === "not-eligible")).toBe(true);
  });

  it("normalizes malformed values without NaN, negatives, or duplicate IDs", () => {
    const normalized = normalizeDailySuccessConfig({
      version: 1,
      configuredAt: TODAY,
      requirements: [
        { ...requirement(), target: Number.NaN },
        { ...requirement(), target: -10 },
      ],
    });
    expect(normalized?.requirements).toHaveLength(1);
    expect(normalized?.requirements[0].target).toBe(1);
    expect(Number.isFinite(normalized?.requirements[0].target)).toBe(true);
  });
});

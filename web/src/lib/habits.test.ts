import { describe, it, expect } from "vitest";
import type { Habit, HabitEntry, HabitCheckStatus, HabitType } from "./types";
import {
  isScheduledDay,
  entryFor,
  statusOn,
  currentStreak,
  weekStats,
  heatmapCells,
  recoveryMessage,
  newHabitDefaults,
  HABIT_TYPE_META,
} from "./habits";
import { addLocalDays } from "./dailyRollover";

const TODAY = "2026-06-25"; // Thursday (getDay === 4)

function habit(partial: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    name: "Test habit",
    type: "binary",
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

let ec = 0;
function entry(date: string, status: HabitCheckStatus, habitId = "h1"): HabitEntry {
  return { id: `e${ec++}`, habitId, date, status, createdAt: "" };
}

/** Build a run of statuses ending on `end` going backwards. */
function chain(end: string, statuses: HabitCheckStatus[]): HabitEntry[] {
  return statuses.map((status, i) => entry(addLocalDays(end, -i), status));
}

describe("metadata + scheduling", () => {
  it("exposes meta for every habit type", () => {
    (Object.keys(HABIT_TYPE_META) as HabitType[]).forEach((t) => {
      expect(HABIT_TYPE_META[t].label).toBeTruthy();
    });
  });
  it("treats every day as scheduled unless a schedule is set", () => {
    expect(isScheduledDay(habit(), TODAY)).toBe(true);
  });
  it("respects a weekday schedule", () => {
    const h = habit({ type: "scheduled", schedule: [4] }); // Thursdays only
    expect(isScheduledDay(h, TODAY)).toBe(true); // 2026-06-25 is Thu
    expect(isScheduledDay(h, "2026-06-26")).toBe(false); // Fri
  });
});

describe("entryFor / statusOn", () => {
  const entries = [entry(TODAY, "done"), entry("2026-06-24", "missed")];
  it("finds the entry for a date", () => {
    expect(entryFor(entries, "h1", TODAY)?.status).toBe("done");
  });
  it("returns none when no entry exists", () => {
    expect(statusOn(habit(), entries, "2026-06-20")).toBe("none");
  });
});

describe("currentStreak", () => {
  it("counts a consecutive done chain", () => {
    expect(currentStreak(habit(), chain(TODAY, ["done", "done", "done"]), TODAY)).toBe(3);
  });
  it("does not break when today is still unlogged", () => {
    // today empty, prior 3 days done
    const entries = chain("2026-06-24", ["done", "done", "done"]);
    expect(currentStreak(habit(), entries, TODAY)).toBe(3);
  });
  it("breaks on an explicit miss", () => {
    expect(currentStreak(habit(), chain(TODAY, ["done", "done", "missed", "done"]), TODAY)).toBe(2);
  });
  it("holds (but does not increment) through an intentional skip", () => {
    expect(currentStreak(habit(), chain(TODAY, ["done", "skipped", "done", "done"]), TODAY)).toBe(3);
  });
  it("counts a partial toward the streak", () => {
    expect(currentStreak(habit(), chain(TODAY, ["partial", "done"]), TODAY)).toBe(2);
  });
  it("breaks on an unlogged past scheduled day", () => {
    // today done, yesterday done, then a gap (nothing logged) two days back
    const entries = [entry(TODAY, "done"), entry("2026-06-24", "done")];
    expect(currentStreak(habit(), entries, TODAY)).toBe(2);
  });
  it("never breaks for a recovery habit", () => {
    const h = habit({ type: "recovery" });
    expect(currentStreak(h, chain(TODAY, ["done", "missed", "done"]), TODAY)).toBe(2);
  });
});

describe("weekStats", () => {
  it("computes adherence with partial at half and skips excluded", () => {
    const dates = Array.from({ length: 7 }, (_, i) => addLocalDays(TODAY, -i));
    const entries = [
      entry(dates[0], "done"),
      entry(dates[1], "done"),
      entry(dates[2], "partial"),
      entry(dates[3], "skipped"),
      entry(dates[4], "missed"),
      entry(dates[5], "done"),
      entry(dates[6], "done"),
    ];
    const stats = weekStats(habit(), entries, dates);
    expect(stats.done).toBe(4);
    expect(stats.partial).toBe(1);
    expect(stats.skipped).toBe(1);
    expect(stats.missed).toBe(1);
    expect(stats.scheduledDays).toBe(7);
    // (4 + 0.5) / (7 - 1 skipped) = 4.5/6 = 75%
    expect(stats.adherence).toBe(75);
  });
});

describe("heatmapCells", () => {
  it("returns the requested number of cells ending today", () => {
    const cells = heatmapCells(habit(), [entry(TODAY, "done")], 35, TODAY);
    expect(cells).toHaveLength(35);
    expect(cells[cells.length - 1].date).toBe(TODAY);
    expect(cells[cells.length - 1].intensity).toBe(1);
    expect(cells[0].intensity).toBe(0);
  });
});

describe("recoveryMessage", () => {
  it("is gentle and non-punitive after a miss", () => {
    const entries = [entry(addLocalDays(TODAY, -1), "missed")];
    expect(recoveryMessage(habit(), entries, TODAY).toLowerCase()).toContain("restart");
  });
  it("acknowledges a long streak without grinding language", () => {
    const entries = chain(TODAY, Array(10).fill("done"));
    expect(recoveryMessage(habit(), entries, TODAY).toLowerCase()).toContain("steady");
  });
  it("honors exam mode", () => {
    expect(recoveryMessage(habit({ examMode: true }), [], TODAY).toLowerCase()).toContain("exam mode");
  });
});

describe("newHabitDefaults", () => {
  it("sets a target only for target-based types", () => {
    expect(newHabitDefaults("Read", "binary").target).toBeUndefined();
    expect(newHabitDefaults("Study", "duration").target).toBe(20);
    expect(newHabitDefaults("Pushups", "count").unit).toBe("reps");
    expect(newHabitDefaults("Gym", "weekly").weeklyTarget).toBe(3);
  });
});

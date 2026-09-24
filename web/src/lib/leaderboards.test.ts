import { describe, expect, it } from "vitest";
import type { StudyLog } from "./types";
import { personalActivityWeeks, rankPersonalWeeks } from "./leaderboards";

const log = (id: string, dayKey: string, minutes = 60, cards = 10, academic = true): StudyLog => ({ id, dayKey, minutes, cards, academic } as StudyLog);
const now = new Date(2026, 8, 22, 12);
describe("personal standings", () => {
  it("uses complete Monday–Sunday periods and separates the current week", () => {
    const weeks = personalActivityWeeks([log("sunday", "2026-09-20"), log("monday", "2026-09-21")], now);
    expect(weeks).toHaveLength(9);
    expect(weeks[0]).toMatchObject({ start: "2026-09-21", end: "2026-09-27", current: true, activeDays: 1 });
    expect(rankPersonalWeeks(weeks, "activeDays")).toMatchObject([{ start: "2026-09-14", rank: 1 }]);
  });
  it("excludes future and nonacademic logs, duplicates, invalid values and empty weeks", () => {
    const entry = log("one", "2026-09-15");
    const weeks = personalActivityWeeks([entry, entry, log("private", "2026-09-16", 90, 30, false), log("future", "2026-09-26"), log("invalid", "2026-09-16", NaN, -3)], now);
    expect(weeks[1]).toMatchObject({ activeDays: 1, minutes: 60, cards: 10 });
    expect(weeks[0].minutes).toBe(0);
    expect(rankPersonalWeeks(weeks, "minutes")).toHaveLength(1);
  });
  it("uses deterministic shared ranks for ties and preserves original totals", () => {
    const weeks = personalActivityWeeks([log("a", "2026-09-15", 60), log("b", "2026-09-08", 60), log("c", "2026-09-01", 30)], now);
    expect(rankPersonalWeeks(weeks, "minutes").map(week => week.rank)).toEqual([1, 1, 3]);
    expect(rankPersonalWeeks(weeks, "minutes").map(week => week.start)).toEqual(["2026-09-14", "2026-09-07", "2026-08-31"]);
    expect(weeks[0].current).toBe(true);
  });
});

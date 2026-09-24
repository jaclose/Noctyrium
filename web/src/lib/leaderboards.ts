import type { StudyLog } from "./types";
import { isoDate } from "./scoring";

export type PersonalBoardMetric = "activeDays" | "cards" | "minutes";
export interface ActivityWeek { start: string; end: string; activeDays: number; cards: number; minutes: number; current: boolean; }

/** Local Monday–Sunday weeks. Do not rank partial weeks against full ones. */
export function personalActivityWeeks(logs: StudyLog[], now = new Date()): ActivityWeek[] {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const today = isoDate(now);
  const weeks: ActivityWeek[] = [];
  const days = new Map<string, { minutes: number; cards: number }>();
  const ids = new Set<string>();
  for (const log of logs) {
    if (ids.has(log.id) || log.academic === false || log.dayKey > today) continue;
    ids.add(log.id);
    const day = days.get(log.dayKey) ?? { minutes: 0, cards: 0 };
    day.minutes += Number.isFinite(log.minutes) ? Math.max(0, log.minutes) : 0;
    day.cards += Number.isFinite(log.cards) ? Math.max(0, log.cards) : 0;
    days.set(log.dayKey, day);
  }
  for (let offset = 0; offset < 9; offset++) {
    const start = new Date(monday); start.setDate(start.getDate() - offset * 7);
    const end = new Date(start); end.setDate(end.getDate() + 6);
    const week: ActivityWeek = { start: isoDate(start), end: isoDate(end), activeDays: 0, cards: 0, minutes: 0, current: offset === 0 };
    for (let index = 0; index < 7; index++) {
      const date = new Date(start); date.setDate(date.getDate() + index);
      const day = days.get(isoDate(date));
      if (!day) continue;
      if (day.minutes > 0 || day.cards > 0) week.activeDays++;
      week.cards += day.cards; week.minutes += day.minutes;
    }
    weeks.push(week);
  }
  return weeks;
}

export function rankPersonalWeeks(weeks: ActivityWeek[], metric: PersonalBoardMetric) {
  const ranked = weeks.filter(week => !week.current && week[metric] > 0)
    .sort((a, b) => b[metric] - a[metric] || b.start.localeCompare(a.start));
  let rank = 0;
  return ranked.map((week, index) => {
    if (index === 0 || week[metric] !== ranked[index - 1][metric]) rank = index + 1;
    return { ...week, rank };
  });
}

export function normalizeTrackerPath(input: string): string {
  return input
    .split("/")
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join("/");
}

export function trackerPathKey(input: string): string {
  return normalizeTrackerPath(input).toLowerCase();
}

export function canonicalTrackerPath(input: string, existingPaths: string[]): string {
  const clean = normalizeTrackerPath(input);
  if (!clean) return "";
  const key = trackerPathKey(clean);
  return existingPaths.find((path) => trackerPathKey(path) === key) ?? clean;
}

export function trackerItemKey(path: string, label: string): string {
  return `${trackerPathKey(path)}::${label.trim().replace(/\s+/g, " ").toLowerCase()}`;
}

export interface WeekLabelMatch {
  label: string;
  normalizedWeekNumber?: number;
}

const WEEK_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

export function detectWeekLabel(value: string): WeekLabelMatch | null {
  const clean = value.trim().replace(/\s+/g, " ");
  if (!clean) return null;
  const numeric = clean.match(/\b(?:week|wk|w)\s*0*(\d{1,2})\b/i);
  if (numeric) return { label: clean, normalizedWeekNumber: Number(numeric[1]) };
  const word = clean.match(/\bweek\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i);
  if (word) return { label: clean, normalizedWeekNumber: WEEK_WORDS[word[1].toLowerCase()] };
  return null;
}

export function splitLeadingWeekLabel(line: string): { week?: WeekLabelMatch; label: string } {
  const clean = line.trim();
  const match = clean.match(/^((?:(?:block|term|t)\s*\d+\s+)?(?:week|wk|w)\s*(?:0*\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve))\s*(?:[:|–—-]\s+|\s{2,})(.+)$/i);
  if (!match) return { label: clean };
  const week = detectWeekLabel(match[1]);
  return week ? { week, label: match[2].trim() } : { label: clean };
}

export function appendWeekToPath(basePath: string, weekLabel?: string): string {
  const cleanBase = normalizeTrackerPath(basePath);
  const cleanWeek = weekLabel ? normalizeTrackerPath(weekLabel) : "";
  if (!cleanWeek) return cleanBase;
  const baseKey = trackerPathKey(cleanBase);
  const weekKey = trackerPathKey(cleanWeek);
  if (baseKey.endsWith(`/${weekKey}`) || baseKey === weekKey) return cleanBase;
  return normalizeTrackerPath(`${cleanBase}/${cleanWeek}`);
}

export function compareTrackerPathSegment(a: string, b: string): number {
  const wa = detectWeekLabel(a);
  const wb = detectWeekLabel(b);
  if (wa?.normalizedWeekNumber && wb?.normalizedWeekNumber && wa.normalizedWeekNumber !== wb.normalizedWeekNumber) {
    return wa.normalizedWeekNumber - wb.normalizedWeekNumber;
  }
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

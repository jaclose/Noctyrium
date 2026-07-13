const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isCalendarDateKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATE_KEY.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  return day <= daysInMonth(year, month);
}

export function isNextCalendarDate(previous: string, next: string): boolean {
  const parsed = parseCalendarDate(previous);
  if (!parsed || !isCalendarDateKey(next)) return false;
  const advanced = nextCalendarDate(parsed.year, parsed.month, parsed.day);
  return formatCalendarDate(advanced.year, advanced.month, advanced.day) === next;
}

function parseCalendarDate(value: string): { year: number; month: number; day: number } | undefined {
  if (!isCalendarDateKey(value)) return undefined;
  const [, year, month, day] = DATE_KEY.exec(value) ?? [];
  return { year: Number(year), month: Number(month), day: Number(day) };
}

function nextCalendarDate(year: number, month: number, day: number) {
  if (day < daysInMonth(year, month)) return { year, month, day: day + 1 };
  if (month < 12) return { year, month: month + 1, day: 1 };
  return { year: year + 1, month: 1, day: 1 };
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function formatCalendarDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

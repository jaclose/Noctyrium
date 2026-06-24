// ===========================================================================
// Scoring + date logic, ported from MedicalSchoolHub.swift
// (todayGrade, noctyriumDateKey, Heatmap.color). Pure functions, no I/O —
// this replaces the macOS shell-out (dashboard_stats.sh).
// ===========================================================================
import type { StudyLog } from "./types";

export type Grade = "blue" | "green" | "orange" | "red";

/** todayGrade(minutes, cards) from the Swift source. */
export function todayGrade(minutes: number, cards: number): Grade {
  if (minutes >= 480 || cards >= 350) return "blue";
  if (minutes >= 360 || cards >= 250) return "green";
  if (minutes >= 300 || cards >= 150) return "orange";
  return "red";
}

export function gradeLabel(g: Grade): string {
  return g === "blue" ? "👑 Blue" : g[0].toUpperCase() + g.slice(1);
}

export function gradeColor(g: Grade): string {
  return {
    blue: "var(--grade-blue)",
    green: "var(--grade-green)",
    orange: "var(--grade-orange)",
    red: "var(--grade-red)",
  }[g];
}

/** Heatmap cell fill — mirrors Heatmap.color(minutes:cards:). */
export function heatColor(minutes: number, cards: number): string {
  if (minutes >= 480 || cards >= 350) return "rgba(77,141,255,0.88)";
  if (minutes >= 360 || cards >= 250) return "rgba(70,210,126,0.78)";
  if (minutes >= 300 || (cards >= 150 && cards <= 200)) return "rgba(255,159,67,0.82)";
  if (minutes > 0 || cards > 0) return "rgba(255,85,99,0.8)";
  return "rgba(255,255,255,0.055)";
}

/**
 * Legacy Noctyrium study-day key: the calendar day shifted back 4 hours.
 * New dashboard rollover uses plain local calendar dates via isoDate().
 */
export function dayKey(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() - 4 * 60 * 60 * 1000);
  return isoDate(shifted);
}

/** Plain calendar-day key (yyyy-MM-dd) in local time — used by the heatmap. */
export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function nextDayKey(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + 1);
  return isoDate(dt);
}

/** Totals for a given study day from the log. */
export function dayTotals(logs: StudyLog[], key: string) {
  let minutes = 0;
  let cards = 0;
  for (const l of logs) {
    if (l.dayKey === key && l.academic !== false) {
      minutes += l.minutes;
      cards += l.cards;
    }
  }
  return { minutes: Math.max(0, minutes), cards: Math.max(0, cards) };
}

export function productiveTotals(logs: StudyLog[], key: string) {
  let minutes = 0;
  let cards = 0;
  for (const l of logs) {
    if (l.dayKey === key && l.productive !== false) {
      minutes += l.minutes;
      cards += l.cards;
    }
  }
  return { minutes: Math.max(0, minutes), cards: Math.max(0, cards) };
}

/** Last `n` calendar days (oldest first) for the heatmap grid. */
export function lastNDays(n: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

/**
 * Consecutive recent days with any logged activity, counting back from today.
 * A "don't break the chain" signal — but capped/sane, not a grind metric.
 */
export function studyStreak(logs: StudyLog[]): number {
  const active = new Set(logs.filter((l) => l.academic !== false && (l.minutes > 0 || l.cards > 0)).map((l) => l.dayKey));
  let streak = 0;
  const d = new Date();
  // allow today to be empty without breaking the streak (you may study later)
  if (!active.has(isoDate(d))) d.setDate(d.getDate() - 1);
  while (active.has(isoDate(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function prettyDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

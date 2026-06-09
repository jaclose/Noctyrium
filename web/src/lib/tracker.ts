// ===========================================================================
// Pass-based mastery model + adaptive "suggested next move" engine.
// Passes drive everything: 0 untouched · 1 red · 2 young · 3 mature · 4+ mastered.
// Anki rounds are a parallel track: 0 off · 1 orange · 2 yellow · 3 purple.
// ===========================================================================
import type { TrackerItem, Yield } from "./types";

export type PassStage = "untouched" | "red" | "young" | "mature" | "mastered";

export function passStage(passes: number): PassStage {
  if (passes <= 0) return "untouched";
  if (passes === 1) return "red";
  if (passes === 2) return "young";
  if (passes === 3) return "mature";
  return "mastered";
}

export const PASS_COLOR: Record<PassStage, string> = {
  untouched: "#38bdf8",
  red: "#ff5563",
  young: "#a3e635", // light green / young
  mature: "#46d27e", // normal green
  mastered: "#10b981", // deep emerald — mastered
};

export const PASS_LABEL: Record<PassStage, string> = {
  untouched: "Untouched", red: "1 pass", young: "Young (2)", mature: "Mature (3)", mastered: "Mastered (4+)",
};

// Anki rounds: orange → yellow → purple
export const ANKI_COLORS = ["#ffa64d", "#ffe14d", "#b07bff"]; // index 0..2 for rounds 1..3
export function ankiColor(round: number): string {
  return ANKI_COLORS[Math.min(Math.max(round, 1), 3) - 1];
}

export function isMature(item: TrackerItem): boolean {
  return item.passes >= 3;
}

export const YIELD_TONE: Record<Yield, "red" | "orange" | "green" | "neutral"> = {
  high: "green", review: "orange", low: "neutral", none: "neutral",
};
export const YIELD_LABEL: Record<Yield, string> = {
  high: "High yield", low: "Low yield", review: "Needs review", none: "Set yield",
};
export const YIELD_CYCLE: Yield[] = ["none", "high", "review", "low"];

// ----- Adaptive suggestion engine -----------------------------------------

export interface Suggestion {
  title: string;
  reason: string;
  color: string;
  itemId?: string;
}

/**
 * Rank what to do next within a set of items. Logic, course-aware, adaptive to
 * how many items exist and their yield. Higher score = more urgent.
 *   needs-review + low passes   → most urgent
 *   high-yield + untouched      → next
 *   untouched (any)             → then
 *   in-progress (1–2 passes)    → push toward mature, high-yield first
 *   mastered (4+)               → never suggested
 */
function targetPasses(it: TrackerItem): number {
  if (it.yield === "low") return 2;
  if (it.yield === "high" || it.yield === "review") return 4;
  return 3;
}

function kindWeight(it: TrackerItem): number {
  if (it.kind === "PQ") return 12;
  if (it.kind === "Lecture") return 9;
  if (it.kind === "DLA") return 7;
  if (it.kind === "Lab") return 4;
  return 3;
}

function scoreItem(it: TrackerItem, scopeSize: number, untouchedRatio: number): number {
  if (it.passes >= 4) return -1; // mastered — done
  const target = targetPasses(it);
  const deficit = Math.max(target - it.passes, 0);
  let s = deficit * 28 + kindWeight(it);
  if (it.yield === "review") s += 80;
  if (it.yield === "high") s += 42;
  if (it.yield === "low") s -= 14;
  if (it.passes === 0) s += 38 + Math.min(scopeSize, 40) * 0.4;
  if (it.passes === 1) s += 30; // red — fragile, push it
  if (it.passes === 2) s += 18; // young — near mature
  if (it.ankiPasses === 0 && it.passes >= 1 && it.yield !== "low") s += 16;
  if (it.ankiPasses < 3 && it.passes >= 3 && it.yield === "high") s += 12;
  s += untouchedRatio * 16;
  return s;
}

/**
 * Build up to `n` suggestions for a scoped item set.
 * `salt` lets the UI "refresh" to surface alternatives among close ties.
 */
export function suggestMoves(items: TrackerItem[], n = 3, salt = 0): Suggestion[] {
  if (!items.length) {
    return [{ title: "No tracked items yet", reason: "Install a blueprint or import lectures to create the first suggested move.", color: PASS_COLOR.untouched }];
  }
  const live = items.filter((it) => it.passes < 4);
  if (!live.length) {
    return [{ title: "This scope is mastered", reason: "Every item here is at 4+ passes. Pick another scope or protect recovery.", color: PASS_COLOR.mastered }];
  }
  const untouched = live.filter((i) => i.passes === 0).length;
  const untouchedRatio = untouched / Math.max(live.length, 1);

  const ranked = live
    .map((it) => ({ it, score: scoreItem(it, live.length, untouchedRatio) }))
    .sort((a, b) => b.score - a.score || a.it.label.localeCompare(b.it.label));

  // refresh rotates within the top band so ties surface different picks
  const band = ranked.slice(0, Math.min(ranked.length, n + 3));
  const rotated = band.slice(salt % band.length).concat(band.slice(0, salt % band.length));

  const review = live.filter((i) => i.yield === "review").length;

  const out: Suggestion[] = rotated.slice(0, n).map(({ it }) => ({
    title: moveTitle(it),
    reason: moveReason(it, untouched, review),
    color: PASS_COLOR[passStage(it.passes)],
    itemId: it.id,
  }));
  return out;
}

function moveTitle(it: TrackerItem): string {
  if (it.passes === 0) return `Start: ${it.label}`;
  if (it.passes < 3) return `Pass #${it.passes + 1}: ${it.label}`;
  if (it.ankiPasses < 3) return `Anki round #${it.ankiPasses + 1}: ${it.label}`;
  return `Mastery check: ${it.label}`;
}

function moveReason(it: TrackerItem, untouched: number, review: number): string {
  if (it.yield === "review") return "Flagged for review — re-pass before it decays.";
  if (it.passes === 0) return it.yield === "high"
    ? `High-yield and untouched — best ROI (${untouched} untouched in scope).`
    : `Untouched (${untouched} left in this scope).`;
  if (it.passes === 1) return "Only 1 pass (red) — fragile, push toward young.";
  if (it.passes === 2) return "Young — one more pass reaches mature.";
  if (it.ankiPasses === 0) return "Mature in lecture tracker but not anchored in Anki yet.";
  if (review) return "Mature already — refresh cards after the review flags are handled.";
  return "Reinforce with Anki to reach mastery.";
}

/** A compact mastery % for a scope, weighting passes 0..4. */
export function scopeMastery(items: TrackerItem[]): number {
  if (!items.length) return 0;
  const score = items.reduce((a, i) => a + Math.min(i.passes, 4) / 4, 0);
  return Math.round((score / items.length) * 100);
}

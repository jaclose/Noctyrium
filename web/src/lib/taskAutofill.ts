// ===========================================================================
// Repetitive-task autofill (directive §18). Fully local + deterministic: it
// detects when the same task has been typed several times and offers to save it
// as a reusable template with a suggested cadence. It NEVER creates tasks on its
// own — it only returns suggestions for the UI to confirm. No phrase ever leaves
// the device. The whole system can be disabled by the caller.
// ===========================================================================
import type { Task } from "./types";
import { isoDate } from "./scoring";

export type TaskFrequency = "daily" | "weekdays" | "weekly" | "custom";

export interface RecurringTemplate {
  signature: string;
  title: string; // representative original-cased title
  count: number;
  frequency: TaskFrequency;
  scope?: string;
  lastUsed?: string; // ISO
  dates: string[]; // local date keys the task was created on
}

export interface AutofillOptions {
  /** Minimum prior occurrences before a template is considered "recurring". */
  minOccurrences?: number;
}

const STOPWORDS = new Set([
  "a", "an", "the", "to", "of", "for", "on", "in", "at", "and", "my", "me", "i",
  "do", "go", "get", "some", "today", "tomorrow", "please", "up", "with", "this",
]);

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalizeTaskTitle(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Meaningful tokens for grouping/similarity (stopwords + pure numbers removed). */
export function tokenize(raw: string): string[] {
  return normalizeTaskTitle(raw)
    .split(" ")
    .filter((t) => t && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

/** A stable signature so "Go to the gym!" and "go to gym" group together. */
export function taskSignature(raw: string): string {
  const tokens = tokenize(raw);
  return (tokens.length ? tokens : normalizeTaskTitle(raw).split(" ").filter(Boolean)).sort().join(" ");
}

/** Jaccard token overlap, 0–1. */
export function titleSimilarity(a: string, b: string): number {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / (ta.size + tb.size - shared);
}

interface TaskGroup {
  signature: string;
  tasks: Task[];
}

function groupBySignature(tasks: Task[]): TaskGroup[] {
  const byKey = new Map<string, Task[]>();
  for (const task of tasks) {
    if (task.archived) continue;
    const title = task.title?.trim();
    if (!title) continue;
    const sig = taskSignature(title);
    if (!sig) continue;
    const bucket = byKey.get(sig) ?? [];
    bucket.push(task);
    byKey.set(sig, bucket);
  }
  return [...byKey.entries()].map(([signature, list]) => ({ signature, tasks: list }));
}

const MS_DAY = 86_400_000;

/** Infer a cadence from the local creation dates of the matching tasks. */
export function inferFrequency(dates: string[]): TaskFrequency {
  const unique = [...new Set(dates)].sort();
  if (unique.length < 2) return "custom";
  const times = unique.map((d) => new Date(`${d}T12:00:00`).getTime()).filter((t) => Number.isFinite(t));
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) gaps.push(Math.round((times[i] - times[i - 1]) / MS_DAY));
  const sorted = [...gaps].sort((a, b) => a - b);
  const medianGap = sorted[Math.floor(sorted.length / 2)];

  const weekdays = unique.map((d) => new Date(`${d}T12:00:00`).getDay());
  const allWeekdays = weekdays.every((w) => w >= 1 && w <= 5);

  if (medianGap <= 1) return allWeekdays ? "weekdays" : "daily";
  if (medianGap >= 6 && medianGap <= 8) return "weekly";
  if (allWeekdays && medianGap <= 3) return "weekdays";
  return "custom";
}

export const FREQUENCY_LABEL: Record<TaskFrequency, string> = {
  daily: "Daily",
  weekdays: "Weekdays",
  weekly: "Weekly",
  custom: "Custom",
};

function mostCommonScope(tasks: Task[]): string | undefined {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    const scope = t.scope?.trim();
    if (scope) counts.set(scope, (counts.get(scope) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestN = 0;
  for (const [scope, n] of counts) if (n > bestN) { best = scope; bestN = n; }
  return best;
}

function buildTemplate(group: TaskGroup): RecurringTemplate {
  const sorted = [...group.tasks].sort((a, b) => (a.created || "").localeCompare(b.created || ""));
  const dates = sorted.map((t) => isoDate(new Date(t.created || Date.now())));
  // Representative title: the most recent original casing.
  const title = sorted[sorted.length - 1]?.title?.trim() || group.signature;
  return {
    signature: group.signature,
    title,
    count: group.tasks.length,
    frequency: inferFrequency(dates),
    scope: mostCommonScope(group.tasks),
    lastUsed: sorted[sorted.length - 1]?.created,
    dates,
  };
}

/** All templates the user has repeated at least `minOccurrences` (default 3) times. */
export function detectRecurringTemplates(tasks: Task[], opts: AutofillOptions = {}): RecurringTemplate[] {
  const min = opts.minOccurrences ?? 3;
  return groupBySignature(tasks)
    .filter((g) => g.tasks.length >= min)
    .map(buildTemplate)
    .sort((a, b) => b.count - a.count || (b.lastUsed || "").localeCompare(a.lastUsed || ""));
}

const SIMILARITY_THRESHOLD = 0.6;

/**
 * Given the in-progress draft, return a template suggestion if the user has
 * already entered a matching task at least twice before (so this would be the
 * 3rd+ time — "more than twice"). Exact signature match wins; otherwise a high
 * token-overlap match. Returns null when there's nothing worth suggesting.
 */
export function suggestTemplateForDraft(draft: string, tasks: Task[], opts: AutofillOptions = {}): RecurringTemplate | null {
  const priorMin = (opts.minOccurrences ?? 3) - 1; // prior occurrences needed
  const clean = draft.trim();
  if (clean.length < 3 || tokenize(clean).length === 0) return null;
  const draftSig = taskSignature(clean);

  const groups = groupBySignature(tasks).filter((g) => g.tasks.length >= priorMin);
  if (!groups.length) return null;

  const exact = groups.find((g) => g.signature === draftSig);
  if (exact) return buildTemplate(exact);

  let best: { group: TaskGroup; score: number } | null = null;
  for (const group of groups) {
    const score = titleSimilarity(clean, group.tasks[0].title);
    if (score >= SIMILARITY_THRESHOLD && (!best || score > best.score)) best = { group, score };
  }
  return best ? buildTemplate(best.group) : null;
}

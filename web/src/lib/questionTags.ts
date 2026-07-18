// ===========================================================================
// Q2b-3: normalized question tags. A tag's *identity* is its canonical form —
// Unicode-NFC, trimmed, internal whitespace collapsed to single spaces, and
// lowercased. "Cardiology", "cardiology", and " CARDIOLOGY " therefore collapse
// to the one tag "cardiology". Tags are stored canonical on the question record
// (question.tags: string[]) so equality, counting, and filtering never rescan or
// re-case. No separate registry, no duplicated strings.
// ===========================================================================
import type { QuestionRecord } from "./questions";

/** Longest tag we keep — guards against pasted paragraphs becoming "tags". */
export const MAX_TAG_LENGTH = 64;

/** Canonical identity of a single tag. Non-strings and blanks become "". The
 * length cap counts by code point (never splits a surrogate pair) and a final
 * trim keeps the result idempotent when the cap lands on a space. */
export function normalizeTag(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const cleaned = raw.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
  return [...cleaned].slice(0, MAX_TAG_LENGTH).join("").trim();
}

/** Canonical, order-preserving, duplicate-free tag list. Blanks are dropped. */
export function normalizeTagList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    const tag = normalizeTag(item);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

/** Parse a user-typed field (comma / semicolon / newline separated) into tags. */
export function parseTagInput(input: string): string[] {
  return normalizeTagList(input.split(/[,;\n]/));
}

/** Display form. Tags are stored lowercase-canonical; the label is that value.
 * Centralized so a future "preserve capitalization" option has one seam. */
export function formatTagLabel(tag: string): string {
  return tag;
}

export interface TagCount {
  tag: string;
  count: number;
}

/** Every tag in use with its question count, ranked by count then name. Tags on
 * records are already canonical, so this is a single O(questions × tags) pass. */
export function computeTagCounts(questions: readonly QuestionRecord[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const question of questions) {
    for (const tag of question.tags ?? []) {
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Rewrite one question's tags for a merge: every tag in `from` becomes `into`.
 * Re-normalizes so duplicates collapse when `into` already exists. Returns the
 * same-content array reference-identical intent only via value; callers compare. */
export function mergeTagsInList(tags: readonly string[], from: ReadonlySet<string>, into: string): string[] {
  const target = normalizeTag(into);
  if (!target) return normalizeTagList(tags);
  return normalizeTagList(tags.map((tag) => (from.has(tag) ? target : tag)));
}

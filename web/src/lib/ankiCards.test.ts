import { describe, expect, it } from "vitest";
import {
  cardsToAnkiTsv, dueCards, newSchedule, nextSchedule, reviewCardQuality, validateAnkiCard,
  type AnkiCard,
} from "./ankiCards";

const NOW = new Date("2026-07-07T08:00:00.000Z");

function makeCard(patch: Partial<AnkiCard> = {}): AnkiCard {
  return {
    id: crypto.randomUUID(), type: "basic", front: "What activates the classical pathway?",
    back: "Antigen-antibody complexes.", tags: [], aiGenerated: false,
    schedule: newSchedule(NOW), createdAt: NOW.toISOString(), updatedAt: NOW.toISOString(),
    ...patch,
  };
}

describe("card schema validation", () => {
  it("requires a front, and a back for non-cloze", () => {
    expect(validateAnkiCard({ front: "", back: "b" }).ok).toBe(false);
    expect(validateAnkiCard({ front: "f", back: "" }).ok).toBe(false);
    expect(validateAnkiCard({ front: "f", back: "b" }).ok).toBe(true);
  });

  it("requires a real deletion on cloze cards", () => {
    expect(validateAnkiCard({ type: "cloze", front: "no deletion here", back: "" }).ok).toBe(false);
    expect(validateAnkiCard({ type: "cloze", front: "C3b does {{c1::opsonization}}.", back: "" }).ok).toBe(true);
  });

  it("defaults an unknown type to basic and builds a fresh schedule", () => {
    const result = validateAnkiCard({ type: "weird", front: "f", back: "b" }, NOW);
    expect(result.value?.type).toBe("basic");
    expect(result.value?.schedule.reps).toBe(0);
    expect(result.value?.schedule.dueAt).toBe(NOW.toISOString());
  });
});

describe("scheduling", () => {
  it("'again' lapses the card and re-queues it in minutes, not days", () => {
    const s = nextSchedule({ ...newSchedule(NOW), reps: 3, intervalDays: 12, ease: 2.5 }, "again", NOW);
    expect(s.reps).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.ease).toBeLessThan(2.5);
    expect(Date.parse(s.dueAt) - NOW.getTime()).toBe(10 * 60 * 1000);
  });

  it("intervals grow with consecutive good reviews", () => {
    let s = newSchedule(NOW);
    const intervals: number[] = [];
    for (let i = 0; i < 4; i++) {
      s = nextSchedule(s, "good", NOW);
      intervals.push(s.intervalDays);
    }
    expect(intervals[0]).toBe(1);
    expect(intervals[1]).toBe(6);
    expect(intervals[2]).toBeGreaterThan(intervals[1]);
    expect(intervals[3]).toBeGreaterThan(intervals[2]);
  });

  it("easy grows faster than hard", () => {
    const base = { ...newSchedule(NOW), reps: 2, intervalDays: 10 };
    expect(nextSchedule(base, "easy", NOW).intervalDays).toBeGreaterThan(nextSchedule(base, "hard", NOW).intervalDays);
  });

  it("dueCards excludes suspended and future cards", () => {
    const due = makeCard();
    const future = makeCard({ schedule: { ...newSchedule(NOW), dueAt: "2999-01-01T00:00:00.000Z" } });
    const suspended = makeCard({ suspended: true });
    expect(dueCards([due, future, suspended], NOW).map((c) => c.id)).toEqual([due.id]);
  });
});

describe("quality review layer", () => {
  it("flags duplicates against the existing vault", () => {
    const existing = makeCard({ front: "What activates the classical pathway?" });
    const flags = reviewCardQuality(makeCard(), [existing]);
    expect(flags.some((f) => f.kind === "duplicate")).toBe(true);
  });

  it("flags multi-fact backs, dangling pronouns, absolutes, and weak cloze", () => {
    const multi = reviewCardQuality(makeCard({ back: "Fact one; and fact two; also fact three and fact four" }));
    expect(multi.some((f) => f.kind === "multi-fact")).toBe(true);

    const pronoun = reviewCardQuality(makeCard({ front: "It binds to the receptor?" }));
    expect(pronoun.some((f) => f.kind === "ambiguous")).toBe(true);

    const absolute = reviewCardQuality(makeCard({ back: "This drug always works in all patients." }));
    expect(absolute.some((f) => f.kind === "absolute-claim")).toBe(true);

    const cloze = reviewCardQuality(makeCard({ type: "cloze", front: "{{c1::Almost the entire card is hidden in this deletion so no context remains}} x" }));
    expect(cloze.some((f) => f.kind === "weak-cloze")).toBe(true);
  });

  it("flags AI-generated cards missing a source", () => {
    const flags = reviewCardQuality(makeCard({ aiGenerated: true, source: undefined }));
    expect(flags.some((f) => f.kind === "missing-source")).toBe(true);
  });

  it("passes a clean card with no flags", () => {
    expect(reviewCardQuality(makeCard())).toEqual([]);
  });
});

describe("anki export", () => {
  it("escapes tabs/newlines so the TSV stays importable", () => {
    const tsv = cardsToAnkiTsv([makeCard({ front: "line one\nline two", back: "a\tb", tags: ["t1", "t2"] })]);
    const cols = tsv.split("\t");
    expect(cols[0]).toBe("line one<br>line two");
    expect(cols[1]).toBe("a  b");
    expect(cols[2]).toBe("t1 t2");
  });
});

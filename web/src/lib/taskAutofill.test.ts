import { describe, it, expect } from "vitest";
import type { Task } from "./types";
import {
  normalizeTaskTitle,
  tokenize,
  taskSignature,
  titleSimilarity,
  inferFrequency,
  detectRecurringTemplates,
  suggestTemplateForDraft,
} from "./taskAutofill";

let counter = 0;
function task(title: string, created: string, extra: Partial<Task> = {}): Task {
  return {
    id: `t${counter++}`,
    title,
    done: false,
    created: `${created}T09:00:00.000Z`,
    ...extra,
  };
}

describe("normalizeTaskTitle / tokenize / signature", () => {
  it("normalizes punctuation and casing", () => {
    expect(normalizeTaskTitle("Go to the GYM!!")).toBe("go to the gym");
  });
  it("drops stopwords and bare numbers from tokens", () => {
    expect(tokenize("Go to the gym for 30")).toEqual(["gym"]);
  });
  it("groups variants under one signature", () => {
    expect(taskSignature("Go to the gym!")).toBe(taskSignature("go to gym"));
    expect(taskSignature("Review Anki")).toBe(taskSignature("review anki."));
  });
  it("never returns an empty signature for stopword-only titles", () => {
    expect(taskSignature("to the").length).toBeGreaterThan(0);
  });
});

describe("titleSimilarity", () => {
  it("is 1 for token-identical titles", () => {
    expect(titleSimilarity("Review Anki", "review anki")).toBe(1);
  });
  it("is partial for overlapping titles", () => {
    expect(titleSimilarity("review anki cardio", "review anki renal")).toBeCloseTo(0.5, 5);
  });
  it("is 0 for disjoint titles", () => {
    expect(titleSimilarity("gym", "call family")).toBe(0);
  });
});

describe("inferFrequency", () => {
  it("detects daily cadence", () => {
    expect(inferFrequency(["2026-06-21", "2026-06-22", "2026-06-23"])).toBe("daily");
  });
  it("detects weekly cadence", () => {
    expect(inferFrequency(["2026-06-01", "2026-06-08", "2026-06-15"])).toBe("weekly");
  });
  it("detects weekday-only cadence", () => {
    // Mon, Tue, Wed, Thu (2026-06-22..25 are Mon-Thu)
    expect(inferFrequency(["2026-06-22", "2026-06-23", "2026-06-24", "2026-06-25"])).toBe("weekdays");
  });
  it("falls back to custom for irregular gaps", () => {
    expect(inferFrequency(["2026-06-01", "2026-06-04", "2026-06-20"])).toBe("custom");
  });
});

describe("detectRecurringTemplates", () => {
  it("surfaces titles repeated >= minOccurrences with cadence + scope", () => {
    const tasks = [
      task("Go to the gym", "2026-06-21"),
      task("go to gym", "2026-06-22"),
      task("Go to the gym!", "2026-06-23"),
      task("Review Anki", "2026-06-23", { scope: "Anki" }),
      task("review anki", "2026-06-22", { scope: "Anki" }),
    ];
    const templates = detectRecurringTemplates(tasks, { minOccurrences: 3 });
    expect(templates).toHaveLength(1);
    expect(templates[0].title).toBe("Go to the gym!");
    expect(templates[0].count).toBe(3);
    expect(templates[0].frequency).toBe("daily");
  });

  it("ignores archived tasks", () => {
    const tasks = [
      task("Code Noctyrium", "2026-06-21", { archived: true }),
      task("code noctyrium", "2026-06-22", { archived: true }),
      task("Code Noctyrium", "2026-06-23"),
    ];
    expect(detectRecurringTemplates(tasks, { minOccurrences: 2 })).toHaveLength(0);
  });
});

describe("suggestTemplateForDraft", () => {
  const history = [
    task("Review Anki", "2026-06-21", { scope: "Anki" }),
    task("review anki", "2026-06-22", { scope: "Anki" }),
  ];

  it("suggests once the draft would be the 3rd occurrence", () => {
    const s = suggestTemplateForDraft("Review Anki", history, { minOccurrences: 3 });
    expect(s).not.toBeNull();
    expect(s?.scope).toBe("Anki");
    expect(s?.count).toBe(2);
  });

  it("does not suggest with only one prior occurrence", () => {
    const s = suggestTemplateForDraft("Review Anki", [history[0]], { minOccurrences: 3 });
    expect(s).toBeNull();
  });

  it("ignores trivially short drafts", () => {
    expect(suggestTemplateForDraft("a", history)).toBeNull();
  });

  it("matches near-duplicate wording via token overlap", () => {
    const ankiHistory = [
      task("Review Anki cardio", "2026-06-21"),
      task("review anki cardio", "2026-06-22"),
    ];
    // shares review/anki/cardio (3 of 4 tokens) → Jaccard 0.75 ≥ threshold
    const s = suggestTemplateForDraft("review anki cardio deck", ankiHistory, { minOccurrences: 3 });
    expect(s).not.toBeNull();
  });

  it("does NOT match a different topic below the similarity threshold", () => {
    const ankiHistory = [
      task("Review Anki cardio", "2026-06-21"),
      task("review anki cardio", "2026-06-22"),
    ];
    // shares only review/anki (Jaccard 0.5 < 0.6) → no false suggestion
    expect(suggestTemplateForDraft("review anki renal", ankiHistory, { minOccurrences: 3 })).toBeNull();
  });
});

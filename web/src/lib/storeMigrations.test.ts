// Migration safety: upgrading a real pre-v27 state must add the new arrays,
// preserve every existing record untouched, and leave a pre-migration snapshot.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { migratePersistedState } from "./store";
import { STORAGE_KEYS } from "./brand";

// Minimal localStorage stand-in so the pre-migration snapshot path is
// observable regardless of the test environment.
const backing = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => backing.get(k) ?? null,
  setItem: (k: string, v: string) => { backing.set(k, String(v)); },
  removeItem: (k: string) => { backing.delete(k); },
  clear: () => backing.clear(),
});

function v26State() {
  return {
    profile: {
      name: "JD", userId: "jd", versionLabel: "old-label", tagline: "t",
      dailyCardTarget: 120, dailyMinuteTarget: 240, onboarded: true,
      focusSubscriptions: ["term1"], educationTrack: "sgu",
    },
    terms: [{ id: "t1", name: "Term 1" }],
    courses: [{ id: "c1", termId: "t1", code: "BPM 500", name: "", files: 0, modules: [] }],
    tracker: [{ id: "tr1", path: "T1/L", label: "Lecture 1", kind: "Lecture", passes: 2, ankiPasses: 1, yield: "high", updated: "2026-06-01T00:00:00.000Z" }],
    productivityTrackers: [],
    resources: [],
    tasks: [{ id: "task1", title: "Old task", done: false, created: "2026-06-01T00:00:00.000Z" }],
    journal: [{ id: "j1", date: "2026-06-01T00:00:00.000Z", today: "x", tomorrow: "y", blockers: "", energy: "High", rating: "Useful" }],
    premedExperiences: [], prompts: [], folders: [],
    logs: [{ id: "l1", dayKey: "2026-06-01", ts: "2026-06-01T10:00:00.000Z", type: "Anki", minutes: 30, cards: 50 }],
    integrations: [], boardPrep: {}, dayPlans: [], blueprintInstalls: [],
    activeDayKey: "2026-06-23", lastActiveLocalDate: "2026-06-23", lastTimezoneOffset: 240,
    dailyArchives: [], dailyRolloverEvents: [], energyFactors: [], habits: [], habitEntries: [],
    schemaVersion: 26,
  };
}

describe("v26 → v27 migration", () => {
  beforeEach(() => localStorage.clear());

  it("adds the daily-loop arrays without touching existing records", () => {
    const before = v26State();
    const result = migratePersistedState(structuredClone(before), 26);

    expect(result.sessions).toEqual([]);
    expect(result.closeouts).toEqual([]);
    expect(result.recoveryPlans).toEqual([]);
    expect(result.questions).toEqual([]);
    expect(result.ankiCards).toEqual([]);
    expect(result.cardReviews).toEqual([]);

    // Nothing existing was dropped or mutated.
    expect(result.tracker).toEqual(before.tracker);
    expect(result.tasks).toEqual(before.tasks);
    expect(result.journal).toEqual(before.journal);
    expect(result.logs).toEqual(before.logs);
    expect(result.activeDayKey).toBe("2026-06-23");
  });

  it("preserves already-present v27 data on a same-version pass", () => {
    const state = {
      ...v26State(),
      sessions: [{ id: "s1" }],
      questions: [{ id: "q1" }],
      schemaVersion: 27,
    };
    const result = migratePersistedState(structuredClone(state), 26);
    expect(result.sessions).toEqual([{ id: "s1" }]);
    expect(result.questions).toEqual([{ id: "q1" }]);
  });

  it("writes a recoverable pre-migration snapshot before migrating", () => {
    migratePersistedState(v26State(), 26);
    const raw = localStorage.getItem(STORAGE_KEYS.preMigrationSnapshot);
    expect(raw).toBeTruthy();
    const snapshot = JSON.parse(raw!) as { fromVersion: number; savedAt: string; state: { tasks: Array<{ title: string }> } };
    expect(snapshot.fromVersion).toBe(26);
    expect(snapshot.state.tasks[0].title).toBe("Old task");
  });

  it("survives a deep-legacy (v1-era) payload without throwing", () => {
    const ancient = {
      profile: { name: "Old" },
      terms: [], courses: [],
      tracker: [{ id: "x", path: "p", label: "l", type: "Lecture", status: "working" }],
      tasks: [], journal: [], prompts: [], folders: [], logs: [], integrations: [],
    };
    const result = migratePersistedState(ancient, 1);
    expect(Array.isArray(result.resources)).toBe(true);
    expect(result.tracker[0].kind).toBe("Lecture");
    expect(result.sessions).toEqual([]);
    expect(result.ankiCards).toEqual([]);
  });
});

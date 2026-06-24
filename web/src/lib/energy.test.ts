import { describe, expect, it } from "vitest";
import { calculateReadiness, inferJournalSignals } from "./energy";
import type { EnergyFactor, JournalEntry } from "./types";

const baseInput = {
  date: "2026-06-24",
  factors: [] as EnergyFactor[],
  journal: [] as JournalEntry[],
  logs: [],
  tasks: [],
  dayPlans: [],
  productivityTrackers: [],
};

function factor(patch: Partial<EnergyFactor>): EnergyFactor {
  return {
    id: "factor",
    date: "2026-06-24",
    source: "manual",
    label: "Manual factor",
    category: "recovery",
    delta: 10,
    confidence: 1,
    carryoverDays: 0,
    decayPerDay: 1,
    userConfirmed: true,
    ...patch,
  };
}

describe("energy readiness engine", () => {
  it("applies confirmed manual factors to estimated readiness", () => {
    const result = calculateReadiness({
      ...baseInput,
      factors: [factor({ label: "Movement", category: "movement", delta: 8 })],
    });
    expect(result.estimatedReadiness).toBe(70);
    expect(result.contributions[0].label).toBe("Movement");
  });

  it("decays carryover factors across following days", () => {
    const result = calculateReadiness({
      ...baseInput,
      factors: [factor({
        date: "2026-06-23",
        label: "All-nighter",
        category: "sleep",
        delta: -20,
        carryoverDays: 3,
        decayPerDay: 0.25,
      })],
    });
    expect(result.carryoverImpact).toBe(-15);
    expect(result.estimatedReadiness).toBe(47);
  });

  it("surfaces journal language as possible signals without applying it", () => {
    const result = calculateReadiness({
      ...baseInput,
      journal: [{
        id: "j1",
        date: "2026-06-24T20:00:00",
        today: "Pulled an all-nighter and doomscrolling made the day worse.",
        tomorrow: "",
        blockers: "",
        energy: "",
        rating: "",
      }],
    });
    expect(result.estimatedReadiness).toBe(62);
    expect(result.possibleSignals.map((signal) => signal.label)).toContain("All-nighter possible");
  });

  it("applies a journal signal after the user confirms it", () => {
    const journal: JournalEntry[] = [{
      id: "j2",
      date: "2026-06-24T20:00:00",
      today: "Poor sleep and overload.",
      tomorrow: "",
      blockers: "",
      energy: "",
      rating: "",
    }];
    const [signal] = inferJournalSignals(journal, "2026-06-24");
    const result = calculateReadiness({
      ...baseInput,
      journal,
      factors: [{ ...signal, userConfirmed: true }],
    });
    expect(result.possibleSignals).toHaveLength(0);
    expect(result.estimatedReadiness).toBeLessThan(62);
  });

  it("keeps self-reported energy separate but visible in the readiness estimate", () => {
    const result = calculateReadiness({
      ...baseInput,
      journal: [{
        id: "j3",
        date: "2026-06-24T20:00:00",
        today: "Normal day.",
        tomorrow: "",
        blockers: "",
        energy: "High",
        rating: "",
      }],
    });
    expect(result.selfReportedEnergy.score).toBe(82);
    expect(result.estimatedReadiness).toBeGreaterThan(62);
  });
});

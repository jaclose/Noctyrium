import { describe, expect, it } from "vitest";
import { normalizeApplicationResearch, normalizeResearchFacts, researchFactRevision, researchValue, type SchoolResearchFact } from "./applicationResearch";
import { parseApplicationSchoolDataset, mergeApplicationSchoolDatasets } from "./applicationSchools";
import { mergeStates, parseImport, toPortableState } from "./backup";
import { makeSeed } from "./seed";
import { migratePersistedState } from "./store";
import { readFileSync } from "node:fs";
const dataset: unknown = JSON.parse(readFileSync("public/application-schools.json", "utf8"));

const fact: SchoolResearchFact = { id: "mcat", label: "MCAT", value: "Read cycle exceptions", url: "https://example.edu/requirements", capturedAt: "2026-07-19T00:00:00Z", captureStatus: "unverified-capture" };
const now = new Date("2026-09-22T12:00:00Z");

describe("application research", () => {
  it("loads all canonical school records without certifying historical captures", () => {
    const result = parseApplicationSchoolDataset(dataset, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.issues).toEqual([]);
    const schools = result.dataset.schools;
    const facts = schools.flatMap(s => s.researchFacts ?? []);
    expect(result.dataset.sourcePipelineVersion).toBe("phase1-research-adapter-v2");
    expect(schools).toHaveLength(292);
    expect(schools.filter(s => s.researchFacts?.length)).toHaveLength(60);
    expect(facts).toHaveLength(1765);
    expect(schools.flatMap(s => s.reportedStats ?? [])).toHaveLength(105);
    expect(schools.filter(s => s.riskFlag)).toHaveLength(15);
    expect(schools.some(s => s.verificationStatus === "verified")).toBe(false);
    expect(schools.some(s => ["S0235", "S0261"].includes(s.id))).toBe(false);
    expect(JSON.stringify(dataset)).not.toMatch(/est_lizzym|est_research_hours|admissions_email/);
    expect(facts.filter(f => /third[- ]party|aggregator/i.test(f.value))).toEqual([]);
  });
  it("keeps research-team estimates under the estimates key, never as research facts", () => {
    const result = parseApplicationSchoolDataset(dataset, now);
    if (!result.ok) throw Error("Invalid dataset");
    const withEstimates = result.dataset.schools.filter(s => s.estimates);
    expect(withEstimates).toHaveLength(45);
    for (const school of withEstimates) {
      expect(school.estimates!.disclaimer).toMatch(/^ESTIMATE:/);
      expect(school.estimates!.estimatedAt).toBe("2026-07-22T00:00:00Z");
    }
    for (const school of result.dataset.schools) {
      const { estimates: _estimates, ...rest } = school;
      expect(JSON.stringify(rest)).not.toMatch(/ESTIMATE:|PEER_FALLBACK|tierRationale|competitiveGpa|lizzym/i);
      expect((school.researchFacts ?? []).some(f => f.id.startsWith("applicant_profile_estimate_raw"))).toBe(false);
      const statIds = new Set((school.reportedStats ?? []).map(stat => stat.id));
      expect((school.researchFacts ?? []).some(f => statIds.has(f.id))).toBe(false);
    }
  });
  it("retains save/review state through normalization, migration and backup restore", () => {
    const seed = makeSeed();
    seed.profile.applicationResearch = [{ schoolId: "S0001", shortlisted: true, reviewedFacts: { mcat: researchFactRevision(fact) } }];
    const migrated = migratePersistedState(seed, seed.schemaVersion);
    expect(migrated.profile.applicationResearch).toEqual(seed.profile.applicationResearch);
    const restored = parseImport(JSON.stringify({ _app: "AXOM", ...toPortableState(migrated) }));
    expect(restored.profile.applicationResearch).toEqual(seed.profile.applicationResearch);
    expect(normalizeApplicationResearch(undefined)).toEqual([]);
  });
  it("reopens a research check when a value, capture status or source changes", () => {
    const revision = researchFactRevision(fact);
    expect(researchFactRevision({ ...fact, value: "New policy" })).not.toBe(revision);
    expect(researchFactRevision({ ...fact, capturedAt: "2026-08-01T00:00:00Z" })).not.toBe(revision);
    expect(researchFactRevision({ ...fact, captureStatus: "official-capture" })).not.toBe(revision);
  });
  it("merges new saved schools without restoring deliberately unchecked facts", () => {
    const current = makeSeed(); const incoming = makeSeed();
    current.profile.applicationResearch = [{ schoolId: "one", shortlisted: false, reviewedFacts: {} }];
    incoming.profile.applicationResearch = [{ schoolId: "one", shortlisted: true, reviewedFacts: { mcat: "old" } }, { schoolId: "two", shortlisted: true, reviewedFacts: {} }];
    expect(mergeStates(current, incoming).profile.applicationResearch).toEqual([
      current.profile.applicationResearch[0], incoming.profile.applicationResearch[1],
    ]);
  });
  it("rejects unsafe links and future evidence, keeps unknowns distinct", () => {
    expect(normalizeResearchFacts([fact, { ...fact, url: "javascript:alert(1)" }, { ...fact, capturedAt: "2099-01-01" }], now)).toEqual([fact]);
    expect(researchValue("NOT_PUBLICLY_DISCLOSED")).toContain("Not publicly reported");
    expect(researchValue("None (no minimum)")).toBe("None (no minimum)");
    expect(researchValue("REQUIRES_MANUAL_VERIFICATION")).toContain("manual verification");
  });
  it("preserves conflicting research during incremental dataset merges", () => {
    const wrap = (facts: SchoolResearchFact[]) => parseApplicationSchoolDataset({ schemaVersion: 2, generatedAt: now.toISOString(), schools: [{ id: "one", name: "School", verificationStatus: "incomplete", sources: [], researchFacts: facts }] }, now);
    const base = wrap([fact]); const incoming = wrap([{ ...fact, value: "Different policy" }]);
    if (!base.ok || !incoming.ok) throw Error("Invalid fixture");
    const merged = mergeApplicationSchoolDatasets(base.dataset, incoming.dataset);
    expect(merged.conflicts).toBe(1);
    expect(merged.dataset.schools[0].researchFacts).toEqual([fact]);
    expect(merged.dataset.schools[0].conflicts?.mcat).toEqual({ existing: fact.value, incoming: "Different policy" });
  });
});

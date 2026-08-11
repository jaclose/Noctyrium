import { describe, expect, it } from "vitest";
import { mergeApplicationSchoolDatasets, parseApplicationSchoolDataset, type ApplicationSchoolDataset } from "./applicationSchools";

const source = { url: "https://example.edu/admissions", retrievedAt: "2026-08-08T12:00:00Z" };
const valid = {
  schemaVersion: 1,
  generatedAt: "2026-08-09T12:00:00Z",
  schools: [{ id: "example-med", name: "Example School of Medicine", degree: "MD", verificationStatus: "verified", sources: [source] }],
};

describe("application school ingestion contract", () => {
  it("accepts v1 input and upgrades it to the auditable v2 envelope", () => {
    const result = parseApplicationSchoolDataset(valid, new Date("2026-08-09T12:00:00Z"));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.dataset).toMatchObject({ schemaVersion: 2, recordCount: 1, successfulRecords: 1, rejectedRecords: 0 });
  });

  it("rejects a verified record without provenance", () => {
    const result = parseApplicationSchoolDataset({ ...valid, schools: [{ ...valid.schools[0], sources: [] }] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dataset.schools).toHaveLength(0);
      expect(result.dataset.rejectedRecords).toBe(1);
      expect(result.issues.some((issue) => /require a valid source/i.test(issue.message))).toBe(true);
    }
  });

  it("keeps partial data while diagnosing duplicate IDs, duplicate names, bad URLs, and stale sources", () => {
    const result = parseApplicationSchoolDataset({
      schemaVersion: 2, generatedAt: "2026-08-09T12:00:00Z", recordCount: 4,
      schools: [
        { id: "one", canonicalName: "Same School", verificationStatus: "verified", sources: [source] },
        { id: "two", canonicalName: "Same School", verificationStatus: "incomplete", sources: [{ url: "not-a-url", retrievedAt: "2026-08-08T12:00:00Z" }] },
        { id: "two", canonicalName: "Another School", verificationStatus: "unknown", sources: [] },
        { id: "three", canonicalName: "Old School", verificationStatus: "verified", sources: [{ url: "https://old.example.edu", retrievedAt: "2020-01-01T12:00:00Z" }] },
      ],
    }, new Date("2026-08-09T12:00:00Z"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dataset.schools.map((school) => school.id)).toEqual(["one", "two", "three"]);
      expect(result.dataset.schools.find((school) => school.id === "three")?.verificationStatus).toBe("needs-refresh");
      expect(result.issues.some((issue) => /duplicate canonical/i.test(issue.message))).toBe(true);
      expect(result.issues.some((issue) => /duplicate school id/i.test(issue.message))).toBe(true);
      expect(result.issues.some((issue) => /source url/i.test(issue.message))).toBe(true);
    }
  });

  it("preserves old fields and surfaces incoming conflicts during incremental merge", () => {
    const base = parseApplicationSchoolDataset(valid, new Date("2026-08-09T12:00:00Z"));
    const incoming = parseApplicationSchoolDataset({
      schemaVersion: 2, generatedAt: "2026-08-10T12:00:00Z", sourcePipelineVersion: "scraper-2",
      schools: [{ id: "example-med", canonicalName: "Example School of Medicine", name: "Example School of Medicine", degree: "DO", tuition: "$50k", verificationStatus: "verified", sources: [{ url: "https://example.edu/fees", retrievedAt: "2026-08-10T12:00:00Z" }] }],
    }, new Date("2026-08-10T12:00:00Z"));
    expect(base.ok && incoming.ok).toBe(true);
    if (!base.ok || !incoming.ok) return;
    const merged = mergeApplicationSchoolDatasets(base.dataset, incoming.dataset);
    expect(merged.dataset.schools).toHaveLength(1);
    expect(merged.dataset.schools[0].tuition).toBe("$50k");
    expect(merged.dataset.schools[0].conflicts?.degree).toBeDefined();
    expect(merged.dataset.schools[0].verificationStatus).toBe("conflicting");
    expect(merged.dataset.schools[0].sources).toHaveLength(2);
  });

  it.each([271, 500, 1000])("handles a %i-school partial run without quadratic work", (count) => {
    const schools = Array.from({ length: count }, (_, index) => ({
      id: `school-${index}`, canonicalName: `Synthetic Medical School ${index}`, programType: index % 2 ? "md" : "do",
      verificationStatus: index % 9 === 0 ? "unknown" : "incomplete", sources: [],
    }));
    const started = performance.now();
    const result = parseApplicationSchoolDataset({ schemaVersion: 2, generatedAt: "2026-08-09T12:00:00Z", schools }, new Date("2026-08-09T12:00:00Z"));
    const elapsed = performance.now() - started;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dataset.schools).toHaveLength(count);
      expect(result.dataset.recordCount).toBe(count);
    }
    expect(elapsed).toBeLessThan(1000);
  });

  it("round-trips a 271-school incremental patch without changing untouched records", () => {
    const source = (index: number) => ({ url: `https://school-${index}.example.edu/admissions`, retrievedAt: "2026-08-10T12:00:00Z" });
    const baseInput = {
      schemaVersion: 2, generatedAt: "2026-08-10T12:00:00Z", recordCount: 271,
      schools: Array.from({ length: 271 }, (_, index) => ({
        id: `school-${index}`, canonicalName: `Synthetic Medical School ${index}`, tuition: "Unknown",
        verificationStatus: "incomplete", sources: [source(index)],
      })),
    };
    const patchInput = {
      schemaVersion: 2, generatedAt: "2026-08-11T12:00:00Z", recordCount: 33,
      schools: [
        ...Array.from({ length: 30 }, (_, index) => ({
          id: `school-${index}`, canonicalName: `Synthetic Medical School ${index}`, tuition: `$${index + 1}0k`,
          verificationStatus: "verified", sources: [source(index)],
        })),
        ...Array.from({ length: 3 }, (_, index) => ({
          id: `new-${index}`, canonicalName: `New Medical School ${index}`, verificationStatus: "unknown", sources: [],
        })),
      ],
    };
    const base = parseApplicationSchoolDataset(baseInput, new Date("2026-08-11T00:00:00Z"));
    const patch = parseApplicationSchoolDataset(patchInput, new Date("2026-08-11T00:00:00Z"));
    expect(base.ok && patch.ok).toBe(true);
    if (!base.ok || !patch.ok) return;
    const merged = mergeApplicationSchoolDatasets(base.dataset, patch.dataset);
    expect(merged.dataset.schools).toHaveLength(274);
    expect(merged.dataset.schools.find((school) => school.id === "school-40")?.tuition).toBe("Unknown");
    expect(merged.dataset.schools.find((school) => school.id === "school-4")?.tuition).toBe("$50k");
    expect(merged.dataset.schools.find((school) => school.id === "new-2")?.canonicalName).toBe("New Medical School 2");
  });
});

export function testDataset(schools: ApplicationSchoolDataset["schools"]): ApplicationSchoolDataset {
  return { schemaVersion: 2, generatedAt: "2026-08-09T12:00:00Z", recordCount: schools.length, successfulRecords: schools.length, incompleteRecords: 0, rejectedRecords: 0, schools };
}

import { describe, expect, it } from "vitest";
import { parseApplicationSchoolDataset } from "./applicationSchools";

const valid = {
  schemaVersion: 1,
  generatedAt: "2026-08-09T12:00:00Z",
  schools: [{
    id: "example-med",
    name: "Example School of Medicine",
    verificationStatus: "verified",
    sources: [{ url: "https://example.edu/admissions", retrievedAt: "2026-08-08T12:00:00Z" }],
  }],
};

describe("application school ingestion contract", () => {
  it("accepts sourced verified records", () => {
    const result = parseApplicationSchoolDataset(valid);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.dataset.schools[0].name).toBe("Example School of Medicine");
  });

  it("does not allow scraped claims to become verified without provenance", () => {
    const result = parseApplicationSchoolDataset({ ...valid, schools: [{ ...valid.schools[0], sources: [] }] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dataset.schools).toHaveLength(0);
      expect(result.issues[0].message).toMatch(/require a valid source/i);
    }
  });

  it("rejects incompatible envelopes and duplicate identifiers", () => {
    expect(parseApplicationSchoolDataset({ ...valid, schemaVersion: 2 }).ok).toBe(false);
    const result = parseApplicationSchoolDataset({ ...valid, schools: [valid.schools[0], valid.schools[0]] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dataset.schools).toHaveLength(1);
      expect(result.issues.some((issue) => issue.message.includes("Duplicate"))).toBe(true);
    }
  });
});

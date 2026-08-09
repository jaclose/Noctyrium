export type SchoolVerificationStatus = "verified" | "incomplete" | "unknown" | "needs-refresh";

export interface ApplicationSchoolSource {
  url: string;
  title?: string;
  retrievedAt: string;
}

export interface ApplicationSchool {
  id: string;
  name: string;
  programType?: string;
  degree?: string;
  location?: string;
  applicationPlatform?: string;
  prerequisiteCategories?: string[];
  mcatPolicy?: string;
  casperPolicy?: string;
  previewPolicy?: string;
  letters?: string;
  deadline?: string;
  tuition?: string;
  classSize?: number;
  missionNotes?: string;
  verificationStatus: SchoolVerificationStatus;
  sources: ApplicationSchoolSource[];
  updatedAt?: string;
}

export interface ApplicationSchoolDataset {
  schemaVersion: 1;
  generatedAt: string;
  schools: ApplicationSchool[];
}

export interface DatasetIssue {
  path: string;
  message: string;
}

export type DatasetResult =
  | { ok: true; dataset: ApplicationSchoolDataset; issues: DatasetIssue[] }
  | { ok: false; issues: DatasetIssue[] };

const STATUSES = new Set<SchoolVerificationStatus>(["verified", "incomplete", "unknown", "needs-refresh"]);

/** Strict boundary for external scraper output. Invalid rows never enter the UI. */
export function parseApplicationSchoolDataset(input: unknown): DatasetResult {
  const issues: DatasetIssue[] = [];
  if (!isRecord(input)) return { ok: false, issues: [{ path: "$", message: "Dataset must be an object." }] };
  if (input.schemaVersion !== 1) issues.push({ path: "schemaVersion", message: "Expected schema version 1." });
  if (!isNonEmptyString(input.generatedAt)) issues.push({ path: "generatedAt", message: "A source generation timestamp is required." });
  if (!Array.isArray(input.schools)) issues.push({ path: "schools", message: "Schools must be an array." });
  if (issues.length) return { ok: false, issues };

  const ids = new Set<string>();
  const schools: ApplicationSchool[] = [];
  for (const [index, raw] of (input.schools as unknown[]).entries()) {
    const path = `schools[${index}]`;
    if (!isRecord(raw)) {
      issues.push({ path, message: "School must be an object." });
      continue;
    }
    if (!isNonEmptyString(raw.id) || !isNonEmptyString(raw.name)) {
      issues.push({ path, message: "School ID and name are required." });
      continue;
    }
    if (ids.has(raw.id)) {
      issues.push({ path: `${path}.id`, message: `Duplicate school ID: ${raw.id}` });
      continue;
    }
    if (!STATUSES.has(raw.verificationStatus as SchoolVerificationStatus)) {
      issues.push({ path: `${path}.verificationStatus`, message: "Verification status is invalid." });
      continue;
    }
    const sourceRows = Array.isArray(raw.sources) ? raw.sources : [];
    const sources = sourceRows.flatMap((source): ApplicationSchoolSource[] => {
      if (!isRecord(source) || !isHttpUrl(source.url) || !isNonEmptyString(source.retrievedAt)) return [];
      return [{ url: source.url, title: stringValue(source.title), retrievedAt: source.retrievedAt }];
    });
    if (raw.verificationStatus === "verified" && sources.length === 0) {
      issues.push({ path: `${path}.sources`, message: "Verified schools require a valid source URL and retrieval timestamp." });
      continue;
    }
    ids.add(raw.id);
    schools.push({
      id: raw.id,
      name: raw.name,
      programType: stringValue(raw.programType),
      degree: stringValue(raw.degree),
      location: stringValue(raw.location),
      applicationPlatform: stringValue(raw.applicationPlatform),
      prerequisiteCategories: stringArray(raw.prerequisiteCategories),
      mcatPolicy: stringValue(raw.mcatPolicy),
      casperPolicy: stringValue(raw.casperPolicy),
      previewPolicy: stringValue(raw.previewPolicy),
      letters: stringValue(raw.letters),
      deadline: stringValue(raw.deadline),
      tuition: stringValue(raw.tuition),
      classSize: typeof raw.classSize === "number" && Number.isFinite(raw.classSize) ? raw.classSize : undefined,
      missionNotes: stringValue(raw.missionNotes),
      verificationStatus: raw.verificationStatus as SchoolVerificationStatus,
      sources,
      updatedAt: stringValue(raw.updatedAt),
    });
  }
  return { ok: true, dataset: { schemaVersion: 1, generatedAt: input.generatedAt as string, schools }, issues };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function stringValue(value: unknown): string | undefined {
  return isNonEmptyString(value) ? value : undefined;
}
function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.filter(isNonEmptyString);
  return values.length ? values : undefined;
}
function isHttpUrl(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}

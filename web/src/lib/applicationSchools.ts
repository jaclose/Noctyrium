export type SchoolVerificationStatus = "verified" | "incomplete" | "unknown" | "needs-refresh" | "conflicting";
export type DatasetIssueSeverity = "error" | "warning";

export interface ApplicationSchoolSource {
  url: string;
  title?: string;
  retrievedAt: string;
}

export interface ApplicationSchoolConflict {
  existing: string;
  incoming: string;
}

export interface ApplicationSchool {
  id: string;
  canonicalName: string;
  name: string;
  alternateNames?: string[];
  programType?: string;
  degree?: string;
  location?: string;
  website?: string;
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
  /** Field-level evidence remains bounded and auditable without wrapping every primitive. */
  fieldProvenance?: Record<string, ApplicationSchoolSource[]>;
  /** Conflicts are preserved instead of silently choosing a scraper value. */
  conflicts?: Record<string, ApplicationSchoolConflict>;
  updatedAt?: string;
}

export interface ApplicationSchoolDataset {
  schemaVersion: 2;
  generatedAt: string;
  sourcePipelineVersion?: string;
  recordCount: number;
  successfulRecords: number;
  incompleteRecords: number;
  rejectedRecords: number;
  schools: ApplicationSchool[];
}

export interface DatasetIssue {
  path: string;
  message: string;
  severity: DatasetIssueSeverity;
}

export type DatasetResult =
  | { ok: true; dataset: ApplicationSchoolDataset; issues: DatasetIssue[] }
  | { ok: false; issues: DatasetIssue[] };

export interface DatasetMergeResult {
  dataset: ApplicationSchoolDataset;
  conflicts: number;
  warnings: string[];
}

const STATUSES = new Set<SchoolVerificationStatus>(["verified", "incomplete", "unknown", "needs-refresh", "conflicting"]);
const ALLOWED_PROGRAMS = new Set(["md", "do", "md/do", "residency", "phd", "masters", "pa", "nursing", "other"]);
const MATERIAL_FIELDS = [
  "programType", "degree", "location", "website", "applicationPlatform", "prerequisiteCategories",
  "mcatPolicy", "casperPolicy", "previewPolicy", "letters", "deadline", "tuition", "classSize", "missionNotes",
] as const;

/**
 * Validate scraper output. Schema v1 is accepted and deterministically upgraded
 * to v2; bad rows are rejected individually so a partial run remains useful.
 */
export function parseApplicationSchoolDataset(input: unknown, now = new Date()): DatasetResult {
  const issues: DatasetIssue[] = [];
  if (!isRecord(input)) return { ok: false, issues: [issue("$", "Dataset must be an object.")] };
  const version = input.schemaVersion;
  if (version !== 1 && version !== 2) return { ok: false, issues: [issue("schemaVersion", "Expected schema version 1 or 2.")] };
  if (!isNonEmptyString(input.generatedAt)) return { ok: false, issues: [issue("generatedAt", "A source generation timestamp is required.")] };
  const generatedAt = input.generatedAt;
  if (!isValidTimestamp(generatedAt)) issues.push(issue("generatedAt", "Generation timestamp is not valid ISO date-time."));
  else if (new Date(generatedAt).getTime() > now.getTime() + 60_000) issues.push(issue("generatedAt", "Generation timestamp is in the future."));
  if (!Array.isArray(input.schools)) return { ok: false, issues: [issue("schools", "Schools must be an array.")] };

  const ids = new Set<string>();
  const rawIds = new Set<string>();
  const canonicalNames = new Map<string, number>();
  const schools: ApplicationSchool[] = [];
  for (const [index, raw] of input.schools.entries()) {
    const path = `schools[${index}]`;
    const rawId = isRecord(raw) ? stringValue(raw.id) ?? stringValue(raw.schoolId) : undefined;
    const duplicateRawId = Boolean(rawId && rawIds.has(rawId));
    if (rawId) rawIds.add(rawId);
    const normalized = normalizeSchool(raw, path, now, issues);
    if (!normalized) continue;
    if (duplicateRawId || ids.has(normalized.id)) {
      issues.push(issue(`${path}.id`, `Duplicate school ID: ${normalized.id}`));
      continue;
    }
    const canonicalKey = normalizeName(normalized.canonicalName);
    if (canonicalNames.has(canonicalKey)) {
      issues.push(issue(`${path}.canonicalName`, `Duplicate canonical school name; compare with row ${canonicalNames.get(canonicalKey)! + 1}.`, "warning"));
    } else canonicalNames.set(canonicalKey, index);
    ids.add(normalized.id);
    schools.push(normalized);
  }

  const metadataRecordCount = numberValue(input.recordCount);
  if (metadataRecordCount !== undefined && metadataRecordCount !== input.schools.length) {
    issues.push(issue("recordCount", `Expected ${input.schools.length} records but metadata says ${metadataRecordCount}.`, "warning"));
  }
  const dataset: ApplicationSchoolDataset = {
    schemaVersion: 2,
    generatedAt,
    sourcePipelineVersion: stringValue(input.sourcePipelineVersion),
    recordCount: input.schools.length,
    successfulRecords: schools.length,
    incompleteRecords: schools.filter((school) => school.verificationStatus === "incomplete").length,
    rejectedRecords: input.schools.length - schools.length,
    schools,
  };
  return { ok: true, dataset, issues };
}

/** Merge an incremental scraper run without deleting known fields or hiding conflicts. */
export function mergeApplicationSchoolDatasets(base: ApplicationSchoolDataset, incoming: ApplicationSchoolDataset): DatasetMergeResult {
  const merged = new Map(base.schools.map((school) => [school.id, cloneSchool(school)]));
  const byCanonical = new Map(base.schools.map((school) => [normalizeName(school.canonicalName), school.id]));
  let conflicts = 0;
  const warnings: string[] = [];
  for (const candidate of incoming.schools) {
    const matchId = merged.has(candidate.id) ? candidate.id : byCanonical.get(normalizeName(candidate.canonicalName));
    if (!matchId) {
      merged.set(candidate.id, cloneSchool(candidate));
      byCanonical.set(normalizeName(candidate.canonicalName), candidate.id);
      continue;
    }
    const current = merged.get(matchId)!;
    const next = mergeSchool(current, candidate);
    if (Object.keys(next.conflicts ?? {}).length) {
      conflicts += Object.keys(next.conflicts ?? {}).length;
      warnings.push(`${candidate.name}: ${Object.keys(next.conflicts!).join(", ")} needs review.`);
    }
    merged.set(matchId, next);
  }
  const schools = [...merged.values()];
  return {
    dataset: {
      schemaVersion: 2,
      generatedAt: incoming.generatedAt > base.generatedAt ? incoming.generatedAt : base.generatedAt,
      sourcePipelineVersion: incoming.sourcePipelineVersion ?? base.sourcePipelineVersion,
      recordCount: schools.length,
      successfulRecords: schools.length,
      incompleteRecords: schools.filter((school) => school.verificationStatus === "incomplete").length,
      rejectedRecords: 0,
      schools,
    },
    conflicts,
    warnings,
  };
}

function normalizeSchool(raw: unknown, path: string, now: Date, issues: DatasetIssue[]): ApplicationSchool | null {
  if (!isRecord(raw)) { issues.push(issue(path, "School must be an object.")); return null; }
  const id = stringValue(raw.id) ?? stringValue(raw.schoolId);
  const canonicalName = stringValue(raw.canonicalName) ?? stringValue(raw.name);
  if (!id || !canonicalName) { issues.push(issue(path, "School ID and canonical name are required.")); return null; }
  const verificationStatus = raw.verificationStatus as SchoolVerificationStatus;
  if (!STATUSES.has(verificationStatus)) { issues.push(issue(`${path}.verificationStatus`, "Verification status is invalid.")); return null; }
  const sourceRows = Array.isArray(raw.sources) ? raw.sources : [];
  const sources = sourceRows.flatMap((source, sourceIndex): ApplicationSchoolSource[] => {
    if (!isRecord(source) || !isHttpUrl(source.url) || !isNonEmptyString(source.retrievedAt)) {
      issues.push(issue(`${path}.sources[${sourceIndex}]`, "Source URL and retrieval timestamp are required."));
      return [];
    }
    if (!isValidTimestamp(source.retrievedAt)) {
      issues.push(issue(`${path}.sources[${sourceIndex}].retrievedAt`, "Source retrieval timestamp is invalid."));
      return [];
    }
    if (new Date(source.retrievedAt).getTime() > now.getTime() + 60_000) {
      issues.push(issue(`${path}.sources[${sourceIndex}].retrievedAt`, "Source retrieval timestamp is in the future."));
      return [];
    }
    if (now.getTime() - new Date(source.retrievedAt).getTime() > 366 * 24 * 60 * 60 * 1000) {
      issues.push(issue(`${path}.sources[${sourceIndex}].retrievedAt`, "Source is older than one year and needs refresh.", "warning"));
    }
    return [{ url: source.url, title: stringValue(source.title), retrievedAt: source.retrievedAt }];
  });
  if (verificationStatus === "verified" && sources.length === 0) {
    issues.push(issue(`${path}.sources`, "Verified schools require a valid source URL and retrieval timestamp."));
    return null;
  }
  const classSize = numberValue(raw.classSize);
  if (classSize !== undefined && (!Number.isInteger(classSize) || classSize < 0)) {
    issues.push(issue(`${path}.classSize`, "Class size must be a non-negative integer."));
    return null;
  }
  const programType = stringValue(raw.programType)?.toLowerCase();
  if (programType && !ALLOWED_PROGRAMS.has(programType)) issues.push(issue(`${path}.programType`, `Unsupported program type: ${programType}.`, "warning"));
  const deadline = stringValue(raw.deadline);
  if (deadline && !isPlausibleDeadline(deadline)) issues.push(issue(`${path}.deadline`, "Deadline is not a recognizable date or status.", "warning"));
  const website = stringValue(raw.website);
  if (website && !isHttpUrl(website)) issues.push(issue(`${path}.website`, "Website must be an HTTP(S) URL.", "warning"));
  const stale = sources.some((source) => now.getTime() - new Date(source.retrievedAt).getTime() > 366 * 24 * 60 * 60 * 1000);
  const status = stale && verificationStatus === "verified" ? "needs-refresh" : verificationStatus;
  return {
    id,
    canonicalName,
    name: stringValue(raw.name) ?? canonicalName,
    alternateNames: stringArray(raw.alternateNames),
    programType,
    degree: stringValue(raw.degree),
    location: stringValue(raw.location),
    website: website && isHttpUrl(website) ? website : undefined,
    applicationPlatform: stringValue(raw.applicationPlatform),
    prerequisiteCategories: stringArray(raw.prerequisiteCategories),
    mcatPolicy: stringValue(raw.mcatPolicy),
    casperPolicy: stringValue(raw.casperPolicy),
    previewPolicy: stringValue(raw.previewPolicy),
    letters: stringValue(raw.letters),
    deadline,
    tuition: stringValue(raw.tuition),
    classSize,
    missionNotes: stringValue(raw.missionNotes),
    verificationStatus: status,
    sources,
    fieldProvenance: fieldProvenance(raw.fieldProvenance),
    conflicts: conflictsValue(raw.conflicts),
    updatedAt: stringValue(raw.updatedAt),
  };
}

function mergeSchool(base: ApplicationSchool, incoming: ApplicationSchool): ApplicationSchool {
  const next = cloneSchool(base);
  const conflicts = { ...(base.conflicts ?? {}) };
  for (const field of MATERIAL_FIELDS) {
    const existing = next[field];
    const candidate = incoming[field];
    if (isMissingField(candidate)) continue;
    if (isMissingField(existing)) {
      (next as unknown as Record<string, unknown>)[field] = candidate;
      continue;
    }
    if (JSON.stringify(existing) !== JSON.stringify(candidate)) {
      conflicts[field] = { existing: JSON.stringify(existing), incoming: JSON.stringify(candidate) };
    }
  }
  next.sources = dedupeSources([...next.sources, ...incoming.sources]);
  next.fieldProvenance = mergeProvenance(next.fieldProvenance, incoming.fieldProvenance);
  next.conflicts = Object.keys(conflicts).length ? conflicts : undefined;
  if (next.conflicts) next.verificationStatus = "conflicting";
  else if (next.verificationStatus !== "verified" && incoming.verificationStatus === "verified") next.verificationStatus = "verified";
  next.updatedAt = newerDate(base.updatedAt, incoming.updatedAt);
  return next;
}

function cloneSchool(school: ApplicationSchool): ApplicationSchool { return JSON.parse(JSON.stringify(school)) as ApplicationSchool; }
function mergeProvenance(base: ApplicationSchool["fieldProvenance"], incoming: ApplicationSchool["fieldProvenance"]) {
  if (!base && !incoming) return undefined;
  const result: Record<string, ApplicationSchoolSource[]> = {};
  for (const [field, sources] of Object.entries(base ?? {})) result[field] = dedupeSources(sources);
  for (const [field, sources] of Object.entries(incoming ?? {})) result[field] = dedupeSources([...(result[field] ?? []), ...sources]);
  return result;
}
function dedupeSources(sources: ApplicationSchoolSource[]) { return [...new Map(sources.map((source) => [`${source.url}|${source.retrievedAt}`, source])).values()]; }
function newerDate(a?: string, b?: string) { return !a ? b : !b ? a : a > b ? a : b; }
function isMissingField(value: unknown) {
  if (value === undefined || value === null || value === "") return true;
  return typeof value === "string" && /^(unknown|not reported|not-reported|tbd)$/i.test(value.trim());
}
function fieldProvenance(value: unknown): Record<string, ApplicationSchoolSource[]> | undefined { return isRecord(value) ? value as Record<string, ApplicationSchoolSource[]> : undefined; }
function conflictsValue(value: unknown): Record<string, ApplicationSchoolConflict> | undefined { return isRecord(value) ? value as Record<string, ApplicationSchoolConflict> : undefined; }
function normalizeName(value: string) { return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function isRecord(value: unknown): value is Record<string, any> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isNonEmptyString(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function stringValue(value: unknown): string | undefined { return isNonEmptyString(value) ? value.trim() : undefined; }
function stringArray(value: unknown): string[] | undefined { if (!Array.isArray(value)) return undefined; const values = value.filter(isNonEmptyString).map((entry) => entry.trim()); return values.length ? values : undefined; }
function numberValue(value: unknown): number | undefined { return typeof value === "number" && Number.isFinite(value) ? value : undefined; }
function isValidTimestamp(value: string) { return !Number.isNaN(Date.parse(value)) && /T\d{2}:\d{2}/.test(value); }
function isPlausibleDeadline(value: string) { return /rolling|unknown|tbd|not applicable|n\/a/i.test(value) || !Number.isNaN(Date.parse(value)); }
function isHttpUrl(value: unknown): value is string { if (!isNonEmptyString(value)) return false; try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; } }
function issue(path: string, message: string, severity: DatasetIssueSeverity = "error"): DatasetIssue { return { path, message, severity }; }

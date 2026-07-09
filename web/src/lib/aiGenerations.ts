import { BUILD_INFO } from "./buildInfo";
import { STORAGE_KEYS } from "./brand";

export type AiGenerationKind =
  | "question-analysis"
  | "flashcards"
  | "study-plan"
  | "summary"
  | "taxonomy"
  | "other";

export interface AiGenerationRecord {
  id: string;
  kind: AiGenerationKind;
  title: string;
  inputHash?: string;
  sourceIds?: string[];
  createdAt: string;
  updatedAt: string;
  model?: string;
  promptVersion?: string;
  content: unknown;
  metadata?: Record<string, unknown>;
}

interface AiGenerationStore {
  schemaVersion: number;
  records: AiGenerationRecord[];
}

export type AiGenerationInput = Omit<AiGenerationRecord, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

const AI_GENERATION_SCHEMA_VERSION = 1;
const MAX_GENERATION_RECORDS = 250;
const KINDS: AiGenerationKind[] = ["question-analysis", "flashcards", "study-plan", "summary", "taxonomy", "other"];

export function loadAiGenerations(): AiGenerationRecord[] {
  return loadAiGenerationStore().records;
}

export function saveAiGeneration(input: AiGenerationInput): AiGenerationRecord {
  const store = loadAiGenerationStore();
  const now = new Date().toISOString();
  const sourceIds = normalizeStringList(input.sourceIds);
  const existingIndex = store.records.findIndex((record) =>
    (input.id && record.id === input.id) ||
    (input.inputHash && record.inputHash === input.inputHash && record.kind === input.kind),
  );
  const previous = existingIndex >= 0 ? store.records[existingIndex] : undefined;
  const record: AiGenerationRecord = {
    id: previous?.id ?? input.id ?? crypto.randomUUID(),
    kind: input.kind,
    title: input.title.trim() || "AI generation",
    inputHash: input.inputHash,
    sourceIds: sourceIds.length ? sourceIds : undefined,
    createdAt: previous?.createdAt ?? input.createdAt ?? now,
    updatedAt: now,
    model: input.model,
    promptVersion: input.promptVersion,
    content: input.content,
    metadata: input.metadata,
  };
  const records = existingIndex >= 0
    ? store.records.map((item, index) => (index === existingIndex ? record : item))
    : [record, ...store.records];
  persistAiGenerationStore({
    schemaVersion: AI_GENERATION_SCHEMA_VERSION,
    records: records
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, MAX_GENERATION_RECORDS),
  });
  return record;
}

export function hashGenerationInput(input: unknown): string {
  const text = stableStringify(input);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function migrateAiGenerationStorage(): void {
  const store = loadAiGenerationStore();
  persistAiGenerationStore(store);
}

function loadAiGenerationStore(): AiGenerationStore {
  const fallback: AiGenerationStore = { schemaVersion: AI_GENERATION_SCHEMA_VERSION, records: [] };
  const storage = getLocalStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(STORAGE_KEYS.aiGenerations);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return { schemaVersion: AI_GENERATION_SCHEMA_VERSION, records: parsed.map(normalizeRecord).filter(isAiGenerationRecord) };
    }
    if (isRecord(parsed) && Array.isArray(parsed.records)) {
      return {
        schemaVersion: AI_GENERATION_SCHEMA_VERSION,
        records: parsed.records.map(normalizeRecord).filter(isAiGenerationRecord),
      };
    }
  } catch {
    return fallback;
  }
  return fallback;
}

function persistAiGenerationStore(store: AiGenerationStore) {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.aiGenerations, JSON.stringify({
      schemaVersion: AI_GENERATION_SCHEMA_VERSION,
      build: {
        version: BUILD_INFO.version,
        schemaVersion: BUILD_INFO.schemaVersion,
      },
      records: store.records,
    }));
  } catch {
    /* AI artifacts are best-effort; source data remains in the main vault. */
  }
}

function normalizeRecord(value: unknown): AiGenerationRecord | null {
  if (!isRecord(value)) return null;
  const kind = KINDS.includes(value.kind as AiGenerationKind) ? value.kind as AiGenerationKind : "other";
  const title = typeof value.title === "string" && value.title.trim() ? value.title.trim() : "AI generation";
  const now = new Date().toISOString();
  return {
    id: typeof value.id === "string" && value.id ? value.id : crypto.randomUUID(),
    kind,
    title,
    inputHash: typeof value.inputHash === "string" && value.inputHash ? value.inputHash : undefined,
    sourceIds: normalizeStringList(value.sourceIds),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
    model: typeof value.model === "string" && value.model ? value.model : undefined,
    promptVersion: typeof value.promptVersion === "string" && value.promptVersion ? value.promptVersion : undefined,
    content: value.content,
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
  };
}

function isAiGenerationRecord(value: AiGenerationRecord | null): value is AiGenerationRecord {
  return value !== null;
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()))];
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function stableValue(value: unknown): unknown {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(stableValue);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  if (["string", "number", "boolean"].includes(typeof value)) return value;
  return String(value);
}

function getLocalStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

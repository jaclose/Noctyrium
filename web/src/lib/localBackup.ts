import { BUILD_INFO, type BuildInfo } from "./buildInfo";
import { STORAGE_KEYS } from "./brand";

const BACKUP_SCHEMA_VERSION = 1;
const DEFAULT_BACKUP_LIMIT = 8;
const VAULT_STORE_NAME = "state";

export interface LocalBackupSnapshot {
  schemaVersion: number;
  savedAt: string;
  oldSchemaVersion: number;
  build: BuildInfo;
  localStorage: Record<string, string>;
  indexedDb?: {
    dbName: string;
    storeName: string;
    records: Record<string, string>;
  };
}

export interface LocalBackupSummary {
  key: string;
  savedAt: string;
  oldSchemaVersion: number;
  appVersion: string;
  commitSha: string;
}

export async function createLocalBackup(
  oldSchemaVersion: number,
  backupLimit = DEFAULT_BACKUP_LIMIT,
): Promise<string | null> {
  const savedAt = new Date().toISOString();
  const snapshot: LocalBackupSnapshot = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    savedAt,
    oldSchemaVersion,
    build: BUILD_INFO,
    localStorage: collectRelevantLocalStorage(),
  };

  const indexedDb = await readVaultIndexedDb().catch(() => undefined);
  if (indexedDb && Object.keys(indexedDb.records).length > 0) {
    snapshot.indexedDb = indexedDb;
  }

  if (Object.keys(snapshot.localStorage).length === 0 && !snapshot.indexedDb) {
    return null;
  }

  const key = `${STORAGE_KEYS.localBackupPrefix}${savedAt}`;
  getLocalStorage()?.setItem(key, JSON.stringify(snapshot));
  pruneLocalBackups(backupLimit);
  return key;
}

export function listLocalBackups(): LocalBackupSummary[] {
  const storage = getLocalStorage();
  if (!storage) return [];
  return localStorageKeys(storage)
    .filter((key) => key.startsWith(STORAGE_KEYS.localBackupPrefix))
    .sort((a, b) => b.localeCompare(a))
    .map((key) => {
      const fallbackSavedAt = key.slice(STORAGE_KEYS.localBackupPrefix.length);
      try {
        const raw = storage.getItem(key);
        const parsed = raw ? JSON.parse(raw) as unknown : null;
        if (isBackupSnapshot(parsed)) {
          return {
            key,
            savedAt: parsed.savedAt,
            oldSchemaVersion: parsed.oldSchemaVersion,
            appVersion: parsed.build.version,
            commitSha: parsed.build.commitSha,
          };
        }
      } catch {
        /* ignore malformed backup metadata */
      }
      return {
        key,
        savedAt: fallbackSavedAt,
        oldSchemaVersion: 0,
        appVersion: "unknown",
        commitSha: "unknown",
      };
    });
}

export function pruneLocalBackups(keep = DEFAULT_BACKUP_LIMIT) {
  const storage = getLocalStorage();
  if (!storage) return;
  const keys = localStorageKeys(storage)
    .filter((key) => key.startsWith(STORAGE_KEYS.localBackupPrefix))
    .sort((a, b) => b.localeCompare(a));
  for (const key of keys.slice(Math.max(0, keep))) {
    storage.removeItem(key);
  }
}

function collectRelevantLocalStorage(): Record<string, string> {
  const storage = getLocalStorage();
  if (!storage) return {};
  const snapshot: Record<string, string> = {};
  for (const key of localStorageKeys(storage)) {
    if (!isRelevantStorageKey(key)) continue;
    const value = storage.getItem(key);
    if (value !== null) snapshot[key] = value;
  }
  return snapshot;
}

function isRelevantStorageKey(key: string): boolean {
  if (key.startsWith(STORAGE_KEYS.localBackupPrefix)) return false;
  return (
    key === STORAGE_KEYS.persistedState ||
    key.startsWith(`${STORAGE_KEYS.persistedState}:`) ||
    key.startsWith("noctyrium") ||
    key.startsWith("noctyrium:") ||
    key.startsWith("axom.")
  );
}

function localStorageKeys(storage: Storage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

function getLocalStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

async function readVaultIndexedDb(): Promise<NonNullable<LocalBackupSnapshot["indexedDb"]>> {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB is unavailable");
  const db = await openVault();
  try {
    const tx = db.transaction(VAULT_STORE_NAME, "readonly");
    const store = tx.objectStore(VAULT_STORE_NAME);
    const [keys, values] = await Promise.all([
      requestResult(store.getAllKeys()),
      requestResult(store.getAll()),
    ]);
    const records: Record<string, string> = {};
    keys.forEach((key, index) => {
      records[String(key)] = serializeStoredValue(values[index]);
    });
    return { dbName: STORAGE_KEYS.vaultDb, storeName: VAULT_STORE_NAME, records };
  } finally {
    db.close();
  }
}

function openVault(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(STORAGE_KEYS.vaultDb);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open local vault"));
    request.onblocked = () => reject(new Error("Local vault is blocked by another tab"));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function serializeStoredValue(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isBackupSnapshot(value: unknown): value is LocalBackupSnapshot {
  if (!isRecord(value) || !isRecord(value.build)) return false;
  return (
    typeof value.savedAt === "string" &&
    typeof value.oldSchemaVersion === "number" &&
    typeof value.build.version === "string" &&
    typeof value.build.commitSha === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

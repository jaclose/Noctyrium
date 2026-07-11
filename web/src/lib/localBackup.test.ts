import { indexedDB as fakeIndexedDb, IDBKeyRange } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "./brand";
import { createLocalBackup, listLocalBackups, pruneLocalBackups, readLocalBackup } from "./localBackup";
import { BACKUP_STORE_NAME, DB_NAME, DB_VERSION, localVaultStorage, STORE_NAME } from "./localVault";

const values = new Map<string, string>();
const storage = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: (key: string) => values.get(key) ?? null,
  key: (index: number) => [...values.keys()][index] ?? null,
  removeItem: (key: string) => { values.delete(key); },
  setItem: (key: string, value: string) => { values.set(key, String(value)); },
};

beforeEach(async () => {
  values.clear();
  vi.stubGlobal("indexedDB", fakeIndexedDb);
  vi.stubGlobal("IDBKeyRange", IDBKeyRange);
  vi.stubGlobal("localStorage", storage);
  await deleteDatabase(STORAGE_KEYS.vaultDb);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("automatic local migration backups", () => {
  it("uses the canonical vault version and object stores shared with primary persistence", async () => {
    const persisted = JSON.stringify({ state: { profile: { userId: "jd" }, questions: [{ id: "q1" }] }, version: 32 });
    await localVaultStorage.setItem(STORAGE_KEYS.persistedState, persisted);
    await createLocalBackup(31);

    const db = await openDatabase(DB_NAME);
    expect(db.version).toBe(DB_VERSION);
    expect([...db.objectStoreNames]).toEqual(expect.arrayContaining([STORE_NAME, BACKUP_STORE_NAME]));
    db.close();
  });

  it("stores the full snapshot in IndexedDB and only summary metadata in localStorage", async () => {
    const persisted = JSON.stringify({
      state: { profile: { userId: "jd", name: "JD" }, questions: [{ id: "q1", stem: "large payload" }] },
      version: 32,
    });
    await localVaultStorage.setItem(STORAGE_KEYS.persistedState, persisted);

    const key = await createLocalBackup(31);
    expect(key).toBeTruthy();
    const marker = JSON.parse(localStorage.getItem(key!)!) as { storage: string; oldSchemaVersion: number; sizeBytes: number };
    expect(marker).toMatchObject({ storage: "indexeddb", oldSchemaVersion: 31 });
    expect(marker.sizeBytes).toBeGreaterThan(0);
    expect(localStorage.getItem(key!)).not.toContain("large payload");

    const recovered = await readLocalBackup(key!);
    expect(recovered?.indexedDb?.records[STORAGE_KEYS.persistedState]).toBe(persisted);
    expect(listLocalBackups()).toHaveLength(1);
  });

  it("prunes both metadata and IndexedDB payloads to the requested retention limit", async () => {
    const persisted = JSON.stringify({ state: { profile: { userId: "jd" }, questions: [{ id: "q1" }] }, version: 32 });
    await localVaultStorage.setItem(STORAGE_KEYS.persistedState, persisted);
    const older = await createLocalBackup(30, 1);
    await new Promise((resolve) => setTimeout(resolve, 5));
    const newer = await createLocalBackup(31, 1);

    expect(listLocalBackups().map((backup) => backup.key)).toEqual([newer]);
    expect(await readLocalBackup(older!)).toBeNull();
    expect(await readLocalBackup(newer!)).not.toBeNull();
  });

  it("keeps a recoverable full localStorage snapshot when IndexedDB is unavailable", async () => {
    vi.stubGlobal("indexedDB", undefined);
    localStorage.setItem(STORAGE_KEYS.persistedState, JSON.stringify({ state: { questions: [{ id: "fallback" }] } }));
    const key = await createLocalBackup(31);
    const raw = localStorage.getItem(key!);
    expect(raw).toContain("fallback");
    expect((await readLocalBackup(key!))?.oldSchemaVersion).toBe(31);
  });

  it("does not let newer unreadable markers displace the only verified backup", async () => {
    const persisted = JSON.stringify({ state: { profile: { userId: "jd" }, questions: [{ id: "safe" }] }, version: 32 });
    await localVaultStorage.setItem(STORAGE_KEYS.persistedState, persisted);
    const validKey = await createLocalBackup(31, 8);
    for (let index = 0; index < 8; index += 1) {
      localStorage.setItem(`${STORAGE_KEYS.localBackupPrefix}2099-01-0${index + 1}T00:00:00.000Z`, JSON.stringify({
        storage: "indexeddb", savedAt: `2099-01-0${index + 1}T00:00:00.000Z`,
        oldSchemaVersion: 31, appVersion: "missing", commitSha: "missing",
      }));
    }
    await pruneLocalBackups(1);
    expect(await readLocalBackup(validKey!)).not.toBeNull();
  });
});

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    const request = fakeIndexedDb.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

function openDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = fakeIndexedDb.open(name);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

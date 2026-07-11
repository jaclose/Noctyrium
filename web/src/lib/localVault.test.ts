import { indexedDB as fakeIndexedDb, IDBKeyRange } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localVaultStorage } from "./localVault";
import { STORAGE_KEYS } from "./brand";

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

afterEach(() => vi.unstubAllGlobals());

describe("IndexedDB-first local vault", () => {
  it("stores the large workspace in IndexedDB and keeps only a small profile pointer in localStorage", async () => {
    const persisted = JSON.stringify({ state: { profile: { userId: "jd", name: "JD" }, questions: [{ id: "q1" }] }, version: 32 });
    await localVaultStorage.setItem(STORAGE_KEYS.persistedState, persisted);
    expect(localStorage.getItem(STORAGE_KEYS.persistedState)).toBeNull();
    expect(localStorage.getItem(`${STORAGE_KEYS.persistedState}:active-user`)).toBe("jd");
    expect(await localVaultStorage.getItem(STORAGE_KEYS.persistedState)).toBe(persisted);
  });

  it("uses the full localStorage fallback only when IndexedDB is unavailable", async () => {
    vi.stubGlobal("indexedDB", undefined);
    const persisted = JSON.stringify({ state: { profile: { userId: "jd", name: "JD" } }, version: 32 });
    await localVaultStorage.setItem(STORAGE_KEYS.persistedState, persisted);
    expect(localStorage.getItem(STORAGE_KEYS.persistedState)).toBe(persisted);
    expect(await localVaultStorage.getItem(STORAGE_KEYS.persistedState)).toBe(persisted);
  });

  it("removes primary, profile pointer, and scoped IndexedDB records together", async () => {
    const persisted = JSON.stringify({ state: { profile: { userId: "jd", name: "JD" } }, version: 32 });
    await localVaultStorage.setItem(STORAGE_KEYS.persistedState, persisted);
    await localVaultStorage.removeItem(STORAGE_KEYS.persistedState);
    expect(await localVaultStorage.getItem(STORAGE_KEYS.persistedState)).toBeNull();
    expect(localStorage.getItem(`${STORAGE_KEYS.persistedState}:active-user`)).toBeNull();
  });

  it("falls back deterministically instead of hanging when a v2 upgrade is blocked by an old tab", async () => {
    const oldConnection = await openVersionOneVault();
    const persisted = JSON.stringify({ state: { profile: { userId: "jd" }, questions: [{ id: "safe" }] }, version: 32 });
    await expect(Promise.race([
      localVaultStorage.setItem(STORAGE_KEYS.persistedState, persisted),
      new Promise((_, reject) => setTimeout(() => reject(new Error("setItem hung")), 500)),
    ])).resolves.toBeUndefined();
    expect(localStorage.getItem(STORAGE_KEYS.persistedState)).toBe(persisted);
    oldConnection.close();
  });
});

function openVersionOneVault(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = fakeIndexedDb.open(STORAGE_KEYS.vaultDb, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("state")) request.result.createObjectStore("state");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    const request = fakeIndexedDb.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

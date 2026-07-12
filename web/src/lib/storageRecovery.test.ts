import { indexedDB as fakeIndexedDb, IDBKeyRange } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "./brand";
import { createLocalBackup } from "./localBackup";
import { localVaultStorage } from "./localVault";
import { makeSeed, SCHEMA_VERSION } from "./seed";
import { inspectLocalWorkspaceBackup, restoreLocalWorkspaceBackup } from "./storageRecovery";

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

describe("automatic workspace recovery", () => {
  it("verifies and restores only the normalized workspace through the local vault", async () => {
    const backedUp = makeSeed();
    backedUp.profile = { ...backedUp.profile, name: "Snapshot user", userId: "snapshot-user" };
    await localVaultStorage.setItem(
      STORAGE_KEYS.persistedState,
      JSON.stringify({ state: backedUp, version: 31 }),
    );
    localStorage.setItem(STORAGE_KEYS.themePreference, "dark");
    localStorage.setItem(STORAGE_KEYS.migrationFailure, "original-marker");
    const key = await createLocalBackup(31);
    expect(key).toBeTruthy();

    const current = makeSeed();
    current.profile = { ...current.profile, name: "Current user", userId: "current-user" };
    await localVaultStorage.setItem(
      STORAGE_KEYS.persistedState,
      JSON.stringify({ state: current, version: SCHEMA_VERSION }),
    );
    localStorage.setItem(STORAGE_KEYS.themePreference, "light");
    localStorage.setItem(STORAGE_KEYS.migrationFailure, "unresolved-marker");

    const inspection = await inspectLocalWorkspaceBackup(key!);
    expect(inspection).toMatchObject({ oldSchemaVersion: 31 });
    expect(inspection?.state.profile.name).toBe("Snapshot user");

    await restoreLocalWorkspaceBackup(key!);
    const restored = JSON.parse((await localVaultStorage.getItem(STORAGE_KEYS.persistedState))!) as {
      state: ReturnType<typeof makeSeed>;
      version: number;
    };
    expect(restored.version).toBe(SCHEMA_VERSION);
    expect(restored.state.profile.name).toBe("Snapshot user");
    expect(localStorage.getItem(STORAGE_KEYS.themePreference)).toBe("light");
    expect(localStorage.getItem(STORAGE_KEYS.migrationFailure)).toBe("unresolved-marker");
  });

  it("accepts the intentional scoped localStorage fallback and rejects malformed workspaces", async () => {
    vi.stubGlobal("indexedDB", undefined);
    const fallback = makeSeed();
    fallback.profile = { ...fallback.profile, name: "Fallback user", userId: "fallback-user" };
    localStorage.setItem(
      `${STORAGE_KEYS.persistedState}:user:fallback-user`,
      JSON.stringify({ state: fallback, version: 31 }),
    );
    const validKey = await createLocalBackup(31);
    expect((await inspectLocalWorkspaceBackup(validKey!))?.state.profile.name).toBe("Fallback user");

    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.persistedState, JSON.stringify({ state: { terms: "invalid" }, version: 31 }));
    const invalidKey = await createLocalBackup(31);
    await expect(inspectLocalWorkspaceBackup(invalidKey!)).resolves.toBeNull();
    await expect(restoreLocalWorkspaceBackup(invalidKey!)).rejects.toThrow(/could not be verified/i);
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

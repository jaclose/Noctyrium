import { indexedDB as fakeIndexedDb, IDBKeyRange } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "./brand";
import { loadAiGenerations, migrateAiGenerationStorage, saveAiGeneration } from "./aiGenerations";

const values = new Map<string, string>();
const storage = {
  get length() { return values.size; }, clear: () => values.clear(),
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

describe("AI generation vault", () => {
  it("persists large artifacts in IndexedDB without a localStorage mirror", async () => {
    await saveAiGeneration({ kind: "summary", title: "One", inputHash: "one", content: "x".repeat(20_000) });
    await saveAiGeneration({ kind: "summary", title: "Two", inputHash: "two", content: { grounded: true } });
    expect(localStorage.getItem(STORAGE_KEYS.aiGenerations)).toBeNull();
    expect([...values.keys()].some((key) => key.startsWith(`${STORAGE_KEYS.aiGenerations}:`))).toBe(false);
    expect((await loadAiGenerations()).map((record) => record.title)).toEqual(["Two", "One"]);
  });

  it("moves a legacy localStorage payload into the IndexedDB-first adapter", async () => {
    localStorage.setItem(STORAGE_KEYS.aiGenerations, JSON.stringify({
      schemaVersion: 1,
      records: [{ id: "legacy", kind: "summary", title: "Legacy", createdAt: "2026-01-01", updatedAt: "2026-01-01", content: "saved" }],
    }));
    await migrateAiGenerationStorage();
    expect(localStorage.getItem(STORAGE_KEYS.aiGenerations)).toBeNull();
    expect((await loadAiGenerations())[0].id).toBe("legacy");
  });

  it("serializes concurrent best-effort saves without dropping either artifact", async () => {
    await Promise.all([
      saveAiGeneration({ kind: "summary", title: "Concurrent A", inputHash: "a", content: "A" }),
      saveAiGeneration({ kind: "summary", title: "Concurrent B", inputHash: "b", content: "B" }),
    ]);
    expect(new Set((await loadAiGenerations()).map((record) => record.inputHash))).toEqual(new Set(["a", "b"]));
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

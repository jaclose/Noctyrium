import type { StateStorage } from "zustand/middleware";
import { userIdFromName } from "./userIdentity";

const DB_NAME = "noctyrium-local-vault";
const STORE_NAME = "state";
const activeUserKey = (name: string) => `${name}:active-user`;
const scopedStateKey = (name: string, userId: string) => `${name}:user:${userId}`;

function localFallback(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function openVault(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Unable to open local vault"));
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openVault();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const req = run(tx.objectStore(STORE_NAME));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Local vault request failed"));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Local vault transaction failed"));
    };
  });
}

export const localVaultStorage: StateStorage = {
  async getItem(name) {
    try {
      const value = await withStore<string | undefined>("readonly", (store) => store.get(name));
      if (value) return value;

      const activeUser = await withStore<string | undefined>("readonly", (store) => store.get(activeUserKey(name)));
      if (activeUser) {
        const scoped = await withStore<string | undefined>("readonly", (store) => store.get(scopedStateKey(name, activeUser)));
        if (scoped) return scoped;
      }
    } catch {
      // Fall back below.
    }

    const fallbackStore = localFallback();
    const fallback = fallbackStore?.getItem(name) ??
      fallbackStore?.getItem(scopedStateKey(name, fallbackStore?.getItem(activeUserKey(name)) ?? "")) ??
      null;
    if (fallback) {
      try {
        await withStore("readwrite", (store) => store.put(fallback, name));
      } catch {
        // localStorage still has the data; no need to interrupt app load.
      }
    }
    return fallback;
  },

  async setItem(name, value) {
    const userId = persistedUserId(value);
    const fallbackStore = localFallback();
    fallbackStore?.setItem(name, value);
    if (userId) {
      fallbackStore?.setItem(activeUserKey(name), userId);
      fallbackStore?.setItem(scopedStateKey(name, userId), value);
    }
    try {
      await withStore("readwrite", (store) => {
        store.put(value, name);
        if (userId) {
          store.put(userId, activeUserKey(name));
          store.put(value, scopedStateKey(name, userId));
        }
        return store.get(name);
      });
    } catch {
      // localStorage fallback above already persisted the write.
    }
  },

  async removeItem(name) {
    localFallback()?.removeItem(name);
    try {
      await withStore("readwrite", (store) => store.delete(name));
    } catch {
      // No-op; best effort cleanup.
    }
  },
};

function persistedUserId(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      state?: { profile?: { userId?: unknown; name?: unknown } };
    };
    const profile = parsed.state?.profile;
    if (typeof profile?.userId === "string" && profile.userId.trim()) return profile.userId;
    return userIdFromName(typeof profile?.name === "string" ? profile.name : "");
  } catch {
    return "";
  }
}

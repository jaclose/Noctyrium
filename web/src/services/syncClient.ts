import type { BackendHealth, CloudBackup, CloudSnapshot, CloudUser, SaveCloudInput } from "../types/sync";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data.message === "string" ? data.message : "Cloud request failed.";
    throw new Error(message);
  }
  return data as T;
}

export async function loginByName(name: string) {
  const data = await api<{ user: CloudUser }>("/api/user/login", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return data.user;
}

export async function getBackendHealth() {
  return api<BackendHealth>("/api/health");
}

export async function saveProgressByName(name: string, input: SaveCloudInput) {
  const data = await api<{ user: CloudUser; snapshot: CloudSnapshot }>("/api/progress/save", {
    method: "POST",
    body: JSON.stringify({ name, ...toApiPayload(input) }),
  });
  return data;
}

export async function loadProgressByName(name: string) {
  const data = await api<{ user: CloudUser; snapshot: CloudSnapshot | null }>("/api/progress/load", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return data;
}

export async function getCloudUser(userId: string) {
  const data = await api<{ user: CloudUser }>(`/api/user/${encodeURIComponent(userId)}`);
  return data.user;
}

export async function getCloudData(userId: string) {
  const data = await api<{ snapshot: CloudSnapshot | null }>(`/api/data/${encodeURIComponent(userId)}`);
  return data.snapshot;
}

export async function saveCloudData(userId: string, input: SaveCloudInput) {
  const data = await api<{ snapshot: CloudSnapshot }>(`/api/data/${encodeURIComponent(userId)}`, {
    method: "POST",
    body: JSON.stringify(toApiPayload(input)),
  });
  return data.snapshot;
}

export async function createCloudBackup(userId: string, input: SaveCloudInput) {
  const data = await api<{ snapshot: CloudSnapshot }>(`/api/data/${encodeURIComponent(userId)}/backup`, {
    method: "POST",
    body: JSON.stringify(toApiPayload(input)),
  });
  return data.snapshot;
}

export async function listCloudBackups(userId: string) {
  const data = await api<{ backups: CloudBackup[] }>(`/api/data/${encodeURIComponent(userId)}/backups`);
  return data.backups;
}

export async function restoreCloudBackup(userId: string, backupId: string) {
  return api<{ backup: CloudSnapshot; current: CloudSnapshot }>(
    `/api/data/${encodeURIComponent(userId)}/restore/${encodeURIComponent(backupId)}`,
    { method: "POST", body: "{}" },
  );
}

function toApiPayload(input: SaveCloudInput) {
  return {
    app_version: input.appVersion,
    schema_version: input.schemaVersion,
    data_json: input.dataJson,
    device_label: input.deviceLabel,
    backup_label: input.backupLabel,
  };
}

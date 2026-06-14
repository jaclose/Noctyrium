import { ApiError } from "./http";
import { getReadySql, hasDatabase } from "./db";

type DbRow = Record<string, unknown>;

export interface SaveSnapshotInput {
  appVersion: string;
  schemaVersion: number;
  dataJson: Record<string, unknown>;
  deviceLabel?: string;
  backupLabel?: string;
}

export function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function loginByName(name: string) {
  ensureDb();
  const displayName = name.trim().replace(/\s+/g, " ");
  const normalizedName = normalizeName(displayName);
  if (!normalizedName) throw new ApiError(400, "Name is required.");
  if (displayName.length > 80) throw new ApiError(400, "Name is too long.");

  const sql = await getReadySql();
  const rows = (await sql`
    INSERT INTO users (display_name, normalized_name, last_login_at, updated_at)
    VALUES (${displayName}, ${normalizedName}, now(), now())
    ON CONFLICT (normalized_name)
    DO UPDATE SET
      display_name = EXCLUDED.display_name,
      last_login_at = now(),
      updated_at = now()
    RETURNING id, display_name, normalized_name, created_at, updated_at, last_login_at
  `) as DbRow[];
  return mapUser(rows[0]);
}

export async function getUser(id: string) {
  ensureDb();
  const sql = await getReadySql();
  const rows = (await sql`
    SELECT id, display_name, normalized_name, created_at, updated_at, last_login_at
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `) as DbRow[];
  if (!rows[0]) throw new ApiError(404, "User not found.");
  return mapUser(rows[0]);
}

export async function getLatestSnapshot(userId: string) {
  ensureDb();
  await getUser(userId);
  const sql = await getReadySql();
  const rows = (await sql`
    SELECT id, user_id, app_version, schema_version, data_json, device_label, backup_label, created_at, updated_at
    FROM user_data_snapshots
    WHERE user_id = ${userId} AND backup_label IS NULL
    ORDER BY updated_at DESC
    LIMIT 1
  `) as DbRow[];
  return rows[0] ? mapSnapshot(rows[0]) : null;
}

export async function saveCurrentSnapshot(userId: string, input: SaveSnapshotInput) {
  ensureDb();
  await getUser(userId);
  const sql = await getReadySql();
  const dataJson = JSON.stringify(input.dataJson);
  const rows = (await sql`
    INSERT INTO user_data_snapshots (
      user_id, app_version, schema_version, data_json, device_label, backup_label, updated_at
    )
    VALUES (
      ${userId}, ${input.appVersion}, ${input.schemaVersion}, ${dataJson}::jsonb, ${input.deviceLabel ?? null}, NULL, now()
    )
    ON CONFLICT (user_id) WHERE backup_label IS NULL
    DO UPDATE SET
      app_version = EXCLUDED.app_version,
      schema_version = EXCLUDED.schema_version,
      data_json = EXCLUDED.data_json,
      device_label = EXCLUDED.device_label,
      updated_at = now()
    RETURNING id, user_id, app_version, schema_version, data_json, device_label, backup_label, created_at, updated_at
  `) as DbRow[];
  await logChange(userId, "save_snapshot", "user_data_snapshot", String(rows[0].id), {
    appVersion: input.appVersion,
    schemaVersion: input.schemaVersion,
  }, input.deviceLabel);
  return mapSnapshot(rows[0]);
}

export async function createBackupSnapshot(userId: string, input: SaveSnapshotInput) {
  ensureDb();
  await getUser(userId);
  const sql = await getReadySql();
  const label = input.backupLabel || `Backup ${new Date().toISOString()}`;
  const dataJson = JSON.stringify(input.dataJson);
  const rows = (await sql`
    INSERT INTO user_data_snapshots (
      user_id, app_version, schema_version, data_json, device_label, backup_label
    )
    VALUES (
      ${userId}, ${input.appVersion}, ${input.schemaVersion}, ${dataJson}::jsonb, ${input.deviceLabel ?? null}, ${label}
    )
    RETURNING id, user_id, app_version, schema_version, data_json, device_label, backup_label, created_at, updated_at
  `) as DbRow[];
  await logChange(userId, "create_backup", "user_data_snapshot", String(rows[0].id), {
    backupLabel: label,
    appVersion: input.appVersion,
    schemaVersion: input.schemaVersion,
  }, input.deviceLabel);
  return mapSnapshot(rows[0]);
}

export async function listBackups(userId: string) {
  ensureDb();
  await getUser(userId);
  const sql = await getReadySql();
  const rows = (await sql`
    SELECT id, user_id, app_version, schema_version, device_label, backup_label, created_at, updated_at
    FROM user_data_snapshots
    WHERE user_id = ${userId} AND backup_label IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 50
  `) as DbRow[];
  return rows.map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    appVersion: String(row.app_version),
    schemaVersion: Number(row.schema_version),
    deviceLabel: row.device_label ? String(row.device_label) : undefined,
    backupLabel: row.backup_label ? String(row.backup_label) : undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  }));
}

export async function restoreBackup(userId: string, backupId: string) {
  ensureDb();
  await getUser(userId);
  const sql = await getReadySql();
  const backups = (await sql`
    SELECT id, user_id, app_version, schema_version, data_json, device_label, backup_label, created_at, updated_at
    FROM user_data_snapshots
    WHERE user_id = ${userId} AND id = ${backupId} AND backup_label IS NOT NULL
    LIMIT 1
  `) as DbRow[];
  if (!backups[0]) throw new ApiError(404, "Backup not found.");
  const backup = mapSnapshot(backups[0]);
  const current = await saveCurrentSnapshot(userId, {
    appVersion: backup.appVersion,
    schemaVersion: backup.schemaVersion,
    dataJson: backup.dataJson,
    deviceLabel: backup.deviceLabel,
  });
  await logChange(userId, "restore_backup", "user_data_snapshot", backupId, {
    restoredToSnapshotId: current.id,
  }, backup.deviceLabel);
  return { backup, current };
}

export async function logAiUsage(input: {
  userId?: string;
  feature: string;
  inputSummary?: string;
  outputSummary?: string;
  tokenEstimate?: number;
}) {
  if (!hasDatabase()) return;
  const sql = await getReadySql();
  await sql`
    INSERT INTO ai_usage_logs (user_id, feature, input_summary, output_summary, token_estimate)
    VALUES (${input.userId ?? null}, ${input.feature}, ${input.inputSummary ?? null}, ${input.outputSummary ?? null}, ${input.tokenEstimate ?? null})
  `;
}

async function logChange(
  userId: string,
  changeType: string,
  entityType: string,
  entityId: string,
  patch: Record<string, unknown>,
  sourceDevice?: string,
) {
  const sql = await getReadySql();
  const patchJson = JSON.stringify(patch);
  await sql`
    INSERT INTO sync_change_log (user_id, change_type, entity_type, entity_id, patch_json, source_device)
    VALUES (${userId}, ${changeType}, ${entityType}, ${entityId}, ${patchJson}::jsonb, ${sourceDevice ?? null})
  `;
}

function ensureDb() {
  if (!hasDatabase()) {
    throw new ApiError(503, "DATABASE_URL is not configured. Local-first mode still works in the browser.");
  }
}

function mapUser(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    displayName: String(row.display_name),
    normalizedName: String(row.normalized_name),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    lastLoginAt: iso(row.last_login_at),
    authNote: "This is lightweight identity, not secure authentication. For production multi-user use, migrate to email magic links, OAuth, or passkeys.",
  };
}

function mapSnapshot(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    appVersion: String(row.app_version),
    schemaVersion: Number(row.schema_version),
    dataJson: row.data_json as Record<string, unknown>,
    deviceLabel: row.device_label ? String(row.device_label) : undefined,
    backupLabel: row.backup_label ? String(row.backup_label) : undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

CREATE TABLE IF NOT EXISTS local_vault_snapshots (
  id TEXT PRIMARY KEY,
  profile_user_id TEXT NOT NULL,
  profile_name TEXT NOT NULL,
  app_version TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  device_label TEXT,
  backup_label TEXT
);

CREATE INDEX IF NOT EXISTS idx_local_vault_snapshots_profile_updated
  ON local_vault_snapshots (profile_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS native_kv (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

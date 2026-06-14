-- Noctyrium optional cloud backend schema.
-- Phase 1 stores full JSON snapshots first; relational breakouts can come later.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
  normalized_name text NOT NULL UNIQUE CHECK (char_length(normalized_name) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_data_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_version text NOT NULL DEFAULT 'unknown',
  schema_version integer NOT NULL DEFAULT 11,
  data_json jsonb NOT NULL,
  device_label text,
  backup_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_data_snapshots_current_idx
  ON user_data_snapshots(user_id)
  WHERE backup_label IS NULL;

CREATE INDEX IF NOT EXISTS user_data_snapshots_backups_idx
  ON user_data_snapshots(user_id, created_at DESC)
  WHERE backup_label IS NOT NULL;

CREATE TABLE IF NOT EXISTS sync_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  change_type text NOT NULL,
  entity_type text,
  entity_id text,
  patch_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  source_device text
);

CREATE INDEX IF NOT EXISTS sync_change_log_user_created_idx
  ON sync_change_log(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  feature text NOT NULL,
  input_summary text,
  output_summary text,
  token_estimate integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_logs_user_created_idx
  ON ai_usage_logs(user_id, created_at DESC);

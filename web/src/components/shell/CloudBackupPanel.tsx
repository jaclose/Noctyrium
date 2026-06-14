import { RotateCcw } from "lucide-react";
import { GButton } from "../ui/primitives";
import type { CloudBackup } from "../../types/sync";

export function CloudBackupPanel({
  backups,
  busy,
  onRefresh,
  onRestore,
}: {
  backups: CloudBackup[];
  busy: boolean;
  onRefresh: () => void;
  onRestore: (backupId: string) => void;
}) {
  return (
    <div className="sync-backups">
      <div className="spread">
        <span className="field-label">Cloud backups</span>
        <GButton size="tiny" onClick={onRefresh} disabled={busy}>Refresh</GButton>
      </div>
      {backups.length === 0 ? (
        <div className="sub">No cloud backups yet. Create one before major restores or device changes.</div>
      ) : (
        <div className="backup-list">
          {backups.map((backup) => (
            <div className="backup-row" key={backup.id}>
              <div className="grow">
                <div className="backup-title">{backup.backupLabel || "Cloud backup"}</div>
                <div className="sub">
                  {formatDate(backup.createdAt)}
                  {backup.deviceLabel ? ` - ${backup.deviceLabel}` : ""}
                </div>
              </div>
              <GButton size="tiny" onClick={() => onRestore(backup.id)} disabled={busy}>
                <RotateCcw size={13} /> Restore
              </GButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

// ===========================================================================
// Local data health (directive §5) — the visible trust surface: storage
// driver, record counts, schema/migration state, last backup age, and the
// pre-migration snapshot recovery path. No silent states.
// ===========================================================================
import { useEffect, useState } from "react";
import { Database, HardDrive, History, ShieldCheck, Wrench } from "lucide-react";
import { useStore } from "../../lib/store";
import { lastBackupAt } from "../../lib/backup";
import { listLocalBackups } from "../../lib/localBackup";
import { findOrphans } from "../../lib/orphanRepair";
import { SCHEMA_VERSION, APP_BUILD_LABEL } from "../../lib/seed";
import { STORAGE_KEYS } from "../../lib/brand";
import { GhostButton, Tag } from "../ui/primitives";
import { pushToast } from "../../lib/toast";

async function probeIndexedDb(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(false);
      const req = indexedDB.open(STORAGE_KEYS.vaultDb);
      req.onsuccess = () => { req.result.close(); resolve(true); };
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

function readPreMigrationSnapshot(): { fromVersion: number; savedAt: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.preMigrationSnapshot);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { fromVersion?: number; savedAt?: string };
    if (typeof parsed.fromVersion !== "number" || typeof parsed.savedAt !== "string") return null;
    return { fromVersion: parsed.fromVersion, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export function DataHealthPanel() {
  const s = useStore();
  const [idbOk, setIdbOk] = useState<boolean | null>(null);
  const snapshot = readPreMigrationSnapshot();
  const backup = lastBackupAt();
  const localBackups = listLocalBackups();

  useEffect(() => {
    let stopped = false;
    probeIndexedDb().then((ok) => { if (!stopped) setIdbOk(ok); });
    return () => { stopped = true; };
  }, []);

  const backupAgeDays = backup ? Math.floor((Date.now() - Date.parse(backup)) / 86_400_000) : null;
  const questionCount = (s.questions ?? []).length;
  const orphans = findOrphans(s);
  // Nudge a backup when there's meaningful work and no recent export.
  const backupReminder = questionCount >= 20 && (backupAgeDays === null || backupAgeDays > 7);
  const counts: Array<[string, number]> = [
    ["Tracker items", s.tracker.length],
    ["Tasks", s.tasks.length],
    ["Study logs", s.logs.length],
    ["Sessions", (s.sessions ?? []).length],
    ["Questions", (s.questions ?? []).length],
    ["Cards", (s.ankiCards ?? []).length],
    ["Journal entries", s.journal.length],
    ["Closeouts", (s.closeouts ?? []).length],
  ];

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        <Tag tone={idbOk === false ? "orange" : "green"}>
          <Database size={12} /> {idbOk === null ? "Checking storage…" : idbOk ? "IndexedDB vault active" : "localStorage fallback"}
        </Tag>
        <Tag tone="neutral"><HardDrive size={12} /> Schema v{s.schemaVersion ?? SCHEMA_VERSION} / app v{SCHEMA_VERSION}</Tag>
        <Tag tone={backupAgeDays === null ? "orange" : backupAgeDays > 14 ? "orange" : "green"}>
          <ShieldCheck size={12} /> {backupAgeDays === null
            ? "No backup exported yet"
            : backupAgeDays === 0 ? "Backed up today" : `Last backup ${backupAgeDays}d ago`}
        </Tag>
      </div>

      {idbOk === false && (
        <div className="sub">
          IndexedDB isn't reachable in this browser, so data is riding on the localStorage fallback. Everything works,
          but export a JSON backup — localStorage is easier to lose to browser cleanup.
        </div>
      )}

      <div className="data-health-grid">
        {counts.map(([label, count]) => (
          <div key={label} className="data-health-cell">
            <b>{count}</b>
            <span className="sub">{label}</span>
          </div>
        ))}
      </div>

      <div className="row" style={{ gap: 8 }}>
        <History size={14} style={{ color: "var(--cyan)" }} />
        <span className="sub">
          {snapshot
            ? `A pre-migration snapshot from schema v${snapshot.fromVersion} (${snapshot.savedAt.slice(0, 10)}) is retained locally. If anything looks wrong after an update, export it before clearing browser data and report the issue.`
            : "No pre-migration snapshot present (none needed yet). One is written automatically before every schema upgrade."}
        </span>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <History size={14} style={{ color: "var(--cyan)" }} />
        <span className="sub">
          {localBackups.length
            ? `${localBackups.length} automatic local migration backup${localBackups.length === 1 ? "" : "s"} retained. Latest: ${localBackups[0].savedAt.slice(0, 10)}.`
            : "No automatic local migration backups retained yet."}
        </span>
      </div>
      {backupReminder && (
        <div className="row" style={{ gap: 8 }}>
          <ShieldCheck size={14} style={{ color: "var(--gold)" }} />
          <span className="sub">
            You have {questionCount} questions and {backupAgeDays === null ? "no backup yet" : `no backup in ${backupAgeDays} days`}.
            Export a JSON backup from above to keep them safe.
          </span>
        </div>
      )}

      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <Wrench size={14} style={{ color: "var(--cyan)" }} />
        <span className="sub">
          {orphans.totalIssues === 0
            ? "Question-bank links are healthy — no orphaned questions, sets, or documents."
            : `${orphans.totalIssues} dangling link${orphans.totalIssues === 1 ? "" : "s"} found (questions/sets/documents). Repair unlinks safely — it never deletes questions or history.`}
        </span>
        {orphans.totalIssues > 0 && (
          <GhostButton onClick={() => {
            const fixed = s.repairQuestionBankOrphans();
            pushToast({ title: fixed ? `Repaired ${fixed} dangling link${fixed === 1 ? "" : "s"}` : "Nothing to repair", tone: "success" });
          }}>Repair links</GhostButton>
        )}
      </div>

      <div className="sub">{APP_BUILD_LABEL} · updates never wipe local progress; migrations are additive and snapshot first.</div>
    </div>
  );
}

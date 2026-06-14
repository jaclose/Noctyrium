import { useEffect, useRef, useState } from "react";
import { Cloud, CloudDownload, CloudUpload, Database, RefreshCw, ShieldAlert } from "lucide-react";
import { GButton } from "../ui/primitives";
import { CloudBackupPanel } from "./CloudBackupPanel";
import { useStore } from "../../lib/store";
import {
  createCloudBackup,
  getBackendHealth,
  getCloudData,
  listCloudBackups,
  loadProgressByName,
  loginByName,
  restoreCloudBackup,
  saveCloudData,
  saveProgressByName,
} from "../../services/syncClient";
import {
  defaultDeviceLabel,
  fingerprintState,
  getPortableState,
  loadSyncMeta,
  saveSyncMeta,
} from "../../services/storageService";
import type { CloudBackup, CloudSnapshot, SyncMeta } from "../../types/sync";

type BusyState = "idle" | "login" | "save" | "load" | "backup" | "restore" | "auto";

export function AccountSyncPanel() {
  const store = useStore();
  const [meta, setMeta] = useState<SyncMeta>(() => loadSyncMeta());
  const [accountName, setAccountName] = useState(() => loadSyncMeta().user?.displayName || store.profile.name || "");
  const [backupLabel, setBackupLabel] = useState("");
  const [backups, setBackups] = useState<CloudBackup[]>([]);
  const [busy, setBusy] = useState<BusyState>("idle");
  const [status, setStatus] = useState("Local autosave is always on. Link a name to save progress to cloud.");
  const [backendStatus, setBackendStatus] = useState("Checking backend...");
  const metaRef = useRef(meta);
  const busyRef = useRef(false);

  const isBusy = busy !== "idle";

  function persistMeta(next: SyncMeta) {
    metaRef.current = next;
    saveSyncMeta(next);
    setMeta(next);
  }

  function markBusy(next: BusyState) {
    busyRef.current = next !== "idle";
    setBusy(next);
  }

  async function withBusy(next: BusyState, task: () => Promise<void>) {
    markBusy(next);
    try {
      await task();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Cloud sync failed.");
    } finally {
      markBusy("idle");
    }
  }

  async function handleLogin() {
    await withBusy("login", async () => {
      const user = await loginByName(accountName);
      const cloud = await getCloudData(user.id);
      const sameAccount = metaRef.current.user?.id === user.id;
      const localFingerprint = fingerprintState(useStore.getState());
      const next = {
        ...metaRef.current,
        user,
        deviceLabel: metaRef.current.deviceLabel || defaultDeviceLabel(),
        lastCloudUpdatedAt: sameAccount ? metaRef.current.lastCloudUpdatedAt : undefined,
        lastLocalFingerprint: cloud && !sameAccount ? undefined : localFingerprint,
      };
      persistMeta(next);
      setStatus(cloud ? "Signed in. Cloud data exists, so choose Save or Load before replacing anything." : "Signed in. No cloud snapshot yet.");
      await refreshBackups(user.id);
    });
  }

  async function handleSave() {
    const account = accountName.trim();
    if (!account) {
      setStatus("Enter an account name first.");
      return;
    }
    await withBusy("save", async () => {
      const activeUser = metaRef.current.user;
      if (!activeUser) {
        const existing = await loadProgressByName(account);
        if (existing.snapshot) {
          if (!confirm("This name already has saved cloud progress. Create a cloud backup, then replace it with this browser's progress?")) return;
          await backupSnapshot(existing.user.id, existing.snapshot, "Cloud before alpha progress save");
        }
        const { user, snapshot } = await saveProgressByName(account, makeSaveInput());
        persistMeta({
          ...metaRef.current,
          user,
          lastSyncedAt: new Date().toISOString(),
          lastCloudUpdatedAt: snapshot.updatedAt,
          lastLocalFingerprint: fingerprintState(useStore.getState()),
        });
        setStatus("Saved progress to cloud.");
        await refreshBackups(user.id);
        return;
      }

      const user = activeUser;
      const cloud = await getCloudData(user.id);
      const cloudChanged = hasCloudChanged(cloud, metaRef.current.lastCloudUpdatedAt);
      const localChanged = fingerprintState(useStore.getState()) !== metaRef.current.lastLocalFingerprint;

      if (cloud && !metaRef.current.lastCloudUpdatedAt) {
        if (!confirm("This account already has cloud data. Uploading now will replace it. Create a cloud backup first and continue?")) return;
        await backupSnapshot(user.id, cloud, "Cloud before first local upload");
      } else if (cloudChanged) {
        if (!confirm(localChanged
          ? "Both local and cloud data changed. Create a cloud backup, then upload this device's data?"
          : "Cloud data changed since your last sync. Create a backup, then overwrite it from this device?")) return;
        if (cloud) await backupSnapshot(user.id, cloud, "Cloud before local overwrite");
      }

      const snapshot = await saveCloudData(user.id, makeSaveInput());
      persistMeta({
        ...metaRef.current,
        lastSyncedAt: new Date().toISOString(),
        lastCloudUpdatedAt: snapshot.updatedAt,
        lastLocalFingerprint: fingerprintState(useStore.getState()),
      });
      setStatus("Saved this browser's data to cloud.");
      await refreshBackups(user.id);
    });
  }

  async function handleLoad() {
    const account = accountName.trim();
    if (!account) {
      setStatus("Enter an account name first.");
      return;
    }
    await withBusy("load", async () => {
      const loaded = metaRef.current.user
        ? { user: metaRef.current.user, snapshot: await getCloudData(metaRef.current.user.id) }
        : await loadProgressByName(account);
      const { user, snapshot } = loaded;
      if (!snapshot) {
        setStatus("No cloud snapshot found for this account.");
        persistMeta({ ...metaRef.current, user });
        return;
      }

      const localFingerprint = fingerprintState(useStore.getState());
      const cloudFingerprint = fingerprintState(snapshot.dataJson);
      const localDiffers = localFingerprint !== cloudFingerprint;
      const localChanged = localFingerprint !== metaRef.current.lastLocalFingerprint;

      if (localDiffers && localChanged) {
        if (!confirm("Cloud data will replace local data. Create a cloud backup of the current local state first and continue?")) return;
        await createCloudBackup(user.id, makeSaveInput("Local before cloud download"));
      } else if (localDiffers && !confirm("Cloud data differs from local data. Replace local data with cloud?")) {
        return;
      }

      useStore.getState().replaceAll(snapshot.dataJson);
      persistMeta({
        ...metaRef.current,
        lastSyncedAt: new Date().toISOString(),
        lastCloudUpdatedAt: snapshot.updatedAt,
        lastLocalFingerprint: fingerprintState(useStore.getState()),
      });
      setStatus("Loaded cloud data into this browser.");
      await refreshBackups(user.id);
    });
  }

  async function handleBackup() {
    const user = metaRef.current.user;
    if (!user) {
      setStatus("Sign in by name first.");
      return;
    }
    await withBusy("backup", async () => {
      const label = backupLabel.trim() || `Manual backup ${new Date().toLocaleString()}`;
      await createCloudBackup(user.id, makeSaveInput(label));
      setBackupLabel("");
      setStatus("Cloud backup created.");
      await refreshBackups(user.id);
    });
  }

  async function handleRestore(backupId: string) {
    const user = metaRef.current.user;
    if (!user) return;
    await withBusy("restore", async () => {
      const localFingerprint = fingerprintState(useStore.getState());
      const localChanged = localFingerprint !== metaRef.current.lastLocalFingerprint;
      if (localChanged) {
        if (!confirm("Restoring this backup will replace local data. Create a backup of local data first and continue?")) return;
        await createCloudBackup(user.id, makeSaveInput("Local before backup restore"));
      } else if (!confirm("Restore this cloud backup into the current app?")) {
        return;
      }

      const restored = await restoreCloudBackup(user.id, backupId);
      useStore.getState().replaceAll(restored.current.dataJson);
      persistMeta({
        ...metaRef.current,
        lastSyncedAt: new Date().toISOString(),
        lastCloudUpdatedAt: restored.current.updatedAt,
        lastLocalFingerprint: fingerprintState(useStore.getState()),
      });
      setStatus("Backup restored.");
      await refreshBackups(user.id);
    });
  }

  async function refreshBackups(userId = metaRef.current.user?.id) {
    if (!userId) {
      setBackups([]);
      return;
    }
    const rows = await listCloudBackups(userId);
    setBackups(rows);
  }

  function setAutoSync(enabled: boolean) {
    persistMeta({ ...metaRef.current, autoSync: enabled });
    setStatus(enabled ? "Auto-sync is on. It pauses if cloud data changes elsewhere." : "Auto-sync is off.");
  }

  function setDeviceLabel(deviceLabel: string) {
    persistMeta({ ...metaRef.current, deviceLabel });
  }

  useEffect(() => {
    metaRef.current = meta;
  }, [meta]);

  useEffect(() => {
    getBackendHealth()
      .then((health) => setBackendStatus(health.databaseConfigured ? "API + database ready" : "API online; DATABASE_URL missing"))
      .catch(() => setBackendStatus("Backend unavailable; local mode only"));
  }, []);

  useEffect(() => {
    if (meta.user?.id) {
      refreshBackups(meta.user.id).catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load backups.");
      });
    }
  }, [meta.user?.id]);

  useEffect(() => {
    if (!meta.autoSync || !meta.user?.id) return undefined;
    let timer: number | undefined;
    let stopped = false;

    const unsubscribe = useStore.subscribe((state) => {
      if (busyRef.current) return;
      const currentMeta = metaRef.current;
      if (!currentMeta.autoSync || !currentMeta.user) return;
      const currentFingerprint = fingerprintState(state);
      if (currentFingerprint === currentMeta.lastLocalFingerprint) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        if (stopped || busyRef.current) return;
        const latestMeta = metaRef.current;
        if (!latestMeta.autoSync || !latestMeta.user) return;
        const latestState = useStore.getState();
        const latestFingerprint = fingerprintState(latestState);
        if (latestFingerprint === latestMeta.lastLocalFingerprint) return;

        markBusy("auto");
        try {
          const cloud = await getCloudData(latestMeta.user.id);
          if (cloud && (!latestMeta.lastCloudUpdatedAt || hasCloudChanged(cloud, latestMeta.lastCloudUpdatedAt))) {
            persistMeta({ ...latestMeta, autoSync: false, lastCloudUpdatedAt: cloud.updatedAt });
            setStatus("Auto-sync paused because cloud data changed. Use Save or Load to resolve it.");
            return;
          }
          const snapshot = await saveCloudData(latestMeta.user.id, makeSaveInput());
          persistMeta({
            ...latestMeta,
            lastSyncedAt: new Date().toISOString(),
            lastCloudUpdatedAt: snapshot.updatedAt,
            lastLocalFingerprint: fingerprintState(useStore.getState()),
          });
          setStatus("Auto-synced.");
        } catch (error) {
          setStatus(error instanceof Error ? `Auto-sync paused: ${error.message}` : "Auto-sync paused.");
        } finally {
          markBusy("idle");
        }
      }, 2500);
    });

    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      unsubscribe();
    };
  }, [meta.autoSync, meta.user?.id]);

  return (
    <div className="sync-panel">
      <div className="spread">
        <div className="row gap8">
          <Cloud size={18} />
          <div>
            <div className="sync-title">Progress Save & Cloud Sync</div>
            <div className="sub">Local-first autosave, name-only cloud progress, JSON backups.</div>
          </div>
        </div>
        <span className={`sync-pill ${meta.user ? "on" : ""}`}>{meta.user ? "Linked" : "Local"}</span>
      </div>

      <div className="sync-grid">
        <label className="stack gap6">
          <span className="field-label">Account name</span>
          <input className="field" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Jafar" />
        </label>
        <label className="stack gap6">
          <span className="field-label">Device label</span>
          <input className="field" value={meta.deviceLabel || ""} onChange={(e) => setDeviceLabel(e.target.value)} placeholder={defaultDeviceLabel()} />
        </label>
      </div>

      <div className="row wrap gap8">
        <GButton size="sm" variant="primary" onClick={handleLogin} disabled={isBusy || !accountName.trim()}>
          <Database size={14} /> {meta.user ? "Refresh link" : "Link name"}
        </GButton>
        <GButton size="sm" onClick={handleSave} disabled={isBusy || !accountName.trim()}>
          <CloudUpload size={14} /> Save progress
        </GButton>
        <GButton size="sm" onClick={handleLoad} disabled={isBusy || !accountName.trim()}>
          <CloudDownload size={14} /> Load progress
        </GButton>
        <GButton size="sm" onClick={() => refreshBackups().catch((error) => setStatus(error instanceof Error ? error.message : "Could not refresh backups."))} disabled={isBusy || !meta.user}>
          <RefreshCw size={14} className={busy === "auto" ? "spin" : ""} /> Refresh
        </GButton>
      </div>

      <label className="sync-toggle">
        <input type="checkbox" checked={meta.autoSync} disabled={!meta.user || isBusy} onChange={(e) => setAutoSync(e.target.checked)} />
        <span>Auto-sync after local edits</span>
      </label>

      <div className="sync-meta-grid">
        <Meta label="User ID" value={meta.user?.id || "Not linked"} />
        <Meta label="Last synced" value={meta.lastSyncedAt ? formatDate(meta.lastSyncedAt) : "Never"} />
        <Meta label="Backend" value={backendStatus} />
        <Meta label="Status" value={busy === "idle" ? status : `${labelBusy(busy)}...`} />
      </div>

      <div className="sync-backup-create">
        <input className="field" value={backupLabel} onChange={(e) => setBackupLabel(e.target.value)} placeholder="Backup label, optional" />
        <GButton size="sm" onClick={handleBackup} disabled={isBusy || !meta.user}>Create backup</GButton>
      </div>

      <CloudBackupPanel backups={backups} busy={isBusy} onRefresh={() => refreshBackups().catch((error) => setStatus(error instanceof Error ? error.message : "Could not refresh backups."))} onRestore={handleRestore} />

      <div className="sync-warning">
        <ShieldAlert size={15} />
        <span>This is lightweight identity, not secure authentication. For production multi-user use, migrate to email magic links, OAuth, or passkeys.</span>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="sync-meta-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function makeSaveInput(backupLabel?: string) {
  const state = useStore.getState();
  const meta = loadSyncMeta();
  return {
    appVersion: state.profile.versionLabel,
    schemaVersion: state.schemaVersion,
    dataJson: getPortableState(state),
    deviceLabel: meta.deviceLabel || defaultDeviceLabel(),
    backupLabel,
  };
}

async function backupSnapshot(userId: string, snapshot: CloudSnapshot, label: string) {
  await createCloudBackup(userId, {
    appVersion: snapshot.appVersion,
    schemaVersion: snapshot.schemaVersion,
    dataJson: snapshot.dataJson,
    deviceLabel: snapshot.deviceLabel,
    backupLabel: `${label} ${new Date().toLocaleString()}`,
  });
}

function hasCloudChanged(snapshot: CloudSnapshot | null, lastCloudUpdatedAt?: string) {
  if (!snapshot || !lastCloudUpdatedAt) return false;
  return new Date(snapshot.updatedAt).getTime() > new Date(lastCloudUpdatedAt).getTime() + 1000;
}

function labelBusy(value: BusyState) {
  const labels: Record<BusyState, string> = {
    idle: "Idle",
    login: "Signing in",
    save: "Saving",
    load: "Loading",
    backup: "Backing up",
    restore: "Restoring",
    auto: "Auto-syncing",
  };
  return labels[value];
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

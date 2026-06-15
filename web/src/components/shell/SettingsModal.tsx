import { useRef, useState } from "react";
import {
  Cloud, Database, Download, FileJson, ImagePlus, RotateCcw, ShieldCheck,
  SlidersHorizontal, Upload, UserCircle2,
} from "lucide-react";
import { Modal, Field } from "../ui/Modal";
import { GButton } from "../ui/primitives";
import { useStore } from "../../lib/store";
import { exportState, parseImport } from "../../lib/backup";
import { AccountSyncPanel } from "./AccountSyncPanel";

export type SettingsTab = "general" | "backup" | "account";

export function SettingsModal({ onClose, initialTab = "general" }: { onClose: () => void; initialTab?: SettingsTab }) {
  const store = useStore();
  const { profile } = store;
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string>("");
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  function doImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = parseImport(String(reader.result));
        if (!confirm("Import this Noctyrium backup? It will replace the current Local Vault in this browser. Download a JSON backup first if you want a safety copy.")) {
          setMsg("Import cancelled. No data changed.");
          return;
        }
        store.replaceAll(next);
        setMsg(`Imported ${file.name}. Local Vault replaced.`);
      } catch (e) {
        setMsg((e as Error).message);
      }
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  }

  function exportBackup() {
    exportState(store);
    setMsg("Downloaded a portable Noctyrium JSON backup.");
  }

  function setAvatar(file: File) {
    const reader = new FileReader();
    reader.onload = () => store.updateProfile({ avatarDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }

  return (
    <Modal
      title="Settings & Backup"
      onClose={onClose}
      footer={<GButton variant="primary" onClick={onClose}>Done</GButton>}
    >
      <div className="filter-bar" style={{ marginBottom: 4 }}>
        <button className={`filter-pill ${tab === "general" ? "on" : ""}`} onClick={() => setTab("general")}>
          <SlidersHorizontal size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> Profile
        </button>
        <button className={`filter-pill ${tab === "backup" ? "on" : ""}`} onClick={() => setTab("backup")}>
          <FileJson size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> Backup &amp; Restore
        </button>
        <button className={`filter-pill ${tab === "account" ? "on" : ""}`} onClick={() => setTab("account")}>
          <UserCircle2 size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> Account &amp; Sync
        </button>
      </div>

      {tab === "general" && (
        <>
          <div className="row gap12" style={{ alignItems: "center" }}>
            <span className="avatar" style={{ width: 52, height: 52 }}>
              {profile.avatarDataUrl
                ? <img src={profile.avatarDataUrl} alt="" />
                : <span className="avatar-mono">{(profile.name || "N").slice(0, 1)}</span>}
            </span>
            <GButton size="sm" onClick={() => avatarRef.current?.click()}>
              <ImagePlus size={15} /> Change avatar
            </GButton>
            <input ref={avatarRef} type="file" accept="image/*" hidden
              onChange={(e) => e.target.files?.[0] && setAvatar(e.target.files[0])} />
          </div>

          <Field label="Display name" value={profile.name}
            onChange={(e) => store.updateProfile({ name: e.target.value })} />
          <Field label="Local user ID" value={profile.userId} readOnly />
          <Field label="Build label" value={profile.versionLabel} readOnly />
          <Field label="Tagline" value={profile.tagline}
            onChange={(e) => store.updateProfile({ tagline: e.target.value })} />

          <div className="row gap12">
            <Field label="Daily card target" type="number" value={String(profile.dailyCardTarget ?? 120)}
              onChange={(e) => store.updateProfile({ dailyCardTarget: Number(e.target.value) || 0 })} />
            <Field label="Daily minute target" type="number" value={String(profile.dailyMinuteTarget ?? 240)}
              onChange={(e) => store.updateProfile({ dailyMinuteTarget: Number(e.target.value) || 0 })} />
          </div>
          <div className="sub">Targets are a “good enough” line to protect against overload — not a ceiling to grind past.</div>
        </>
      )}

      {tab === "backup" && (
        <div className="backup-center">
          <div className="backup-explainer">
            <div className="backup-explainer-card">
              <Database size={17} />
              <div>
                <b>Local Vault</b>
                <span>Every edit autosaves in this browser through IndexedDB with localStorage fallback. You do not need to press save for local use.</span>
              </div>
            </div>
            <div className="backup-explainer-card">
              <FileJson size={17} />
              <div>
                <b>JSON backup</b>
                <span>Downloads one portable file containing profile, courses, tracker, Step prep, tasks, logs, journal, folders, prompts, and settings.</span>
              </div>
            </div>
            <div className="backup-explainer-card">
              <Cloud size={17} />
              <div>
                <b>Cloud sync is optional</b>
                <span>Use Account & Sync for name-based cloud progress. JSON import/export still works without a backend.</span>
              </div>
            </div>
          </div>

          <div className="backup-actions-panel">
            <div>
              <div className="sync-title">Portable backup file</div>
              <div className="sub">Use this before changing domains, browsers, devices, packages, or deployments.</div>
            </div>
            <div className="row wrap gap8">
              <GButton size="sm" variant="primary" onClick={exportBackup}>
                <Download size={15} /> Download JSON backup
              </GButton>
              <GButton size="sm" onClick={() => fileRef.current?.click()}>
                <Upload size={15} /> Import JSON backup
              </GButton>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden
                onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
            </div>
            <div className="backup-note">
              <ShieldCheck size={15} />
              <span>Import replaces the current Local Vault in this browser. Download a safety backup first when in doubt.</span>
            </div>
          </div>

          <div className="backup-actions-panel danger-zone">
            <div>
              <div className="sync-title">Danger zone</div>
              <div className="sub">Reset is only for starting over or testing the Alpha seed state.</div>
            </div>
            <GButton size="sm" variant="danger"
              onClick={() => {
                if (confirm("Reset everything to the starter data? This wipes your current local data.")) {
                  store.resetToSeed();
                  setMsg("Reset to starter data.");
                }
              }}>
              <RotateCcw size={15} /> Reset to starter data
            </GButton>
          </div>

          {msg && <div className="backup-status">{msg}</div>}
        </div>
      )}

      {tab === "account" && <AccountSyncPanel />}
    </Modal>
  );
}

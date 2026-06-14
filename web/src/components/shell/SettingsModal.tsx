import { useRef, useState } from "react";
import { Download, Upload, RotateCcw, ImagePlus } from "lucide-react";
import { Modal, Field } from "../ui/Modal";
import { GButton } from "../ui/primitives";
import { useStore } from "../../lib/store";
import { exportState, parseImport } from "../../lib/backup";
import { AccountSyncPanel } from "./AccountSyncPanel";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const { profile } = store;
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string>("");

  function doImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = parseImport(String(reader.result));
        store.replaceAll(next);
        setMsg("Backup imported. ✓");
      } catch (e) {
        setMsg((e as Error).message);
      }
    };
    reader.readAsText(file);
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
      <Field label="Version label" value={profile.versionLabel}
        onChange={(e) => store.updateProfile({ versionLabel: e.target.value })} />
      <Field label="Tagline" value={profile.tagline}
        onChange={(e) => store.updateProfile({ tagline: e.target.value })} />

      <div className="row gap12">
        <Field label="Daily card target" type="number" value={String(profile.dailyCardTarget ?? 120)}
          onChange={(e) => store.updateProfile({ dailyCardTarget: Number(e.target.value) || 0 })} />
        <Field label="Daily minute target" type="number" value={String(profile.dailyMinuteTarget ?? 240)}
          onChange={(e) => store.updateProfile({ dailyMinuteTarget: Number(e.target.value) || 0 })} />
      </div>
      <div className="sub">Targets are a “good enough” line to protect against overload — not a ceiling to grind past.</div>

      <div className="stack gap8" style={{ marginTop: 4 }}>
        <span className="field-label">Data</span>
        <div className="row wrap gap8">
          <GButton size="sm" onClick={() => exportState(store)}>
            <Download size={15} /> Export JSON
          </GButton>
          <GButton size="sm" onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> Import JSON
          </GButton>
          <GButton size="sm" variant="danger"
            onClick={() => {
              if (confirm("Reset everything to the starter data? This wipes your current data.")) {
                store.resetToSeed();
                setMsg("Reset to starter data.");
              }
            }}>
            <RotateCcw size={15} /> Reset
          </GButton>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden
            onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        </div>
        {msg && <div className="sub" style={{ color: "var(--cyan)" }}>{msg}</div>}
        <div className="sub">Your local user ID is derived from your display name and saved with the Local Vault + JSON backups. Your data stays local unless you export/import it or use optional cloud sync.</div>
      </div>

      <AccountSyncPanel />
    </Modal>
  );
}

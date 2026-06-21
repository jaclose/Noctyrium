import { useRef, useState } from "react";
import {
  Cloud, Download, FileJson, ImagePlus, RotateCcw, ShieldCheck,
  SlidersHorizontal, Sparkles, Upload, UserCircle2, Check, ScrollText,
} from "lucide-react";
import { Modal, Field } from "../ui/Modal";
import { GButton, Tag } from "../ui/primitives";
import { useStore } from "../../lib/store";
import { exportState, parseImport } from "../../lib/backup";
import { AccountSyncPanel } from "./AccountSyncPanel";
import { PromiseCutscene } from "./PromiseCutscene";
import { FOCUS_OPTIONS, focusOption, normalizedFocusIds } from "../../lib/experience";
import { EDUCATION_TRACKS, resolveTrack } from "../../lib/tracks";
import { prettyDate } from "../../lib/scoring";
import type { EducationTrackId, ExperienceFocusId } from "../../lib/types";
import { HardDrive } from "lucide-react";

export type SettingsTab = "general" | "personalization" | "backup" | "account";

export function SettingsModal({ onClose, initialTab = "general" }: { onClose: () => void; initialTab?: SettingsTab }) {
  const store = useStore();
  const { profile } = store;
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string>("");
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [resigning, setResigning] = useState(false);
  const [viewingPromise, setViewingPromise] = useState(false);
  const promise = profile.promise;
  const tabIntro: Record<SettingsTab, { title: string; body: string }> = {
    general: {
      title: "Profile & daily targets",
      body: "Set the identity, avatar, and good-enough daily targets that shape the rest of Noctyrium on this device.",
    },
    personalization: {
      title: "Personalization",
      body: "Choose the academic lanes you want Noctyrium to prioritize in the dashboard, suggestions, and sidebar.",
    },
    backup: {
      title: "Backup & restore",
      body: "Your work autosaves locally. Backups are your portable safety copy before browsers, devices, or domains change.",
    },
    account: {
      title: "Account vault preview",
      body: "A friendlier account system is being designed around local-first storage, profile initialization, and recoverable cloud snapshots.",
    },
  };

  function doImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = parseImport(String(reader.result));
        if (!confirm("Restore this backup? It replaces the current data on this device. Download a backup first if you want to keep both.")) {
          setMsg("Restore cancelled. No data changed.");
          return;
        }
        store.replaceAll(next);
        setMsg(`Restored from ${file.name}. Your data is back.`);
      } catch (e) {
        setMsg((e as Error).message);
      }
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  }

  function exportBackup() {
    exportState(store);
    setMsg("Downloaded your backup file.");
  }

  function setAvatar(file: File) {
    const reader = new FileReader();
    reader.onload = () => store.updateProfile({ avatarDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }

  return (
    <Modal
      title="Your Noctyrium Setup"
      onClose={onClose}
      footer={<GButton variant="primary" onClick={onClose}>Done</GButton>}
    >
      <div className="filter-bar" style={{ marginBottom: 4 }}>
        <button className={`filter-pill ${tab === "general" ? "on" : ""}`} onClick={() => setTab("general")}>
          <SlidersHorizontal size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> Profile
        </button>
        <button className={`filter-pill ${tab === "personalization" ? "on" : ""}`} onClick={() => setTab("personalization")}>
          <Sparkles size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> Personalization
        </button>
        <button className={`filter-pill ${tab === "backup" ? "on" : ""}`} onClick={() => setTab("backup")}>
          <FileJson size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> Backup &amp; Restore
        </button>
        <button className={`filter-pill ${tab === "account" ? "on" : ""}`} onClick={() => setTab("account")}>
          <UserCircle2 size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> Account &amp; Sync
        </button>
      </div>

      <div className="settings-intro">
        <b>{tabIntro[tab].title}</b>
        <span>{tabIntro[tab].body}</span>
      </div>

      {tab === "general" && (
        <>
          <div className="settings-profile-card">
            <span className="avatar" style={{ width: 52, height: 52 }}>
              {profile.avatarDataUrl
                ? <img src={profile.avatarDataUrl} alt="" />
                : <span className="avatar-mono">{(profile.name || "N").slice(0, 1)}</span>}
            </span>
            <div className="grow">
              <div className="sync-title">{profile.name || "Noctyrium"}</div>
              <div className="sub">Local profile · {profile.userId}</div>
            </div>
            <div className="row wrap gap8">
              <GButton size="sm" onClick={() => avatarRef.current?.click()}>
                <ImagePlus size={15} /> Change avatar
              </GButton>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" hidden
              onChange={(e) => e.target.files?.[0] && setAvatar(e.target.files[0])} />
          </div>

          <Field label="Display name" value={profile.name}
            onChange={(e) => store.updateProfile({ name: e.target.value })} />
          <Field label="Local user ID" value={profile.userId} readOnly />
          <Field label="Build label" value={profile.versionLabel} readOnly />
          <Field label="Tagline" value={profile.tagline}
            onChange={(e) => store.updateProfile({ tagline: e.target.value })} />

          <div className="settings-target-grid">
            <Field label="Daily card target" type="number" value={String(profile.dailyCardTarget ?? 120)}
              onChange={(e) => store.updateProfile({ dailyCardTarget: Number(e.target.value) || 0 })} />
            <Field label="Daily minute target" type="number" value={String(profile.dailyMinuteTarget ?? 240)}
              onChange={(e) => store.updateProfile({ dailyMinuteTarget: Number(e.target.value) || 0 })} />
            <Field label="Journal follow-up time" type="time" value={profile.journalReviewTime ?? "20:00"}
              onChange={(e) => store.updateProfile({ journalReviewTime: e.target.value || "20:00" })} />
          </div>
          <div className="sub">Targets are a “good enough” line to protect against overload — not a ceiling to grind past.</div>

          <div className="backup-actions-panel" style={{ marginTop: 14 }}>
            <div>
              <div className="sync-title"><ScrollText size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> Your promise</div>
              <div className="sub">{promise?.signedName
                ? `Signed by ${promise.signedName} on ${prettyDate(promise.signedAt)}.`
                : "You haven't signed your promise yet."}</div>
            </div>
            <div className="row wrap gap8">
              {promise?.signedName && <GButton size="sm" onClick={() => setViewingPromise(true)}><ScrollText size={15} /> View signed promise</GButton>}
              <GButton size="sm" variant="primary" onClick={() => setResigning(true)}>
                <ScrollText size={15} /> {promise?.signedName ? "Re-sign promise" : "Sign your promise"}
              </GButton>
            </div>
          </div>
        </>
      )}

      {tab === "personalization" && <PersonalizationPanel />}

      {tab === "backup" && (
        <div className="backup-center">
          <div className="sub" style={{ marginBottom: 4 }}>
            Noctyrium saves your work on this device automatically. Backups give you an extra copy you can keep, move, or restore later.
          </div>
          <div className="backup-explainer">
            <div className="backup-explainer-card">
              <ShieldCheck size={17} />
              <div>
                <b>Automatic saving</b>
                <span>Your progress is saved on this device while you work.</span>
              </div>
            </div>
            <div className="backup-explainer-card">
              <Download size={17} />
              <div>
                <b>Download backup</b>
                <span>Save a personal backup file with your profile, courses, tasks, logs, journal, resources, and settings.</span>
              </div>
            </div>
            <div className="backup-explainer-card">
              <Upload size={17} />
              <div>
                <b>Restore backup</b>
                <span>Bring your Noctyrium data back from a saved backup file.</span>
              </div>
            </div>
            <div className="backup-explainer-card">
              <Cloud size={17} />
              <div>
                <b>Cloud copy</b>
                <span>Optional Alpha cloud saving lets you move progress between devices when enabled.</span>
              </div>
            </div>
          </div>

          <div className="backup-actions-panel">
            <div>
              <div className="sync-title">Your backup file</div>
              <div className="sub">Download a backup before switching devices, browsers, or domains.</div>
            </div>
            <div className="row wrap gap8">
              <GButton size="sm" variant="primary" onClick={exportBackup}>
                <Download size={15} /> Download backup
              </GButton>
              <GButton size="sm" onClick={() => fileRef.current?.click()}>
                <Upload size={15} /> Restore backup
              </GButton>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden
                onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
            </div>
            <div className="backup-note">
              <ShieldCheck size={15} />
              <span>Restoring replaces the current data on this device. Download a backup first if you want to keep both.</span>
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

      {resigning && <PromiseCutscene onDone={() => setResigning(false)} />}
      {viewingPromise && promise && <PromiseSheet onClose={() => setViewingPromise(false)} />}
    </Modal>
  );
}

const PROMISE_LINES = [
  "This is only a tool.",
  "It will not save you.",
  "It will not study for you.",
  "It will not become disciplined on your behalf.",
  "But if you return to it honestly,",
  "if you record the work,",
  "if you confront the missed days,",
  "if you build again after falling behind,",
  "then this becomes more than software.",
  "It becomes a witness.",
];

// Read-only view of the already-signed promise, in the contract styling.
function PromiseSheet({ onClose }: { onClose: () => void }) {
  const { profile } = useStore();
  const p = profile.promise;
  return (
    <div className="promise-scrim" onMouseDown={onClose}>
      <div className="promise-orbs"><i /><i /><i /></div>
      <div className="promise-paper open" onMouseDown={(e) => e.stopPropagation()}>
        <div className="promise-seal-mark">N</div>
        <div className="promise-heading">Promise of Use</div>
        <div className="promise-lines">
          {PROMISE_LINES.map((line, i) => (
            <p key={line} className={`promise-line in ${i === PROMISE_LINES.length - 1 ? "accent" : ""}`}>{line}</p>
          ))}
        </div>
        <div className="promise-signed-row">
          <div><span>Signed</span><b className="promise-sig">{p?.signedName}</b></div>
          <div className="right"><span>Date</span><b>{p?.signedAt ? prettyDate(p.signedAt) : "—"}</b></div>
        </div>
        <div className="sub" style={{ marginTop: 8, color: "#8a7f63" }}>Promise text {p?.promiseTextVersion ?? "v1"}</div>
        <button type="button" className="promise-btn" style={{ marginTop: 14 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function PersonalizationPanel() {
  const store = useStore();
  const profile = store.profile;
  const subscriptions = normalizedFocusIds(profile.focusSubscriptions);
  const activeFocusId = profile.activeFocusId && subscriptions.includes(profile.activeFocusId)
    ? profile.activeFocusId
    : subscriptions[0];
  const activeFocus = focusOption(activeFocusId);
  const track = resolveTrack(profile.educationTrack);
  const showSgu = profile.showSguResources ?? track.showsSguResources;
  // Lanes relevant to the current program, then anything else the user still
  // subscribes to (so switching programs never silently hides their picks).
  const laneOptions = FOCUS_OPTIONS.filter(
    (o) => track.focusIds.includes(o.id) || subscriptions.includes(o.id),
  );

  function chooseTrack(id: EducationTrackId) {
    if (id === profile.educationTrack) return;
    store.applyEducationTrack(id); // prefs only — never wipes existing data
  }

  function loadStarter() {
    if (!confirm(
      `Load the ${track.label} starter structure? This replaces the example term/course shells with ${track.short}'s, and keeps everything you've added. Export a backup first if unsure.`,
    )) return;
    store.applyEducationTrack(track.id, { seedStructure: true });
  }

  function toggleFocus(id: ExperienceFocusId) {
    const set = new Set(subscriptions);
    if (set.has(id) && id !== activeFocusId) set.delete(id);
    else set.add(id);
    store.updateProfile({ focusSubscriptions: [...set] });
  }

  function makePrimary(id: ExperienceFocusId) {
    const option = focusOption(id);
    const next = [...new Set([id, ...subscriptions])];
    store.updateProfile({
      activeFocusId: id,
      focusSubscriptions: next,
      phase: option?.phase,
      tagline: option?.tagline ?? profile.tagline,
      dailyCardTarget: option?.cardTarget ?? profile.dailyCardTarget,
      dailyMinuteTarget: option?.minuteTarget ?? profile.dailyMinuteTarget,
    });
  }

  return (
    <div className="backup-center">
      <div className="backup-actions-panel premium-panel">
        <div>
          <div className="sync-title">Program: {track.label}</div>
          <div className="sub">
            Current focus: <b>{activeFocus?.label ?? "Custom"}</b>. Your program controls starter courses,
            visible resources, and study lanes. Switching it never deletes existing data.
          </div>
        </div>
        <GButton size="sm" variant="primary" onClick={() => store.updateProfile({ onboarded: false })}>
          <Sparkles size={15} /> Run setup again
        </GButton>
      </div>

      <div className="track-settings-grid">
        {EDUCATION_TRACKS.map((t) => {
          const current = t.id === track.id;
          return (
            <button key={t.id} type="button" className={`track-setting-card ${current ? "on" : ""}`}
              onClick={() => chooseTrack(t.id)}>
              <div className="spread">
                <b>{t.short}</b>
                {current ? <Tag tone="cyan">Current</Tag> : t.status === "planned" ? <Tag tone="orange">Lighter</Tag> : null}
              </div>
              <small>{t.program}</small>
            </button>
          );
        })}
      </div>

      <div className="backup-actions-panel">
        <div>
          <div className="sync-title"><HardDrive size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> SGU shared drives</div>
          <div className="sub">Show SGU-specific drives on the Resources page. Your personal drive and universal board packs always stay.</div>
        </div>
        <button type="button" className={`onboarding-switch ${showSgu ? "on" : ""}`}
          onClick={() => store.updateProfile({ showSguResources: !showSgu })}
          aria-label="Show SGU shared drives" title={showSgu ? "SGU drives shown" : "SGU drives hidden"}>
          <span />
        </button>
      </div>

      <div className="backup-actions-panel">
        <div>
          <div className="sync-title">Starter structure</div>
          <div className="sub">{track.progress.summary}</div>
        </div>
        <GButton size="sm" onClick={loadStarter}><Sparkles size={15} /> Load {track.short} structure</GButton>
      </div>

      <div className="focus-settings-grid">
        {laneOptions.map((option) => {
          const subscribed = subscriptions.includes(option.id);
          const primary = activeFocusId === option.id;
          return (
            <div key={option.id} className={`focus-setting-row ${primary ? "primary" : ""}`}>
              <button type="button" className={`focus-check ${subscribed ? "on" : ""}`} onClick={() => toggleFocus(option.id)} title="Toggle subscription">
                {subscribed && <Check size={12} />}
              </button>
              <div className="grow">
                <b>{option.label}</b>
                <span>{option.blurb}</span>
              </div>
              <Tag tone={option.group === "SGU Terms" ? "cyan" : option.group === "Boards" ? "purple" : "green"}>{option.group}</Tag>
              <GButton size="sm" onClick={() => makePrimary(option.id)} disabled={primary}>
                {primary ? "Primary" : "Make primary"}
              </GButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Settings, UserCircle2 } from "lucide-react";
import { NAV } from "./nav";
import { useStore } from "../../lib/store";
import type { SettingsTab } from "./SettingsModal";

export function Sidebar({
  active, onSelect, onOpenSettings, collapsed, onClose,
}: {
  active: string;
  onSelect: (id: string) => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  collapsed: boolean;       // mobile drawer open/closed
  onClose: () => void;      // close drawer after pick on mobile
}) {
  const profile = useStore((s) => s.profile);

  return (
    <>
      <div className={`sidebar ${collapsed ? "open" : ""}`}>
        <button className="brand" onClick={() => onOpenSettings("general")} title="Profile & settings">
          <span className="avatar">
            {profile.avatarDataUrl
              ? <img src={profile.avatarDataUrl} alt="" />
              : <span className="avatar-mono">{(profile.name || "N").slice(0, 1)}</span>}
          </span>
          <span className="brand-text">
            <span className="brand-name">{profile.name || "Noctyrium"}</span>
            <span className="brand-ver mono">{profile.versionLabel}</span>
          </span>
        </button>

        <div className="nav-label">CONTROL SURFACE</div>

        <nav className="nav">
          {NAV.map((item) => {
            const I = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${active === item.id ? "on" : ""}`}
                onClick={() => { onSelect(item.id); onClose(); }}
              >
                <I size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <button className="nav-item" onClick={() => onOpenSettings("general")}>
            <Settings size={17} />
            <span>Settings &amp; Backup</span>
          </button>
          <button className="nav-item" onClick={() => onOpenSettings("account")}>
            <UserCircle2 size={17} />
            <span>Account</span>
          </button>
          <div className="tagline">{profile.tagline}</div>
        </div>
      </div>
      {collapsed && <div className="drawer-scrim" onClick={onClose} />}
    </>
  );
}

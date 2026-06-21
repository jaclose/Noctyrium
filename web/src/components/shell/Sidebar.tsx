import { useState } from "react";
import {
  Settings, UserCircle2, SlidersHorizontal, Check, ChevronDown, ChevronRight, Wrench, GraduationCap,
} from "lucide-react";
import { navById, SIDEBAR_TOP, SIDEBAR_PREP, SIDEBAR_TOOLS, SIDEBAR_BOTTOM, SIDEBAR_LOCKED } from "./nav";
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
  const updateProfile = useStore((s) => s.updateProfile);
  const [manage, setManage] = useState(false);

  const hidden = new Set(profile.hiddenNav ?? []);
  const toolsOpen = !profile.toolsCollapsed;
  const prepOpen = !profile.prepCollapsed;

  function toggleHidden(id: string) {
    if (SIDEBAR_LOCKED.has(id)) return;
    const next = new Set(hidden);
    next.has(id) ? next.delete(id) : next.add(id);
    updateProfile({ hiddenNav: [...next] });
  }

  function Item({ id }: { id: string }) {
    const item = navById(id);
    if (!item) return null;
    const I = item.icon;
    const isHidden = hidden.has(id);
    if (manage) {
      const locked = SIDEBAR_LOCKED.has(id);
      return (
        <button type="button" className={`nav-item manage ${isHidden ? "off" : ""}`}
          onClick={() => toggleHidden(id)} disabled={locked} title={locked ? "Always shown" : isHidden ? "Show" : "Hide"}>
          <span className={`nav-check ${!isHidden ? "on" : ""}`}>{!isHidden && <Check size={11} />}</span>
          <I size={16} /><span>{item.label}</span>
        </button>
      );
    }
    if (isHidden) return null;
    return (
      <button type="button" className={`nav-item ${active === id ? "on" : ""}`}
        onClick={() => { onSelect(id); onClose(); }}>
        <I size={17} /><span>{item.label}</span>
      </button>
    );
  }

  const toolItems = (manage ? SIDEBAR_TOOLS : SIDEBAR_TOOLS.filter((id) => !hidden.has(id)));
  const prepItems = (manage ? SIDEBAR_PREP : SIDEBAR_PREP.filter((id) => !hidden.has(id)));
  const help = navById("help");
  const HelpIcon = help?.icon;

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

        <div className="nav-label-row">
          <span className="nav-label">{manage ? "CUSTOMIZE SIDEBAR" : "CONTROL SURFACE"}</span>
        </div>
        <div className="nav-manage-zone" data-tour="control-surface-menu">
          <button
            type="button"
            className={`nav-manage-btn ${manage ? "on" : ""}`}
            onClick={() => setManage((m) => !m)}
            aria-pressed={manage}
            title={manage ? "Done customizing" : "Subscribe or unsubscribe sections"}
          >
            {manage ? <Check size={15} /> : <SlidersHorizontal size={15} />}
            <span>{manage ? "Done" : "Customize"}</span>
          </button>
          <div className="nav-manage-hint">
            {manage ? "Tap sections to subscribe or hide them." : "Subscribe to sections you use; hide the rest."}
          </div>
        </div>

        <nav className="nav">
          {SIDEBAR_TOP.map((id) => <Item key={id} id={id} />)}

          {(prepItems.length > 0 || manage) && (
            <div className="nav-folder">
              <button type="button" className="nav-folder-head"
                onClick={() => updateProfile({ prepCollapsed: !profile.prepCollapsed })}>
                {prepOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <GraduationCap size={15} /><span>Academic Prep</span>
                {!prepOpen && <span className="nav-folder-count">{prepItems.length}</span>}
              </button>
              {prepOpen && (
                <div className="nav-folder-items">
                  {prepItems.map((id) => <Item key={id} id={id} />)}
                </div>
              )}
            </div>
          )}

          {(toolItems.length > 0 || manage) && (
            <div className="nav-folder">
              <button type="button" className="nav-folder-head"
                onClick={() => updateProfile({ toolsCollapsed: !profile.toolsCollapsed })}>
                {toolsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Wrench size={15} /><span>Tools</span>
                {!toolsOpen && <span className="nav-folder-count">{toolItems.length}</span>}
              </button>
              {toolsOpen && (
                <div className="nav-folder-items">
                  {toolItems.map((id) => <Item key={id} id={id} />)}
                </div>
              )}
            </div>
          )}

          {SIDEBAR_BOTTOM.map((id) => <Item key={id} id={id} />)}
        </nav>

        <div className="sidebar-foot">
          {help && HelpIcon && (
            <button type="button" className={`nav-item footer-action ${active === "help" ? "on" : ""}`}
              onClick={() => { onSelect("help"); onClose(); }}>
              <HelpIcon size={17} /><span>Help</span>
            </button>
          )}
          <button type="button" className="nav-item footer-action" onClick={() => onOpenSettings("general")}>
            <Settings size={17} /><span>Settings</span>
          </button>
          <button type="button" className="nav-item footer-action" onClick={() => onOpenSettings("account")}>
            <UserCircle2 size={17} /><span>Account &amp; Sync</span>
          </button>
          <div className="brand-lockup">
            <img src="./icon-192.png" alt="" className="brand-logo" width={22} height={22} />
            <span className="brand-wordmark">Noctyrium</span>
          </div>
          <div className="tagline">{manage ? "Tap to subscribe / hide. Dashboard stays." : profile.tagline}</div>
        </div>
      </div>
      {collapsed && <div className="drawer-scrim" onClick={onClose} />}
    </>
  );
}

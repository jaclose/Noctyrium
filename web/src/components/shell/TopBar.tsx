import { Menu, RotateCw } from "lucide-react";
import type { RefObject } from "react";
import { GButton } from "../ui/primitives";

export function TopBar({
  title, subtitle, onMenu, menuButtonRef, drawerOpen, onRefresh, refreshing,
}: {
  title: string;
  subtitle: string;
  onMenu: () => void;
  menuButtonRef: RefObject<HTMLButtonElement>;
  drawerOpen: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="topbar">
      <button
        ref={menuButtonRef}
        type="button"
        className="menu-btn"
        onClick={onMenu}
        aria-label="Open navigation menu"
        aria-controls="app-sidebar"
        aria-expanded={drawerOpen}
      >
        <Menu size={20} />
      </button>
      <div>
        <div className="tb-title">{title}</div>
        <div className="tb-sub">{subtitle}</div>
      </div>
      <div className="tb-actions">
        <GButton onClick={onRefresh}>
          <RotateCw size={15} className={refreshing ? "spin" : ""} />
          {refreshing ? "Refreshing" : "Refresh"}
        </GButton>
      </div>
    </div>
  );
}

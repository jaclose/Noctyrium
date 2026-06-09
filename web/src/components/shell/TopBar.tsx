import { Menu, RotateCw } from "lucide-react";
import { GButton } from "../ui/primitives";

export function TopBar({
  title, subtitle, onMenu, onRefresh, refreshing,
}: {
  title: string;
  subtitle: string;
  onMenu: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="topbar">
      <button className="menu-btn" onClick={onMenu} aria-label="Menu"><Menu size={20} /></button>
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

// Small, reusable glass primitives shared across pages.
import React from "react";

export function GlassCard({
  children, className = "", pad = true, hoverable = false, style, onClick,
}: {
  children: React.ReactNode; className?: string; pad?: boolean; hoverable?: boolean;
  style?: React.CSSProperties; onClick?: () => void;
}) {
  return (
    <div
      className={`glass-card ${pad ? "pad" : ""} ${hoverable ? "hoverable" : ""} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger";
  size?: "md" | "sm" | "tiny";
  iconOnly?: boolean;
};
export function GButton({
  variant = "default", size = "md", iconOnly = false, className = "", children, ...rest
}: BtnProps) {
  const sz = size === "md" ? "" : size;
  return (
    <button className={`gbtn ${variant} ${sz} ${iconOnly ? "icon" : ""} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function GhostButton({
  className = "", children, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`ghost-btn ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Tag({
  children, tone = "cyan",
}: {
  children: React.ReactNode; tone?: "cyan" | "green" | "purple" | "neutral" | "orange" | "red";
}) {
  return <span className={`tag ${tone === "cyan" ? "" : tone}`}>{children}</span>;
}

export function PanelHeader({
  title, sub, action,
}: {
  title: string; sub?: string; action?: React.ReactNode;
}) {
  return (
    <div className="panel-head">
      <div>
        <div className="panel-title">{title}</div>
        {sub && <div className="panel-sub">{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon, title, hint,
}: {
  icon?: React.ReactNode; title: string; hint?: string;
}) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon">{icon}</div>}
      <div style={{ fontWeight: 700, color: "var(--text-60)" }}>{title}</div>
      {hint && <div style={{ fontSize: 12.5 }}>{hint}</div>}
    </div>
  );
}

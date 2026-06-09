import React from "react";
import { GlassCard, Tag } from "./primitives";

// Dashboard stat card — ported from StatCard.
export function StatCard({
  title, value, note, icon, trend, trendTone = "green",
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  trend?: string;
  trendTone?: "green" | "cyan" | "orange" | "red" | "neutral" | "purple";
}) {
  return (
    <GlassCard className="stat-card" pad>
      <div className="stat-top">
        <span className="stat-icon">{icon}</span>
        {trend && <Tag tone={trendTone}>{trend}</Tag>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
      <div className="stat-note">{note}</div>
    </GlassCard>
  );
}

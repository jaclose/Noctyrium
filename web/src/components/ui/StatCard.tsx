import React from "react";
import { GlassCard, Tag } from "./primitives";

// Dashboard stat card — ported from StatCard. An optional `overview` renders as
// a hover popover (a richer at-a-glance breakdown). Because .glass-card clips its
// overflow, the popover lives as a sibling inside a positioned wrapper.
export function StatCard({
  title, value, note, icon, trend, trendTone = "green", overview,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  trend?: string;
  trendTone?: "green" | "cyan" | "orange" | "red" | "neutral" | "purple";
  overview?: React.ReactNode;
}) {
  const card = (
    <GlassCard className={`stat-card ${overview ? "has-overview" : ""}`} pad>
      <div className="stat-top">
        <span className="stat-icon">{icon}</span>
        {trend && <Tag tone={trendTone}>{trend}</Tag>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
      <div className="stat-note">{note}</div>
    </GlassCard>
  );
  if (!overview) return card;
  return (
    <div className="stat-card-wrap">
      {card}
      <div className="stat-overview" role="tooltip">{overview}</div>
    </div>
  );
}

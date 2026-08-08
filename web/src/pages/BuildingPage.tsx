import { useMemo, useState } from "react";
import { Blocks, FlaskConical, Network, Route } from "lucide-react";
import { GlassCard, Tag } from "../components/ui/primitives";
import { SYSTEM_PREVIEWS, type BuildStatus } from "../lib/buildingSystems";
import "../styles/ecosystem.css";

const STATUS: Record<BuildStatus,string> = { foundation:"FOUNDATION", "in-development":"IN DEVELOPMENT", planned:"PLANNED", research:"RESEARCH" };
export function BuildingPage() {
  const [view,setView]=useState<"overview"|"systems">("overview");
  const groups=useMemo(()=>Object.entries(SYSTEM_PREVIEWS.reduce<Record<string, typeof SYSTEM_PREVIEWS>>((all,item)=>{
    (all[item.area] ??= []).push(item); return all;
  },{})),[]);
  return <main className="ecosystem-page" aria-labelledby="building-title">
    <header className="ecosystem-hero"><Tag tone="cyan"><Blocks size={14}/> Transparent roadmap</Tag><h1 id="building-title">Building AXOM</h1><p>A preview of how today’s working study tools could become a connected medical-learning system. These cards describe direction, not shipped capability.</p></header>
    <div className="ecosystem-tabs" role="tablist" aria-label="Building views"><button role="tab" aria-selected={view==="overview"} onClick={()=>setView("overview")}>Overview</button><button role="tab" aria-selected={view==="systems"} onClick={()=>setView("systems")}>Systems</button></div>
    {view==="overview" ? <section className="building-overview"><GlassCard pad><Route/><h2>Now</h2><p>Local-first tracking, Question Bank, Tutor tools, reports, routines, and recovery-oriented backups form the working foundation.</p></GlassCard><GlassCard pad><Network/><h2>Next</h2><p>Accounts and sync, stable learner preferences, then transparent recommendations connect today’s tools without risking existing data.</p></GlassCard><GlassCard pad><FlaskConical/><h2>Later</h2><p>Knowledge and simulation concepts stay in research until their evidence, safety, and provenance boundaries are credible.</p></GlassCard></section> : <section className="system-groups">{groups.map(([area,items])=><div key={area}><h2>{area}</h2><div className="system-grid">{items?.map(item=><GlassCard pad key={item.id} className="system-card"><div className={`build-status build-status--${item.status}`}>{STATUS[item.status]}</div><h3>{item.name}</h3><p>{item.promise}</p><div className="connection-list" aria-label={`${item.name} connections`}>{item.connectsTo.map(connection=><span key={connection}>{connection}</span>)}</div></GlassCard>)}</div></div>)}</section>}
    <p className="ecosystem-note">Preview rule: no planned card stores data, runs analysis, or implies a feature is available.</p>
  </main>;
}

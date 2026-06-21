import { useEffect, useState } from "react";
import { Activity, BadgeCheck, Brain, ExternalLink, LineChart, Link2, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { GlassCard, PanelHeader, Tag } from "../components/ui/primitives";

const WEBSITE_URL = "https://www.jafardabbagh.com/";

const ROADMAP = [
  { icon: Brain, title: "Board and MCAT guides", body: "Installable Step 1, Step 2, Step 3, shelf, MCAT, and pre-med systems with actionable evidence instead of lecture-style checklists." },
  { icon: BadgeCheck, title: "Application checker", body: "A stronger admissions and residency workflow for requirements, essays, experiences, interviews, school fit, and decision tracking." },
  { icon: LineChart, title: "Performance intelligence", body: "Energy, output, roadblocks, consistency, and goal-relative recommendations that improve as the app gathers enough real days." },
  { icon: Trophy, title: "Leaderboards", body: "Opt-in accountability for streaks, reviews, and weekly effort, designed to motivate without turning the app into noise." },
  { icon: Link2, title: "Integrations", body: "Local-first Anki, drives, calendars, backup, account sync, and future automations that bring useful signals into the workspace." },
  { icon: Activity, title: "Adaptive planning", body: "Blueprints, term maps, journals, productivity, and tasks feeding one modular recommendation engine." },
];

export function AboutPage() {
  return (
    <>
      <GlassCard pad className="about-hero-card">
        <div className="about-hero">
          <div>
            <Tag tone="cyan"><Sparkles size={12} /> Alpha 1</Tag>
            <h2>Noctyrium</h2>
            <p>
              A local-first command surface for medical training: schoolwork, board prep, MCAT/pre-med planning,
              productivity, reflection, and resources in one adaptable workspace.
            </p>
          </div>
          <div className="about-principles">
            <span><ShieldCheck size={15} /> Local-first</span>
            <span><Brain size={15} /> Blueprint-driven</span>
            <span><LineChart size={15} /> Evidence-based</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="What this is becoming" sub="A modular medical operating system that can stay calm on mobile and grow with the user." />
        <div className="about-roadmap-grid">
          {ROADMAP.map((item) => {
            const I = item.icon;
            return (
              <div className="about-roadmap-card" key={item.title}>
                <span><I size={17} /></span>
                <div><b>{item.title}</b><small>{item.body}</small></div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <WebsitePreview />
    </>
  );
}

function WebsitePreview() {
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setRefreshKey((key) => key + 1), 30 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <GlassCard pad className="website-preview-card">
      <PanelHeader title="Live site" sub="Preview refreshes every 30 minutes"
        action={<a className="gbtn sm" href={WEBSITE_URL} target="_blank" rel="noreferrer noopener">
          Open site <ExternalLink size={13} />
        </a>} />
      <div className="website-frame-shell">
        <iframe key={refreshKey} title="Live site preview" src={WEBSITE_URL} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
      <div className="sub" style={{ marginTop: 8 }}>If the browser blocks embedding, use Open site; the refresh timer still keeps the iframe attempt current.</div>
    </GlassCard>
  );
}

import { useEffect, useState } from "react";
import {
  Brain, CheckCircle2, ExternalLink, LineChart, Loader, ShieldCheck, Sparkles, CircleDashed,
} from "lucide-react";
import { GlassCard, PanelHeader, Tag } from "../components/ui/primitives";

const WEBSITE_URL = "https://www.jafardabbagh.com/";

type FeatureStatus = "ready" | "progress" | "planned";

interface Feature { name: string; detail: string }

const READY: Feature[] = [
  { name: "Dashboard", detail: "Command center: stat cards with hover overviews, win-the-day intention, standup prompt, and a streak. Works as intended — minor polish ongoing." },
  { name: "Productivity", detail: "Study-day logging, weekly + monthly calendars, the activity log, and a working Pomodoro that auto-logs minutes." },
  { name: "Course Tracker", detail: "Mastery tree with pass / Anki / yield tracking, bulk import, and adaptive next-move suggestions." },
  { name: "Journal", detail: "Daily standups, missed-standup detection + remediation, and locked previous-intention reflection." },
  { name: "Tasks & Resources", detail: "Open/done execution list and a saved-link library with curated drives and favorites." },
  { name: "Local data & backup", detail: "Private by default — everything stays on-device, with export/import to stay portable." },
];

const IN_PROGRESS: Feature[] = [
  { name: "USMLE / MCAT / Pre-Med blueprints", detail: "Being deepened: macro vs. detailed depth, better-anchored content categories (not lecture-style passes), and a dedicated tracker container per exam lane." },
  { name: "Anki integration", detail: "AnkiConnect bridge with card-count sync. Works on the local build; a hosted HTTPS page can't reach local Anki — that's a browser limit, not a bug." },
  { name: "Anki Lab", detail: "Turning lectures, DLAs, and slides into Anki cards. Functional; output quality is being improved." },
  { name: "Pre-Med experience log", detail: "Clinical / service / research hours with verification. Competitive tick marks and exportable, themed logs are landing next." },
  { name: "Pomodoro", detail: "Functional and auto-logs into productivity; the dial and container are getting a visual upgrade." },
];

const PLANNED: Feature[] = [
  { name: "Application Checker", detail: "Between planned and in-progress — the shell exists, but it isn't gathering or validating data yet." },
  { name: "Casper & DAT lanes", detail: "Separate pre-health lanes alongside MCAT and Pre-Med, each with their own outline." },
  { name: "Exports", detail: "Themed Excel / spreadsheet exports for the activity log and experience hours." },
  { name: "Leaderboards", detail: "Opt-in streak and weekly-effort accountability — motivation without noise." },
  { name: "Performance intelligence", detail: "Sharper, day-aware recommendations as enough real days accumulate." },
  { name: "More integrations", detail: "Calendar study blocks, drives, and (where possible) screen-time signals." },
];

const STATUS_META: Record<FeatureStatus, { label: string; sub: string; icon: typeof CheckCircle2; tone: "green" | "cyan" | "neutral" }> = {
  ready: { label: "Ready to use", sub: "Works as intended today", icon: CheckCircle2, tone: "green" },
  progress: { label: "Being worked on", sub: "Usable, actively improving", icon: Loader, tone: "cyan" },
  planned: { label: "Planned", sub: "Designed, not built yet", icon: CircleDashed, tone: "neutral" },
};

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
        <PanelHeader title="Where each feature stands"
          sub="Honest status — features move from Planned → Being worked on → Ready as they earn real data and polish." />
        <div className="about-status-board">
          <StatusColumn status="ready" features={READY} />
          <StatusColumn status="progress" features={IN_PROGRESS} />
          <StatusColumn status="planned" features={PLANNED} />
        </div>
      </GlassCard>

      <WebsitePreview />
    </>
  );
}

function StatusColumn({ status, features }: { status: FeatureStatus; features: Feature[] }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <section className={`about-status-col status-${status}`}>
      <div className="about-status-head">
        <span className="about-status-mark"><Icon size={16} /></span>
        <div>
          <b>{meta.label}</b>
          <small>{meta.sub}</small>
        </div>
        <Tag tone={meta.tone}>{features.length}</Tag>
      </div>
      <div className="about-status-items">
        {features.map((feature) => (
          <div className="about-feature" key={feature.name}>
            <span className="about-feature-dot" />
            <div>
              <b>{feature.name}</b>
              <span>{feature.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
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

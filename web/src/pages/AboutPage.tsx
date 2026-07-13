import { useEffect, useState } from "react";
import {
  Brain, CheckCircle2, ExternalLink, LineChart, Loader, ShieldCheck, Sparkles, CircleDashed,
} from "lucide-react";
import { GlassCard, PanelHeader, Tag } from "../components/ui/primitives";
import { AxomMark, AxomWordmark } from "../components/ui/BrandMark";

const WEBSITE_URL = "https://www.jafardabbagh.com/";

type FeatureStatus = "ready" | "progress" | "planned";

interface Feature { name: string; detail: string }

const READY: Feature[] = [
  { name: "AXOM Daily Word", detail: "Optional local-first five-letter puzzle with a versioned SCOWL-derived dictionary, persisted history, private result sharing, and offline reopening after one successful online load." },
  { name: "Question Bank", detail: "Review-first PDF, text, Markdown, CSV, and JSON import with unresolved-answer safety, source provenance, practice blocks, and results." },
  { name: "Dashboard", detail: "A focused daily surface with an evidence-gated Command Brief, optional widgets, theme controls, and explicit recommendation provenance." },
  { name: "Productivity & Reports", detail: "Fast activity logging, optional scheduled targets, focus timer, and schedule-aware weekly/monthly interpretation." },
  { name: "Course Tracker", detail: "Course/module structure, local PDF or structured-text import, pass and yield tracking, and non-destructive next-move suggestions." },
  { name: "Journal", detail: "Daily standups, missed-standup detection + remediation, and locked previous-intention reflection." },
  { name: "Themes, clock & local data", detail: "Light/dark/system presentation, an isolated optional clock, device-local workspace storage, recovery saves, and portable backup files." },
];

const IN_PROGRESS: Feature[] = [
  { name: "USMLE / MCAT / Pre-Med blueprints", detail: "Being deepened: macro vs. detailed depth, better-anchored content categories (not lecture-style passes), and a dedicated tracker container per exam lane." },
  { name: "Anki integration", detail: "AnkiConnect bridge with card-count sync. Works on the local build; a hosted HTTPS page can't reach local Anki — that's a browser limit, not a bug." },
  { name: "Anki Lab", detail: "Turning lectures, DLAs, and slides into Anki cards. Functional; output quality is being improved." },
  { name: "Pre-Med experience log", detail: "Clinical / service / research hours with verification. Competitive tick marks and exportable, themed logs are landing next." },
  { name: "Cross-module guidance", detail: "Short page-level tours and comprehension polish are being expanded without forcing walkthroughs." },
];

const PLANNED: Feature[] = [
  { name: "Application Checker", detail: "Between planned and in-progress — the shell exists, but it isn't gathering or validating data yet." },
  { name: "Casper & DAT lanes", detail: "Separate pre-health lanes alongside MCAT and Pre-Med, each with their own outline." },
  { name: "Exports", detail: "Themed Excel / spreadsheet exports for the activity log and experience hours." },
  { name: "Device or cloud sync", detail: "Not implemented. Any future sync must preserve AXOM's explicit local-first and backup boundaries." },
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
            <Tag tone="cyan"><Sparkles size={12} /> Pre-Beta</Tag>
            <h2 className="row" style={{ gap: 12 }}><AxomMark size={26} /> <AxomWordmark /></h2>
            <p>
              A local-first academic workspace for question practice, course tracking, study logs, planning,
              reflection, and review. Your workspace stays on this device, with recovery saves and a portable
              backup file you can export when you choose.
            </p>
            <p className="sub">
              Pre-beta honesty: AXOM has no cloud account or cross-device sync. Supported PDFs use local text
              extraction; image-only OCR is not promised. Optional provider tools require explicit setup, and
              local AnkiConnect access still depends on your browser and desktop Anki configuration.
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

      <LiveSiteDisclosure />
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

function LiveSiteDisclosure() {
  const [open, setOpen] = useState(false);
  return (
    <details className="website-preview-disclosure" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>Developer website</summary>
      {open && <WebsitePreview />}
    </details>
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

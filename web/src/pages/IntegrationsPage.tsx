import { Wrench } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, PanelHeader, Tag } from "../components/ui/primitives";
import { Icon } from "../lib/icons";
import { AnkiConnectPanel } from "../components/integrations/AnkiConnectPanel";
import type { Integration } from "../lib/types";

const statusTone: Record<Integration["status"], "green" | "cyan" | "neutral"> = {
  connected: "green", available: "cyan", planned: "neutral",
};
const statusLabel: Record<Integration["status"], string> = {
  connected: "Connected", available: "Available", planned: "Planned",
};

const INTEGRATION_ROADMAP = [
  { name: "Anki", purpose: "Card export, local AnkiConnect diagnostics, and future review stats.", status: "Available + experimental", privacy: "CSV/TSV stays local; AnkiConnect talks to local Anki only.", method: "CSV/TSV, clipboard, local bridge", stage: "Active alpha" },
  { name: "Noji", purpose: "Noji-compatible card/export format for language and spaced-repetition workflows.", status: "Planned", privacy: "Export-only until a user-approved API exists.", method: "Adapter placeholder", stage: "Roadmap" },
  { name: "Google Calendar", purpose: "Read-only study block overlay before optional calendar export.", status: "Planned", privacy: "No write-back without explicit consent.", method: "OAuth later, read-only first", stage: "Architecture" },
  { name: "Google Drive", purpose: "Resource collections, course folders, and backup destinations.", status: "Planned", privacy: "Links remain user-owned; no drive scanning without opt-in.", method: "Linking first, API later", stage: "Architecture" },
  { name: "GitHub", purpose: "Repository shortcuts and coding tracker attribution.", status: "Planned", privacy: "Repo metadata only after connection.", method: "External link / OAuth later", stage: "Roadmap" },
  { name: "iCal subscriptions", purpose: "Read-only calendar overlays for class and study schedules.", status: "Planned", privacy: "Subscription URLs stay local unless synced by user.", method: "ICS URL", stage: "Roadmap" },
  { name: "Apple Health / Health Connect", purpose: "Future sleep/movement signals for readiness.", status: "Later", privacy: "Health data requires explicit opt-in and local-first controls.", method: "Native wrapper path", stage: "Future" },
  { name: "Vercel", purpose: "Stable deployment, version checks, and optional cloud sync APIs.", status: "Available", privacy: "Cloud snapshots only when the user saves or enables sync.", method: "Vercel API routes", stage: "Active alpha" },
  { name: "Notion", purpose: "Future resource/reference import and study dashboard embeds.", status: "Later", privacy: "Import-only by default.", method: "OAuth later", stage: "Future" },
  { name: "Browser extension", purpose: "Capture selected text into tasks, Anki Lab, or resources.", status: "Later", privacy: "User-triggered capture only.", method: "Extension placeholder", stage: "Future" },
];

export function IntegrationsPage() {
  const s = useStore();
  const otherIntegrations = s.integrations.filter((i) => !/anki/i.test(i.name));
  return (
    <>
      <AnkiConnectPanel />

      <GlassCard pad className="under-construction">
        <span className="uc-tape t1">Under Construction</span>
        <span className="uc-tape t2">Coming Soon</span>
        <span className="uc-badge"><Wrench size={15} /> More integrations are under construction</span>
        <div className="uc-inner">
          <PanelHeader title="Integrations center" sub="UNDER CONSTRUCTION — architecture and planning surface" />
          <div className="integration-roadmap-grid">
            {INTEGRATION_ROADMAP.map((item) => (
              <div className="integration-roadmap-card" key={item.name}>
                <div className="spread"><b>{item.name}</b><Tag tone={item.status.includes("Available") ? "cyan" : "neutral"}>{item.status}</Tag></div>
                <span>{item.purpose}</span>
                <small><b>Privacy:</b> {item.privacy}</small>
                <small><b>Connection:</b> {item.method}</small>
                <small><b>Roadmap:</b> {item.stage}</small>
              </div>
            ))}
          </div>
          <div className="stack gap8" style={{ marginTop: 14 }}>
            {otherIntegrations.map((i) => (
              <div className="int-row" key={i.id}>
                <span className="folder-icon"><Icon name={i.icon} size={18} /></span>
                <div className="grow">
                  <div style={{ fontWeight: 700 }}>{i.name}</div>
                  <div className="sub">{i.description}</div>
                </div>
                <Tag tone={statusTone[i.status]}>{statusLabel[i.status]}</Tag>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="How data flows" sub="Local-first by design" />
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
          Noctyrium keeps everything on your device. When integrations arrive they'll bring data
          <i> into</i> your workspace (like nightly Anki counts), never the other way around — so the
          app stays usable offline and portable via backup.
        </div>
      </GlassCard>
    </>
  );
}

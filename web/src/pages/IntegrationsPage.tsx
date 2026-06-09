import { useStore } from "../lib/store";
import { GlassCard, PanelHeader, Tag } from "../components/ui/primitives";
import { Icon } from "../lib/icons";
import type { Integration } from "../lib/types";

const statusTone: Record<Integration["status"], "green" | "cyan" | "neutral"> = {
  connected: "green", available: "cyan", planned: "neutral",
};
const statusLabel: Record<Integration["status"], string> = {
  connected: "Connected", available: "Available", planned: "Planned",
};

export function IntegrationsPage() {
  const s = useStore();
  return (
    <>
      <GlassCard pad>
        <PanelHeader title="Integrations" sub="Connect Anki, calendar, drives, and more. JSON backup is live today." />
        <div className="stack gap8">
          {s.integrations.map((i) => (
            <div className="int-row" key={i.id}>
              <span className="folder-icon"><Icon name={i.icon} size={18} /></span>
              <div className="grow">
                <div style={{ fontWeight: 700 }}>{i.name}</div>
                <div className="sub">{i.description}</div>
              </div>
              {i.name === "Anki Lab" && <a className="gbtn sm" href="#anki">Open</a>}
              <Tag tone={statusTone[i.status]}>{statusLabel[i.status]}</Tag>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="How data flows" sub="Local-first by design" />
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
          Noctyrium-web keeps everything in your browser. Integrations will push data <i>into</i> that
          local store (e.g. nightly Anki counts), never the other way around — so the app stays usable
          offline and portable via JSON export.
        </div>
      </GlassCard>
    </>
  );
}

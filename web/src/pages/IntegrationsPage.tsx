import { Wrench } from "lucide-react";
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
      <GlassCard pad className="under-construction">
        <span className="uc-tape t1">Under Construction</span>
        <span className="uc-tape t2">Coming Soon</span>
        <span className="uc-badge"><Wrench size={15} /> Integrations are under construction</span>
        <div className="uc-inner">
          <PanelHeader title="Integrations" sub="Planned for a future release." />
          <div className="stack gap8">
            {s.integrations.map((i) => (
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

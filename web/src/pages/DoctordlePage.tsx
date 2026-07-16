import { Construction } from "lucide-react";
import { GlassCard, Tag } from "../components/ui/primitives";
import { ICON_SIZE } from "../lib/iconSize";

/** Static collaboration boundary: intentionally no integration or network code. */
export function DoctordlePage() {
  return (
    <GlassCard pad className="doctordle-wip-page">
      <div className="stack" style={{ gap: 12 }}>
        <Tag tone="orange"><Construction size={ICON_SIZE.microInline} /> WIP</Tag>
        <div>
          <h1>Doctordle</h1>
          <p className="sub">Integration pending collaboration approval.</p>
        </div>
        <p className="sub">
          No integration is active. AXOM does not embed, contact, proxy, or reproduce an external game here.
        </p>
      </div>
    </GlassCard>
  );
}

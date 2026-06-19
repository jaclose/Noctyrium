import { Trophy, Flame, Users, Layers } from "lucide-react";
import { GlassCard, PanelHeader, Tag } from "../components/ui/primitives";

const ROWS = [
  { icon: Flame, title: "Study streaks", body: "Opt-in streak leaderboard among friends." },
  { icon: Layers, title: "Anki reviews", body: "Daily/weekly card-review standings (Anki Leaderboard add-on, user JD7)." },
  { icon: Users, title: "Study groups", body: "Private cohorts with shared goals and gentle accountability." },
];

export function LeaderboardsPage() {
  return (
    <>
      <GlassCard pad>
        <div className="row gap12" style={{ alignItems: "center" }}>
          <span className="folder-icon" style={{ color: "var(--orange)" }}><Trophy size={20} /></span>
          <div className="grow">
            <div style={{ fontSize: 18, fontWeight: 800 }}>Leaderboards</div>
            <div className="sub">Opt-in, friendly accountability — never a grind contest.</div>
          </div>
          <Tag tone="orange">Alpha 2 · coming soon</Tag>
        </div>
      </GlassCard>

      <GlassCard pad className="under-construction">
        <span className="uc-tape t1">Under Construction</span>
        <span className="uc-tape t2">Alpha 2</span>
        <span className="uc-badge"><Trophy size={15} /> Leaderboards — coming soon</span>
        <div className="uc-inner">
          <PanelHeader title="Planned boards" sub="Private and opt-in — designed to motivate, not to overload" />
          <div className="stack gap8">
            {ROWS.map((r) => {
              const I = r.icon;
              return (
                <div className="int-row" key={r.title}>
                  <span className="folder-icon"><I size={18} /></span>
                  <div className="grow"><div style={{ fontWeight: 700 }}>{r.title}</div><div className="sub">{r.body}</div></div>
                  <Tag tone="neutral">Planned</Tag>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </>
  );
}

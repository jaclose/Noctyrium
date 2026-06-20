import { useMemo, useState } from "react";
import { Trophy, Flame, Layers, Users, Crown, TrendingUp, TrendingDown, Minus, Lock } from "lucide-react";
import { GlassCard, PanelHeader, Tag } from "../components/ui/primitives";
import { useStore } from "../lib/store";
import { studyStreak, dayTotals, lastNDays, isoDate } from "../lib/scoring";

type BoardId = "streaks" | "anki" | "hours";

interface BoardConfig {
  id: BoardId;
  label: string;
  icon: typeof Flame;
  unit: string;
  blurb: string;
}

const BOARDS: BoardConfig[] = [
  { id: "streaks", label: "Study streaks", icon: Flame, unit: "day streak", blurb: "Consecutive study days among friends who opt in." },
  { id: "anki", label: "Anki reviews", icon: Layers, unit: "cards / wk", blurb: "Weekly card reviews (Anki Leaderboard add-on)." },
  { id: "hours", label: "Study hours", icon: TrendingUp, unit: "hrs / wk", blurb: "Logged focus time this week across the cohort." },
];

// Believable placeholder cohort — clearly a preview until real opt-in sync ships.
const COHORT: Record<BoardId, { name: string; value: number; delta: number }[]> = {
  streaks: [
    { name: "Amara O.", value: 47, delta: 2 }, { name: "Diego R.", value: 41, delta: 0 },
    { name: "Priya N.", value: 33, delta: -1 }, { name: "Sam K.", value: 29, delta: 3 },
    { name: "Lena M.", value: 22, delta: 1 }, { name: "Tomas V.", value: 18, delta: -2 },
  ],
  anki: [
    { name: "Priya N.", value: 1820, delta: 4 }, { name: "Amara O.", value: 1610, delta: 1 },
    { name: "Sam K.", value: 1490, delta: -1 }, { name: "Diego R.", value: 1305, delta: 2 },
    { name: "Lena M.", value: 1120, delta: 0 }, { name: "Tomas V.", value: 940, delta: -3 },
  ],
  hours: [
    { name: "Diego R.", value: 38, delta: 1 }, { name: "Amara O.", value: 34, delta: -1 },
    { name: "Lena M.", value: 31, delta: 2 }, { name: "Priya N.", value: 27, delta: 0 },
    { name: "Sam K.", value: 24, delta: 1 }, { name: "Tomas V.", value: 20, delta: -2 },
  ],
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function LeaderboardsPage() {
  const s = useStore();
  const [board, setBoard] = useState<BoardId>("streaks");
  const config = BOARDS.find((b) => b.id === board)!;

  // The user's real number from local data, slotted into the mock cohort so the
  // preview reflects actual effort instead of a hard-coded "You".
  const myValue = useMemo(() => {
    if (board === "streaks") return studyStreak(s.logs);
    const week = lastNDays(7).map((d) => dayTotals(s.logs, isoDate(d)));
    if (board === "anki") return week.reduce((a, d) => a + d.cards, 0);
    return Math.round(week.reduce((a, d) => a + d.minutes, 0) / 60);
  }, [board, s.logs]);

  const ranked = useMemo(() => {
    const me = { name: s.profile.name || "You", value: myValue, delta: 0, you: true };
    const rows = [...COHORT[board].map((r) => ({ ...r, you: false })), me]
      .sort((a, b) => b.value - a.value)
      .map((r, i) => ({ ...r, rank: i + 1 }));
    return rows;
  }, [board, myValue, s.profile.name]);

  const myRank = ranked.find((r) => r.you)!.rank;
  const podium = ranked.slice(0, 3);
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean); // 2 · 1 · 3

  return (
    <>
      <GlassCard pad>
        <div className="row gap12" style={{ alignItems: "center" }}>
          <span className="folder-icon" style={{ color: "var(--orange)" }}><Trophy size={20} /></span>
          <div className="grow">
            <div style={{ fontSize: 18, fontWeight: 800 }}>Leaderboards</div>
            <div className="sub">Opt-in, friendly accountability — never a grind contest.</div>
          </div>
          <Tag tone="orange">Alpha 2 · preview</Tag>
        </div>
      </GlassCard>

      <GlassCard pad className="under-construction">
        <span className="uc-tape t1">Under Construction</span>
        <span className="uc-badge"><Lock size={15} /> Opt-in sync — not live yet</span>
        <div className="uc-inner">
          <div className="lb-tabs">
            {BOARDS.map((b) => {
              const I = b.icon;
              return (
                <button type="button" key={b.id} className={`filter-pill ${board === b.id ? "on" : ""}`} onClick={() => setBoard(b.id)}>
                  <I size={13} /> {b.label}
                </button>
              );
            })}
          </div>

          <div className="lb-stat-strip">
            <div className="lb-stat"><Trophy size={15} /><div><b>#{myRank}</b><span>your rank</span></div></div>
            <div className="lb-stat"><config.icon size={15} /><div><b>{myValue}</b><span>your {config.unit}</span></div></div>
            <div className="lb-stat"><Users size={15} /><div><b>{ranked.length}</b><span>in cohort</span></div></div>
          </div>

          <div className="lb-podium">
            {podiumOrder.map((p) => {
              const place = p.rank;
              return (
                <div key={p.name} className={`lb-podium-col p${place} ${p.you ? "you" : ""}`}>
                  {place === 1 && <Crown size={18} className="lb-crown" />}
                  <span className="lb-avatar">{p.you ? "YOU" : initials(p.name)}</span>
                  <b className="truncate">{p.name}</b>
                  <span className="lb-podium-val">{p.value.toLocaleString()}</span>
                  <div className="lb-podium-base">{place}</div>
                </div>
              );
            })}
          </div>

          <PanelHeader title={config.label} sub={config.blurb} />
          <div className="lb-rows">
            {ranked.map((r) => (
              <div key={r.name} className={`lb-row ${r.you ? "you" : ""}`}>
                <span className="lb-rank">{r.rank}</span>
                <span className="lb-avatar sm">{r.you ? "YOU" : initials(r.name)}</span>
                <span className="grow truncate">{r.name}{r.you && <Tag tone="cyan">You</Tag>}</span>
                <span className="lb-delta">
                  {r.delta > 0 ? <TrendingUp size={14} className="up" /> : r.delta < 0 ? <TrendingDown size={14} className="down" /> : <Minus size={14} className="flat" />}
                </span>
                <b className="lb-value">{r.value.toLocaleString()}<small> {config.unit}</small></b>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="How leaderboards will work" sub="Designed to motivate, not to overload" />
        <div className="grid grid-2">
          {[
            { icon: Lock, title: "Opt-in only", body: "Nothing is shared until you turn it on and pick a cohort. Private by default." },
            { icon: Users, title: "Small cohorts", body: "Friends and study groups, not a global ranking — accountability you actually feel." },
            { icon: Flame, title: "Effort, not extremes", body: "Streaks and consistency are rewarded over single grind days, in line with anti-overload." },
            { icon: Layers, title: "Anki add-on sync", body: "Pull weekly reviews from the Anki Leaderboard add-on once integrations land." },
          ].map((t) => {
            const I = t.icon;
            return (
              <div className="int-row" key={t.title}>
                <span className="folder-icon"><I size={18} /></span>
                <div className="grow"><div style={{ fontWeight: 700 }}>{t.title}</div><div className="sub">{t.body}</div></div>
                <Tag tone="neutral">Planned</Tag>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </>
  );
}

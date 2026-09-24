import { useMemo, useState } from "react";
import { Trophy, Lock } from "lucide-react";
import { GlassCard, PanelHeader, Tag } from "../components/ui/primitives";
import { useStore } from "../lib/store";
import { personalActivityWeeks, rankPersonalWeeks, type PersonalBoardMetric } from "../lib/leaderboards";
import { isoDate } from "../lib/scoring";
import { ICON_SIZE } from "../lib/iconSize";

const BOARDS: Array<{ id: PersonalBoardMetric; label: string }> = [
  { id: "activeDays", label: "Study days" }, { id: "cards", label: "Logged cards" }, { id: "minutes", label: "Study time" },
];

export function LeaderboardsPage() {
  const logs = useStore(s => s.logs);
  const [metric, setMetric] = useState<PersonalBoardMetric>("activeDays");
  const today = isoDate(new Date());
  const weeks = useMemo(() => personalActivityWeeks(logs, new Date(today + "T12:00:00")), [logs, today]);
  const ranked = useMemo(() => rankPersonalWeeks(weeks, metric), [weeks, metric]);
  const current = weeks[0];
  function value(amount: number) {
    if (metric === "minutes") return Number((amount / 60).toFixed(1)) + " hours";
    return amount.toLocaleString() + (metric === "cards" ? " cards" : " days");
  }
  return <>
    <GlassCard pad>
      <div className="row wrap gap12">
        <Trophy size={ICON_SIZE.control} />
        <div className="grow"><h2>Leaderboards</h2><p className="sub">Your real activity, starting with your own weekly progress.</p></div>
        <Tag tone="cyan">Personal standings</Tag>
      </div>
    </GlassCard>
    <GlassCard pad>
      <PanelHeader title="This week" sub={current.start + " to " + current.end + " · device-local Monday–Sunday"} />
      <div className="lb-stat-strip">
        <div className="lb-stat"><div><b>{current.activeDays}/7</b><span>study days</span></div></div>
        <div className="lb-stat"><div><b>{current.cards.toLocaleString()}</b><span>logged cards</span></div></div>
        <div className="lb-stat"><div><b>{Number((current.minutes / 60).toFixed(1))}</b><span>study hours</span></div></div>
      </div>
      <p className="sub">An in-progress week is not ranked against full weeks. Any recorded academic study counts as an active day. Rest days are allowed.</p>
    </GlassCard>
    <GlassCard pad>
      <PanelHeader title="Your completed weeks" sub="Compare your last eight completed weeks. Equal totals share a rank. Only weeks with activity for this measure appear." />
      <div className="lb-tabs">{BOARDS.map(board => <button type="button" key={board.id} className={"filter-pill " + (metric === board.id ? "on" : "")} aria-pressed={metric === board.id} onClick={() => setMetric(board.id)}>{board.label}</button>)}</div>
      {ranked.length ? <ol className="lb-rows" aria-label="Personal weekly standings" style={{ padding: 0 }}>{ranked.map(week => <li className="lb-row" key={week.start}>
        <span className="lb-rank">{week.rank}</span>
        <span className="grow">{week.start}<span className="sub" style={{ display: "block" }}>to {week.end}</span></span>
        <b className="lb-value">{value(week[metric])}</b>
      </li>)}</ol> : <div className="application-state"><h3>No completed weeks with {BOARDS.find(board => board.id === metric)?.label.toLowerCase()} yet</h3><p className="sub">Log your study from Today. Your standings will appear after the week ends.</p><a className="ghost-btn" href="#dashboard">Go to Today</a></div>}
      <p className="sub">Based only on academic activity recorded in AXOM. Logged cards are not a verified connection to the Anki Leaderboard add-on.</p>
    </GlassCard>
    <GlassCard pad>
      <PanelHeader title="Study with friends" sub="Planned · not connected" />
      <p className="sub"><Lock size={ICON_SIZE.body} /> Private groups will require explicit opt-in and revocable sharing. No participants are invented and nothing from this page is published to a cohort. Your workspace still follows your existing account and save settings.</p>
    </GlassCard>
  </>;
}

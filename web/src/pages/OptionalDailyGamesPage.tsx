import { ArrowUpRight, CircleHelp, Gamepad2, Stethoscope, WholeWord } from "lucide-react";
import { GlassCard, Tag } from "../components/ui/primitives";
import { useStore } from "../lib/store";
import "../styles/ecosystem.css";

export const DOCTORDLE_URL = "https://doctordle.org/";

export function OptionalDailyGamesPage() {
  const history = useStore((state) => state.dailyWordPuzzles);
  const completed = history.filter((puzzle) => puzzle.completed).length;
  return (
    <main className="ecosystem-page" aria-labelledby="daily-games-title">
      <header className="ecosystem-hero">
        <Tag tone="purple"><Gamepad2 size={14} /> Play</Tag>
        <h1 id="daily-games-title">Daily Games</h1>
        <p>Short study-break puzzles with an honest boundary between AXOM-owned play and independent destinations.</p>
      </header>
      <section className="game-grid" aria-label="Available games">
        <GameCard icon={<WholeWord />} title="Daily Word" status="LIVE · LOCAL" description="AXOM’s five-letter daily puzzle. Works locally and keeps history on this device." meta={`${completed} completed`} href="#daily-word" />
        <GameCard icon={<Stethoscope />} title="Doctordle" status="LIVE · EXTERNAL" description="Daily diagnosis game operated independently from AXOM. Opens its verified public website in a new tab." meta="Provider controls availability and reset schedule" href={DOCTORDLE_URL} external />
        <GameCard icon={<CircleHelp />} title="Sweeper" status="DESTINATION REQUIRES CONFIRMATION" description="A Sweeper destination has not been verified. AXOM will not guess or send you to an unconfirmed site." meta="Unavailable" />
      </section>
      <p className="ecosystem-note">External games are not embedded, proxied, or represented as AXOM products. An internet connection may be required.</p>
    </main>
  );
}

function GameCard({ icon, title, status, description, meta, href, external }: { icon: React.ReactNode; title: string; status: string; description: string; meta: string; href?: string; external?: boolean }) {
  return <GlassCard pad className="game-card">
    <div className="game-card__icon" aria-hidden="true">{icon}</div>
    <div className="game-card__status">{status}</div>
    <h2>{title}</h2><p>{description}</p><small>{meta}</small>
    {href ? <a className="gbtn primary game-card__action" href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{external ? "Open verified site" : "Play now"}<ArrowUpRight size={16} /></a> : <span className="game-card__disabled" aria-disabled="true">Not available yet</span>}
  </GlassCard>;
}

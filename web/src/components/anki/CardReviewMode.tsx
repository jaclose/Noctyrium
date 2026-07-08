// ===========================================================================
// In-app card review — the due queue with front → reveal → rate (again/hard/
// good/easy). Scheduling is the lightweight SM-2 flavor in lib/ankiCards;
// serious long-term review still belongs in Anki via export, and this never
// pretends otherwise.
// ===========================================================================
import { useMemo, useState } from "react";
import { useStore } from "../../lib/store";
import { dueCards, type ReviewRating } from "../../lib/ankiCards";
import { GlassCard, GButton, PanelHeader, Tag, EmptyState } from "../ui/primitives";

const RATINGS: Array<{ rating: ReviewRating; label: string; hint: string }> = [
  { rating: "again", label: "Again", hint: "10 min" },
  { rating: "hard", label: "Hard", hint: "shorter step" },
  { rating: "good", label: "Good", hint: "normal step" },
  { rating: "easy", label: "Easy", hint: "longer step" },
];

/** Render cloze text with deletions hidden (front) or revealed (back). */
function clozeText(text: string, revealed: boolean): string {
  return text.replace(/\{\{c\d+::([^}]+?)(?:::[^}]*)?\}\}/g, (_, answer: string) => (revealed ? `[${answer}]` : "[…]"));
}

export function CardReviewMode() {
  const s = useStore();
  const cards = s.ankiCards ?? [];
  const [revealed, setRevealed] = useState(false);
  const [shownAt, setShownAt] = useState(() => Date.now());
  const [doneCount, setDoneCount] = useState(0);

  const queue = useMemo(() => dueCards(cards), [cards]);
  const card = queue[0];

  function rate(rating: ReviewRating) {
    if (!card) return;
    s.reviewAnkiCard(card.id, rating, Date.now() - shownAt);
    setRevealed(false);
    setShownAt(Date.now());
    setDoneCount((n) => n + 1);
  }

  if (!card) {
    return (
      <GlassCard>
        <PanelHeader title="Review queue" sub="Due cards, scheduled by your ratings." />
        <EmptyState
          title={doneCount > 0 ? `Queue clear — ${doneCount} reviewed` : "Nothing due right now"}
          hint={cards.length === 0
            ? "Add cards to the vault first; they become due immediately."
            : "Come back when the schedule surfaces the next batch. That's the system working."}
        />
      </GlassCard>
    );
  }

  const isCloze = card.type === "cloze";

  return (
    <GlassCard>
      <PanelHeader
        title="Review queue"
        sub={`${queue.length} due · ${doneCount} done this sitting`}
        action={card.aiGenerated ? <Tag tone="purple">AI-generated — verify against source</Tag> : undefined}
      />
      <div className="review-face">
        <div className="review-front">{isCloze ? clozeText(card.front, revealed) : card.front}</div>
        {revealed && (
          <>
            {!isCloze && <div className="review-back">{card.back}</div>}
            {card.extra && <div className="sub">{card.extra}</div>}
            {card.source && <div className="sub">Source: {card.source}</div>}
          </>
        )}
      </div>
      <div className="row" style={{ justifyContent: "center", marginTop: 14, gap: 8 }}>
        {!revealed ? (
          <GButton variant="primary" onClick={() => setRevealed(true)}>Show answer</GButton>
        ) : (
          RATINGS.map(({ rating, label, hint }) => (
            <GButton key={rating} variant={rating === "good" ? "primary" : "default"} onClick={() => rate(rating)}>
              {label} <span className="dim" style={{ fontSize: 11 }}>{hint}</span>
            </GButton>
          ))
        )}
      </div>
    </GlassCard>
  );
}

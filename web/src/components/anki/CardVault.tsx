// ===========================================================================
// Card vault (directive §11) — the persisted card collection. List, edit,
// quality flags, suspend, delete, and Anki-compatible TSV export. Cards enter
// here from manual creation, question repair, or reviewed AI generation.
// ===========================================================================
import { useMemo, useState } from "react";
import { Download, Plus, Trash2, PauseCircle, PlayCircle } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  cardsToAnkiTsv, dueCards, newSchedule, reviewCardQuality,
  CARD_TYPE_LABEL, type AnkiCard, type AnkiCardType,
} from "../../lib/ankiCards";
import { GlassCard, GButton, GhostButton, PanelHeader, Tag, EmptyState } from "../ui/primitives";
import { Modal, Field, SelectField, TextAreaField } from "../ui/Modal";
import { pushToast } from "../../lib/toast";
import { ICON_SIZE } from "../../lib/iconSize";

const CARD_TYPES = Object.keys(CARD_TYPE_LABEL) as AnkiCardType[];

const NO_CARDS: AnkiCard[] = [];

export function CardVault() {
  const s = useStore();
  const cards = s.ankiCards ?? NO_CARDS;
  const [editing, setEditing] = useState<AnkiCard | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | "due" | "ai" | "flagged" | "suspended">("all");

  const flaggedIds = useMemo(() => {
    const set = new Set<string>();
    for (const card of cards) {
      if (reviewCardQuality(card, cards.filter((c) => c.id !== card.id)).length > 0) set.add(card.id);
    }
    return set;
  }, [cards]);

  const visible = useMemo(() => {
    if (filter === "due") return dueCards(cards);
    if (filter === "ai") return cards.filter((c) => c.aiGenerated);
    if (filter === "flagged") return cards.filter((c) => flaggedIds.has(c.id));
    if (filter === "suspended") return cards.filter((c) => c.suspended);
    return cards;
  }, [cards, filter, flaggedIds]);

  function exportTsv() {
    const body = cardsToAnkiTsv(filter === "all" ? cards : visible);
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "card-vault-anki-import.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <GlassCard>
      <PanelHeader
        title="Card vault"
        sub={`${cards.length} cards · ${dueCards(cards).length} due · quality flags run on every save`}
        action={
          <div className="row">
            <GhostButton onClick={exportTsv} disabled={!cards.length}><Download size={ICON_SIZE.body} /> Export TSV</GhostButton>
            <GButton size="sm" variant="primary" onClick={() => setCreating(true)}><Plus size={ICON_SIZE.body} /> New card</GButton>
          </div>
        }
      />
      <div className="row" style={{ flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {(["all", "due", "ai", "flagged", "suspended"] as const).map((f) => (
          <button key={f} className={`filter-pill ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>
            {f === "ai" ? "AI-generated" : f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={cards.length === 0 ? "No cards yet" : "Nothing matches this filter"}
          hint={cards.length === 0 ? "Create cards manually, from missed questions, or generate drafts with a local AI provider." : undefined}
        />
      ) : (
        <div className="stack gap6">
          {visible.slice(0, 60).map((card) => (
            <div key={card.id} className={`card-row ${card.suspended ? "suspended" : ""}`}>
              <button className="grow stack card-row-main" onClick={() => setEditing(card)}>
                <span className="truncate" style={{ fontWeight: 600 }}>{card.front}</span>
                <span className="sub truncate">{card.back || "(cloze)"}</span>
              </button>
              <Tag tone="neutral">{CARD_TYPE_LABEL[card.type]}</Tag>
              {card.aiGenerated && <Tag tone="purple">AI</Tag>}
              {flaggedIds.has(card.id) && <Tag tone="orange">check</Tag>}
              <GhostButton
                aria-label={card.suspended ? "Unsuspend card" : "Suspend card"}
                onClick={() => s.updateAnkiCard(card.id, { suspended: !card.suspended })}
              >
                {card.suspended ? <PlayCircle size={ICON_SIZE.body} /> : <PauseCircle size={ICON_SIZE.body} />}
              </GhostButton>
              <GhostButton aria-label="Delete card" onClick={() => s.removeAnkiCard(card.id)}><Trash2 size={ICON_SIZE.body} /></GhostButton>
            </div>
          ))}
          {visible.length > 60 && <div className="sub">Showing 60 of {visible.length}.</div>}
        </div>
      )}

      {(creating || editing) && (
        <CardEditModal
          card={editing ?? undefined}
          allCards={cards}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
    </GlassCard>
  );
}

function CardEditModal({ card, allCards, onClose }: { card?: AnkiCard; allCards: AnkiCard[]; onClose: () => void }) {
  const s = useStore();
  const [type, setType] = useState<AnkiCardType>(card?.type ?? "basic");
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [extra, setExtra] = useState(card?.extra ?? "");
  const [source, setSource] = useState(card?.source ?? "");
  const [tags, setTags] = useState(card?.tags.join(", ") ?? "");

  const flags = useMemo(
    () => reviewCardQuality(
      { type, front, back, source: source || undefined, aiGenerated: card?.aiGenerated ?? false },
      allCards.filter((c) => c.id !== card?.id),
    ),
    [type, front, back, source, allCards, card],
  );

  function save() {
    const payload = {
      ...(card ?? {}),
      type, front, back,
      extra: extra || undefined,
      source: source || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      aiGenerated: card?.aiGenerated ?? false,
      schedule: card?.schedule ?? newSchedule(),
    };
    if (card) {
      s.updateAnkiCard(card.id, payload);
      onClose();
      return;
    }
    const result = s.addAnkiCards([payload]);
    if (!result.saved) {
      pushToast({ title: "Card not saved", body: result.errors.join(" "), tone: "warn" });
      return;
    }
    onClose();
  }

  return (
    <Modal
      title={card ? "Edit card" : "New card"}
      onClose={onClose}
      footer={<GButton variant="primary" onClick={save}>{card ? "Save changes" : "Add to vault"}</GButton>}
    >
      <SelectField label="Card type" value={type} onChange={(e) => setType(e.target.value as AnkiCardType)}>
        {CARD_TYPES.map((t) => <option key={t} value={t}>{CARD_TYPE_LABEL[t]}</option>)}
      </SelectField>
      <TextAreaField label={type === "cloze" ? "Text with {{c1::deletions}}" : "Front"} rows={3}
        value={front} onChange={(e) => setFront(e.target.value)} />
      <TextAreaField label="Back" rows={3} value={back} onChange={(e) => setBack(e.target.value)} />
      <TextAreaField label="Extra (optional)" rows={2} value={extra} onChange={(e) => setExtra(e.target.value)} />
      <Field label="Source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="lecture, page, question set…" />
      <Field label="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
      {flags.length > 0 && (
        <div className="stack gap6">
          <span className="field-label">Quality checks</span>
          <ul className="intake-warnings">
            {flags.map((f, i) => <li key={i}>{f.message}</li>)}
          </ul>
        </div>
      )}
    </Modal>
  );
}

import { useMemo, useState } from "react";
import { Wand2, Copy, Check, Download, Save, Sparkles, Layers, FolderDown } from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, PanelHeader, Tag } from "../components/ui/primitives";
import { Field, SelectField, TextAreaField } from "../components/ui/Modal";

type CardStyle = "cloze" | "qa" | "image";
type NoteType = "Basic" | "Basic and reversed" | "Cloze" | "Custom";

interface DraftCard {
  noteType: NoteType;
  front: string;
  back: string;
  tags: string;
}

const STYLE_LABEL: Record<CardStyle, string> = {
  cloze: "Cloze (facts)", qa: "Q&A (concepts)", image: "Image occlusion (diagrams)",
};

export function AnkiLabPage() {
  const s = useStore();
  const [sourceItem, setSourceItem] = useState("");
  const [topic, setTopic] = useState("");
  const [system, setSystem] = useState("");
  const [maxCards, setMaxCards] = useState("20");
  const [styles, setStyles] = useState<Set<CardStyle>>(new Set(["cloze", "qa"]));
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localCards, setLocalCards] = useState<DraftCard[]>([]);
  const [noteType, setNoteType] = useState<NoteType>("Cloze");
  const [customFields, setCustomFields] = useState("Front,Back,Tags");

  // step 2 — paste AI output, export an Anki-importable file
  const [aiOut, setAiOut] = useState("");

  const lectures = s.tracker.filter((t) => (t.kind === "Lecture" || t.kind === "DLA") && !isBoardPrepSource(t.path, t.label));

  function toggleStyle(st: CardStyle) {
    setStyles((prev) => {
      const next = new Set(prev);
      next.has(st) ? next.delete(st) : next.add(st);
      return next;
    });
  }

  const prompt = useMemo(
    () => buildPrompt({ topic: topic || sourceLabel(lectures, sourceItem), system, maxCards, styles, content }),
    [topic, sourceItem, system, maxCards, styles, content, lectures],
  );

  function copyPrompt() {
    navigator.clipboard?.writeText(prompt);
    setCopied(true); setTimeout(() => setCopied(false), 1200);
  }
  function savePrompt() {
    s.addPrompt({ title: `Anki cards — ${topic || sourceLabel(lectures, sourceItem) || "lecture"}`, category: "Anki", tags: ["anki", "generated"], body: prompt });
    setSaved(true); setTimeout(() => setSaved(false), 1400);
  }
  function downloadTxt() {
    download(`noctyrium-anki-prompt.txt`, prompt, "text/plain");
  }
  function generateLocalCards() {
    setLocalCards(makeLocalCards({
      topic: topic || sourceLabel(lectures, sourceItem),
      system,
      maxCards: Number(maxCards) || 20,
      styles,
      noteType,
      content,
    }));
  }
  function tsvBody() {
    return aiOut.trim() ? toTsv(aiOut, system) : cardsToTsv(localCards, noteType, customFields);
  }
  function exportTsv() {
    download(`noctyrium-anki-import.txt`, tsvBody(), "text/plain");
  }
  function exportCsv() {
    download(`noctyrium-anki-import.csv`, tsvToCsv(tsvBody()), "text/csv");
  }

  return (
    <>
      <GlassCard pad>
        <div className="row gap12" style={{ alignItems: "center" }}>
          <span className="folder-icon" style={{ color: "var(--purple)" }}><Wand2 size={20} /></span>
          <div className="grow">
            <div style={{ fontSize: 18, fontWeight: 800 }}>Anki Lab</div>
            <div className="sub">Turn a lecture, DLA, or slide text into high-yield Anki cards with AI — then import them into Anki.</div>
          </div>
          <Tag tone="green">No backend needed</Tag>
        </div>
      </GlassCard>

      <div className="grid grid-2">
        <GlassCard pad>
          <PanelHeader title="1 · Describe the source" sub="High-yield, not exhaustive — a sane deck beats a 500-card dump" />
          <div className="stack gap12">
            <SelectField label="From a tracked item (optional)" value={sourceItem} onChange={(e) => { setSourceItem(e.target.value); }}>
              <option value="">— none / paste below —</option>
              {lectures.map((l) => <option key={l.id} value={l.id}>{l.kind}: {l.label}</option>)}
            </SelectField>
            <div className="row gap12">
              <Field label="Topic / title" placeholder="NB 58 Emotions" value={topic} onChange={(e) => setTopic(e.target.value)} />
              <Field label="System tag" placeholder="Neuro" value={system} onChange={(e) => setSystem(e.target.value)} />
            </div>
            <div className="row gap12">
              <Field label="Max cards" type="number" value={maxCards} onChange={(e) => setMaxCards(e.target.value)} />
              <div className="grow">
                <span className="field-label">Card styles</span>
                <div className="row wrap gap6" style={{ marginTop: 6 }}>
                  {(Object.keys(STYLE_LABEL) as CardStyle[]).map((st) => (
                    <button key={st} className={`filter-pill ${styles.has(st) ? "on" : ""}`} onClick={() => toggleStyle(st)}>{STYLE_LABEL[st]}</button>
                  ))}
                </div>
              </div>
            </div>
            <TextAreaField label="Paste lecture / DLA / slide text" rows={7}
              placeholder="Paste the lecture notes or slide text here. (Slides & PDFs as direct uploads are a planned integration — for now, copy the text in.)"
              value={content} onChange={(e) => setContent(e.target.value)} />
            <div className="row wrap gap8">
              <SelectField label="Default note type" value={noteType} onChange={(e) => setNoteType(e.target.value as NoteType)}>
                <option>Basic</option>
                <option>Basic and reversed</option>
                <option>Cloze</option>
                <option>Custom</option>
              </SelectField>
              <Field label="Custom fields" placeholder="Front,Back,Tags" value={customFields} onChange={(e) => setCustomFields(e.target.value)} />
            </div>
            <GButton variant="primary" onClick={generateLocalCards} disabled={!content.trim()}>
              <Sparkles size={14} /> Generate local draft cards
            </GButton>
          </div>
        </GlassCard>

        <GlassCard pad>
          <PanelHeader title="2 · Generated AI prompt" sub="Paste into Claude/ChatGPT — tuned for Anki import"
            action={
              <div className="row gap6">
                <GButton size="sm" onClick={copyPrompt}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</GButton>
                <GButton size="sm" onClick={savePrompt} title="Save to Prompt Library">{saved ? <Check size={14} /> : <Save size={14} />}</GButton>
                <GButton size="sm" onClick={downloadTxt} title="Download .txt"><Download size={14} /></GButton>
              </div>} />
          <pre className="code-block">{prompt}</pre>
        </GlassCard>
      </div>

      <GlassCard pad>
        <PanelHeader title="3 · Browser-local draft cards" sub="Rule-based local generator for fast first drafts before AI polish" />
        {localCards.length === 0 ? (
          <div className="dim">Paste lecture text and click Generate local draft cards.</div>
        ) : (
          <div className="anki-drafts">
            {localCards.map((card, i) => (
              <div className="draft-card" key={`${card.front}-${i}`}>
                <Tag tone={card.noteType === "Cloze" ? "purple" : "cyan"}>{card.noteType}</Tag>
                <div className="draft-front">{card.front}</div>
                {card.back && <div className="draft-back">{card.back}</div>}
                <div className="sub">{card.tags}</div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="4 · Export to Anki" sub="Paste AI output or export the local draft cards"
          action={
            <div className="row gap6">
              <GButton size="sm" variant="primary" disabled={!aiOut.trim() && !localCards.length} onClick={exportTsv}><Download size={14} /> .txt (TSV)</GButton>
              <GButton size="sm" disabled={!aiOut.trim() && !localCards.length} onClick={exportCsv}><Download size={14} /> .csv</GButton>
            </div>} />
        <TextAreaField label="Paste the cards the AI returned (Front : Back, or cloze text, one per line)"
          rows={6} placeholder={"What neurotransmitter is most implicated in depression? : Serotonin\n{{c1::Serotonin}} is the main monoamine targeted by SSRIs."}
          value={aiOut} onChange={(e) => setAiOut(e.target.value)} />
        <div className="sub" style={{ marginTop: 10 }}>
          In Anki: <b>File - Import</b>, set <b>Field separator: Tab</b>, allow HTML, and choose Basic, Cloze, or your custom note type.
          TSV columns: Basic = <span className="mono">Front / Back / Tags</span>; Cloze = <span className="mono">Text / Extra / Tags</span>;
          Custom = <span className="mono">{customFields || "your fields"}</span>. Tagged <span className="mono">{system || "system"}</span>.
        </div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="5 · Your own card style & note types"
          sub="Load the Noctyrium / MADCOW glass card style, or build a custom note type"
          action={<a className="gbtn sm" href="https://drive.google.com/drive/u/0/folders/19_3nrTD66v_oCIKlruFVidirdCAIe8yp" target="_blank" rel="noreferrer noopener"><FolderDown size={14} /> Get the Anki style</a>} />
        <div className="anki-guide">
          <div className="anki-guide-col">
            <div className="anki-guide-h">Install the styled deck</div>
            <ol className="import-steps">
              <li>Open the <b>Anki style drive</b> above and download the <span className="mono">.apkg</span> (and any media/fonts).</li>
              <li>In Anki: <b>File → Import</b> the <span className="mono">.apkg</span> once — this installs the note type <i>and</i> its styling.</li>
              <li>Check <b>Tools → Manage Note Types</b> to confirm the styled type is there.</li>
              <li>Re-import your cards from above (<b>.csv</b> or <b>.txt</b>), choosing that note type and mapping the fields.</li>
            </ol>
          </div>
          <div className="anki-guide-col">
            <div className="anki-guide-h">Make your own note type</div>
            <ol className="import-steps">
              <li><b>Tools → Manage Note Types → Add</b> → clone <i>Basic</i> or <i>Cloze</i>, name it.</li>
              <li>Select it → <b>Fields…</b> to add fields (e.g. <span className="mono">Front, Back, Extra, Source, Tags</span>).</li>
              <li><b>Cards…</b> → edit the <i>Front</i>/<i>Back</i> templates and paste CSS into <b>Styling</b> for the glass look.</li>
              <li>When importing, set <b>Field separator</b> (Comma for .csv, Tab for .txt) and map columns to your fields.</li>
            </ol>
          </div>
        </div>
        <div className="sub" style={{ marginTop: 8 }}>Drop me screenshots of your build and I'll bake the exact field map + styling steps into this guide.</div>
      </GlassCard>

      <GlassCard pad>
        <div className="sugg">
          <Sparkles size={16} style={{ color: "var(--cyan)" }} />
          <div className="grow">
            <div className="sugg-title">Planned: one-click generation</div>
            <div className="sugg-reason">Connect an AI key and drop a slide PDF to generate + auto-export decks. For now the prompt flow keeps it free, private, and offline.</div>
          </div>
          <Tag tone="neutral"><Layers size={12} /> roadmap</Tag>
        </div>
      </GlassCard>
    </>
  );
}

function sourceLabel(lectures: { id: string; label: string }[], id: string): string {
  return lectures.find((l) => l.id === id)?.label ?? "";
}

function isBoardPrepSource(path: string, label: string): boolean {
  return /\b(step\s*[123]|step\s*2\s*ck|cbse|usmle|nbme|shelf|mcat|pre[-\s]?med)\b/i.test(`${path} ${label}`);
}

function buildPrompt({
  topic, system, maxCards, styles, content,
}: {
  topic: string; system: string; maxCards: string; styles: Set<CardStyle>; content: string;
}): string {
  const styleLines: string[] = [];
  if (styles.has("cloze")) styleLines.push("• Cloze deletions for discrete facts (one fact per card; prefer cloze over basic).");
  if (styles.has("qa")) styleLines.push("• Basic Q&A for concepts, mechanisms, and “why” reasoning.");
  if (styles.has("image")) styleLines.push("• For any diagram/figure, write an image-occlusion note describing what to occlude.");
  const tag = system ? ` Tag every card with "${system}".` : "";

  return `You are my medical-school study partner. Make high-yield Anki cards from the material below.

TOPIC: ${topic || "(see content)"}
LIMIT: at most ${maxCards || "20"} cards — only the highest-yield, testable facts. Do NOT pad the deck; a focused deck beats an exhaustive one (overload causes burnout).

CARD STYLES:
${styleLines.join("\n") || "• Cloze for facts; Q&A for concepts."}

RULES:
- One idea per card. Be precise and exam-relevant (USMLE-style).
- No fluff, no duplicates, no trivia.
- Output in a format I can paste straight into Anki:
  - Basic cards as:  Front : Back   (one per line)
  - Cloze cards as:  {{c1::answer}} embedded in the sentence (one per line)
- After the cards, add a one-line "Tag:" suggestion.${tag}

MATERIAL:
"""
${content || "(paste lecture / DLA / slide text here)"}
"""`;
}

// Lines that are slide boilerplate, headings, citations, codes — never cards.
const NOISE_RE: RegExp[] = [
  /copyright|all rights reserved|may not be copied|downloadable files|strictly illegal|permitted to make|view only files|alterations to the documents/i,
  /st\.?\s*george'?s university|school of medicine/i,
  /^(learning objectives?|road ?map|summary|outline|overview|terminology|notable|key concept)\b/i,
  /^som\.mk|^[a-z]{2,}\.\d|\bmicr\.\d|\.bpm\d/i,            // objective / module codes
  /https?:\/\/|www\.|\.com\b|\.org\b|\.gov\b|doi:|et al\.?|\bvolume:|\bissue:/i, // urls / citations
  /pubmed|sciencedirect|researchgate|libretexts|chegg|pinterest|theconversation|mdpi|wikipedia|microbiologykey|basicmedicalkey|lookfordiagnosis|textbookofbacteriology/i,
  /@\w+\.\w+/,                                              // emails
  /^(under investigation|adapted from|source|figure|fig\.?|table)\b/i,
];

function isNoise(l: string): boolean {
  if (l.length < 24) return true;
  const letters = l.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 12) return true;
  const lower = (l.match(/[a-z]/g) || []).length;
  if (lower < letters.length * 0.35) return true; // mostly caps → heading/title/code
  if ((l.match(/[A-Z]/g) || []).length > 6 && /^[A-Z][^a-z]*$/.test(l.split(" ")[0] || "")) return true;
  return NOISE_RE.some((re) => re.test(l));
}

const CLOZE_VERB = /\b(is|are|causes?|inhibits?|stimulates?|activates?|presents? with|results? in|leads? to|increases?|decreases?|treats?|produces?|mediates?|requires?|prevents?|degrades?|enhances?|binds?|consists? of|refers? to)\b/i;

/** Cloze the ANSWER (the phrase after a key verb), never the subject. */
function pickCloze(line: string): string | null {
  const m = line.match(CLOZE_VERB);
  if (m && m.index !== undefined) {
    const after = line.slice(m.index + m[0].length).trim();
    const answer = after.split(/[,;:(]| - /)[0].trim().replace(/[.]+$/, "").trim();
    if (answer.length >= 4 && answer.split(/\s+/).length <= 9 && /[a-z]/i.test(answer)) {
      return line.replace(answer, `{{c1::${answer}}}`);
    }
  }
  return null; // refuse to force a bad cloze
}

function basicType(n: NoteType): NoteType { return n === "Cloze" ? "Basic" : n; }

function lineToCard(line: string, styles: Set<CardStyle>, noteType: NoteType, tag: string): DraftCard | null {
  // "Term: definition" → clean Q&A or a clozed definition
  const def = line.match(/^([A-Za-z][\w +\-/()]{2,52}):\s+(.{12,})$/);
  if (def) {
    const term = def[1].trim();
    const body = def[2].trim();
    if (styles.has("qa")) return { noteType: basicType(noteType), front: `What is ${term}?`, back: body, tags: tag };
    if (styles.has("cloze")) return { noteType: "Cloze", front: `${term}: {{c1::${body}}}`, back: "", tags: tag };
  }
  // declarative fact → cloze the answer
  if (styles.has("cloze")) {
    const c = pickCloze(line);
    if (c) return { noteType: "Cloze", front: c, back: "", tags: tag };
  }
  return null; // no clean card from this line — skip it
}

function makeLocalCards({
  topic, system, maxCards, styles, noteType, content,
}: {
  topic: string; system: string; maxCards: number; styles: Set<CardStyle>; noteType: NoteType; content: string;
}): DraftCard[] {
  const tag = tagify(system || topic || "Noctyrium");
  const seen = new Set<string>();
  const out: DraftCard[] = [];
  const lines = content.split(/\n+/).map((l) => l.replace(/^(\d+[.)]\s*|[-*•✓▪–]\s*)/, "").trim());

  for (const line of lines) {
    if (out.length >= maxCards) break;
    if (isNoise(line)) continue;

    if (styles.has("image") && /\b(figure|diagram|table|histology|gross|microscopy|specimen|agar|gram stain|morphology)\b/i.test(line)) {
      const key = `img:${line.slice(0, 40).toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ noteType: "Basic", front: `Image occlusion: ${topic || "lecture figure"}`, back: `Occlude the key labels/findings from: ${line}`, tags: `${tag} image-occlusion` });
      continue;
    }

    const card = lineToCard(line, styles, noteType, tag);
    if (!card) continue;
    const key = (card.front + card.back).toLowerCase().replace(/\s+/g, " ").slice(0, 70);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(card);
  }
  return out;
}

function tagify(value: string): string {
  return value.trim().replace(/\s+/g, "::").replace(/[^\w:-]/g, "") || "Noctyrium";
}

function cardsToTsv(cards: DraftCard[], noteType: NoteType, customFields: string): string {
  const fields = customFields.split(",").map((f) => f.trim()).filter(Boolean);
  return cards.map((card) => {
    if (noteType === "Custom" && fields.length) {
      return fields.map((field) => {
        const key = field.toLowerCase();
        if (key.includes("front") || key.includes("text")) return cleanField(card.front);
        if (key.includes("back") || key.includes("extra")) return cleanField(card.back);
        if (key.includes("tag")) return cleanField(card.tags);
        if (key.includes("type")) return card.noteType;
        return "";
      }).join("\t");
    }
    if (card.noteType === "Cloze") return `${cleanField(card.front)}\t${cleanField(card.back)}\t${cleanField(card.tags)}`;
    return `${cleanField(card.front)}\t${cleanField(card.back)}\t${cleanField(card.tags)}`;
  }).join("\n");
}

/** Convert "Front : Back" / cloze lines into tab-separated Anki import text. */
function toTsv(text: string, system: string): string {
  const tag = tagify(system || "Noctyrium");
  return text.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
    const idx = line.indexOf(" : ");
    if (idx > -1) return `${cleanField(line.slice(0, idx))}\t${cleanField(line.slice(idx + 3))}\t${tag}`;
    return `${cleanField(line)}\t\t${tag}`; // cloze line
  }).join("\n");
}

function cleanField(value: string): string {
  return value.replace(/\t/g, " ").replace(/\s+/g, " ").trim();
}

function tsvToCsv(tsv: string): string {
  return tsv.split("\n").map((row) => row.split("\t").map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

import { useEffect, useState } from "react";
import {
  PlayCircle, Sparkles, BookOpen, FileText, ExternalLink, Check, Copy,
  Sunrise, NotebookPen, Timer, LineChart, BadgeCheck, Link2, Brain, ListChecks, Database, Layers,
  SlidersHorizontal,
} from "lucide-react";
import { useStore } from "../lib/store";
import { GlassCard, GButton, PanelHeader } from "../components/ui/primitives";

const BUG_EMAIL = "jdabbagh@sgu.edu";
const JD_WEBSITE = "https://www.jafardabbagh.com/";

const MASTER_GUIDE = [
  { icon: Sunrise, title: "Dashboard", body: "Where the day starts — set one intention, see the signal." },
  { icon: SlidersHorizontal, title: "Control Surface", body: "Subscribe to active sections, hide what is not in this rotation." },
  { icon: NotebookPen, title: "Standup", body: "State the truth: what now, what's blocking, what's next." },
  { icon: Timer, title: "Productivity", body: "Record effort — minutes and Anki cards, presets or ±10." },
  { icon: LineChart, title: "Reports", body: "See the pattern across today, the week, and the month." },
  { icon: BadgeCheck, title: "Course Tracker", body: "Map schoolwork: passes 1→4, Anki rounds, yield." },
  { icon: Link2, title: "Resources", body: "Your armory — ranked drives, references, and tools." },
  { icon: Layers, title: "Anki Lab", body: "Turn lectures, slides, and DLAs into card-building workflows." },
  { icon: Brain, title: "Boards", body: "Long-term review: install a big-picture Step blueprint." },
  { icon: ListChecks, title: "Tasks", body: "Capture obligations so they exist outside your head." },
  { icon: BookOpen, title: "Journal", body: "Reflect and reset — it began with your promise." },
  { icon: Database, title: "Backups", body: "Protect your data — download a backup before big changes." },
];

const ANKI_STEPS = [
  { img: "open-anki.png", title: "Open Anki", body: "Start from your main Anki deck screen." },
  { img: "manage-note-types.png", title: "Manage note types", body: "Go to Tools → Manage Note Types." },
  { img: "add-note-types.png", title: "Add or clone the note type", body: "Use Basic for Q&A cards, Cloze for cloze cards, or clone an existing JD card type." },
  { img: "fields.png", title: "Check fields", body: "Make sure fields match the CSV export: Front, Back, Tags, Source, and any optional image fields." },
  { img: "card-editor.png", title: "Paste templates / style", body: "Open Cards to paste or edit the front, back, and styling templates." },
  { img: "jd-anki-builds.png", title: "Find JD Anki Builds", body: "Use the JD Anki Builds folder for the card-style system and reference files." },
  { img: "importing.png", title: "Import CSV", body: "Go to File → Import, select your Noctyrium CSV, then map fields carefully." },
  { img: null, title: "Review before studying", body: "Open the Browser and inspect a few cards before adding them to daily reviews." },
];

const ANKI_SETTINGS = [
  ["New cards/day", "9999"], ["Maximum reviews/day", "9999"], ["Learning steps", "1m 10m 2d"],
  ["Graduating interval", "2 days"], ["Easy interval", "4 days"], ["Lapses relearning step", "3m"],
  ["Minimum interval", "1 day"], ["Leech threshold", "4 lapses"], ["Leech action", "Tag Only"],
  ["Answer timer max", "30s (shown, stops on answer)"], ["FSRS", "Off"], ["Maximum interval", "36500"],
  ["Starting ease", "2.00"], ["Easy bonus", "1.30"], ["Interval modifier", "1.00"],
  ["Hard interval", "1.20"], ["New interval", "0.30"],
];

const ADDONS = [
  { name: "Advanced Browser", id: "874215009", note: "Extra columns + search power in the card browser." },
  { name: "Anki Leaderboard", id: "175794613", note: "Friendly review streak competition — username JD7." },
  { name: "Anki Remote – Customize", id: "693153301", note: "Map a remote/controller to review answers." },
  { name: "Ankimon", id: "1908235722", note: "Light gamified motivation layer for reviews." },
  { name: "Review Heatmap", id: "1771074083", note: "A calendar heatmap of your review history." },
  { name: "Anki Terminator V2 (AI sidebar)", id: "1468920185", note: "ChatGPT / DeepSeek sidebar inside Anki." },
];

export function HelpPage() {
  const s = useStore();
  return (
    <>
      <GlassCard pad className="help-card">
        <PanelHeader title="Help" sub="A guided tour, a written field guide, the Anki import flow, and a direct line for feedback"
          action={<GButton size="sm" variant="primary" onClick={() => { s.updateProfile({ tourDone: false }); location.hash = "dashboard"; }}>
            <PlayCircle size={15} /> Replay guided tour
          </GButton>} />
        <div className="sub" style={{ marginTop: 2 }}>Replaying the tour ends with the promise again. Your data is never erased.</div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="Master guide" sub="The whole system, in a sentence each" />
        <div className="master-guide">
          {MASTER_GUIDE.map((g) => {
            const I = g.icon;
            return (
              <div className="guide-tile" key={g.title}>
                <span className="guide-tile-icon"><I size={18} /></span>
                <div><b>{g.title}</b><span>{g.body}</span></div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="Importing Noctyrium cards into Anki" sub="Eight steps, from your generated CSV to graded reviews"
          action={<a className="gbtn sm" href="https://drive.google.com/drive/folders/19_3nrTD66v_oCIKlruFVidirdCAIe8yp?usp=sharing" target="_blank" rel="noreferrer noopener"><Layers size={14} /> JD Anki Builds</a>} />
        <div className="anki-steps">
          {ANKI_STEPS.map((step, i) => (
            <div className="anki-step" key={step.title}>
              <div className="anki-step-head"><span className="anki-step-n">{i + 1}</span> <b>{step.title}</b></div>
              {step.img && <img className="anki-shot" src={`./anki-guide/${step.img}`} alt={step.title} loading="lazy" />}
              <div className="anki-step-body">{step.body}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="Optimized Anki settings (no FSRS)" sub="Based on the included Anki settings PDF — tuned for high-volume med-school review"
          action={<a className="gbtn sm" href="./anki-guide/my-anki-settings.pdf" target="_blank" rel="noreferrer noopener"><FileText size={14} /> Open settings PDF</a>} />
        <div className="settings-grid">
          {ANKI_SETTINGS.map(([k, v]) => (
            <div className="setting-row" key={k}><span>{k}</span><b>{v}</b></div>
          ))}
        </div>
        <div className="sub" style={{ marginTop: 10 }}>These are starting points, not gospel — adjust once you know your own retention. FSRS is intentionally off for this setup.</div>
      </GlassCard>

      <GlassCard pad>
        <PanelHeader title="Recommended Anki add-ons" sub="Useful, optional — install from Tools → Add-ons → Get Add-ons with the code" />
        <div className="addon-grid">
          {ADDONS.map((a) => (
            <a key={a.id} className="addon-tile" href={`https://ankiweb.net/shared/info/${a.id}`} target="_blank" rel="noreferrer noopener">
              <div className="grow"><b>{a.name}</b><span>{a.note}</span></div>
              <span className="addon-code mono">{a.id}</span>
              <ExternalLink size={13} />
            </a>
          ))}
        </div>
      </GlassCard>

      <WebsitePreview />

      <FeedbackForm />
    </>
  );
}

function WebsitePreview() {
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setRefreshKey((key) => key + 1), 30 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <GlassCard pad className="website-preview-card">
      <PanelHeader title="JD’s website" sub="Live preview refreshes every 30 minutes"
        action={<a className="gbtn sm" href={JD_WEBSITE} target="_blank" rel="noreferrer noopener">
          Open site <ExternalLink size={13} />
        </a>} />
      <div className="website-frame-shell">
        <iframe key={refreshKey} title="Jafar Dabbagh website" src={JD_WEBSITE} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
      <div className="sub" style={{ marginTop: 8 }}>If the browser blocks embedding, use Open site; the refresh timer still keeps the iframe attempt current.</div>
    </GlassCard>
  );
}

function FeedbackForm() {
  const s = useStore();
  const [type, setType] = useState("Bug");
  const [area, setArea] = useState("Dashboard");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "fallback" | "copied">("idle");

  function reportText() {
    return [
      `Type: ${type}`, `Area: ${area}`, "", message, "",
      `— App: ${s.profile.versionLabel}`, `Time: ${new Date().toISOString()}`,
      `Browser: ${typeof navigator !== "undefined" ? navigator.userAgent : "n/a"}`,
      email ? `Contact: ${email}` : "",
    ].filter(Boolean).join("\n");
  }

  async function submit() {
    if (!message.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, area, message, email, version: s.profile.versionLabel, ua: navigator.userAgent }),
      });
      if (res.ok) { setState("sent"); setMessage(""); return; }
      setState("fallback"); // route exists but not configured (e.g. 501)
    } catch {
      setState("fallback"); // no backend / offline
    }
  }

  function copyReport() {
    navigator.clipboard?.writeText(reportText());
    setState("copied");
  }

  return (
    <GlassCard pad className="feedback-card">
      <PanelHeader title="Suggest a feature · report a bug"
        sub="Alpha 1 grows from your feedback. Send bugs, confusing moments, or feature ideas so Noctyrium gets sharper with every release." />
      {state === "sent" ? (
        <div className="feedback-done"><Check size={18} /> Sent. Thank you for helping improve Noctyrium.</div>
      ) : (
        <>
          <div className="row gap12 wrap">
            <label className="stack gap6">
              <span className="field-label">Type</span>
              <select className="field" aria-label="Feedback type" value={type} onChange={(e) => setType(e.target.value)}>
                {["Bug", "Feature", "Confusion", "Praise"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="stack gap6">
              <span className="field-label">Page or feature</span>
              <select className="field" aria-label="Area" value={area} onChange={(e) => setArea(e.target.value)}>
                {["Dashboard", "Standup", "Productivity", "Reports", "Course Tracker", "Anki Lab", "Resources", "Boards", "Tasks", "Journal", "Onboarding / Tour", "Other"].map((a) => <option key={a}>{a}</option>)}
              </select>
            </label>
            <label className="stack gap6 grow">
              <span className="field-label">Your email (optional)</span>
              <input className="field" type="email" placeholder="so we can follow up" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>
          <label className="stack gap6" style={{ marginTop: 12 }}>
            <span className="field-label">Message</span>
            <textarea className="field" rows={4} placeholder="What happened, what confused you, or what you'd love to see…" value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <div className="row gap8" style={{ marginTop: 12 }}>
            <GButton variant="primary" disabled={!message.trim() || state === "sending"} onClick={submit}>
              {state === "sending" ? "Sending…" : "Send feedback"}
            </GButton>
            {(state === "fallback" || state === "copied") && (
              <GButton onClick={copyReport}>{state === "copied" ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy report</>}</GButton>
            )}
          </div>
          {(state === "fallback" || state === "copied") && (
            <div className="feedback-fallback">
              <Sparkles size={14} /> Feedback sending isn't configured on this build yet. Copy your report and send it to <b>{BUG_EMAIL}</b>.
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}

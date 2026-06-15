import { useEffect, useState } from "react";
import { useStore } from "../../lib/store";

// The contract lines, revealed one by one.
const LINES = [
  "Noctyrium is just a tool.",
  "It will not study for you.",
  "It will not make you a doctor.",
  "Only you can do that.",
  "So before you go further —",
  "make a promise to yourself.",
];

const LINE_MS = 950;

export function PromiseCutscene({ onDone }: { onDone: () => void }) {
  const store = useStore();
  const [stage, setStage] = useState<"reveal" | "sign" | "sealed">("reveal");
  const [shown, setShown] = useState(0);
  const [name, setName] = useState(store.profile.name && store.profile.name !== "Noctyrium" ? store.profile.name : "");
  const [agreed, setAgreed] = useState(false);

  // reveal lines, then show the signing panel
  useEffect(() => {
    if (stage !== "reveal") return;
    if (shown < LINES.length) {
      const t = setTimeout(() => setShown((n) => n + 1), LINE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage("sign"), 700);
    return () => clearTimeout(t);
  }, [stage, shown]);

  function sign() {
    if (!name.trim() || !agreed) return;
    const signedAt = new Date().toISOString();
    store.updateProfile({ name: name.trim(), promise: { signedName: name.trim(), signedAt } });
    // The first journal entry is always the promise.
    store.addJournal({
      date: signedAt,
      today: `I promise to make something of myself. — ${name.trim()}`,
      tomorrow: "Show up. Use the tool. Don't break the chain.",
      blockers: "",
      energy: "High",
      rating: "Promise",
    });
    setStage("sealed");
    setTimeout(onDone, 2800);
  }

  return (
    <div className="promise-scrim">
      <div className="promise-orbs"><i /><i /><i /></div>

      {stage !== "sealed" ? (
        <div className={`promise-paper ${stage === "sign" ? "open" : ""}`}>
          <div className="promise-seal-mark">N</div>
          <div className="promise-heading">A promise to yourself</div>
          <div className="promise-lines">
            {LINES.map((line, idx) => (
              <p key={line} className={`promise-line ${idx < shown ? "in" : ""} ${idx === LINES.length - 1 ? "accent" : ""}`}>{line}</p>
            ))}
          </div>

          {stage === "sign" && (
            <div className="promise-sign">
              <label className="promise-field">
                <span>Sign your name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus />
              </label>
              <label className="promise-check">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>I promise to make something of myself.</span>
              </label>
              <button type="button" className="promise-btn" disabled={!name.trim() || !agreed} onClick={sign}>
                Sign &amp; begin
              </button>
              <button type="button" className="promise-defer" onClick={onDone}>Maybe later</button>
            </div>
          )}
        </div>
      ) : (
        <div className="promise-sealed">
          <div className="promise-sealed-ring"><span>N</span></div>
          <div className="promise-sealed-title">Promise made.</div>
          <div className="promise-sealed-name">— {name.trim()}</div>
          <div className="promise-sealed-sub">Now go make something of it.</div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useStore } from "../../lib/store";

const PROMISE_TEXT_VERSION = "promise-of-use-v1";

// The contract lines, revealed one by one.
const LINES = [
  "This is only a tool.",
  "It will not save you.",
  "It will not study for you.",
  "It will not become disciplined on your behalf.",
  "But if you return to it honestly,",
  "if you record the work,",
  "if you confront the missed days,",
  "if you build again after falling behind,",
  "then this becomes more than software.",
  "It becomes a witness.",
];

const LINE_MS = 760;

export function PromiseCutscene({ onDone }: { onDone: () => void }) {
  const store = useStore();
  const [stage, setStage] = useState<"reveal" | "sign" | "sealed">("reveal");
  const [shown, setShown] = useState(0);
  const [name, setName] = useState(store.profile.name && store.profile.name !== "Noctyrium" ? store.profile.name : "");
  const [agreed, setAgreed] = useState(false);
  const scrimRef = useRef<HTMLDivElement>(null);

  // After signing, the signing panel leaves the user scrolled to the bottom of
  // the contract. Pull the view back to the top so the sealed confirmation is
  // actually visible instead of off-screen below the fold.
  useEffect(() => {
    if (stage !== "sealed") return;
    scrimRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage]);

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
    const journalEntryId = crypto.randomUUID();
    store.updateProfile({
      name: name.trim(),
      promise: { signedName: name.trim(), signedAt, promiseTextVersion: PROMISE_TEXT_VERSION, journalEntryId },
    });
    // The first journal entry is always the promise.
    store.addJournal({
      id: journalEntryId,
      date: signedAt,
      today: `Promise of Use signed by ${name.trim()}.`,
      tomorrow: "Return honestly. Record the work. Build again after missed days.",
      blockers: "",
      energy: "High",
      rating: "Promise",
    });
    setStage("sealed");
    setTimeout(onDone, 2800);
  }

  return (
    <div className={`promise-scrim ${stage === "sealed" ? "sealed" : ""}`} ref={scrimRef}>
      <div className="promise-orbs"><i /><i /><i /></div>

      {stage !== "sealed" ? (
        <div className={`promise-paper ${stage === "sign" ? "open" : ""}`}>
          <div className="promise-seal-mark">N</div>
          <div className="promise-heading">Promise of Use</div>
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
              <div className="promise-oath">
                <p>I promise to use this system as a place of return.</p>
                <p>I promise to build with clarity instead of chaos.</p>
                <p>I promise to become responsible for the life I say I want.</p>
                <small>I make this promise to myself.</small>
              </div>
              <label className="promise-check">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>I make this promise to myself.</span>
              </label>
              <button type="button" className="promise-btn" disabled={!name.trim() || !agreed} onClick={sign}>
                Sign the promise
              </button>
              <button type="button" className="promise-defer" onClick={onDone}>Maybe later</button>
            </div>
          )}
        </div>
      ) : (
        <div className="promise-sealed">
          <div className="promise-sealed-ring"><img src="./icon-192.png" alt="Noctyrium" /></div>
          <div className="promise-sealed-title">Promise made.</div>
          <div className="promise-sealed-name">Contract signed. — {name.trim()}</div>
          <div className="promise-sealed-sub">Begin.</div>
        </div>
      )}
    </div>
  );
}

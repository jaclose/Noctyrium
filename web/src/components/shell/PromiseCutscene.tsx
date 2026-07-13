import { useEffect, useId, useRef, useState } from "react";
import { useStore } from "../../lib/store";
import { prefersReducedMotion } from "../../lib/motion";
import { AxomWordmark } from "../ui/BrandMark";

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
  const reduceMotion = useRef(prefersReducedMotion()).current;
  const [stage, setStage] = useState<"reveal" | "sign" | "sealed">(reduceMotion ? "sign" : "reveal");
  const [shown, setShown] = useState(reduceMotion ? LINES.length : 0);
  const [name, setName] = useState(store.profile.name && !/^(axom|noctyrium)$/i.test(store.profile.name) ? store.profile.name : "");
  const [agreed, setAgreed] = useState(false);
  const scrimRef = useRef<HTMLDivElement>(null);
  const doneTimerRef = useRef<number | null>(null);
  const onDoneRef = useRef(onDone);
  const titleId = useId();

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrim = scrimRef.current;
    scrim?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (!scrim || stage === "sealed") return;
      if (event.key === "Escape") {
        event.preventDefault();
        onDoneRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = [...scrim.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!controls.length) {
        event.preventDefault();
        scrim.focus();
        return;
      }
      const first = controls[0];
      const last = controls.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || !scrim.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previous?.isConnected) previous.focus();
    };
  }, [stage]);

  useEffect(() => () => {
    if (doneTimerRef.current !== null) window.clearTimeout(doneTimerRef.current);
  }, []);

  // After signing, the signing panel leaves the user scrolled to the bottom of
  // the contract. Pull the view back to the top so the sealed confirmation is
  // actually visible instead of off-screen below the fold.
  useEffect(() => {
    if (stage !== "sealed") return;
    const behavior = reduceMotion ? "auto" : "smooth";
    scrimRef.current?.scrollTo({ top: 0, behavior });
    window.scrollTo({ top: 0, behavior });
  }, [reduceMotion, stage]);

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
    doneTimerRef.current = window.setTimeout(() => onDoneRef.current(), reduceMotion ? 0 : 1100);
  }

  return (
    <div
      className={`promise-scrim ${stage === "sealed" ? "sealed" : ""}`}
      ref={scrimRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <div className="promise-orbs"><i /><i /><i /></div>

      {stage !== "sealed" ? (
        <div className={`promise-paper ${stage === "sign" ? "open" : ""}`}>
          <header className="promise-contract-header">
            <AxomWordmark size="lg" />
            <span>A personal checkpoint</span>
            <h2 id={titleId}>A promise to yourself</h2>
            <p>A voluntary commitment to how you want to return to your work. This is not a legal contract.</p>
          </header>
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
              <details className="promise-oath" open>
                <summary>What I am promising</summary>
                <div>
                  <p>I promise to use this system as a place of return.</p>
                  <p>I promise to build with clarity instead of chaos.</p>
                  <p>I promise to become responsible for the life I say I want.</p>
                  <small>I make this promise to myself.</small>
                </div>
              </details>
              <label className="promise-check">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>I make this promise to myself.</span>
              </label>
              <button type="button" className="promise-btn" disabled={!name.trim() || !agreed} onClick={sign}>
                Sign the promise
              </button>
              <button type="button" className="promise-defer" onClick={() => onDoneRef.current()}>Maybe later</button>
            </div>
          )}
        </div>
      ) : (
        <div className="promise-sealed">
          <AxomWordmark size="hero" className="promise-sealed-wordmark" />
          <div className="promise-sealed-title" id={titleId}>Promise made.</div>
          <div className="promise-sealed-signature" aria-label={`Signed by ${name.trim()}`}>
            <span>{name.trim()}</span>
            <svg viewBox="0 0 260 22" aria-hidden="true" focusable="false"><path d="M4 15c35-10 67-8 98-3 35 6 66 7 96-1 21-5 39-5 58-1" /></svg>
          </div>
          <div className="promise-sealed-sub">Saved to your local AXOM profile. Continue when you’re ready.</div>
        </div>
      )}
    </div>
  );
}

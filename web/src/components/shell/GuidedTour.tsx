import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X, Sparkles } from "lucide-react";
import { PromiseCutscene } from "./PromiseCutscene";

interface TourStep {
  route: string;
  target?: string; // data-tour value to spotlight; absent = centered card
  title: string;
  body: string;
  cta?: string;
}

// The basics, in order. Each step navigates to its page, spotlights a real
// element, and explains it. The final step hands off to the promise cutscene.
const STEPS: TourStep[] = [
  { route: "dashboard", title: "Welcome to Noctyrium.", body: "This is not another planner. It is a system for remembering what you said mattered.", cta: "Begin the tour" },
  { route: "dashboard", target: "intention", title: "Intention", body: "Your dashboard is the command center — the day, the work, and the signal beneath the noise. Start with one honest intention." },
  { route: "dashboard", target: "schedule", title: "The day, mapped", body: "This is your rhythm across the month. Effort here is evidence, not mythology. Let's see where it gets recorded." },
  { route: "productivity", target: "log", title: "Record effort", body: "Effort counts when it is recorded. Log minutes and Anki cards — use −/+ or a preset to land an accurate number, then Log." },
  { route: "productivity", target: "insights", title: "See the pattern", body: "Reports turn scattered effort into evidence. When you forget how much you've done, this remembers." },
  { route: "reports", target: "reports-top", title: "Reports", body: "Today, the week, course distribution, and trend — the traceable record of the work." },
  { route: "tracker", target: "import", title: "Map the schoolwork", body: "Course Tracker is where lectures stop floating in chaos and become a map. Import a list, or add a course manually." },
  { route: "tracker", target: "tracker-help", title: "Keep the spine clean", body: "Tap a pass (1→4), cycle Anki rounds, set each item's yield. The ? button explains the colors. This is the spine of the system." },
  { route: "resources", target: "resources", title: "Your armory", body: "Resources are external knowledge — ranked, named, kept close. The best tools, within reach." },
  { route: "step", target: "step", title: "The long war room", body: "Step 1 is the long game. Build slowly. Review honestly. Return often." },
  { route: "tasks", target: "tasks", title: "Promises with handles", body: "Tasks are not wishes. Capture one and it exists outside your head. Now — the first journal entry is different." },
];

const PAD = 8;

export function GuidedTour({ onExit }: { onExit: () => void }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"tour" | "promise">("tour");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const step = STEPS[i];

  // Navigate to the step's page, then keep re-measuring the target as the page
  // renders and smooth-scrolls into view. Re-measuring (not a single snapshot)
  // is what stops the tooltip from landing off-screen on the first cross-page
  // step — the Next button stays reachable the whole time.
  useEffect(() => {
    if (phase !== "tour") return;
    if (location.hash.replace("#", "") !== step.route) location.hash = step.route;

    setReady(false);
    setRect(null);
    if (!step.target) { setReady(true); return; }

    let cancelled = false;
    let scrolled = false;
    const tick = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      if (!el) return;
      if (!scrolled) { el.scrollIntoView({ block: "center", behavior: "smooth" }); scrolled = true; }
      const r = el.getBoundingClientRect();
      if (r.height > 0) { setRect(r); setReady(true); }
    };

    tick();
    // poll while the page renders + the smooth scroll settles
    const start = Date.now();
    const interval = window.setInterval(() => {
      tick();
      if (Date.now() - start > 2000) window.clearInterval(interval);
    }, 90);
    // if the target never shows, fall back to the centered card (Next still works)
    const grace = window.setTimeout(() => { if (!cancelled) setReady(true); }, 750);
    const onMove = () => tick();
    window.addEventListener("resize", onMove, true);
    window.addEventListener("scroll", onMove, true);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(grace);
      window.removeEventListener("resize", onMove, true);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [i, phase, step.route, step.target]);

  function next() { if (i < STEPS.length - 1) setI(i + 1); else setPhase("promise"); }
  function back() { if (i > 0) setI(i - 1); }

  if (phase === "promise") return <PromiseCutscene onDone={onExit} />;

  // Only spotlight when the target is actually on-screen; otherwise show a
  // centered card so the controls are always reachable.
  const onScreen = !!rect && rect.bottom > 48 && rect.top < window.innerHeight - 48 && rect.height > 0;
  const hasSpot = ready && onScreen;
  const total = STEPS.length;

  // tooltip placement: below the target if room, else above; centered otherwise
  const tip = tooltipStyle(rect);

  return (
    <div className="tour-overlay">
      {hasSpot ? <Spotlight rect={rect!} /> : <div className="tour-haze" />}

      {hasSpot && <div className="tour-ring" style={ringStyle(rect!)} />}

      <div className={`tour-tip ${hasSpot ? "" : "centered"}`} style={tip}>
        <div className="tour-tip-head">
          <span className="tour-step-badge"><Sparkles size={12} /> {i + 1} / {total}</span>
          <button type="button" className="tour-skip" onClick={() => setPhase("promise")}>Skip <X size={13} /></button>
        </div>
        <div className="tour-tip-title">{step.title}</div>
        <div className="tour-tip-body">{step.body}</div>
        <div className="tour-tip-actions">
          {i > 0 ? <button type="button" className="gbtn sm" onClick={back}><ArrowLeft size={14} /> Back</button> : <span />}
          <button type="button" className="gbtn sm primary" onClick={next}>
            {i === total - 1 ? "Make the promise" : step.cta ?? "Next"} <ArrowRight size={14} />
          </button>
        </div>
        <div className="tour-progress"><span style={{ width: `${((i + 1) / total) * 100}%` }} /></div>
      </div>
    </div>
  );
}

// Four dark panels around the target → the target stays visible (and clickable).
function Spotlight({ rect }: { rect: DOMRect }) {
  const t = Math.max(0, rect.top - PAD);
  const l = Math.max(0, rect.left - PAD);
  const r = rect.right + PAD;
  const b = rect.bottom + PAD;
  return (
    <>
      <div className="tour-panel" style={{ top: 0, left: 0, right: 0, height: t }} />
      <div className="tour-panel" style={{ top: b, left: 0, right: 0, bottom: 0 }} />
      <div className="tour-panel" style={{ top: t, left: 0, width: l, height: b - t }} />
      <div className="tour-panel" style={{ top: t, left: r, right: 0, height: b - t }} />
    </>
  );
}

function ringStyle(rect: DOMRect): React.CSSProperties {
  return {
    top: rect.top - PAD, left: rect.left - PAD,
    width: rect.width + PAD * 2, height: rect.height + PAD * 2,
  };
}

function tooltipStyle(rect: DOMRect | null): React.CSSProperties {
  // No usable rect → return nothing so the `.centered` class positions it.
  const onScreen = !!rect && rect.bottom > 48 && rect.top < window.innerHeight - 48;
  if (!rect || !onScreen) return {};
  const tipW = 340;
  const tipH = 230; // approximate; used to keep the card fully on-screen
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - tipW - 12);
  const roomBelow = window.innerHeight - rect.bottom > tipH + 24;
  // place below if there's room, else above; then clamp to the viewport either way
  let top = roomBelow ? rect.bottom + 14 : rect.top - 14 - tipH;
  top = Math.min(Math.max(12, top), window.innerHeight - tipH - 12);
  return { top, left };
}

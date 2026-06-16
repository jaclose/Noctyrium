import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  { route: "dashboard", title: "Welcome to the cockpit", body: "A 60-second tour of the basics. I'll spotlight each piece, then end with one thing only you can do.", cta: "Show me" },
  { route: "dashboard", target: "intention", title: "Win the day", body: "Start every morning here: set one intention — what would make today a win? It's your daily standup, and you'll close it out tonight." },
  { route: "dashboard", target: "schedule", title: "Your schedule", body: "This calendar is your study rhythm. Tap it any time to jump into Productivity — let's head there now." },
  { route: "productivity", target: "log", title: "Log your effort", body: "Log minutes and Anki cards. Use the −/+ buttons to nudge by 10 for an accurate count, then press Log. Quick buttons above cover common blocks." },
  { route: "productivity", target: "insights", title: "It reads your effort back", body: "Noctyrium turns your logs into weekly + monthly intelligence — strong days, fragile days, and exactly what to shore up." },
  { route: "reports", target: "reports-top", title: "Everything rolls up", body: "Reports is your traceable record: study time, mastery, tasks, and standups in one place." },
  { route: "tracker", target: "import", title: "Build your tracker", body: "Add courses and import your lectures by name. The destination autocompletes existing folders, so you never spawn duplicates." },
  { route: "tracker", target: "tracker-help", title: "Passes, Anki & yield", body: "Tap a pass box (1→4) as you study, cycle Anki rounds, and set each item's yield. The Help button explains the colors any time — try it on the example items." },
  { route: "resources", target: "resources", title: "Resources & drives", body: "Your saved links live here, plus the curated SGU drives — rated by personal usefulness, sorted best-first." },
  { route: "step", target: "step", title: "When boards come", body: "Use broad Step, Shelf, MCAT, or CBSE blueprint logging first. Add detail only when the big domains reveal what needs work." },
  { route: "tasks", target: "tasks", title: "Capture the work", body: "Tasks hold what needs doing. Finish one and it archives itself. Now — one last thing, and it's the most important." },
];

const PAD = 8;

export function GuidedTour({ onExit }: { onExit: () => void }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"tour" | "promise">("tour");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const measureRef = useRef<() => void>(() => {});
  const step = STEPS[i];

  // navigate to the step's page
  useEffect(() => {
    if (phase !== "tour") return;
    if (location.hash.replace("#", "") !== step.route) location.hash = step.route;
  }, [i, phase, step.route]);

  // measure the spotlight target (retry while the page renders/scrolls)
  useLayoutEffect(() => {
    if (phase !== "tour") return;
    let raf = 0;
    let tries = 0;
    setReady(false);
    const measure = () => {
      if (!step.target) { setRect(null); setReady(true); return; }
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.height > 0) { setRect(r); setReady(true); return; }
      }
      if (tries++ < 40) raf = requestAnimationFrame(measure);
      else { setRect(null); setReady(true); }
    };
    measureRef.current = measure;
    // let the route switch + scroll settle, then measure
    const el = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(measure, 380);
    const onResize = () => measure();
    window.addEventListener("resize", onResize, true);
    window.addEventListener("scroll", onResize, true);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize, true);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [i, phase, step.route, step.target]);

  function next() { if (i < STEPS.length - 1) setI(i + 1); else setPhase("promise"); }
  function back() { if (i > 0) setI(i - 1); }

  if (phase === "promise") return <PromiseCutscene onDone={onExit} />;

  const hasSpot = ready && rect;
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
            {i === total - 1 ? "The last step" : step.cta ?? "Next"} <ArrowRight size={14} />
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
  if (!rect) return {};
  const tipW = 340;
  const below = rect.bottom + 14;
  const room = window.innerHeight - rect.bottom > 220;
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - tipW - 12);
  return room
    ? { top: below, left }
    : { top: Math.max(12, rect.top - 14), left, transform: "translateY(-100%)" };
}

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
import { prefersReducedMotion } from "../../lib/motion";
import {
  clearTourProgress,
  readTourStep,
  writeTourStep,
} from "../../lib/onboardingProgress";

export interface TourStep {
  route: string;
  target?: string;
  title: string;
  body: string;
}

export const GUIDED_TOUR_STEPS: readonly TourStep[] = [
  {
    route: "dashboard",
    target: "command-brief",
    title: "Today’s plan",
    body: "The Command Brief turns current work into one next move. It explains why the move is suggested, and nothing changes until you choose an action.",
  },
  {
    route: "tracker",
    target: "import",
    title: "Course Tracker",
    body: "Map courses, modules, and study passes here. Import a list or add work manually, then keep the map current as you study.",
  },
  {
    route: "questions",
    target: "question-bank-entry",
    title: "Question Bank",
    body: "Import → Review → Practice → Understand. Bring in a source, verify uncertain mappings, practise the finalized set, and let the results surface what needs work.",
  },
  {
    route: "dashboard",
    target: "recommendation-provenance",
    title: "Why AXOM suggested this",
    body: "Recommendation details show the trigger, source data, threshold, result, and available override. AXOM calculations remain separate from optional AI wording.",
  },
  {
    route: "reports",
    target: "reports-top",
    title: "Reports",
    body: "Use reports to review today, the week, course distribution, and longer trends from the work you recorded.",
  },
  {
    route: "dashboard",
    target: "control-surface-menu",
    title: "Customize",
    body: "Use Customize to keep current workflows visible and return unused sections to the library. You can restore them at any time.",
  },
  {
    route: "dashboard",
    title: "Data safety",
    body: "Your workspace stays on this device. Open Settings → Data and Backup to review storage health, local recovery snapshots, or export a portable backup.",
  },
] as const;

const PAD = 8;

export function GuidedTour({
  onExit, onNavigate, currentRoute,
}: {
  onExit: () => void;
  onNavigate: (route: string) => void;
  currentRoute: string;
}) {
  const [index, setIndex] = useState(() => readTourStep(GUIDED_TOUR_STEPS.length));
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef(onExit);
  const navigateRef = useRef(onNavigate);
  const titleId = useId();
  const bodyId = useId();
  const step = GUIDED_TOUR_STEPS[index];

  useEffect(() => { exitRef.current = onExit; }, [onExit]);
  useEffect(() => { navigateRef.current = onNavigate; }, [onNavigate]);
  useEffect(() => writeTourStep(index), [index]);

  const exitTour = useCallback(() => {
    clearTourProgress();
    exitRef.current();
  }, []);

  useEffect(() => {
    if (currentRoute !== step.route) {
      navigateRef.current(step.route);
      return;
    }

    setReady(false);
    setRect(null);
    if (!step.target) {
      setReady(true);
      return;
    }

    let cancelled = false;
    let scrolled = false;
    const tick = () => {
      if (cancelled) return;
      const element = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      if (!element) return;
      if (!scrolled) {
        element.scrollIntoView?.({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
        scrolled = true;
      }
      const nextRect = element.getBoundingClientRect();
      if (nextRect.height > 0) {
        setRect(nextRect);
        setReady(true);
      }
    };

    tick();
    const start = Date.now();
    const interval = window.setInterval(() => {
      tick();
      if (Date.now() - start > 2000) window.clearInterval(interval);
    }, 90);
    const grace = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 750);
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
  }, [currentRoute, index, step.route, step.target]);

  useEffect(() => {
    tipRef.current?.focus();
  }, [index]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => {
      const tip = tipRef.current;
      if (!tip) return;
      if (event.key === "Escape") {
        event.preventDefault();
        exitTour();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = focusableElements(tip);
      if (focusable.length === 0) {
        event.preventDefault();
        tip.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !tip.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [exitTour]);

  function next() {
    if (index < GUIDED_TOUR_STEPS.length - 1) setIndex(index + 1);
    else exitTour();
  }

  function back() {
    if (index > 0) setIndex(index - 1);
  }

  const onScreen = !!rect && rect.bottom > 48 && rect.top < window.innerHeight - 48 && rect.height > 0;
  const hasSpotlight = ready && onScreen;
  const tooltip = tooltipStyle(rect);

  return (
    <div className="tour-overlay">
      {hasSpotlight ? <Spotlight rect={rect!} /> : <div className="tour-haze" aria-hidden="true" />}
      {hasSpotlight && <div className="tour-ring" style={ringStyle(rect!)} aria-hidden="true" />}

      <div
        ref={tipRef}
        className={`tour-tip ${hasSpotlight ? "" : "centered"}`}
        style={tooltip}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
      >
        <div className="tour-tip-head">
          <span className="tour-step-badge"><Sparkles size={12} aria-hidden="true" /> {index + 1} / {GUIDED_TOUR_STEPS.length}</span>
          <button type="button" className="tour-skip" onClick={exitTour} aria-label="Skip guided tour">
            Skip <X size={13} aria-hidden="true" />
          </button>
        </div>
        <div className="tour-tip-title" id={titleId}>{step.title}</div>
        <div className="tour-tip-body" id={bodyId}>{step.body}</div>
        <div className="tour-tip-actions">
          {index > 0
            ? <button type="button" className="gbtn sm" onClick={back}><ArrowLeft size={14} /> Back</button>
            : <span aria-hidden="true" />}
          <button type="button" className="gbtn sm primary" onClick={next}>
            {index === GUIDED_TOUR_STEPS.length - 1 ? "Finish" : "Next"} <ArrowRight size={14} />
          </button>
        </div>
        <div
          className="tour-progress"
          role="progressbar"
          aria-label="Guided tour progress"
          aria-valuemin={1}
          aria-valuemax={GUIDED_TOUR_STEPS.length}
          aria-valuenow={index + 1}
        >
          <span style={{ width: `${((index + 1) / GUIDED_TOUR_STEPS.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function Spotlight({ rect }: { rect: DOMRect }) {
  const top = Math.max(0, rect.top - PAD);
  const left = Math.max(0, rect.left - PAD);
  const right = rect.right + PAD;
  const bottom = rect.bottom + PAD;
  return (
    <>
      <div className="tour-panel" style={{ top: 0, left: 0, right: 0, height: top }} aria-hidden="true" />
      <div className="tour-panel" style={{ top: bottom, left: 0, right: 0, bottom: 0 }} aria-hidden="true" />
      <div className="tour-panel" style={{ top, left: 0, width: left, height: bottom - top }} aria-hidden="true" />
      <div className="tour-panel" style={{ top, left: right, right: 0, height: bottom - top }} aria-hidden="true" />
    </>
  );
}

function ringStyle(rect: DOMRect): React.CSSProperties {
  return {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
}

function tooltipStyle(rect: DOMRect | null): React.CSSProperties {
  const onScreen = !!rect && rect.bottom > 48 && rect.top < window.innerHeight - 48;
  if (!rect || !onScreen) return {};
  const tipWidth = 340;
  const tipHeight = 230;
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - tipWidth - 12);
  const roomBelow = window.innerHeight - rect.bottom > tipHeight + 24;
  let top = roomBelow ? rect.bottom + 14 : rect.top - 14 - tipHeight;
  top = Math.min(Math.max(12, top), window.innerHeight - tipHeight - 12);
  return { top, left };
}

function focusableElements(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
}

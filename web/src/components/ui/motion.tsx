// Shared visual-motion components (directive §2). All respect prefers-reduced-
// motion via useReducedMotion + the motion.css media query, and prefer cheap
// CSS transforms/opacity/gradients over heavy dependencies.
import type { ReactNode, CSSProperties } from "react";
import { Flame } from "lucide-react";
import { MOTION_TOKENS, pct, resolveDuration, useReducedMotion, useScrollProgress } from "../../lib/motion";

export type MotionTone = "cyan" | "green" | "orange" | "red" | "violet";
export type StatusKind = "strong" | "missed" | "active" | "idle";

/** A progress bar whose fill animates like liquid rising to the target. */
export function AnimatedProgressBar({
  value,
  max = 100,
  tone = "cyan",
  label,
  className = "",
  glow = false,
}: {
  value: number;
  max?: number;
  tone?: MotionTone;
  label?: string;
  className?: string;
  glow?: boolean;
}) {
  const reduced = useReducedMotion();
  const percent = pct(value, max);
  const duration = resolveDuration(MOTION_TOKENS.durationSlow, reduced);
  return (
    <div
      className={`nm-progress ${glow ? "glow" : ""} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "progress"}
    >
      <span
        className={`nm-progress-fill tone-${tone}`}
        style={{ width: `${percent}%`, transitionDuration: `${duration}ms` }}
      />
      {label && <span className="nm-progress-label">{label}</span>}
    </div>
  );
}

/** A standalone fluid fill surface (e.g. a daily-floor gauge). */
export function FluidFill({
  pct: percent,
  tone = "cyan",
  height = 14,
  label,
}: {
  pct: number;
  tone?: MotionTone;
  height?: number;
  label?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={`nm-fluid ${reduced ? "reduced" : ""}`} style={{ height }}>
      <span className={`nm-fluid-fill tone-${tone}`} style={{ width: `${clamped}%` }} />
      {label != null && <span className="nm-fluid-label">{label}</span>}
    </div>
  );
}

/** An ember/flame indicator that scales with a streak count. Static when reduced. */
export function StreakEmber({ count, size = 15 }: { count: number; size?: number }) {
  const lit = count > 0;
  const heat = Math.min(3, Math.ceil(count / 7)); // ramps the glow every ~week
  return (
    <span className={`nm-ember ${lit ? "lit" : ""} heat-${heat}`} title={`${count} day streak`}>
      <Flame size={size} />
      <b>{count}</b>
    </span>
  );
}

/** A wrapper whose border reflects day status: strong / missed / active / idle. */
export function StatusBorder({
  status,
  children,
  className = "",
  style,
}: {
  status: StatusKind;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={`nm-status-border status-${status} ${className}`} style={style}>{children}</div>;
}

/** A focus-glow wrapper — pulses softly while `active`. */
export function FocusGlow({ active, children, className = "" }: { active: boolean; children: ReactNode; className?: string }) {
  return <div className={`nm-focus-glow ${active ? "active" : ""} ${className}`}>{children}</div>;
}

/**
 * A surface that drifts subtly as it scrolls through the viewport (parallax).
 * Disabled entirely under reduced motion (translate stays 0).
 */
export function ScrollReactiveSurface({
  children,
  intensity = 14,
  className = "",
}: {
  children: ReactNode;
  intensity?: number;
  className?: string;
}) {
  const { ref, progress, reduced } = useScrollProgress<HTMLDivElement>();
  const offset = reduced ? 0 : (progress - 0.5) * intensity;
  return (
    <div
      ref={ref}
      className={`nm-scroll-surface ${className}`}
      style={{ transform: `translate3d(0, ${offset.toFixed(2)}px, 0)` }}
    >
      {children}
    </div>
  );
}

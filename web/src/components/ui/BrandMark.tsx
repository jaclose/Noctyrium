// ===========================================================================
// AXOM brand primitives. The official angular mark remains a tintable SVG so
// it stays crisp in compact navigation, high-density displays, and print.
// ===========================================================================

export type AxomWordmarkSize = "sm" | "md" | "lg" | "hero";
export type AxomMarkSize = "xs" | "sm" | "md" | "lg" | "hero";

const MARK_SIZE: Record<AxomMarkSize, number> = {
  xs: 18,
  sm: 28,
  md: 36,
  lg: 52,
  hero: 88,
};

export interface AxomWordmarkProps {
  size?: AxomWordmarkSize;
  muted?: boolean;
  compact?: boolean;
  className?: string;
}

export interface AxomMarkProps {
  /** Numeric values remain supported for existing compact placements. */
  size?: AxomMarkSize | number;
  framed?: boolean;
  className?: string;
  /** Provide when the mark appears without the visible AXOM wordmark. */
  ariaLabel?: string;
}

export interface AxomBrandLockupProps {
  layout?: "horizontal" | "vertical";
  size?: AxomWordmarkSize;
  showWordmark?: boolean;
  showMark?: boolean;
  subtitle?: string;
  className?: string;
  markFramed?: boolean;
}

export function AxomWordmark({
  size = "md",
  muted = false,
  compact = false,
  className = "",
}: AxomWordmarkProps) {
  return (
    <span
      className={[
        "brand-wordmark",
        "axom-wordmark",
        `axom-wordmark--${size}`,
        muted ? "is-muted" : "",
        compact ? "is-compact" : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      <svg
        viewBox="0 0 410 92"
        role="img"
        aria-label="AXOM"
        focusable="false"
      >
        <path
          className="axom-wordmark__lettering"
          d="M22 82 52 20 82 82 M122 20l56 62 M178 20l-56 62 M332 82V20l25 39 25-39v62"
        />
        <circle
          className="axom-wordmark__lettering"
          cx="251"
          cy="51"
          r="31"
        />
      </svg>
    </span>
  );
}

export function AxomMark({
  size = "md",
  framed = false,
  className = "",
  ariaLabel,
}: AxomMarkProps) {
  const pixels = typeof size === "number" ? size : MARK_SIZE[size];
  return (
    <span
      className={[
        "axom-mark",
        framed ? "axom-mark--framed" : "",
        typeof size === "string" ? `axom-mark--${size}` : "",
        className,
      ].filter(Boolean).join(" ")}
      style={{ width: pixels, height: pixels }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="currentColor"
        role={ariaLabel ? "img" : undefined}
        aria-label={ariaLabel}
        aria-hidden={ariaLabel ? undefined : true}
        focusable="false"
      >
        {/* apex chevron with inward-tapered tips */}
        <polygon points="50,4 71,46 63,49 50,22 37,49 29,46" />
        {/* center diamond */}
        <polygon points="50,50 59,60 50,70 41,60" />
        {/* flaring legs */}
        <polygon points="33,58 39,62 29,94 22,91" />
        <polygon points="67,58 61,62 71,94 78,91" />
      </svg>
    </span>
  );
}

export function AxomBrandLockup({
  layout = "horizontal",
  size = "md",
  showWordmark = true,
  showMark = true,
  subtitle,
  className = "",
  markFramed = false,
}: AxomBrandLockupProps) {
  if (!showMark && !showWordmark) return null;

  const markSize: AxomMarkSize = size === "hero" ? "hero" : size === "lg" ? "lg" : size === "md" ? "md" : "sm";
  return (
    <span className={`axom-brand-lockup axom-brand-lockup--${layout} axom-brand-lockup--${size} ${className}`.trim()}>
      {showMark && (
        <AxomMark
          size={markSize}
          framed={markFramed}
          ariaLabel={showWordmark ? undefined : "AXOM"}
        />
      )}
      {(showWordmark || subtitle) && (
        <span className="axom-brand-lockup__copy">
          {showWordmark && <AxomWordmark size={size} compact={size === "sm"} />}
          {subtitle && <span className="axom-brand-lockup__subtitle">{subtitle}</span>}
        </span>
      )}
    </span>
  );
}

// ===========================================================================
// Axom brand mark + wordmark. The mark is a clean SVG recreation of the
// identity (apex chevron, center diamond, two flaring legs) drawn in
// currentColor so it tints with context — crisp at any size, no raster.
// The wordmark uses the guide's lettering: Poppins Medium, uppercase, wide
// tracking (styles in global.css → .brand-wordmark).
// ===========================================================================

export function AxomMark({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      aria-hidden="true"
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
  );
}

export function AxomWordmark({ className = "" }: { className?: string }) {
  return <span className={`brand-wordmark ${className}`}>Axom</span>;
}

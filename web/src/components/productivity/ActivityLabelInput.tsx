import { useEffect, useRef, useState } from "react";

export const ACTIVITY_PLACEHOLDERS = [
  "Reviewing Lecture 12",
  "Practice questions",
  "Coding",
  "Language learning",
  "Working out",
  "Reading",
  "Research",
  "Step 1 review",
] as const;

export function ActivityLabelInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [index, setIndex] = useState(0);
  const reducedMotion = useRef(prefersReducedMotion());

  useEffect(() => {
    if (focused || value || reducedMotion.current) return;
    const interval = window.setInterval(() => setIndex((current) => (current + 1) % ACTIVITY_PLACEHOLDERS.length), 3200);
    return () => window.clearInterval(interval);
  }, [focused, value]);

  return (
    <input
      className="field fast-activity-label"
      aria-label="Activity"
      placeholder={ACTIVITY_PLACEHOLDERS[index]}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      autoComplete="off"
    />
  );
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

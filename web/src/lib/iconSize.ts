/**
 * Icon size tiers (Product Identity Wave E2g).
 *
 * One optical language for lucide icons: five tiers aligned with the E2f type
 * scale. Never pass a literal number to a lucide `size` prop in product code —
 * pick the tier for the role. Brand marks (AxomMark/AxomWordmark) keep their
 * own scaling and are exempt.
 *
 *   microInline 12 — chips, meta links, caps kickers (pairs --fs-tiny/xs)
 *   body        14 — buttons, list rows, inline copy (pairs --fs-sm/base/md)
 *   emphasis    16 — section/panel heads, feature marks (pairs --fs-lg)
 *   control     20 — top-bar / folder-level controls (pairs --fs-xl/2xl)
 *   display     24 — empty states, heroes (pairs --fs-2xl+)
 *
 * Stroke: lucide's default strokeWidth (2) is the product standard — do not
 * set per-icon strokeWidth.
 */
export const ICON_SIZE = {
  microInline: 12,
  body: 14,
  emphasis: 16,
  control: 20,
  display: 24,
} as const;

export type IconSizeTier = keyof typeof ICON_SIZE;

# AX-0010 — AXOM UX Standards

| Field | Value |
| --- | --- |
| Document ID | `AX-0010` |
| Version | `0.1.0` |
| Owner | AXOM Product Owner |
| Approval Status | Pending Product Owner acceptance |
| Approval Date | — |
| Current Status | Draft; initialized |
| Last Updated | 2026-07-18 |
| Canonical Path | `docs/governance/AX-0010-UX-STANDARDS.md` |

> **Draft authority:** This owner-directed draft is non-normative until the
> AXOM Product Owner accepts it. Existing approved UX contracts retain
> authority where they conflict.

## Product DNA

**Status:** Proposed. These fields become immutable when the Product Owner
approves this document.

**Design Intent:** Make every AXOM surface feel calm, premium, coherent, fast,
and unmistakably part of one operating system.

**Product Principle:** Premium Minimalism.

**User Feeling:** “I immediately understand what matters, and the interface
stays out of my way.”

After approval, the original Product DNA above is immutable.

---

<a id="ax-0010-s1"></a>

## 1. Scope and authority

This document defines AXOM’s visual, interaction, responsive, and
accessibility standards. It defines experience outcomes, not implementation
tasks. Compliance work requires owner-approved backlog IDs in
[AX-0001](AX-0001-MASTER-PRODUCT-BACKLOG.md).

`AX-0010` owns how the product should feel and behave. The reserved
`AX-0004 — Design System` will later own approved implementation primitives,
tokens, components, and asset governance. Until `AX-0004` is established,
existing shared tokens are implementation evidence—not a second UX standard.

These standards apply in dark and light themes, desktop and responsive
layouts, keyboard and pointer use, reduced motion, loading, empty, error, and
populated states.

<a id="ax-0010-s2"></a>

## 2. Experience hierarchy

- Every screen has one primary purpose and one primary action.
- The page title establishes location; the primary surface establishes what
  matters; secondary tools recede.
- Visual emphasis follows product priority, not component size or novelty.
- Repeated actions use stable placement and wording.
- Advanced capability appears when needed rather than competing with the
  default path.
- Whitespace is intentional structure, not unused space and not a substitute
  for hierarchy.
- Optional modules remain discoverable without claiming unfinished capability.

When everything is emphasized, nothing is prioritized. Gold, glow, large type,
and elevation are reserved for identity, selection, achievement, or the one
surface that deserves focus.

<a id="ax-0010-s3"></a>

## 3. Typography

Typography creates hierarchy before borders, color, or decoration.

- Brand typography is reserved for identity moments.
- Display typography is used for page and section hierarchy.
- UI typography carries controls, body copy, labels, and data.
- Monospace typography is reserved for structured technical values.
- Product CSS uses the shared typography tokens; it does not create local
  font-size, weight, leading, or tracking scales.
- Body and explanation reading measures remain comfortably bounded; long
  instructional text should normally stay near 60–72 characters per line.
- Uppercase and wide tracking are limited to short labels and kickers.
- Muted text must remain readable in both themes and must not encode the only
  important information.

The initialized implementation vocabulary is:

| Role | Shared token family |
| --- | --- |
| Dense metadata | `--fs-micro`, `--fs-tiny`, `--fs-xs` |
| Controls and body | `--fs-sm`, `--fs-base`, `--fs-md` |
| Section and panel titles | `--fs-lg`, `--fs-xl` |
| Page and display hierarchy | `--fs-2xl`, `--fs-3xl`, `--fs-display`, `--fs-hero` |
| Weight | `--fw-regular` through `--fw-heavy` |
| Rhythm | `--leading-none` through `--leading-relaxed` |
| Tracking | `--tracking-tighter` through `--tracking-caps` |

Exact token implementation currently lives in `web/src/styles/theme.css`.

<a id="ax-0010-s4"></a>

## 4. Spacing and layout

- Use one shared spacing vocabulary. Until `AX-0004 — Design System` ratifies
  its exact tokens, reuse the established component rhythm and do not introduce
  a competing local spacing scale.
- Optical adjustments are exceptions and document why the shared rhythm is
  insufficient.
- Internal spacing expresses component relationships; larger spacing separates
  sections and changes in task.
- Repeated components use the same padding and gap at the same density.
- Page gutters adapt to viewport width but never allow controls or readable
  content to touch the viewport edge.
- Dense data may become compact; primary workflows do not become cramped to
  display more cards.
- Full-width surfaces must earn their width through content or interaction.
- Layout order remains meaningful when reduced to one column.
- Horizontal scrolling is reserved for content that is intrinsically
  two-dimensional, never as a repair for ordinary responsive layout.

<a id="ax-0010-s5"></a>

## 5. Shape, depth, and glass

AXOM uses one restrained material language.

- Use shared radius roles: extra-small, small, medium, large, extra-large, and
  pill. Do not introduce arbitrary local radii.
- Cards, controls, and overlays use the radius appropriate to their role; a
  larger radius does not make a surface more premium.
- Elevation communicates stacking or interaction, not importance by itself.
- Glass remains legible over every supported background and theme.
- Use semantic glass-fill, border, blur, and shadow tokens rather than raw
  opacity copied into a component.
- Avoid stacking glass inside glass unless the inner boundary communicates a
  real interaction or state.
- Gold elevation is exceptional. Ordinary cards use neutral depth.
- Critical depth is reserved for blocking recovery or safety surfaces.

The initialized implementation vocabularies are `--radius-*`,
`--glass-card-*`, `--blur-*`, and `--shadow-*` in
`web/src/styles/theme.css`.

<a id="ax-0010-s6"></a>

## 6. Cards

- Every card answers one user question.
- A card has one focal element and at most one primary action.
- Header, body, status, and actions form a predictable reading order.
- Equal card chrome must not flatten actual product hierarchy.
- A card is not created merely to contain whitespace or a single label.
- Clickable cards expose a clear affordance, keyboard behavior, focus state,
  and accessible name.
- Hover may reinforce clickability but never carries the only meaning.
- Empty cards teach or disappear according to product intent; they do not show
  fabricated metrics.

<a id="ax-0010-s7"></a>

## 7. Buttons and controls

- One primary action per screen or bounded decision surface.
- Secondary, ghost, and destructive actions remain visually subordinate and
  semantically accurate.
- Button labels describe the result, not a generic gesture such as “Submit”
  when a clearer verb exists.
- Destructive actions state what will be removed and expose recovery or
  confirmation when appropriate.
- Icon-only controls require descriptive accessible names and visible tooltips
  where the icon may be unfamiliar.
- Toggle controls expose their current state programmatically.
- Disabled controls remain understandable; when the reason is not obvious,
  adjacent text explains it.
- Touch-oriented controls target at least 44 by 44 CSS pixels where practical,
  especially at mobile widths.
- Focus treatment is always visible and cannot depend on hover.

<a id="ax-0010-s8"></a>

## 8. Forms

- Every field has a persistent programmatic label.
- Placeholder text is an example or hint, never the only label.
- Required, optional, format, and unit expectations are stated before failure
  when they matter.
- Validation occurs at the least disruptive useful time.
- Error messages identify the field, explain the problem in plain language,
  and state a recovery action.
- Errors are not conveyed by color alone and receive appropriate focus or live
  announcement.
- Saving, autosaving, saved, and failed states are truthful and
  distinguishable.
- Cancel and Escape preserve or discard drafts according to an explicit,
  consistent contract.

<a id="ax-0010-s9"></a>

## 9. Tables and dense data

- Use a table only when row and column relationships matter.
- Headers are semantic, concise, and remain understandable with assistive
  technology.
- Units, denominators, time windows, and sort order are visible.
- Default sorting makes the most useful pattern clear without hiding
  deterministic source order.
- Mobile layouts preserve relationships through responsive columns, labeled
  rows, or a deliberate detail view.
- Row actions identify the affected record in their accessible name.
- Selection state is programmatic and never color-only.

<a id="ax-0010-s10"></a>

## 10. Loading and progress

- A response to user input appears immediately.
- Skeletons represent known page structure during meaningful content waits.
- Spinners are reserved for compact indeterminate operations where a skeleton
  would misrepresent the shape.
- Existing readable content remains visible during background refresh when
  safe.
- Progress is determinate when AXOM can measure it; invented percentages are
  prohibited.
- Long work states explain what is happening and whether leaving is safe.
- Success, partial success, interruption, and failure are distinct.
- Loading never erases an actionable error or traps keyboard focus.

<a id="ax-0010-s11"></a>

## 11. Empty, error, and unavailable states

An empty state answers:

1. what is empty or unavailable;
2. why that may be expected;
3. what the learner can do next.

- Empty states teach without blame, urgency theater, or fabricated data.
- Seed and demonstration content is labeled and never counted as learner work.
- Locked or deferred capability is described honestly.
- Errors preserve user input whenever safe and provide a recovery path.
- Missing evidence remains unknown; AXOM does not invent an answer to fill a
  card.
- Retry is offered only when retrying can change the result.

<a id="ax-0010-s12"></a>

## 12. Motion and feedback

Motion explains change, location, hierarchy, or completion. It does not compete
with study.

| Motion role | Initialized duration |
| --- | --- |
| Hover and micro-feedback | 120–180ms |
| Standard state transition | 200–300ms |
| Meaningful spatial transition | 360–520ms |

- Use transform and opacity where possible.
- Repeated ambient motion must earn its place and remain visually subordinate.
- Feedback begins immediately even when completion is delayed.
- Navigation never depends on an animation finishing.
- `prefers-reduced-motion: reduce` removes nonessential animation and uses an
  immediate, usable state transition.
- Reduced motion must not remove status, focus, progress meaning, or content.

The initialized shared motion vocabulary is `--nm-dur-fast`,
`--nm-dur-base`, `--nm-dur-slow`, and the shared easing roles in
`web/src/styles/motion.css`.

<a id="ax-0010-s13"></a>

## 13. Navigation and orientation

- Location, available destinations, and current destination remain clear.
- Navigation labels use terms from
  [AX-0009](AX-0009-PRODUCT-LEXICON.md).
- Folder expansion, sidebar state, and user organization persist when product
  intent says continuity matters.
- Collapse never hides the only route to a core capability.
- Status badges describe real state and do not substitute for a clear label.
- Back, close, and Escape behavior is predictable.
- Route changes move focus to the new primary heading or workflow entry when
  appropriate.
- Modals and drawers restore focus to the invoking control on close when it
  remains available; otherwise focus moves to the nearest logical workflow
  fallback.
- Responsive navigation preserves access, semantic order, and usable target
  sizes.

<a id="ax-0010-s14"></a>

## 14. Accessibility

Accessibility is part of the feature, not a final audit layer.

- Use semantic landmarks and a logical heading hierarchy.
- Every interactive element has a descriptive, contextually unambiguous
  accessible name. Repeated row or record controls include enough target
  context to distinguish them.
- All workflows remain keyboard-operable without traps.
- Dialogs, drawers, menus, tabs, and disclosures expose correct semantics,
  state, focus entry, Escape behavior, and focus restoration.
- Status, selection, error, and highlight meaning is never color-only.
- Dynamic status uses restrained live announcements where needed.
- Dark and light themes preserve readable contrast and focus visibility.
- Content reflows at 390px and at a 200%-equivalent zoom without losing
  essential actions or creating ordinary horizontal overflow.
- Touch targets remain usable on mobile.
- Reduced motion follows [§12](#ax-0010-s12).
- Images that carry meaning have useful alternative text; decorative images
  are deliberately hidden from assistive technology.

<a id="ax-0010-s15"></a>

## 15. Consistency and Product Debt

Small isolated deviations are Product Polish. Cross-cutting workflow,
hierarchy, navigation, onboarding, settings-organization, information
architecture, or design-language inconsistency is Product Debt.

- Do not normalize an inconsistency opportunistically inside an unrelated
  checkpoint.
- Create an owner-approved AX record with evidence and affected surfaces.
- Reuse existing approved patterns before introducing a variant.
- A repeated exception is evidence that the system or standard may need an
  amendment.
- Visual consistency never overrides data safety, clarity, or accessibility.

<a id="ax-0010-s16"></a>

## 16. UX verification

Applicable UX acceptance includes:

- primary-action and hierarchy review;
- dark and light themes;
- desktop and 390px responsive evidence;
- 200%-equivalent reflow where practical;
- keyboard-only operation;
- focus entry and restoration;
- reduced motion;
- loading, empty, error, and populated states;
- accessible names, roles, states, contrast, and non-color cues;
- no ordinary horizontal overflow;
- Product Owner acceptance against the record’s Product DNA.

Passing automated checks alone does not establish UX verification.

<a id="ax-0010-s17"></a>

## 17. Amendment rules

- Only the Product Owner approves a standard or exception.
- Amend the canonical section; do not copy a competing rule elsewhere.
- Preserve previous wording in amendment history.
- Record affected AX IDs and whether existing behavior becomes Product Debt.
- An implementation token change does not silently amend UX intent.
- An approved UX amendment does not authorize application changes without
  backlog IDs and a checkpoint.

<a id="ax-0010-s18"></a>

## 18. Related governing documents

- [AX-0000 — Registry](AX-0000-REGISTRY.md)
- [AX-0001 — Master Product Backlog](AX-0001-MASTER-PRODUCT-BACKLOG.md)
- [AX-0002 — Constitution](AX-0002-CONSTITUTION.md)
- [AX-0003 — Governance](AX-0003-GOVERNANCE.md)
- [AX-0009 — Product Lexicon](AX-0009-PRODUCT-LEXICON.md)

<a id="ax-0010-s19"></a>

## 19. Amendment history

| Version | Date | Owner | Change | Rationale | Affected AX IDs |
| --- | --- | --- | --- | --- | --- |
| `0.1.0` | 2026-07-18 | Sol, at Product Owner direction | Drafted AXOM hierarchy, typography, spacing, materials, component, state, navigation, motion, responsive, and accessibility standards for Product Owner acceptance. | Establish one durable UX language before backlog reconstruction without self-approving product intent. | `AX-0010` |

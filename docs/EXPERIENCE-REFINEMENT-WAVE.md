# Product Identity Wave (Pre-Alpha Experience Refinement) — Ledger

Status: **active implementation wave**, directed 2026-07-15 and elevated the
same day by the Product Identity directive. Parent:
[PRE-ALPHA-CONTRACT.md](PRE-ALPHA-CONTRACT.md) (Tier 2 "premium UI polish" +
parts of Tier 1 daily workflow). This wave runs while Wave 6A remains gated on
Step 0 (original spec) and Step 2 (corpus confirmation) — it touches **no
parser architecture, schema, storage, persistence, or backup format**.

Directive summary: one cohesive operating system, not modules — every page a
room in the same building; refine · connect · polish · strengthen · reduce
friction · increase confidence; premium through restraint; one terminology,
one motion language, one elevation system; empty states teach; "what does the
student need right now?" before "what could we display?".

**The Apple Test (standing quality bar):** *if this screen were shown in an
Apple keynote with the logo removed, would it read as an intentional premium
product?* Every checkpoint's result is judged against this before it is
recorded as done.

## Checkpoints

| # | Checkpoint | Status |
| --- | --- | --- |
| E0 | Product-wide consistency audit (rolling — findings below) | **in progress** |
| E1 | Unified Import surface (rename + merge entry points) | **done 2026-07-15** |
| E2a | Radius token scale + full product-CSS migration | **done 2026-07-15** |
| E2b | Visual Language System: elevation + blur tokens, safe migrations | **done 2026-07-15** |
| E2c | Terminology standardization (canonical vocabulary adopted; import surfaces migrated) | **done 2026-07-15** (page-by-page sweep continues with E3+ touch-passes) |
| E2d | Old-palette ghost removal | **done 2026-07-15** — zero legacy literals in product code |
| E2e | Depth/elevation long-tail: canonical shadow vocabulary + floating consolidation | **done 2026-07-15** — every literal now classified & explained |
| E2f | Typography scale & rhythm — size/weight/leading/tracking tokens + product-wide migration | **done 2026-07-15** — independent Fable review: ACCEPT (doc-only fixes applied); no rendered flattening in 21 screenshots |
| E2g | Icon language: optical sizing, stroke, alignment, interactive usage | **done 2026-07-15** — 13 sizes → 5 ICON_SIZE tiers; Fable review: ACCEPT, all 563 rewrites verified |
| E3 | Dashboard mission control — T1+T2 hierarchy refinement (Command Brief dominance) | **done 2026-07-16** — Fable review: ACCEPT as-is; T3→E8, T4 no-op |
| E4 | Command Brief presentation refinement (spacing, hierarchy, feedback) | queued |
| E5 | Question Bank noise reduction (dedupe controls, whitespace, grouping) | queued |
| E6 | Course Tracker visual progression (connectedness, chronology, deps) | queued |
| E7 | Study-tool subscriptions fully wired (onboarding → scoped surfaces) | queued |
| E8 | Daily-loop continuity (morning → day → evening as one flow) | queued |
| E9 | Journal Foundation polish (materials, inks, contrast, transitions) | queued |
| E10 | Onboarding refinement (less reading, multi-select, editable-later) | queued |
| E11 | Responsiveness + accessibility sweep (desktop/tablet/390px) | queued |
| E12 | Micro-friction removal (clicks, modals, confirmations, labels) | queued |

Each checkpoint lands separately with gates (typecheck · lint · full vitest ·
affected e2e) green. Daily-progress contribution visibility ("+45m Focus,
+1 Lecture…") folds into E3/E8.

## E0 — Audit findings (evidence-based, grows as surfaces are reviewed)

1. **Corner-radius sprawl** — 12+ distinct radii in active CSS (12px ×80,
   999px ×62, 13px ×53, 14px ×48, 10px ×47, 11px ×28, 9px ×23, 8px ×22,
   16px ×21, 6px ×13, 18px ×11, 15px ×11). No token scale exists. → E2:
   define a 4-step radius scale (+pill) as CSS variables and migrate by
   find/replace bands (9–11→token, 12–14→token, 15–18→token).
2. **Duplicate import surfaces** — Question Bank shipped two tabs ("Import
   Center", "Mass Import") with overlapping file intake. → fixed in E1
   (below). Residual for E5: the Paste & review panel still offers its own
   "Import file" pill, which duplicates the queue's intake when no inspect
   seed is active.
3. **Date-fragile tests** — `JournalNotebook.test.tsx` hard-coded the
   authoring date as "today", mixing a frozen store date with the
   component's real clock; the suite self-expired two days after it was
   written (2 failures found on pristine HEAD `bb0a613`, 2026-07-15). Fixed
   by deriving dates via `dayKey()`/`localDateKey()`. **Latent risk:** ten
   more suites hard-code 2026-07-1x dates (backup ×29, activityShortcuts
   ×14, dailySuccess ×11, dashboardWidgets ×6, dailyLoopReminders ×4, …).
   Most are self-consistent pure-function tests (safe); any that seed store
   "today" against the real clock will rot the same way. → E0 follow-up:
   sweep each, standardize on derived dates or a frozen clock.
4. **Visual audit pending** — glass/shadow hierarchy, typography scale,
   empty states, and responsive behavior need a rendered-app pass
   (Playwright screenshot run) — scheduled with E2/E11 rather than asserted
   from code reading.

5. **Terminology drift (E2c evidence)** — completion is expressed five ways
   in UI strings ("Done" ×5, "Complete" ×4, "Mark complete" ×3, "Finish" ×3,
   "Finished…" ×2, plus "Finish setup/block/summary"), and examination is
   split between "Inspect" (×3) and "Review …" (×20+, which also means
   spaced review). Standard to adopt in E2c: **Finish** for completing an
   activity in progress, **Mark complete** for retroactive completion,
   **Review** reserved for study review, **Inspect** for examining parser
   output. Deferred to its own checkpoint because renames touch many tests.
6. **Radius-token exceptions (intentional)** — `≤4px` micro-details
   (hairline ticks, underline caps), `50%`/`30%` circles, `inherit`,
   `--shell-radius` (26px app shell), the dev-only `design-preview.css`
   sandbox, and one inline 10px color dot in `HabitTrackerPage.tsx`.

## E3 — Dashboard Mission Control (AUDIT — 2026-07-15, awaiting JD prioritization)

Baseline `ef5d225`, clean tree. Directive: **refine, don't redesign — keep
almost everything, improve hierarchy; presentation only** (no parser, storage,
schema, widget-content, or Command Brief algorithm changes). The dashboard must
answer in <5s: Where am I? · What matters? · What next? · How am I doing? ·
What changed? Command Brief should *dominate — because everything else recedes,
not because it's larger.*

**Architecture (verified):** `DashboardPage.tsx` (1629 lines) renders four
**fixed** elements then a configurable grid, top-to-bottom:
1. `AlphaBuildBanner` — greeting (name) + **daily quote** + alpha build state.
2. `CommandBrief` — the one evidence-backed next action.
3. `StandupPrompt`.
4. **"Build your dashboard" control card** — full titled GlassCard (kicker
   "<track> workspace" + title + meta + Edit button).
5. `.dashboard-widget-grid` — live widgets.
Widget catalog = 24 entries, **8 are `storageOnly`** (legacy/merged, never
rendered — kept only so old backups stay valid: suggested, schedule, termMap,
latestStandup, productivityTrend, resourceFocus, boardBlueprint, aiActions).
~16 live widgets. `renderDashboardWidget` returns **null** for `welcome` and
`commandBrief`, so the grid does **not** duplicate the fixed hero elements
(good — no double render). Presets: focused (default) / study-heavy /
wellbeing-balanced / custom.

**Hierarchy map (current → desired):** the Command Brief is the *2nd of 4
stacked fixed cards* of similar visual weight. Desired layer order (JD's model):
L1 Mission (greeting/where-am-I, light) · L2 Command Brief (dominant) ·
L3 today's work · L4 progress · L5 utilities (dashboard editing) · quote =
"everything else". Current order **inverts** this in two places (below).

**Redundancy map:**
- *Quote above the brain* — the daily quote sits in `AlphaBuildBanner` **above**
  the Command Brief, so the eye hits an inspirational quote before "what do I do
  next." Quote is L5 chrome occupying L1 space.
- *Utility above the work* — the "Build your dashboard" control card is a full
  titled card (kicker+title+meta) sitting **between** the Command Brief and the
  actual work widgets. Dashboard configuration is L5; it occupies L2–L3 space
  and competes directly under the brain.
- *Daily-direction triplication* — `StandupPrompt` (fixed) + `winDay` "Daily
  Check-In" widget + `todayScore` "Today's targets" widget all touch daily
  intention/closeout. Candidate consolidation (careful — keep presentation-only).
- *Welcome/quote fields* — the `welcome` widget defines date/state/quote fields
  but renders null (fixed banner owns them); the Edit editor still lists
  welcome/commandBrief as reorderable, a minor UX confusion.

**Strengths to KEEP (already meet the brief):** empty states already *teach*
("No practice questions yet · Import a source… AXOM will not invent an answer
key"; "Shipped examples teach the interface but never count as your workload").
Widget-purpose discipline is largely good (each widget answers one question;
merged widgets already collapsed to storageOnly). Icon/type/depth now tokenized
(E2a–E2g).

**Gaps vs brief:** loading uses 9 spinner/`spin` sites vs 5 skeleton — brief
prefers skeletons. Widget frames all carry equal chrome (border+titled header),
so none recedes behind the Command Brief.

**Proposed refinement set (presentation-only; tiered for JD to pick scope):**
- **T1 — Fix the two layer inversions (highest value, lowest risk):**
  (a) Demote the "Build your dashboard" control card to a quiet affordance — a
  single ghost "Edit dashboard" button (drop the kicker/title/meta card chrome),
  relocated to the end of the grid or a light inline control. (b) Demote the
  daily quote — smaller/lighter, or move below the grid — so the Command Brief
  is the first substantive thing after the greeting.
- **T2 — Let the Command Brief dominate by quieting neighbors:** lighten
  `AlphaBuildBanner` greeting weight; reduce widget-frame chrome (lighter
  headers/borders) so the grid recedes. Requires rendered before/after both
  themes; touches `DashboardWidgetFrame` styling (broader).
- **T3 — Consolidate daily-direction redundancy** (StandupPrompt vs winDay) —
  needs care to stay presentation-only; may defer to E8 (daily-loop continuity).
- **T4 — Skeletons over spinners** on dashboard widget loads (small, additive).

Recommended: **T1 now** (surgical, on-thesis, low risk), **T2 next** with
rendered verification, T3 deferred to E8, T4 opportunistic. Each lands with the
Fable rendered review before commit.

**Implementation — T1 + T2 (JD scope: T1+T2+T4-localized, defer T3).**
*Status: implemented + gates green + rendered before/after confirmed; awaiting
independent Fable review before commit. Gates: typecheck 0 · lint 0 · vitest
**806/806** (daytime run, UTC flake dormant) · e2e **6/6** (dashboard editor
flow validated) · build ✓ · both verifiers ✓ · diff-check ✓. Diff = 3 CSS/TSX
files + ledger. Rendered dark+light×desktop+mobile: welcome calm & de-gilded,
Command Brief now the single gold-framed dominant surface, quote a quiet
bottom footer (all 4 controls intact), Edit dashboard a quiet toggle that still
opens the full editor. Screenshots in scratch `shots/dash-{before,after}-*`.*
Rendered baseline `dash-before-*.png` (dark+light, 1440+390) captured and
inspected first; it confirmed the core defect visually — the gold-tinted
welcome banner (with the quote top-right) was the loudest surface, louder than
the plain Command Brief below it. Changes (presentation-only; net **reduction**
in gold — two gold surfaces removed, one added, so the Brief becomes the single
identity surface):
- *Welcome (T1):* `AlphaBuildBanner` GlassCard → plain calm header (`<div>`),
  gold gradient + gold border removed, date de-gilded (gold→`--text-45`),
  title weight `bold`→`semibold`. Identity/date/name/daily-state preserved.
- *Quote (T1):* extracted the entire `.dashboard-quote` block into a new
  `DailyQuote` component rendered **below the widget grid**; restyled as a quiet
  footer (top hairline, muted italic, no left border). All quote functionality
  preserved — next/favorite/hide/settings/attribution/a11y unchanged.
- *Customization (T1):* the titled gold `.dashboard-control-card` → a quiet
  right-aligned `.dashboard-edit-toolbar` ghost "Edit dashboard" toggle; the
  `DashboardWidgetEditor` now opens in a plain `.dashboard-editor-panel`. All
  editor functionality (presets/show-hide/order/size/fields/drag/keyboard/soft-
  XL advisory/persistence) untouched. Removed dead CSS (`dashboard-control-*`,
  `alpha-build-mark/meta`) and the now-unused `resolveTrack` import.
- *Command Brief dominance (T2):* `.brief` given the identity gold the neighbors
  lost — `border-color: var(--gold-line)` + a soft `--gold-glow` outer shadow;
  restrained (no radial, keeps the glass-card `::before` top-highlight). No
  Command Brief algorithm/ranking/evidence/readiness/state changes.
- *T4 loading:* **no-op on the dashboard** — verified the dashboard renders
  synchronously from the store; there are **no spinner/skeleton loading states**
  on any dashboard widget to replace. Recorded, not forced.
- *Empty states:* preserved verbatim (already teaching-style). Widget-frame
  chrome left as-is pending rendered evidence it competes (T2 conservative).
Files: `DashboardPage.tsx`, `styles/pages.css`, `styles/loop.css` (+ ledger).
**Independent Fable review: ACCEPT, commit as-is.** Verified presentation-only
line-by-line (GlassCard→div is not a semantic change; quote logic relocated
verbatim; zero changes to widget data / renderWidget / saveLayout / Brief
computation). Rendered 6 viewports × 2 themes: the Brief is now the single
gold-framed dominant surface (74px bare welcome header → 397px gold-edged Brief
directly below; quote at y≈1992 as a footer, `quoteDomAfterGrid: true`); no
horizontal overflow anywhere; 390px does not collapse to equal cards; glass-card
::before top-highlight intact; gold reads as a warm edge, not casino. All
functionality preserved (4 quote controls with aria-labels, editor presets/
reorder/keyboard, teaching empty states). a11y: no heading downgrade, Edit
toggle aria-expanded tracks state. T4 no-op confirmed (zero dashboard
spinners/skeletons). Gate totals in its run: typecheck 0 · lint 0 · vitest
**806/806** · e2e 6/6 (productivity-tour 4px scroll flake passed on isolated
rerun) · build ✓ · both verifiers ✓.

**Pre-existing observations Fable surfaced (NOT E3, tracked):** (1) Daily
Check-In widget — the frame's customize gear overlaps the "Open check-in" pill's
right edge (exists at baseline; belongs to a widget-frame-chrome pass / E8).
(2) `productivity-tour-layout.spec.ts` occasional 4px scroll-restore timing
flake on the untouched #productivity route.

Committed as `0b7f7e0`.

## E2g — Icon Language & Optical Consistency (implemented 2026-07-15)

**Objective:** one optical icon language. Baseline `5c2f8a9`, clean tree.

**Inventory:** single icon family already (lucide-react 0.460, stroke icons)
— no mixed libraries. **Zero explicit `strokeWidth` on any lucide icon**: the
product was already uniform on lucide's default (2); E2g documents that as the
standard rather than inventing per-size optical strokes. (The 6 `strokeWidth`
occurrences in product TSX are raw-SVG progress rings — Ring.tsx, Pomodoro,
CourseTracker — a separate drawing system, not icons; reviewer-verified.) The sprawl was in
**size**: 13 distinct values across ~574 numeric `size=` props in 65 files
(14×186, 15×118, 13×103, 17×37, 12×35, 16×33, 18×27, 11×16, 20×12, plus
one-offs 22/24/26/30), with no central definition.

**Decision (JD-approved):** 5 tiers aligned with the E2f type scale, enforced
via a constants module (`web/src/lib/iconSize.ts`, `ICON_SIZE`):
`microInline 12` (chips/meta, pairs --fs-tiny/xs) · `body 14` (buttons/rows,
pairs --fs-sm/base/md) · `emphasis 16` (section heads, pairs --fs-lg) ·
`control 20` (top-bar/folder controls) · `display 24` (empty states/heroes).
Collapse map: 11/12→micro; 13/14/15→body; 16/17/18→emphasis; 20→control;
22/24/26→display. All shifts ±1–2px — the E2f rendered evidence already
established ±1px is sub-perceptual at these scales. **Rule: never pass a
literal number to a lucide `size` prop — pick the tier.**

**Migration:** scripted, 563 props across 62 files rewritten to
`size={ICON_SIZE.*}` + auto-inserted imports. Adoption: body 402 · emphasis
93 · microInline 51 · control 12 · display 5. **Exemptions:** brand marks
(`AxomMark` 26/30 — own scaling system), dev-only `DesignPreviewPage.tsx`,
tests. (The import-inserter initially landed inside 5 multi-line import
statements — caught immediately by typecheck, repaired; lesson recorded.)

**Alignment/interactive idioms (audited, kept):** per-context CSS
(`svg { flex: 0 0 auto; color: … }`) — icons inherit color semantically and
are shrink-protected; no baseline hacks found; no change needed.

**Gates:** typecheck ✓ (0 errors) · lint ✓ · vitest 804/806 (the two failures
are the **documented pre-existing** JournalNotebook UTC-boundary flake,
verified at baseline; daytime = 806/806) · e2e **6/6** ✓ · build ✓ ·
diff-check ✓. Diff = 62 TSX + 1 new lib file; no CSS, schema, storage,
parser, backup, or dependency change.

**Acceptance:** independent Fable review returned **ACCEPT, commit as-is** —
it verified **all 563 replacements pairwise against baseline** (difflib
opcodes per file, not sampled): 563/563 correct per the collapse map, tally
reconciles tier-for-tier (402/93/51/12/5), only the 2 exempt AxomMark numeric
sizes remain, no typo tiers, all 62 import insertions between complete
statements, non-icon SVG (Ring/Pomodoro/tracker) untouched. Rendered
Dashboard/Question Bank/Reports at 1440×1000 dark: same-role icons read at
one size per view; no giant/vanished/clipped/overflowing icons. Gates in its
run: typecheck 0 errors · lint clean · vitest 804/806 (the pre-accepted
UTC-boundary flake signature) · e2e 6/6 · build ✓.

## E2f — Typography Scale & Rhythm (done 2026-07-15)

**Objective:** one type system — collapse the accumulated size/weight/leading/
tracking sprawl into named scales so the product reads as one voice, without
redesigning it. JD approved (via decision prompt) an **integer clean size scale
(~11 steps)** and the **full type system** (all four metric axes) in one
checkpoint. Baseline `a61c357`, clean tree, gates green pre-edit.

**Inventory (baseline):** 43 distinct font-sizes across 806 declarations (clustered
11/12/10.5/11.5/13/12.5/10px, long fractional tail); 10 font-weights (incl. odd
50-steps 450/650/750/850/950); ~20 line-heights; ~20 letter-spacings (with
`.08em`/`0.08em` notation drift). Font *families* were already tokenized;
the four *metric* axes had **zero** scale tokens. `--text-*` are colors, not sizes.

**Tokens added (theme.css `:root`, theme-independent), with the mapping documented
inline:**

- **Size** — `--fs-micro 9 · tiny 10 · xs 11 · sm 12 · base 13 · md 14 · lg 16 ·
  xl 18 · 2xl 22 · 3xl 28 · display 36 · hero 44`. Half-pixels round to the denser
  step (10.5→10, 11.5→11, 12.5→12, 13.5→13); 15→14 and 17→16 shift 1px.
- **Weight** — `--fw-regular 500 · medium 600 · semibold 700 · bold 800 · heavy 900`
  (odd 50-steps collapse to the base of each pair).
- **Leading** — `--leading-none 1 · tight 1.2 · snug 1.35 · normal 1.5 · relaxed 1.6`
  (nearest step; 1.4→snug, 1.45→normal).
- **Tracking** — `--tracking-tighter −0.02 · tight −0.01 · normal 0 · wide 0.04 ·
  wider 0.08 · caps 0.16em` (normalizes notation drift; nearest step).

**Migration (scripted, explicit value→token map; unmapped values left untouched):**
767 font-size, 347 font-weight, 195 line-height, 90 letter-spacing declarations
migrated across 11 product CSS files (design-preview.css dev-only, excluded;
theme.css holds only defs). The 8 `font:` shorthands were tokenized in-place
(shorthand kept — `var()` resolves inside it and preserves reset semantics).

**Rendered before/after** (specimen at the app's real font stack, both themes;
`e2e-audit/type-{dark,light}.png`, not staged): at the 0.5px shifts (9.5/10.5/
11.5/12.5/13.5) before and after are perceptually identical; the two 1px shifts
(15→14, 17→16) stay fully legible and tidier; integer sizes rasterize slightly
crisper than fractional ones. **Equal, trending better.** Page-level regression:
full e2e suite green (real pages, both themes, all supported viewports — no reflow
breakage, no overflow).

**Remaining non-token declarations — the complete, categorized exception set
(corrected 2026-07-15 after acceptance review: the earlier "6 exceptions" claim
was materially incomplete — the migration regex only matched `font-size:<n>px`,
so `clamp()`, `rem`, and `0` escaped both the migration and the first count).**

- **Fluid display/section headings — `clamp()` (14 unique):** e.g. TopBar
  `.tb-title` `clamp(23px,3vw,29px)`, Question Bank hero + `.quiz-player-body
  .question-stem` `clamp(16px,1.8vw,19px)`, Journal serif headings (×3),
  Daily Word tiles (×2), promise prompt, `pages.css` section heads (×4),
  dashboard-widget hero number. Intentional responsive sizing the fixed-px
  scale cannot express; endpoints sit near `--fs-2xl/3xl/display`. (The
  `.axom-wordmark--hero` clamp is counted once, under brand lettering below.)
  *Endpoint tokenization is an available future touch-pass but was skipped to
  avoid shifting fluid ranges under review.*
- **Brand lettering — `rem`/`clamp` (5):** `.axom-wordmark--sm/md/lg/hero`
  and `.axom-brand-lockup__subtitle`. Deliberate self-contained brand-scaling
  system (explicit material exception per the review charter). Untouched.
- **Resets:** `font-size: 0` (`.journal-book-toolbar .gbtn`, icon-only),
  `line-height: 0` (global), `letter-spacing: 0` (×4, explicit no-tracking
  overrides). Self-documenting.
- **Deliberate one-offs:** `font-size: 64px` (`.focus-clock`, above display
  tier); `line-height: 0.94` (sub-1 leading on a display number);
  `line-height: .92` (`.premed-evidence-score b`, display number — found by
  the independent review; the implementer's census regex required a leading
  digit); `letter-spacing: 0.5px` (`.pomo-time`, tabular timer digits — px
  tracking, likewise missed by an em-only census); tracking
  `0.22 / 0.26 / 0.28em` (uppercase hero/brand labels, beyond `caps`).

*Fixed 2026-07-15: the 5 `dashboard-widget-frame__*` settings-panel `rem`
font-sizes (`1rem`→`--fs-lg`, `.82rem`→`--fs-base`, `.72rem`→`--fs-xs`) were
genuine migration stragglers (generic UI text, sibling props already tokenized,
no app-wide rem system) and are now tokenized — not left as an "exception."*

**Hierarchy note — `.question-stem` vs `.option-row` (Question Workspace):**
baseline stem `14.5px` and the effective option `14px` (`loop.css` "bigger,
calmer answer choices" rule overrides the older `13.5px`) both map to
`--fs-md` (14px), so a sub-perceptual 0.5px difference goes to zero.
**Decision: keep `14/14`.** It respects the deliberate "bigger calmer choices"
intent (options stay 14) and the roles are distinguished by layout (stem is a
positioned heading; options are bordered interactive rows), not by 0.5px.
A deliberate stem-prominence bump is deferred to the Question Bank functional
wave (Q2 reading tools), not forced as a redesign inside E2f.

**Apple Test:** type now reads as an intentional ramp rather than 43 hand-picked
values → PASS at the size layer. Weight/leading/tracking likewise consolidated.
Vertical rhythm audited via the e2e viewport specs (no clipping/overflow).

**500-Hour Rule:** integer sizes are calmer and crisper; no size grew louder;
the change reduces sub-pixel fuzz on ~250 fractional declarations.

**Gates:** typecheck ✓ · lint ✓ (no new warning) · vitest **806/806** ✓ · e2e
**6/6** ✓ · build ✓ · verify:question-imports (100% exact, 0 false-ready) ✓ ·
verify:daily-games-offline (`workspaceLocalStorageKeys: []`) ✓ · `git diff --check`
✓. **Diff = 12 CSS files** (theme.css +38 for tokens; 11 migrated). No schema /
storage / parser / backup / dependency / lockfile change.

**Acceptance:** independent rendered review by a different model (Fable,
per JD's protocol — the implementer does not self-accept a whole-product
typographic change) returned **ACCEPT WITH FIXES, fixes documentation-only**.
Evidence: 21 screenshots across Dashboard/QB/Reports/Productivity/Journal/quiz
player at 1440×1000 dark+light, 390×844 dark, and a 200%-zoom-equivalent
viewport — **no rendered flattening found**; both flagged risk points held
(panel-title 14 vs panel-sub 11 plainly distinct; quiz stem renders at the
`clamp(16px,1.8vw,19px)` rule, clearly above 14px options, so stem/option
parity has no rendered manifestation). Token architecture judged sound
(root-only, tier-named, no circular aliases; weight histogram reconciles
exactly). Apple Test: PASS on all rendered pages (Productivity PASS-WITH-
MINOR-POLISH for a pre-existing caps-microlabel density, not introduced by
E2f). Fixes applied above: two additional one-offs the implementer's census
regexes missed (`line-height: .92`, `letter-spacing: 0.5px`) and the clamp
count corrected to 14 unique. (A first Fable run was killed by a session
limit before returning a verdict; this is the completed re-run.)

**Reviewer's out-of-scope observation (tracked, not E2f):**
`JournalNotebook.test.tsx` failed 2/806 in the reviewer's ~21:00 local run
(past UTC midnight) with store-level date assertions — assessed as a
timezone-boundary flake in the test's date derivation, impossible for a
CSS-only diff to cause. **Verified pre-existing:** reproduced identically
(same 2 failures) at baseline `a61c357` in a scratch worktree at 21:08 AST
(01:08 UTC) with the E2f diff absent. Fix the date derivation in a separate
change (E1's earlier fix made the *authoring* date derived; the remaining
flake is the TODAY_KEY/store-write boundary). Daytime runs: 806/806.

**FIXED 2026-07-16 (isolated commit, own change):** root cause was
`JournalPage.tsx` stamping a *new* "today" entry's `date` with
`new Date().toISOString()` (**UTC**), while day-keyed lookups
(`DashboardPage` `entry.date.slice(0,10) === activeDayKey`, `performance.ts`)
compare against the **local** day key — so near midnight the UTC date-prefix
mismatched (entry shown on the wrong day / not found). Not just a test flake:
a real near-midnight product bug. Fix = stamp the local day key at noon
(`` `${day}T12:00:00` ``, matching how past-day entries were already stamped);
`updatedAt` still carries the precise UTC instant. Proven timezone-robust —
`JournalNotebook.test.tsx` now passes under TZ=UTC, UTC+14 (Pacific/Kiritimati,
which provably fails the old code at 17:00 UTC), and UTC-11. Full suite
806/806.

**Proceed decision:** **E2g (Icon Language) — GO** — optical sizing, stroke,
alignment — then E3 Dashboard mission-control, then the Q-wave.

## E2e — Depth / Elevation Long Tail (done 2026-07-15)

**Objective (per directive):** complete the depth system so a user knows without
thought what belongs to the page / is interactive / selected / floating / modal /
critical / decorative. *Make depth predictable, not dramatic.* Not a "zero
literals" target — the bar is **zero *unexplained* literals**.

**Disk prerequisite:** required ≥15 GB free; measured **20.51 GB** at start (the
prior session's 100%-full condition was resolved between sessions — Data volume
411→389 GB). PASS. (Mid-run, Playwright's browser cache proved to have been wiped
by that cleanup; `chromium` reinstalled — ~/Library cache only, no repo impact.
Disk stayed ≥18.9 GB.)

**Baseline drift note:** the E1–E2d working tree that was "intentionally
uncommitted" last session is now **committed** as `99fa3ac "wave6+"`; tree clean
at E2e start. E2e therefore lands as an isolated 3-file diff.

**Inventory:** 152 shadow declarations across 13 active CSS files (pages 62,
components 26, motion 14, questionbank 13, tour 11, journal-notebook 8, shell 5,
daily-games 5, global 3, dashboard-widgets 2, theme 1, loop 1, design-preview 1).
TSX/TS product code: effectively zero (one comment in lib/motion.ts). Full
classification A–N below.

**Existing system (from E2b):** `--shadow-shell/card/raised/overlay/gold`, each
dark+light. Only 10 of 152 lines consumed tokens. Canonical gaps: no
`none`, no scrim-less `floating` tier, no semantic `critical`.

**Tokens added (theme.css, dark `:root` + light override), additive & documented
inline as a role ladder:**

- `--shadow-none: none` — opt out of inherited depth.
- `--shadow-surface: var(--shadow-card)` — canonical alias; ordinary cards.
- `--shadow-floating` — dark `0 16px 40px rgba(0,0,0,0.48)`, light
  `0 16px 38px rgba(65,48,28,0.18)`. Scrim-less overlays: popovers, menus,
  toasts, floating bars. **Now theme-aware** (the migrated literals were not).
- `--shadow-critical` — depth + semantic red edge (`color-mix … var(--red)`),
  dark+light. Reserved for urgent/blocking recovery surfaces; adoption deferred
  (no such surface exists yet — defining it completes the vocabulary without a
  page-named token). No consumers by design.
Existing 5 tokens unchanged (no value edits → zero risk to current consumers).

**Neutral-depth migrations (3, all scrim-less floating overlays with ad-hoc,
theme-blind alphas → one token):**

- `.toast` (pages.css) `0 18px 40px rgba(0,0,0,0.5)` → `var(--shadow-floating)`
- `.session-loop-bar` (loop.css) `0 12px 40px rgba(0,0,0,0.45)` → same
- `.stat-overview` popover (pages.css) `0 20px 44px rgba(0,0,0,0.55)` → same

**Rendered before/after** (isolated harness, real token values, both themes;
stored under the ignored scratchpad `e2e-audit/floating-{dark,light}.png`, not
staged): **dark = visually equal** (0.48 sits between the old 0.45/0.5/0.55) and
now consistent across all three; **light = better** — the old literals were
theme-blind hard-black and cast a heavy gray halo on the cream page (the §12-Q10
failure); the token's brown-tinted `0.18` reads clean and matches the light
shadow system. "Equal or better" (§16) confirmed. Page-level regression proof:
the full 6-spec Playwright suite (real pages, both themes, all supported
viewports, keyboard-reorder) stayed green.

**Identity-glow separation (§5):** neutral depth and gold/violet identity were
kept in separate token families — `--shadow-gold` stays the only identity-glow
token; the three migrations carried **no** glow (pure neutral), so nothing was
flattened into neutral. No composite gold/violet surface was altered.

**Documented exceptions — kept literal *with reason* (this is what "explained"
means):**

- *Identity glow composites* (`.account-avatar`, `.focus-card.primary` violet,
  `.filter-pill.on`, `.qb-cta` hover gold, `.cal-day.on`): intentional emphasis
  on selected/primary/hero surfaces (§5/§6). Transient (hover) or selected-state,
  never persistent glow on an ordinary resting surface.
- *Animation keyframes* (ring-pulse, nm-milestone/anki/pomodoro pulses, tour
  ring): glow values are animated frame-by-frame — cannot be a static token.
  Identity/semantic, bounded to their component.
- *Journal material simulation* (journal-notebook.css ×8: cover inset, spine,
  page-edge, stack): physical realism (§9). Centralized in the Journal system,
  light/dark present.
- *Data-vis / game state* (daily-games inset underlines for correct/present,
  gold ring; `.result-dot`, `.hour-tick`, `.pass-color`/heat insets): state-
  specific, meaning must not change (§10).
- *Edge highlights* (`inset 0 1px 0 rgba(255,255,255,X)`): the system's
  "whisper-thin top light" glass language, not elevation; most already live
  inside the card/raised/overlay tokens.
- *Focus rings* (`0 0 0 3px rgba(…)`): a11y indicators, semantic not depth.
  Candidate for a future `--focus-ring` token — queued for E11 (a11y sweep),
  out of E2e scope.
- *Construction skeuomorph* (`.uc-tape`, `.uc-badge`): decorative caution-tape
  lift; tokenizing would flatten the effect.
- *Mobile drawer* (shell.css `0 0 50px`): symmetric ambient halo is correct for
  a full-height left drawer; a directional overlay token would shadow only
  downward. Kept as documented exception.

**Classification (A–N):** A page-shell (`--shadow-shell` ×3) · B standard card
(`--shadow-card` ×5) · C interactive/raised (`--shadow-raised`, hover states) ·
D selected (filter-pill.on, focus-card.primary, cal-day.on, podium.you) ·
E floating (**migrated** ×3) · F popover/menu (uses `--shadow-overlay`) ·
G modal/dialog/drawer (`--shadow-overlay`, tour dialogs, mobile drawer) ·
H toast → folded into E · I decorative identity glow (avatar, gold rings,
construction) · J semantic status glow (green/orange/red, currentColor dots) ·
K journal material (×8) · L game/data-vis state (daily-games, dots, heat) ·
M dev-only (design-preview.css, untouched) · N unknown → **none remain**.

**Apple Test (depth system, logo removed):** floating tier now reads as
*intentional* rather than *accumulated* (three identical-role overlays previously
carried three different hand-picked alphas → now one token). PASS for the floating
layer. Cards/modals/shell already tokenized in E2b (PASS). Remaining
PASS-WITH-MINOR-POLISH items are queued, not E2e: focus-ring tokenization (E11),
Dashboard hierarchy (E3), type scale (E2f).

**500-Hour Rule:** no persistent glow added to any ordinary surface; no new hover
lift; the change *reduces* attention (softer, consistent floating shadow, no
hard-black halo in light). Calm, near-invisible consistency — the preferred
direction.

**Hover/focus · glass/depth · responsive · a11y:** unchanged by this checkpoint
(only 3 transient overlays + additive tokens touched); verified not regressed by
the e2e suite (dashboard keyboard-reorder, productivity tour at every viewport,
QB themed+responsive, theme persistence light/dark). No horizontal overflow, no
clipped-shadow edges introduced (floating token blur 40px ≤ prior 44px).

**Deferred functional requirements (recorded per mid-checkpoint scope warning —
NOT touched in E2e):** Question Bank answer mapping, explanation/distractor
rationale generation, tutor mode, exam simulation, set creation, update-safe
persistence, and future accounts. These are new functional systems, out of the
E2e depth scope; logged here for the wave backlog. No repro defects surfaced
during visual verification.

**Gates:** typecheck ✓ · lint ✓ (no new warning) · vitest **806/806** ✓ · e2e
**6/6** ✓ · build ✓ · verify:question-imports (100% exact, 0 false-ready, no
all-A) ✓ · verify:daily-games-offline (`workspaceLocalStorageKeys: []`) ✓ ·
`git diff --check` ✓. **Diff = 3 CSS files** (theme.css +18 net, loop.css,
pages.css). No schema / IndexedDB / parser / backup / storage-key / dependency /
lockfile change; no design-preview output; no PDF-worker path change; no
screenshots or reports staged.

**Proceed decision:** **E2f (Typography Scale) — GO.** Depth vocabulary is now
complete and every literal explained; type scale is the next independent layer.

## E2c/E2d — Language & Palette Reconciliation (done 2026-07-15)

**Palette (E2d):** all legacy Noctyrium literals removed from product code —
rgba families (old green ×70+, orange ×23, light-blue ×4, red ×2, incl. the
missed `70,210,126` family), hex ghosts, gradient stops, and stale
`var(x, #hex)` fallbacks. Migration pattern: `rgba(F, a)` →
`color-mix(in srgb, var(--semantic) a%, transparent)` (precedent existed),
so **every migrated color now follows light/dark theme parity**. Data-vis
constants mineralized with distinction preserved: `PASS_COLOR`
(steel-blue → terracotta → light-sage → sage → deep-sage), `ANKI_COLORS`
(amber → bone-yellow → violet-bone, hue-distinct from identity gold);
`heatColor()` + heat legends now grade-token-driven and re-theme together.
Dev-only `design-preview.css` and test fixtures deliberately untouched.
Classification: legacy brand accents → `--cyan`; success/status → `--green`/
grade tokens; warning → `--orange`; error → `--red`; data-vis → grade
tokens/mineral constants; zero flattening into gold.

**Terminology (E2c):** canonical vocabulary recorded (Import/Upload/Inspect/
Review/Practice/Study/Finish/Mark complete/Save/Apply/Confirm/…; "Process/
Parse/Analyze" banned from ordinary copy). Visible renames applied: "Process
queue"→"Import files", "Processing…"→"Importing…", toast copy de-jargoned,
"Needs review (parser)"→"Needs inspection", tour step "Review
mappings"→"Inspect mappings", E1's "Paste & review"→**"Paste & inspect"**,
"Extract & review"→"Extract & inspect" ("review" now = academic study only;
"inspect" = parser output). Academic "needs review" usages verified correct
and kept. Enum/persisted values (`needs-review`, `review-suggested`)
deliberately unchanged. 6 test assertions updated deliberately.

**Gates:** typecheck ✓ lint ✓ vitest 806/806 ✓ build ✓ **all 6 Playwright
e2e ✓** verify:question-imports (100% exact, 0 false-ready, no all-A) ✓
verify:daily-games-offline ✓ (`workspaceLocalStorageKeys: []`) ·
diff-check ✓. No schema/storage/parser/backup changes.

**Environment note:** the machine's disk hit 100% full mid-gates (164MB free
of 460GB — not repo-caused; repo artifacts total ~880MB incl. 561MB legacy
Swift `.build`). Regenerable web caches were cleared to proceed; the
system-wide cleanup belongs to Jafar.

## E2b — Visual Language System (done 2026-07-15)

**Elevation scale** (both themes): the pre-existing `--shadow-card` /
`--shadow-shell` gained the missing rungs — `--shadow-raised` (interactive/
prominent cards, derived from the observed 0 24px 54px cluster) and
`--shadow-overlay` (popovers/menus/toasts, calibrated to the observed
0.22–0.30 neutral cluster: `0 16px 36px rgba(0,0,0,0.28)` + bone inset).
Gold/violet glows remain **semantic per component** — they are identity, not
elevation, and were deliberately not tokenized away.

**Blur scale** (one blur language): `--blur-veil 2 · soft 6 · panel 16 ·
glass 22+sat140 · deep 32+sat150`. **All product `backdrop-filter`s migrated**
(26 token usages, zero literals left; modal scrim 10px → panel). Deltas ≤4px
blur / ≤10% saturation — imperceptible.

**Shadow migrations performed:** shared primitives only (raised card,
dropdown/popover in `components.css`) — the ~20 remaining bespoke neutral
drops are one-offs whose token mapping visibly changes them (e.g. toast 0.5 →
0.28); consolidating those without rendered before/after would be redesign,
not entropy removal → **E2e** with the screenshot pass.

**Verification:** build ✓ · vitest 806/806 ✓ · lint ✓ · **rendered e2e ✓**
(theme-persistence light/dark, dashboard-widget-layout responsive,
question-bank-landing — real Chromium on the tokenized CSS).

**New audit evidence (continues the E0 findings list):**

- **Finding 7 — Old-palette ghosts: 99 Noctyrium-era rgba literals**
  (sky-cyan 90/215/239 & 120/200/255, web-purple 155/123/255, bright
  green/orange/red) still hard-coded, 70 of them in `pages.css` (legends,
  heatmap swatches, remediation borders). The AXOM re-theme swapped
  variables; these bypass them. → E2d, per-case mapping to
  `--grade-*`/`--gold`/`--cool-accent`.
- **Finding 8 — Icon sizes:** 10 distinct lucide sizes (11–26); dominant
  13/14/15 split suggests a 3-tier standard (13 inline · 15 controls ·
  17 headers) → fold into E2c/E5 touch-passes rather than a big-bang sweep.
- **Finding 9 — Typography:** 42 distinct px font-sizes in product CSS →
  type-scale token work queued (E2 follow-up, needs rendered pass).
- **Finding 10 — Empty states:** only 3 bare "No X yet" strings — mostly
  already teaching-style; light E7 cleanup.
- **Finding 11 — Loading:** single `spin` idiom (×8), no competing spinner
  families — already consistent.

## E2a — Radius token scale (done 2026-07-15)

- New scale in `theme.css`: `--radius-xs 6 · sm 10 · md 13 · lg 16 · xl 22 ·
  pill 999`; legacy aliases remapped (`--card-radius` → lg, `--btn-radius` →
  md) so existing var users inherit the scale.
- **All product CSS migrated** (components, pages, questionbank, shell,
  dashboard-widgets, journal-notebook, daily-games, loop, motion, global,
  tour): 19 distinct literal radii collapsed to 6 tokens by band
  (5–7→xs, 8–11→sm, 12–14→md, 15–18→lg, 19–24→xl, 99/999→pill), compound
  radii included; maximum visual delta ≤3px on any single rule.
- Post-migration histogram: 429 token usages; zero non-micro literal radii
  remain outside the dev sandbox.
- Gates: build ✓ · full vitest 806/806 ✓ · lint ✓. Rendered verification
  (Playwright screenshot pass) rides with E2b/E11.

## E1 — Unified Import surface (done 2026-07-15)

- Question Bank tabs: "Import Center" + "Mass Import" → one tab, **Import**.
- The multi-file queue card is retitled **Import** with the directive's copy
  ("Upload one file or several related files — extraction, review routing,
  and batch save happen automatically.") and leads on a fresh visit; the
  paste/AI/draft-review panel (retitled **Paste & review**) leads when the
  user arrives with an inspect/parse seed.
- Presentation-only: no parser, schema, storage, or workflow logic changed;
  Inspect handoff, paste routing, and source-parse routing all preserved.
- Files: `QuestionWorkspacePage.tsx` (tab model + seed-aware ordering),
  `MassImport.tsx` (title/copy), `ImportPanel.tsx` (title/copy), plus test
  updates. Internal identifiers (`MassImport`, `massImportFileStatus`)
  deliberately unchanged.
- Gates: typecheck ✓ · lint ✓ · **full vitest 806/806 ✓** (HEAD was
  804/806 before the date-rot fix; the tree is now greener than HEAD).

## Rules honored

No architecture/schema/storage/persistence changes · no Universal Import
Engine work · no OCR · no Journal Cinematic · no Knowledge Graph
implementation · no Course Central adapters · no accounts · nothing
committed without explicit instruction.

## Q1 — Explicit-Answer Trust & Mapping Reliability (done 2026-07-16)

First functional-wave checkpoint. Baseline `ec71b80`. **Root cause (reproduced
through the real parser):** pasted text goes through `questionParse.ts`, NOT
`questionImport.ts`/`resolveAnswerValue` (that's the CSV/JSON path). In the
answer-signal loop, when an explicit answer letter's trailing text matched **no**
option, the code set `structuredConflict = true` + `signalKey = undefined` —
treating harmless drift ("Answer: A. Mast cell" vs option "Mast cells") as a
*conflict* and **discarding the letter** → `correctKey` undefined → unresolved.
The evidence showed A; the finalized field lost it.

**Fix (candidate-preservation, not blind trust):** the no-option-match branch
now splits — an explicit letter with a tail that matches no option is **harmless
drift**: preserve the letter as the source-selected candidate (`correctKey=A`),
set `needsReview=true`, add rule `answer.explicit-letter-text-drift`, and do
**not** flag a conflict. A **true contradiction** — the tail *exactly* matching a
*different* option — remains unresolved (`conflict.answer-letter-vs-text`,
`correctKey` unset, both evidences preserved). Cases 1/2/5/6 unchanged.

**No schema/data-model/UI change.** Existing fields carry the whole policy
(`correctKey`/`needsReview`/`answerEvidence`/`warnings`/`parserRuleIds`). The
review modal already inits its selector from `question.correctKey`, so the drift
candidate A is **auto-preselected** for confirmation. Persist safety: MassImport
sets `extraction.reviewed=true`, so `needsReview=true` is what keeps a drift
candidate **non-runnable** (`questionMappingStatus` → "unresolved") until the
user confirms — falseReady stays 0. Re-import uses `addQuestion` (new IDs), never
overwriting a user-confirmed answer.

**Diagnostics** (inspectable via `extraction.parserRuleIds`):
`answer.explicit-letter-exact` · `answer.explicit-letter-text-drift` ·
`conflict.answer-letter-vs-text` · `ambiguous.answer-text` ·
`answer.text-no-option-match`.

**Fixtures:** `src/lib/questionAnswerTrust.test.ts` (11 cases A–J: exact,
singular/parenthetical/explanatory drift, cross-option conflict, letter-only,
mixed-key sequence, unknown/garbage, ambiguous, + two persistence-safety cases).

**Independent Fable review: ACCEPT as-is.** Ran its own 9/9 adversarial probe;
confirmed `matchAnswerText` requires exact normalized equality (no fuzzy/substring
misclassification), `needsReview` forces "unresolved" even with `reviewed=true`
(no runnable-pool leak), persistence + user-confirm precedence safe, no
false-ready, no regression. Gates: typecheck 0 · lint 0 · **vitest 817/817**
(+11 Q1) · e2e 6/6 · build ✓ · verify:question-imports **100% exact, falseReady 0,
allACollapse false** · verify:daily-games-offline ✓ · diff-check ✓. Diff =
`questionParse.ts` (+24/−7) + the new fixture test. **No Universal Import Engine
(Wave 6A) work; localized repair to the shipped resolution path.** Committed as
`b94e6f1` (docs sha fixed post-commit).

## Q2a — Question Reading Experience: Interaction Layer (2026-07-16)

Second functional-wave checkpoint. Baseline `26707a8`. JD split Q2 at the schema
fault line: **Q2a = player interaction (no schema)**, **Q2b = persistent
annotation layer (additive v32 fields + a separate IndexedDB blob store)** — Q2b
deferred to its own checkpoint. Presentation/interaction only; no schema, store,
persistence, or parser change.

**Delivered (ExamRunner + QuizCalculator + CSS):**
- **Strikeout / eliminate** — per-choice toggle (aria-labelled, aria-pressed) +
  **Shift+letter** keyboard; **Reset** clears all; struck = line-through +
  reduced opacity but legible; **coexists with correct/wrong coloring after
  reveal** (history not erased); never selects the option; session-transient
  (clears on advance).
- **Scroll-to-top + focus on advance** — `.modal-body` scrollTop=0 (instant →
  reduced-motion-safe) and focus moves to `.question-stem` (tabIndex=-1) so AT
  announces the new question.
- **Reading font-size** — `− A +` multiplies stem + choices via
  `--quiz-reading-scale`; persisted to a **device-only** localStorage key
  (`axom.quiz.reading-scale.v1`, `STORAGE_KEYS.quizReadingScale`), never the
  workspace payload (verifier: `workspaceLocalStorageKeys: []`); clamped 0.9–1.4.
- **Calculator** — keyboard-accessible floating panel (`QuizCalculator.tsx`),
  session-scoped, no history persistence; eval gated by a strict arithmetic
  allowlist before `Function()`.
- **Post-submit rationale emphasis** — leads with "Why <correct> is correct",
  then "Why your choice (X) is wrong" (only on a wrong pick), remaining
  distractors collapse under `<details>`.
- **Cleaner explanation reading** — 68ch measure on explanation/rationale
  paragraphs.
- Preserved unseen/seen + attempt recording (untouched).

Option-row markup changed from a single `<button.option-row>` to
`<div.option-row>` = `<button.option-pick aria-label="X. text">` +
`<button.option-strike>`; the option's accessible name is unchanged, so the
quiz e2e still resolves it.

**Independent Fable review: ACCEPT WITH FIXES** — one minor finding (F1): the
reading control scaled the choices but not the stem, because
`questionbank.css .quiz-player-body .question-stem` (clamp) out-specified the
scale rule. **Fixed** by raising specificity to
`.quiz-player-body .quiz-reading .question-stem`. Fable verified everything else
on rendered + code evidence: strikeout never selects / survives reveal /
coexists with correctness / resets; scroll+focus lands on the stem, instant;
scale persists to the device key only with no workspace leak, bounds respected;
calculator keyboard-accessible + eval-safe (allowlist blocks injection);
rationale emphasis correct for wrong/correct/empty; no regression; no 390px
overflow. Gates in its run: typecheck 0 · lint 0 · vitest **817/817** · e2e 6/6 ·
build ✓ · verify:question-imports (100%/0/false) ✓ · verify:daily-games-offline
(`[]`) ✓.

**Final owner re-gate (2026-07-16):** typecheck 0 · lint 0 · Vitest **107 files,
817/817** · Playwright **6/6** · production build ✓ · question-import acceptance
**21 questions / 100% answer accuracy / 100% explanation association / falseReady
0 / allACollapse false / lostQuestions 0** · daily-games offline ✓ with
`workspaceLocalStorageKeys: []` · bundle isolation ✓ · diff-check ✓. One first
E2E run had an unrelated 2px Productivity tour scroll-restoration timing flake;
the complete rerun and final post-repair run both passed 6/6.

Disposable Q2a browser proof passed **24/24** assertions at 900px dark and
390×844 light: pointer + Shift elimination never selected, reset cleared only
eliminations, strike survived reveal with correct/wrong classes, stem and option
fonts both increased **14px → 16.8px**, 0.9/1.4 bounds disabled correctly, reload
preserved only `axom.quiz.reading-scale.v1`, and the workspace contained no scale.
Calculator focus/arithmetic (`12 + 7 × 3 = 33`, `50% = 0.5`), controlled error,
Escape close/focus restoration, rationale ordering/collapse/empty behavior,
next-question scrollTop 0 + stem focus, and mobile overflow all passed. The owner
added the smallest accessibility repair discovered by that proof: calculator
close now restores focus to its trigger after React unmounts the panel.

**Status:** Q2a is **implemented, Fable-accepted, F1-fixed, fully re-gated, and
ready to commit.** Diff: `ExamRunner.tsx`, `brand.ts`, `loop.css`,
`questionbank.css` + new `QuizCalculator.tsx`.

## Deferred — Question Bank Functional Wave (Q1–Q3)

Directed 2026-07-15 (JD), recorded during E2e as **backlog only**. These are
functional systems, **not** part of the E-series identity work. **No Question
Bank files may be touched for these until the identity foundation (E2f
typography + E2g icons) is stable.** Sequence: run after E2f → E2g → E3, then
Q1 → Q2 → Q3. Reconcile with the binding parser contracts
([UNIVERSAL-QUESTION-IMPORT-ENGINE.md](UNIVERSAL-QUESTION-IMPORT-ENGINE.md),
Pre-Alpha contract) before any code — answer invariants (e.g. "unknown is never
A") and measured (never claimed) acceptance targets still govern.

### Q1 — Answer Trust & Explanation Pipeline (next functional P0)

- **Answer-mapping defect [P0, highest].** Correct answer is visible in parser
  *evidence* but does not transfer into the finalized `correctKey`. Breakdown is
  *after* extraction — trace: answer signal → answer resolution → reviewed draft
  → import normalization → persisted `correctKey`. Must add tests for **pasted
  text specifically, including GPT-cleaned input** (a polished source that fails
  to map is the most damning case). "The software solved the hard part, then
  loses the answer carrying it across the room."
- **Duplicate import entry cleanup** (finish what E1/E5 flagged — ImportPanel
  file pill still duplicates queue intake when seedless).
- **Structured explanation fields per question:** why-correct; why-A/B/C/D/E-
  wrong (per option); general teaching explanation; per-rationale source
  provenance. Priority ladder: (1) extract source-provided rationales →
  (2) map explicit distractor rationales to their option → (3) derive only when
  source supports → (4) *optionally* AI-generate missing. **AI content labeled
  per generated field** ("AI-generated rationale. No source explanation was
  available."), never one buried Settings disclaimer. Never alters source
  answer truth.
- **Set creation simplified.**
- **Provenance model:** distinguish source answer / source explanation / derived
  / AI-generated at the field level.
- **Next-question scroll/focus repair** (small fix, outsized effect — see Q2).

**Q1 structured-import trust unification (2026-07-17).** CSV and JSON now use
the same evidence policy as pasted text through a structured deterministic
resolution result: `resolved`, review-gated `candidate`, `conflict`, or
`unresolved`. An explicit valid letter with harmless trailing-text drift keeps
its candidate key and records `answer.explicit-letter-text-drift`; it is not
runnable until deliberate confirmation. If the tail exactly matches another
option, `conflict.answer-letter-vs-text` preserves the explicit and conflicting
keys while leaving `correctKey` unset. Ambiguous text, garbage, and invalid
letters remain unresolved and never default to A. CSV/JSON diagnostics retain
the source evidence, confidence, warning, and rule ID; the Import Center
preselects permitted candidates and provides a one-action confirmation control.
User confirmation adds `answer.user-reviewed-mapping`, clears the review gate,
and remains higher priority than parser output. No AI, schema, storage,
annotation, attachment, or dependency behavior changes in this checkpoint.

### Q2 — Quiz Toolkit & Annotation Layer

- **Post-answer feedback:** preserve selected + correct appearance; expandable
  concise rationale beneath any option; wrong pick shows why-wrong + why-correct-
  is-better; other distractors collapsed; **feedback must not reset when using
  strikeout/other tools**; keyboard nav intact.
- **Highlighting/annotations:** stem + option highlights, restrained multi-color,
  clear-all, attached notes, screenshot/image notes, slide-like attachments
  tagged as notes, persistent across sessions, export/backup-compatible.
  **Store highlights as anchored text ranges with a fallback excerpt** (raw
  char offsets break after edits). Provenance: imported asset / user note /
  user screenshot / generated explanation.
- **Strikeout (pre-submit elimination):** click or keyboard; option stays
  readable at reduced emphasis (no illegible line-through); does not select;
  survives submission; correctness styling coexists with strikeout history;
  eliminated option's rationale still inspectable; reset-eliminations command.
  Later analytics (optional, not surveillance): eliminated-correct, eliminated-
  distractor, changed-from-eliminated-to-selected, selected-without-elimination.
- **Reading tools (per-user, persistent, reset-to-default):** stem/option font
  size, reading width, high-contrast, reduced-distraction mode. **Calculator**
  in the toolkit when the block/type enables it: basic first, keyboard-
  accessible, non-obscuring, optional session-scoped history; Exam Mode can
  disable it.
- **Question tags (real model):** user / imported-source / AXOM-suggested /
  institution-course / topic-system / error-pattern; restrained color/icon;
  bulk assign-remove; filter intersection + union; rename/merge; preserve
  provenance + user ownership. Standard filters: unseen, seen, incorrect,
  correct, guessed-correctly, changed-answer, flagged, needs-inspection,
  no-source-explanation, has-notes, has-image, repeat-offender, user tag.
- **State vocabulary decision (recommended, avoids one word = two meanings):**
  **Viewed** = opened · **Attempted** = submitted · **Unseen** = never opened ·
  **Unattempted** = viewed but never submitted.
- **Next-question scroll behavior (belongs with the toolkit; repair in Q1):**
  clicking Next positions the new question at the **start of its stem**. Scroll
  the quiz's *actual scroll container* (not `window`); move focus to the
  question heading / focusable stem; announce the new question number to AT;
  instant scroll under reduced motion; only restore prior position on an
  explicit "return to previous"; never land at the prior question's explanation
  depth. ("Reading Q12 from halfway down because Q11 had a long explanation
  becomes homicidal around hour 500.")

### Q3 — Tutor & Exam Simulation (future, after Q1/Q2 stable)

- **Tutor Mode:** ask what the learner is thinking; progressive hints;
  differential narrowing; clue identification; mechanism walkthrough; explain
  one distractor at a time; "Tell me more" / "Give me the answer"; AI content
  clearly labeled; never alters source answer truth; never required for ordinary
  practice.
- **Exam simulation:** configurable profiles (generic secure exam, Examplify-
  *inspired* sequence, school-defined, custom). Optional lobby flow (downloaded
  → device check → instructions acknowledged → waiting for proctor → begin).
  **Reproduce the workflow concept only — no Examplify branding, assets, or
  proprietary interface.**

### Q2b — Persistent Question Annotation Foundation (binding contract)

**Ownership and compatibility.** Annotations are learner-owned overlays on a
question, never edits to imported source text or provenance. `QuestionRecord`
retains its existing optional `notes` field as the canonical question-level
plain-text note and gains an optional `annotations` array. Both remain inside
the existing question record, so legacy schema-v32 workspaces load unchanged,
workspace persistence stays in IndexedDB, and portable JSON backup continues to
include the metadata without a schema bump. Device-preference localStorage must
never contain annotation or note content.

**Canonical text annotation.** Each annotation records `id`, `target`
(`stem`, `explanation`, or `option`), `optionKey` only for option targets,
`startOffset`, `endOffset`, `exactText`, bounded `prefix` and `suffix` context,
a semantic `tone` token (not a raw color), `createdAt`, `updatedAt`,
`sourceTextHash`, and `status` (`active` or `needs-repair`). An optional
`note` may be linked to the annotation. IDs and timestamps are supplied by the
caller so tests and merge behavior are deterministic.

**Anchoring and reconciliation.**

1. When the stored source hash matches, accept offsets only if the exact stored
   text still occupies that range.
2. Otherwise find occurrences of `exactText` and require prefix/suffix context
   to identify exactly one candidate.
3. Never select a nearest occurrence or silently move to an ambiguous match.
   Zero or multiple valid matches become `needs-repair`; the original excerpt,
   offsets, context, and note remain intact for manual re-anchoring or deletion.

Source corrections and parser reruns therefore preserve learner content. A
source revision containing the same text reuses the anchor; a small shift can
re-anchor through exact text plus context; ambiguity is surfaced.

**Notes and autosave.** Q2b-1 uses plain text only. The question-level note is
edited separately from per-attempt notes, saves on an explicit debounced
autosave boundary, exposes `Saving`/`Saved` status through a polite live region,
and preserves timestamps through the enclosing question update. No rich-text,
AI interpretation, or medical-content transformation is permitted.

**Backup and merge.** Replace restore preserves normalized notes and annotation
metadata. Merge unions annotations by `id`; identical IDs never duplicate and
the later `updatedAt` wins while attempts retain their existing fingerprint
merge. Older backups with no annotation fields remain valid. Q2b-1 contains no
binary payload. Q2b-2 must make attachment inclusion explicit and warn on
missing/corrupt blobs without deleting metadata.

**Attachment lifecycle (Q2b-2, not Q2b-1).** Binary images live in a separate
IndexedDB object store, never base64 in the workspace. Metadata records
`id`, `questionId`, optional `annotationId`, filename, MIME type, byte size,
checksum, optional dimensions, alt text/decorative intent, and `createdAt`.
Allowed MIME types, size/quota limits, object-URL revocation, question/
annotation deletion cleanup, orphan scans, and explicit portable-backup
inclusion are mandatory. Creating that store is the point at which an
IndexedDB/schema migration must be reviewed.

**Deletion and repair.** Deleting an annotation removes only its metadata in
Q2b-1. Deleting a question removes its embedded annotation metadata naturally.
Once attachments exist, both operations enqueue or perform deterministic blob
cleanup; unreachable blobs must be detectable and removable without touching
reachable content. Repair never discards the original annotation.

**Accessibility and responsive acceptance.** Highlight meaning is exposed by
text/semantics as well as tone. Highlight controls have names and pressed
states; keyboard text selection can open the toolbar; popovers restore focus;
note autosave status is polite; image notes later require alt text or deliberate
decorative marking. The surfaces must reflow at 390px and 200%-equivalent zoom,
remain usable in dark/light themes, and introduce no motion dependency.

**Checkpoint sequence.**

- **Q2b-0:** this architecture, canonical types, normalization and reconciliation
  contract.
- **Q2b-1:** persistent stem/explanation highlights plus plain question notes;
  reload, correction, backup/merge, keyboard, and mobile proof.
- **Q2b-2:** image attachment/blob store, quota UI, explicit backup inclusion,
  and orphan cleanup.
- **Q2b-3:** normalized user-tag ownership, case-insensitive dedupe, bulk
  add/remove, keyboard filters, and deterministic set creation.
- **Q2b-4:** integrated attachment backup/restore/merge and lifecycle fault
  recovery.
- **Q2b-5:** final player/detail-modal annotation UX and complete responsive
  acceptance pass.

**Q2b-1 acceptance.** Stem and explanation highlights survive reload, attempts,
and answer-mapping corrections; exact-text/context reconciliation handles small
source shifts and refuses ambiguity; deletion stays deleted; notes autosave and
restore; portable replace and merge preserve metadata without duplicate IDs;
legacy v32 data loads; no annotation data enters preference localStorage; and
keyboard/mobile/high-contrast semantics are verified. Parser/trust policy,
attachments, OCR, AI annotations, cloud/accounts, Course Central, Tutor Mode
redesign, exam simulation, dependencies, backup format, and schema version are
explicitly excluded.

**Q2b-1 final integration & rendered acceptance (2026-07-17, Opus).** The
checkpoint was left uncommitted pending the rendered browser journey, which is
now complete. Source-integrity audit (against actual files, not the diff
viewer) confirmed the flagged risks are clean: exactly **one** `QuizCalculator`
mount, **one** stem render (`AnnotatedQuestionText`), **one** explanation render
(`QuizFeedback` uses `explanationContent ?? explanation`), no malformed
ternaries, and `localAnnotations`/`pool` kept in sync on annotation writes.
Rendered journey (real DOM text-selection, tutor block): two non-overlapping
stem highlights (yellow + cyan) + one explanation highlight (purple) each render
as a single semantic `<mark tabindex=0 aria-label>` with an underline cue and
**unaltered source text**; tones are distinct/legible in dark, light (live
switch), and 390px mobile (no horizontal overflow); marks are keyboard-focusable
with a visible ring; A–E answer shortcuts still work; advancing focuses the new
stem. **5th defect found + fixed during this pass:** a question note was saved to
the store but not the in-run `pool` snapshot (unlike annotations), so it vanished
when navigating away and back within a block — ExamRunner's notes `onSave` now
also updates the pool; verified live (note survives Next→Previous). Anchoring
degrades to `needs-repair` (never nearest-guessed) for ambiguous/removed source,
verified by a reconcile probe. **Independent Fable rendered review: ACCEPT,
commit as-is** — one INFO/LOW non-blocking note: overlapping an existing
highlight persists a stored-but-unrendered annotation (render-time skip keeps it
safe/uncorrupted); an optional overlap guard in `saveAnnotation` is a Q2b
carry-forward. Gates: typecheck 0 · lint 0 · **vitest 835/835** · e2e 6/6 ·
build ✓ · verify:question-imports (100% exact, falseReady 0, allACollapse false)
· verify:daily-games-offline (`workspaceLocalStorageKeys: []`) ·
verify:daily-games-bundle (isolated) · diff-check clean · schema **v32**. The
unrelated WebdriverIO harness in the tree (package.json/lock, wdio.conf.ts,
test/, artifacts/, .nvmrc, root tsconfig.json) was **excluded** from the commit.

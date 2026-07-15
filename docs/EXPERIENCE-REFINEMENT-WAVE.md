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
| E2f | Typography scale & rhythm (identity foundation — do not interrupt) | **next** |
| E2g | Icon language: optical sizing, stroke, alignment, interactive usage | queued |
| E3 | Dashboard mission control (Welcome hierarchy + Command Brief presentation + focused widgets + identity) | queued |
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

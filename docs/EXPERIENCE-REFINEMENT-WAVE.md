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
| E2e | Bespoke-shadow long tail (rendered before/after required) | next |
| E3 | Dashboard Welcome → mission control hierarchy | queued |
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

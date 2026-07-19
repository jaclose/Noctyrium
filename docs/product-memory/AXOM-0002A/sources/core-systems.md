# AXOM-0002 Phase A — Core and Non-Question Product Evidence Catalogue

**Scope:** Read-only institutional-memory mining for the non-Question product.
This is evidence, not a populated backlog and not Product Owner acceptance.
No AX IDs are assigned here.

**Sources reviewed completely for this catalogue:** `README.md`, `FEATURES.md`,
`ROADMAP.md`, `IMPLEMENTATION_AUDIT.md`,
`PRODUCT_RESEARCH_AND_OPPORTUNITIES.md`, `CHANGELOG.md`,
`docs/PRE-ALPHA-CONTRACT.md`, `docs/COMMAND-BRIEF-EVIDENCE.md`,
`docs/COURSE-CENTRAL-ARCHITECTURE.md`,
`docs/DASHBOARD-WIDGET-ARCHITECTURE.md`,
`docs/JOURNAL-NOTEBOOK-ARCHITECTURE.md`,
`docs/PRODUCTIVITY-ARCHITECTURE.md`,
`docs/DAILY-LOOP-REMINDER-LIFECYCLE.md`,
`docs/TARGET-CONTRIBUTION-LEDGER.md`, `docs/UPDATE-POLICY.md`,
`docs/ALPHA-RELEASE.md`, and the ratified governing layer.

## Handling rules used

- This catalogue uses the ratified category spelling `Polish`, not the Phase A
  prompt's phrase `Product Polish`; that naming conflict is recorded below for
  the Product Owner rather than silently resolved.
- `Verified` is never inferred from “shipped,” “implemented,” or “working.”
  Under `AX-0001`, verification additionally requires acceptance criteria,
  regression gates, independent review, browser verification when applicable,
  and Product Owner acceptance.
- `P0`–`P3` and one of the eight canonical boards are supplied only when an
  authoritative source explicitly supplies the canonical value. Older terms
  such as “next,” “blocked,” “Tier 1,” and “core” are preserved as historical
  evidence, not silently translated.
- “Evidenced DNA” below records source language that can support Product DNA.
  It is not a substitute for Product Owner-authored immutable Product DNA.
- Source references use repository-relative path and exact line range.
- Question Bank/import/parser/quiz-specific candidates are intentionally
  excluded to avoid duplicate ownership with the Question-system evidence pass.

## A. Core product and institutional truths

### C-01 — Local-first academic operating system

- **Provisional category / area:** Product Decision / Core Product
- **Observed status:** Binding product identity; current pre-beta implementation
  is local-first.
- **Priority / board:** No canonical `P0`–`P3` or board assignment found.
- **Evidenced DNA:** AXOM is a private academic operating system for
  high-pressure learners; it should remain useful without an account, provider,
  or network. Intended feeling: the learner owns a dependable system rather
  than renting access to their own work.
- **Product truth / core promise:** Local Vault is primary; cloud capability is
  optional. Critical studying cannot depend on cloud availability.
- **Observable acceptance / success evidence:** App remains usable without
  `DATABASE_URL`; local Workspace persists independently of app code; optional
  remote features are honestly unavailable when not configured.
- **Evidence:** `README.md:3-6,23-36,98-99`;
  `docs/PRE-ALPHA-CONTRACT.md:53-62`;
  `docs/governance/AX-0002-CONSTITUTION.md:47-51`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:211-225`.
- **Conflict / unknown:** README still describes optional name-only cloud sync,
  while primary Settings deliberately makes no cloud/account claim. Owner must
  decide whether the cloud scaffold remains one future record or is rejected.
- **Dedupe key:** `core/local-first-academic-operating-system`
- **Record readiness:** Owner Decision Required for canonical priority, board,
  immutable Product DNA, impact, and whether cloud scaffolding is related or
  excluded.

### C-02 — Daily academic operating loop

- **Provisional category / area:** Product Decision / Daily Loop
- **Observed status:** Implemented product center of gravity; accepted/no-regress
  surface.
- **Priority / board:** Historical “daily workflow” is Alpha Tier 1 critical,
  but no canonical `P0`–`P3` or board is assigned.
- **Evidenced DNA:** Central job: “open the app overwhelmed → leave with one
  clear next move.” Loop: Open → Orient → Commit → Study → Capture → Review →
  Recover → Return tomorrow.
- **Product truth / core promise:** AXOM is not a widget collection; each visit
  should reduce triage and deposit evidence that improves the next visit.
- **Observable acceptance / success evidence:** Before studying, one decision;
  during studying, reliable session and capture; after studying, a bounded
  closeout that seeds tomorrow.
- **Evidence:** `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md:3-6,73-89`;
  `CHANGELOG.md:37-58`; `docs/PRE-ALPHA-CONTRACT.md:43-49,164-174`.
- **Conflict / unknown:** None on intent. Owner must still assign canonical
  priority/board and decide whether this is one product-decision record with
  child feature records.
- **Dedupe key:** `core/daily-operating-loop`
- **Record readiness:** Strong evidence; Owner Decision Required for Product DNA
  wording and canonical placement.

### C-03 — Six-system product model

- **Provisional category / area:** Product Decision / Core Product
- **Observed status:** Binding pre-Alpha contract.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Every capability should strengthen a coherent system; no
  isolated checkbox features.
- **Product truth / core promise:** Universal Import, Course Central/Tracker,
  Command Brief/Daily Loop, Academic Mastery/Reports, Journal/Reflection, and
  Knowledge Graph are the six product systems; the product itself is one
  operating system.
- **Observable acceptance / success evidence:** Proposed work maps to one
  system, strengthens another capability, and answers whether it helps the
  student study better today.
- **Evidence:** `docs/PRE-ALPHA-CONTRACT.md:38-62`;
  `docs/governance/AX-0002-CONSTITUTION.md:115-119`.
- **Conflict / unknown:** The newly ratified Constitution is higher institutional
  authority than the older pre-Alpha contract, but no conflict is observed.
  Knowledge Graph evidence is outside this assigned source set.
- **Dedupe key:** `core/six-system-model`
- **Record readiness:** Owner Decision Required for whether this belongs as a
  backlog Product Decision or remains wholly governed by existing authority.

### C-04 — Explainable, evidence-identical recommendations

- **Provisional category / area:** Product Decision / Cross-product
- **Observed status:** Binding no-black-box rule; implemented in Command Brief.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Trust compounds when the learner can see why. Complexity
  belongs inside the system, but consequential logic must remain inspectable.
- **Product truth / core promise:** Every major recommendation exposes the exact
  evidence/contribution rows used, not a reconstructed rationale.
- **Observable acceptance / success evidence:** Learner can answer why a
  recommendation, score, lecture, or priority changed; displayed evidence and
  the decision calculation are identical.
- **Evidence:** `docs/PRE-ALPHA-CONTRACT.md:64-108`;
  `docs/COMMAND-BRIEF-EVIDENCE.md:57-74`;
  `docs/governance/AX-0002-CONSTITUTION.md:55-59`.
- **Conflict / unknown:** Scope beyond current recommendation engines is not
  enumerated.
- **Dedupe key:** `core/explainable-evidence-identical-decisions`
- **Record readiness:** Strong decision evidence; Owner Decision Required for
  scope, priority, board, and immutable Product DNA.

### C-05 — Calm recovery without shame or attention competition

- **Provisional category / area:** Product Decision / Experience
- **Observed status:** Permanent design philosophy; recovery behavior
  implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** AXOM quietly organizes attention, reduces uncertainty, and
  never scolds a learner who is behind.
- **Product truth / core promise:** Recovery sorts, shrinks, and restarts work.
  Streak guilt, red-alert theatrics, and competitive leaderboards do not drive
  the core loop.
- **Observable acceptance / success evidence:** Recovery language is factual and
  editable; fresh users are not assigned missed history; leaderboards remain
  deprioritized/hidden.
- **Evidence:** `docs/PRE-ALPHA-CONTRACT.md:64-92`;
  `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md:21-23,27-36`;
  `FEATURES.md:398-422`; `ROADMAP.md:82-84`.
- **Conflict / unknown:** Leaderboards are “proposed” in the old roadmap but
  explicitly deprioritized; this should be recorded as a historical rejection
  decision only if the Product Owner confirms `Rejected`.
- **Dedupe key:** `core/calm-non-shaming-experience`
- **Record readiness:** Owner Decision Required for leaderboards’ canonical
  status and record boundaries.

### C-06 — Honest capability boundaries

- **Provisional category / area:** Product Decision / Cross-product
- **Observed status:** Accepted and repeated across shipped surfaces.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Trust over cleverness; a visible unknown is safer than a
  confident invention.
- **Product truth / core promise:** AXOM does not fake OCR, AI, cloud sync,
  integration, update capability, metrics, or evidence. Locked/deferred
  surfaces state their real boundary.
- **Observable acceptance / success evidence:** No canned output is labeled AI;
  unsupported data remains unknown; unavailable integrations are non-actionable
  and plainly labeled; no invented percentages or seed-derived user claims.
- **Evidence:** `README.md:64-78`; `FEATURES.md:539-568`;
  `docs/UPDATE-POLICY.md:8-15`;
  `docs/governance/AX-0002-CONSTITUTION.md:55-59`;
  `docs/governance/AX-0010-UX-STANDARDS.md:227-241`.
- **Conflict / unknown:** None.
- **Dedupe key:** `core/honest-capability-boundaries`
- **Record readiness:** Strong decision evidence; owner-owned DNA/priority/board
  still required.

### C-07 — AXOM identity with frozen compatibility identifiers

- **Provisional category / area:** Product Decision / Identity
- **Observed status:** Implemented and shipped.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Release-facing identity is AXOM; internal legacy identifiers
  remain when changing them could strand data.
- **Product truth / core promise:** Branding can evolve without sacrificing
  continuity or user data.
- **Observable acceptance / success evidence:** User-facing packages and UI say
  AXOM; legacy persisted keys remain compatible; real user names are never
  rewritten by branding migrations.
- **Evidence:** `README.md:8-10`; `CHANGELOG.md:3-16`;
  `FEATURES.md:510-537`.
- **Conflict / unknown:** README exposes a legacy hosted Noctyrium URL
  (`README.md:151-156`); whether that is Product Debt or an accepted temporary
  release boundary needs owner classification.
- **Dedupe key:** `identity/axom-brand-compatibility`
- **Record readiness:** Owner Decision Required for priority/board and legacy URL
  disposition.

## B. Command Brief, productivity, and the daily loop

### C-08 — Command Brief: one grounded next action

- **Provisional category / area:** Feature / Command Brief
- **Observed status:** Implemented; accepted/no-regress.
- **Priority / board:** Historical Alpha Tier 1 critical, no canonical mapping.
- **Evidenced DNA:** Remove daily triage. Intended user outcome: “I know what to
  do next and why.”
- **Product truth / core promise:** One supported next action, reason, effort,
  outcome, and smaller fallback; never presented as AI unless AI contributed.
- **Observable acceptance / success evidence:** Deterministic ranking; visible
  exact evidence; stable tie behavior; explicit user action before any state
  mutation.
- **Evidence:** `docs/COMMAND-BRIEF-EVIDENCE.md:3-16,57-74,87-93`;
  `FEATURES.md:398-401`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:355-370`.
- **Conflict / unknown:** Older “Next Best Move” wording versus canonical
  “next action” should follow the Lexicon unless an approved UI exception exists.
- **Dedupe key:** `command-brief/one-grounded-next-action`
- **Record readiness:** Strong acceptance evidence; Owner Decision Required for
  canonical priority/board/DNA.

### C-09 — Command Brief evidence activation and Learning state

- **Provisional category / area:** Feature / Command Brief
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** An empty or seed-only workspace should be taught, not
  diagnosed.
- **Product truth / core promise:** Brief activates only from real rankable
  evidence; limited evidence requires explicit user override.
- **Observable acceptance / success evidence:** Two actionable items, or one
  actionable item plus current context, activate automatically; seed/template
  items do not; pre-activation shows a concrete checklist.
- **Evidence:** `docs/COMMAND-BRIEF-EVIDENCE.md:13-38`;
  `FEATURES.md:21-30`.
- **Conflict / unknown:** Threshold changes would be a product decision; none are
  authorized by current evidence.
- **Dedupe key:** `command-brief/evidence-activation-learning-state`
- **Record readiness:** Acceptance is unusually complete; owner placement and
  immutable DNA remain required.

### C-10 — AI-proposed Command Brief review overlay

- **Provisional category / area:** Feature / Command Brief + AI
- **Observed status:** `next`; proposal/validator exists but review surface is
  not shipped.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** AI may propose, but cannot bypass deterministic trust or
  mutate plans without review.
- **Product truth / core promise:** Provider-backed proposals remain visibly
  distinct from AXOM’s deterministic calculation.
- **Observable acceptance / success evidence:** Proposal is labeled, editable or
  rejectable, schema-valid, evidence-bearing, and cannot bypass the normal
  activation/review boundary.
- **Evidence:** `ROADMAP.md:51-58`;
  `docs/COMMAND-BRIEF-EVIDENCE.md:87-93`;
  `FEATURES.md:424-434`.
- **Conflict / unknown:** No sourced user feeling, success metric, or UI
  acceptance details.
- **Dedupe key:** `command-brief/ai-proposal-review-overlay`
- **Record readiness:** **Reconstruction note only** until owner supplies
  Product DNA, priority/board, and acceptance details.

### C-11 — Reload-safe Study Sessions

- **Provisional category / area:** Feature / Study Sessions
- **Observed status:** Implemented.
- **Priority / board:** Historically ranked second-highest daily-use feature;
  no canonical priority.
- **Evidenced DNA:** A focus record must survive interruption and tell the truth
  about elapsed work.
- **Product truth / core promise:** A Study Session preserves absolute-time
  segments, source/context, quick logs, and optional completion capture; it is
  distinct from a Quiz Session and Pomodoro interval.
- **Observable acceptance / success evidence:** Survives tab switching, sleep,
  reload, and update; stale overnight time is visibly capped; pause/resume and
  completion context persist.
- **Evidence:** `CHANGELOG.md:47-52`;
  `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md:14-16,60-62,73-79`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:374-388`.
- **Conflict / unknown:** No explicit user-facing success metric.
- **Dedupe key:** `study-session/reload-safe-truthful-focus-record`
- **Record readiness:** Strong behavior evidence; Owner Decision Required for
  placement, DNA, and metric.

### C-12 — Optional Daily Check-In and learner-authored Daily Focus

- **Provisional category / area:** Feature / Daily Check-In
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** The learner states what matters today; AXOM does not infer
  an intention.
- **Product truth / core promise:** Optional morning entry captures intention,
  up to three win conditions, and context; skipping leaves the day neutral.
- **Observable acceptance / success evidence:** Explicit save only; “Use my
  targets” creates a plan only from chosen targets; no prompt marks a skipped
  day as failure.
- **Evidence:** `FEATURES.md:41-50`;
  `docs/DAILY-LOOP-REMINDER-LIFECYCLE.md:71-86`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:392-404`.
- **Conflict / unknown:** Binding pre-Alpha directive lists energy, sleep,
  nutrition, and wellbeing (`docs/PRE-ALPHA-CONTRACT.md:136-138`), while shipped
  contract lists study block, priority, obstacle, note, and commitment but does
  not establish those health fields. **Owner Decision Required:** partial scope
  or intentionally deferred wellbeing inputs.
- **Dedupe key:** `daily-loop/optional-check-in-daily-focus`
- **Record readiness:** Conflict must be preserved; do not mark fully accepted
  until owner decides intended field scope.

### C-13 — Device-local daily-loop reminders

- **Provisional category / area:** Feature / Daily Loop
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Help the learner return without cloud dependence,
  interruption, or pressure.
- **Product truth / core promise:** Morning/evening reminders are optional,
  configurable, local, non-blocking, deduplicated, quiet-hours aware, and never
  themselves mutate learner work.
- **Observable acceptance / success evidence:** Correct local-day eligibility;
  closeout takes precedence after evening; snooze/skip/open actions; no duplicate
  prompts; only bounded presentation metadata enters device storage.
- **Evidence:** `docs/DAILY-LOOP-REMINDER-LIFECYCLE.md:3-69,84-86`;
  `FEATURES.md:41-50`.
- **Conflict / unknown:** No product-level notification or background-service
  commitment is evidenced; current contract explicitly has no server alarm or
  cloud push.
- **Dedupe key:** `daily-loop/device-local-reminders`
- **Record readiness:** Strong acceptance evidence; owner priority/board/DNA
  required.

### C-14 — Bounded Daily Closeout

- **Provisional category / area:** Feature / Daily Closeout
- **Observed status:** Implemented.
- **Priority / board:** Historically ranked third-highest daily-use feature; no
  canonical priority.
- **Evidenced DNA:** Convert today’s chaos into tomorrow’s first decision in
  30–90 seconds.
- **Product truth / core promise:** Closeout records wins, remaining work,
  blockers, tomorrow’s first task, and optional energy; Journal save is opt-in.
- **Observable acceptance / success evidence:** Completes within a bounded flow;
  feeds tomorrow’s brief; never overwrites an existing page; opening alone
  creates nothing.
- **Evidence:** `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md:14-17,62-63,75-79`;
  `CHANGELOG.md:53-54`;
  `docs/DAILY-LOOP-REMINDER-LIFECYCLE.md:78-86`.
- **Conflict / unknown:** No quantified adoption metric is sourced.
- **Dedupe key:** `daily-loop/bounded-closeout`
- **Record readiness:** Strong acceptance evidence; owner metric/priority/board
  required.

### C-15 — Calm Recovery Protocol

- **Provisional category / area:** Feature / Recovery
- **Observed status:** Implemented.
- **Priority / board:** Historically ranked fifth-highest daily-use feature; no
  canonical priority.
- **Evidenced DNA:** Recovery should be strongest when the learner falls behind,
  never a shame surface.
- **Product truth / core promise:** Detect grounded overload, show assumptions,
  offer editable triage plus 24-hour restart and 72-hour stabilization, and
  never delete tasks.
- **Observable acceptance / success evidence:** Fresh workspaces manufacture no
  backlog; user may keep/reduce/dismiss/restore; plans remain optional and
  explainable.
- **Evidence:** `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md:21-23,62-64,73-79`;
  `FEATURES.md:405-410`; `CHANGELOG.md:55-58`.
- **Conflict / unknown:** Scheduled-hours evidence is currently absent; related
  proposed model is catalogued separately.
- **Dedupe key:** `recovery/calm-editable-restart`
- **Record readiness:** Strong evidence; owner success metric and placement
  required.

### C-16 — Configurable, neutral daily success

- **Provisional category / area:** Feature / Daily Progress
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Daily progress should reflect the learner’s own chosen
  signals without retroactive or default failure.
- **Product truth / core promise:** Requirements are optional, scheduled,
  tracking-start bounded, and neutral when empty.
- **Observable acceptance / success evidence:** One canonical evaluation feeds
  Productivity, Dashboard, and Reports; pre-tracking/off-schedule days do not
  fail; no default card/Anki requirement for new profiles.
- **Evidence:** `FEATURES.md:152-180`;
  `docs/TARGET-CONTRIBUTION-LEDGER.md:77-92`.
- **Conflict / unknown:** “Daily success,” “Today’s Targets,” and older
  “todayScore” labels need canonical term review; Lexicon has not defined daily
  success.
- **Dedupe key:** `daily-progress/configurable-neutral-success`
- **Record readiness:** Owner term choice, metric, priority, and board required.

### C-17 — Canonical target contribution ledger

- **Provisional category / area:** Feature / Today’s Targets
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Learners can see exactly what counted and correct a match
  without losing source history.
- **Product truth / core promise:** Native-unit, deterministic, inspectable
  contributions feed all daily target surfaces; derived ledger is not a second
  activity database.
- **Observable acceptance / success evidence:** Exact aliases; stable
  deduplication; explicit reassignment/undo/restore/manual facts; original
  activity, habit, Journal, question, and timer records remain untouched.
- **Evidence:** `docs/TARGET-CONTRIBUTION-LEDGER.md:1-27,29-75,77-105`;
  `FEATURES.md:31-40`.
- **Conflict / unknown:** No success metric is sourced beyond deterministic
  correctness.
- **Dedupe key:** `daily-targets/canonical-contribution-ledger`
- **Record readiness:** Acceptance is detailed; owner priority/board/DNA/metric
  still required.

### C-18 — Fast manual activity logging

- **Provisional category / area:** Feature / Productivity
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Capturing work should be faster than maintaining a planning
  system.
- **Product truth / core promise:** One dominant task-first logging path with
  optional duration, quantity, note, and honest units.
- **Observable acceptance / success evidence:** Neutral before first eligible
  activity; cards/questions/custom quantities supported; placeholders stop when
  they would distract.
- **Evidence:** `FEATURES.md:160-170`;
  `CHANGELOG.md:104-105`;
  `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md:34-36`.
- **Conflict / unknown:** Historical native daily-file architecture is obsolete
  for the web product and should not be merged into this record without owner
  confirmation.
- **Dedupe key:** `productivity/fast-manual-activity-log`
- **Record readiness:** Owner priority/board/DNA/success metric required.

### C-19 — Recent and frequent activity shortcuts

- **Provisional category / area:** Feature / Productivity
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Repeated logging should get faster without creating a
  separate configuration burden.
- **Product truth / core promise:** History derives bounded, deduplicated,
  one-tap configurations; removing a shortcut never deletes history.
- **Observable acceptance / success evidence:** Up to three recent and two
  frequent configurations; notes excluded from identity; frequency requires
  three uses.
- **Evidence:** `FEATURES.md:168-170`.
- **Conflict / unknown:** No explicit user feeling or success metric.
- **Dedupe key:** `productivity/recent-frequent-shortcuts`
- **Record readiness:** **Reconstruction note only** until owner supplies
  Product DNA, priority/board, and metric.

### C-20 — Reliable Pomodoro and configurable focus presets

- **Provisional category / area:** Feature / Pomodoro
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Visible counters must preserve trust across routes, sleep,
  reload, and background throttling.
- **Product truth / core promise:** Root-owned, wall-clock-reconciled focus and
  break timer with quick/custom presets; a Pomodoro interval is not a Study
  Session.
- **Observable acceptance / success evidence:** Exactly one completion log;
  accurate across visibility/focus/pageshow/reload; deterministic long-break
  cadence; run-once custom preset does not mutate profile; backup round-trip.
- **Evidence:** `FEATURES.md:171-176,413-417`;
  `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md:14-16`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:374-380`.
- **Conflict / unknown:** `IMPLEMENTATION_AUDIT.md:59-61` documents older
  one-tick drift and heavy writes; current shipped evidence claims the root
  lifecycle repair. Treat old audit as superseded history, not a live defect.
- **Dedupe key:** `pomodoro/reliable-wall-clock-presets`
- **Record readiness:** Strong behavior evidence; owner success metric and
  placement required.

### C-21 — Fair habit tracking

- **Provisional category / area:** Feature / Habits
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** A learner is never blamed for a day before the habit
  existed.
- **Product truth / core promise:** Tracking, streaks, adherence, heatmaps, and
  recovery floor at a legitimate start date and preserve a creation-day grace
  boundary.
- **Observable acceptance / success evidence:** Pre-creation days excluded;
  malformed legacy records use earliest evidence; explicit misses still count.
- **Evidence:** `FEATURES.md:418-422`; `ROADMAP.md:152-156`.
- **Conflict / unknown:** Habit Tracker is described as experimental in
  `IMPLEMENTATION_AUDIT.md:30-31`, but later shipped evidence treats it as
  functional. Owner should decide current module maturity label.
- **Dedupe key:** `habits/fair-tracking-start`
- **Record readiness:** Maturity conflict and canonical placement need owner
  decision.

### C-22 — Grounded learner readiness

- **Provisional category / area:** Feature / Readiness
- **Observed status:** Implemented deterministic foundation; future evolution
  referenced.
- **Priority / board:** No canonical priority.
- **Evidenced DNA:** Capacity may resize a suggestion, never silently rewrite
  the learner’s work or infer health meaning from unconfirmed language.
- **Product truth / core promise:** Readiness is an explainable capacity signal,
  not proof of learning or a diagnosis.
- **Observable acceptance / success evidence:** Neutral baseline ignored;
  grounded/user-confirmed evidence only; calculation and threshold visible;
  user can review, restore, update, or inspect; saved data unchanged by
  presentation suggestion.
- **Evidence:** `FEATURES.md:490-494`;
  `docs/COMMAND-BRIEF-EVIDENCE.md:70-74`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:601-630`.
- **Conflict / unknown:** Older energy engine used Journal signals
  (`IMPLEMENTATION_AUDIT.md:20`), while current contract excludes unconfirmed
  Journal language. Current shipped rule appears to supersede the old audit.
- **Dedupe key:** `readiness/grounded-user-controlled-capacity`
- **Record readiness:** Strong current behavior; future evolution requires
  separate evidence.

### C-23 — Honest progressive Reports

- **Provisional category / area:** Feature / Reports
- **Observed status:** Implemented; accepted/no-regress.
- **Priority / board:** Historical Alpha Tier 2 strongly recommended; no
  canonical mapping.
- **Evidenced DNA:** A metric should help the learner understand progress without
  manufacturing failure from missing history.
- **Product truth / core promise:** Metrics retain meaning, status,
  interpretation, denominator, source, and eligible time boundaries.
- **Observable acceptance / success evidence:** Today/Trend/Study sections;
  keyboard/touch detail; tracking-start floors; no pre-tracking or off-schedule
  failures; low-data states remain neutral.
- **Evidence:** `FEATURES.md:103-107,177-180`;
  `docs/PRE-ALPHA-CONTRACT.md:43-49,164-174`.
- **Conflict / unknown:** Reports 2.0 remains referenced but its detailed
  wireframes are outside this assigned source set. Do not infer its scope.
- **Dedupe key:** `reports/honest-progressive-analytics`
- **Record readiness:** Existing behavior is well evidenced; future Reports 2.0
  belongs in a separate reconstruction note.

### C-24 — Scheduled-hours workload model

- **Provisional category / area:** Research / Recovery + Planning
- **Observed status:** Proposed.
- **Priority / board:** Roadmap says proposed; canonical board/priority absent.
- **Evidenced DNA:** Recovery estimates should reflect real planned capacity and
  expose assumptions.
- **Product truth / core promise:** No true calendar-backed planned-hours field
  exists today; current output must remain labeled as an estimated range.
- **Observable acceptance / success evidence:** A future model distinguishes
  scheduled hours from item counts and configured daily targets; provenance and
  uncertainty remain visible.
- **Evidence:** `ROADMAP.md:89-92`; `FEATURES.md:553-555`.
- **Conflict / unknown:** Product DNA, scope, success metric, calendar ownership,
  and priority are absent.
- **Dedupe key:** `planning/scheduled-hours-workload-model`
- **Record readiness:** **Reconstruction note only.**

## C. Dashboard and widget system

### C-25 — Fixed Dashboard orientation and primary-action hierarchy

- **Provisional category / area:** Product Decision / Dashboard
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** On opening, the learner should immediately know the day’s
  context and best supported next action.
- **Product truth / core promise:** Welcome + Quote and Command Brief remain
  above and outside the editable grid so customization cannot remove
  orientation or the primary action.
- **Observable acceptance / success evidence:** Dashboard answers in order:
  what matters now, how today is going, where to act next; fixed surfaces remain
  available in every preset.
- **Evidence:** `docs/DASHBOARD-WIDGET-ARCHITECTURE.md:8-15,49-73`;
  `FEATURES.md:60-69,181-183`.
- **Conflict / unknown:** The owner’s later conversation mentions moving the
  quote relative to Command Brief, but that conversation is not in this agent’s
  accessible source set. Preserve for conversation mining; do not choose here.
- **Dedupe key:** `dashboard/fixed-orientation-primary-action`
- **Record readiness:** Current fixed-surface contract is explicit; relative
  ordering conflict awaits conversation evidence/owner decision.

### C-26 — Customizable Dashboard widget engine

- **Provisional category / area:** Feature / Dashboard
- **Observed status:** Implemented; architecture document originally said
  independent acceptance pending.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Personalization changes attention, never source data; power
  remains accessible without making the dashboard cognitively expensive.
- **Product truth / core promise:** Four sizes, meaningful settings, presets,
  add/remove, deterministic order, and compatibility-safe persistence.
- **Observable acceptance / success evidence:** Keyboard reorder and polite
  position announcement; 390px one-column layout; focus-contained settings;
  fourth-XL advisory remains overridable; backup/merge preserves choices;
  customization never deletes module data.
- **Evidence:** `docs/DASHBOARD-WIDGET-ARCHITECTURE.md:75-125,143-180`;
  `FEATURES.md:60-69`.
- **Conflict / unknown:** `ROADMAP.md:85` proposes richer widget-specific
  settings/touch drag; current dependable mobile path remains keyboard controls.
- **Dedupe key:** `dashboard/customizable-widget-engine`
- **Record readiness:** Existing feature and future refinement should be two
  records; owner must define future scope and status.

### C-27 — Remove redundant or misleading Dashboard widgets

- **Provisional category / area:** Product Decision / Dashboard
- **Observed status:** Implemented presentation decision with compatibility
  retention.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Every card earns its space; duplicate or ungrounded
  suggestions must not compete with Command Brief.
- **Product truth / core promise:** Suggested moves, AI actions, duplicate trend
  cards, and raw diagnostics stay out of ordinary catalogs while inert legacy
  preferences remain recoverable.
- **Observable acceptance / success evidence:** No user-facing `aiActions` or
  legacy suggested card; one canonical Weekly Trend; removing presentation
  never removes source records or unknown fields.
- **Evidence:** `docs/DASHBOARD-WIDGET-ARCHITECTURE.md:18-47,125-126,155-163`;
  `IMPLEMENTATION_AUDIT.md:119-127`.
- **Conflict / unknown:** None in current evidence.
- **Dedupe key:** `dashboard/remove-redundant-misleading-widgets`
- **Record readiness:** Strong decision evidence; owner placement and canonical
  Product DNA required.

### C-28 — Contextual Dashboard catalog

- **Provisional category / area:** Feature / Dashboard
- **Observed status:** Implemented catalog, with some future refinement.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Show capability when it is useful; do not fill the dashboard
  with empty percentages or irrelevant modules.
- **Product truth / core promise:** Daily, study, wellbeing, safety, game, and
  path-specific widgets appear honestly and contextually.
- **Observable acceptance / success evidence:** Conditional exam/pre-med cards;
  honest empty states; Local Data Health hidden by default; focused preset
  favors daily action; no unsupported renderer is fabricated.
- **Evidence:** `docs/DASHBOARD-WIDGET-ARCHITECTURE.md:23-40,49-73,113-125`.
- **Conflict / unknown:** This could be one catalog-level record or several
  independent widget records. Split only if the Product Owner supplies distinct
  Design Intent/acceptance for each widget.
- **Dedupe key:** `dashboard/contextual-widget-catalog`
- **Record readiness:** Owner Decision Required on record granularity.

### C-29 — Command Brief interaction hierarchy refinement

- **Provisional category / area:** Product Debt / Dashboard + Command Brief
- **Observed status:** Binding directive; completion not independently
  established by source.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** The most useful daily decision should feel immediately
  legible and premium.
- **Product truth / core promise:** Larger controls, clearer hierarchy, premium
  interaction, immediate usefulness, evidence always visible.
- **Observable acceptance / success evidence:** All five qualities are
  visibly present in dark/light and responsive states without competing CTAs.
- **Evidence:** `docs/PRE-ALPHA-CONTRACT.md:129-138`;
  `docs/DASHBOARD-WIDGET-ARCHITECTURE.md:8-15`.
- **Conflict / unknown:** “Premium interactions” is not measurable; no exact
  before/after evidence or owner-defined UX success metric.
- **Dedupe key:** `dashboard/command-brief-hierarchy-debt`
- **Record readiness:** **Reconstruction note only** until owner supplies
  measurable acceptance and status.

### C-30 — Route-level Dashboard performance containment

- **Provisional category / area:** Technical Debt / Performance
- **Observed status:** In progress/proposed; App shell remains over 500 kB.
- **Priority / board:** No canonical priority/board.
- **Evidenced DNA:** Dashboard should feel immediate; deferred modules should
  not tax first use.
- **Product truth / core promise:** Heavy work belongs off the startup path;
  Dashboard startup time must not increase.
- **Observable acceptance / success evidence:** Measured shell/startup budget;
  heavy imports lazy or backgrounded; no maintainability-destroying split.
- **Evidence:** `ROADMAP.md:64-67`;
  `docs/PRE-ALPHA-CONTRACT.md:143-146`;
  `FEATURES.md:564-568`.
- **Conflict / unknown:** No numeric startup budget or target bundle size is
  sourced.
- **Dedupe key:** `performance/dashboard-route-startup-containment`
- **Record readiness:** **Reconstruction note only** pending owner metric and
  priority.

## D. Course Tracker, Course Central, curriculum, and Blueprints

### C-31 — Learner-owned Course Tracker

- **Provisional category / area:** Feature / Course Tracker
- **Observed status:** Implemented; Alpha Tier 1 critical.
- **Priority / board:** Tier evidence exists, but no canonical `P0`–`P3`/board.
- **Evidenced DNA:** Course work should be trackable in the learner’s own
  workspace without turning AXOM into an LMS.
- **Product truth / core promise:** Course/term/module/Lecture/DLA/PQ progress,
  pass/mastery state, import/add/edit, and suggestions remain locally owned.
- **Observable acceptance / success evidence:** Add/import/edit flows, wider
  workspace, destination deduplication, group deletion choices, and grounded
  suggestions are available without a provider.
- **Evidence:** `README.md:12-21,34-36`;
  `FEATURES.md:118-125,396-412`;
  `CHANGELOG.md:136-140,176-191`;
  `docs/PRE-ALPHA-CONTRACT.md:164-174`.
- **Conflict / unknown:** “Course Tracker” is referenced but not canonically
  defined in AX-0009; only Course Central is. Lexicon gap requires owner action,
  not local invention.
- **Dedupe key:** `course-tracker/learner-owned-progress`
- **Record readiness:** Strong feature evidence; lexicon reference unavailable.

### C-32 — Course Central learner integration layer

- **Provisional category / area:** Feature / Course Central
- **Observed status:** Design/wireframe only; no live integration permission.
- **Priority / board:** Historical Alpha Tier 3 for live adapters; canonical
  priority/board absent.
- **Evidenced DNA:** “Bring schedules, announcements, assignments, resources,
  assessments, and curriculum progress into one learner-centered workspace.”
- **Product truth / core promise:** Calm, provenance-aware learner overlay;
  institutional systems remain authoritative; no live-LMS replacement claim.
- **Observable acceptance / success evidence:** One calm page; source labels on
  every item; learner actions connect evidence to tracker/calendar/tasks without
  copying legal authority into AXOM.
- **Evidence:** `docs/COURSE-CENTRAL-ARCHITECTURE.md:3-14,33-46,204-239`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:408-424`.
- **Conflict / unknown:** “Buildable now/next” in the architecture conflicts
  with the current instruction to reconstruct only; not implementation
  authorization.
- **Dedupe key:** `course-central/learner-integration-layer`
- **Record readiness:** Strong Product DNA and promise; owner priority/board and
  phase boundary required.

### C-33 — Institutional source truth and learner overlay boundary

- **Provisional category / area:** Product Decision / Course Central
- **Observed status:** Non-negotiable design boundary.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Learner control without pretending to replace legal or
  institutional truth.
- **Product truth / core promise:** AXOM owns planning, practice, mastery, and
  personal reflection; official curricula, grades, announcements, schedules,
  and compliance remain institutional truth.
- **Observable acceptance / success evidence:** Visible attribution; learner
  fields survive refresh; institutional changes raise visible updates; no
  credential scraping, hidden polling, endorsement claims, or unauthorized
  redistribution.
- **Evidence:** `docs/COURSE-CENTRAL-ARCHITECTURE.md:18-46,149-165`.
- **Conflict / unknown:** None.
- **Dedupe key:** `course-central/institution-truth-learner-overlay`
- **Record readiness:** Strong product-decision evidence; owner canonical
  placement/DNA still required.

### C-34 — Level 0 manual structured Course Central import

- **Provisional category / area:** Feature / Course Central
- **Observed status:** Planned/buildable, not claimed shipped.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Provide permanent value even when no institution offers a
  connector.
- **Product truth / core promise:** Learner-supplied schedules, exports,
  screenshots, announcements, and resource lists can enter locally with
  provenance; no institutional credentials are needed.
- **Observable acceptance / success evidence:** Manual inputs remain source
  attributed, reviewable, correctable, and usable as a no-connector fallback.
- **Evidence:** `docs/COURSE-CENTRAL-ARCHITECTURE.md:167-177,369-377`.
- **Conflict / unknown:** Screenshot extraction depends on OCR, which is not
  available; the product must preserve an honest manual/provenance-only path.
- **Dedupe key:** `course-central/level-0-manual-import`
- **Record readiness:** Owner acceptance details, supported formats, priority,
  and board missing.

### C-35 — Level 1 standard export integration

- **Provisional category / area:** Feature / Course Central
- **Observed status:** “Buildable next,” not implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Use portable institution-provided formats before privileged
  integrations.
- **Product truth / core promise:** ICS, CSV, course packages, outlines, and
  assignment/announcement exports remain read-only and provenance-aware.
- **Observable acceptance / success evidence:** Supported imports have truthful
  scope/freshness, no password storage, and a permanent fallback when an LMS is
  unavailable.
- **Evidence:** `docs/COURSE-CENTRAL-ARCHITECTURE.md:167-183,369-377`.
- **Conflict / unknown:** Exact formats and legal handling are not fully
  accepted; Common Cartridge support is only named.
- **Dedupe key:** `course-central/level-1-standard-exports`
- **Record readiness:** **Reconstruction note only** pending owner Product DNA,
  format scope, priority, and measurable acceptance.

### C-36 — Level 2 authorized read-only LMS connectors

- **Provisional category / area:** Research / Course Central
- **Observed status:** Blocked on explicit authorization and security review.
- **Priority / board:** Historical Tier 3/can wait; no canonical assignment.
- **Evidenced DNA:** Authorized convenience must not compromise credentials,
  privacy, local ownership, or institutional trust.
- **Product truth / core promise:** OAuth/API only, narrow scopes, revocation,
  encryption, freshness, deletion, consent, read-only default; no password
  storage.
- **Observable acceptance / success evidence:** Security review and explicit
  authorization precede any connector; per-source disable/deletion; no hidden
  polling or analytics.
- **Evidence:** `docs/COURSE-CENTRAL-ARCHITECTURE.md:3-6,18-31,179-191`;
  `docs/PRE-ALPHA-CONTRACT.md:139-142,172-174`.
- **Conflict / unknown:** Target platforms are named, but official API
  availability and institution permission are unknown.
- **Dedupe key:** `course-central/level-2-authorized-connectors`
- **Record readiness:** Research-only evidence; cannot become a Feature record
  without owner decision and external authorization.

### C-37 — Level 3 institutional partnership

- **Provisional category / area:** Research / Course Central
- **Observed status:** Blocked on institutional agreement.
- **Priority / board:** Historical Tier 3/can wait.
- **Evidenced DNA:** School support should be validated and attributable rather
  than implied.
- **Product truth / core promise:** Institution-approved sources, cohorts,
  identifiers, mappings, support, and change management.
- **Observable acceptance / success evidence:** Privacy dossier, read-only
  proposal, security review, pilot, agreement, and validated template precede
  partnership labeling.
- **Evidence:** `docs/COURSE-CENTRAL-ARCHITECTURE.md:185-202,358-359`.
- **Conflict / unknown:** No institution has approved this; do not create a
  commitment record.
- **Dedupe key:** `course-central/level-3-partnership`
- **Record readiness:** **Reconstruction note only** and Owner Decision Required.

### C-38 — One calm Course Central page

- **Provisional category / area:** Product Decision / Course Central
- **Observed status:** Wireframe/design only.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Centralize learner work without creating another sprawling
  LMS.
- **Product truth / core promise:** Today, Courses, Updates, and Needs Attention
  form one exception-led page; source label is always visible.
- **Observable acceptance / success evidence:** One primary page; ordinary
  informational items do not become tasks; every classification is explainable;
  clear actions connect to existing systems.
- **Evidence:** `docs/COURSE-CENTRAL-ARCHITECTURE.md:70-82,204-239`.
- **Conflict / unknown:** No responsive or accessibility acceptance beyond
  general UX Standards.
- **Dedupe key:** `course-central/one-calm-page`
- **Record readiness:** Product DNA strong; owner priority/board and screen-level
  acceptance required.

### C-39 — Course-software item classification

- **Provisional category / area:** Feature / Course Central
- **Observed status:** Design only.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Imported institutional content should become understandable
  without keyword-only guessing.
- **Product truth / core promise:** Typed classification retains evidence,
  confidence, source truth, and bulk correction; only action-required or
  user-promoted items may create tasks.
- **Observable acceptance / success evidence:** Context distinguishes events
  from resources/question files; ambiguous items remain unclear/unknown;
  learner can inspect and correct.
- **Evidence:** `docs/COURSE-CENTRAL-ARCHITECTURE.md:100-165,230-262`.
- **Conflict / unknown:** Detailed taxonomy exists, but owner priority, success
  metric, and what counts as acceptable classification accuracy are absent.
- **Dedupe key:** `course-central/explainable-item-classification`
- **Record readiness:** **Reconstruction note only** pending metric and owner
  acceptance.

### C-40 — Institution/program curriculum templates

- **Provisional category / area:** Feature / Course Central
- **Observed status:** Design only; live/community support deferred.
- **Priority / board:** Historical Tier 3/can wait.
- **Evidenced DNA:** New schools should be supported without rewriting AXOM or
  hard-coding SGU into the universal product.
- **Product truth / core promise:** Templates configure course structure,
  schedules, suggested imports, collections, study signals, and defaults while
  remaining versioned and attributable.
- **Observable acceptance / success evidence:** Institution, program, term,
  cohort, and group selection yields a coherent learner overlay; template
  updates preserve learner-owned work.
- **Evidence:** `docs/COURSE-CENTRAL-ARCHITECTURE.md:264-295`;
  `docs/PRE-ALPHA-CONTRACT.md:143-154`.
- **Conflict / unknown:** “Medical School, Pre-Med, PA, Dentistry, Nursing,
  Graduate” are target families, not accepted individual commitments.
- **Dedupe key:** `course-central/institution-curriculum-templates`
- **Record readiness:** Product Owner must choose template scope, order, and
  canonical priority.

### C-41 — SGU Term 3 workload template

- **Provisional category / area:** Feature / Course Central
- **Observed status:** Proposed starting template.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Translate a real medical curriculum into useful,
  learner-controlled sequence and context.
- **Product truth / core promise:** Lecture/DLA/readings/groups/IMCQ/eSoft/OPLG
  relationships and course defaults are data, not universal hard-coded logic;
  recommended prerequisites do not hard-lock access by default.
- **Observable acceptance / success evidence:** Cohort/college selection;
  recommended-after relationships; optional user-selected strict mode; source
  provenance.
- **Evidence:** `docs/COURSE-CENTRAL-ARCHITECTURE.md:296-313,369-377`.
- **Conflict / unknown:** No authoritative SGU source package or approval is
  evidenced in this source set.
- **Dedupe key:** `course-central/sgu-term-3-template`
- **Record readiness:** **Reconstruction note only** pending owner/source
  approval and acceptance corpus.

### C-42 — Local curriculum relationship graph

- **Provisional category / area:** Feature / Knowledge Graph
- **Observed status:** Design/future; phase-1 edge expansion can wait until after
  Alpha.
- **Priority / board:** Historical Tier 3 beyond phase 1; no canonical mapping.
- **Evidenced DNA:** One action should make multiple systems smarter without
  obscuring why.
- **Product truth / core promise:** Local relationships connect curriculum,
  resources, practice, activity, and mastery so Course Tracker and Command Brief
  can answer grounded next-step questions.
- **Observable acceptance / success evidence:** Each relationship is
  attributable/correctable; recommendations show graph evidence; no institution
  content is silently inferred.
- **Evidence:** `docs/COURSE-CENTRAL-ARCHITECTURE.md:315-334`;
  `docs/PRE-ALPHA-CONTRACT.md:43-50,149-154,172-174`.
- **Conflict / unknown:** Detailed Knowledge Graph phase boundaries are outside
  the reviewed source set. Do not infer schema or implementation.
- **Dedupe key:** `knowledge-graph/curriculum-relationship-graph`
- **Record readiness:** **Reconstruction note only** pending owner-defined phase
  1, Product DNA, and acceptance.

### C-43 — Community-submitted school support

- **Provisional category / area:** Research / Course Central
- **Observed status:** Later/gated.
- **Priority / board:** Historical Tier 3/can wait.
- **Evidenced DNA:** Expand institutional support without redistributing private,
  copyrighted, or identifying material.
- **Product truth / core promise:** Metadata-only, permission-confirmed,
  user-reviewed submission; no auto-publication; visible support levels.
- **Observable acceptance / success evidence:** Private/local use requires no
  submission; personal/grade data stripped; admin review; status is Community,
  AXOM reviewed, Institution verified, or Official partnership.
- **Evidence:** `docs/COURSE-CENTRAL-ARCHITECTURE.md:335-359`;
  `docs/PRE-ALPHA-CONTRACT.md:149-154,172-174`.
- **Conflict / unknown:** No legal/privacy review, moderation ownership, or
  acceptance metric exists.
- **Dedupe key:** `course-central/community-school-template-submission`
- **Record readiness:** **Reconstruction note only.**

### C-44 — Independent difficulty and yield

- **Provisional category / area:** Product Decision / Academic Mastery
- **Observed status:** Design policy.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Priority should reflect evidence, not collapse distinct
  academic concepts into one opaque score.
- **Product truth / core promise:** Conceptual difficulty and exam yield are
  independent, explainable, and user-overridable.
- **Observable acceptance / success evidence:** Both axes remain separately
  visible and editable; suggestions identify which evidence drove priority.
- **Evidence:** `docs/COURSE-CENTRAL-ARCHITECTURE.md:361-367`;
  `docs/PRE-ALPHA-CONTRACT.md:94-108`.
- **Conflict / unknown:** Current non-question surfaces using these axes are not
  enumerated.
- **Dedupe key:** `mastery/independent-difficulty-yield`
- **Record readiness:** Strong decision evidence; owner placement and Product
  DNA required.

### C-45 — Source-governed Blueprints

- **Provisional category / area:** Feature / Blueprint
- **Observed status:** Implemented foundation.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Academic pathways should be reusable and evolvable without
  sacrificing learner progress.
- **Product truth / core promise:** Catalog template and learner-installed
  instance remain distinct; reconciliation preserves progress, evidence, links,
  and notes.
- **Observable acceptance / success evidence:** Installable/versioned pathways;
  updates retain learner-owned data; institution specifics remain templates.
- **Evidence:** `IMPLEMENTATION_AUDIT.md:24-25`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:336-351`;
  `CHANGELOG.md:146-148`.
- **Conflict / unknown:** “Blueprint” UI breadth and verified user workflows are
  not fully specified in these sources.
- **Dedupe key:** `blueprint/source-governed-pathways`
- **Record readiness:** Lexicon and intent exist; owner acceptance criteria,
  priority, board, and metric still needed.

## E. Journal and reflection

### C-46 — Semantic Journal Foundation

- **Provisional category / area:** Feature / Journal
- **Observed status:** Implemented; original architecture noted independent
  acceptance pending.
- **Priority / board:** Journal is an accepted/no-regress system; no canonical
  `P0`–`P3` or board.
- **Evidenced DNA:** Preserve a dependable long-term memory without making
  writing depend on spectacle.
- **Product truth / core promise:** A premium semantic notebook supports today
  and prior days, structured reflection, free writing, wins/losses, local
  context, navigation, local export, accessibility, and reduced motion.
- **Observable acceptance / success evidence:** Writing remains usable without
  animation/network; legacy Journal behavior survives; mobile is one readable
  column; autosave and page navigation preserve work.
- **Evidence:** `FEATURES.md:70-78`;
  `docs/JOURNAL-NOTEBOOK-ARCHITECTURE.md:1-28,100-112`;
  `docs/PRE-ALPHA-CONTRACT.md:43-49,110-115`.
- **Conflict / unknown:** “Notebook library” is singular in current preference
  state while multiple notebooks remain future; do not imply current
  multi-notebook support.
- **Dedupe key:** `journal/semantic-foundation`
- **Record readiness:** Strong behavior evidence; owner Product DNA, priority,
  board, and success metric required.

### C-47 — Journal autosave and lossless page navigation

- **Provisional category / area:** Feature / Journal
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** The student never loses writing to a page turn, animation,
  or closely spaced save.
- **Product truth / core promise:** Drafts save after idle, before navigation,
  and at unmount; empty pages are not manufactured; navigation cannot become a
  persistence boundary.
- **Observable acceptance / success evidence:** Stable page identity prevents
  duplicates; page turn flushes before destination mounts; autosave state is
  announced; reduced motion removes transition without changing save behavior.
- **Evidence:** `docs/JOURNAL-NOTEBOOK-ARCHITECTURE.md:30-67,100-112`.
- **Conflict / unknown:** Exact autosave delay and failure-recovery UX are not
  product-specified.
- **Dedupe key:** `journal/autosave-lossless-navigation`
- **Record readiness:** Acceptance is strong except failure handling/success
  metric and owner placement.

### C-48 — Journal Day at a Glance

- **Provisional category / area:** Feature / Journal
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Help the learner remember the day without turning a
  reflection into a hidden scoring or interpretation engine.
- **Product truth / core promise:** One canonical local summary may be hidden,
  corrected for the snapshot, included as plain text, or ignored.
- **Observable acceptance / success evidence:** Corrections never mutate source
  logs/tasks/habits/readiness/targets; interface states that AXOM assembled local
  records and the learner may edit or ignore them; no AI/clinical claim.
- **Evidence:** `docs/JOURNAL-NOTEBOOK-ARCHITECTURE.md:69-83`;
  `docs/DAILY-LOOP-REMINDER-LIFECYCLE.md:78-82`.
- **Conflict / unknown:** None.
- **Dedupe key:** `journal/day-at-a-glance-snapshot`
- **Record readiness:** Strong behavior evidence; owner DNA/priority/board/metric
  required.

### C-49 — Bounded local Journal images

- **Provisional category / area:** Feature / Journal
- **Observed status:** Implemented Foundation behavior.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Personal images remain local and recoverable without
  pretending the Journal is a media manager.
- **Product truth / core promise:** JPEG/PNG/WebP/GIF only, bounded per image and
  page, removable/exportable, no upload or cloud fallback.
- **Observable acceptance / success evidence:** 3 MB/image and 12 MB/page; SVG
  and arbitrary files rejected; Markdown names attachments but does not embed
  bytes; future placement references existing attachments rather than
  duplicating them.
- **Evidence:** `FEATURES.md:70-78`;
  `docs/JOURNAL-NOTEBOOK-ARCHITECTURE.md:85-98`.
- **Conflict / unknown:** Roadmap proposes a separate binary/per-record store for
  larger or cross-notebook media (`ROADMAP.md:64`); current bounded workspace
  images are intentionally not that store.
- **Dedupe key:** `journal/bounded-local-images`
- **Record readiness:** Existing feature is strong; future binary media belongs
  in a separate record.

### C-50 — Journal Cinematic

- **Provisional category / area:** Feature / Journal
- **Observed status:** `next`; explicitly separate and unimplemented.
- **Priority / board:** Historical Tier 3/can wait; no canonical mapping.
- **Evidenced DNA:** Add a meaningful sense of place and tactile delight without
  compromising writing, recovery, accessibility, or calm.
- **Product truth / core promise:** Optional desk scene, notebook pickup,
  physical cover/page behavior, spatial placement, and optional sound/haptics
  wrap—never replace—the semantic Journal.
- **Observable acceptance / success evidence:** Writing works without animation;
  reduced motion is complete; sound/haptics off by default; persistence occurs
  before cinematic transition; semantic fallback survives renderer failure.
- **Evidence:** `ROADMAP.md:85-87`;
  `FEATURES.md:79-85,564-568`;
  `docs/JOURNAL-NOTEBOOK-ARCHITECTURE.md:19-28,114-125`;
  `docs/PRE-ALPHA-CONTRACT.md:149-154,172-176`.
- **Conflict / unknown:** No owner-approved priority, screen design, or success
  metric; “next” conflicts with Tier 3 “after Alpha” only if interpreted as
  immediate. Preserve both labels.
- **Dedupe key:** `journal/cinematic-shell`
- **Record readiness:** **Owner Decision Required** on historical status
  conflict and canonical timing.

### C-51 — Additive Journal extensions

- **Provisional category / area:** Research / Journal
- **Observed status:** Future extension seams.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** The notebook can deepen over time without turning basic
  writing into an advanced-mode requirement.
- **Product truth / core promise:** Potential multiple notebooks, bookmarks,
  search, monthly reflections, themes/materials, and spatial metadata remain
  optional and additive.
- **Observable acceptance / success evidence:** Legacy pages load unchanged;
  each extension preserves semantic writing, local ownership, export, and
  reduced-motion fallback.
- **Evidence:** `docs/JOURNAL-NOTEBOOK-ARCHITECTURE.md:114-125`.
- **Conflict / unknown:** These are genuinely independent ideas but lack
  individual intent, priority, and acceptance. Do not split them into canonical
  records until the Product Owner chooses which exist.
- **Dedupe key:** `journal/future-additive-extensions`
- **Record readiness:** **Reconstruction note only.**

### C-52 — Exact-date Journal catch-up

- **Provisional category / area:** Feature / Journal
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Help resume reflection factually without guilt or duplicate
  entries.
- **Product truth / core promise:** A reminder identifies the exact missed date,
  offers complete/skip/do-not-remind actions, and reopens the existing same-day
  entry when present.
- **Observable acceptance / success evidence:** Device-only reminder
  deduplication; exact-date navigation; no duplicate entry; neutral optional
  wording.
- **Evidence:** `FEATURES.md:486-489`.
- **Conflict / unknown:** No Product DNA wording or success metric beyond the
  behavioral evidence.
- **Dedupe key:** `journal/exact-date-catch-up`
- **Record readiness:** Owner DNA/priority/board/metric required.

## F. Daily Games and optional utilities

### C-53 — Optional Daily Games ecosystem

- **Provisional category / area:** Product Decision / Daily Games
- **Observed status:** Implemented opt-in shell.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Optional delight should make AXOM feel alive without
  competing with the academic core or deleting history when hidden.
- **Product truth / core promise:** Daily Games is disabled by default,
  discoverable, accessible, and contains only honest child capabilities.
- **Observable acceptance / success evidence:** One persisted enable flag;
  disabling hides routes without deleting puzzle history; direct route offers a
  real enable action.
- **Evidence:** `FEATURES.md:360-365`;
  `ROADMAP.md:132-137`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:632-681`.
- **Conflict / unknown:** The owner’s conversation says Daily Games should be
  persistent/visible; that conversation is not in this agent’s source set and
  may conflict with disabled-by-default. Conversation-mining must preserve it as
  an owner conflict, not silently change this record.
- **Dedupe key:** `daily-games/optional-ecosystem`
- **Record readiness:** **Owner Decision Required** on visibility/default state.

### C-54 — AXOM Daily Word

- **Provisional category / area:** Feature / Daily Games
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Offer a private, original daily ritual that feels complete
  without publisher data, accounts, or network dependence.
- **Product truth / core promise:** Six-guess, five-letter puzzle with
  deterministic local daily selection, honest dictionary boundary, accessible
  input/scoring, and answer reveal only after completion.
- **Observable acceptance / success evidence:** Duplicate-safe scoring;
  physical/on-screen keyboard; color-independent states; stored progress;
  deterministic date/timezone; completion statistics and countdown.
- **Evidence:** `FEATURES.md:126-132,188-197,366-378`;
  `ROADMAP.md:132-137`.
- **Conflict / unknown:** Human review of every answer and self-contained corpus
  regeneration are explicitly incomplete (`FEATURES.md:195-197`).
- **Dedupe key:** `daily-games/daily-word`
- **Record readiness:** Existing feature has strong behavior; corpus-review and
  regeneration debt should be separate records.

### C-55 — Deterministic Daily Word history and continuity

- **Provisional category / area:** Feature / Daily Games
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** An unfinished daily puzzle should remain the same puzzle
  after reload, timezone changes, dictionary versions, or backup merge.
- **Product truth / core promise:** Puzzle identity, answer version, timezone,
  guesses, completion, streaks, and distribution derive idempotently and merge
  deterministically.
- **Observable acceptance / success evidence:** Active puzzle retains original
  timezone/version; old incomplete puzzles are not silently rescored; merge
  deduplicates by puzzle ID and prefers completed/more-progressed/newer.
- **Evidence:** `FEATURES.md:188-197,373-378`.
- **Conflict / unknown:** Unknown historical list versions become unavailable,
  which is an honest boundary rather than a recovery guarantee.
- **Dedupe key:** `daily-word/deterministic-history-continuity`
- **Record readiness:** Strong behavior evidence; owner metric/placement needed.

### C-56 — Private Daily Word result sharing

- **Provisional category / area:** Feature / Daily Games
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Celebration remains private and user-controlled.
- **Product truth / core promise:** User-initiated share includes product/date/
  score/symbolic grid only; never answer, guesses, profile, or network
  transmission.
- **Observable acceptance / success evidence:** Clipboard with focused
  manual-copy fallback; no secret answer; no personal payload.
- **Evidence:** `FEATURES.md:379-381`.
- **Conflict / unknown:** No Product DNA or success metric directly sourced.
- **Dedupe key:** `daily-word/private-result-sharing`
- **Record readiness:** **Reconstruction note only** pending owner DNA/priority.

### C-57 — Local clock and timezone utility

- **Provisional category / area:** Feature / Utilities
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Time context should be available without becoming another
  distracting dashboard surface.
- **Product truth / core promise:** Compact digital clock plus accessible analog
  popover; system/custom IANA timezone shared with Daily Word; current time is
  not persisted.
- **Observable acceptance / success evidence:** 12/24-hour, seconds/date/
  visibility preferences; accurate reconciliation across focus, visibility,
  sleep; no whole-app rerender per tick.
- **Evidence:** `FEATURES.md:382-386`.
- **Conflict / unknown:** No owner intent, metric, or priority is explicit.
- **Dedupe key:** `utilities/local-clock-timezone`
- **Record readiness:** **Reconstruction note only.**

### C-58 — Doctordle collaboration boundary

- **Provisional category / area:** Product Decision / Daily Games
- **Observed status:** Blocked; static WIP only.
- **Priority / board:** No canonical assignment.
- **Evidenced DNA:** Visible future capability must not become unauthorized
  copying, integration, or misleading launch behavior.
- **Product truth / core promise:** No external integration, iframe, link,
  request, proxy, health check, or copied gameplay without explicit
  collaboration approval.
- **Observable acceptance / success evidence:** WIP boundary remains static and
  truthful; any future work begins only after collaboration authorization and
  distinct acceptance criteria.
- **Evidence:** `FEATURES.md:387-389`;
  `ROADMAP.md:83-84`.
- **Conflict / unknown:** No collaboration approval or product scope exists.
- **Dedupe key:** `daily-games/doctordle-collaboration-boundary`
- **Record readiness:** Canonical Product Decision may record the boundary;
  future feature is **Owner Decision Required**.

### C-59 — Daily Games lazy and offline-aware delivery

- **Provisional category / area:** Technical Debt / Daily Games + Offline
- **Observed status:** Implemented after one controlled online load; first-ever
  offline bootstrap unsupported.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Optional games should not burden the app shell and should
  reopen honestly when cached.
- **Product truth / core promise:** Daily Word code and corpus remain isolated
  lazy assets; claimed offline behavior starts only after worker control and
  successful fetch.
- **Observable acceptance / success evidence:** Production bundle isolation;
  controlled offline-reopen verification; current submitted rows survive;
  unsupported first-load state is clearly unavailable.
- **Evidence:** `FEATURES.md:390-394`;
  `ROADMAP.md:64-67,132-137`.
- **Conflict / unknown:** First-navigation precache is proposed but lacks an
  accepted product requirement or performance budget.
- **Dedupe key:** `daily-games/lazy-offline-delivery`
- **Record readiness:** Existing boundary and future bootstrap should be
  separate; owner priority and metric needed.

## G. Data ownership, backup, recovery, update, and platform

### C-60 — Local Vault as Workspace source of truth

- **Provisional category / area:** Feature / Data Safety
- **Observed status:** Implemented; accepted/no-regress.
- **Priority / board:** “Rock-solid local storage” is Alpha Tier 1 critical; no
  canonical mapping.
- **Evidenced DNA:** App code is disposable; learner work is sacred.
- **Product truth / core promise:** IndexedDB-first, device/origin-local
  Workspace is the active source of truth; successful primary writes do not
  leave a full mirror in ordinary localStorage.
- **Observable acceptance / success evidence:** Workspace survives refresh,
  rebuild, and update; fallback boundary is truthful; device-only preferences
  are not confused with Workspace data.
- **Evidence:** `FEATURES.md:436-460`;
  `docs/UPDATE-POLICY.md:1-4,17-28`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:211-243`.
- **Conflict / unknown:** README says cloud sync optional; primary Settings says
  no account/cloud promise. Treat remote path separately.
- **Dedupe key:** `data/local-vault-source-of-truth`
- **Record readiness:** Strong evidence; owner Product DNA/priority/board/metric
  required.

### C-61 — Portable Backup, Restore, and Merge

- **Provisional category / area:** Feature / Backup
- **Observed status:** Implemented.
- **Priority / board:** Reliable backup/restore is Alpha Tier 1 critical; no
  canonical mapping.
- **Evidenced DNA:** The learner can carry and recover work without understanding
  internal storage or relying on cloud.
- **Product truth / core promise:** Portable export is distinct from automatic
  local snapshots; Restore replaces after confirmation; Merge combines under
  deterministic rules and does not silently delete current records.
- **Observable acceptance / success evidence:** Validated/normalized import;
  older data migrates; distinct attempts and newer fields combine correctly;
  replace boundary explicit; backup includes supported Workspace data.
- **Evidence:** `FEATURES.md:450-465`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:247-312`;
  `docs/UPDATE-POLICY.md:30-39`.
- **Conflict / unknown:** Separately stored future binaries require explicit
  inclusion semantics; current Journal data is inside Workspace.
- **Dedupe key:** `backup/portable-restore-merge`
- **Record readiness:** Strong acceptance evidence; owner success metric and
  canonical placement required.

### C-62 — Automatic Safety Snapshots and migration recovery

- **Provisional category / area:** Feature / Data Safety
- **Observed status:** Implemented.
- **Priority / board:** Alpha-critical storage invariant; no canonical mapping.
- **Evidenced DNA:** Risky data changes must have a recoverable local checkpoint,
  and failure must never look like deletion.
- **Product truth / core promise:** Additive migrations create pre-migration
  safety snapshots; unresolved failure remains visible with export/restore/
  retry choices.
- **Observable acceptance / success evidence:** Previous/current versions and
  snapshot readability visible; original Workspace explicitly preserved;
  failure cannot be dismissed; state clears only after successful retry.
- **Evidence:** `FEATURES.md:441-465`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:266-278`;
  historical risk in `IMPLEMENTATION_AUDIT.md:47-55`.
- **Conflict / unknown:** Old audit’s missing snapshot/merge defects are
  superseded by later shipped evidence and must not be refiled as live bugs.
- **Dedupe key:** `data/automatic-snapshot-migration-recovery`
- **Record readiness:** Strong current behavior; Verification status still
  cannot be inferred from docs alone.

### C-63 — Session-safe, non-destructive update notice

- **Provisional category / area:** Feature / Updates
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Updates should feel calm and never interrupt or endanger
  active study.
- **Product truth / core promise:** Detect real deployed-version difference,
  show changes/options, never force reload, suppress during active session, and
  keep local progress intact.
- **Observable acceptance / success evidence:** Update now/Later/View changes;
  works across version-line resets; active sessions block notice; Local Vault
  untouched.
- **Evidence:** `CHANGELOG.md:12-16,81-84`;
  `FEATURES.md:469-471`;
  `README.md:184-196`.
- **Conflict / unknown:** Hosted service-worker behavior is automatic while
  downloads remain manual; both are valid channels, not conflicting product
  claims.
- **Dedupe key:** `updates/session-safe-notice`
- **Record readiness:** Strong behavior evidence; owner placement/metric needed.

### C-64 — Explicit release-channel update policy

- **Provisional category / area:** Product Decision / Updates
- **Observed status:** Current Alpha policy.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Never promise an updater that does not exist; every channel
  tells the learner how to protect and move data.
- **Product truth / core promise:** Hosted web auto-refreshes; web zip and Mac
  wrapper update manually; Tauri is unreleased; switching origin/package
  requires Portable Backup.
- **Observable acceptance / success evidence:** Channel-specific instructions;
  no fake in-app updater; data remains outside replaced app code; release notes
  state the boundary.
- **Evidence:** `docs/UPDATE-POLICY.md:6-39,55`;
  `docs/ALPHA-RELEASE.md:93-106`;
  `README.md:184-196`.
- **Conflict / unknown:** The Alpha guide references `0.1.0-alpha.1` while README
  current pre-beta is `0.0.1-prebeta`; release artifact/version truth needs
  current owner reconciliation before a release record.
- **Dedupe key:** `updates/release-channel-policy`
- **Record readiness:** Current policy decision is clear; release version
  conflict requires Owner Decision.

### C-65 — Restore-history audit trail

- **Provisional category / area:** Feature / Backup
- **Observed status:** Proposed.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Recovery history should be inspectable rather than relying
  on memory.
- **Product truth / core promise:** Current Settings shows snapshots and latest
  export but does not preserve a distinct restore-event history.
- **Observable acceptance / success evidence:** Future record would expose
  bounded, understandable restore events without duplicating or leaking
  Workspace content.
- **Evidence:** `ROADMAP.md:68-70`; `FEATURES.md:550-552`.
- **Conflict / unknown:** Event fields, retention, privacy, success metric,
  priority, and Product DNA are unspecified.
- **Dedupe key:** `backup/restore-history-audit`
- **Record readiness:** **Reconstruction note only.**

### C-66 — Exact user-visible Local Vault write time

- **Provisional category / area:** Feature / Data Safety
- **Observed status:** Proposed.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Learners should know whether their most recent change was
  durably saved.
- **Product truth / core promise:** Autosave exists, but no exact user-visible
  timestamp is retained for every successful vault write.
- **Observable acceptance / success evidence:** A future display distinguishes
  last successful durable save from app activity/export time and remains honest
  during failure.
- **Evidence:** `ROADMAP.md:69-70`; `FEATURES.md:550-552`.
- **Conflict / unknown:** Retention, performance, clock semantics, UX location,
  metric, and priority are absent.
- **Dedupe key:** `data/exact-vault-write-time`
- **Record readiness:** **Reconstruction note only.**

### C-67 — Cloud sync/account hardening

- **Provisional category / area:** Research / Accounts + Sync
- **Observed status:** Blocked; experimental name-only scaffold retained, no
  primary product claim.
- **Priority / board:** Accounts/sync are historical Tier 3/can wait.
- **Evidenced DNA:** Local-first ownership and value before account; no PIN or
  name-only mechanism may masquerade as secure authentication.
- **Product truth / core promise:** Any future remote sync needs real identity,
  consent, authentication, security review, recovery, and conflict clarity;
  secrets never live in the client.
- **Observable acceptance / success evidence:** No primary Settings claim while
  unsafe; local use remains complete; future auth is email magic link/OAuth/
  passkey-class, revocable, and security-reviewed.
- **Evidence:** `README.md:21,64-76,101-131`;
  `ROADMAP.md:68`;
  `FEATURES.md:546-552`;
  `docs/PRE-ALPHA-CONTRACT.md:172-174`.
- **Conflict / unknown:** README still lists public name-login/data APIs and
  calls optional sync available, while shipped Settings copy says it does not
  promise an account/cloud sync (`FEATURES.md:455-460`). This is a material
  documentation/product-state conflict. **Owner Decision Required.**
- **Dedupe key:** `accounts/cloud-sync-hardening`
- **Record readiness:** Research/containment record only until owner resolves
  whether the current scaffold remains supported, hidden, or retired.

### C-68 — Separate binary/per-record storage

- **Provisional category / area:** Research / Data Platform
- **Observed status:** Proposed; current bounded Journal images do not require
  it.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Large media must not bloat or destabilize the serialized
  Workspace; learner ownership and recovery remain explicit.
- **Product truth / core promise:** Separate binary storage would require quota,
  migration, deletion, export, missing-blob, and recovery semantics.
- **Observable acceptance / success evidence:** No base64 leakage into ordinary
  portable backups unless selected; clear inclusion status; orphan cleanup;
  bounded quota messaging; legacy Workspace unaffected.
- **Evidence:** `ROADMAP.md:64`;
  `docs/JOURNAL-NOTEBOOK-ARCHITECTURE.md:85-98`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:211-243,247-253`.
- **Conflict / unknown:** This source set does not authorize Question attachment
  blob work; detailed annotation/attachment work belongs to the Question pass.
- **Dedupe key:** `platform/separate-binary-store`
- **Record readiness:** **Reconstruction note only**; architecture is explicitly
  out of this checkpoint.

### C-69 — Broader route-level code splitting

- **Provisional category / area:** Technical Debt / Performance
- **Observed status:** In progress/proposed; heavy imports and Daily Word are
  already split, App shell remains >500 kB.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Everything should feel fast, but splitting must not destroy
  maintainability.
- **Product truth / core promise:** Optional/heavy capabilities should not
  inflate startup; the user receives truthful loading/progress.
- **Observable acceptance / success evidence:** Measured chunk/startup targets,
  regression-safe lazy navigation, offline compatibility, no duplicate vendor
  payload.
- **Evidence:** `ROADMAP.md:64-66`;
  `FEATURES.md:390-394,564-568`;
  `docs/PRE-ALPHA-CONTRACT.md:143-146`.
- **Conflict / unknown:** No numeric budget, target routes, or priority.
- **Dedupe key:** `performance/route-level-splitting`
- **Record readiness:** **Reconstruction note only.**

### C-70 — First-navigation offline bootstrap

- **Provisional category / area:** Research / Offline
- **Observed status:** Proposed.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Offline claims must be precise; the app should never show a
  false “available offline” state.
- **Product truth / core promise:** Current worker supports offline reopening
  only after control and successful fetch; first-ever offline startup is not
  supported.
- **Observable acceptance / success evidence:** Future build-aware precache
  proves first-navigation assets without stale-version or storage-pressure
  regressions.
- **Evidence:** `ROADMAP.md:65-66`; `FEATURES.md:390-394`.
- **Conflict / unknown:** Product need, supported routes, cache budget, update
  interaction, and metric absent.
- **Dedupe key:** `offline/first-navigation-bootstrap`
- **Record readiness:** **Reconstruction note only.**

### C-71 — Native/Tauri production channel

- **Provisional category / area:** Research / Platform
- **Observed status:** Experimental scaffold; not an Alpha primary channel.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** A native channel should preserve the same learner-owned
  experience and update safety, not create a second source of truth.
- **Product truth / core promise:** Production native path requires signed
  bundles/updater and OS app-data persistence; SQLite enters only with the real
  shell.
- **Observable acceptance / success evidence:** End-to-end vault verification;
  signed update artifacts; data survives install/update; same web frontend;
  clear migration from browser/origin data.
- **Evidence:** `README.md:170-182`;
  `docs/UPDATE-POLICY.md:41-53`;
  `docs/ALPHA-RELEASE.md:68-76,142-148`;
  `ROADMAP.md:71-72`.
- **Conflict / unknown:** Old Tauri scaffold is dormant/unverified; no decision
  to graduate it exists.
- **Dedupe key:** `platform/tauri-production-channel`
- **Record readiness:** **Reconstruction note only.**

### C-72 — Calendar integration through standard formats

- **Provisional category / area:** Feature / Calendar
- **Observed status:** Proposed.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Planned study actions should become calendar blocks without
  requiring privileged integration first.
- **Product truth / core promise:** Standard formats such as ICS come before
  provider-specific connections.
- **Observable acceptance / success evidence:** Not sufficiently specified.
- **Evidence:** `ROADMAP.md:73`;
  related Course Central Level 1 at
  `docs/COURSE-CENTRAL-ARCHITECTURE.md:175-177`.
- **Conflict / unknown:** Direction, import versus export, conflict semantics,
  provider scope, Product DNA, and metric are all missing.
- **Dedupe key:** `calendar/standard-format-integration`
- **Record readiness:** **Reconstruction note only.**

### C-73 — Premium tier activation

- **Provisional category / area:** Product Decision / Commercialization
- **Observed status:** Blocked; everything free during beta by design.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Premium capability must be real and earned, not a locked
  shell that withholds the local-first core.
- **Product truth / core promise:** Current beta is free; no premium entitlement
  claim is active.
- **Observable acceptance / success evidence:** Future activation would need an
  owner-approved boundary, truthful locked states, privacy/payment/account
  design, and unchanged critical local capability.
- **Evidence:** `ROADMAP.md:74`;
  general honesty rules `docs/governance/AX-0010-UX-STANDARDS.md:227-241`.
- **Conflict / unknown:** No pricing, entitlement, account, or product strategy
  exists.
- **Dedupe key:** `commercial/premium-tier-activation`
- **Record readiness:** Current free-beta decision may be recorded; future
  activation is **Owner Decision Required** and not a Feature commitment.

## H. AI, learning tools, support, identity, and secondary surfaces

### C-74 — Local-first, review-gated AI provider layer

- **Provisional category / area:** Product Decision / AI
- **Observed status:** Implemented provider foundation and selected actions.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** AI should reduce work without becoming load-bearing,
  opaque, or able to mutate the learner’s plan without consent.
- **Product truth / core promise:** Local Ollama where available, deterministic
  `[DEMO]` preview, schema-validated outputs, explicit review, and fully
  functional deterministic core when no provider is reachable.
- **Observable acceptance / success evidence:** No client secret; provider/model
  state visible; output labeled by source; drafts editable/rejectable; disabled
  state does not break non-AI workflows.
- **Evidence:** `FEATURES.md:424-434`;
  `CHANGELOG.md:70-74`;
  `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md:23-25,66-67`;
  `docs/PRE-ALPHA-CONTRACT.md:125-127`.
- **Conflict / unknown:** README describes Vercel AI endpoints and recommends
  mock mode in some deployment instructions (`README.md:101-128`), while the
  product promise prioritizes local/no-provider use. These can coexist only with
  truthful source labeling.
- **Dedupe key:** `ai/local-first-review-gated-provider`
- **Record readiness:** Strong decision/behavior evidence; owner success metric
  and canonical placement required.

### C-75 — Secure server-side cloud AI proxy

- **Provisional category / area:** Research / AI
- **Observed status:** Blocked.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Optional cloud intelligence must never expose user secrets
  or silently transmit learner content.
- **Product truth / core promise:** Cloud BYOK remains disabled until a secure
  server-side consent/proxy boundary exists; no key field ships in the client.
- **Observable acceptance / success evidence:** Server-side secret handling,
  explicit consent, provider attribution, transmission disclosure, review gate,
  and local deterministic fallback.
- **Evidence:** `README.md:71-73`;
  `ROADMAP.md:53-58`;
  `FEATURES.md:424-434,546-547`.
- **Conflict / unknown:** “BYOK” ownership, retention, logging, medical-content
  policy, and provider list are absent.
- **Dedupe key:** `ai/secure-cloud-proxy`
- **Record readiness:** **Reconstruction note only.**

### C-76 — In-browser AI model exploration

- **Provisional category / area:** Research / AI
- **Observed status:** Proposed.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Private intelligence may be useful when it remains local and
  does not require a separate model service.
- **Product truth / core promise:** WebLLM/browser models are an exploration,
  not a product commitment; Ollama is the current local path.
- **Observable acceptance / success evidence:** Not specified.
- **Evidence:** `ROADMAP.md:55-58`.
- **Conflict / unknown:** Browser support, download/storage cost, model quality,
  accessibility, privacy, and success metric are unknown.
- **Dedupe key:** `ai/in-browser-model-research`
- **Record readiness:** **Reconstruction note only.**

### C-77 — Study Methods library and recommender

- **Provisional category / area:** Feature / Study Methods
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Teach the learner how to study without demanding they design
  a planning system under pressure.
- **Product truth / core promise:** Named, evidence-informed methods include when
  to use, when not to use, materials, steps, mistakes, and direct add/start
  actions.
- **Observable acceptance / success evidence:** Fourteen techniques; recommender
  uses disclosed energy/time/exam/recovery context; learner remains in control
  of adding or starting.
- **Evidence:** `CHANGELOG.md:75-77`;
  `FEATURES.md:411-412`;
  `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md:23-25,68-69`.
- **Conflict / unknown:** Source quality/evidence review for the fourteen
  techniques is not documented here.
- **Dedupe key:** `study-methods/evidence-informed-library`
- **Record readiness:** Strong product intent; owner source-standard, metric,
  priority, and board required.

### C-78 — Persistent Card Vault and spaced review

- **Provisional category / area:** Feature / Anki + Cards
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Captured learning assets should persist and return when due;
  card volume is a cost, not a feature.
- **Product truth / core promise:** Typed cards retain provenance and AI labels,
  receive quality checks, and participate in an in-app due review queue.
- **Observable acceptance / success evidence:** Eleven card kinds; spaced review
  history; duplicate/length/fact/source checks; AI drafts individually reviewed;
  portable TSV/CSV export.
- **Evidence:** `FEATURES.md:350-358`;
  `CHANGELOG.md:65-69`;
  `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md:17-18,31-33`.
- **Conflict / unknown:** Naming conflict: `Card Vault` is referenced in AX-0009
  but not yet canonically defined. Scheduler’s “SM-2-flavored” behavior is not a
  permanent product definition.
- **Dedupe key:** `cards/persistent-vault-spaced-review`
- **Record readiness:** Strong behavior evidence; Lexicon/owner placement
  required.

### C-79 — Verified AnkiConnect synchronization

- **Provisional category / area:** Feature / Anki
- **Observed status:** `next`; diagnostics/probing exist, sync is not
  machine-verified.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Integration should preview exactly what will happen before
  changing an external deck.
- **Product truth / core promise:** Dry-run preview, explicit deck mapping, and
  machine verification precede a sync claim.
- **Observable acceptance / success evidence:** Local AnkiConnect detection;
  user-approved mapping; deterministic preview; failure leaves Card Vault
  unchanged; successful result is verified against Anki.
- **Evidence:** `ROADMAP.md:71`;
  `IMPLEMENTATION_AUDIT.md:26-28,109-117`;
  `README.md:32-33`.
- **Conflict / unknown:** The README’s claim is limited to availability/
  verification need; no accepted sync conflict policy or support matrix exists.
- **Dedupe key:** `anki/verified-sync`
- **Record readiness:** **Reconstruction note only** pending owner Product DNA,
  priority, and acceptance details.

### C-80 — Resource Hub

- **Provisional category / area:** Feature / Resources
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Useful study links should be organized, searchable, and
  personally prioritizable without pretending external quality is universal.
- **Product truth / core promise:** Curated and user-added resources support
  categories, search, favorites, import, normalization, filters, and personal
  ratings/reasons.
- **Observable acceptance / success evidence:** Exact labels/URLs; add/remove/
  re-rate; favorite and category/source filters; no duplicate normalized URLs;
  personal ratings remain identified as personal.
- **Evidence:** `CHANGELOG.md:97-103,141-143,183-185`;
  `README.md:18-21`.
- **Conflict / unknown:** Repository source contains personal drives/ratings and
  email; external-release privacy and link policy require separate review not
  established here.
- **Dedupe key:** `resources/organized-personal-resource-hub`
- **Record readiness:** Feature evidence exists; owner release/privacy decision,
  priority, board, and Product DNA required.

### C-81 — Tasks as learner-owned work

- **Provisional category / area:** Feature / Tasks
- **Observed status:** Functional, included in daily decision and rollover
  systems.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Learner-owned work should feed today’s decision without
  becoming a flat list of competing urgencies.
- **Product truth / core promise:** Tasks can be added/edited/deleted, carried
  across days, ranked in Command Brief, and linked to sessions.
- **Observable acceptance / success evidence:** Open/overdue/due/carryover state
  remains explicit; completion persists; session/closeout links do not duplicate
  or silently mutate tasks.
- **Evidence:** `README.md:17-20`;
  `IMPLEMENTATION_AUDIT.md:15-18,30-31`;
  `docs/COMMAND-BRIEF-EVIDENCE.md:42-55`;
  `CHANGELOG.md:47-54`.
- **Conflict / unknown:** No dedicated Tasks product contract, Product DNA, or
  end-to-end acceptance exists in reviewed sources.
- **Dedupe key:** `tasks/learner-owned-work`
- **Record readiness:** **Reconstruction note only** pending owner definition.

### C-82 — Boards and exam-prep lanes

- **Provisional category / area:** Feature / Boards + Academic Prep
- **Observed status:** Implemented foundation; DAT/CASPer extensions proposed.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Exam preparation should retain its own truthful evidence
  without conflating board work with lecture/DLA pass tracking.
- **Product truth / core promise:** Board-style logs capture domain, mode,
  minutes, practice, correctness, confidence, and missed themes; selected exam
  context may inform Dashboard/Command Brief.
- **Observable acceptance / success evidence:** Separate prep-lane log; exam date
  and lane conditionality; no empty percentage without a configured lane.
- **Evidence:** `CHANGELOG.md:146-148`;
  `docs/DASHBOARD-WIDGET-ARCHITECTURE.md:27,39,61,71`;
  `README.md:19-20`.
- **Conflict / unknown:** Canonical concepts “prep lane” and “board blueprint”
  are not defined in AX-0009.
- **Dedupe key:** `academic-prep/boards-lanes`
- **Record readiness:** Owner Product DNA, lexicon, metric, priority, and board
  required.

### C-83 — Pre-health experience portfolio

- **Provisional category / area:** Feature / Pre-Med
- **Observed status:** Functional foundation.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Pre-health learners should see personally relevant
  experience progress without fixed targets masquerading as requirements.
- **Product truth / core promise:** Experience hours and verification state are
  path-gated, locally owned, and exportable.
- **Observable acceptance / success evidence:** Categories, user-defined targets,
  neutral zero state, verification flags, XLSX export, and Dashboard visibility
  only for relevant profiles.
- **Evidence:** `IMPLEMENTATION_AUDIT.md:30-31`;
  `docs/DASHBOARD-WIDGET-ARCHITECTURE.md:37,71`.
- **Conflict / unknown:** Detailed portfolio fields, privacy, and current
  verification status are absent.
- **Dedupe key:** `premed/experience-portfolio`
- **Record readiness:** **Reconstruction note only** pending owner contract.

### C-84 — Application/Residency intelligence

- **Provisional category / area:** Research / Applications
- **Observed status:** Proposed/scaffold only; no analysis claims.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Application guidance must be grounded in learner data and
  must not imply intelligence when only a shell exists.
- **Product truth / core promise:** Current surface remains honest and thin;
  future analysis requires evidence and a defined product contract.
- **Observable acceptance / success evidence:** Not specified.
- **Evidence:** `ROADMAP.md:80-83`;
  `IMPLEMENTATION_AUDIT.md:42-45,109-117`.
- **Conflict / unknown:** “Application Checker” versus “Application/Residency
  Intelligence” may be the same concept or separate lanes; no owner decision.
- **Dedupe key:** `applications/intelligence-surface`
- **Record readiness:** **Reconstruction note only; Owner Decision Required** on
  concept/name/scope.

### C-85 — DAT and CASPer lanes

- **Provisional category / area:** Feature / Academic Prep
- **Observed status:** Proposed, “light surfaces only.”
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Not evidenced beyond a scoped idea.
- **Product truth / core promise:** No canonical truth beyond the proposal.
- **Observable acceptance / success evidence:** Not specified.
- **Evidence:** `ROADMAP.md:87-89`.
- **Conflict / unknown:** Audience, jobs, relation to Blueprints, data model,
  acceptance, and Product DNA absent.
- **Dedupe key:** `academic-prep/dat-casper-lanes`
- **Record readiness:** **Reconstruction note only.**

### C-86 — Leaderboards remain deprioritized

- **Provisional category / area:** Product Decision / Social
- **Observed status:** Stub/proposed historically; explicit direction is hidden
  and “do not invest.”
- **Priority / board:** No canonical priority; historical disposition is
  deprioritized.
- **Evidenced DNA:** Competitive gamification conflicts with the calm,
  non-shaming tone for high-pressure learners.
- **Product truth / core promise:** Leaderboards do not belong in the core loop.
- **Observable acceptance / success evidence:** Stub remains hidden or is
  removed from ordinary navigation; no XP/competition claims.
- **Evidence:** `ROADMAP.md:82-84`;
  `IMPLEMENTATION_AUDIT.md:42,119-122`;
  `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md:27-36`.
- **Conflict / unknown:** Canonical status may be `Rejected` or `Deferred`; only
  Product Owner may choose.
- **Dedupe key:** `social/leaderboards-deprioritized`
- **Record readiness:** **Owner Decision Required** for status and whether a
  backlog record is needed for removal/containment.

### C-87 — Four-step onboarding

- **Provisional category / area:** Feature / Onboarding
- **Observed status:** Implemented.
- **Priority / board:** Better onboarding is historical Alpha Tier 2 strongly
  recommended; no canonical mapping.
- **Evidenced DNA:** Personalize quickly, explain local ownership, and let the
  learner reach value without answering thirty questions.
- **Product truth / core promise:** Identity, core setup, Workspace, and data
  safety; optional inputs remain skippable; reruns never overwrite or reseed.
- **Observable acceptance / success evidence:** Session-only draft resume;
  four-step limit; route to Dashboard/Course Tracker/Question Bank; rerun
  preserves profile and completion state.
- **Evidence:** `FEATURES.md:475-480`;
  `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md:23-25`;
  `ROADMAP.md:138-142`.
- **Conflict / unknown:** Owner conversation references all wording/layout issues
  but is outside this source pass; no completion-rate metric.
- **Dedupe key:** `onboarding/four-step-safe-setup`
- **Record readiness:** Strong behavior evidence; owner DNA/metric/placement
  required.

### C-88 — Global guide and same-route module tours

- **Provisional category / area:** Feature / Guidance
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Teach the operating system without forcing unfinished
  surfaces or stealing the learner’s location/focus.
- **Product truth / core promise:** Seven-step global guide plus short module
  tours; skip/replay/resume; missing-target fallback; viewport-safe and
  reduced-motion-safe; module tours do not alter global progress.
- **Observable acceptance / success evidence:** Focus containment/restoration;
  mobile safe; current route respected; prior scroll/layout restored on exit;
  no unfinished-module tour.
- **Evidence:** `FEATURES.md:51-59,133-138,481-485`;
  `CHANGELOG.md:96,144-145`.
- **Conflict / unknown:** No success metric or current tour-content review.
- **Dedupe key:** `guidance/global-and-module-tours`
- **Record readiness:** Strong behavior evidence; owner priority/board/DNA/metric
  needed.

### C-89 — Optional Promise of Use

- **Provisional category / area:** Feature / Identity + Onboarding
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** A voluntary personal commitment can deepen intention without
  becoming coercive or blocking study.
- **Product truth / core promise:** Presented once at the safe post-guide point;
  sign/defer/skip; version/timestamp locally preserved; module tours never open
  it.
- **Observable acceptance / success evidence:** Accessible voluntary-contract
  surface; typed signature; restrained/static confirmation under reduced motion;
  re-sign/view available; suppression round-trips.
- **Evidence:** `FEATURES.md:51-59,133-138`;
  `CHANGELOG.md:96,107-108,144-145`.
- **Conflict / unknown:** “Promise” is not canonically defined in AX-0009; no
  evidence of long-term user value or whether it remains desired.
- **Dedupe key:** `onboarding/optional-promise`
- **Record readiness:** Owner Decision Required for durable product status and
  lexicon need.

### C-90 — Help, guidance, and privacy-bounded feedback

- **Provisional category / area:** Feature / Help
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** A learner should recover from confusion and report a
  problem without exposing Workspace content.
- **Product truth / core promise:** Help provides tour replay, master/Anki
  guidance, dictionary version, and a safe bug/suggestion/urgent feedback path
  with a copy/email fallback.
- **Observable acceptance / success evidence:** Only coarse diagnostics in
  drafted feedback; user reviews before sending; accessible success/failure;
  Help remains a distinct navigable section.
- **Evidence:** `CHANGELOG.md:97-103,149-150`;
  `FEATURES.md:126-132`;
  `docs/ALPHA-RELEASE.md:108-117`.
- **Conflict / unknown:** Personal destination email appears in release docs and
  may be a public privacy/security risk; source set does not contain an owner
  decision to retain it.
- **Dedupe key:** `help/privacy-bounded-feedback`
- **Record readiness:** Feature evidence exists; release privacy/email decision
  requires owner review.

### C-91 — Five-section Settings information architecture

- **Provisional category / area:** Product Decision / Settings
- **Observed status:** Implemented.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Organize sensitive setup, data, and diagnostics by learner
  intent rather than internal technology.
- **Product truth / core promise:** Profile, Data, Backup, Personalization, and
  Advanced; device-local Workspace and backups explained without false account
  claims or implementation jargon.
- **Observable acceptance / success evidence:** Storage health/counts in Data;
  portable/local recovery in Backup; diagnostics/reset in Advanced;
  confirmation-gated destructive actions; accessible section navigation.
- **Evidence:** `FEATURES.md:455-465`;
  `CHANGELOG.md:107-109`;
  `ROADMAP.md:138-142`.
- **Conflict / unknown:** README’s cloud-sync instructions conflict with primary
  Settings’ no-cloud-account claim; owner reconciliation required.
- **Dedupe key:** `settings/five-section-information-architecture`
- **Record readiness:** Current IA is clear; broader Settings Product Debt from
  conversations awaits conversation mining.

### C-92 — Cross-product accessibility completion

- **Provisional category / area:** Product Debt / Accessibility
- **Observed status:** In progress; several high-value flows covered, broader
  audit remains.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Accessibility is part of each feature, not a final polish
  pass.
- **Product truth / core promise:** Keyboard, focus, semantics, non-color state,
  contrast, reduced motion, 390px/200% reflow, and usable touch targets across
  every supported route.
- **Observable acceptance / success evidence:** Route-by-route dark/light,
  keyboard, focus, reduced-motion, responsive, loading/error/empty/populated
  evidence plus assistive-state review.
- **Evidence:** `ROADMAP.md:89-90`;
  `docs/governance/AX-0010-UX-STANDARDS.md:270-345`;
  implemented examples `FEATURES.md:51-78`.
- **Conflict / unknown:** No full violation inventory or owner-defined release
  threshold in these sources.
- **Dedupe key:** `accessibility/cross-product-completion`
- **Record readiness:** Product Debt is evidenced; owner priority, affected
  routes, and acceptance threshold required.

### C-93 — AXOM-specific reduced-motion preference

- **Provisional category / area:** Feature / Accessibility
- **Observed status:** Proposed; OS preference currently authoritative.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** A learner may need reduced motion even when the operating
  system setting is unchanged.
- **Product truth / core promise:** Current UI truthfully follows OS
  `prefers-reduced-motion`; no product-level override is claimed.
- **Observable acceptance / success evidence:** Future preference consistently
  affects all shared runtime/CSS motion without removing meaning, focus,
  progress, or content.
- **Evidence:** `ROADMAP.md:89-90`; `FEATURES.md:553-556`;
  `docs/governance/AX-0010-UX-STANDARDS.md:245-266,290-309`.
- **Conflict / unknown:** Storage boundary, precedence over OS, copy, and
  supported motion surfaces are undefined.
- **Dedupe key:** `accessibility/product-reduced-motion-override`
- **Record readiness:** **Reconstruction note only.**

### C-94 — Optional release/signup email capture

- **Provisional category / area:** Research / Release
- **Observed status:** Proposed; no live collection.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Interest capture must be consensual and separate from
  learner Workspace data.
- **Product truth / core promise:** No email collection exists in current
  product; a future form requires truthful provider/privacy boundaries and
  accessible result states.
- **Observable acceptance / success evidence:** Explicit consent; no Workspace
  payload; clear provider/delivery/failure; deletion/privacy path.
- **Evidence:** `ROADMAP.md:86-87,110-112`.
- **Conflict / unknown:** Provider, purpose, retention, privacy policy, and
  success metric absent.
- **Dedupe key:** `release/optional-email-capture`
- **Record readiness:** **Reconstruction note only.**

## I. Technical-debt and historical-product evidence

### C-95 — Maintain lint/hook dependency hygiene

- **Provisional category / area:** Technical Debt / Quality
- **Observed status:** In progress as a standing regression gate; current tree
  historically reported zero warnings.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Reliability debt should not quietly reappear while product
  work continues.
- **Product truth / core promise:** Full lint remains part of each checkpoint.
- **Observable acceptance / success evidence:** Zero warnings/errors; supported
  exceptions documented rather than globally suppressed.
- **Evidence:** `ROADMAP.md:67`;
  `docs/governance/AX-0010-UX-STANDARDS.md:329-345`.
- **Conflict / unknown:** No evidence of a current defect; this is a maintenance
  invariant, not a bug.
- **Dedupe key:** `quality/hook-lint-hygiene`
- **Record readiness:** Could be a Testing Standard rather than a backlog
  record; Owner Decision Required to avoid duplicating future AX-0008 authority.

### C-96 — Oversized core modules

- **Provisional category / area:** Technical Debt / Maintainability
- **Observed status:** Historical audit finding.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** Not sourced.
- **Product truth / core promise:** None; this is technical evidence only.
- **Observable acceptance / success evidence:** Not defined.
- **Evidence:** `IMPLEMENTATION_AUDIT.md:66-75`.
- **Conflict / unknown:** File sizes and responsibilities have changed since the
  audit; no current repository remeasurement was authorized in this subtask.
- **Dedupe key:** `technical/oversized-dashboard-store`
- **Record readiness:** **Reconstruction note only**; requires current evidence
  and engineering-owned acceptance, then Product Owner prioritization.

### C-97 — Storage failure error boundary

- **Provisional category / area:** Technical Debt / Data Safety
- **Observed status:** Historical audit said storage failures failed silently.
- **Priority / board:** Not assigned.
- **Evidenced DNA:** The learner must understand and recover from persistence
  failure.
- **Product truth / core promise:** Current migration recovery exists, but
  generic runtime/storage failure containment is not established by these docs.
- **Observable acceptance / success evidence:** A supported current audit would
  need to reproduce failure modes and verify preserved input plus recovery.
- **Evidence:** `IMPLEMENTATION_AUDIT.md:66-75`;
  later migration-specific recovery `FEATURES.md:461-465`.
- **Conflict / unknown:** Later recovery work may partially supersede the old
  finding. It cannot be filed as a confirmed live bug without current
  reproduction.
- **Dedupe key:** `technical/storage-error-boundary`
- **Record readiness:** **Reconstruction note only; suspected, not confirmed.**

### C-98 — Legacy native productivity daily-file architecture

- **Provisional category / area:** Technical Debt / Legacy Native
- **Observed status:** Historical, explicitly fragile/not functional; web product
  later replaced native file I/O with browser state.
- **Priority / board:** No current assignment.
- **Evidenced DNA:** Historical intent was faithful, reversible, local-first
  per-day records.
- **Product truth / core promise:** This is not current web architecture and must
  not be silently converted into a current product requirement.
- **Observable acceptance / success evidence:** None for current product.
- **Evidence:** `docs/PRODUCTIVITY-ARCHITECTURE.md:1-56`;
  `CHANGELOG.md:194-212,214-256`.
- **Conflict / unknown:** The doc describes external personal paths and a native
  file model superseded by the web app. Whether to preserve, archive, or delete
  it is an owner/repository-cleanup decision.
- **Dedupe key:** `legacy/native-productivity-daily-files`
- **Record readiness:** **Reconstruction note only; historical/obsolete
  candidate, not a live feature or confirmed bug.**

### C-99 — Canonical hosted URL and release identity

- **Provisional category / area:** Product Debt / Release
- **Observed status:** Release blocker/decision unresolved.
- **Priority / board:** Alpha guide calls it a remaining blocker; no canonical
  priority/board.
- **Evidenced DNA:** Release-facing identity should be stable and truthful.
- **Product truth / core promise:** One supported hosted URL should match AXOM
  identity; legacy Noctyrium addresses should not be presented as canonical
  without explicit intent.
- **Observable acceptance / success evidence:** Product Owner selects stable
  domain; README/release notes/package links agree; old URL behavior is
  redirected or clearly historical.
- **Evidence:** `README.md:151-156`;
  `docs/ALPHA-RELEASE.md:142-148`;
  identity rule `README.md:8-10`.
- **Conflict / unknown:** README current URL uses Noctyrium while release guide
  expects `jaclose/AXOM`; repository remote/current hosting truth was not part of
  this read-only source catalogue.
- **Dedupe key:** `release/canonical-hosted-url`
- **Record readiness:** Strong conflict evidence; Product Owner must select the
  canonical destination.

### C-100 — Release persistence QA contract

- **Provisional category / area:** Product Decision / Release Quality
- **Observed status:** Documented manual release gate.
- **Priority / board:** Release guide treats it as required before each release;
  no canonical mapping.
- **Evidenced DNA:** Updates never cost learner work.
- **Product truth / core promise:** Profile, task, activity, Course Tracker, and
  Journal data survive refresh, rebuild, redeploy, and additive migration.
- **Observable acceptance / success evidence:** Exact manual sequence is
  documented; no reset migration; app bundle replacement leaves Workspace
  intact.
- **Evidence:** `docs/ALPHA-RELEASE.md:130-140`;
  `docs/UPDATE-POLICY.md:1-4,17-28`.
- **Conflict / unknown:** Future AX-0008 Testing Standard may own the permanent
  gate; avoid duplicating authority.
- **Dedupe key:** `release/persistence-qa`
- **Record readiness:** Owner Decision Required on whether this is a backlog
  Product Decision or future Testing Standard content.

## J. Reconstruction notes that must not become records yet

The following knowledge is meaningful but fails one or more required Phase A
steps (named Product DNA, canonical priority, observable acceptance, or
non-conflicting evidence). It must remain a reconstruction note until the
Product Owner resolves it.

| Note | Evidence | Missing or conflicting knowledge | Dedupe disposition |
| --- | --- | --- | --- |
| Dashboard individual-widget records | `docs/DASHBOARD-WIDGET-ARCHITECTURE.md:23-40,53-71` | The catalog names many independent jobs, but most do not have owner-authored immutable DNA, success metrics, or canonical priority. | Keep one catalog candidate C-28 until Product Owner chooses which widgets deserve separate records. |
| Touch-drag widget convenience | `ROADMAP.md:85` | Proposed convenience only; keyboard move is current required mobile path. | Child of C-26, not a separate record yet. |
| First-navigation offline precache | `ROADMAP.md:66` | No cache budget, route scope, or need metric. | Preserved as C-70 research note. |
| Daily Word corpus human review | `FEATURES.md:188-197` | Incomplete review is explicit, but no accepted review standard or release impact. | Potential Research/Technical Debt child of C-54. |
| Daily Word corpus regeneration | `FEATURES.md:195-197` | Self-contained regeneration script absent; current reproducibility requirement not owner-prioritized. | Potential Technical Debt child of C-54. |
| App-wide loading skeleton policy | `docs/governance/AX-0010-UX-STANDARDS.md:211-223` | Governing standard exists, but no supported product deviation inventory in assigned sources. | Do not create debt without route evidence. |
| General UI spacing/typography/animation polish | `docs/governance/AX-0010-UX-STANDARDS.md:67-176,245-266` | Standards are authority, not evidence of violations. Owner conversations must supply specific observations. | Conversation-mining only; never infer debt from a standard alone. |
| Dashboard quote placement/attribution polish | `FEATURES.md:113-117`; owner conversation mentioned by task context but not supplied as a source file | Current daily quote behavior is evidenced; desired location/hierarchy needs exact conversation evidence and owner acceptance. | Do not merge with C-25 until conflict is sourced. |
| Sidebar persistence and folder memory | `docs/governance/AX-0010-UX-STANDARDS.md:270-286`; no supported repository observation in assigned docs | UX principle exists, but current behavior/defect is not established here. | Conversation/manual-QA evidence required. |
| Dashboard/Reports quiz-session surfacing | `ROADMAP.md:80` | Question-adjacent and owned by Question/analytics pass; no duplication here. | Explicitly excluded from this catalogue. |
| Pitfall Map | `ROADMAP.md:81` | Question-derived analytics; owned by Question evidence pass. | Explicitly excluded. |
| AI error-type classification | `ROADMAP.md:58` | Question-specific tutor behavior; owned by Question pass. | Explicitly excluded. |
| Personal AI planner/tutor/OCR/weakness engine | Only fragments in reviewed docs, much of it Question-specific | The owner’s requested scope exists in conversations not supplied to this agent. | Conversation-mining and Question pass. |
| Application Checker versus Residency Intelligence | `ROADMAP.md:82`; `IMPLEMENTATION_AUDIT.md:43,116` | Same surface or separate products is unclear. | Single C-84 note, Owner Decision Required. |
| Live admin account visibility | `docs/ALPHA-RELEASE.md:119-128` | A TODO defines a host operation but lacks Product DNA, privacy contract, and current account authorization. | Do not create a feature record; fold into accounts/security research only after owner decision. |
| Optional feedback email service | `docs/ALPHA-RELEASE.md:108-117` | Release infrastructure and personal destination address exist; no institutional privacy/retention decision. | Related to C-90, not separate yet. |
| Notarized Mac wrapper | `docs/ALPHA-RELEASE.md:142-148` | Optional release action, not a product outcome with DNA. | Release note only unless Product Owner promotes it. |
| Vercel Hobby function limit | `README.md:126-149`; `docs/ALPHA-RELEASE.md:7-15,47-52` | Current infrastructure constraint, no durable product intent. | Engineering/release constraint; not a Product Backlog record without owner decision. |
| React routing registration debt | `IMPLEMENTATION_AUDIT.md:74-75` | Old audit, no current failure or accepted refactor outcome. | Suspected technical debt only. |
| Whole-state persistence scaling | `IMPLEMENTATION_AUDIT.md:70-71` | Old audit explicitly says per-table schema not justified yet. | Preserve as historical “do not optimize yet,” not a debt record. |
| Stale Noctyrium strings | `IMPLEMENTATION_AUDIT.md:72`; later identity work `FEATURES.md:510-537` | Later rebrand may supersede most of the finding; no current UI inventory. | Current evidence required before Product Debt/Bug. |
| Premium visual identity refinement | `FEATURES.md:496-535` | Shipped evidence is broad, but no owner DNA/acceptance per individual token/pattern. | Preserve identity record C-07; do not explode into dozens of polish records without observations. |

## K. Conflicts requiring Product Owner protection

No conflict below may be silently resolved during backlog population.

1. **Phase A category name:** owner prompt says `Product Polish`; ratified
   `AX-0001` allows `Polish` (`AX-0001:71-79`). Governing authority currently
   wins for data integrity, but only the Product Owner may amend or clarify.
2. **Daily Games default:** shipped contract is disabled-by-default
   (`FEATURES.md:362-365`); recent owner conversation reportedly asks for
   persistent visibility. Preserve both sources when that conversation is mined.
3. **Daily Check-In scope:** pre-Alpha directive names sleep, nutrition, and
   wellbeing (`docs/PRE-ALPHA-CONTRACT.md:136-138`); shipped contract does not
   establish those inputs (`docs/DAILY-LOOP-REMINDER-LIFECYCLE.md:71-82`).
4. **Journal Cinematic timing:** roadmap says `next` (`ROADMAP.md:86`), but
   contract says Tier 3 after Alpha (`docs/PRE-ALPHA-CONTRACT.md:172-176`).
5. **Cloud/account truth:** README describes optional name-only cloud sync/API
   (`README.md:21,101-131`); shipped Settings says it does not promise an
   account/cloud sync (`FEATURES.md:455-460`); roadmap calls hardening blocked
   (`ROADMAP.md:68`).
6. **Release identity/version:** README says `0.0.1-prebeta` and links a legacy
   hosted Noctyrium URL (`README.md:23-32,151-156`); Alpha guide describes
   `0.1.0-alpha.1` and `jaclose/AXOM` (`docs/ALPHA-RELEASE.md:1-5,142-145`).
7. **Habit maturity:** older audit calls habits experimental
   (`IMPLEMENTATION_AUDIT.md:30-31`); later shipped record presents fairness and
   daily-success integration as implemented (`FEATURES.md:152-159,418-422`).
8. **Journal energy evidence:** old audit says Journal signals contribute to
   readiness (`IMPLEMENTATION_AUDIT.md:20`); current shipped contract excludes
   unconfirmed Journal-language signals (`FEATURES.md:490-494`).
9. **Productivity daily-file design:** native historical architecture is
   incomplete (`docs/PRODUCTIVITY-ARCHITECTURE.md:1-56`), while the web product
   explicitly replaced native file I/O (`CHANGELOG.md:194-210`). It is not a
   current web requirement without owner action.
10. **Course Central implementation language:** architecture calls Levels 0/1
    buildable now/next (`docs/COURSE-CENTRAL-ARCHITECTURE.md:167-177`), while
    Phase A authorizes no implementation and the architecture itself forbids
    live Levels 2/3 without authorization (`:3-6,179-191`).

## L. Source coverage and exclusions

| Source | Coverage outcome |
| --- | --- |
| `README.md` | Product identity, current platform/persistence, cloud/API claims, limitations, update channels, hosted/native/legacy boundaries. |
| `FEATURES.md` | Shipped non-Question daily loop, Dashboard, Journal, Daily Games, Reports, AI, data safety, onboarding, identity, and known boundaries. |
| `ROADMAP.md` | Proposed/blocked/in-progress AI, platform, accessibility, Course, Journal, games, accounts, performance, calendar, and secondary surfaces. |
| `IMPLEMENTATION_AUDIT.md` | Historical verified/unfinished features and technical/data risks; later shipped evidence treated as superseding old findings only where explicit. |
| `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md` | Daily job, psychology, product patterns, anti-patterns, opportunity rationale, and relative historical leverage. |
| `CHANGELOG.md` | Historical shipped behavior, identity, daily loop, Anki, resources, Help, packaging, native/web transition, and obsolete daily-file bugs. |
| `docs/PRE-ALPHA-CONTRACT.md` | Binding older product pillars, permanent philosophy, no-black-box rule, Alpha tier evidence, and deferred boundaries. |
| `docs/COMMAND-BRIEF-EVIDENCE.md` | Complete Command Brief product contract, activation, sources, inspectable ranking, recovery, and persistence boundary. |
| `docs/COURSE-CENTRAL-ARCHITECTURE.md` | Complete Course Central promise, hard boundaries, levels, learner page, classification, templates, graph, and community support. |
| `docs/DASHBOARD-WIDGET-ARCHITECTURE.md` | Complete Dashboard jobs, widget decisions/catalog, layout/settings/accessibility, compatibility, backup, acceptance. |
| `docs/JOURNAL-NOTEBOOK-ARCHITECTURE.md` | Complete Foundation/Cinematic boundary, persistence, autosave, Day at a Glance, local images, accessibility, extension seams. |
| `docs/PRODUCTIVITY-ARCHITECTURE.md` | Historical native daily-file architecture only; explicitly separated from current web product. |
| `docs/DAILY-LOOP-REMINDER-LIFECYCLE.md` | Complete reminders, eligibility, delivery, device ledger, Check-In/closeout effects. |
| `docs/TARGET-CONTRIBUTION-LEDGER.md` | Complete target contribution purpose, rows, matching, correction, schedules, persistence. |
| `docs/UPDATE-POLICY.md` | Complete update channels, data separation, user safety, future native update plan. |
| `docs/ALPHA-RELEASE.md` | Release channels, persistence QA, optional services/admin TODO, and unresolved release blockers. |
| Ratified governance | Canonical categories/status/boards, Constitution, Lexicon, and UX standards used as constraints—not mined as implementation requirements. |

**Quantified exclusions:** three roadmap items were deliberately assigned to the
Question-system pass rather than duplicated here: Dashboard/Reports quiz-session
surfacing, Pitfall Map, and AI error-type classification. Question import,
parser, review, quiz, annotations, sets, trust, and attachment work are wholly
excluded. Product ideas known only from unsupplied historical conversations are
listed as gaps, not invented.

## M. Catalogue counts

This catalogue contains **100 deduplicated evidence candidates/notes**:

| Provisional category | Count |
| --- | ---: |
| Feature | 57 |
| Product Decision | 20 |
| Product Debt | 3 |
| Technical Debt | 7 |
| Research | 13 |
| Bug | 0 |
| Polish | 0 |
| **Total** | **100** |

The zero Bug count is deliberate: the reviewed documents contain historical
bugs and current limitations, but this read-only source pass did not reproduce a
current non-Question defect. Historical or suspected issues remain
reconstruction notes rather than being falsely promoted to confirmed Bugs.

The zero Polish count is also deliberate: governing standards and broad owner
themes are not evidence of a specific product deviation. Specific quote,
spacing, typography, hover, button, sidebar, and other micro-polish records
require exact conversation/manual-QA evidence.

Observed status is intentionally preserved per candidate rather than collapsed
into a single numeric status table: several candidates carry two legitimate
historical states (for example, an implemented foundation plus a proposed
extension, or an old `next` label plus a later post-Alpha tier). Converting those
mixed states into one count would silently resolve the very conflicts this pass
must protect. None of the observed states grants canonical `Verified`.

### Record-completeness warning

No candidate in this catalogue should be copied mechanically into the canonical
backlog. The historical sources almost never provide all of:

- owner-authored immutable Design Intent, Product Principle, and User Feeling;
- a canonical `P0`–`P3` assignment;
- exactly one canonical board;
- Impact and Confidence;
- a Product Owner-approved Success Metric;
- a complete Explicit Exclusions set.

The evidence-rich candidates can support owner-authored records. Candidates
marked **Reconstruction note only** must remain notes. Candidates marked
**Owner Decision Required** contain conflicts or missing authority that this
archivist pass is forbidden to resolve.

## N. Remaining knowledge gaps

1. Historical AXOM/Noctyrium conversations were not available to this subagent;
   conversation-only product intent remains outside this catalogue.
2. No Fable review files were among the assigned readable sources, so no
   reviewer-only findings are represented.
3. No Sol audit artifact was assigned; browser/gate verification cannot be
   promoted into backlog `Verification`.
4. Fine-grained owner polish observations—quote placement, dashboard spacing,
   sidebar persistence, button radii, hover timing, typography, glass, loading
   states, and Settings wording—must be mined from conversations/manual QA.
5. Detailed Reports 2.0, Knowledge Graph, mastery-engine, account-architecture,
   and Wave 6 consolidation source documents were referenced but not assigned;
   only the boundaries visible in reviewed sources are recorded.
6. Core surfaces with only a one-line “functional” claim (Tasks,
   Application/Residency, Pre-Med) lack enough Product DNA and acceptance detail
   for canonical records.
7. Canonical Lexicon definitions are still absent for Course Tracker, Daily
   Check-In, Daily Closeout, Recovery Protocol, Reports, Journal, Pomodoro,
   Card Vault, Tasks, and several academic-prep terms. Backlog records can cite
   no nonexistent Lexicon anchor; this must be recorded rather than guessed.

## O. Integrity checks applied to this evidence catalogue

- Candidate labels C-01 through C-100 are contiguous catalogue-local labels,
  not AX IDs.
- Every candidate has one provisional category and one dedupe key.
- No current Bugs were inferred from historical documents.
- Question-system candidates are excluded rather than duplicated.
- Superseded historical defects are preserved as history, not silently reported
  as regressions.
- Conflicting sources are preserved in §K and marked for Product Owner decision.
- No implementation approach, effort estimate, code change, checkpoint, commit,
  or architecture proposal is authorized by this file.
- Repository working files were not modified by this evidence-mining task.

---

## AXOM-0002b.1 addendum (appended; all line numbers above are unchanged)

This catalogue is preserved verbatim as an AXOM-0002a historical artifact.
The AXOM-0002b independent audit (docs/product-memory/AXOM-0002B/AUDIT-REPORT.md,
finding A3) found that the three §J/§L rows deliberately assigned to the
Question-system pass — Dashboard/Reports quiz-session surfacing (`ROADMAP.md:80`),
Pitfall Map (`ROADMAP.md:81`), and AI error-type classification (`ROADMAP.md:58`) —
were never represented by that pass. AXOM-0002b.1 restored them as ledger
records `CAND-000194`–`CAND-000196` from the locators preserved in those rows.
Nothing else in this catalogue was altered.

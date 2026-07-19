# AXOM historical review and owner-evidence catalogue

Read-only institutional-memory mining for AXOM-0002. This file proposes no AX
IDs and makes no repository change.

## Boundary and evidence discipline

- The raw Codex search matched 87 AXOM/Noctyrium JSONL session files. The
  owner-message filter reduced that to nine substantive session chronologies
  containing 48 unique user-role messages (317,172 characters). Generated
  environment/plugin messages, subagent forks, assistant messages, tool output,
  short continuation commands, and duplicated attachment wrappers were not
  treated as product authority.
- The substantive owner corpus spans 2026-06-13 through 2026-07-16. Duplicate
  June 13/14 histories were deduplicated by exact message hash. Relevant
  attachments were read at their canonical paths rather than counted again.
- Repository evidence was limited to read-only git history, `docs/FIELD-NOTES.md`,
  `ASK_DETAILED_REPORT.md`, the `/tmp/axom-sol-full-audit` package, and the
  tracked site/beta audit reports requested by the parent task.
- Reviewer findings are evidence of a finding, not evidence that the Product
  Owner accepted a proposed solution. Reviewer-only recommendations below are
  marked incomplete where Product DNA is absent.
- Historical implementation prompts prove intent at that date. They do not by
  themselves prove current implementation or verification. Git commits and
  accepted gate reports are cited separately.
- Identity-specific URLs, private resource links, and personal content were not
  reproduced here.

## Source key

- **Owner alpha corpus:** owner-role messages in
  `/Users/jd/.codex/sessions/2026/06/14/rollout-2026-06-14T17-44-15-019ec817-abc3-7351-8840-3d3398cd851b.jsonl`.
- **Owner blueprint corpus:** owner-role messages in
  `/Users/jd/.codex/sessions/2026/06/20/rollout-2026-06-20T19-22-24-019ee757-b054-7a81-b030-716dde7697e2.jsonl`.
- **Owner update corpus:** owner-role message in
  `/Users/jd/.codex/sessions/2026/07/09/rollout-2026-07-09T14-12-40-019f4814-f385-7c10-a91b-73bdf240c09d.jsonl`.
- **Owner checkpoint corpus:** owner-role messages in
  `/Users/jd/.codex/sessions/2026/07/10/rollout-2026-07-10T14-21-20-019f4d43-3ed0-7b02-ab2e-602e42e268ac.jsonl`,
  `/Users/jd/.codex/sessions/2026/07/11/rollout-2026-07-11T16-28-46-019f52de-469e-7363-8169-f44c447892ad.jsonl`,
  and
  `/Users/jd/.codex/sessions/2026/07/16/rollout-2026-07-16T22-07-19-019f6dd4-06ac-7591-951c-4bfb7de5cdf9.jsonl`.
- **Full audit:** `/tmp/axom-sol-full-audit/AXOM-FULL-REPOSITORY-AND-PRODUCT-AUDIT.md`,
  `AXOM-FINDINGS.csv`, `AXOM-DEFERRED-FEATURE-LEDGER.csv`,
  `AXOM-STORAGE-AND-BACKUP-MAP.md`, `AXOM-ACCESSIBILITY-AUDIT.md`,
  and `AXOM-PERFORMANCE-AUDIT.md`, generated 2026-07-16 against baseline
  `26707a8`.
- **Historical audit:** `ASK_DETAILED_REPORT.md`, dated 2026-07-08.
- **Directives:** attachments `85c0440c…` (Pre-Beta),
  `5bc1d2b2…` (Question Bank/UI rehaul), `e5bccbe6…` (Wave 3),
  `c05800af…` (Wave 5), `ef1323da…` (Wave 5.5A),
  `ac58344a…` (Wave 5.5D), and `3dbc3f68…` (structured trust).

## Canonical candidate records

### AXOM is a local-first academic operating partner

- **Category / area / observed status:** Product Decision; Core Product;
  repeatedly stated and implemented in the shipped core.
- **Product evidence:** Design intent is a durable medical-student operating
  system rather than disconnected tools. Core promise: meaningful work remains
  usable offline and under the learner's control. Owner feeling: personal,
  dependable, “on their side,” and easier than manually managing a study
  system.
- **Acceptance/success evidence:** ordinary daily workflows remain useful
  without cloud; local data survives reload; product truth does not imply
  unavailable intelligence or integrations.
- **Sources:** Pre-Beta directive lines 1–40; Wave 5.5D lines 24–63; full audit
  §§1, 5, 17, 20.
- **Conflict/unknown:** none for local-first canonical ownership. Cloud scope is
  a separate unresolved record.
- **Dedupe key:** `core/local-first-operating-partner`.

### Application updates replace code, never user progress

- **Category / area / observed status:** Product Decision; Data Safety;
  implemented in migration/backup primitives, field upgrade proof still
  partial.
- **Product evidence:** Owner's historical rule separates disposable app files
  from sacred user data. Core promise: an update never requires the learner to
  reconstruct work.
- **Acceptance/success evidence:** schema-aware additive migration, backup
  before mutation, failure leaves old data intact, destructive reset requires
  confirmation, same-origin update preserves the vault.
- **Sources:** direct owner feedback attachment `e099bf42…`, “The key mental
  model” and “update safety checklist”; owner update corpus primary message;
  full audit §§18–19; storage map Safety verdict.
- **Conflict/unknown:** two-build populated-workspace upgrade and origin-change
  migration remain unproven.
- **Dedupe key:** `data/update-preserves-user-work`.

### Ease, convenience, and one clear action govern visible surfaces

- **Category / area / observed status:** Product Decision; General UX;
  accepted and repeatedly applied.
- **Product evidence:** Design intent is to make daily work faster and calmer.
  Principle: remove or demote roughly 10–20% of low-value visible content,
  keep one primary action, and use plain language. User feeling: the product is
  intentional rather than patched together.
- **Acceptance/success evidence:** no equal-weight action walls, empty
  analytics, primary-surface diagnostics, or click that cannot justify itself.
- **Sources:** Wave 5.5A lines 22–53; Wave 5.5D lines 24–63; Question Bank/UI
  directive lines 403–466.
- **Conflict/unknown:** the percentage is a design heuristic, not a quota that
  authorizes deletion of functionality or data.
- **Dedupe key:** `ux/ease-convenience-primary-action`.

### AXOM must never pretend to be intelligent

- **Category / area / observed status:** Product Decision; AI/Product Truth;
  accepted, core deterministic paths comply.
- **Product evidence:** Design intent is intelligence that remains inspectable
  and honest. Product truth: no placeholder intelligence, fake AI, hidden
  provider call, or unsupported confidence. Core promise: suggestions never
  silently become canonical user facts.
- **Acceptance/success evidence:** provider-free core remains functional;
  generated or inferred output is labeled, evidence-backed, reviewable, and
  optional.
- **Sources:** Wave 5.5D lines 24–63 and 352–410; Question Bank/UI directive
  lines 468–528; full audit §§20, 30.
- **Conflict/unknown:** historical “AI suggested actions” and local-AI requests
  were later narrowed; the later no-fake-AI rule controls presentation, but
  future AI product scope still requires owner records.
- **Dedupe key:** `ai/truthful-optional-evidence-backed`.

### Question Bank flagship loop is Import → Review → Practice → Understand

- **Category / area / observed status:** Product Decision; Question Bank;
  implemented and verified at the landing/workflow level.
- **Product evidence:** Design intent is that a new user understands the
  primary action within about five seconds. Core promise: messy source material
  becomes reviewable, trusted practice rather than opaque automation.
- **Acceptance/success evidence:** one dominant import action, uncertain
  mappings reviewed, only finalized questions runnable, returning users see
  continuation and review needs first.
- **Sources:** Wave 3 attachment lines 74–130 and 158–245; Question Bank/UI
  directive lines 274–327 and 763–770; commit `c1328f3`.
- **Conflict/unknown:** none.
- **Dedupe key:** `question-bank/import-review-practice-understand`.

### Uncertainty is safer than a false-ready question

- **Category / area / observed status:** Product Decision; Question Integrity;
  implemented and verified for pasted text and CSV/JSON.
- **Product evidence:** Product truth: a higher unresolved rate is preferable
  to a wrongly trusted answer. Explicit evidence is preserved; uncertainty is
  surfaced; no path defaults to A.
- **Acceptance/success evidence:** `falseReady = 0`, mixed keys do not collapse,
  harmless drift remains a review-gated candidate, contradiction remains
  unresolved, and user confirmation outranks reparsing.
- **Sources:** Wave 5.5D lines 88–268; structured trust attachment lines 39–116
  and 162–272; commits `b94e6f1` and `cdfff38`.
- **Conflict/unknown:** none after `cdfff38`.
- **Dedupe key:** `question-bank/false-ready-zero`.

### Current mastery and historical attempt accuracy are distinct truths

- **Category / area / observed status:** Product Decision; Question Analytics;
  owner-resolved and implemented.
- **Product evidence:** Current mastery answers “How am I doing now?” using the
  latest scored attempt per active question; all-attempt accuracy remains a
  separately named historical metric.
- **Acceptance/success evidence:** no ambiguous “Accuracy” label where either
  semantic could apply; retries do not permanently masquerade as current
  mastery.
- **Sources:** owner checkpoint corpus 2026-07-10 message beginning “Give
  Claude’s report to Sol,” decisions 3–4; Wave 3 lines 351–386; commit
  `c1328f3`.
- **Conflict/unknown:** reviewer originally flagged this as a product choice;
  owner explicitly resolved it.
- **Dedupe key:** `question-bank/mastery-vs-historical-accuracy`.

### Daily success is user-selected and never Anki-mandatory

- **Category / area / observed status:** Product Decision; Daily Loop;
  implemented and verified in Wave 5.5A/B.
- **Product evidence:** A successful day reflects the learner's enabled
  requirements, schedule, and chosen units; the product must not punish someone
  for a capability they never enabled.
- **Acceptance/success evidence:** Anki/cards can be disabled; new requirements
  create no historical misses; daily/weekday/weekly schedules respect tracking
  start; neutral state precedes fair evaluation.
- **Sources:** Wave 5.5A lines 184–230; commit `1b66a39`.
- **Conflict/unknown:** none.
- **Dedupe key:** `daily-loop/configurable-success-no-mandatory-anki`.

### Reports must explain denominators, provenance, and next meaning

- **Category / area / observed status:** Product Decision; Reports;
  implemented foundation, deeper Reports 2.0 deferred.
- **Product evidence:** Reports answer what changed, what drove it, what the
  learner should do next, and which records produced the number.
- **Acceptance/success evidence:** no “31 failed days” for a new user, no
  percentage without context, and essential meaning is not hover-only.
- **Sources:** Wave 5.5A lines 328–411; commit `1b66a39`; full audit §13.
- **Conflict/unknown:** monthly/readiness visualization depth remains deferred.
- **Dedupe key:** `reports/explainable-traceable-metrics`.

### Readiness and energy are optional, explainable, and non-diagnostic

- **Category / area / observed status:** Product Decision; Wellbeing;
  partially implemented.
- **Product evidence:** The system may organize self-reported and deterministic
  signals, but must not diagnose, silently infer conclusions from journal text,
  or moralize health behavior.
- **Acceptance/success evidence:** visible factors/weights, possible signals
  require confirmation, manual correction is preserved, opt-out/deletion exists.
- **Sources:** Pre-Beta directive lines 441–544; full audit §§11, 30; deferred
  ledger “Readiness/sleep/food/wellbeing/day-at-a-glance/monthly progress.”
- **Conflict/unknown:** June owner examples asked for broad inference from
  journal language, injuries, addictions, and roadblocks; later directives and
  audit impose non-clinical boundaries. Any expansion beyond current
  deterministic evidence is **Owner Decision Required**.
- **Dedupe key:** `wellbeing/readiness-nondiagnostic-explainable`.

### Habit recovery language is non-punitive

- **Category / area / observed status:** Product Decision; Habits;
  habit surface remains WIP.
- **Product evidence:** Misses can be partial, intentional skips, rescheduled,
  or recovery starts; shame-heavy streak mechanics are rejected.
- **Acceptance/success evidence:** reminders stop after completion, quiet mode
  exists, user selects escalation, and copy supports recovery.
- **Sources:** Pre-Beta directive lines 353–439; full audit feature matrix
  `#habits`.
- **Conflict/unknown:** complete Habit Tracker release scope is not verified.
- **Dedupe key:** `habits/nonpunitive-recovery`.

### Safe soft limits remain overrideable

- **Category / area / observed status:** Product Decision; General UX;
  applied to Pomodoro presets and dashboard XL widgets.
- **Product evidence:** The product recommends restraint without taking
  control away when no technical necessity exists.
- **Acceptance/success evidence:** explain the recommendation, offer explicit
  override, preserve a “do not ask again” choice where appropriate.
- **Sources:** Wave 5.5A lines 413–450; Wave 5.5D lines 1019–1059; commits
  `1b66a39` and `dea9840`.
- **Conflict/unknown:** none.
- **Dedupe key:** `ux/soft-limit-with-override`.

### AXOM Daily Word is original, deterministic, local, and offline-safe

- **Category / area / observed status:** Product Decision; Daily Games;
  implemented and verified.
- **Product evidence:** Daily Word is an AXOM-specific daily utility, not an
  official Wordle clone or network dependency. It remains subordinate to core
  study modules.
- **Acceptance/success evidence:** versioned local lists, correct duplicate
  scoring, date/timezone determinism, no answer in share output, no workspace
  localStorage, offline reopening after first load.
- **Sources:** Wave 5 attachment lines 73–395 and 527–713; commit `ba9c4a8`;
  full audit §14.
- **Conflict/unknown:** Wave 5.5D called it “AI work,” but accepted behavior and
  code evidence are deterministic/provider-free. Do not create an AI
  dependency from that phrase.
- **Dedupe key:** `daily-games/daily-word-local-original`.

### Doctordle remains a truthful WIP until explicit collaboration approval

- **Category / area / observed status:** Product Decision; Daily Games;
  Deferred/WIP.
- **Product evidence:** Visible capability may remain discoverable, but AXOM
  must not imply affiliation or manufacture an integration.
- **Acceptance/success evidence:** no iframe, external launch, scraping, proxy,
  copied gameplay, health check, or fake playable controls before approval.
- **Sources:** Wave 5 lines 714–761; commit `ba9c4a8`; full audit §§6, 14.
- **Conflict/unknown:** actual collaboration/integration direction is **Owner
  Decision Required** after external authorization.
- **Dedupe key:** `daily-games/doctordle-approval-boundary`.

### Anki workflows must remain useful without AnkiConnect

- **Category / area / observed status:** Product Decision; Anki;
  export/review foundation implemented, direct bridge unverified.
- **Product evidence:** CSV/TSV, clipboard, and manual instructions are
  first-class; a local browser bridge cannot be the only route.
- **Acceptance/success evidence:** generated cards remain editable and locally
  reviewable; note-type mapping is clear; integration status says not verified
  until the owner confirms it.
- **Sources:** Pre-Beta lines 749–827; owner blueprint corpus messages 4–10,
  including explicit “verified means I confirmed it works”; historical audit
  §§6, 9.
- **Conflict/unknown:** direct hosted-page AnkiConnect repeatedly failed in
  owner testing. It must not be marked Verified from unit or diagnostic
  evidence alone.
- **Dedupe key:** `anki/useful-without-direct-bridge`.

### Incomplete capability is visible only with honest status

- **Category / area / observed status:** Product Decision; Release Truth;
  typed badges implemented, multiple modules remain WIP.
- **Product evidence:** Planned capability can remain visible as ecosystem
  context, but cannot pretend to work.
- **Acceptance/success evidence:** WIP/BUILDING/Under Construction label,
  concise limitation, no fake progress or dead action.
- **Sources:** owner alpha corpus large Alpha release directive, “Under
  Construction UI Pattern”; owner blueprint corpus message 10; full audit
  feature matrix.
- **Conflict/unknown:** whether incomplete routes remain in default Alpha
  navigation is still **Owner Decision Required**.
- **Dedupe key:** `release/truthful-incomplete-modules`.

### User-facing identity is AXOM; Noctyrium survives only where compatibility requires it

- **Category / area / observed status:** Product Decision; Identity;
  partially complete.
- **Product evidence:** Official visible name is uppercase AXOM with restrained
  premium identity; frozen storage keys may retain historical names to prevent
  migration loss.
- **Acceptance/success evidence:** no old visible logo/brand, consistent
  browser/PWA/about/help naming, compatibility keys unchanged unless migrated.
- **Sources:** Question Bank/UI directive lines 773–1195; commit `3a8069b`;
  historical audit §§1, 3; full audit §§4, 16, 29.
- **Conflict/unknown:** remote repository, hosted URL, native metadata, and
  Field Notes remain legacy-branded.
- **Dedupe key:** `identity/axom-visible-noctyrium-compatibility-only`.

### Promise of Use is a personal accountability moment, not a legal trap

- **Category / area / observed status:** Product Decision; Onboarding/Journal;
  implemented and verified foundation.
- **Product evidence:** The tool does not create discipline; the learner's
  honest return gives it meaning. Desired feeling is solemn, personal,
  restrained, and memorable rather than coercive or religiously specific.
- **Acceptance/success evidence:** first safe post-guide presentation occurs
  after complete/skip/opt-out; Sign now/Review later/Skip for now remain
  available; focus is not trapped; signed metadata is preserved.
- **Sources:** owner alpha corpus large Alpha release directive, “Journal
  Promise Cutscene”; Wave 5.5D lines 896–966; commits `997fac8`, `5c35e77`,
  `dea9840`.
- **Conflict/unknown:** early source said restarting guide permits signing
  again; later accepted logic version-scopes/suppresses repeated presentation.
  Preserve signed history and require owner intent before changing replay
  semantics.
- **Dedupe key:** `onboarding/promise-accountability-not-legal`.

### Command Brief is the grounded dominant dashboard surface

- **Category / area / observed status:** Product Decision; Dashboard;
  implemented and verified.
- **Product evidence:** It ranks one best next action from real user evidence,
  explains why, and remains neutral while learning. It replaces redundant fake
  suggested-action surfaces.
- **Acceptance/success evidence:** no seed-confidence claim; one dominant brief;
  weighted evidence visible; quote/welcome do not out-shout it.
- **Sources:** Wave 5.5D lines 270–410; commits `5c35e77`, `0b7f7e0`.
- **Conflict/unknown:** none.
- **Dedupe key:** `dashboard/grounded-command-brief-dominant`.

### Snapshot Question Sets use stored membership and order as authority

- **Category / area / observed status:** Product Decision; Question Sets;
  implemented and verified.
- **Product evidence:** A filtered set is a reproducible snapshot, not a live
  reconstruction. The learner can relaunch the same session order after
  reload/backup.
- **Acceptance/success evidence:** explicit `questionIds` preserve relative
  order, skip deleted IDs, never require backlinks, never call randomness;
  legacy backlink sets remain compatible.
- **Sources:** owner checkpoint corpus 2026-07-16 deterministic-set cleanup
  message; commits `8439f97` and `9654ba2`.
- **Conflict/unknown:** none after `9654ba2`.
- **Dedupe key:** `question-sets/snapshot-membership-order-authoritative`.

### Question annotations are learner-owned overlays, never source rewrites

- **Category / area / observed status:** Product Decision; Question
  Annotations; implemented and verified.
- **Product evidence:** Highlights/notes survive learning activity and source
  corrections without mutating imported question text. Ambiguous anchors are
  repairable, never guessed.
- **Acceptance/success evidence:** source hash plus offsets/context, repair
  status, keyboard/non-color semantics, reload/backup persistence, no device
  preference leak.
- **Sources:** commit `80c8e5b`; Q2b design included in owner checkpoint corpus.
- **Conflict/unknown:** none.
- **Dedupe key:** `question-annotations/learner-overlay-source-immutable`.

### Accepted shell identity, statuses, and theme system

- **Category / area / observed status:** Feature; Shell; Verified.
- **Product evidence:** premium AXOM identity plus truthful module state and
  user-controlled Light/Dark/System appearance.
- **Acceptance/success evidence:** accessible disclosure, device-local theme,
  flash-free paint, cross-tab/OS sync, no schema regression.
- **Sources:** Wave 2 attachment acceptance summary; commit `3a8069b`.
- **Conflict/unknown:** none.
- **Dedupe key:** `completed/shell-identity-status-theme`.

### Focused Question Bank first-use and returning command center

- **Category / area / observed status:** Feature; Question Bank; Verified.
- **Product evidence:** new users get one obvious action; returning users get
  continuation, recent sets, and review issues.
- **Acceptance/success evidence:** empty analytics hidden; deterministic recent
  order; mapping counts accurate; mastery/accuracy labels distinct.
- **Sources:** Wave 3 attachment; commit `c1328f3`.
- **Conflict/unknown:** none.
- **Dedupe key:** `completed/question-bank-entry-command-center`.

### Settings, recovery, onboarding, guide, and Promise architecture

- **Category / area / observed status:** Feature; Onboarding/Settings;
  Verified.
- **Product evidence:** setup remains comprehensible, recovery actions are real
  and non-destructive, and local-first language remains truthful.
- **Acceptance/success evidence:** five settings sections, four onboarding
  steps, seven meaningful tour steps, optional exact-date reminders, schema
  v32, no workspace localStorage.
- **Sources:** Wave 4 acceptance in attachment `c05800af…` lines 1–69; commit
  `997fac8`.
- **Conflict/unknown:** none.
- **Dedupe key:** `completed/settings-recovery-onboarding`.

### Optional Daily Games, Daily Word, Doctordle boundary, and clocks

- **Category / area / observed status:** Feature; Daily Games/Clock; Verified.
- **Product evidence:** optional daily utility adds life without displacing
  core study work.
- **Acceptance/success evidence:** disabled by default, preserved state,
  deterministic Daily Word, accessible clock, lazy/offline isolation, truthful
  Doctordle WIP.
- **Sources:** Wave 5 attachment; commit `ba9c4a8`; full audit §14.
- **Conflict/unknown:** Doctordle integration remains excluded.
- **Dedupe key:** `completed/daily-games-clock-foundation`.

### Configurable daily loop, fast activity logging, reports, and Pomodoro presets

- **Category / area / observed status:** Feature; Daily Loop; Verified.
- **Product evidence:** logging takes seconds and success reflects user-selected
  requirements rather than product assumptions.
- **Acceptance/success evidence:** neutral first state, rotating examples,
  recent/frequent actions, schedule-aware metrics, soft-limit presets,
  background timer safety.
- **Sources:** Wave 5.5A attachment; commit `1b66a39`.
- **Conflict/unknown:** none.
- **Dedupe key:** `completed/daily-loop-stabilization`.

### Core comprehension and real-import reliability checkpoint

- **Category / area / observed status:** Feature; Cross-product/Question Bank;
  Verified.
- **Product evidence:** users can understand current product truth and trust
  imported questions through inspectable provenance.
- **Acceptance/success evidence:** mixed keys preserved, no fallback A,
  real-import verifier, source-only save, truthful onboarding/help/feedback,
  deterministic Command Brief.
- **Sources:** commit `5c35e77`; accepted 657 tests and 4 browser journeys in
  commit body.
- **Conflict/unknown:** later Q1/structured trust commits closed remaining
  drift semantics.
- **Dedupe key:** `completed/core-comprehension-import-reliability`.

### Dashboard widgets, daily continuity, and journal notebook foundation

- **Category / area / observed status:** Feature; Dashboard/Daily Loop/Journal;
  Implemented with repository tests; historical commit lacks an explicit
  independent-review body.
- **Product evidence:** dashboard layout is personal and configurable; daily
  check-in/activity/closeout form one loop; journal stores the day's meaning.
- **Acceptance/success evidence:** widget add/hide/size/order/preferences,
  contribution ledger, reminder lifecycle, notebook page/autosave/day summary.
- **Sources:** owner Wave 5.5D directive; commit `dea9840`; full audit
  §§10–12.
- **Conflict/unknown:** classify as Implemented, not Verified solely from the
  generic commit subject. Later full audit supplies independent evidence for
  core behavior, not every rendered state.
- **Dedupe key:** `implemented/widgets-daily-continuity-journal-foundation`.

### Pasted-text explicit-answer candidate preservation

- **Category / area / observed status:** Feature; Question Import; Verified.
- **Product evidence:** preserve explicit evidence without treating drift as
  trusted.
- **Acceptance/success evidence:** harmless drift candidate, exact contradiction
  unresolved, unknown never A, false-ready zero.
- **Sources:** commit `b94e6f1`.
- **Conflict/unknown:** none.
- **Dedupe key:** `completed/q1-paste-answer-trust`.

### Q2a reading tools and answer elimination

- **Category / area / observed status:** Feature; Quiz Player; Verified.
- **Product evidence:** reduce friction while reading and reasoning without
  changing answer state or canonical workspace data.
- **Acceptance/success evidence:** strikeout/shortcuts/reset, focus/scroll on
  advance, device-only scale, session calculator, rationale prioritization.
- **Sources:** commit `943a3f9`, 24/24 browser proof in commit body.
- **Conflict/unknown:** none.
- **Dedupe key:** `completed/q2a-reading-elimination`.

### Persistent highlights and plain question notes

- **Category / area / observed status:** Feature; Question Annotations;
  Verified.
- **Product evidence:** the learner can carry interpretation across sessions
  without altering the source.
- **Acceptance/success evidence:** stem/explanation highlights, note autosave,
  reconciliation/repair, backup merge, non-color semantics.
- **Sources:** commit `80c8e5b`.
- **Conflict/unknown:** original low overlap carry-forward closed separately.
- **Dedupe key:** `completed/q2b1-highlights-notes`.

### Structured CSV/JSON explicit-answer trust unification

- **Category / area / observed status:** Feature; Question Import; Verified.
- **Product evidence:** evidence quality, not file format, governs answer trust.
- **Acceptance/success evidence:** resolved/candidate/conflict/unresolved result,
  user confirmation, non-runnable candidates, diagnostics preserved.
- **Sources:** structured trust attachment; commit `cdfff38`.
- **Conflict/unknown:** none.
- **Dedupe key:** `completed/structured-answer-trust`.

### Annotation overlap and deletion integrity

- **Category / area / observed status:** Feature; Question Annotations;
  Verified.
- **Product evidence:** storage and rendering tell the same truth; annotations
  are deterministic rather than silently trimmed or merged.
- **Acceptance/success evidence:** overlap rejected per target, adjacent allowed,
  repair anchors block, whitespace ignored, deletion affects only one record.
- **Sources:** owner checkpoint corpus Q2b-1.1 message; commit `1e06a94`.
- **Conflict/unknown:** none.
- **Dedupe key:** `completed/annotation-overlap-integrity`.

### Persistent image attachments to question notes

- **Category / area / observed status:** Feature; Question Annotations;
  Implemented; verification detail is not present in the commit body.
- **Product evidence:** learner-owned image notes extend annotations without
  source mutation.
- **Acceptance/success evidence:** owner Q2b design required separate binary
  lifecycle, explicit backup semantics, MIME/size controls, cleanup, and object
  URL revocation.
- **Sources:** commit `2f4f290`; owner checkpoint corpus Q2b directive.
- **Conflict/unknown:** do not mark Verified from the terse commit alone;
  confirm attachment backup/orphan acceptance evidence in repository tests.
- **Dedupe key:** `implemented/question-image-note-attachments`.

### Normalized tags and deterministic Question Sets

- **Category / area / observed status:** Feature; Question Bank;
  Implemented; set-launch defect required a follow-up.
- **Product evidence:** learner tags remain distinct from imported curriculum
  metadata, and saved filtered sets are reproducible snapshots.
- **Acceptance/success evidence:** normalized duplicate prevention,
  keyboard-operable filters, explicit membership/order/seed provenance.
- **Sources:** commit `8439f97`; deterministic cleanup owner message.
- **Conflict/unknown:** end-to-end runnable behavior is verified only together
  with follow-up `9654ba2`.
- **Dedupe key:** `completed/question-tags-deterministic-sets`.

### Deterministic snapshot-set launch compatibility

- **Category / area / observed status:** Bug; Question Sets; Verified fixed.
- **Sourced priority/board:** independent review called the defect a required
  correctness blocker.
- **Evidence and impact:** filter-created sets held `questionIds` but the
  runner used legacy `question.setId`, producing “No questions match.”
- **Acceptance/success evidence:** explicit IDs authoritative, no shuffle or
  `Math.random`, missing IDs skipped, legacy fallback preserved, reload/backup
  order identical.
- **Sources:** owner checkpoint corpus cleanup message; commit `9654ba2`.
- **Dedupe key:** `bug-fixed/snapshot-set-empty-launch`.

### Legacy cloud snapshots lack universal authenticated ownership

- **Category / area / observed status:** Bug; Security/Accounts; Open at audit
  baseline.
- **Sourced severity/board:** HIGH; before closed Alpha.
- **Evidence and impact:** legacy load/save paths accept UUID/name without
  attaching a verified session, exposing private academic/journal/question
  snapshots if cloud is enabled.
- **Acceptance/success evidence:** every data endpoint verifies session and
  ownership, or cloud controls remain disabled in external builds.
- **Sources:** full audit finding AX-001 and §§20, 30.
- **Product DNA gap:** audit establishes harm and containment, but owner must
  choose disable-through-Alpha versus funded secure-account work.
- **Dedupe key:** `security/cloud-snapshot-authorization`.

### Identity-specific resource links are compiled into public defaults

- **Category / area / observed status:** Bug; Privacy/Resources; Open at audit
  baseline.
- **Sourced severity/board:** HIGH; before friend Alpha.
- **Evidence and impact:** personal Drive/Notion/MEGA labels and URLs are
  visible to every deployed user and repository reader.
- **Acceptance/success evidence:** public builds contain only reviewed public
  resources; personal defaults live in private/local fixtures.
- **Sources:** full audit finding AX-002; owner alpha and blueprint corpora show
  the historical request for permanent personal/SGU drives.
- **Conflict/unknown:** historical convenience intent conflicts with later
  privacy evidence. **Owner Decision Required** for every shippable resource.
- **Dedupe key:** `privacy/public-personal-resource-defaults`.

### Web-local installation is not a complete supported dependency boundary

- **Category / area / observed status:** Bug; Build/Packaging; Open at audit
  baseline.
- **Sourced severity/board:** HIGH; before Alpha CI.
- **Evidence and impact:** root install supplies `@types/node`; documented
  web-only install cannot typecheck/build tests importing Node built-ins.
- **Acceptance/success evidence:** either declare the dependency in `web` and
  support standalone installs, or document root-only authority and isolate
  production/test tsconfigs.
- **Sources:** full audit finding AX-003, Quality Gates “Build contradiction.”
- **Product DNA gap:** repair choice is engineering authority; Product Owner
  need only decide whether web-local installation is a promised workflow.
- **Dedupe key:** `build/root-web-install-boundary`.

### Service worker runtime caching is overbroad and unbounded

- **Category / area / observed status:** Bug; Offline/Update; Open at audit
  baseline.
- **Sourced severity/board:** MEDIUM; before public Alpha.
- **Evidence and impact:** every same-origin GET can enter one unbounded release
  cache, including dynamic/API responses.
- **Acceptance/success evidence:** static/core assets only, successful/basic
  responses only, bounded runtime entries, `/api` excluded.
- **Sources:** full audit finding AX-007; performance audit P0.
- **Product DNA gap:** user promise follows update/data safety; exact cache
  policy is engineering-owned.
- **Dedupe key:** `offline/service-worker-cache-boundary`.

### Release/version truth is manually duplicated

- **Category / area / observed status:** Bug; Release; Open at audit baseline.
- **Sourced severity/board:** MEDIUM; before public Alpha.
- **Evidence and impact:** brand, public version file, service worker, API
  health, and native metadata can disagree, causing stale cache/update claims.
- **Acceptance/success evidence:** one generated release source and a
  verification gate.
- **Sources:** historical audit §10 item 1; full audit finding AX-009.
- **Dedupe key:** `release/single-version-source`.

### IndexedDB fallback may duplicate the full workspace in localStorage

- **Category / area / observed status:** Bug; Storage; Open at audit baseline.
- **Sourced severity/board:** LOW; P1.
- **Evidence and impact:** IDB failure can mirror one large workspace under two
  compatibility keys, doubling quota pressure.
- **Acceptance/success evidence:** one canonical fallback, surfaced quota
  failure, large-payload coverage.
- **Sources:** full audit finding AX-013; storage map.
- **Dedupe key:** `storage/duplicate-localstorage-fallback`.

### App shell lacks a universal main landmark and route-level H1 contract

- **Category / area / observed status:** Bug; Accessibility; supported by
  automated live-site evidence and current read-only source search.
- **Sourced severity/board:** site audit classified missing `main` MEDIUM and
  visible `h1` LOW.
- **Evidence and impact:** 11 audited onboarding/dashboard/settings states
  reported no main landmark/H1; current source search finds H1 on only a small
  subset of routes and no production App shell `<main>`.
- **Acceptance/success evidence:** one main landmark and semantic, visible route
  heading without duplicate landmark noise in overlays.
- **Sources:** `artifacts/site-audit-v2/report.md` lines 19–46; read-only `rg`
  evidence recorded during this mining pass.
- **Conflict/unknown:** full audit accessibility report did not carry this as a
  named violation. Reproduce against the current built commit before calling
  it Verified fixed or current.
- **Dedupe key:** `accessibility/main-landmark-route-h1`.

### Legacy hosted URLs and repository identity remain user-visible

- **Category / area / observed status:** Product Debt; Identity/Release; Open.
- **Sourced severity/board:** MEDIUM in full audit; before public Alpha.
- **Product evidence:** visible product is AXOM; legacy strings are allowed only
  for compatibility/history.
- **Acceptance/success evidence:** reviewed repository rename/redirect, one
  hosted URL source, verified help/about/download links, preserved data-key
  compatibility.
- **Sources:** full audit finding AX-008 and §§16, 29; `docs/FIELD-NOTES.md`;
  git remote history.
- **Conflict/unknown:** repository rename and redirect strategy is **Owner
  Decision Required**.
- **Dedupe key:** `product-debt/legacy-noctyrium-public-identity`.

### WIP modules occupy navigable product space before capability is complete

- **Category / area / observed status:** Product Debt; Navigation/Release;
  open policy decision.
- **Sourced severity/board:** LOW; before friend Alpha.
- **Evidence and impact:** Doctordle, Leaderboards, Application Checker, Anki
  Lab, Habits, Integrations, and broad prep parents are visible but incomplete.
- **Acceptance/success evidence:** honest badge/landing copy and exclusion from
  release claims; default-nav visibility explicitly chosen.
- **Sources:** full audit finding AX-012 and feature matrix.
- **Conflict/unknown:** owner historically preferred visible construction
  labels, while audit suggests optionally hiding default navigation. **Owner
  Decision Required**.
- **Dedupe key:** `product-debt/wip-navigation-policy`.

### Curated Resource Hub must reconcile convenience with public privacy

- **Category / area / observed status:** Product Debt; Resources; partially
  implemented, public-content policy unresolved.
- **Product evidence:** Resource Hub should be curated, searchable, removable,
  and useful—not a graveyard of links. SGU resources should be contextual to
  subscribed users.
- **Acceptance/success evidence:** normalized URLs, category/source/audience
  metadata, user-added removal, no broken/empty cards, no private default in a
  public build.
- **Sources:** owner alpha corpus Resource Hub requirements; direct feedback
  attachment `e099bf42…` first paragraph; owner blueprint corpus message 1;
  full audit finding AX-002.
- **Conflict/unknown:** permanent personal-drive request conflicts with privacy
  containment. Owner must approve the public catalog.
- **Dedupe key:** `product-debt/resource-hub-curation-privacy`.

### Settings and backup language must be understandable to nontechnical users

- **Category / area / observed status:** Product Debt; Settings/Data Safety;
  substantially improved, periodic revalidation needed.
- **Product evidence:** users should understand export, import, recovery, and
  current workspace safety without needing to understand JSON.
- **Acceptance/success evidence:** primary export/restore controls are real,
  replace/merge consequences explicit, recovery and last-backup status visible.
- **Sources:** owner alpha corpus message 17; Wave 4 acceptance; full audit
  §§16, 18–19.
- **Conflict/unknown:** destructive browser journeys were not repeated in the
  full audit, so rendered verification remains partial.
- **Dedupe key:** `product-debt/settings-backup-comprehension`.

### Blueprint content must be actionable, specific, and source-governed

- **Category / area / observed status:** Product Debt; Blueprint/Boards;
  partially implemented.
- **Product evidence:** every terminal node should name real content the learner
  can act on immediately; broad ambiguous folders do not constitute a study
  system.
- **Acceptance/success evidence:** exam-specific hierarchy and completion
  convention, cited source/version, meaningful node action, no duplicate
  installation, progress based on real subitems.
- **Sources:** owner blueprint corpus messages 1, 3, 4, 7, 9–12; owner explicitly
  said full 347-page God-file extraction was not exhausted.
- **Conflict/unknown:** current catalog depth was not re-audited in the July 16
  full sweep. Keep Partial; do not mark Verified.
- **Dedupe key:** `product-debt/blueprint-actionable-content-depth`.

### Direct AnkiConnect path remains unverified and visually overexplained

- **Category / area / observed status:** Product Debt; Anki/Integrations; open.
- **Product evidence:** a tired learner should see a truthful status and a
  workable fallback, not a wall of buttons for a bridge that still fails.
- **Acceptance/success evidence:** owner-machine confirmation is required;
  concise setup; local-network failure explained; CSV/TSV fallback prominent.
- **Sources:** owner blueprint corpus messages 4–10; historical audit §§6, 9.
- **Conflict/unknown:** repository diagnostics may pass while hosted browser
  access fails. Owner definition is explicit: “verified means I confirmed it
  works.”
- **Dedupe key:** `product-debt/ankiconnect-owner-verification`.

### Route-family eager loading inflates the initial shell

- **Category / area / observed status:** Technical Debt; Performance; Open.
- **Sourced severity/board:** MEDIUM; P1 after personal Alpha.
- **Evidence and impact:** most routes enter an approximately 819 KB App chunk;
  PDF/XLSX adapters add further cost.
- **Acceptance/success evidence:** coarse lazy boundaries for genuinely heavy
  route families and on-demand document adapters, measured on a mid-range
  device.
- **Sources:** full audit finding AX-005; performance audit.
- **Dedupe key:** `tech-debt/route-family-lazy-loading`.

### Core state and page modules mix exceptional numbers of responsibilities

- **Category / area / observed status:** Technical Debt; Architecture; Open.
- **Sourced severity/board:** MEDIUM; Wave 6 consolidation.
- **Evidence and impact:** store, Dashboard, Course Tracker, parser, and global
  CSS modules are very large, increasing blast radius.
- **Acceptance/success evidence:** extract coherent domain boundaries while
  preserving action/storage contracts; do not micro-split for aesthetics.
- **Sources:** full audit finding AX-006 and performance audit.
- **Product DNA gap:** exact refactor sequence is engineering authority.
- **Dedupe key:** `tech-debt/oversized-mixed-responsibility-modules`.

### Automated WCAG coverage is absent

- **Category / area / observed status:** Technical Debt; Accessibility/Testing;
  Open.
- **Sourced severity/board:** MEDIUM/high-confidence gap; before closed Alpha.
- **Evidence and impact:** focus semantics have targeted tests, but no
  systematic serious/critical ruleset or contrast coverage.
- **Acceptance/success evidence:** representative populated dark/light states
  scanned, critical flows manually keyboard/screen-reader tested.
- **Sources:** full audit finding AX-010; accessibility audit.
- **Dedupe key:** `tech-debt/automated-wcag-scans`.

### Critical accessibility journeys lack complete keyboard, zoom, and touch proof

- **Category / area / observed status:** Technical Debt; Accessibility/QA;
  Open.
- **Evidence and impact:** 390 px screenshots are not true 200%/400% reflow;
  secondary routes lack exhaustive keyboard sequences; touch inventory is
  narrow.
- **Acceptance/success evidence:** populated import/player, restore, journal,
  and settings paths at keyboard-only, real zoom/reflow, and mobile target
  sizes; live-region policy consistent.
- **Sources:** accessibility audit findings table.
- **Dedupe key:** `tech-debt/a11y-critical-journey-coverage`.

### Populated two-version update and rollback rehearsal is missing

- **Category / area / observed status:** Technical Debt; Update/QA; Open.
- **Sourced board:** before public Alpha.
- **Evidence and impact:** same-origin primitives are sound, but large schema-32
  workspace upgrade, quota pressure, service-worker replacement, and rollback
  are not field-proven.
- **Acceptance/success evidence:** automated/timed rehearsal across two built
  versions, failed migration recovery, preserved data, clear user action.
- **Sources:** full audit §§19, 25; storage map Safety verdict; release checklist.
- **Dedupe key:** `tech-debt/two-version-upgrade-rehearsal`.

### Backup/restore destructive UI permutations need independent browser proof

- **Category / area / observed status:** Technical Debt; Backup/QA; Open.
- **Sourced board:** before trusted-friend/closed Alpha.
- **Evidence and impact:** unit round-trips exist, but replace, merge, corrupt,
  unknown-field, and older-schema UI journeys were not all rerun independently.
- **Acceptance/success evidence:** disposable-context browser proof with no
  silent loss, deterministic merge, understandable corruption warning.
- **Sources:** full audit §18; release checklist.
- **Dedupe key:** `tech-debt/backup-restore-browser-rehearsal`.

### Large-workspace quota and persistence health are not field-tested

- **Category / area / observed status:** Technical Debt; Storage/Performance;
  Open.
- **Evidence and impact:** question documents, PDFs, journal images, and blobs
  can grow; global payload and runtime cache bounds are incomplete.
- **Acceptance/success evidence:** quota messaging, persistence request/status,
  large import/attachment measurements, recoverable failure.
- **Sources:** storage map Safety verdict; performance audit P0.
- **Dedupe key:** `tech-debt/large-workspace-quota-field-test`.

### Legacy Swift/native/assets/PDFs/RTF obscure repository boundaries

- **Category / area / observed status:** Technical Debt; Repository; Open
  cleanup decision.
- **Sourced severity/board:** LOW.
- **Evidence and impact:** historical prototype, native branding, scripts,
  source RTF, and large blueprint PDFs increase size/provenance burden.
- **Acceptance/success evidence:** retain only intentional, licensed,
  provenance-documented assets or archive them with history intact.
- **Sources:** full audit finding AX-011 and §§4, 29.
- **Conflict/unknown:** raw quote RTF was explicitly required to remain
  untracked in the Wave 5.5C handoff but is currently tracked. Blueprint PDFs
  are useful source material. **Owner Decision Required** item by item.
- **Dedupe key:** `tech-debt/legacy-repository-assets`.

### Test runtime should use supported Node LTS without storage-warning noise

- **Category / area / observed status:** Technical Debt; CI; Open at audit
  baseline.
- **Sourced severity/board:** LOW; CI hygiene.
- **Evidence and impact:** Node 26 experimental localStorage warnings obscure
  test signal but are not a product regression.
- **Acceptance/success evidence:** supported pinned LTS and explicit test
  environment/fakes; zero environmental warning misclassification.
- **Sources:** full audit finding AX-014.
- **Dedupe key:** `tech-debt/node-lts-test-noise`.

### Historical parser source specification is absent

- **Category / area / observed status:** Technical Debt; Documentation
  Provenance; Open decision.
- **Sourced severity/board:** INFO; Wave 6A decision.
- **Evidence and impact:** original wording/checksum cannot be reconciled;
  current parser remains valid through independent corpus gates.
- **Acceptance/success evidence:** archive the source specification or record a
  formal owner waiver without invalidating shipped behavior.
- **Sources:** full audit finding AX-015 and §§8, 27.
- **Conflict/unknown:** **Owner Decision Required**: provide or waive.
- **Dedupe key:** `tech-debt/parser-original-spec-provenance`.

### Dark-theme gold and decorative density require restraint

- **Category / area / observed status:** Product Polish; Visual System;
  substantially implemented, ongoing standard.
- **Product evidence:** most surfaces are graphite/smoke/bone; gold marks
  selection, core identity, or earned moments rather than every card.
- **Acceptance/success evidence:** no adjacent gold outlines, ordinary metadata
  gold, casino glow, or decoration that harms scan speed.
- **Sources:** Wave 5.5A lines 83–128; commits `1b66a39`, `0b7f7e0`; historical
  audit §4 caution.
- **Dedupe key:** `polish/restrained-gold-decorative-density`.

### Daily quote belongs below the working dashboard hierarchy

- **Category / area / observed status:** Product Polish; Dashboard; Verified.
- **Product evidence:** inspiration remains available without competing with
  today's actionable brief.
- **Acceptance/success evidence:** quote controls/attribution remain intact in a
  quiet footer; Command Brief is the one identity surface.
- **Sources:** commit `0b7f7e0` and its independent rendered acceptance.
- **Dedupe key:** `polish/dashboard-quote-quiet-footer`.

### Settings hierarchy should remain compact and progressively disclosed

- **Category / area / observed status:** Product Polish; Settings; partially
  verified.
- **Product evidence:** configuration remains capable without becoming a
  “settings laboratory.”
- **Acceptance/success evidence:** compact profile header, coherent groups,
  reduced repeated uppercase labels and oversized pills, critical save state
  always visible, 390 px usable.
- **Sources:** Wave 5.5A lines 522–544; Wave 4 accepted five-section
  architecture.
- **Conflict/unknown:** current rendered state needs revalidation before moving
  from Implemented to Verified.
- **Dedupe key:** `polish/settings-compact-progressive-hierarchy`.

### Course Tracker help and import guidance must be conspicuous

- **Category / area / observed status:** Product Polish; Course Tracker;
  implemented in core comprehension checkpoint.
- **Product evidence:** a learner should not have to discover the help button
  accidentally; lecture/PQ formatting and destination behavior need concise
  guidance.
- **Acceptance/success evidence:** visible help entry, copyable examples,
  one-time guidance/module tour, no provider dependency.
- **Sources:** direct feedback attachment `e099bf42…` first paragraph; owner
  alpha corpus; commit `5c35e77`.
- **Conflict/unknown:** browser verification of every import format remains
  separate.
- **Dedupe key:** `polish/course-tracker-help-import-guidance`.

### Productivity and dashboard calendar visual language should remain coherent

- **Category / area / observed status:** Product Polish; Productivity/Dashboard;
  historical owner request, current completion uncertain.
- **Product evidence:** the same day should communicate the same activity truth
  across dashboard, Productivity, and Reports.
- **Acceptance/success evidence:** consistent day status, correct local date,
  accessible details, no contradictory heat-map semantics.
- **Sources:** direct feedback attachment `e099bf42…` first paragraph; owner
  alpha corpus messages 4 and 6.
- **Conflict/unknown:** no current independent comparison was found. Product
  DNA is evidenced; status remains Partial/Owner QA required.
- **Dedupe key:** `polish/cross-surface-activity-calendar-consistency`.

### Universal source-document intelligence

- **Category / area / observed status:** Research; Question Import; Deferred.
- **Product evidence:** retain grounded source evidence and reduce manual
  reconstruction across PDFs, slides, images, tables, and OCR.
- **Acceptance/success evidence:** page/span provenance, bounded binary
  lifecycle, review before trust, no source mutation or silent invented answer.
- **Sources:** full audit deferred ledger “Source binary retention/OCR/slides…”
  and documentation truth table.
- **Conflict/unknown:** not an Alpha capability; no implementation authority in
  this record.
- **Dedupe key:** `research/universal-source-document-intelligence`.

### Structured explanations and disclosed generated distractor rationales

- **Category / area / observed status:** Research; Question Explanations;
  Partial/Deferred.
- **Product evidence:** correct and selected-wrong rationale should lead;
  generated material, if any, must be visibly distinguished from source truth.
- **Acceptance/success evidence:** source/generated provenance, no invented
  rationale silently trusted, no empty block.
- **Sources:** full audit deferred ledger; Q2a commit rationale ordering.
- **Conflict/unknown:** generation provider/phase requires owner approval.
- **Dedupe key:** `research/structured-explanations-generated-disclosure`.

### Tutor Mode and exam-software simulation

- **Category / area / observed status:** Research; Quiz Modes; Deferred.
- **Product evidence:** support deliberate learning and eventual realistic exam
  practice without destabilizing trusted quiz fundamentals.
- **Acceptance/success evidence:** mode parity, timer recovery, keyboard,
  preferences, clear simulation disclosure, persisted session state.
- **Sources:** full audit deferred ledger; experience refinement references.
- **Conflict/unknown:** “Tutor Mode” naming overlaps the existing tutor block;
  owner must define whether this is richer tutoring, UI polish, or a distinct
  mode before a canonical feature record.
- **Dedupe key:** `research/tutor-and-exam-simulation`.

### Course Central schedule/module document import

- **Category / area / observed status:** Research; Course Central; Deferred.
- **Product evidence:** reduce repeated transcription of institutional
  schedules while keeping learner review and ownership.
- **Acceptance/success evidence:** normalized events, duplicate safety,
  timezone explicit, review before save, learner corrections survive reimport.
- **Sources:** full audit deferred ledger; full audit §9.
- **Dedupe key:** `research/course-central-schedule-import`.

### Institution templates, cohorts, and curriculum graph

- **Category / area / observed status:** Research; Course Central; Deferred.
- **Product evidence:** reusable institutional knowledge should not overwrite
  the learner overlay.
- **Acceptance/success evidence:** versioned SGU/school templates, explicit
  cohort overlay, curriculum graph provenance, update reconciliation.
- **Sources:** full audit deferred ledger and §9.
- **Conflict/unknown:** community contribution/moderation and exact school
  scope require Product Owner decisions.
- **Dedupe key:** `research/course-central-institution-model`.

### LMS and institution connectors

- **Category / area / observed status:** Research; Integrations; Beta/Later.
- **Product evidence:** Sakai/Canvas/Elentra/announcements may reduce duplicate
  entry only when permissions and provenance are trustworthy.
- **Acceptance/success evidence:** least privilege, revocation, institution
  approval, normalized records, moderation where shared.
- **Sources:** full audit deferred ledger.
- **Dedupe key:** `research/lms-institution-connectors`.

### Secure optional accounts, recovery, and local-first sync

- **Category / area / observed status:** Research; Accounts/Sync; Beta/Later;
  current legacy cloud unsafe.
- **Product evidence:** eventual cross-device continuity must not make cloud a
  prerequisite or let a short PIN masquerade as security.
- **Acceptance/success evidence:** unique account identity, verified ownership,
  OAuth/passkey or equivalent option, recovery, encryption policy, conflict
  resolution, anonymous-workspace migration, deletion/export.
- **Sources:** Pre-Beta lines 894–995; owner alpha backend prompt; full audit
  §§20, 30 and deferred ledger.
- **Conflict/unknown:** June owner requested username/PIN/cloud work; July audit
  says public use is RED and asks whether cloud stays disabled through Alpha.
  **Owner Decision Required** before this can become planned scope.
- **Dedupe key:** `research/secure-accounts-local-first-sync`.

### Multiple notebooks, search, bookmarks, and monthly reflection

- **Category / area / observed status:** Research; Journal; Deferred.
- **Product evidence:** the learner should return months later and recover
  meaning, not only raw entries.
- **Acceptance/success evidence:** autosave-safe indexing, accessible themes and
  contrast, backup/merge semantics, notebook ownership.
- **Sources:** full audit deferred ledger; Pre-Beta lines 1035–1116; Wave 5.5D
  lines 732–835.
- **Dedupe key:** `research/journal-multiple-notebooks-search-reflection`.

### Journal Cinematic and advanced notebook physics

- **Category / area / observed status:** Research; Journal Experience; Version
  2.
- **Product evidence:** optional tactile delight should reinforce writing, not
  risk text loss or exclude reduced-motion users.
- **Acceptance/success evidence:** optional desk/pickup/page physics,
  sound/haptics opt-in, instant reduced-motion path, semantic editor unaffected.
- **Sources:** full audit deferred ledger.
- **Dedupe key:** `research/journal-cinematic`.

### Hour-by-hour Day Plan with calendar overlay

- **Category / area / observed status:** Research; Calendar/Productivity;
  Deferred.
- **Product evidence:** AXOM adds study/energy/course context instead of trying
  to replace Google Calendar.
- **Acceptance/success evidence:** planned vs actual, daily/weekly review,
  read-only standard-calendar path first, write-back only with explicit consent.
- **Sources:** Pre-Beta lines 1250–1305; owner blueprint corpus message 1.
- **Dedupe key:** `research/day-plan-calendar-overlay`.

### Exam-date planning, reminders, and post-exam reflection

- **Category / area / observed status:** Research; Boards/Planning; Deferred.
- **Product evidence:** preparation and learning continue across the exam
  boundary, including comparison of expectation and result.
- **Acceptance/success evidence:** user-entered dates/phase, configurable
  reminders, no hard-coded result timing, post-exam and result-day prompts,
  journal/report linkage.
- **Sources:** Pre-Beta lines 1175–1248.
- **Dedupe key:** `research/exam-date-reminder-reflection`.

### Adaptive daily practice-question goals

- **Category / area / observed status:** Research; Question Bank/Planning;
  Deferred.
- **Product evidence:** targets adapt to exam, preparation phase, burden, and
  user-selected intensity rather than forcing high counts.
- **Acceptance/success evidence:** configurable tier, review burden,
  timed/untimed/source/weak-topic context, non-punitive streak, report/Blueprint
  linkage.
- **Sources:** Pre-Beta lines 1118–1173.
- **Dedupe key:** `research/adaptive-question-goals`.

### Local recurring-task template suggestions

- **Category / area / observed status:** Research; Tasks; Deferred.
- **Product evidence:** reduce repeated entry without silently creating work.
- **Acceptance/success evidence:** local phrase detection, confirm after
  repetition, disable/never-suggest control, link only with explicit user
  choice.
- **Sources:** Pre-Beta lines 997–1033.
- **Dedupe key:** `research/local-recurring-task-templates`.

### Mature Application Checker and evidence pathway

- **Category / area / observed status:** Research; Pre-Med/Application;
  Under Construction.
- **Product evidence:** connect experiences, hours, evidence, reflections, and
  milestones without pretending readiness is already calculated.
- **Acceptance/success evidence:** clear evidence provenance, application
  stages, deadlines, letters, school list, CV/personal statement, honest status.
- **Sources:** Pre-Beta lines 694–747; historical audit §§5, 9; full audit
  feature matrix.
- **Conflict/unknown:** Product Owner has not prioritized its release.
- **Dedupe key:** `research/application-checker-evidence-pathway`.

### Deep Anki/Noji adapter ecosystem

- **Category / area / observed status:** Research; Anki/Integrations; Deferred.
- **Product evidence:** preserve reliable export even if any one bridge fails.
- **Acceptance/success evidence:** capability/status per adapter, dry-run,
  mapping report, no required direct bridge.
- **Sources:** Pre-Beta lines 800–827; full audit deferred context.
- **Dedupe key:** `research/anki-noji-adapters`.

### Future optional email signup concept

- **Category / area / observed status:** Research; Communication; Design-only.
- **Product evidence:** an optional future communication channel was requested,
  but production must not collect an address or imply consent before provider,
  privacy, and lifecycle are decided.
- **Acceptance/success evidence:** no production input/network/provider/hidden
  consent until an approved record defines them.
- **Sources:** Wave 5.5A lines 797–817.
- **Conflict/unknown:** external-product email-list ideas also exist in
  unrelated personal-site conversations and were excluded. AXOM-specific owner
  need and phase require confirmation.
- **Dedupe key:** `research/optional-product-email-signup`.

### Native Tauri distribution and update parity

- **Category / area / observed status:** Research; Distribution/Native;
  Experimental.
- **Product evidence:** PWA/web ships first; native wrapper may reuse the
  frontend later without coupling app files to user data.
- **Acceptance/success evidence:** signed updater, persistent app-data
  location, migration/backup parity, truthful manual-update copy until ready.
- **Sources:** owner alpha corpus large release directive; direct feedback
  attachment `e099bf42…`; historical/full audits.
- **Conflict/unknown:** current Tauri scaffold is not Alpha authority.
- **Dedupe key:** `research/tauri-native-update-parity`.

### Automatic recovery snapshots and backup reminders

- **Category / area / observed status:** Research; Data Safety; partially
  implemented.
- **Product evidence:** JSON expertise must not be the only disaster plan.
- **Acceptance/success evidence:** bounded automatic snapshots, visible backup
  age, reminder after meaningful growth/risky operation, one-click recovery,
  plaintext warning.
- **Sources:** Question Bank/UI directive lines 530–554; full audit §§18–19;
  storage map.
- **Dedupe key:** `research/automatic-recovery-backup-reminders`.

### Privacy, deletion, recovery, and incident policy for external Alpha

- **Category / area / observed status:** Research; Release/Security; required
  before public Alpha.
- **Product evidence:** users must know what is local/cloud, how to export or
  delete it, and what support can and cannot do.
- **Acceptance/success evidence:** threat model, privacy statement, data
  deletion/export/recovery, incident contact, no emergency-service implication.
- **Sources:** full audit release checklist and §§20, 30.
- **Conflict/unknown:** policy ownership and public cohort are **Owner Decision
  Required**.
- **Dedupe key:** `research/public-alpha-privacy-recovery-policy`.

## Reconstruction notes — do not create canonical records yet

### Beta audit v3 failures are environment evidence, not ten product regressions

The scenario audit passed onboarding, then WebDriver BiDi navigation/script
calls timed out. Its runtime summary recorded zero console errors, zero runtime
errors, and zero unhandled rejections. The ten generated HIGH findings share
the same harness failure mode and cannot be promoted into product bugs without
reproduction. Sources: `artifacts/beta-audit-v3/report.md` §§Scenario Results,
Detailed Scenarios, Runtime Summary.

### Live-site landmark results require current-build reproduction

The site-audit v2 report repeatedly found no main landmark/H1. Current source
search supports a structural concern, but the later full audit did not list it
as a route-specific violation. A candidate is retained above with a
reproduction gate; no claim of current resolution is justified.

### June cloud-account direction conflicts with July security evidence

June owner directives requested name/PIN accounts and cloud save/load. July
audit proved that legacy snapshots did not universally attach authenticated
ownership and explicitly rated public cloud use RED. Preserve both. Only the
owner can choose “disabled through Alpha” or authorize secure account work.

### Permanent SGU/personal resource defaults conflict with privacy containment

Older owner messages requested permanent personal/SGU resources visible by
profile. The July audit found identity-specific URLs compiled into public code.
Do not silently delete the historical intent or silently ship the links. The
public catalog requires item-level owner decisions.

### Board-navigation history contains an explicit supersession

An early owner message asked for separate exam/sidebar surfaces. On 2026-06-20
the owner explicitly rejected the newly expanded per-exam sidebar and preferred
the consolidated USMLE and Pre-Med/DAT/MCAT grouping. Treat the later correction
as the current historical decision; do not reconstruct both as simultaneous
requirements.

### Readiness inference was deliberately narrowed

Early messages proposed mining journal words and personal roadblocks broadly.
Later accepted directives require transparent, non-diagnostic, confirmable
signals and no hidden AI. The broad inference concept is not canonical without
fresh owner approval.

### “Verified” has an owner-defined threshold

The owner explicitly stated on 2026-06-20: “verified means i confirmed it
works.” Engineering gates can establish implementation evidence; they cannot
silently substitute for owner acceptance where the product record requires
Verified status.

### Raw quote source tracking changed contrary to an earlier handoff

The Wave 5.5C handoff required the source RTF to remain untracked; it is tracked
at current HEAD. The full audit classified it as an intentional/historical
source with an owner cleanup decision. Do not infer whether it should be
removed, archived, or retained.

### About-page external iframe is not a confirmed current bug

The historical audit observed one aborted request while navigating away from
the external preview iframe and suggested deciding whether it belongs in the
app. This is not sufficient evidence of a user-facing regression. The owner
historically requested the preview; current privacy/performance intent is
unresolved.

### Hook warnings and early schema drift are stale until reverified

The 2026-07-08 historical audit reported React hook warnings and extensive
version/schema drift. The 2026-07-16 full gate passed lint and reported a
narrower release-metadata duplication finding. Preserve the history, but create
only the supported current release-truth record above.

### Competitor research was a reviewer recommendation, not an owner commitment

`ASK_DETAILED_REPORT.md` suggested researching Anki, UWorld, Amboss, Notion,
Motion, and others. No owner acceptance was found in the authorized corpus.
Do not create a Research backlog record from that suggestion alone.

## Counts and coverage

Canonical candidates in this catalogue:

- Product Decision: 21
- Feature: 14
- Bug: 8
- Product Debt: 6
- Technical Debt: 10
- Product Polish: 5
- Research: 19
- Total: 83

Reconstruction-only conflict/insufficiency notes: 11.

Source coverage:

- 87 raw matching JSONL files inventoried.
- Nine substantive owner chronologies / 48 unique owner-role messages included
  after generated-message and fork deduplication.
- Requested attachments relevant to AXOM/Noctyrium were read; obvious personal
  website/Garden/Sanctum/essay material was excluded.
- All requested full-audit Markdown/CSV sources, three tracked audit reports,
  `docs/FIELD-NOTES.md`, `ASK_DETAILED_REPORT.md`, and relevant git chronology
  were mined.
- Exact unprocessed authorized source files: 0.
- The corpus is nevertheless not the claimed 50+ conversation universe. Only
  locally available sessions/attachments were discoverable. Older or external
  conversations absent from this filesystem remain a Phase B coverage gap and
  must not be represented as reconstructed.

## Integrity observations for the parent reconstruction

- Do not allocate IDs from this file directly; dedupe keys are provisional
  merge handles only.
- Do not mark generic-commit items Verified without explicit review/acceptance
  evidence. `dea9840`, `2f4f290`, and `8439f97` need the associated test/review
  artifacts checked before promotion.
- Audit-created security/technical findings often lack owner-authored User
  Feeling or Core Promise. Their harm is supported, but fields must come from
  ratified governance or an owner decision—not invented prose.
- Records marked **Owner Decision Required** cannot be canonical Product Truth
  until the Product Owner resolves the stated conflict.

---

## AXOM-0002b.1 addendum (appended; all line numbers above are unchanged)

Evidence durability update recorded by AXOM-0002b.1 (AXOM-0002b finding A2).
The source-key citations above are preserved verbatim; their durable
counterparts are:

- The six `/tmp/axom-sol-full-audit/` documents cited in **Full audit**, plus
  the package's release checklist, quality gates, feature matrix, route/test
  matrix, and manifest, are vendored at
  `docs/product-memory/AXOM-0002A/evidence/full-audit/`. The package's
  `screenshots/` and `logs/` directories (~60 MB) were not vendored and remain
  only at the original temporary location while it survives.
- The owner conversation corpora remain external at the
  `/Users/jd/.codex/sessions/…` paths cited above, and owner attachments at
  `/Users/jd/.codex/attachments/<attachment-id>/`. They are machine-local and
  are not part of this repository. `EVIDENCE-DEPENDENCIES.md` records their
  sizes, retrieval locations, and loss impact.

See `docs/product-memory/AXOM-0002A/EVIDENCE-DEPENDENCIES.md` for the complete
dependency register.

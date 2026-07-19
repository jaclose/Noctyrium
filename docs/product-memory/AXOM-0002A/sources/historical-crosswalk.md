# Historical evidence crosswalk

## Scope and authority boundary

This is a read-only deduplication crosswalk for AXOM-0002a. It compares every
one of the 83 candidate records in `historical-review.md` with the 100
catalogue-local records in `core-systems.md` and the 67 candidate records in
`question-system.md`.

It does not create a canonical record, allocate an AX ID, select a category,
resolve a conflict, or assign any Product Owner-controlled value. The `HR-##`
labels below are disposable row locators local to this crosswalk; they are not
Candidate IDs and must not be promoted into governance.

Every historical source citation, acceptance observation, conflict statement,
and evidence-quality warning is preserved by incorporation from the exact
historical section and provisional dedupe key named in each row. A `MERGE`
means “attach all of that evidence to this existing evidence concept”; it does
not mean that the historical interpretation is accepted. A `SPLIT` means the
historical heading bundled genuinely independent concepts. A `NEW` means no
semantically equivalent candidate exists in the other two catalogues. A
`CONFLICT` means the two catalogues contain incompatible historical direction
that only the Product Owner may resolve.

## Totals

| Disposition | Historical candidates | Meaning |
| --- | ---: | --- |
| MERGE | 44 | One existing core or Question candidate is the same normalized concept. |
| NEW | 20 | No equivalent candidate exists in the other catalogues. |
| SPLIT | 18 | The historical record combines two or more independently observable concepts. |
| CONFLICT | 1 | Evidence conflicts with an existing candidate and must remain unresolved. |
| **Total** | **83** | Every candidate in `historical-review.md` is accounted for exactly once. |

## Candidate-by-candidate crosswalk

### Core product decisions and product boundaries

| Locator | Historical candidate and retained evidence locator | Disposition | Exact target or observed split | Provenance/conflict handling |
| --- | --- | --- | --- | --- |
| HR-01 | **AXOM is a local-first academic operating partner** — `core/local-first-operating-partner`; `historical-review.md:55` | MERGE | Core **C-01 — Local-first academic operating system** (`core/local-first-academic-operating-system`) | Attach the Pre-Beta, Wave 5.5D, and full-audit citations. “Operating partner” remains historical terminology; no canonical wording is selected here. |
| HR-02 | **Application updates replace code, never user progress** — `data/update-preserves-user-work`; `historical-review.md:73` | MERGE | Core **C-100 — Release persistence QA contract** (`release/persistence-qa`) | Attach the direct owner update-safety model and full-audit/storage evidence. C-60 through C-64 remain observed implementation relationships, not additional copies of the same promise. The two-build and origin-change gaps remain open. |
| HR-03 | **Ease, convenience, and one clear action govern visible surfaces** — `ux/ease-convenience-primary-action`; `historical-review.md:91` | NEW | No cross-product evidence candidate expresses this exact general interaction rule. Core C-08, C-25, C-38, and C-91 are system-specific relationships only. | Retain Wave 5.5A, Wave 5.5D, and Question Bank/UI evidence. The historical “10–20%” statement remains a heuristic, not an accepted quota. |
| HR-04 | **AXOM must never pretend to be intelligent** — `ai/truthful-optional-evidence-backed`; `historical-review.md:107` | MERGE | Core **C-04 — Explainable, evidence-identical recommendations** (`core/explainable-evidence-identical-decisions`) | Attach the Wave 5.5D, Question Bank/UI, and audit evidence. Core C-06 and C-74 through C-76 are related boundaries/provider concepts; future AI scope remains unresolved. |
| HR-05 | **Question Bank flagship loop is Import → Review → Practice → Understand** — `question-bank/import-review-practice-understand`; `historical-review.md:125` | MERGE | Question **Question Bank as AXOM's flagship practice loop** (`question-bank.flagship-import-review-practice-repair-loop`) | Preserve the Wave 3, Question Bank/UI, and `c1328f3` provenance, including the historical “Understand” wording and the newer explicit repair loop. |
| HR-06 | **Uncertainty is safer than a false-ready question** — `question-bank/false-ready-zero`; `historical-review.md:140` | SPLIT | Question **Mapping Readiness is the runnable truth boundary** (`question-mapping.readiness-runnable-boundary`); **Unknown answers never default to A** (`question-answer.unknown-never-default-a`); **User-confirmed answer mappings outrank parser output** (`question-answer.user-confirmed-precedence`); **Structured answer evidence preserves harmless drift** (`bug.answer-explicit-letter-drift-discarded`) | The historical heading is one trust philosophy, but its acceptance evidence describes four independently testable concepts. Preserve Wave 5.5D, structured-trust, `b94e6f1`, and `cdfff38` on the applicable targets; do not collapse candidate, contradiction, user precedence, and runnable state. |
| HR-07 | **Current mastery and historical attempt accuracy are distinct truths** — `question-bank/mastery-vs-historical-accuracy`; `historical-review.md:155` | MERGE | Question **Question performance and error-pattern insights** (`question-analytics.performance-error-pattern-insights`) | Attach the 2026-07-10 owner decision, Wave 3, and `c1328f3`. This adds exact metric-semantics provenance without accepting any broader future analytics scope. |
| HR-08 | **Daily success is user-selected and never Anki-mandatory** — `daily-loop/configurable-success-no-mandatory-anki`; `historical-review.md:172` | MERGE | Core **C-16 — Configurable, neutral daily success** (`daily-progress/configurable-neutral-success`) | Attach Wave 5.5A and `1b66a39`; preserve the explicit “no mandatory Anki/cards” historical acceptance evidence. |
| HR-09 | **Reports must explain denominators, provenance, and next meaning** — `reports/explainable-traceable-metrics`; `historical-review.md:186` | MERGE | Core **C-23 — Honest progressive Reports** (`reports/honest-progressive-analytics`) | Attach Wave 5.5A, `1b66a39`, and full-audit §13. Reports 2.0 remains separately deferred and undefined. |
| HR-10 | **Readiness and energy are optional, explainable, and non-diagnostic** — `wellbeing/readiness-nondiagnostic-explainable`; `historical-review.md:198` | MERGE | Core **C-22 — Grounded learner readiness** (`readiness/grounded-user-controlled-capacity`) | Preserve both the early broad-inference evidence and the later non-diagnostic boundary. This is conflict-bearing provenance; no claim is made that one source canonically supersedes the other. |
| HR-11 | **Habit recovery language is non-punitive** — `habits/nonpunitive-recovery`; `historical-review.md:215` | MERGE | Core **C-05 — Calm recovery without shame or attention competition** (`core/calm-non-shaming-experience`) | Attach the Pre-Beta and route-audit evidence. Core C-21 is a related habit-date/fairness behavior, not a duplicate of the language principle. |
| HR-12 | **Safe soft limits remain overrideable** — `ux/soft-limit-with-override`; `historical-review.md:228` | NEW | No equivalent cross-product candidate. Core C-20 and C-26 are observed applications in Pomodoro and Dashboard widgets. | Retain Wave 5.5A, Wave 5.5D, `1b66a39`, and `dea9840`; do not infer that the policy applies to unmentioned safety, storage, or correctness limits. |
| HR-13 | **AXOM Daily Word is original, deterministic, local, and offline-safe** — `daily-games/daily-word-local-original`; `historical-review.md:241` | SPLIT | Core **C-54 — AXOM Daily Word** (`daily-games/daily-word`); **C-55 — Deterministic Daily Word history and continuity** (`daily-word/deterministic-history-continuity`); **C-59 — Daily Games lazy and offline-aware delivery** (`daily-games/lazy-offline-delivery`) | The historical record combines game identity, saved deterministic continuity, and delivery/offline boundaries. Attach Wave 5, `ba9c4a8`, and full-audit evidence without merging those separate concerns. |
| HR-14 | **Doctordle remains a truthful WIP until explicit collaboration approval** — `daily-games/doctordle-approval-boundary`; `historical-review.md:258` | MERGE | Core **C-58 — Doctordle collaboration boundary** (`daily-games/doctordle-collaboration-boundary`) | Attach Wave 5, `ba9c4a8`, and audit evidence. No collaboration approval or future gameplay scope is inferred. |
| HR-15 | **Anki workflows must remain useful without AnkiConnect** — `anki/useful-without-direct-bridge`; `historical-review.md:271` | MERGE | Core **C-78 — Persistent Card Vault and spaced review** (`cards/persistent-vault-spaced-review`) | Attach Pre-Beta, owner blueprint, and historical-audit evidence. Core C-79 is the separate direct-sync candidate; this merge preserves export/in-app usefulness without claiming the bridge works. |
| HR-16 | **Incomplete capability is visible only with honest status** — `release/truthful-incomplete-modules`; `historical-review.md:288` | MERGE | Core **C-06 — Honest capability boundaries** (`core/honest-capability-boundaries`) | Attach the Alpha directive, owner verification statement, and feature-matrix evidence. Navigational cost of WIP modules remains HR-45, a distinct Product Debt concept. |
| HR-17 | **User-facing identity is AXOM; Noctyrium survives only where compatibility requires it** — `identity/axom-visible-noctyrium-compatibility-only`; `historical-review.md:303` | MERGE | Core **C-07 — AXOM identity with frozen compatibility identifiers** (`identity/axom-brand-compatibility`) | Attach the Question Bank/UI, `3a8069b`, and audit evidence. Core C-99 is a related unresolved hosted/repository identity concept, not the same compatibility rule. |
| HR-18 | **Promise of Use is a personal accountability moment, not a legal trap** — `onboarding/promise-accountability-not-legal`; `historical-review.md:318` | MERGE | Core **C-89 — Optional Promise of Use** (`onboarding/optional-promise`) | Attach owner Alpha, Wave 5.5D, and commits `997fac8`, `5c35e77`, and `dea9840`. Preserve the replay/signature-history ambiguity for owner disposition. |
| HR-19 | **Command Brief is the grounded dominant dashboard surface** — `dashboard/grounded-command-brief-dominant`; `historical-review.md:337` | MERGE | Core **C-08 — Command Brief: one grounded next action** (`command-brief/one-grounded-next-action`) | Attach Wave 5.5D and commits `5c35e77`/`0b7f7e0`. Core C-25 and C-29 remain observed hierarchy/layout relationships. |
| HR-20 | **Snapshot Question Sets use stored membership and order as authority** — `question-sets/snapshot-membership-order-authoritative`; `historical-review.md:350` | MERGE | Question **Question Set is a deterministic membership snapshot** (`question-set.authoritative-membership-snapshot`) | Attach the 2026-07-16 owner cleanup evidence and commits `8439f97`/`9654ba2`. The launch defect is a separate bug record at HR-36. |
| HR-21 | **Question annotations are learner-owned overlays, never source rewrites** — `question-annotations/learner-overlay-source-immutable`; `historical-review.md:365` | MERGE | Question **Source text and learner overlays remain distinct** (`question.source-immutable-learner-overlay`) | Attach Q2b owner direction and `80c8e5b`. Highlight, note, anchoring, overlap, and attachment behavior remain separate child concepts. |

### Historical checkpoint rollups

The following headings describe accepted or implemented checkpoints containing
multiple independent product concepts. They should supply checkpoint/review
provenance to the destination concepts, not survive as duplicate product
concepts.

| Locator | Historical candidate and retained evidence locator | Disposition | Exact target or observed split | Provenance/conflict handling |
| --- | --- | --- | --- | --- |
| HR-22 | **Accepted shell identity, statuses, and theme system** — `completed/shell-identity-status-theme`; `historical-review.md:379` | SPLIT | Core **C-07 — AXOM identity with frozen compatibility identifiers**; Core **C-06 — Honest capability boundaries**; NEW evidence concept: device-local Light/Dark/System theme | Attach Wave 2 and `3a8069b` to each applicable concept. Theme is not represented by an exact core candidate; do not silently subsume it under identity. |
| HR-23 | **Focused Question Bank first-use and returning command center** — `completed/question-bank-entry-command-center`; `historical-review.md:390` | SPLIT | Question **Focused first-use Question Bank** (`question-bank.focused-first-use`); **Returning Question Bank command center** (`question-bank.returning-command-center`) | Attach Wave 3 and `c1328f3`; preserve separate new-user and returning-user jobs. |
| HR-24 | **Settings, recovery, onboarding, guide, and Promise architecture** — `completed/settings-recovery-onboarding`; `historical-review.md:401` | SPLIT | Core **C-91 — Five-section Settings information architecture**; **C-61 — Portable Backup, Restore, and Merge**; **C-62 — Automatic Safety Snapshots and migration recovery**; **C-87 — Four-step onboarding**; **C-88 — Global guide and same-route module tours**; **C-89 — Optional Promise of Use** | Attach Wave 4, `997fac8`, and its gate evidence by concern. The checkpoint itself is provenance, not one feature. |
| HR-25 | **Optional Daily Games, Daily Word, Doctordle boundary, and clocks** — `completed/daily-games-clock-foundation`; `historical-review.md:415` | SPLIT | Core **C-53 — Optional Daily Games ecosystem**; **C-54 — AXOM Daily Word**; **C-57 — Local clock and timezone utility**; **C-58 — Doctordle collaboration boundary**; **C-59 — Daily Games lazy and offline-aware delivery** | Attach Wave 5, `ba9c4a8`, and full-audit evidence to the applicable records. |
| HR-26 | **Configurable daily loop, fast activity logging, reports, and Pomodoro presets** — `completed/daily-loop-stabilization`; `historical-review.md:427` | SPLIT | Core **C-16 — Configurable, neutral daily success**; **C-18 — Fast manual activity logging**; **C-19 — Recent and frequent activity shortcuts**; **C-20 — Reliable Pomodoro and configurable focus presets**; **C-23 — Honest progressive Reports** | Attach Wave 5.5A and `1b66a39`; no combined “stabilization feature” is retained. |
| HR-27 | **Core comprehension and real-import reliability checkpoint** — `completed/core-comprehension-import-reliability`; `historical-review.md:439` | SPLIT | Core **C-06 — Honest capability boundaries**; **C-08 — Command Brief: one grounded next action**; **C-90 — Help, guidance, and privacy-bounded feedback**; Question **Field-level provenance and inspectable parser evidence** (`question-import.field-provenance-inspectable-evidence`); **Sanitized real-layout import acceptance corpus** (`question-import.sanitized-real-layout-acceptance-harness`); plus the trust candidates at HR-06 | Attach `5c35e77` and the 657-test/four-browser-journey evidence without creating a cross-product feature whose only meaning is a checkpoint. |
| HR-28 | **Dashboard widgets, daily continuity, and journal notebook foundation** — `implemented/widgets-daily-continuity-journal-foundation`; `historical-review.md:454` | SPLIT | Core **C-26 — Customizable Dashboard widget engine**; **C-12 — Optional Daily Check-In and learner-authored Daily Focus**; **C-14 — Bounded Daily Closeout**; **C-17 — Canonical target contribution ledger**; **C-46 — Semantic Journal Foundation**; **C-47 — Journal autosave and lossless page navigation**; **C-48 — Journal Day at a Glance** | Attach the Wave 5.5D, `dea9840`, and audit evidence. Preserve the warning that the generic commit body does not establish owner-level verification of every rendered state. |
| HR-29 | **Pasted-text explicit-answer candidate preservation** — `completed/q1-paste-answer-trust`; `historical-review.md:470` | MERGE | Question **Structured answer evidence preserves harmless drift** (`bug.answer-explicit-letter-drift-discarded`) | Attach `b94e6f1`; this and HR-32 are two epochs of the same normalized cross-format trust concept, not two records. |
| HR-30 | **Q2a reading tools and answer elimination** — `completed/q2a-reading-elimination`; `historical-review.md:481` | SPLIT | Question **Answer-choice elimination** (`quiz-tool.answer-elimination`); **New Question returns to the stem** (`quiz-navigation.new-question-stem-focus`); **Device-only quiz reading scale** (`quiz-tool.device-reading-scale`); **Session calculator** (`quiz-tool.session-calculator`); **Rationale reading hierarchy** (`quiz-feedback.rationale-priority-and-collapse`) | Attach `943a3f9` and the 24/24 browser proof to each applicable concept. |
| HR-31 | **Persistent highlights and plain question notes** — `completed/q2b1-highlights-notes`; `historical-review.md:492` | SPLIT | Question **Persistent stem and explanation highlights** (`question-annotation.persistent-text-highlights`); **Persistent plain Question notes** (`question-note.persistent-plain-text-autosave`); **Resilient annotation anchoring and repair** (`question-annotation.resilient-anchor-repair`) | Attach `80c8e5b`; preserve the overlap issue as the separate fixed bug at HR-33. |
| HR-32 | **Structured CSV/JSON explicit-answer trust unification** — `completed/structured-answer-trust`; `historical-review.md:504` | MERGE | Question **Structured answer evidence preserves harmless drift** (`bug.answer-explicit-letter-drift-discarded`) | Attach the structured-trust owner directive and `cdfff38`. Merge with HR-29 provenance to represent the evolution from pasted-text-only to cross-format policy. |
| HR-33 | **Annotation overlap and deletion integrity** — `completed/annotation-overlap-integrity`; `historical-review.md:514` | MERGE | Question **Annotation overlap integrity** (`bug.annotation-overlap-stored-not-rendered`) | Attach the Q2b-1.1 owner message and `1e06a94`; preserve adjacency, repair-state authority, blank-selection, and targeted deletion evidence. |
| HR-34 | **Persistent image attachments to question notes** — `implemented/question-image-note-attachments`; `historical-review.md:526` | MERGE | Question **Question-note image attachments** (`question-note.local-image-attachments`) | Attach `2f4f290` and Q2b owner direction. Question **Portable attachment backup is explicit and fault-tolerant** and **Question and attachment deletion integrity** remain related independent concepts; preserve the warning that the terse commit alone does not establish owner verification. |
| HR-35 | **Normalized tags and deterministic Question Sets** — `completed/question-tags-deterministic-sets`; `historical-review.md:540` | SPLIT | Question **Canonical normalized user tags** (`question-tags.canonical-user-tags`); **Composable Question library filters and search** (`question-library.composable-filters-search-presets`); **Question Set is a deterministic membership snapshot** (`question-set.authoritative-membership-snapshot`) | Attach `8439f97` and the later cleanup evidence. Runtime launch correctness remains HR-36, not part of set creation semantics. |
| HR-36 | **Deterministic snapshot-set launch compatibility** — `bug-fixed/snapshot-set-empty-launch`; `historical-review.md:553` | MERGE | Question **Filter-created sets launch from explicit membership** (`bug.question-set-snapshot-launch-empty-pool`) | Attach the owner cleanup message and `9654ba2`; legacy fallback remains Question **Legacy set launch compatibility**, a related compatibility concept. |

### Defects, Product Debt, Technical Debt, and Polish

| Locator | Historical candidate and retained evidence locator | Disposition | Exact target or observed split | Provenance/conflict handling |
| --- | --- | --- | --- | --- |
| HR-37 | **Legacy cloud snapshots lack universal authenticated ownership** — `security/cloud-snapshot-authorization`; `historical-review.md:566` | MERGE | Core **C-67 — Cloud sync/account hardening** (`accounts/cloud-sync-hardening`) | Attach full-audit finding AX-001 and the HIGH containment evidence. Preserve the current-defect versus future-research category tension for owner disposition; no cloud roadmap choice is made. |
| HR-38 | **Identity-specific resource links are compiled into public defaults** — `privacy/public-personal-resource-defaults`; `historical-review.md:581` | MERGE | Core **C-80 — Resource Hub** (`resources/organized-personal-resource-hub`) | Attach full-audit finding AX-002 and historical owner convenience requests. HR-46 is the same privacy/release concept expressed as Product Debt; merge provenance and retain the category conflict. |
| HR-39 | **Web-local installation is not a complete supported dependency boundary** — `build/root-web-install-boundary`; `historical-review.md:596` | NEW | No equivalent core or Question candidate. Core C-95 concerns lint/hook hygiene, not the root-versus-web installation contract. | Retain full-audit AX-003 and Quality Gates evidence. Whether web-local installation is a promised workflow remains an open product question; no repair choice is proposed. |
| HR-40 | **Service worker runtime caching is overbroad and unbounded** — `offline/service-worker-cache-boundary`; `historical-review.md:611` | NEW | No equivalent candidate. Core C-70 concerns first-navigation bootstrap and C-59 concerns Daily Games delivery, neither the unbounded same-origin runtime cache. | Retain full-audit AX-007 and performance-audit evidence; do not infer a cache policy. |
| HR-41 | **Release/version truth is manually duplicated** — `release/single-version-source`; `historical-review.md:625` | NEW | No equivalent candidate. Core C-64 and C-99 record release-channel and hosted-identity conflicts but not the duplicated version source. | Retain full-audit AX-009 evidence and all cited surfaces. |
| HR-42 | **IndexedDB fallback may duplicate the full workspace in localStorage** — `storage/duplicate-localstorage-fallback`; `historical-review.md:636` | MERGE | Core **C-60 — Local Vault as Workspace source of truth** (`data/local-vault-source-of-truth`) | Attach full-audit AX-006/storage-map evidence as a fallback-boundary caveat. Do not reframe a fallback as ordinary successful-write behavior. |
| HR-43 | **App shell lacks a universal main landmark and route-level H1 contract** — `accessibility/main-landmark-route-h1`; `historical-review.md:647` | NEW | No equivalent specific candidate. Core C-92 is the broader accessibility-completion debt. | Retain site-audit-v2 and current source-search evidence, plus the explicit current-build reproduction requirement. |
| HR-44 | **Legacy hosted URLs and repository identity remain user-visible** — `product-debt/legacy-noctyrium-public-identity`; `historical-review.md:665` | MERGE | Core **C-99 — Canonical hosted URL and release identity** (`release/canonical-hosted-url`) | Attach full-audit AX-008, FIELD-NOTES, and git-remote evidence. Core C-07 remains the compatibility-name rule; do not infer rename/redirect/retention. |
| HR-45 | **WIP modules occupy navigable product space before capability is complete** — `product-debt/wip-navigation-policy`; `historical-review.md:680` | NEW | No equivalent candidate. Core C-06 governs truthful labeling but does not settle whether WIP modules should occupy ordinary navigation. | Retain full-audit AX-012 and feature-matrix evidence. No navigation policy is chosen. |
| HR-46 | **Curated Resource Hub must reconcile convenience with public privacy** — `product-debt/resource-hub-curation-privacy`; `historical-review.md:695` | MERGE | Core **C-80 — Resource Hub** (`resources/organized-personal-resource-hub`) | Merge with HR-38 provenance. Preserve older permanent-resource intent and later privacy containment as an unresolved conflict; do not choose item-level public links. |
| HR-47 | **Settings and backup language must be understandable to nontechnical users** — `product-debt/settings-backup-comprehension`; `historical-review.md:712` | MERGE | Core **C-91 — Five-section Settings information architecture** (`settings/five-section-information-architecture`) | Attach owner feedback, Wave 4, and audit evidence. Core C-61 is an observed backup-behavior dependency, not a duplicate wording/IA concept. |
| HR-48 | **Blueprint content must be actionable, specific, and source-governed** — `product-debt/blueprint-actionable-content-depth`; `historical-review.md:726` | MERGE | Core **C-45 — Source-governed Blueprints** (`blueprint/source-governed-pathways`) | Attach the owner blueprint chronology and audit evidence; retain the warning that the 347-page source extraction is incomplete. |
| HR-49 | **Direct AnkiConnect path remains unverified and visually overexplained** — `product-debt/ankiconnect-owner-verification`; `historical-review.md:742` | MERGE | Core **C-79 — Verified AnkiConnect synchronization** (`anki/verified-sync`) | Attach owner blueprint and audit evidence. Preserve the owner-defined verification threshold and do not promote probing/diagnostics to verified sync. |
| HR-50 | **Route-family eager loading inflates the initial shell** — `tech-debt/route-family-lazy-loading`; `historical-review.md:755` | MERGE | Core **C-69 — Broader route-level code splitting** (`performance/route-level-splitting`) | Attach full-audit AX-004 and performance-audit evidence. No numerical bundle budget or route split is inferred. |
| HR-51 | **Core state and page modules mix exceptional numbers of responsibilities** — `tech-debt/oversized-mixed-responsibility-modules`; `historical-review.md:767` | MERGE | Core **C-96 — Oversized core modules** (`technical/oversized-dashboard-store`) | Attach full-audit AX-005 and architecture evidence. Preserve the need for current remeasurement and the historical-file-scope difference. |
| HR-52 | **Automated WCAG coverage is absent** — `tech-debt/automated-wcag-scans`; `historical-review.md:779` | NEW | No equivalent technical/testing candidate. Core C-92 is product accessibility debt, not automated scanning infrastructure. | Retain full-audit AX-013 and accessibility-audit evidence; no tool/dependency choice is proposed. |
| HR-53 | **Critical accessibility journeys lack complete keyboard, zoom, and touch proof** — `tech-debt/a11y-critical-journey-coverage`; `historical-review.md:791` | MERGE | Core **C-92 — Cross-product accessibility completion** (`accessibility/cross-product-completion`) | Attach accessibility-audit evidence. Preserve route-by-route gaps and avoid converting partial proof into a universal accessibility claim. |
| HR-54 | **Populated two-version update and rollback rehearsal is missing** — `tech-debt/two-version-upgrade-rehearsal`; `historical-review.md:804` | MERGE | Core **C-100 — Release persistence QA contract** (`release/persistence-qa`) | Attach full-audit AX-010 and update-safety evidence as an unfulfilled rehearsal condition. This does not establish that update persistence is broken. |
| HR-55 | **Backup/restore destructive UI permutations need independent browser proof** — `tech-debt/backup-restore-browser-rehearsal`; `historical-review.md:816` | NEW | No equivalent candidate. Core C-61 defines backup behavior and C-100 defines release persistence, but neither is this specific evidence-coverage gap. | Retain full-audit limitation and quality-gate evidence; no browser procedure or threshold is invented. |
| HR-56 | **Large-workspace quota and persistence health are not field-tested** — `tech-debt/large-workspace-quota-field-test`; `historical-review.md:827` | NEW | No equivalent candidate. Core C-60, C-68, and C-97 are related storage concepts with different scopes. | Retain storage/performance audit evidence; no quota, dataset size, or browser support target is inferred. |
| HR-57 | **Legacy Swift/native/assets/PDFs/RTF obscure repository boundaries** — `tech-debt/legacy-repository-assets`; `historical-review.md:838` | NEW | No equivalent broad repository-boundary candidate. Core C-98 covers only the legacy native productivity daily-file architecture. | Retain full-audit AX-011/§§4,29 evidence. Archive/delete/retain remains an owner decision. |
| HR-58 | **Test runtime should use supported Node LTS without storage-warning noise** — `tech-debt/node-lts-test-noise`; `historical-review.md:853` | NEW | No equivalent candidate. | Retain quality-gate log evidence and the distinction between warning noise and product behavior; do not select a Node version. |
| HR-59 | **Historical parser source specification is absent** — `tech-debt/parser-original-spec-provenance`; `historical-review.md:865` | NEW | No candidate equivalent. Question catalogue reconstruction note **Original parser specification gate** records the same insufficiency but intentionally is not a candidate. | Preserve full-audit AX-015 and documentation-truth evidence. Missing historical text does not invalidate the shipped parser. |
| HR-60 | **Dark-theme gold and decorative density require restraint** — `polish/restrained-gold-decorative-density`; `historical-review.md:878` | NEW | No equivalent candidate. | Retain the Wave 5.5A/Wave 5.5D visual evidence and “ongoing standard” uncertainty; no visual token or redesign is proposed. |
| HR-61 | **Daily quote belongs below the working dashboard hierarchy** — `polish/dashboard-quote-quiet-footer`; `historical-review.md:890` | CONFLICT | Core **C-25 — Fixed Dashboard orientation and primary-action hierarchy** (`dashboard/fixed-orientation-primary-action`) | C-25 preserves Welcome + Quote and Command Brief as fixed orientation surfaces and explicitly flags later relative-order evidence. HR-61 records the later “quiet footer” direction. Preserve both; **Owner Decision Required**. |
| HR-62 | **Settings hierarchy should remain compact and progressively disclosed** — `polish/settings-compact-progressive-hierarchy`; `historical-review.md:900` | MERGE | Core **C-91 — Five-section Settings information architecture** (`settings/five-section-information-architecture`) | Attach Wave 5.5A and Wave 4 evidence. “Compact” and “progressive disclosure” remain historical observations, not new UX measurements. |
| HR-63 | **Course Tracker help and import guidance must be conspicuous** — `polish/course-tracker-help-import-guidance`; `historical-review.md:915` | NEW | No equivalent candidate. Core C-31 is the Course Tracker capability; it does not represent this discoverability/polish concept. | Retain owner feedback, owner Alpha evidence, and `5c35e77`; do not infer current completion from the checkpoint alone. |
| HR-64 | **Productivity and dashboard calendar visual language should remain coherent** — `polish/cross-surface-activity-calendar-consistency`; `historical-review.md:930` | NEW | No equivalent candidate. Core C-18 and C-25 are related surfaces, not this cross-surface visual-coherence concept. | Retain direct feedback and owner Alpha evidence; current completion remains unknown. |

### Research and future concepts

| Locator | Historical candidate and retained evidence locator | Disposition | Exact target or observed split | Provenance/conflict handling |
| --- | --- | --- | --- | --- |
| HR-65 | **Universal source-document intelligence** — `research/universal-source-document-intelligence`; `historical-review.md:944` | MERGE | Question **Universal Question Import Engine** (`future.question-import.universal-evidence-pipeline`) | Attach full-audit deferred-ledger and documentation-truth evidence. OCR, slides, images/tables, source retention, and template learning remain separate child concepts. |
| HR-66 | **Structured explanations and disclosed generated distractor rationales** — `research/structured-explanations-generated-disclosure`; `historical-review.md:957` | SPLIT | Question **Structured source rationales and provenance** (`question-explanation.structured-source-rationales`); **Optional AI-generated missing rationales with field-level disclosure** (`future.question-ai.generated-rationale-disclosure`) | Preserve the distinction between source-authored structure and generated content. Attach deferred-ledger/Q2a evidence without treating generation as approved. |
| HR-67 | **Tutor Mode and exam-software simulation** — `research/tutor-and-exam-simulation`; `historical-review.md:969` | SPLIT | Question **Advanced conversational Tutor** (`future.quiz.advanced-conversational-tutor`); **Full exam-software simulation** (`future.quiz.full-exam-simulation`) | Keep both separate from the shipped bounded Tutor and Exam modes. Attach deferred-ledger/experience evidence; no simulator or AI Tutor scope is selected. |
| HR-68 | **Course Central schedule/module document import** — `research/course-central-schedule-import`; `historical-review.md:982` | MERGE | Core **C-34 — Level 0 manual structured Course Central import** (`course-central/level-0-manual-import`) | Attach Course Central architecture and deferred-ledger evidence. OCR-dependent screenshot extraction remains unavailable and must not be inferred. |
| HR-69 | **Institution templates, cohorts, and curriculum graph** — `research/course-central-institution-model`; `historical-review.md:992` | SPLIT | Core **C-40 — Institution/program curriculum templates** (`course-central/institution-curriculum-templates`); **C-42 — Local curriculum relationship graph** (`knowledge-graph/curriculum-relationship-graph`); NEW evidence concept: cohort/small-group scheduling | Attach full-audit §9/deferred-ledger provenance by concept. Do not assume cohort scheduling data or acceptance from template/graph evidence. |
| HR-70 | **LMS and institution connectors** — `research/lms-institution-connectors`; `historical-review.md:1004` | MERGE | Core **C-36 — Level 2 authorized read-only LMS connectors** (`course-central/level-2-authorized-connectors`) | Attach architecture/deferred-ledger evidence; Core C-37 partnership remains a distinct later trust level. |
| HR-71 | **Secure optional accounts, recovery, and local-first sync** — `research/secure-accounts-local-first-sync`; `historical-review.md:1014` | MERGE | Core **C-67 — Cloud sync/account hardening** (`accounts/cloud-sync-hardening`) | Attach Pre-Beta, owner backend direction, and audit evidence. Merge future design provenance with HR-37’s present containment evidence while preserving the category/state conflict and owner decision requirement. |
| HR-72 | **Multiple notebooks, search, bookmarks, and monthly reflection** — `research/journal-multiple-notebooks-search-reflection`; `historical-review.md:1030` | MERGE | Core **C-51 — Additive Journal extensions** (`journal/future-additive-extensions`) | Attach Journal architecture/deferred-ledger evidence. The grouped ideas remain unsplit until owner evidence establishes independent concepts. |
| HR-73 | **Journal Cinematic and advanced notebook physics** — `research/journal-cinematic`; `historical-review.md:1041` | MERGE | Core **C-50 — Journal Cinematic** (`journal/cinematic-shell`) | Attach architecture, roadmap, and deferred evidence; preserve “next” versus Tier 3 timing conflict. |
| HR-74 | **Hour-by-hour Day Plan with calendar overlay** — `research/day-plan-calendar-overlay`; `historical-review.md:1052` | NEW | No equivalent candidate. Core C-72 concerns standard-format calendar integration; Core C-24 concerns scheduled-hours evidence, neither an hour-by-hour Day Plan. | Retain Pre-Beta/deferred-ledger evidence; no calendar ownership or scheduling behavior is inferred. |
| HR-75 | **Exam-date planning, reminders, and post-exam reflection** — `research/exam-date-reminder-reflection`; `historical-review.md:1063` | SPLIT | Core **C-82 — Boards and exam-prep lanes** (`academic-prep/boards-lanes`) for observed exam-date/lane context; NEW evidence concepts: exam reminders and post-exam reflection | Attach Pre-Beta/deferred evidence. Do not infer that reminders or reflection are part of the current Boards foundation. |
| HR-76 | **Adaptive daily practice-question goals** — `research/adaptive-question-goals`; `historical-review.md:1074` | NEW | No equivalent candidate. Question due/missed/weak-topic loops are evidence relationships, not adaptive goal-setting. | Retain deferred-ledger evidence; no algorithm, signal, or target semantics are inferred. |
| HR-77 | **Local recurring-task template suggestions** — `research/local-recurring-task-templates`; `historical-review.md:1086` | NEW | No equivalent candidate. Core C-81 covers learner-owned Tasks, not suggested templates. | Retain deferred-ledger evidence; “local” does not imply any specific recommendation method. |
| HR-78 | **Mature Application Checker and evidence pathway** — `research/application-checker-evidence-pathway`; `historical-review.md:1096` | MERGE | Core **C-84 — Application/Residency intelligence** (`applications/intelligence-surface`) | Attach Pre-Beta, historical audit, and feature-matrix evidence. Preserve the unresolved naming/scope conflict between Application Checker and Application/Residency Intelligence. |
| HR-79 | **Deep Anki/Noji adapter ecosystem** — `research/anki-noji-adapters`; `historical-review.md:1109` | SPLIT | Core **C-79 — Verified AnkiConnect synchronization** (`anki/verified-sync`) for the AnkiConnect adapter; NEW evidence concept: Noji/other adapter ecosystem and adapter-level fallback policy | Attach Pre-Beta/full-audit evidence. Do not treat an export path or one probed adapter as evidence that any other adapter exists. |
| HR-80 | **Future optional email signup concept** — `research/optional-product-email-signup`; `historical-review.md:1118` | MERGE | Core **C-94 — Optional release/signup email capture** (`release/optional-email-capture`) | Attach Wave 5.5A evidence and the warning that unrelated personal-site mailing-list concepts were excluded. |
| HR-81 | **Native Tauri distribution and update parity** — `research/tauri-native-update-parity`; `historical-review.md:1132` | MERGE | Core **C-71 — Native/Tauri production channel** (`platform/tauri-production-channel`) | Attach owner Alpha, direct feedback, and audit evidence. Current scaffold remains experimental; no graduation decision is inferred. |
| HR-82 | **Automatic recovery snapshots and backup reminders** — `research/automatic-recovery-backup-reminders`; `historical-review.md:1145` | SPLIT | Core **C-62 — Automatic Safety Snapshots and migration recovery** (`data/automatic-snapshot-migration-recovery`) for shipped snapshot behavior; NEW evidence concept: user-facing backup-age/reminder lifecycle | Attach Question Bank/UI, audit, and storage-map evidence. Do not misrepresent implemented migration snapshots as proof that reminders exist. |
| HR-83 | **Privacy, deletion, recovery, and incident policy for external Alpha** — `research/public-alpha-privacy-recovery-policy`; `historical-review.md:1157` | NEW | No equivalent candidate. Core C-64, C-67, and C-90 provide related release/account/feedback boundaries but not a public-Alpha policy concept. | Retain full-audit release/security evidence; policy ownership and public cohort remain **Owner Decision Required**. |

## Obvious cross-catalogue duplicate groups

These are the highest-confidence merge groups. They are evidence clusters only;
they do not authorize canonical titles, categories, or dispositions.

1. **Local-first identity**
   - HR-01 `core/local-first-operating-partner`
   - Core C-01 `core/local-first-academic-operating-system`

2. **Update persistence**
   - HR-02 `data/update-preserves-user-work`
   - HR-54 `tech-debt/two-version-upgrade-rehearsal` as a missing proof
   - Core C-100 `release/persistence-qa`
   - Related but distinct implementation evidence: Core C-60 through C-64

3. **Question Bank flagship loop**
   - HR-05 `question-bank/import-review-practice-understand`
   - Question `question-bank.flagship-import-review-practice-repair-loop`

4. **Question answer-trust evolution**
   - HR-06 `question-bank/false-ready-zero`
   - HR-29 `completed/q1-paste-answer-trust`
   - HR-32 `completed/structured-answer-trust`
   - Question `question-mapping.readiness-runnable-boundary`
   - Question `question-answer.unknown-never-default-a`
   - Question `question-answer.user-confirmed-precedence`
   - Question `bug.answer-explicit-letter-drift-discarded`
   - These are related but not interchangeable; HR-29 and HR-32 are the direct
     temporal duplicates that normalize into the same drift-policy record.

5. **Daily success and honest Reports**
   - HR-08 with Core C-16
   - HR-09 with Core C-23
   - HR-26 is checkpoint provenance that must be distributed, not retained as a
     third product concept.

6. **Daily Word/Doctordle ecosystem**
   - HR-13, HR-14, and HR-25
   - Core C-53 through C-59
   - HR-25 is a checkpoint rollup; HR-13 combines three separable Daily Word
     concerns.

7. **Identity and legacy release naming**
   - HR-17 with Core C-07
   - HR-44 with Core C-99
   - The two groups are related but remain distinct: compatibility identifiers
     versus canonical hosted/repository identity.

8. **Promise, onboarding, Settings, and guidance**
   - HR-18 with Core C-89
   - HR-24 distributes to Core C-61/C-62/C-87/C-88/C-89/C-91
   - HR-47 and HR-62 both add evidence to Core C-91.

9. **Question Set snapshot semantics**
   - HR-20 with Question `question-set.authoritative-membership-snapshot`
   - HR-35 contributes set-creation provenance
   - HR-36 with Question `bug.question-set-snapshot-launch-empty-pool`
   - Creation semantics and the fixed launch bug remain separate.

10. **Question annotation family**
    - HR-21 with Question `question.source-immutable-learner-overlay`
    - HR-31 distributes to highlights, notes, and anchor repair
    - HR-33 with Question `bug.annotation-overlap-stored-not-rendered`
    - HR-34 with Question `question-note.local-image-attachments`
    - These are one family, not one feature.

11. **Resource Hub public-privacy conflict**
    - HR-38 `privacy/public-personal-resource-defaults`
    - HR-46 `product-debt/resource-hub-curation-privacy`
    - Core C-80 `resources/organized-personal-resource-hub`
    - HR-38 and HR-46 are duplicate observations with different provisional
      categories; the category conflict is preserved for owner disposition.

12. **Cloud/account containment and future secure sync**
    - HR-37 `security/cloud-snapshot-authorization`
    - HR-71 `research/secure-accounts-local-first-sync`
    - Core C-67 `accounts/cloud-sync-hardening`
    - Present containment and future research are two evidence states currently
      grouped by the core catalogue; owner disposition may later split them.

13. **Performance and oversized-module debt**
    - HR-50 with Core C-69
    - HR-51 with Core C-96

14. **Accessibility completion**
    - HR-53 with Core C-92
    - HR-43 (landmark/H1) and HR-52 (automated WCAG scanning) remain distinct
      candidate concepts with observed relationships to C-92.

15. **Course Central**
    - HR-68 with Core C-34
    - HR-69 distributes to Core C-40/C-42 plus a new cohort concept
    - HR-70 with Core C-36

16. **Journal future work**
    - HR-72 with Core C-51
    - HR-73 with Core C-50

17. **Accounts, native distribution, and release signup**
    - HR-71 with Core C-67
    - HR-80 with Core C-94
    - HR-81 with Core C-71

## Unresolved conflict groups

No suggested interpretation below is accepted product truth.

| Conflict | Evidence A | Evidence B | Suggested archival interpretation only | Required disposition |
| --- | --- | --- | --- | --- |
| Dashboard quote hierarchy | Core C-25 keeps Welcome + Quote and Command Brief as fixed orientation surfaces and flags relative ordering as unknown. | HR-61 records the later owner direction that the quote belongs below the working hierarchy as a quiet footer. | Retain one explicit conflict bundle; do not merge away either source. | Owner Decision Required. |
| Readiness inference | Early owner evidence in HR-10 proposed broad Journal/personal-roadblock inference. | Later evidence in HR-10 and Core C-22 requires grounded, confirmable, non-diagnostic signals. | Preserve historical evolution; do not label the earlier concept obsolete without owner disposition. | Owner Decision Required for any expansion. |
| Cloud/account scope | June direction requested name/PIN accounts and cloud save/load (HR-37/HR-71). | July security evidence found unauthenticated ownership risk; Core C-67 says the scaffold must not be a primary claim. | Current containment evidence and future secure-account research remain distinguishable inside one conflict group. | Owner Decision Required. |
| Resource defaults | Historical owner evidence requested persistent personal/SGU resources (HR-38/HR-46). | Full-audit privacy evidence found identity-specific URLs compiled into public defaults. | Preserve convenience intent and public-release risk; no item-level link decision is made. | Owner Decision Required. |
| Promise replay/signature behavior | HR-18 preserves an earlier “restart permits signing again” direction. | Accepted logic version-scopes/suppresses repeat presentation. | Retain both as historical behavior evidence. | Owner Decision Required before replay semantics change. |
| Application surface naming | HR-78 calls for a mature Application Checker/evidence pathway. | Core C-84 records Application/Residency Intelligence and explicitly questions whether these are the same concept. | One merge target is used only to avoid duplicate evidence; naming/scope remains unresolved. | Owner Decision Required. |
| Journal Cinematic timing | Core C-50 is described both as “next” and Tier 3/after Alpha. | HR-73 preserves the deferred/version-2 interpretation. | Keep both timing labels as evidence; assign no roadmap placement. | Owner Decision Required. |
| Verification authority | Several historical checkpoint records contain engineering gates/commit evidence. | Historical note states “verified means i confirmed it works.” | Gate evidence remains evidence; it is never converted into owner acceptance by this crosswalk. | Owner Decision Required during disposition. |

## Reconstruction-note crosswalk

The 11 sections under `historical-review.md` “Reconstruction notes — do not
create canonical records yet” remain notes, not candidates:

| Historical note | Cross-catalogue handling |
| --- | --- |
| Beta audit v3 failures are environment evidence, not ten product regressions | Retain as audit-provenance warning; no candidate merge. |
| Live-site landmark results require current-build reproduction | Attach as a confidence/reproduction warning to HR-43; related to Core C-92. |
| June cloud-account direction conflicts with July security evidence | Attach to the HR-37/HR-71/Core C-67 conflict group. |
| Permanent SGU/personal resource defaults conflict with privacy containment | Attach to the HR-38/HR-46/Core C-80 conflict group. |
| Board-navigation history contains an explicit supersession | Retain as chronological/supersession evidence related to Core C-82; do not reconstruct simultaneous navigation requirements. |
| Readiness inference was deliberately narrowed | Attach to HR-10/Core C-22 as conflict/evolution evidence. |
| “Verified” has an owner-defined threshold | Apply as an archive-wide status warning; no candidate status may be promoted from engineering gates. |
| Raw quote source tracking changed contrary to an earlier handoff | Retain as repository-cleanup uncertainty; no existing candidate target and no inferred remove/retain decision. |
| About-page external iframe is not a confirmed current bug | Retain as insufficient evidence; do not create or merge a Bug. |
| Hook warnings and early schema drift are stale until reverified | Retain as superseded audit history; only HR-41 carries currently supported release/version evidence. |
| Competitor research was a reviewer recommendation, not an owner commitment | Retain as excluded reviewer suggestion; do not create a Research candidate. |

## Crosswalk integrity checks

- Historical candidate headings accounted for: **83 of 83**.
- Each historical candidate has exactly one top-level disposition.
- Exact merge targets exist in `core-systems.md` or `question-system.md`.
- Historical evidence remains reachable by exact title, provisional dedupe key,
  and source line.
- Direct duplicates retain all source epochs rather than dropping the older
  citation.
- Composite checkpoints are split into observable concepts rather than
  preserved as duplicate features.
- Conflicts remain explicit; none is resolved.
- No canonical AX ID was created or consumed.
- No Product Owner-controlled priority, board, status, Product DNA, acceptance,
  impact, roadmap, verification, or owner-acceptance value was assigned.
- No governance or repository file was modified.

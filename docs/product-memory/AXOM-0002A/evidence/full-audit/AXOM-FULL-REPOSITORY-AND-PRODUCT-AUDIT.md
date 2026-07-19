# AXOM Full Repository and Product Audit

Generated 2026-07-16 (America/Grenada). Principal auditor: SOL.

## 1. Executive verdict

The committed baseline is suitable for Jafar's personal daily use (**GREEN**) with routine portable backups and cloud features left disabled. It is not ready for public pre-Alpha or public Alpha (**RED**). Trusted-friend and closed SGU testing are **YELLOW**: the local-first core, Question Bank, daily loop, dashboard, journal, backup primitives, and offline Daily Word have substantial automated evidence, but cloud authorization, compiled personal resource links, accessibility coverage, update rehearsal, parser-policy consistency, and release identity require closure.

No repository was modified. All artifacts and clean archive test environments live under `/tmp/axom-sol-full-audit`.

## 2. Audit boundaries

Evidence is labeled as committed baseline, detached environment, live uncommitted Q2a, or documentation claim. Browser work used new isolated contexts against the archived committed build. It did not read or mutate the live browser profile. Exhaustive manual execution of every requested destructive/stateful permutation was not possible; those limitations are explicit and never converted into passing claims.

## 3. Baseline reconciliation

| Item | Live workspace | Detached baseline | origin/main |
|---|---|---|---|
| Path | /Users/jd/Developer/AXOM | /Users/jd/Developer/axom-audit | remote |
| State | main | detached HEAD | n/a |
| SHA | 26707a8713105746c641846bf51b3f92f000b260 | 26707a8713105746c641846bf51b3f92f000b260 | 26707a8713105746c641846bf51b3f92f000b260 |
| Ahead/behind | 0/0 | 0/0 | reference |
| Status | 7 modified, 7 untracked | clean | n/a |
| Tracked files | 421 | 421 | 421 |
| On-disk size | 8.2 GB (includes ignored/user/dependency material) | 310 MB (incl. web node_modules/git metadata) | n/a |
| Package locks | web 73f433…; root live cc8319… | web 73f433…; root 18e223… | detached values |
| node_modules | root + web | web only at observation | n/a |

Environment: Node v26.3.0, npm 11.16.0, macOS 26.3.1 arm64, ~19 GiB free. TypeScript 5.9.3 in web. In the live workspace, @types/node resolves from repository root. In detached pre-test observation it resolved accidentally from /Users/jd/node_modules; clean archive tests proved the authoritative root install supplies it, while web-only install does not.

Live uncommitted paths: docs/EXPERIENCE-REFINEMENT-WAVE.md; package.json; package-lock.json; web/src/components/questions/ExamRunner.tsx; web/src/lib/brand.ts; web/src/styles/loop.css; web/src/styles/questionbank.css; test/; tsconfig.json; wdio.conf.ts; web/src/components/questions/QuizCalculator.tsx. Root classifier/WebdriverIO files are separate from the Q2a product diff and must not be swept into a Q2a commit without Claude/Jafar review.

## 4. Repository inventory

421 tracked files, approximately 27.7 MiB. Production web source inspected: 199 TS/TSX/CSS modules; 107 test files; total source inventory 307 TS/TSX/CSS files including tests. Tracked legacy groups: Swift package and native app (historical but harmless; compatibility decision), Noctyrium icons/native wrapper (required for legacy/native compatibility but stale branding), Tauri scaffold (experimental source), scripts/legacy (safe archive candidate), Quote Librabry RTF (intentional/historical source asset; provenance and usefulness decision), three blueprint PDFs (source assets but 9.8+ MiB size/licensing/provenance debt), optional Vercel/Neon backend (dormant/scaffolded security surface). Personal medical/admissions PDFs seen elsewhere in the 8.2 GB live directory are ignored/untracked and are **not** part of origin/main; they should not be called a repository leak. Compiled personal share links in seed/blueprints are a real repository/privacy finding.

The Git remote is still `https://github.com/jaclose/Noctyrium.git`.

## 5. Architecture

React 18/Vite/Zustand hash-routed SPA; IndexedDB-backed Zustand persistence with localStorage fallback; optional service worker; optional Vercel/Neon API; experimental Tauri/SQLite shell. App.tsx coordinates routing, onboarding, tours, Promise, settings, update/reminder watchers, and shell. The store is a 2,241-line monolith. Dashboard, Course Tracker, parser, Command Brief, and global CSS are also oversized. Daily games alone are route-lazy; most routes are eager. No supported cyclic dependency was proven, so none is reported.

## 6. Route inventory

32 routes are defined in nav.ts and resolved in App.tsx. Unknown hashes fall back to Dashboard while the top-bar label falls back to Dashboard. Design preview is development-only and not in the production NAV count. Full route details are in AXOM-FEATURE-MATRIX.csv and 96 viewport checks in AXOM-ROUTE-TEST-MATRIX.csv. Incomplete public surfaces: Doctordle WIP, Leaderboards under construction, Application Checker under construction.

## 7. Feature inventory

The shipped core includes onboarding/global tour/Promise, Dashboard/Command Brief/widget editor, Daily Check-In and targets, activity/habit/task/Pomodoro workflows, Journal foundation, Reports, Course Tracker, Question Bank import/library/sets/player/analytics, Daily Word opt-in, resources/boards/premed/help/about/settings/backups. Cloud accounts, institution connectors, universal document intelligence, Doctordle, and advanced journal/tutor features remain scaffolded or deferred. See the feature and deferred CSVs for per-surface status, persistence, tests, limitations, and acceptance criteria.

## 8. Question-system audit

P0 evidence is strong: 817 unit tests include parser, trust, provenance, evaluation, deletion, mapping, attempts, quiz, and backup cases; the dedicated verifier passes; existing E2E proves text-file import, review, set creation, tutor block, answer, explanation, confidence/error repair, persistence, mastery, document/set linkage, and no workspace localStorage leak. Tests cover mixed keys, unknown-not-A, no explanation-as-option, answer validity, no false-ready, and user mapping trust.

Q1 paste policy correctly distinguishes exact contradiction from harmless trailing-text drift: a valid explicit letter remains the candidate with review. CSV/JSON resolveAnswerValue instead returns undefined for any drift (questionImport.ts 214-237). It should adopt candidate preservation, but through a structured resolution result—not by blindly returning a runnable correctKey. Candidate, evidence, confidence, contradiction, and needsReview must remain distinct. User-confirmed mappings must outrank all reparses.

PARSER-SPEC-ORIGINAL.md does not exist. Wave 6A Step 0 cannot checksum/reconcile the historical source, so planning needs either the source document or a formal waiver. Its absence alone does not invalidate the shipped parser or passing corpus gates.

Live Q2a read-only verdict: scope matches interaction-only work plus documentation and one device preference. The supported Fable CSS fix is present at loop.css as `.quiz-player-body .quiz-reading .question-stem`, which outranks the existing clamp selector. Q2a appears ready for Claude to run the complete gate matrix and commit, but Claude should exclude unrelated root classifier changes unless intentionally included in a separate commit.

## 9. Course Tracker / Course Central

Course Tracker is a large implemented page with unit coverage and completion/progress behavior. Course Central's institutional source/overlay model, adapter contract, SGU templates, PDF schedule extraction, curriculum graph, cohorts, and community submissions are architecture documents, not shipped capabilities. Keep learner overlays canonical and never let imported institutional updates overwrite user completion/corrections.

## 10. Dashboard / Command Brief / widgets

Implemented and independently evidenced: activation/ranking contracts, widget catalog, size/settings preferences, add/hide/reorder, keyboard announcements, responsive grid, and persistence. Existing E2E verifies editor focus/cancel/Escape and keyboard reorder. Remaining E3/E8 work is refinement and route performance, not a reason to call the core absent.

## 11. Productivity and daily loop

Activity logging, contribution ledger, habits, targets, check-in/closeout, reminders, recovery, rollover, and Pomodoro have substantial domain tests. Date/time logic explicitly stores local dates/timezone observations, but a full DST/travel matrix was not browser-tested here. Mental-health/readiness inputs must remain optional, non-diagnostic, and explainable.

## 12. Journal

Foundation is implemented: notebook metadata, pages, autosave, day-at-a-glance, customization, attachments, and backup normalization have code/tests. Requested multiple notebooks/search/bookmarks/monthly reflection and cinematic presentation remain deferred. Attachment/blob growth and export behavior need a large-data field test.

## 13. Reports

Reports uses derived, traceable calculations with unit tests and evidence cards. It is not yet Reports 2.0; readiness/monthly visualizations and broader drill-down remain deferred. Avoid prescriptive health scoring.

## 14. Daily Games

Daily Word is opt-in, lazy, offline verified, history-persistent, responsive, and isolated from workspace localStorage. The build verifier records 16.4 KB route and 66.2 KB word chunk. Doctordle is a WIP placeholder pending approval and must not be marketed as shipped.

## 15. Onboarding, tours, Promise

First-launch onboarding, global tour, module tour, Promise prompt/cutscene, rerun paths, exit reasons, and focus/layout restoration are implemented and heavily tested. Three isolated viewport journeys completed onboarding and deferred Promise without browser errors.

## 16. Settings, help, about, feedback

Settings includes profile/personalization/backup/data/account/AI surfaces; Help exposes tours/guide/feedback; About exposes version/identity. Feedback uses mailto/API scaffolding. Legacy Noctyrium hosted URL remains user-visible. Cloud/account panels must be explicitly disabled or labeled unsafe in Alpha builds.

## 17. Persistence and storage

See AXOM-STORAGE-AND-BACKUP-MAP.md. Canonical data is IndexedDB, schema 32; localStorage primarily contains device metadata and emergency fallback. The fallback duplicates workspace values under two keys on IDB failure, increasing quota risk.

## 18. Backup and restore

Portable JSON exports a reviewed DATA_KEYS list and normalizes older/missing schemas. Merge unions record lists by identifiers/timestamps and specially preserves question attempts/daily puzzles; replace requires explicit UI confirmation. Tests cover round-trips and normalization. Browser execution of replace/merge/corrupt/unknown-field permutations was not repeated in this audit, so unit evidence is distinguished from independent journey evidence.

## 19. Update safety

Same-origin static updates normally preserve browser data. Schema change triggers a pre-migration snapshot with timeout; failure leaves data in place and surfaces recovery. Before Alpha, prove a two-build upgrade with a populated large workspace, quota pressure, service-worker replacement, and rollback. Users should receive automatic snapshots and clear recovery; JSON knowledge cannot be the only disaster plan.

## 20. Accounts and sync architecture

Local-first anonymous ownership is viable. Google sign-in and secure sync are Beta/later. Username+PIN can be a local convenience, but a short PIN is not cloud security. Current server scaffold has PBKDF2/lockout/session concepts, yet legacy name/UUID snapshot methods do not attach a session token. Public cloud use is RED until authenticated ownership is universal, recovery/encryption/privacy are designed, and anonymous migration/conflict policy is tested.

## 21. Accessibility

See AXOM-ACCESSIBILITY-AUDIT.md. Strong intentional primitives exist, but no automated WCAG scanner was available and many populated secondary routes lack keyboard/screen-reader journey coverage. Closed Alpha YELLOW; public Alpha blocked.

## 22. Responsive behavior

All 32 routes were captured at 1440×1000, 768×1024, and 390×844 with no document horizontal overflow. Existing E2E adds 1024 layouts and critical component fit assertions. This supports empty/default-state reflow, not every modal/editor/populated table or true 200% browser zoom.

## 23. Performance and bundles

See AXOM-PERFORMANCE-AUDIT.md. App shell is 819 KB/234 KB gzip; PDF/XLSX are large separate assets but import paths need more on-demand isolation. Prioritize service-worker bounds, field startup/import measurements, and coarse route-family lazy loading.

## 24. Offline and service worker

Core shell and Daily Word reopen offline in verifier evidence. The runtime cache currently accepts all same-origin GET responses and never bounds entries; exclude /api and validate responses. Origin changes do not migrate browser storage automatically.

## 25. Testing coverage

107 test files/817 tests and 6 E2E tests pass. The audit adds 96 route/viewpoint smoke checks and screenshots. Strongest independent journey: Question Bank persistence. Weakest areas: cloud authorization, destructive restore UI, full journal/course workflows, accessibility automation, performance under large imports, and multi-version upgrade.

## 26. Build contradiction



Root `package.json` is authoritative for a full repository clone and declares `@types/node`. A root install makes it resolvable from `web`; all gates pass. The web manifest presents runnable build scripts and a web-local README, but does not declare `@types/node`, while its single tsconfig includes all tests and Vite config. Thus this is **root/web package dependency ambiguity plus an incomplete standalone web environment**. It is not incremental state and not a production dependency leak. Minimal repair: declare `@types/node` in web devDependencies if standalone web installs remain supported. Better build hygiene: separate app/build and test tsconfigs so production build does not compile tests; tests may keep Node APIs. Using Web Crypto/File APIs is optional, not required.



## 27. Documentation truthfulness

| Claim | File/section | Code evidence | Test evidence | Status |
|---|---|---|---|---|
| Local-first workspace is canonical | README; FEATURES Data safety | localVault.ts; store.ts | localVault, storage recovery, E2E persistence | Implemented/verified |
| Updates preserve data | UPDATE-POLICY; App update copy | storageMigrations.ts; localBackup.ts | migration/recovery tests | Implemented for same origin; field upgrade not independently proven |
| Question Bank flagship import/review | FEATURES Question Bank | ImportPanel, questionParse/import/trust | evaluation + 817 suite + E2E | Implemented/verified with CSV drift carry-forward |
| Universal ten-stage import engine | UNIVERSAL-QUESTION-IMPORT-ENGINE | partial parser/provenance/evaluation | corpus harness | Partially implemented; doc is target architecture |
| Course Central adapters/institution graph | COURSE-CENTRAL-ARCHITECTURE | no adapter framework shipped | none | Documentation-only |
| Dashboard widget architecture | DASHBOARD-WIDGET-ARCHITECTURE | DashboardPage/dashboardWidgets | unit + E2E keyboard/responsive | Implemented core; E3/E8 refinement pending |
| Journal notebook foundation | JOURNAL-NOTEBOOK-ARCHITECTURE | JournalPage/journalNotebook | notebook/autosave/backup tests | Implemented foundation; advanced items deferred |
| Cloud account/sync | README backend; Settings | API/sync scaffold | limited API/unit | Scaffolded and unsafe for public use |
| Doctordle integration | nav label | placeholder page | route smoke/unit | Deferred by approval |
| Parser original spec reconciliation | WAVE-6A Step 0 | PARSER-SPEC-ORIGINAL.md absent | n/a | Blocked provenance step; current parser not invalidated |

Several docs are living contracts/targets, not release notes. FEATURES is generally grounded but should qualify cloud and Wave 6 target claims. IMPLEMENTATION_AUDIT is historically useful but obsolete for current schema/features. ASK_DETAILED_REPORT is broad prior evidence, not a fresh verification.

## 28. Deferred-feature ledger

AXOM-DEFERRED-FEATURE-LEDGER.csv reconstructs the requested question, course, assistance, journal, dashboard, account, and cleanup ideas with sources, prerequisites, schema impacts, likely files, phases, and acceptance criteria.

## 29. Repository cleanup

Required compatibility: frozen storage keys and migration aliases. Intentional assets: licensed fonts/icons/Anki guide, subject to provenance. Historical harmless: Swift prototype and legacy scripts. User-visible branding defect: hosted Noctyrium URL/remote/native strings. Size debt: blueprint PDFs and native art. Privacy risk: compiled personal share links (not ignored personal PDFs). Jafar decisions: archive native history, retain/remove RTF/PDFs, rename repository, preserve redirects.

## 30. Security and privacy

No hidden cloud AI call was proven in normal local mode; local Ollama is user-configured, cloud providers are scaffolded/review-gated. Explicit network surfaces include update version fetch, favicons, AnkiConnect localhost, optional API sync/feedback, and external resource links. The major security blocker is unauthenticated legacy cloud data ownership. Backups are plaintext. Imported academic documents/journal may contain sensitive data; privacy copy and deletion lifecycle are required.

## 31. Risks

Highest: cloud authorization, personal-link exposure, inconsistent structured answer policy, clean-install ambiguity, unproven large-workspace upgrades. Medium: eager shell, monoliths, service-worker cache, accessibility gap, release metadata drift. Low: legacy repository clutter and incomplete routes if honestly badged.

## 32. Open decisions for Jafar

1. Authorize repository rename and redirect strategy. 2. Decide which personal links/assets may ship. 3. Keep cloud entirely disabled through Alpha or fund secure account architecture. 4. Provide/waive the historical parser spec. 5. Approve CSV candidate-preservation semantics. 6. Decide whether WIP routes stay visible. 7. Define Alpha cohort/origin and backup support policy.

## 33. Implementation sequence

1. Claude re-gates and commits Q2a alone. 2. Security/privacy containment: disable unsafe cloud and remove private defaults. 3. Manifest/CI repair and single-source release verification. 4. CSV/JSON trust-policy unification with regression corpus. 5. Accessibility scans/manual critical journeys. 6. Populated two-version update/restore/offline rehearsal. 7. Service-worker bounds and route/import performance. 8. Closed cohort feedback. 9. Only then resume Q2b and Course Central foundations.

## 34. Alpha checklist

See AXOM-PRE-ALPHA-RELEASE-CHECKLIST.md for measurable gates.

## 35. Final verdict

Personal daily use GREEN. Trusted friend YELLOW. Closed SGU Alpha YELLOW. Public pre-Alpha RED. Public Alpha RED. The repository has a credible, well-tested local-first core; its release risk comes from boundary truth—security, privacy, install/update guarantees, accessibility proof, and incomplete surfaces—not from absence of product functionality.

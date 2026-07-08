# ASK Detailed Report - Axom / Noctyrium Site Audit

Date: 2026-07-08  
Workspace: `/Users/jd/Developer/Noctyrium`  
Report file: `ASK_DETAILED_REPORT.md`  
Product surface audited: Axom web app, Noctyrium repository, Vercel API layer, optional native/Tauri shell, legacy Swift prototype, docs, scripts, assets, and local workspace inventory.

## 1. Executive Summary

The site is a local-first academic command system for medical school and pre-health work. The user-facing app now presents itself as **Axom**, while the repository, storage keys, several docs, the Vercel API package, the native shell, and some cache names still use **Noctyrium**. This split is intentional in some places because persistence keys are frozen for rebrand-safe migrations, but other places are stale and should be aligned before a clean public alpha.

The strongest working areas are:

- First-run onboarding that tailors the app by program and focus lane.
- A full glass-shell dashboard with sidebar navigation, guided tour, recovery messaging, command brief, data health, and configurable widgets.
- Course tracker with SGU starter structure, bulk import, mastery passes, Anki rounds, PQ simplified completion, and blueprint containers.
- Question Workspace with pasted question parsing, manual review, error logging, weak-topic surfacing, and question-to-Anki repair cards.
- Anki Lab with persistent card vault, review mode, AI draft/review gates, prompt studio, and export paths.
- Productivity loop with local-date rollover, study logs, Pomodoro, sessions, daily closeouts, reports, energy/readiness, and standup/journal flows.
- Local-first persistence through IndexedDB plus localStorage fallback, portable JSON backups, and optional Vercel/Postgres cloud sync.

The biggest gaps and risks are:

- Version/schema drift across files: web app says `0.2.0-alpha.1` and schema 28, `version.json` says schema 27, service worker cache says `v0.1.0-alpha.1`, API health defaults to schema 13 and version `0.1.0-alpha.1`, Tauri still says Noctyrium `0.1.0-alpha.1`.
- Backend auto-schema code is stale compared with SQL migrations. The migration SQL has PIN/session tables, but `lib/api/db.ts` auto-create code does not create all of that shape.
- Cloud sync and PIN auth exist, but are alpha-level and should not be treated as secure production auth.
- AI is intentionally conservative: local Ollama detection and demo/mock are present; cloud BYOK is a saved preference/config surface only until a secure server proxy exists.
- AnkiConnect is a local diagnostic path, not verified as working on the user's machine in this pass.
- Question image/PDF attachments are provenance only. There is no OCR/image extraction yet.
- Application Checker, Leaderboards, calendar, richer cloud AI, direct Drive integrations, deeper native SQLite sync, and admin dashboards are future or partial surfaces.
- Large monolithic bundle warning from production build: the app and bundled XLSX chunk exceed Vite's 500 kB warning threshold.

No live online market research was performed in this pass. The next stage should be a separate online research report on winning apps and patterns to emulate.

## 2. Verification Performed

Commands run locally:

- `npm --prefix web run typecheck` - passed.
- `npm run typecheck:api` - passed.
- `npm --prefix web run lint` - passed with 0 errors and 9 React hook dependency warnings.
- `npm --prefix web run test` - passed, 15 test files and 173 tests.
- `npm --prefix web run build` - passed, with Vite chunk-size warnings.
- `npm --prefix web run dev -- --host 127.0.0.1 --port 5173` - local app served successfully.
- Browser automation with Playwright fallback - loaded onboarding, completed setup, dismissed the guided tour through the actual UI, checked desktop and 390 px mobile rendering, and spot-checked major routes.

Rendered verification details:

- First screen on clean storage is the 5-step onboarding wizard.
- Completed onboarding with program SGU and user name `JD`.
- Main shell rendered after onboarding.
- Guided tour appears after onboarding and can be skipped into the Promise of Use flow.
- Dashboard, Course Tracker, Question Workspace, Anki Lab, Resources, Reports, Productivity, Journal, Integrations, About, and Help rendered with correct route titles and page content.
- 390 px mobile viewport had `scrollWidth` equal to viewport width, so no horizontal overflow was detected during that pass.
- Mobile menu button exists with aria-label `Menu`.
- No page errors were captured during the route pass.
- Development console logs were expected Vite and Vercel Analytics debug logs.
- One nonfatal request failure appeared: `GET https://www.jafardabbagh.com/ net::ERR_ABORTED`, likely from the About page's external preview iframe while route navigation moved on.

Lint warnings to clean up:

- `web/src/components/anki/CardReviewMode.tsx` - useMemo dependency for `cards`.
- `web/src/components/shell/GuidedTour.tsx` - missing `currentRoute` and `onNavigate` dependencies.
- `web/src/components/shell/OnboardingWizard.tsx` - missing `store.profile.onboarded` dependency.
- `web/src/pages/CourseTrackerPage.tsx` - useMemo dependency for `inScope`.
- `web/src/pages/DashboardPage.tsx` - missing `s` dependencies and `todayPlan`.
- `web/src/pages/JournalPage.tsx` - missing `s` dependency.
- `web/src/pages/ProductivityPage.tsx` - missing `s` dependency.

Production build output:

- `dist/index.html` - 0.81 kB, gzip 0.44 kB.
- `dist/assets/index-*.css` - 189.58 kB, gzip 34.45 kB.
- `dist/assets/xlsx.min-*.js` - 862.99 kB, gzip 317.90 kB.
- `dist/assets/index-*.js` - 874.74 kB, gzip 266.67 kB.

## 3. Product Identity And Current State

Visible product name:

- The web app title, manifest, and user-facing brand mostly say **Axom**.
- `web/src/lib/brand.ts` is the central visible brand config.
- The visible build label is `Axom Alpha 2 - v0.2.0-alpha.1` in the UI, though the code uses middle-dot separators.

Repository and legacy name:

- Repo folder is `Noctyrium`.
- Root package is `noctyrium-cloud`.
- Web package is `noctyrium-web`.
- Storage keys intentionally remain `noctyrium-*`.
- Tauri native shell still says product name Noctyrium.
- README/docs still mix Noctyrium and Axom.

Current product posture:

- This is best described as an alpha local-first academic operating system.
- It is not yet a secure production SaaS.
- It has a strong private-browser/offline-first base, with optional cloud APIs available when deployed with a database.
- It already contains a lot of real app behavior, not just a landing page.

## 4. Site Appearance And Layout

Overall look:

- Dark premium desktop app with a full-screen fixed shell.
- Background uses layered dark gradients, subtle grid texture, blurred colored light fields, and a glass-panel main shell.
- Shell is a large rounded glass container with sidebar on the left and content surface on the right.
- Typography uses system rounded fonts for UI and Poppins for brand assets.
- Primary visual palette: near-black ink, graphite, bone/ivory text, muted gold, cyan/blue accents, and grade colors for status.
- Card surfaces are translucent, bordered, shadowed, and layered with faint radial highlights.

First-run screen:

- Full-screen onboarding scrim.
- Wide centered onboarding card.
- Step dots: Welcome, Program, Focus, Targets, Ready.
- User enters name.
- Program cards include SGU, US MD, US DO, Pre-Med, MCAT, Undergrad, Nursing, PA.
- Focus lanes and SGU shared drive visibility are selected.
- Daily floor targets are set.
- Final ready screen summarizes program, focus, visible lanes, SGU drive setting, and daily floor.

Main shell:

- Sidebar top brand block: AXOM, build version, web label.
- Sidebar has a Customize control.
- Navigation is grouped into:
  - Control Surface
  - Academic Prep
  - Tools
  - Bottom/help/account area
- Persistent topbar shows current page title, subtitle, menu button on mobile, and refresh button.
- Main content scrolls inside `.surface-scroll`.
- Pages are constrained inside `.page` with max width around 1180 px.

Responsive behavior:

- Desktop shows the full sidebar.
- Mobile collapses navigation behind a menu button.
- A 390 px viewport test showed no horizontal overflow.

Visual caution:

- The codebase uses a lot of rounded glass cards and blurred decorative fields. It looks polished, but the style is heavy. Future feature work should protect scan speed and avoid adding more decorative containers than needed.

## 5. Route And Feature Breakdown

The router is hash-based. Route IDs are stored after `#`, for example `#dashboard` or `#tracker`.

| Route | Page | What it does | Main data touched | Status |
| --- | --- | --- | --- | --- |
| `dashboard` | Dashboard | Main command center with date, welcome, readiness, recovery, command brief, daily floor, widgets, progress, suggestions, data health, and recent activity. | Profile, tasks, journal, logs, courses, tracker, sessions, closeouts, energy, Anki cards, questions. | Working and browser-verified. |
| `courses` | Courses | Course/term overview, education-track structure, course modules. | Terms, courses, modules, education track. | Implemented. |
| `tracker` | Course Tracker | Mastery tree, import lectures, add course module, passes, Anki rounds, PQ simplified completion, yield flags, blueprint installs. | Terms, courses, modules, tracker items, blueprint nodes. | Working and browser-verified. |
| `questions` | Question Workspace | Paste/parse practice questions, review extraction, answer/reveal, log misses, track error patterns, create Anki repair cards. | Questions, attempts/responses, weak topics, Anki cards. | Working and browser-verified. Attachments are metadata/provenance only. |
| `methods` | Study Methods | Study-method library and guidance. | Study method definitions, possibly profile preferences. | Implemented guidance surface. |
| `anki` | Anki Lab | Card vault, review mode, AI generate tab, prompt studio, quality checks, export. | Anki cards, card reviews, prompts, questions. | Working and browser-verified. Direct Anki sync is separate/partial. |
| `resources` | Resources | Saved links, curated SGU drives, favorites, ratings, filters, import/add links. | Resource URLs, categories, ratings, tags, owner/source metadata. | Working and browser-verified. |
| `step` | USMLE Step 1 | Board-prep lane with blueprint/workbench style structure. | Board prep plan, blueprint installs, tracker data. | Implemented. |
| `step2` | Step 2 | Clinical/Step 2 lane. | Board prep plan. | Implemented shell/content. |
| `dedicated` | Dedicated | Dedicated study planning lane. | Board prep/day plans. | Implemented shell/content. |
| `shelf` | Shelf | Shelf exam lane. | Board prep plan. | Implemented shell/content. |
| `step3` | Step 3 | Step 3 lane. | Board prep plan. | Implemented shell/content. |
| `premed` | Pre-Med | Pre-health lane. | Premed plan, coursework, experiences. | Implemented. |
| `mcat` | MCAT | MCAT prep lane. | Board/pre-health plan. | Implemented. |
| `dat` | DAT | DAT prep lane. | Prep plan. | Planned/light surface. |
| `casper` | CASPer | CASPer prep lane. | Prep plan. | Planned/light surface. |
| `premed-log` | Premed Experience Log | Logs experiences, hours, categories, application evidence. | Premed experiences and scoring/export. | Implemented. |
| `activity` | Activity History | Shows recorded activity/history. | Productivity logs, sessions. | Implemented. |
| `reports` | Reports | 14/30 day stats, energy, performance, study trend, course coverage, tasks, standups, export. | Logs, tracker, tasks, journal, energy, performance. | Working and browser-verified. |
| `productivity` | Productivity | Study day controls, rollover review, quick logs, manual logging, Pomodoro, weekly intelligence. | Productivity trackers/logs, sessions, Pomodoro snapshot, tasks. | Working and browser-verified. |
| `tasks` | Tasks | Task capture and management. | Tasks, due dates, completions, carryover. | Implemented. |
| `habits` | Habits | Habit tracker. | Habits and habit entries. | Implemented with tests. |
| `journal` | Journal | Daily standups, blockers, intention follow-up, missed standup remediation, archive. | Journal entries, standups, tasks. | Working and browser-verified. |
| `integrations` | Integrations | AnkiConnect diagnostics plus integration status surfaces. | Integrations, local Anki diagnostics, sync settings. | Browser-verified. AnkiConnect not machine-verified. |
| `prompts` | Prompt Library | Stores reusable prompt templates. | Prompts. | Implemented. |
| `folders` | Hub Folders | Folder/link hub. | Folders, resources. | Implemented. |
| `about` | About | Product status, roadmap, feature statuses, live preview iframe. | Mostly read-only. | Browser-verified. External preview request can abort during navigation. |
| `help` | Help | Feature guide, tour replay, Anki guide, feedback path. | Profile tour flag, feedback if configured. | Browser-verified. |
| `appchecker` | Application Checker | Application-readiness surface. | Premed/application evidence. | Partial/early. |
| `leaderboards` | Leaderboards | Competitive/social surface. | Future public/peer data. | Not really active yet; should be treated as planned. |

## 6. Major Feature Details

### Dashboard

What it looks like:

- Full command center with a dated greeting and status badges.
- Readiness and energy stats are visible.
- Shows build version and schema version.
- Command Brief explains the next best move and recovery state.
- Recovery messaging appears when no study has been logged recently.
- Widget library can be customized.
- Uses a glass-card/stat-card visual language.

What it does:

- Pulls together data from almost every store slice.
- Suggests work from tracker items, plan state, and overdue signals.
- Surfaces recovery protocol when a gap is detected.
- Shows productivity trends, latest standup, schedule, local data health, resources, board blueprint, and other widgets depending on visibility.

Stored data:

- Dashboard itself mostly reads, but customization changes hidden widgets/nav preferences in profile.
- Recovery/closeout widgets write recovery plans and closeouts when used.

### Course Tracker

What it looks like:

- Left/mastery tree plus item list/details.
- Filter pills for scope and item type.
- Controls for import, add module, add item, blueprint installation, and help.
- Pass/Anki/yield controls on each tracker item.

What it does:

- Tracks lectures, DLAs, PQs, blueprint nodes, requirements, milestones, and evidence.
- Bulk import accepts plain text/CSV style lecture lists and tags.
- Passes move through mastery states.
- PQs can use simplified completed 1/2/3 flow.
- Blueprints can be installed and tracked separately.

Stored data:

- `terms`, `courses`, `modules`, `tracker`, `blueprintInstalls`, and related node/status fields.

### Question Workspace

What it looks like:

- Stat row for total questions, due review, incorrect, and weak topics.
- Intake panel for pasted question text or attachment.
- Work modes and disabled/future modes are visible.
- Detail modal supports answer, reveal, confidence, changed-answer tracking, error type, note, and repair card creation.

What it does:

- Parses pasted stems/options/answers/explanations.
- Requires review before saving.
- Logs attempts and misses.
- Turns mistakes into Anki cards.
- Runs local analysis for weak topics and faculty-style hints.

Stored data:

- Question stem, options, correct answer, explanation, topic/system, citation, attempts, confidence, error type, notes, attachment metadata, and linked card IDs.

Privacy note:

- Attached images/PDFs are not OCR-extracted by the app yet. Their presence/provenance can be tracked, but the content is not automatically read.

### Anki Lab

What it looks like:

- Header shows card count and tabs.
- Tabs: Card vault, Review, AI generate, Prompt studio.
- Card vault supports filters and export.
- Prompt studio lets the user choose topic/system, card style, note type, fields, and paste lecture material.

What it does:

- Stores cards locally.
- Runs in-app review and records reviews.
- Can create cards from question misses.
- AI generation is draft/review gated, not direct auto-write.
- Exports TSV/CSV compatible with Anki-style workflows.

Stored data:

- Card front/back/extra/source/tags/difficulty/quality flags/suspended state/review schedule/review history.

Status:

- In-app Anki Lab works.
- Direct AnkiConnect sync remains a local diagnostic path and should be confirmed per machine.

### Productivity

What it looks like:

- Study Day Controls at top.
- Quick log buttons for cards/minutes.
- Manual logger with tracker chips, minute/card inputs, presets, and activity types.
- Pomodoro and trend panels.

What it does:

- Logs study minutes, cards, activity type, notes, and tracker context.
- Runs local-date rollover.
- Supports reviewing yesterday and opening previous standup.
- Pomodoro reconstructs elapsed time from snapshots and can log focus sessions.

Stored data:

- `productivityTrackers`, logs, sessions, Pomodoro snapshot, active day key, rollover events, carried tasks.

### Journal

What it looks like:

- Journal Archive.
- New standup button.
- Missed standup remediation when applicable.

What it does:

- Stores daily standups: today, tomorrow, blockers, energy, rating.
- Can attach quick task completions.
- Warns when standups are missed.
- Promise of Use can create the first journal entry.

Stored data:

- Journal text, energy label, rating, date/time, linked promise entry, task references.

### Reports

What it looks like:

- Traceable stats for selected date range.
- 14d/30d toggle and export button.
- Cards for study, streak, consistency, floor adherence, readiness, performance, mastery, tasks, standups.

What it does:

- Computes effort and performance from local logs, tracker data, tasks, and journal.
- Exports report data.
- Warns when data is preliminary.

Stored data:

- Mostly reads. Export produces JSON from local state.

### Resources

What it looks like:

- Search/filter/sort controls.
- Source, owner, sort, category filters.
- Add/import links.
- Saved resource cards with ratings and tags.
- SGU shared drives can be shown depending on profile track.

What it does:

- Normalizes URLs.
- Classifies Google Drive, MEGA, Notion, and other resources.
- Tracks favorites, owner, category, rating, reason, source type, and audience.

Stored data:

- External URLs, labels, categories, tags, ratings, notes, favorites, source metadata.

### Integrations

What it looks like:

- Anki section first.
- Status copy explicitly says Anki sync is not considered working yet until user-confirmed.
- Local browser path explained.

What it does:

- Provides AnkiConnect diagnostics.
- Keeps integration work honest by requiring local confirmation.

Stored data:

- Integration config/status, possibly Anki local bridge details and sync metadata.

### Settings

Important tabs/panels:

- General profile/preferences.
- Account sync and backups.
- Data health.
- AI settings.
- Cloud backups.

What it stores:

- Main profile settings in the vault.
- Sync metadata in localStorage key `noctyrium-sync-meta`.
- AI settings in localStorage key `noctyrium-ai-settings`.
- Backup timestamp in localStorage key `noctyrium-last-backup-at`.

Security note:

- Cloud AI keys are intentionally not stored client-side.
- Cloud sync PIN session token can be stored in sync metadata if the user creates/logs into a PIN account. This is alpha and should be hardened before production.

## 7. Data Storage Map

### Browser Local Vault

Primary persistence:

- IndexedDB database: `noctyrium-local-vault`.
- Object store: `state`.
- Zustand persisted state key: `noctyrium-state`.
- Scoped copies: `noctyrium-state:user:<userId>`.
- Active user pointer: `noctyrium-state:active-user`.

Fallback:

- localStorage stores the same persisted state if IndexedDB is unavailable or while mirroring.

Observed after verification:

- `noctyrium-state`
- `noctyrium-state:user:jd`
- `noctyrium-state:active-user`

Frozen storage keys:

- `noctyrium-local-vault`
- `noctyrium-state`
- `noctyrium-pomodoro-session`
- `noctyrium-active-session`
- `noctyrium-ai-settings`
- `noctyrium-last-backup-at`
- `noctyrium-premigration-snapshot`
- `noctyrium-update-deferred`

### Main State Shape

The main persisted store includes:

- `profile` - name, userId, tagline, onboarding, tour flags, education track, focus subscriptions, daily targets, hidden widgets/nav, promise signature metadata, settings.
- `terms`, `courses`, `modules`, `tracker` - academic structure and completion state.
- `productivityTrackers` - tracker definitions and logs for Study, Coding, Gym, Class, Research, Writing, Language Learning, etc.
- `resources` - saved external links and curated resource data.
- `tasks` - open/done tasks, due dates, tags, carryover.
- `journal` - standups and reflection entries.
- `premedExperiences` - application/experience evidence.
- `prompts` - prompt templates.
- `folders` - folder/link hub.
- `logs` - activity and app events.
- `integrations` - local integration settings/status.
- `boardPrep` - exam prep lanes and plans.
- `dayPlans` - planned daily work.
- `blueprintInstalls` - installed exam/course blueprint containers and nodes.
- `activeDayKey`, `lastActiveLocalDate`, `lastTimezoneOffset` - rollover/day tracking.
- `dailyArchives`, `rolloverEvents` - day history and rollover audit data.
- `energyFactors` - confirmed readiness/energy factors.
- `habits`, `habitEntries` - habit tracking.
- `sessions` - active/completed study sessions.
- `closeouts` - daily closeout records.
- `recoveryPlans` - recovery protocol state.
- `questions` - practice question workspace.
- `ankiCards`, `cardReviews` - card vault and review history.
- `schemaVersion` - currently code seed/store uses 28.

### Sensitive Or Important Data Stored Locally

This app can store:

- User display name.
- Program and education status.
- Task descriptions and due dates.
- Journal/standup text.
- Blockers, energy, readiness notes.
- Study logs and productivity notes.
- Course names, module names, lecture names.
- External resource URLs.
- Practice question stems/options/answers/explanations.
- User guesses, confidence, error types, and notes.
- Anki card fronts/backs/extras/tags.
- AI settings and local endpoint choice.
- Optional cloud sync account/session metadata.

Recommendation:

- Treat browser storage and JSON backups as private academic data.
- Do not paste copyrighted bank questions into cloud services unless policy allows it.
- Keep cloud auth clearly labeled alpha until secure auth/session management is complete.

### Exported/Generated Data

The app can generate:

- Portable JSON backup/import files.
- Report JSON export.
- Anki TSV/CSV exports.
- Premed exports.
- Packaged web zips through scripts.
- Production `web/dist` build output.

### Optional Cloud Database

When `DATABASE_URL` is configured, Vercel APIs use Postgres/Neon/Supabase-style storage.

SQL migration tables:

- `users`
- `snapshots`
- `sync_change_log`
- `user_sessions`
- `ai_usage_logs`

Important columns/data:

- Users: UUID, display/normalized name, login timestamps, optional PIN hash/salt/iterations, failed login metadata, lockout.
- Snapshots: user ID, app version, schema version, JSONB app state, backup flag/label, device label.
- Sessions: token hash, device label, expiry.
- AI usage logs: feature, provider, model, tokens, success/error.

Backend API endpoints:

- `/api/user/login`
- `/api/user/register`
- `/api/user/pin-login`
- `/api/user/logout`
- `/api/user/:id`
- `/api/data/:userId`
- `/api/data/:userId/backup`
- `/api/data/:userId/backups`
- `/api/data/:userId/restore/:backupId`
- `/api/ai`
- `/api/feedback`
- `/api/health`

Cloud caveat:

- `db/migrations/*.sql` is more complete than the auto-create code in `lib/api/db.ts`. Run migrations or update `ensureSchema()` before relying on a fresh database.

### Native/Tauri Storage

Tauri shell exists but is experimental.

- Tauri config: `src-tauri/tauri.conf.json`.
- Rust entry: `src-tauri/src/lib.rs`.
- SQLite migration: `src-tauri/migrations/001_local_vault.sql`.
- Tables: `local_vault_snapshots`, `native_kv`.

Status:

- Native SQL snapshot helpers exist in `web/src/services/nativeSqlite.ts`.
- Native app metadata still says Noctyrium `0.1.0-alpha.1`.
- Treat native as experimental until version/brand/storage behavior is verified end to end.

## 8. What Is Verified Working

Verified by tests/build/browser:

- Web TypeScript compile.
- API TypeScript compile.
- ESLint has no errors.
- 173 Vitest tests pass.
- Production build succeeds.
- First-run onboarding renders and can be completed.
- Main shell renders.
- Guided tour can be skipped through UI.
- Dashboard renders.
- Tracker renders.
- Question Workspace renders.
- Anki Lab renders.
- Resources renders.
- Reports renders.
- Productivity renders.
- Journal renders.
- Integrations renders.
- About renders.
- Help renders.
- Mobile width 390 px rendered with menu button and no horizontal overflow.

Verified by code inspection:

- Local Vault storage mirrors IndexedDB and localStorage.
- Backup/import paths exist.
- State migration path exists through schema 28.
- Daily rollover watcher exists.
- Update watcher exists.
- Pomodoro snapshot/reconstruction exists.
- Recovery, command brief, energy, performance, sessions, questions, Anki, habits, exam plan, and tracker logic have associated tests or domain modules.
- Vercel API has rate limiting, CORS, body-size handling, UUID validation, and no-store cache headers.

## 9. What Is Being Worked On Or Partial

Partial/alpha:

- Cloud sync account flow and PIN sessions.
- Cloud backup restore and conflict decisions.
- AI provider abstraction.
- Local AI/Ollama detection.
- AI card generation review flow.
- AnkiConnect local bridge.
- Question faculty-style analyzer.
- Application Checker.
- Leaderboards.
- Native/Tauri packaging.
- Admin visibility and feedback workflows.
- Service worker/update channel polish.

Explicitly not done or not verified:

- Production-grade authentication.
- Production-grade encrypted sync.
- Direct Anki auto-sync verified on this machine.
- OCR for question screenshots/PDFs.
- Calendar integration.
- Google Drive read/write integration.
- Secure server-side cloud AI proxy.
- Full native SQLite vault replacement.
- Online competitor/winning-app research for the next stage.

## 10. Risks And Cleanup List

Highest priority:

1. Align versions and schema numbers.
   - `web/src/lib/seed.ts` uses schema 28.
   - `web/public/version.json` says schema 27.
   - `api/health.ts` defaults schema 13 and version `0.1.0-alpha.1`.
   - `web/public/sw.js` cache name still says `noctyrium-v0.1.0-alpha.1`.
   - `src-tauri/tauri.conf.json` and `Cargo.toml` still say Noctyrium `0.1.0-alpha.1`.

2. Fix database auto-schema drift.
   - `db/migrations/001_initial.sql` and `002_pin_auth.sql` include PIN/session structures.
   - `lib/api/db.ts` auto-create code does not fully match the migrations.
   - Fresh databases may fail PIN/session queries unless migrations run.

3. Decide how public the alpha is.
   - Current README says name login is not secure auth.
   - PIN auth exists but should be labeled alpha.
   - Cloud snapshots may contain private academic/journal/question content.

4. Clean hook warnings.
   - The lint warnings are not breaking the build, but they can hide stale memo/effect bugs.

5. Code-split the app.
   - Production build is successful but has large chunks.
   - XLSX is a large bundle; lazy-load exports/imports where possible.

Medium priority:

- Update docs to consistently use Axom where appropriate and Noctyrium only where historical/storage-relevant.
- Refresh service worker cache/version strategy.
- Add browser/e2e smoke tests for onboarding, route navigation, and major data flows.
- Add explicit data privacy/export docs.
- Clarify what is sample seed data versus user-created data.
- Add a visible "last backup" indicator in more surfaces if not already sufficiently prominent.
- Verify route behavior with guided tour active and after Promise of Use.
- Add a protected admin/status page if feedback/admin env vars are used.

Lower priority:

- Remove or archive legacy generated files from the main working tree.
- Decide whether external About iframe belongs in app or docs.
- Revisit decorative density in CSS as the product becomes more daily-use than demo.
- Add stronger accessibility pass: focus traps, aria labels, color contrast, reduced motion.

## 11. Future Integration Pathways

Near-term pathways:

1. Version and schema cleanup release.
   - Make all version files agree.
   - Update service worker cache.
   - Add a single release checklist.

2. Data safety release.
   - Add visible backup age/status.
   - Add export reminder before risky operations.
   - Document what is stored locally/cloud.
   - Add cloud migration check that runs before sync.

3. Question-to-Anki flywheel.
   - Improve parser.
   - Add OCR/manual screenshot workflow.
   - Add missed-question dashboards.
   - Improve repair-card templates.

4. AnkiConnect real integration.
   - Verify local connection.
   - Confirm deck/note type mapping.
   - Add dry-run preview.
   - Add sync report.

5. AI local-first workflow.
   - Make Ollama setup smoother.
   - Keep all generated output in review.
   - Add local prompt templates per page.
   - Only add cloud proxy after secrets and user consent are handled server-side.

6. Calendar and schedule.
   - Convert day plans and sessions into calendar blocks.
   - Add import/export with standard calendar formats first.
   - Then consider Google Calendar.

7. Premed/application pathway.
   - Mature Application Checker.
   - Connect experiences, evidence, hours, reflections, and application milestones.

8. Research and presentation stage.
   - Live-research winning products and patterns.
   - Build a comparison matrix.
   - Extract emulatable flows.
   - Present recommendations as a roadmap and design brief.

Suggested online research targets:

- Anki, AnkiHub, AnKing.
- UWorld-style question banks, Amboss, Osmosis.
- RemNote, Quizlet, StudySmarter, Cram.
- Notion, Obsidian.
- Motion, Reclaim, Sunsama, Todoist.
- Forest, Toggl, Session.
- Readwise.
- ChatGPT, Claude, Gemini study workflows.

Important: these targets are seed targets from existing project docs and product context. They should be live-researched next before claiming current market status or "winning" ranking.

## 12. Workspace Inventory

Tracked files: 225.  
Approximate selected app/code line count from tracked text files: over 32k lines plus CSS, lockfiles, legacy Swift, and generated metadata.  
Untracked/local workspace files after excluding `.git`, `node_modules`, `.build`, `web/dist`, and `src-tauri/target`: about 7,163 files.

Large non-app local areas:

- `.vscode` - 5,690 files.
- `01 BPM 501` - 482 files.
- `09 Admin` - 351 files.
- `01 BPM 500` - 217 files.
- `00 Inbox - Need Work Look Over` - 162 files.
- `web` - 172 files in source/public/config after exclusions.

Common local file types after exclusions:

- 2,521 PNG.
- 1,202 MP3.
- 1,179 GIF.
- 802 PDF.
- 339 Python files.
- 209 Python cache files.
- 113 TXT.
- 91 JSON.
- 91 DOCX.
- 80 TS.
- 62 TSX.
- 56 Markdown.

Interpretation:

- The actual app is the tracked web/API/Tauri/Swift/docs/script source.
- Many local folders appear to be study materials, admin files, media, and generated local artifacts.
- This report does not extract or repeat private PDF/DOCX/audio contents. It inventories their presence only.

## 13. File-By-File Inventory

### Root Docs, Config, And Metadata

| Lines | File | Purpose |
| ---: | --- | --- |
| 14 | `.env.example` | Example env vars for database, feedback, admin, and cloud/API configuration. |
| 9 | `.gitattributes` | Git file handling rules. |
| 55 | `.gitignore` | Ignore rules for dependencies, builds, local artifacts, and secrets. |
| 22 | `.vercelignore` | Files excluded from Vercel deployment. |
| 227 | `CHANGELOG.md` | Release history, especially alpha 0.2.0 academic loop/features. |
| 127 | `IMPLEMENTATION_AUDIT.md` | Prior audit of implemented features, gaps, risks, and backlog. |
| 89 | `PRODUCT_RESEARCH_AND_OPPORTUNITIES.md` | Existing product pattern research and opportunity ranking. |
| 15 | `Package.swift` | Swift Package entry for legacy Swift prototype. |
| 160 | `README.md` | Main project overview, stack, install, deploy, cloud, and local vault notes. |
| binary | `Resources/Noctyrium-Logo.png` | Legacy logo image. |
| binary | `Resources/Noctyrium.icns` | Legacy macOS icon. |
| 0 | `blueprints` | Empty tracked placeholder file. |
| 1 | `current_version.txt` | Current version text marker. |
| 4028 | `overview.json` | Large structured overview/export metadata. |
| 6 | `overview_architecture.puml` | PlantUML architecture sketch. |
| 292 | `package-lock.json` | Root npm lockfile. |
| 24 | `package.json` | Root scripts/dependencies for Vercel API, web build, Tauri, typecheck. |
| 21 | `vercel.json` | Root Vercel build and API rewrite configuration. |

### Research And Asset Files

| Lines | File | Purpose |
| ---: | --- | --- |
| binary | `axom/app icon.png` | Axom app icon. |
| binary | `axom/axom 1-3.png` | Axom brand/design asset. |
| binary | `axom/axom 4-6.png` | Axom brand/design asset. |
| binary | `axom/axom lettering.16.43.png` | Axom lettering asset. |
| binary | `axom/axom overview.png` | Axom overview visual. |
| binary | `blue-prints/Blue print study god file v1.pdf` | Blueprint/reference PDF. |
| binary | `blue-prints/Science Topic Outline For The MCAT Exam - MCAT Content.pdf` | MCAT content outline PDF. |
| binary | `blue-prints/USMLE_Content_Outline_0.pdf` | USMLE content outline PDF. |

### API Layer

| Lines | File | Purpose |
| ---: | --- | --- |
| 23 | `api/ai.ts` | Vercel endpoint for AI feature requests with rate limiting. |
| 70 | `api/data.ts` | Vercel endpoint for snapshots, backups, restore, and cloud data. |
| 45 | `api/feedback.ts` | Feedback endpoint, Resend integration when configured. |
| 13 | `api/health.ts` | Health endpoint. Currently stale version/schema values. |
| 49 | `api/user.ts` | User login/register/PIN/logout/user lookup endpoint. |

### Backend Helpers And Database

| Lines | File | Purpose |
| ---: | --- | --- |
| 84 | `db/migrations/001_initial.sql` | Main Postgres schema for users, snapshots, sessions, change log, AI logs. |
| 21 | `db/migrations/002_pin_auth.sql` | Migration for PIN auth fields/session table on existing alpha DBs. |
| 281 | `lib/api/aiService.ts` | Server-side AI feature handlers/provider abstraction. |
| 386 | `lib/api/dataService.ts` | Postgres data functions: users, PIN hashing, sessions, snapshots, backups. |
| 103 | `lib/api/db.ts` | Database connection and auto-schema helper. Needs sync with migrations. |
| 171 | `lib/api/http.ts` | HTTP utilities, CORS, rate limiting, JSON parsing, validation, errors. |

### Docs

| Lines | File | Purpose |
| ---: | --- | --- |
| 148 | `docs/ALPHA-RELEASE.md` | Alpha deployment/release checklist and Vercel/env notes. |
| 16 | `docs/FIELD-NOTES.md` | Short project notes. |
| 56 | `docs/PRODUCTIVITY-ARCHITECTURE.md` | Historical productivity architecture notes. |
| 55 | `docs/UPDATE-POLICY.md` | Hosted/download/native update model and data separation. |

### Scripts

| Lines | File | Purpose |
| ---: | --- | --- |
| 87 | `scripts/build_app.sh` | Build helper script. |
| 108 | `scripts/dashboard_stats.sh` | Dashboard/stat helper script. |
| 160 | `scripts/legacy/build_noctyrium_app.original.sh` | Legacy build script. |
| 108 | `scripts/legacy/dashboard_stats.original.sh` | Legacy stats script. |
| 27 | `scripts/legacy/run_medical_hub.original.sh` | Legacy Swift run script. |
| 29 | `scripts/package.sh` | Packaging helper. |

### Legacy Swift Prototype

| Lines | File | Purpose |
| ---: | --- | --- |
| 4340 | `Sources/Noctyrium/MedicalSchoolHub.swift` | Large legacy Swift command-line/early app prototype. Historical, not the current web UI source of truth. |

### Tauri Native Shell

| Lines | File | Purpose |
| ---: | --- | --- |
| 5597 | `src-tauri/Cargo.lock` | Rust dependency lockfile. |
| 22 | `src-tauri/Cargo.toml` | Tauri Rust package manifest. Still named Noctyrium `0.1.0-alpha.1`. |
| 3 | `src-tauri/build.rs` | Tauri build script. |
| 11 | `src-tauri/capabilities/default.json` | Tauri capability permissions. |
| binary | `src-tauri/icons/icon.png` | Native app icon. |
| 21 | `src-tauri/migrations/001_local_vault.sql` | SQLite native vault migration. |
| 20 | `src-tauri/src/lib.rs` | Tauri runtime setup and plugins. |
| 3 | `src-tauri/src/main.rs` | Native main entry. |
| 38 | `src-tauri/tauri.conf.json` | Tauri app/window/build configuration. |

### Web Config, Public, And Packaging

| Lines | File | Purpose |
| ---: | --- | --- |
| 11 | `web/.gitignore` | Web-local ignore rules. |
| 6 | `web/.vercelignore` | Web-local Vercel ignore rules. |
| 245 | `web/README.md` | Web app overview, features, commands, packaging, Tauri notes. |
| 51 | `web/embed-example.html` | Example iframe/embed host for packaged web app. |
| 45 | `web/eslint.config.js` | ESLint config. |
| 17 | `web/index.html` | Vite HTML entry, title/meta. |
| 139 | `web/native/NoctyriumWebApp.swift` | Native wrapper/prototype Swift file for web app. |
| 4413 | `web/package-lock.json` | Web npm dependency lockfile. |
| 46 | `web/package.json` | Web dependencies/scripts. Vite, React, Zustand, tests, build. |
| binary | `web/public/anki-guide/add-note-types.png` | Anki guide screenshot. |
| binary | `web/public/anki-guide/card-editor.png` | Anki guide screenshot. |
| binary | `web/public/anki-guide/fields.png` | Anki guide screenshot. |
| binary | `web/public/anki-guide/importing.png` | Anki guide screenshot. |
| binary | `web/public/anki-guide/jd-anki-builds.png` | Anki guide screenshot. |
| binary | `web/public/anki-guide/manage-note-types.png` | Anki guide screenshot. |
| binary | `web/public/anki-guide/my-anki-settings.pdf` | Anki settings reference PDF. |
| binary | `web/public/anki-guide/open-anki.png` | Anki guide screenshot. |
| binary | `web/public/apple-touch-icon.png` | PWA/apple touch icon. |
| 32 | `web/public/fonts/poppins-500-latin.woff2` | Poppins font asset. |
| binary | `web/public/icon-192.png` | PWA icon. |
| binary | `web/public/icon-512.png` | PWA icon. |
| 14 | `web/public/manifest.webmanifest` | PWA manifest. |
| 33 | `web/public/sw.js` | Service worker. Cache version is stale. |
| 12 | `web/public/version.json` | Update/version metadata. Schema version is stale vs code. |
| 116 | `web/scripts/package-web.sh` | Web package script. |
| 21 | `web/tsconfig.json` | Web TypeScript config. |
| 7 | `web/vercel.json` | Web Vercel config. |
| 14 | `web/vite.config.ts` | Vite config with React plugin and relative base. |

### Web Entry And App Shell

| Lines | File | Purpose |
| ---: | --- | --- |
| 193 | `web/src/App.tsx` | Root React app, hash router, shell, watchers, settings, tour, page registry. |
| 25 | `web/src/main.tsx` | React entry, styles, analytics, service worker registration. |
| 602 | `web/src/components/shell/AccountSyncPanel.tsx` | Cloud sync/account/PIN/backup UI. |
| 142 | `web/src/components/shell/AiSettingsPanel.tsx` | AI settings, Ollama detection, cloud BYOK placeholder. |
| 50 | `web/src/components/shell/CloudBackupPanel.tsx` | Cloud backup list/control panel. |
| 61 | `web/src/components/shell/DailyRolloverWatcher.tsx` | Local day rollover watcher/toasts. |
| 104 | `web/src/components/shell/DataHealthPanel.tsx` | Local data health/backup status panel. |
| 164 | `web/src/components/shell/GuidedTour.tsx` | Post-onboarding guided tour. |
| 289 | `web/src/components/shell/OnboardingWizard.tsx` | First-run program/focus/target setup. |
| 119 | `web/src/components/shell/PromiseCutscene.tsx` | Promise of Use reveal/sign/defer flow. |
| 478 | `web/src/components/shell/SettingsModal.tsx` | Main settings modal and tabs. |
| 180 | `web/src/components/shell/Sidebar.tsx` | Sidebar navigation and account panel. |
| 38 | `web/src/components/shell/StandupWatcher.tsx` | Missed standup warning watcher. |
| 45 | `web/src/components/shell/Toaster.tsx` | Toast renderer. |
| 28 | `web/src/components/shell/TopBar.tsx` | Page title/subtitle/menu/refresh bar. |
| 77 | `web/src/components/shell/UpdateAvailableWatcher.tsx` | Version/update watcher. |
| 64 | `web/src/components/shell/nav.ts` | Navigation item definitions and groups. |

### Web Feature Components

| Lines | File | Purpose |
| ---: | --- | --- |
| 179 | `web/src/components/anki/AiCardGenerator.tsx` | AI card generation UI. |
| 88 | `web/src/components/anki/CardReviewMode.tsx` | In-app card review mode. |
| 180 | `web/src/components/anki/CardVault.tsx` | Card vault listing, filters, exports. |
| 121 | `web/src/components/blueprints/BlueprintCommand.tsx` | Blueprint command/control component. |
| 529 | `web/src/components/blueprints/BlueprintWorkbench.tsx` | Blueprint editing/workbench UI. |
| 175 | `web/src/components/blueprints/PremedExperiencePanel.tsx` | Premed experience tracking panel. |
| 87 | `web/src/components/brief/CloseoutModal.tsx` | Daily closeout modal. |
| 155 | `web/src/components/brief/CommandBrief.tsx` | Command brief display. |
| 147 | `web/src/components/brief/RecoveryPanel.tsx` | Recovery plan/status panel. |
| 264 | `web/src/components/integrations/AnkiConnectPanel.tsx` | Local AnkiConnect diagnostics and status. |
| 169 | `web/src/components/productivity/Pomodoro.tsx` | Pomodoro UI. |
| 38 | `web/src/components/productivity/PomodoroFx.tsx` | Pomodoro side effects/audio/notifications. |
| 173 | `web/src/components/questions/QuestionDetailModal.tsx` | Question answer/review/error/repair card modal. |
| 185 | `web/src/components/questions/QuestionIntake.tsx` | Question paste/parse/attachment intake. |
| 199 | `web/src/components/session/SessionOverlay.tsx` | Active study session overlay. |

### Web UI Components

| Lines | File | Purpose |
| ---: | --- | --- |
| 33 | `web/src/components/ui/BrandMark.tsx` | Brand mark component. |
| 33 | `web/src/components/ui/Heatmap.tsx` | Heatmap visualization. |
| 64 | `web/src/components/ui/Modal.tsx` | Modal and form field primitives. |
| 33 | `web/src/components/ui/Ring.tsx` | Ring/progress visualization. |
| 36 | `web/src/components/ui/StatCard.tsx` | Stat card primitive. |
| 126 | `web/src/components/ui/motion.tsx` | Motion/animated UI primitives. |
| 84 | `web/src/components/ui/primitives.tsx` | Buttons, tags, ghost buttons, basic controls. |

### Web Domain Logic And Store

| Lines | File | Purpose |
| ---: | --- | --- |
| 72 | `web/src/lib/activityExport.ts` | Activity export logic. |
| 105 | `web/src/lib/ai/ai.test.ts` | AI module tests. |
| 86 | `web/src/lib/ai/index.ts` | AI module exports/orchestration. |
| 53 | `web/src/lib/ai/mock.ts` | Mock/demo AI provider. |
| 74 | `web/src/lib/ai/ollama.ts` | Ollama local provider detection/calls. |
| 125 | `web/src/lib/ai/schemas.ts` | AI schema definitions. |
| 55 | `web/src/lib/ai/settings.ts` | AI localStorage settings. |
| 133 | `web/src/lib/ai/types.ts` | AI type definitions. |
| 112 | `web/src/lib/ankiCards.test.ts` | Anki card tests. |
| 257 | `web/src/lib/ankiCards.ts` | Card model, quality, scheduling helpers. |
| 230 | `web/src/lib/ankiConnect.ts` | AnkiConnect local bridge client/helpers. |
| 269 | `web/src/lib/backup.ts` | Portable backup/export/import/merge logic. |
| 2273 | `web/src/lib/blueprintCatalog.ts` | Large blueprint catalog data. |
| 113 | `web/src/lib/blueprintInstall.ts` | Blueprint install helpers. |
| 29 | `web/src/lib/blueprintRoutes.ts` | Blueprint route helpers. |
| 293 | `web/src/lib/blueprints.ts` | Blueprint domain logic. |
| 27 | `web/src/lib/brand.test.ts` | Brand/version tests. |
| 66 | `web/src/lib/brand.ts` | Product name, version, storage keys. |
| 34 | `web/src/lib/closeout.ts` | Daily closeout helpers. |
| 163 | `web/src/lib/commandBrief.test.ts` | Command brief tests. |
| 411 | `web/src/lib/commandBrief.ts` | Command brief/suggestions/recovery inputs. |
| 122 | `web/src/lib/dailyRollover.test.ts` | Daily rollover tests. |
| 148 | `web/src/lib/dailyRollover.ts` | Local day rollover logic. |
| 8 | `web/src/lib/device.ts` | Device helper. |
| 110 | `web/src/lib/energy.test.ts` | Energy/readiness tests. |
| 427 | `web/src/lib/energy.ts` | Energy/readiness scoring. |
| 207 | `web/src/lib/examPlan.test.ts` | Exam plan tests. |
| 258 | `web/src/lib/examPlan.ts` | Exam/board planning logic. |
| 205 | `web/src/lib/experience.ts` | Focus lanes, education tracks, default targets. |
| 148 | `web/src/lib/habits.test.ts` | Habit tests. |
| 180 | `web/src/lib/habits.ts` | Habit tracker logic. |
| 23 | `web/src/lib/icons.tsx` | Icon mappings/helpers. |
| 95 | `web/src/lib/journal.ts` | Standup/journal date and remediation helpers. |
| 120 | `web/src/lib/localVault.ts` | IndexedDB/localStorage vault storage adapter. |
| 117 | `web/src/lib/motion.test.ts` | Motion tests. |
| 127 | `web/src/lib/motion.ts` | Motion state/helpers. |
| 79 | `web/src/lib/pathUtils.ts` | Path utility helpers. |
| 186 | `web/src/lib/performance.ts` | Performance scoring. |
| 399 | `web/src/lib/pomodoro.ts` | Pomodoro state, persistence, logging. |
| 133 | `web/src/lib/premedExport.ts` | Premed export logic. |
| 150 | `web/src/lib/premedScoring.ts` | Premed scoring helpers. |
| 103 | `web/src/lib/questionParse.ts` | Pasted question parser. |
| 143 | `web/src/lib/questions.test.ts` | Question workspace tests. |
| 436 | `web/src/lib/questions.ts` | Question model, review, weak-topic, error logic. |
| 95 | `web/src/lib/recovery.test.ts` | Recovery tests. |
| 191 | `web/src/lib/recovery.ts` | Recovery protocol logic. |
| 121 | `web/src/lib/resourceUtils.ts` | Resource URL/source/category normalization. |
| 123 | `web/src/lib/scoring.ts` | Study scoring/streak/day usefulness. |
| 274 | `web/src/lib/seed.ts` | Seed state and schema version 28. |
| 108 | `web/src/lib/sessions.test.ts` | Session tests. |
| 151 | `web/src/lib/sessions.ts` | Study session helpers. |
| 1799 | `web/src/lib/store.ts` | Central Zustand store, actions, persistence, migrations. |
| 96 | `web/src/lib/storeMigrations.test.ts` | Store migration tests. |
| 261 | `web/src/lib/studyMethods.ts` | Study method definitions/guidance. |
| 134 | `web/src/lib/taskAutofill.test.ts` | Task autofill tests. |
| 176 | `web/src/lib/taskAutofill.ts` | Task suggestion/autofill logic. |
| 46 | `web/src/lib/toast.ts` | Toast store/helpers. |
| 190 | `web/src/lib/tracker.ts` | Tracker/domain helpers. |
| 394 | `web/src/lib/tracks.ts` | Education track definitions. |
| 592 | `web/src/lib/types.ts` | Core app types and state shape. |
| 42 | `web/src/lib/uiStore.ts` | UI-level store. |
| 33 | `web/src/lib/useInView.ts` | In-view hook. |
| 13 | `web/src/lib/userIdentity.ts` | User ID derivation helper. |

### Web Pages

| Lines | File | Purpose |
| ---: | --- | --- |
| 127 | `web/src/pages/AboutPage.tsx` | Product overview/status/about/live preview. |
| 80 | `web/src/pages/ActivityHistoryPage.tsx` | Activity history page. |
| 597 | `web/src/pages/AnkiLabPage.tsx` | Anki Lab page. |
| 107 | `web/src/pages/ApplicationCheckerPage.tsx` | Application checker page. |
| 1365 | `web/src/pages/CourseTrackerPage.tsx` | Course tracker page. |
| 188 | `web/src/pages/CoursesPage.tsx` | Course overview page. |
| 1651 | `web/src/pages/DashboardPage.tsx` | Main dashboard. |
| 34 | `web/src/pages/HabitTrackerPage.test.tsx` | Habit page test. |
| 266 | `web/src/pages/HabitTrackerPage.tsx` | Habit tracker page. |
| 324 | `web/src/pages/HelpPage.tsx` | Help, feature guide, tour replay, Anki guide, feedback. |
| 174 | `web/src/pages/HubFoldersPage.tsx` | Folder/link hub page. |
| 77 | `web/src/pages/IntegrationsPage.tsx` | Integrations page. |
| 205 | `web/src/pages/JournalPage.tsx` | Journal/standup page. |
| 160 | `web/src/pages/LeaderboardsPage.tsx` | Leaderboards/future social page. |
| 128 | `web/src/pages/PremedExperienceLogPage.tsx` | Premed experience log page. |
| 532 | `web/src/pages/ProductivityPage.tsx` | Productivity/study log/Pomodoro page. |
| 94 | `web/src/pages/PromptLibraryPage.tsx` | Prompt library page. |
| 139 | `web/src/pages/QuestionWorkspacePage.tsx` | Practice question workspace page. |
| 330 | `web/src/pages/ReportsPage.tsx` | Reports/statistics page. |
| 339 | `web/src/pages/ResourcesPage.tsx` | Resources/link library page. |
| 16 | `web/src/pages/StepPage.tsx` | Generic prep-lane wrapper page. |
| 127 | `web/src/pages/StudyMethodsPage.tsx` | Study methods page. |
| 179 | `web/src/pages/TasksPage.tsx` | Tasks page. |

### Web Services And Types

| Lines | File | Purpose |
| ---: | --- | --- |
| 24 | `web/src/services/aiClient.ts` | Hosted AI API client. Disabled on localhost/file runtimes. |
| 58 | `web/src/services/nativeSqlite.ts` | Tauri SQLite snapshot helper. |
| 45 | `web/src/services/storageService.ts` | Sync metadata and portable-state fingerprinting. |
| 120 | `web/src/services/syncClient.ts` | Client for cloud user/data/backup/health endpoints. |
| 21 | `web/src/types/ai.ts` | AI API request/response types. |
| 73 | `web/src/types/sync.ts` | Cloud sync/user/session/snapshot types. |
| 1 | `web/src/vite-env.d.ts` | Vite type reference. |

### Web Styles

| Lines | File | Purpose |
| ---: | --- | --- |
| 1027 | `web/src/styles/components.css` | Shared UI/card/form/stat/component styling. |
| 206 | `web/src/styles/global.css` | Base layout, backdrop, app shell, responsive foundations. |
| 272 | `web/src/styles/loop.css` | Command brief, sessions, recovery, questions, Anki loop styling. |
| 178 | `web/src/styles/motion.css` | Animated UI effects. |
| 4451 | `web/src/styles/pages.css` | Page-specific styling. Largest style file. |
| 194 | `web/src/styles/shell.css` | Sidebar/topbar/navigation shell styling. |
| 65 | `web/src/styles/theme.css` | Color tokens, radii, shadows, typography variables. |
| 224 | `web/src/styles/tour.css` | Guided tour and Promise of Use styling. |

## 14. Recommended Next Work Plan

Best immediate path:

1. Fix version/schema drift.
2. Fix backend auto-schema drift or require migrations explicitly.
3. Clean React hook warnings.
4. Add a smoke e2e test for onboarding, tour dismissal, and route rendering.
5. Add a privacy/data inventory page in-app or docs.
6. Begin the online winning-app research phase and convert it into a product roadmap.

Suggested deliverables for the next research stage:

- `WINNING_APP_RESEARCH_REPORT.md`
- Competitive matrix: app, category, core loop, what users love, monetization, UX pattern to emulate, risk to avoid.
- Axom opportunity map: what to copy, what to improve, what to avoid.
- Feature priority board: must build next, nice later, do not build.
- Presentation/deck outline for showing the product direction.


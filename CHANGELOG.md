# Noctyrium Changelog

## 0.1.0-alpha.1 — 2026-06-15

Public Alpha 1 release candidate: packaging, release flow, and beta-feedback polish.

### Release & packaging

- Verified `npm install`, `npm run build`, and `npm --prefix web run package` from a clean tree.
- `npm --prefix web run package` produces `web/Noctyrium-web-v0.1.0-alpha.1.zip` (static) and, on
  macOS with `swiftc`, `web/Noctyrium-mac-v0.1.0-alpha.1.zip` (double-clickable wrapper). Both are
  gitignored and never committed.
- Added [`docs/ALPHA-RELEASE.md`](docs/ALPHA-RELEASE.md) (Vercel deploy, packaging, GitHub Release flow)
  and [`docs/UPDATE-POLICY.md`](docs/UPDATE-POLICY.md) (web auto-updates via Vercel; Mac wrapper is
  manual for Alpha 1; data is separate from app code; future Tauri v2 updater).
- Added an in-app Alpha notice on the Dashboard: the web version updates automatically; the
  downloadable Mac app requires downloading the latest release. No fake auto-update added.

### Beta-feedback polish

- **Anki Lab generator fixed:** filters slide boilerplate (copyright, objective codes, citations,
  URLs, emails, headings), clozes the *answer* (not the subject/first words), de-dupes, scores cards
  by quality, warns on likely system-tag mismatch, allows local draft edit/delete, and exports
  separated Basic/Cloze `.csv` files plus review `.txt` (TSV). Added a card-style / custom-note-type
  guide that links to the MADCOW/Claudfather Anki build drive.
- **Course Tracker import:** the destination field now autocompletes existing folders (datalist) and
  flags new-vs-existing; path normalization trims/dedupes spacing/case so correct paths stop spawning
  duplicate folders.
- **Course Tracker:** delete an entire group/directory with confirmation, including move-contained-items
  or delete-contained-items choices.
- **Drives:** curated permanent set (My Drive + MADCOW = 10/10, SillyGoose Wiki, SGU shared, MEGA)
  with MADCOW and Claudfather Auto rated 10/10, personal usefulness rating badges + hover reasons,
  URL normalization, source/personal/category filters, and add/remove/re-rate in-app.
- **Guided tour + Promise:** first-launch personalization flows into a spotlight tour and a versioned
  Promise of Use journal cutscene; replay remains available under Hub/Folders.
- **Boards page:** Step/Shelf/MCAT/CBSE work now has a board-style blueprint log (domain, mode,
  minutes, questions, correct, confidence, missed-theme notes) separate from lecture/DLA/PQ pass
  tracking.
- **Help feedback:** Hub/Folders now includes an Alpha mailto feedback form for bugs, features,
  confusion, and praise addressed to `jdabbagh@sgu.edu`.
- **Native shell scaffold:** added experimental Tauri v2 + SQLite wiring in `src-tauri/`, with SQL
  migration, permissions, scripts, and a Settings-only native snapshot action for future desktop work.
- **Logo** added to the sidebar lockup; **±10 steppers** for minutes/cards in the Productivity log.

## Alpha 1 — 2026-06-14

First clean web/backend alpha candidate.

- Added optional Vercel serverless backend routes for name-only users, JSON snapshot sync,
  cloud backups, restore, health checks, and simple progress save/load by account name.
- Added Postgres schema/migration for users, snapshots, sync change logs, and AI usage logs.
- Added mock AI endpoint scaffolding for next move, Anki generation, Step planning, weak-area
  analysis, and daily reports.
- Integrated the frontend Settings sync panel with backend health, progress save/load,
  manual backups, restore, conflict prompts, and optional auto-sync.
- Refreshed Alpha 1 seed data so the app opens with SGU course shells and only a few
  example Lecture/DLA/PQ tracker rows.
- Cleaned the repository so personal study folders, old packages, Docker leftovers,
  build output, caches, and generated zip files are not part of the commit.
- Upgraded the web build to Vite 8 / React plugin 6 and verified build/typecheck/audit.

## web v0.5.0 — 2026-06-13

Feature expansion of the web app (informed by research into how med students actually use Anki).

- **Lecture & DLA tracker:** tracker items now have a first-class `kind` (Lecture / DLA / PQ / Lab /
  Reading) with filtering; per-folder lecture/DLA/mature counts.
- **Bulk import lectures by name:** paste a whole list → one tracker row per line (strips leading
  numbering), choose destination path + kind. The headline tracker feature.
- **Anki Lab** (new page): builds an AI prompt from lecture/DLA/slide text tuned for Anki import
  (cloze/Q&A/image-occlusion), saves to the Prompt Library, and exports a tab-separated file you
  import into Anki. Prompt-based today (no backend); live one-click generation flagged on the roadmap.
- **Resources** (new page): save + bulk-import hyperlinks (STEP 1 prep, references, decks, tools);
  categorized, searchable, favoritable, with favicons. Seeded with AnKing, Boards & Beyond, Sketchy,
  UpToDate, AMBOSS, First Aid.
- **Anti-overload design:** daily card/minute "good enough" targets + study streak on the Dashboard,
  with a nudge to *stop* at target (the #1 cause of Anki burnout is grinding 500 cards/day). Targets
  editable in Settings.
- **Per-course suggestions:** Dashboard surfaces the folder with the most untouched items.
- Data model: added `Resource`, `TrackerKind`, profile targets; schema v2 with a forward-migration so
  existing browser data upgrades losslessly. Backup JSON now includes resources.
- Download/PWA bumped to v0.5.0 (`Noctyrium-web-v0.5.0.zip`).

## Unreleased — 2026-06-13

Added a **deployable web app** in [`web/`](web/) — the first non-macOS build of Noctyrium.

- Vite + React + TypeScript; runs in VS Code via `npm run dev` (no native build).
- Full glass design system ported faithfully from the SwiftUI source (background gradient,
  ambient orbs, glass shell + luster sweep, day-grade Ring + Heatmap, SF-Rounded type).
- All 11 pages rebuilt and **made modular** — terms, courses, modules, tracker items,
  tasks, journal, prompts, and hub folders are add/edit/delete in-app (the Swift build's
  content was fixed/static).
- **Browser storage** (Zustand + persist to localStorage), no backend; JSON export/import
  + reset-to-seed in Settings & Backup. Replaces the macOS `~/Medical School/` file I/O
  and the `dashboard_stats.sh` shell-out (stats now computed client-side in `scoring.ts`).
- **Adaptive/responsive** layout (sidebar collapses to a drawer on narrow widths).
- Deploy paths: standalone page (hash routes), `<iframe>` embed (`embed-example.html`),
  and a downloadable PWA zip via `scripts/package-web.sh` (relative `base` so it runs from
  `file://`). Verified: clean type-checked build, `file://` render, and mobile layout.
- The Swift/macOS app is unchanged; personal content folders + `.vscode` assets left in
  place pending a later cleanup pass.

## Unreleased — 2026-06-09

Development-environment migration + stabilization (no product redesign).

- Moved the app into a version-controlled Swift Package (`~/Developer/Noctyrium`),
  editable in VS Code / Xcode; retired the timestamped-backup workflow.
- **Fixed the build** — restored `openProductivityDayFile(_:)`, referenced by the
  Heatmap `openDay` callback (compilation was broken). Build is now warning-free.
- **Heatmap cells are clickable** — hover shows a pointer; click opens that day's
  `Productivity/Days/<date>.csv` file.
- `build_app.sh` auto-falls back to Command Line Tools when Xcode's license isn't
  accepted, so a build never blocks.
- Brought the runtime stats script under version control (`scripts/dashboard_stats.sh`);
  the build deploys it to the runtime path if missing.
- Added `scripts/package.sh` to produce a distributable `dist/Noctyrium-<version>.zip`.
- Documented the productivity/daily-file architecture + a conservative migration
  plan in `docs/PRODUCTIVITY-ARCHITECTURE.md`.

The fragile daily-file productivity architecture remains the next major task —
left untouched pending a deliberate, verified migration.

---

## v0.03.01.5 — 2026-05-01 15:32:34 AST

Detailed report:

```
/Users/jd/Medical School/09 Admin/App Data/Noctyrium/Diagnostics/noctyrium_update_log.v0.03.01.5.2026-05-01_15-32-34.md
```

### Summary

- Documented failed productivity/day-tracking architecture.
- Marked v0.03.01.5 as the current checkpoint.
- Captured known bugs in daily-file routing, active-day drift, duplicate corrections, archive duplication, and heatmap callback failure.
- Defined desired next architecture using one file per study day.
- Defined expected `x = 0`, `x = -1`, `x = -2` cascade logic.
- Preserved current observed state for later debugging.

### Status

Not functional yet. Continue from the daily-file architecture patch in the next work session.

---


All notable Noctyrium app changes, bugs, removals, regressions, and architecture notes are tracked here.

# Noctyrium

A local-first macOS command center for medical school execution — courses, module mastery tracking, productivity logging, daily standups, journal, prompt library, folder routing, tasks, reports, and STEP 1 prep, in one cockpit.

**Version:** v0.03.01.5 (technical preview)
**Stack:** SwiftUI + AppKit, native macOS (Apple Silicon)
**Build target:** macOS 13+

## What this is

The entire app is a single Swift source file (`Sources/Noctyrium/MedicalSchoolHub.swift`, ~4,300 lines). It compiles to a native `.app`. There is no web component — Noctyrium runs as a desktop application.

## Repository layout

```
Noctyrium/
  Package.swift                       # SwiftPM manifest (opens in Xcode + VS Code)
  Sources/Noctyrium/
    MedicalSchoolHub.swift            # THE APP — all source lives here
  Resources/
    Noctyrium.icns                    # app icon
    Noctyrium-Logo.png
  scripts/
    build_app.sh                      # builds + installs /Applications/Noctyrium.app
    legacy/                           # original build/run scripts, kept for reference
  CHANGELOG.md
  current_version.txt
```

## Building

**Day-to-day development** (fast compile + editor autocomplete/navigation):
```sh
swift build          # or open Package.swift in Xcode and hit Run
```

**Produce the installable app** (creates and launches `/Applications/Noctyrium.app`):
```sh
./scripts/build_app.sh
```

## Important: data lives outside this repo

Noctyrium reads and writes your real study data at runtime from `~/Medical School/`
(CSVs, daily productivity files, journal `.md`, course trackers, etc.). That data is
**intentionally not in this repo** — it is personal and would be exposed if the repo
goes public. The app keeps pointing at `~/Medical School/` regardless of where this
code lives. Migrating the code does not move or alter the data.

## Roadmap (from the v0.03.01.5 brief)

Technical hardening is the next phase, not product discovery:
- Daily-file productivity architecture (one durable file per study day)
- Transaction-safe "Start New Study Day" cascade
- Heatmap cells bound to day files
- Per-page data contracts (one source file per page)
- Report traceability + diagnostics

## Distribution notes

`build_app.sh` produces an **unsigned** app — fine for your own machine. Sharing it
with others will trip Gatekeeper until it's code-signed and notarized (requires an
Apple Developer account). That's a later step, not needed to develop.

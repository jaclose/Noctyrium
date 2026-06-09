# Noctyrium — Web

A premium, **local-first** command center for medical-school execution — courses,
mastery tracking, productivity logging, daily standups, journal, prompt library,
modular folders, tasks, reports, and STEP 1 prep — rebuilt as a **deployable web app**.

This is the web port of the original SwiftUI/macOS Noctyrium. It runs in VS Code
via a dev server, builds to a static bundle you can host or hand out as a download,
and can also be wrapped into a double-clickable macOS app package.

- **Stack:** Vite + React + TypeScript, Zustand, IndexedDB/localStorage Local Vault, lucide-react.
- **Data:** lives only in the visitor's current browser/profile or app container. Export/import a JSON backup from **Settings & Backup**.
- **Local user ID:** the display name creates a simple local owner key saved with the profile and backups.
- **Modular:** terms, courses, modules, tracker items, resources, tasks, journal, prompts, and folders
  are all add/edit/delete in-app — nothing is hard-coded.

**Highlight features**

- **Lecture, DLA, and PQ tracker** — mastery tree with a split pass/Anki status shard,
  click-to-fill pass blocks, Anki-round blocks, high-yield/low-yield/needs-review flags, scope filtering, and adaptive
  suggested next moves.
- **STEP 1 + STEP 2 CK control surfaces** — USMLE-weighted blueprint areas, readiness bars,
  and one-click tracker scaffolds for Lecture/DLA/PQ/Anki work.
- **Anki Lab** — turn lecture/DLA/slide text into cards with a prompt workflow or a browser-local
  draft generator, then export tab-separated Anki import files for Basic, Cloze, or custom note types.
- **Resources** — save and **bulk-import hyperlinks** (STEP 1 prep, references, decks, tools),
  categorized, searchable, favoritable, with favicons.
- **Anti-overload by design** — daily "good enough" card/minute targets + a study streak, with a
  nudge to *stop* when you hit target (the #1 cause of Anki burnout is grinding 500 cards/day).
- **Per-course smart suggestions** — the Dashboard and Course Tracker use pass count, yield/review
  flags, scope size, and Anki rounds to suggest the next best move.

## Run it in VS Code

```sh
cd web
npm install
npm run dev          # opens http://localhost:5173
```

That's the whole dev loop — no Xcode, no native build, nothing installed on the Mac.

## Will my online edits save?

Yes, inside the same browser/profile and same site origin. If you add `Term 3` online, it persists in that browser's Local Vault after refreshes and app updates. It will not automatically appear on another device, another browser, or another domain unless you export/import a JSON backup or later add a real hosted account sync service.

## Build a static bundle

```sh
npm run build        # → web/dist/   (type-checked, minified)
npm run preview      # serve the build locally to sanity-check
```

`vite.config.ts` sets `base: "./"`, so the same `dist/` works when **served at any
path**, **embedded in an iframe**, or **opened from `file://`** after unzipping.

## Three ways to put it on the Noctyrium website

### 1. Standalone page / hyperlink
Host the contents of `web/dist/` at e.g. `noctyrium.<yoursite>.com` or
`<yoursite>.com/noctyrium/` and link to it. Deep links work via the URL hash
(`/#productivity`, `/#tracker`, …).

### 2. Embed near the bottom of a page
Drop an iframe in:

```html
<iframe src="/noctyrium/" title="Noctyrium" loading="lazy" allow="clipboard-write"
        style="width:100%;height:760px;border:0;border-radius:22px;background:#05060d"></iframe>
```

See **[embed-example.html](embed-example.html)** for a ready-to-paste section that
includes the iframe **and** a download card with a download icon.

### 3. Downloadable packages
```sh
npm run package
```
This builds and zips:

- `Noctyrium-web-v<version>.zip` — portable static web app. Unzip and open `index.html`.
- `Noctyrium-mac-v<version>.zip` — double-clickable macOS app. Unzip and open `Noctyrium.app`.

Neither package requires npm, Vite, or localhost. The Mac app is ad-hoc signed for
local use, not notarized; if macOS blocks it after download, right-click the app
and choose **Open** once.

Because a service worker + web manifest ship in the build, visitors who open the
hosted version can also **Install** it from the browser as a PWA.

## Layout

```
web/
  index.html               # app entry + manifest + theme-color
  vite.config.ts           # base: "./" for portable builds
  public/                  # logo, PWA icons, manifest.webmanifest, sw.js
  native/                  # tiny macOS WebKit wrapper used by npm run package
  scripts/package-web.sh   # build + zip for the download
  embed-example.html       # website drop-in (iframe + download card)
  src/
    main.tsx  App.tsx       # shell, hash router, service-worker registration
    styles/                 # theme tokens + glass design system (ported from Swift)
    lib/                    # types, store (Zustand+persist), seed, scoring, backup, icons
    components/shell|ui/     # Sidebar, TopBar, GlassCard, Ring, Heatmap, Modal, …
    pages/                   # the 11 pages
```

## Notes
- **Backups matter:** browser storage is per-device. Export JSON regularly (Settings & Backup).
- **Local folders:** hosted browsers cannot reveal or open arbitrary Finder paths without user
  permission. Hub Folders can store local paths for packaged/local usage, while normal hosted pages
  should expect browser security limits.
- The design system (dark gradient, ambient orbs, glass shell + luster sweep, day-grade
  color scale) is ported faithfully from the SwiftUI build's `OuterBackground` / `GlassShell`
  / `RingScore` / `Heatmap` / `todayGrade`.

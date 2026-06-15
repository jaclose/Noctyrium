# Noctyrium — Update Policy

The one rule: **app code is disposable; user data is sacred.** Updates replace
the app, never the data.

## How each channel updates

| Channel | How it updates | Auto? |
|---|---|---|
| **Hosted web (Vercel)** | Push to the default branch → Vercel redeploys → the service worker refreshes the cached app shell on the user's next load. | ✅ Automatic |
| **Downloadable web zip** | User re-downloads the newer `Noctyrium-web-*.zip` and replaces their unzipped copy. | ❌ Manual |
| **Downloadable Mac wrapper** | User re-downloads the newer `Noctyrium-mac-*.zip` from the GitHub Release. | ❌ Manual (Alpha 1) |

There is **no in-app auto-updater in Alpha 1**, and we do **not** ship a fake one.

## Where user data lives (separate from app code)

- **Local Vault:** IndexedDB, with a `localStorage` fallback. This is the source
  of truth and is **per-browser / per-device / per-origin**.
- **Optional cloud sync:** name-based snapshots to Postgres via `DATABASE_URL`
  (Neon/Supabase). Optional; the app is fully functional without it.
- App code (the static bundle / Mac wrapper) is replaced on update; the Local
  Vault is not touched. A versioned schema + forward migrations
  (`web/src/lib/store.ts`) upgrade old saved data in place.

## What users must do to stay safe

1. **Export a JSON backup** (Settings → Backup) before:
   - switching browsers, devices, or domains,
   - swapping between hosted and downloaded packages,
   - clearing browser data.
2. Re-import that JSON on the new install if needed.

Because the Local Vault is per-origin, **moving from the hosted URL to a local
download (or vice-versa) does not carry data automatically** — use JSON export/import.

## Future: native auto-updates

When a real desktop shell is built, the plan is:

- **Tauri v2** desktop app wrapping the same `web/` frontend.
- **Tauri v2 updater** checking a static `latest.json` (or GitHub Releases) for
  signed update artifacts; app downloads, verifies signature, installs, restarts.
- User data stays in the OS app-data directory (e.g.
  `~/Library/Application Support/Noctyrium/`), never inside the app bundle, so
  installs/updates never disturb progress.
- SQLite is only introduced **with** that real Tauri shell — not before.

Until then, Alpha 1 stays intentionally simple: hosted = auto, downloads = manual.

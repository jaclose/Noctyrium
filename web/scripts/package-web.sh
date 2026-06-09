#!/usr/bin/env bash
# Build Noctyrium-web and produce downloadable packages:
#   1. a static web zip (unzip -> open index.html)
#   2. a macOS app zip (unzip -> open Noctyrium.app)
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="$(node -p "require('./package.json').version")"
STATIC_OUT="Noctyrium-web-v${VERSION}.zip"
MAC_OUT="Noctyrium-mac-v${VERSION}.zip"
STAGE_ROOT=".package"
STATIC_STAGE="$STAGE_ROOT/Noctyrium-web-v${VERSION}"
APP_STAGE="$STAGE_ROOT/Noctyrium.app"

echo "▸ Building Noctyrium-web v${VERSION}…"
npm run build

echo "▸ Staging static web package…"
rm -f "$STATIC_OUT" "$MAC_OUT"
rm -rf "$STAGE_ROOT"
mkdir -p "$STATIC_STAGE"
cp -R dist/. "$STATIC_STAGE/"
cat > "$STATIC_STAGE/README.txt" <<README
Noctyrium Web v${VERSION}

Open index.html to run the app from this package.

Data is saved locally in the browser's Local Vault (IndexedDB with localStorage fallback).
It does not sync to a server. Use Settings & Backup or Dashboard > Local Data & Package
to export a JSON backup before switching browsers, domains, or devices.

This package is the built app. It does not require npm, Vite, or localhost.
README

echo "▸ Zipping ${STATIC_STAGE} → ${STATIC_OUT}"
( cd "$STAGE_ROOT" && zip -qr "../$STATIC_OUT" "Noctyrium-web-v${VERSION}" )

if [[ "$(uname -s)" == "Darwin" ]] && command -v swiftc >/dev/null 2>&1; then
  echo "▸ Building double-clickable macOS app package…"
  mkdir -p "$APP_STAGE/Contents/MacOS" "$APP_STAGE/Contents/Resources/WebApp"
  cp -R dist/. "$APP_STAGE/Contents/Resources/WebApp/"

  swiftc "native/NoctyriumWebApp.swift" \
    -parse-as-library \
    -o "$APP_STAGE/Contents/MacOS/Noctyrium" \
    -framework SwiftUI \
    -framework WebKit \
    -framework AppKit

  cat > "$APP_STAGE/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>Noctyrium</string>
  <key>CFBundleDisplayName</key>
  <string>Noctyrium</string>
  <key>CFBundleIdentifier</key>
  <string>com.jd.noctyrium.web</string>
  <key>CFBundleExecutable</key>
  <string>Noctyrium</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleVersion</key>
  <string>${VERSION}</string>
  <key>CFBundleShortVersionString</key>
  <string>${VERSION}</string>
  <key>CFBundleIconFile</key>
  <string>Noctyrium</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>NSQuitAlwaysKeepsWindows</key>
  <false/>
</dict>
</plist>
PLIST

  if [[ -f "../Resources/Noctyrium.icns" ]]; then
    cp "../Resources/Noctyrium.icns" "$APP_STAGE/Contents/Resources/Noctyrium.icns"
  fi

  if command -v codesign >/dev/null 2>&1; then
    codesign --force --deep --sign - "$APP_STAGE" >/dev/null 2>&1 || true
  fi

  cat > "$STAGE_ROOT/README-Mac-App.txt" <<README
Noctyrium macOS App v${VERSION}

Open Noctyrium.app to run the current web build as a local Mac app.
No localhost is required. Data is saved in the app/browser local vault on this Mac.

This app is ad-hoc signed for local use, not notarized. If macOS blocks it after
download, right-click Noctyrium.app and choose Open once.
README

  echo "▸ Zipping ${APP_STAGE} → ${MAC_OUT}"
  ditto -c -k --sequesterRsrc --keepParent "$APP_STAGE" "$MAC_OUT"
else
  echo "• macOS app package skipped: this machine needs macOS + swiftc."
fi

rm -rf "$STAGE_ROOT"

echo "✓ Done: $(pwd)/${STATIC_OUT}"
if [[ -f "$MAC_OUT" ]]; then
  echo "✓ Done: $(pwd)/${MAC_OUT}"
fi
echo "  • Host the contents of dist/ for the embed + standalone page."
echo "  • Offer ${STATIC_OUT} for the portable web download (unzip → open index.html)."
if [[ -f "$MAC_OUT" ]]; then
  echo "  • Offer ${MAC_OUT} for Mac users who want a double-clickable app."
fi

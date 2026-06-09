#!/bin/zsh
set -euo pipefail

# Package Noctyrium.app into a distributable zip in dist/.
# Builds a fresh app first, then zips it with ditto (preserves the .app bundle).

REPO="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(tr -d '[:space:]' < "$REPO/current_version.txt" 2>/dev/null || echo dev)"
[[ -z "$VERSION" ]] && VERSION="dev"
STAGE_APP="$REPO/build/Noctyrium.app"
DIST="$REPO/dist"

echo "Building a fresh Noctyrium.app..."
"$REPO/scripts/build_app.sh" >/dev/null

[[ -d "$STAGE_APP" ]] || { echo "Build did not produce $STAGE_APP"; exit 1; }

mkdir -p "$DIST"
ZIP="$DIST/Noctyrium-$VERSION.zip"
rm -f "$ZIP"
echo "Packaging -> $ZIP"
ditto -c -k --sequesterRsrc --keepParent "$STAGE_APP" "$ZIP"

echo ""
echo "Done: $ZIP  ($(du -h "$ZIP" | cut -f1))"
echo ""
echo "Heads up: this build is UNSIGNED. It runs on your own Mac, but anyone you"
echo "send it to will hit a macOS Gatekeeper warning until it is code-signed and"
echo "notarized (needs an Apple Developer account)."

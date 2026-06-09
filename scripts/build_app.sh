#!/bin/zsh
set -euo pipefail

# Repo-relative — works wherever the repo lives.
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO/Sources/Noctyrium/MedicalSchoolHub.swift"
BUILD_DIR="$REPO/build"
STAGE_APP="$BUILD_DIR/Noctyrium.app"
DEST_APP="/Applications/Noctyrium.app"
ICON="$REPO/Resources/Noctyrium.icns"
BUNDLE_ID="com.jd.noctyrium"

echo "===== NOCTYRIUM REBUILD ====="
osascript -e 'tell application id "com.jd.noctyrium" to quit' >/dev/null 2>&1 || true
sleep 0.5

rm -rf "$STAGE_APP"
mkdir -p "$STAGE_APP/Contents/MacOS" "$STAGE_APP/Contents/Resources"

echo "Compiling Swift source..."
BUILD_LOG="$(mktemp)"
compile() {
  swiftc "$SRC" \
    -parse-as-library \
    -o "$STAGE_APP/Contents/MacOS/Noctyrium" \
    -framework SwiftUI \
    -framework AppKit
}
# Try the active toolchain. If Xcode is selected but its license isn't accepted,
# fall back to the Command Line Tools automatically so a build is never blocked.
if compile >"$BUILD_LOG" 2>&1; then
  echo "Compiled."
elif grep -qi "license" "$BUILD_LOG" && [[ -d /Library/Developer/CommandLineTools ]]; then
  echo "Xcode license not accepted yet — building with Command Line Tools instead."
  echo "(To use Xcode's toolchain, open Xcode once and click Agree.)"
  if DEVELOPER_DIR=/Library/Developer/CommandLineTools compile >"$BUILD_LOG" 2>&1; then
    echo "Compiled (via Command Line Tools)."
  else
    echo "Build failed:"; cat "$BUILD_LOG"; rm -f "$BUILD_LOG"; exit 1
  fi
else
  echo "Build failed:"; cat "$BUILD_LOG"; rm -f "$BUILD_LOG"; exit 1
fi
rm -f "$BUILD_LOG"

echo "Writing Info.plist..."
cat > "$STAGE_APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Noctyrium</string>
  <key>CFBundleDisplayName</key><string>Noctyrium</string>
  <key>CFBundleIdentifier</key><string>com.jd.noctyrium</string>
  <key>CFBundleExecutable</key><string>Noctyrium</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleVersion</key><string>0.03.01</string>
  <key>CFBundleShortVersionString</key><string>0.03.01</string>
  <key>CFBundleIconFile</key><string>Noctyrium</string>
  <key>NSQuitAlwaysKeepsWindows</key><false/>
  <key>NSDisableAutomaticTermination</key><true/>
</dict>
</plist>
PLIST

if [[ -f "$ICON" ]]; then
  cp "$ICON" "$STAGE_APP/Contents/Resources/Noctyrium.icns"
fi

# Ensure the app's runtime stats script exists. The app shells out to
# "$HOME/Medical School/09 Admin/Scripts/dashboard_stats.sh" at runtime; deploy
# the repo's canonical copy if it's missing (never overwrite an existing one).
RUNTIME_SCRIPTS="$HOME/Medical School/09 Admin/Scripts"
if [[ -f "$REPO/scripts/dashboard_stats.sh" && ! -f "$RUNTIME_SCRIPTS/dashboard_stats.sh" ]]; then
  mkdir -p "$RUNTIME_SCRIPTS"
  cp "$REPO/scripts/dashboard_stats.sh" "$RUNTIME_SCRIPTS/dashboard_stats.sh"
  chmod +x "$RUNTIME_SCRIPTS/dashboard_stats.sh"
  echo "Deployed dashboard_stats.sh to runtime path (was missing)."
fi

echo "Installing to /Applications..."
rm -rf "$DEST_APP"
cp -R "$STAGE_APP" "$DEST_APP"

echo "Launching..."
open -F -n "$DEST_APP"
echo "Done. Installed: $DEST_APP"

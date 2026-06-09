#!/bin/zsh
set -euo pipefail

BASE="$HOME/Medical School"
FRAMEWORK="$BASE/09 Admin/App Framework"
SRC="$FRAMEWORK/MedicalSchoolHub.swift"
BUILD_DIR="$FRAMEWORK/Build"
STAGE_APP="$BUILD_DIR/Noctyrium.app"
DEST_APP="/Applications/Noctyrium.app"
ICON="$BASE/09 Admin/App Data/Noctyrium/Brand/Noctyrium.icns"
BUNDLE_ID="com.jd.noctyrium"

echo "===== NOCTYRIUM FULL REBUILD ====="
echo ""

echo "Closing Noctyrium only..."
osascript -e 'tell application id "com.jd.noctyrium" to quit' >/dev/null 2>&1 || true
sleep 0.8

echo "Purging only Noctyrium saved state..."
rm -rf "$HOME/Library/Saved Application State/${BUNDLE_ID}.savedState" 2>/dev/null || true
defaults write "$BUNDLE_ID" NSQuitAlwaysKeepsWindows -bool false 2>/dev/null || true

echo "Removing only Noctyrium Dock pin..."
python3 - <<'PY'
from pathlib import Path
import plistlib, subprocess

dock = Path.home() / "Library/Preferences/com.apple.dock.plist"
try:
    data = plistlib.loads(dock.read_bytes())
    apps = data.get("persistent-apps", [])
    kept = []
    for item in apps:
        tile = item.get("tile-data", {})
        label = str(tile.get("file-label", ""))
        url = str(tile.get("file-data", {}).get("_CFURLString", ""))
        if label == "Noctyrium" or "Noctyrium.app" in url:
            continue
        kept.append(item)
    data["persistent-apps"] = kept
    dock.write_bytes(plistlib.dumps(data))
    subprocess.run(["killall", "Dock"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
except Exception:
    pass
PY

echo ""
echo "Preparing staging copy:"
echo "$STAGE_APP"

rm -rf "$STAGE_APP"
mkdir -p "$STAGE_APP/Contents/MacOS" "$STAGE_APP/Contents/Resources"

echo ""
echo "Compiling Swift source..."
swiftc "$SRC" \
  -parse-as-library \
  -o "$STAGE_APP/Contents/MacOS/Noctyrium" \
  -framework SwiftUI \
  -framework AppKit

echo ""
echo "Writing Info.plist..."
cat > "$STAGE_APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>Noctyrium</string>
  <key>CFBundleDisplayName</key>
  <string>Noctyrium</string>
  <key>CFBundleIdentifier</key>
  <string>com.jd.noctyrium</string>
  <key>CFBundleExecutable</key>
  <string>Noctyrium</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleVersion</key>
  <string>0.03.01</string>
  <key>CFBundleShortVersionString</key>
  <string>0.03.01</string>
  <key>CFBundleIconFile</key>
  <string>Noctyrium</string>
  <key>NSQuitAlwaysKeepsWindows</key>
  <false/>
  <key>NSDisableAutomaticTermination</key>
  <true/>
</dict>
</plist>
PLIST

if [[ -f "$ICON" ]]; then
  cp "$ICON" "$STAGE_APP/Contents/Resources/Noctyrium.icns"
  echo "Icon installed from:"
  echo "$ICON"
fi

echo ""
echo "Installing fresh app to /Applications..."
rm -rf "$DEST_APP"
cp -R "$STAGE_APP" "$DEST_APP"

echo ""
echo "Final Noctyrium-only saved-state purge..."
rm -rf "$HOME/Library/Saved Application State/${BUNDLE_ID}.savedState" 2>/dev/null || true
defaults write "$BUNDLE_ID" NSQuitAlwaysKeepsWindows -bool false 2>/dev/null || true

echo ""
echo "Final Noctyrium-only saved-state purge..."
rm -rf "$HOME/Library/Saved Application State/com.jd.noctyrium.savedState" 2>/dev/null || true
defaults write com.jd.noctyrium NSQuitAlwaysKeepsWindows -bool false 2>/dev/null || true

echo "Opening Noctyrium fresh only..."
open -F -n "$DEST_APP"

echo ""
echo "Pinning only Noctyrium to Dock..."
python3 - <<'PY'
from pathlib import Path
import plistlib, subprocess

dock = Path.home() / "Library/Preferences/com.apple.dock.plist"
app_path = "/Applications/Noctyrium.app"
try:
    data = plistlib.loads(dock.read_bytes())
except Exception:
    data = {}

apps = data.get("persistent-apps", [])
apps = [
    item for item in apps
    if item.get("tile-data", {}).get("file-label") != "Noctyrium"
    and "Noctyrium.app" not in str(item.get("tile-data", {}).get("file-data", {}).get("_CFURLString", ""))
]

apps.append({
    "tile-data": {
        "file-data": {
            "_CFURLString": "file://" + app_path,
            "_CFURLStringType": 15
        },
        "file-label": "Noctyrium"
    },
    "tile-type": "file-tile"
})

data["persistent-apps"] = apps
dock.write_bytes(plistlib.dumps(data))
subprocess.run(["killall", "Dock"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
PY

echo ""
echo "Noctyrium rebuild complete."
echo "Staging copy:"
echo "$STAGE_APP"
echo ""
echo "Installed app:"
echo "$DEST_APP"

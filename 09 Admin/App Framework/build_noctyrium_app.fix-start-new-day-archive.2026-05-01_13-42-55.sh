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
osascript <<OSA >/dev/null 2>&1 || true
tell application id "$BUNDLE_ID"
    if it is running then quit
end tell
OSA
sleep 1

echo "Purging only Noctyrium saved state..."
rm -rf "$HOME/Library/Saved Application State/$BUNDLE_ID.savedState" || true
defaults write "$BUNDLE_ID" NSQuitAlwaysKeepsWindows -bool false || true
defaults write "$BUNDLE_ID" ApplePersistenceIgnoreState -bool true || true

echo "Removing only Noctyrium Dock pin..."
python3 - <<'PY' || true
from pathlib import Path
import plistlib, subprocess

dock = Path.home() / "Library/Preferences/com.apple.dock.plist"
if dock.exists():
    data = plistlib.loads(dock.read_bytes())
    apps = data.get("persistent-apps", [])
    filtered = []
    for item in apps:
        tile = item.get("tile-data", {})
        file_data = tile.get("file-data", {})
        url = str(file_data.get("_CFURLString", ""))
        label = str(tile.get("file-label", ""))
        if "Noctyrium.app" in url or label == "Noctyrium":
            continue
        filtered.append(item)
    data["persistent-apps"] = filtered
    dock.write_bytes(plistlib.dumps(data))
    subprocess.run(["killall", "Dock"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
PY

echo ""
echo "Preparing staging copy:"
echo "$STAGE_APP"
rm -rf "$STAGE_APP"
mkdir -p "$STAGE_APP/Contents/MacOS"
mkdir -p "$STAGE_APP/Contents/Resources"
mkdir -p "$BUILD_DIR"

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
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
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
    <key>CFBundleIconFile</key>
    <string>Noctyrium</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>0.03.01</string>
    <key>CFBundleVersion</key>
    <string>0.03.01</string>
    <key>NSQuitAlwaysKeepsWindows</key>
    <false/>
    <key>ApplePersistenceIgnoreState</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
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
rm -rf "$HOME/Library/Saved Application State/$BUNDLE_ID.savedState" || true
defaults write "$BUNDLE_ID" NSQuitAlwaysKeepsWindows -bool false || true
defaults write "$BUNDLE_ID" ApplePersistenceIgnoreState -bool true || true

echo ""
echo "Opening Noctyrium fresh only..."
open -F -n "$DEST_APP" || open -n "$DEST_APP"

echo ""
echo "Pinning only Noctyrium to Dock..."
python3 - <<'PY' || true
from pathlib import Path
import plistlib, subprocess

dock = Path.home() / "Library/Preferences/com.apple.dock.plist"
app_path = "/Applications/Noctyrium.app"

if dock.exists():
    data = plistlib.loads(dock.read_bytes())
else:
    data = {}

apps = data.get("persistent-apps", [])
new_apps = []
for item in apps:
    tile = item.get("tile-data", {})
    file_data = tile.get("file-data", {})
    url = str(file_data.get("_CFURLString", ""))
    label = str(tile.get("file-label", ""))
    if "Noctyrium.app" in url or label == "Noctyrium":
        continue
    new_apps.append(item)

new_apps.append({
    "tile-data": {
        "file-data": {
            "_CFURLString": "file://" + app_path,
            "_CFURLStringType": 15
        },
        "file-label": "Noctyrium"
    },
    "tile-type": "file-tile"
})

data["persistent-apps"] = new_apps
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

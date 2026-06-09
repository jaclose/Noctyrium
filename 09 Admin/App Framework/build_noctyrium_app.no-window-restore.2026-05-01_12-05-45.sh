#!/bin/zsh
set -e

BASE="$HOME/Medical School"
SRC="$BASE/09 Admin/App Framework/MedicalSchoolHub.swift"
FRAMEWORK="$BASE/09 Admin/App Framework"
BUILD_DIR="$FRAMEWORK/Build"
STAGE_APP="$BUILD_DIR/Noctyrium.app"
DEST_APP="/Applications/Noctyrium.app"
CONTENTS="$STAGE_APP/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
EXEC="$MACOS/Noctyrium"
ICON="$BASE/09 Admin/App Data/Noctyrium/Brand/Noctyrium.icns"
BUNDLE_ID="com.jd.noctyrium"

echo "===== NOCTYRIUM FULL REBUILD ====="

echo ""
echo "Closing Noctyrium only..."
osascript -e 'tell application id "com.jd.noctyrium" to quit' >/dev/null 2>&1 || true
sleep 0.4

# Do not use broad kill/open commands. Only remove Noctyrium saved state.
rm -rf "$HOME/Library/Saved Application State/${BUNDLE_ID}.savedState" 2>/dev/null || true
defaults write "$BUNDLE_ID" NSQuitAlwaysKeepsWindows -bool false >/dev/null 2>&1 || true
defaults write "$BUNDLE_ID" ApplePersistenceIgnoreState -bool true >/dev/null 2>&1 || true

echo "Removing only Noctyrium Dock pin..."
python3 - <<'PY'
from pathlib import Path
import plistlib
import subprocess

dock = Path.home() / "Library/Preferences/com.apple.dock.plist"
target = "file:///Applications/Noctyrium.app/"

try:
    data = plistlib.loads(dock.read_bytes())
    apps = data.get("persistent-apps", [])
    new_apps = []
    for item in apps:
        tile = item.get("tile-data", {})
        url = tile.get("file-data", {}).get("_CFURLString", "")
        label = tile.get("file-label", "")
        if url == target or label == "Noctyrium":
            continue
        new_apps.append(item)

    if len(new_apps) != len(apps):
        data["persistent-apps"] = new_apps
        dock.write_bytes(plistlib.dumps(data))
        subprocess.run(["killall", "Dock"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
except Exception:
    pass
PY

echo ""
echo "Preparing staging copy:"
echo "$STAGE_APP"
rm -rf "$STAGE_APP"
mkdir -p "$MACOS" "$RESOURCES"

echo ""
echo "Compiling Swift source..."
swiftc "$SRC" \
  -parse-as-library \
  -o "$EXEC" \
  -framework SwiftUI \
  -framework AppKit

chmod +x "$EXEC"

echo ""
echo "Writing Info.plist..."
cat > "$CONTENTS/Info.plist" <<PLIST
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
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>NSQuitAlwaysKeepsWindows</key>
    <false/>
    <key>ApplePersistenceIgnoreState</key>
    <true/>
</dict>
</plist>
PLIST

if [ -f "$ICON" ]; then
  cp "$ICON" "$RESOURCES/Noctyrium.icns"
  echo "Icon installed from:"
  echo "$ICON"
fi

echo ""
echo "Installing fresh app to /Applications..."
rm -rf "$DEST_APP"
cp -R "$STAGE_APP" "$DEST_APP"

echo ""
echo "Opening Noctyrium only..."
open -na "$DEST_APP" --args --no-restore >/dev/null 2>&1 || open -na "$DEST_APP" --args --no-restore >/dev/null 2>&1 || open "$DEST_APP"

sleep 0.6

echo ""
echo "Pinning only Noctyrium to Dock..."
python3 - <<'PY'
from pathlib import Path
import plistlib
import subprocess

dock = Path.home() / "Library/Preferences/com.apple.dock.plist"
target = "file:///Applications/Noctyrium.app/"

try:
    data = plistlib.loads(dock.read_bytes())
    apps = data.get("persistent-apps", [])

    apps = [
        item for item in apps
        if item.get("tile-data", {}).get("file-data", {}).get("_CFURLString", "") != target
        and item.get("tile-data", {}).get("file-label", "") != "Noctyrium"
    ]

    item = {
        "tile-data": {
            "file-data": {
                "_CFURLString": target,
                "_CFURLStringType": 15
            },
            "file-label": "Noctyrium",
            "file-type": 41
        },
        "tile-type": "file-tile"
    }

    apps.append(item)
    data["persistent-apps"] = apps
    dock.write_bytes(plistlib.dumps(data))
    subprocess.run(["killall", "Dock"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
except Exception as e:
    print(f"Dock pin skipped: {e}")
PY

echo ""
echo "Noctyrium rebuild complete."
echo "Staging copy:"
echo "$STAGE_APP"
echo ""
echo "Installed app:"
echo "$DEST_APP"

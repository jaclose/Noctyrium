#!/bin/zsh
set -e

BASE="$HOME/Medical School"
SRC="$BASE/09 Admin/App Framework/MedicalSchoolHub.swift"
APP_NAME="Noctyrium"
BUNDLE_ID="com.jd.noctyrium"
STAGE_DIR="$BASE/09 Admin/App Framework/Build"
STAGE_APP="$STAGE_DIR/Noctyrium.app"
DEST_APP="/Applications/Noctyrium.app"
CONTENTS="$STAGE_APP/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
ICON="$BASE/09 Admin/App Data/Noctyrium/Brand/Noctyrium.icns"

echo "===== NOCTYRIUM FULL REBUILD ====="
echo ""

echo "Closing Noctyrium only..."
osascript -e 'tell application "System Events" to if exists process "Noctyrium" then tell application "Noctyrium" to quit' 2>/dev/null || true
sleep 0.7

echo "Removing only Noctyrium Dock pin..."
python3 - <<'PY'
from pathlib import Path
import plistlib
import subprocess

dock = Path.home() / "Library/Preferences/com.apple.dock.plist"
target_paths = {
    "/Applications/Noctyrium.app",
    str(Path.home() / "Applications/Noctyrium.app"),
}

try:
    data = plistlib.loads(dock.read_bytes())
    apps = data.get("persistent-apps", [])
    kept = []

    for item in apps:
        tile = item.get("tile-data", {})
        file_data = tile.get("file-data", {})
        url = file_data.get("_CFURLString", "") or ""

        is_noctyrium = (
            "Noctyrium.app" in url
            or any(path in url for path in target_paths)
            or tile.get("file-label") == "Noctyrium"
        )

        if not is_noctyrium:
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
mkdir -p "$MACOS" "$RESOURCES"

echo ""
echo "Compiling Swift source..."
swiftc "$SRC" \
  -parse-as-library \
  -o "$MACOS/Noctyrium" \
  -framework SwiftUI \
  -framework AppKit

chmod +x "$MACOS/Noctyrium"

echo ""
echo "Writing Info.plist..."
cat > "$CONTENTS/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
 "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>Noctyrium</string>
  <key>CFBundleDisplayName</key>
  <string>Noctyrium</string>
  <key>CFBundleIdentifier</key>
  <string>$BUNDLE_ID</string>
  <key>CFBundleExecutable</key>
  <string>Noctyrium</string>
  <key>CFBundleIconFile</key>
  <string>Noctyrium</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleVersion</key>
  <string>0.02</string>
  <key>CFBundleShortVersionString</key>
  <string>0.02</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
PLIST

if [ -f "$ICON" ]; then
  cp "$ICON" "$RESOURCES/Noctyrium.icns"
  echo "Icon installed from:"
  echo "$ICON"
else
  echo "Warning: icon not found:"
  echo "$ICON"
fi

echo ""
echo "Installing fresh app to /Applications..."
rm -rf "$DEST_APP"
cp -R "$STAGE_APP" "$DEST_APP"

echo ""
echo "Opening Noctyrium..."
open "$DEST_APP"

sleep 1.2

echo ""
echo "Pinning only Noctyrium to Dock..."
python3 - <<'PY'
from pathlib import Path
import plistlib
import subprocess
import urllib.parse

dock = Path.home() / "Library/Preferences/com.apple.dock.plist"
app_path = "/Applications/Noctyrium.app"
url = "file://" + urllib.parse.quote(app_path)

try:
    data = plistlib.loads(dock.read_bytes())
except Exception:
    data = {}

apps = data.get("persistent-apps", [])

already = False
for item in apps:
    tile = item.get("tile-data", {})
    file_data = tile.get("file-data", {})
    raw = file_data.get("_CFURLString", "") or ""
    if "Noctyrium.app" in raw or tile.get("file-label") == "Noctyrium":
        already = True
        break

if not already:
    apps.append({
        "tile-data": {
            "file-data": {
                "_CFURLString": url,
                "_CFURLStringType": 15
            },
            "file-label": "Noctyrium",
            "file-type": 41
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

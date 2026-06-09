#!/bin/zsh
set -e

BASE="$HOME/Medical School"
ADMIN="$BASE/09 Admin"
FRAMEWORK="$ADMIN/App Framework"
SRC="$FRAMEWORK/MedicalSchoolHub.swift"

APP_NAME="Noctyrium"
BUNDLE_ID="com.jd.noctyrium"

STAGE_DIR="$FRAMEWORK/Build"
STAGE_APP="$STAGE_DIR/Noctyrium.app"
DEST_APP="/Applications/Noctyrium.app"

EXEC="$STAGE_APP/Contents/MacOS/Noctyrium"
RES="$STAGE_APP/Contents/Resources"
ICON="$ADMIN/App Data/Noctyrium/Brand/Noctyrium.icns"

echo "===== NOCTYRIUM FULL REBUILD ====="

echo ""
echo "Closing open Noctyrium session..."
osascript -e 'tell application "Noctyrium" to quit' 2>/dev/null || true
pkill -x "Noctyrium" 2>/dev/null || true
sleep 1

echo ""
echo "Removing old Dock pin if present..."
python3 - <<'PY'
from pathlib import Path
import plistlib
import subprocess

dock = Path.home() / "Library/Preferences/com.apple.dock.plist"

try:
    data = plistlib.loads(dock.read_bytes())
except Exception:
    raise SystemExit(0)

changed = False

for key in ("persistent-apps", "recent-apps"):
    items = data.get(key, [])
    new_items = []
    for item in items:
        tile_data = item.get("tile-data", {})
        file_label = tile_data.get("file-label", "")
        file_data = tile_data.get("file-data", {})
        url = ""
        try:
            url = file_data.get("_CFURLString", "")
        except Exception:
            url = ""

        if file_label == "Noctyrium" or "Noctyrium.app" in url:
            changed = True
            continue

        new_items.append(item)

    data[key] = new_items

if changed:
    dock.write_bytes(plistlib.dumps(data))
    subprocess.run(["killall", "Dock"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
PY

echo ""
echo "Preparing staging build copy:"
echo "$STAGE_APP"

rm -rf "$STAGE_APP"
mkdir -p "$STAGE_APP/Contents/MacOS" "$RES"

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

  <key>CFBundleVersion</key>
  <string>0.02</string>

  <key>CFBundleShortVersionString</key>
  <string>0.02</string>

  <key>CFBundleExecutable</key>
  <string>Noctyrium</string>

  <key>CFBundlePackageType</key>
  <string>APPL</string>

  <key>CFBundleIconFile</key>
  <string>Noctyrium</string>

  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>

  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
PLIST

if [ -f "$ICON" ]; then
  cp "$ICON" "$RES/Noctyrium.icns"
  echo "Icon installed from:"
  echo "$ICON"
else
  echo "Warning: icon missing:"
  echo "$ICON"
fi

echo ""
echo "Removing old app from /Applications..."
rm -rf "$DEST_APP"

echo ""
echo "Installing fresh app to:"
echo "$DEST_APP"
cp -R "$STAGE_APP" "$DEST_APP"

touch "$DEST_APP"

echo ""
echo "Opening Noctyrium..."
open "$DEST_APP"

sleep 2

echo ""
echo "Pinning Noctyrium to Dock..."
python3 - <<'PY'
from pathlib import Path
import plistlib
import subprocess
import urllib.parse

dock = Path.home() / "Library/Preferences/com.apple.dock.plist"
app_path = "/Applications/Noctyrium.app"
app_url = "file://" + urllib.parse.quote(app_path)

try:
    data = plistlib.loads(dock.read_bytes())
except Exception:
    data = {}

data.setdefault("persistent-apps", [])

# Remove duplicates first.
cleaned = []
for item in data.get("persistent-apps", []):
    tile_data = item.get("tile-data", {})
    label = tile_data.get("file-label", "")
    file_data = tile_data.get("file-data", {})
    url = file_data.get("_CFURLString", "") if isinstance(file_data, dict) else ""

    if label == "Noctyrium" or "Noctyrium.app" in url:
        continue

    cleaned.append(item)

dock_item = {
    "tile-data": {
        "file-data": {
            "_CFURLString": app_url,
            "_CFURLStringType": 15
        },
        "file-label": "Noctyrium",
        "file-type": 41
    },
    "tile-type": "file-tile"
}

cleaned.append(dock_item)
data["persistent-apps"] = cleaned

dock.write_bytes(plistlib.dumps(data))
subprocess.run(["killall", "Dock"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
PY

echo ""
echo "Built staging copy:"
echo "$STAGE_APP"

echo ""
echo "Installed active app:"
echo "$DEST_APP"

echo ""
echo "Noctyrium rebuild complete."

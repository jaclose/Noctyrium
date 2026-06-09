#!/bin/zsh

APP_NAME="Medical School Hub"
APP_DIR="$HOME/Applications/$APP_NAME.app"
SRC="$HOME/Medical School/09 Admin/App Framework/MedicalSchoolHub.swift"

rm -rf "$APP_DIR"

mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

cat > "$APP_DIR/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>Medical School Hub</string>

    <key>CFBundleDisplayName</key>
    <string>Medical School Hub</string>

    <key>CFBundleIdentifier</key>
    <string>com.jd.medicalschoolhub</string>

    <key>CFBundleVersion</key>
    <string>0.1</string>

    <key>CFBundleShortVersionString</key>
    <string>0.1</string>

    <key>CFBundleExecutable</key>
    <string>MedicalSchoolHub</string>

    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>

    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
PLIST

swiftc -parse-as-library "$SRC" \
  -o "$APP_DIR/Contents/MacOS/MedicalSchoolHub" \
  -framework SwiftUI \
  -framework AppKit

if [ -f "$APP_DIR/Contents/MacOS/MedicalSchoolHub" ]; then
  chmod +x "$APP_DIR/Contents/MacOS/MedicalSchoolHub"
  echo "Built successfully: $APP_DIR"
  open "$APP_DIR"
else
  echo "Build failed. Executable missing."
fi

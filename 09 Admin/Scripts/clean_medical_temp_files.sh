#!/bin/zsh

BASE="$HOME/Medical School"
DEST="$BASE/99 🗄️ Archives/Office Temp Files/$(date '+%Y-%m-%d_%H-%M-%S')"

mkdir -p "$DEST"

echo "===== MEDICAL SCHOOL TEMP FILE CLEANUP ====="
echo "Run time: $(date)"
echo ""

find "$BASE" -type f -name "~$*" ! -path "$BASE/99 🗄️ Archives/*" | while read -r file; do
  filename="$(basename "$file")"
  mv "$file" "$DEST/"
  echo "Moved temp file: $filename"
done

echo ""
echo "Temp cleanup complete."
echo "Moved files to:"
echo "$DEST"

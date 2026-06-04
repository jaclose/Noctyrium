#!/bin/zsh

BASE="$HOME/Medical School"
SCRIPT_DIR="$BASE/09 Admin/Scripts"
REPORT_DIR="$BASE/09 Admin/Reports"
REPORT_FILE="$REPORT_DIR/Medical Hub Report - $(date '+%Y-%m-%d %H.%M.%S').txt"

mkdir -p "$REPORT_DIR"

echo "===== MEDICAL SCHOOL HUB RUNNER =====" > "$REPORT_FILE"
echo "Run time: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "Running auto-sort..." >> "$REPORT_FILE"
"$SCRIPT_DIR/auto_sort_medical.sh" >> "$REPORT_FILE" 2>&1

echo "" >> "$REPORT_FILE"
echo "Running weekly review..." >> "$REPORT_FILE"
"$SCRIPT_DIR/weekly_med_review.sh" >> "$REPORT_FILE" 2>&1

echo "" >> "$REPORT_FILE"
echo "Opening Medical School folder..." >> "$REPORT_FILE"

open "$BASE"
open "$REPORT_FILE"

echo "Medical School Hub complete."

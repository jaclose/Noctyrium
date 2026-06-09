#!/bin/zsh

BASE="$HOME/Medical School"

echo ""
echo "===== MEDICAL SCHOOL WEEKLY REVIEW ====="
echo ""

echo "1. Files in Inbox:"
find "$BASE/00 📥 Inbox - Need Work Look Over" -type f | wc -l

echo ""
echo "2. Files tagged Needs Review:"
tag --find "Needs Review" "$BASE" 2>/dev/null | wc -l

echo ""
echo "3. Files tagged Anki Needed:"
tag --find "Anki Needed" "$BASE" 2>/dev/null | wc -l

echo ""
echo "4. Files tagged Summary Needed:"
tag --find "Summary Needed" "$BASE" 2>/dev/null | wc -l

echo ""
echo "5. Files tagged Weak Area:"
tag --find "Weak Area" "$BASE" 2>/dev/null | wc -l

echo ""
echo "Review these folders:"
echo "$BASE/00 📥 Inbox - Need Work Look Over"
echo "$BASE/03 🧠 STEP 1/Weak Topics"
echo "$BASE/06 📊 Summaries and Sheets"
echo ""

#!/bin/zsh

BASE="$HOME/Medical School"
DOWNLOADS="$HOME/Downloads"
INBOX="$BASE/00 📥 Inbox - Need Work Look Over/To Sort"

mkdir -p "$INBOX"

echo "===== SAFE DOWNLOADS SORT ====="
echo "Run time: $(date)"
echo "Only sorting loose files directly inside Downloads."
echo ""

find "$DOWNLOADS" -maxdepth 1 -type f ! -name ".DS_Store" | while read -r file; do
  filename="$(basename "$file")"
  lower="$(echo "$filename" | tr '[:upper:]' '[:lower:]')"

  # Skip temporary Office lock files.
  if [[ "$filename" == "~$"* ]]; then
    mkdir -p "$BASE/99 🗄️ Archives/Office Temp Files"
    mv "$file" "$BASE/99 🗄️ Archives/Office Temp Files/"
    echo "Archived Office temp file: $filename"
    continue
  fi

  if [[ "$lower" == *.apkg || "$lower" == *anki* || "$lower" == *.colpkg ]]; then
    mv "$file" "$BASE/04 🃏 Anki Decks/"
    tag --add "Anki Needed" "$BASE/04 🃏 Anki Decks/$filename" 2>/dev/null
    echo "Moved to Anki Decks: $filename"

  elif [[ "$lower" == *step* || "$lower" == *uworld* || "$lower" == *nbme* || "$lower" == *first aid* || "$lower" == *pathoma* || "$lower" == *sketchy* ]]; then
    mv "$file" "$BASE/03 🧠 STEP 1/"
    tag --add "STEP 1" "$BASE/03 🧠 STEP 1/$filename" 2>/dev/null
    echo "Moved to STEP 1: $filename"

  elif [[ "$lower" == *research* || "$lower" == *paper* || "$lower" == *abstract* || "$lower" == *.bib || "$lower" == *.ris ]]; then
    mv "$file" "$BASE/05 🔬 Research/Papers/"
    tag --add "Research" "$BASE/05 🔬 Research/Papers/$filename" 2>/dev/null
    echo "Moved to Research Papers: $filename"

  elif [[ "$lower" == *summary* || "$lower" == *sheet* || "$lower" == *table* || "$lower" == *review* || "$lower" == *high yield* || "$lower" == *cumulative* ]]; then
    mv "$file" "$BASE/06 📊 Summaries and Sheets/"
    tag --add "Summary Needed" "$BASE/06 📊 Summaries and Sheets/$filename" 2>/dev/null
    echo "Moved to Summaries and Sheets: $filename"

  elif [[ "$lower" == *bpm* || "$lower" == *ppm* || "$lower" == *lecture* || "$lower" == *slides* || "$lower" == *quiz* || "$lower" == *exam* || "$lower" == *dla* || "$lower" == *small group* ]]; then
    mv "$file" "$INBOX/"
    tag --add "Needs Review" "$INBOX/$filename" 2>/dev/null
    echo "Moved to course review inbox: $filename"

  elif [[ "$lower" == *.pdf || "$lower" == *.docx || "$lower" == *.pptx || "$lower" == *.xlsx || "$lower" == *.csv || "$lower" == *.pages || "$lower" == *.key || "$lower" == *.numbers ]]; then
    mv "$file" "$INBOX/"
    tag --add "Needs Review" "$INBOX/$filename" 2>/dev/null
    echo "Moved to inbox: $filename"

  else
    echo "Skipped unsupported file: $filename"
  fi
done

echo ""
echo "Safe Downloads sort complete."

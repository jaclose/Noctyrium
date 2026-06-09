#!/bin/zsh

BASE="$HOME/Medical School"
DOWNLOADS="$HOME/Downloads"
INBOX="$BASE/00 📥 Inbox - Need Work Look Over/To Sort"

mkdir -p "$INBOX"

for file in "$DOWNLOADS"/*; do
  [ -e "$file" ] || continue
  [ -d "$file" ] && continue

  filename=$(basename "$file")
  lower=$(echo "$filename" | tr '[:upper:]' '[:lower:]')

  if [[ "$lower" == *"bpm500"* || "$lower" == *"bpm 500"* ]]; then
    mv "$file" "$BASE/01 BPM 500/"
    tag --add "Exam Relevant" "$BASE/01 BPM 500/$filename"
    tag --add "Needs Review" "$BASE/01 BPM 500/$filename"

  elif [[ "$lower" == *"bpm501"* || "$lower" == *"bpm 501"* ]]; then
    mv "$file" "$BASE/02 BPM 501/"
    tag --add "Exam Relevant" "$BASE/02 BPM 501/$filename"
    tag --add "Needs Review" "$BASE/02 BPM 501/$filename"

  elif [[ "$lower" == *"uworld"* || "$lower" == *"nbme"* || "$lower" == *"pathoma"* || "$lower" == *"sketchy"* || "$lower" == *"first aid"* || "$lower" == *"step"* || "$lower" == *"mehlman"* ]]; then
    mv "$file" "$BASE/03 🧠 STEP 1/"
    tag --add "STEP 1" "$BASE/03 🧠 STEP 1/$filename"
    tag --add "Needs Review" "$BASE/03 🧠 STEP 1/$filename"

  elif [[ "$lower" == *"anki"* || "$lower" == *"anking"* || "$lower" == *.apkg ]]; then
    mv "$file" "$BASE/04 🃏 Anki Decks/"
    tag --add "Anki Needed" "$BASE/04 🃏 Anki Decks/$filename"
    tag --add "Needs Review" "$BASE/04 🃏 Anki Decks/$filename"

  elif [[ "$lower" == *"research"* || "$lower" == *"winref"* || "$lower" == *"abstract"* || "$lower" == *.bib || "$lower" == *.ris ]]; then
    mv "$file" "$BASE/05 🔬 Research/"
    tag --add "Research" "$BASE/05 🔬 Research/$filename"
    tag --add "Needs Review" "$BASE/05 🔬 Research/$filename"

  elif [[ "$lower" == *"summary"* || "$lower" == *"sheet"* || "$lower" == *"table"* || "$lower" == *"review"* || "$lower" == *"high yield"* ]]; then
    mv "$file" "$BASE/06 📊 Summaries and Sheets/"
    tag --add "Summary Needed" "$BASE/06 📊 Summaries and Sheets/$filename"
    tag --add "Exam Relevant" "$BASE/06 📊 Summaries and Sheets/$filename"

  elif [[ "$lower" == *.pdf || "$lower" == *.docx || "$lower" == *.pptx || "$lower" == *.xlsx || "$lower" == *.pages || "$lower" == *.key || "$lower" == *.numbers ]]; then
    mv "$file" "$INBOX/"
    tag --add "Needs Review" "$INBOX/$filename"
  fi
done

echo "Medical School auto-sort complete."

#!/bin/zsh

BASE="$HOME/Medical School"
DOWNLOADS="$HOME/Downloads"
INBOX="$BASE/00 📥 Inbox - Need Work Look Over"
APPDATA="$BASE/09 Admin/App Data"
NOCT="$APPDATA/Noctyrium"
PROD="$NOCT/Productivity"

LOG="$APPDATA/productivity_log.csv"
TASKS="$APPDATA/tasks.csv"
JOURNAL="$APPDATA/journal.csv"
MANUAL="$APPDATA/manual_time_entries.csv"
RATINGS="$APPDATA/day_ratings.csv"
ACTIVE_DAY="$PROD/active_study_day.txt"
LEGACY_DAY="$APPDATA/manual_study_day.txt"

mkdir -p "$APPDATA" "$PROD"

[ -f "$LOG" ] || echo "date,type,minutes,cards,note" > "$LOG"
[ -f "$TASKS" ] || echo "id,created,due,title,status,completed" > "$TASKS"
[ -f "$JOURNAL" ] || echo "date,today,tomorrow,blockers,energy,rating" > "$JOURNAL"
[ -f "$MANUAL" ] || echo "date,source,minutes,category,note,status" > "$MANUAL"
[ -f "$RATINGS" ] || echo "date,rating,usefulness,notes" > "$RATINGS"

noct_day() {
  if [ -s "$ACTIVE_DAY" ]; then
    head -n 1 "$ACTIVE_DAY" | tr -d '[:space:]'
    return
  fi
  if [ -s "$LEGACY_DAY" ]; then
    head -n 1 "$LEGACY_DAY" | tr -d '[:space:]'
    return
  fi
  date -v-4H +"%Y-%m-%d" 2>/dev/null || date +"%Y-%m-%d"
}

count_files_recursive() {
  find "$1" -type f 2>/dev/null | wc -l | tr -d ' '
}

count_loose_files() {
  find "$1" -maxdepth 1 -type f ! -name ".*" 2>/dev/null | wc -l | tr -d ' '
}

tag_count() {
  tag --find "$1" "$BASE" 2>/dev/null | wc -l | tr -d ' '
}

today_minutes() {
  DAY="$(noct_day)"
  awk -F',' -v day="$DAY" '
    NR>1 && $5 ~ ("study_day=" day) {sum += $3}
    END {
      if (sum < 0) sum = 0
      print sum+0
    }
  ' "$LOG"
}

today_cards() {
  DAY="$(noct_day)"
  awk -F',' -v day="$DAY" '
    NR>1 && $5 ~ ("study_day=" day) {sum += $4}
    END {
      if (sum < 0) sum = 0
      print sum+0
    }
  ' "$LOG"
}

manual_minutes_today() {
  DAY="$(noct_day)"
  awk -F',' -v day="$DAY" '
    NR>1 && substr($1,1,10)==day && $6!="rejected" {sum += $3}
    END {
      if (sum < 0) sum = 0
      print sum+0
    }
  ' "$MANUAL"
}

journal_entries() {
  awk -F',' 'NR>1 {c++} END {print c+0}' "$JOURNAL"
}

task_open() {
  awk -F',' 'NR>1 && $5!="done" {c++} END {print c+0}' "$TASKS"
}

task_done_today() {
  DAY="$(noct_day)"
  awk -F',' -v day="$DAY" 'NR>1 && $5=="done" && substr($6,1,10)==day {c++} END {print c+0}' "$TASKS"
}

echo "inbox=$(count_files_recursive "$INBOX")"
echo "downloads=$(count_loose_files "$DOWNLOADS")"
echo "needs_review=$(tag_count "Needs Review")"
echo "anki_needed=$(tag_count "Anki Needed")"
echo "summary_needed=$(tag_count "Summary Needed")"
echo "weak_area=$(tag_count "Weak Area")"

echo "today_minutes=$(today_minutes)"
echo "today_cards=$(today_cards)"
echo "manual_minutes_today=$(manual_minutes_today)"
echo "journal_entries=$(journal_entries)"

echo "tasks_open=$(task_open)"
echo "tasks_done_today=$(task_done_today)"

echo "bpm500=$(count_files_recursive "$BASE/10 Courses/Term 1/01 BPM 500")"
echo "bpm501=$(count_files_recursive "$BASE/10 Courses/Term 1/01 BPM 501")"
echo "ppm500=$(count_files_recursive "$BASE/10 Courses/Term 2/02 PPM 500")"
echo "ppm501=$(count_files_recursive "$BASE/10 Courses/Term 2/02 PPM 501")"
echo "ppm502=$(count_files_recursive "$BASE/10 Courses/Term 2/02 PPM 502")"

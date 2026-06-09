#!/bin/zsh

BASE="$HOME/Medical School"
DATA="$BASE/09 Admin/App Data/Schedule Atlas"
SCHED="$BASE/09 Admin/Schedules"
IMPORT="$SCHED/Imported"
TEXT="$SCHED/Text Extracts"
REPORTS="$BASE/09 Admin/Reports"
LOGROOT="$BASE/09 Admin/Update Log/🟦 Loved Previous Build/v0.02/v0.02.01 - High Fidelity Schedule Atlas"

mkdir -p "$DATA" "$IMPORT" "$TEXT" "$REPORTS" "$LOGROOT"

TSV="$DATA/schedule_atlas.tsv"
JSON="$DATA/schedule_atlas.json"
HTML="$REPORTS/Schedule Atlas Dashboard.html"
CHANGELOG="$LOGROOT/CHANGELOG - $(date '+%Y-%m-%d %H-%M-%S').md"

echo -e "id\ttitle\tterm\texam\tmodule\tstatus\tera\tfreshness\tpriority\tsource_file\timported_file\ttext_file\tmodified_at\timported_at" > "$TSV"

echo "[" > "$JSON"

i=0
first_json=1

find "$HOME/Downloads" -maxdepth 1 -type f \( -iname "*schedule*.docx" -o -iname "*prep*.docx" -o -iname "*BSCE*.docx" -o -iname "*Firehouse*.docx" -o -iname "*Fries*.docx" -o -iname "*Redbull*.docx" \) | sort | while read -r file; do
  i=$((i+1))
  id=$(printf "%03d" "$i")
  filename="$(basename "$file")"
  lower="$(echo "$filename" | tr '[:upper:]' '[:lower:]')"

  imported="$IMPORT/$filename"
  textfile="$TEXT/${filename:r}.txt"

  cp -f "$file" "$imported"

  if command -v textutil >/dev/null 2>&1; then
    textutil -convert txt -stdout "$file" > "$textfile" 2>/dev/null
  else
    echo "Text extraction unavailable. Install/use macOS textutil." > "$textfile"
  fi

  term="Unknown"
  exam="Unknown"
  module="General"
  sched_status="Imported"
  era="Legacy"
  freshness="Reference"
  priority="Medium"

  [[ "$lower" == *"term 1"* ]] && term="Term 1"
  [[ "$lower" == *"term 2"* ]] && term="Term 2"
  [[ "$lower" == *"term 3"* ]] && term="Term 3"
  [[ "$lower" == *"term 4"* ]] && term="Term 4"
  [[ "$lower" == *"term 5"* ]] && term="Term 5"

  [[ "$lower" == *"exam 1"* ]] && exam="Exam 1"
  [[ "$lower" == *"exam 2"* ]] && exam="Exam 2"
  [[ "$lower" == *"exam 3"* ]] && exam="Exam 3"
  [[ "$lower" == *"exam 4"* ]] && exam="Exam 4"
  [[ "$lower" == *"exam 5"* ]] && exam="Exam 5"

  [[ "$lower" == *"ftm"* ]] && module="FTM"
  [[ "$lower" == *"er"* ]] && module="ER"
  [[ "$lower" == *"dm"* ]] && module="DM"
  [[ "$lower" == *"nb 1"* || "$lower" == *"nb1"* ]] && module="NB 1"
  [[ "$lower" == *"nb 2"* || "$lower" == *"nb2"* ]] && module="NB 2"
  [[ "$lower" == *"nb 3"* || "$lower" == *"nb3"* || "$lower" == *"psych"* ]] && module="NB 3 / Psych"
  [[ "$lower" == *"bsce"* ]] && module="BSCE Prep"

  [[ "$lower" == *"updated"* || "$lower" == *"update"* || "$lower" == *"new-"* ]] && sched_status="Updated Version"
  [[ "$lower" == *"in progress"* ]] && sched_status="In Progress / Older"
  [[ "$lower" == *"2020"* || "$lower" == *"2021"* ]] && era="Historical"
  [[ "$sched_status" == "Updated Version" ]] && freshness="Most Relevant"
  [[ "$sched_status" == "In Progress / Older" ]] && freshness="Caution"
  [[ "$term" == "Term 2" ]] && priority="High"
  [[ "$term" == "Term 1" ]] && priority="High"

  modified="$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$file")"
  imported_at="$(date '+%Y-%m-%d %H:%M')"

  clean_title="$(echo "$filename" | tr '\t' ' ' | sed 's/  */ /g')"

  echo -e "$id\t$clean_title\t$term\t$exam\t$module\t$sched_status\t$era\t$freshness\t$priority\t$file\t$imported\t$textfile\t$modified\t$imported_at" >> "$TSV"

  escaped_title=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$clean_title")
  escaped_term=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$term")
  escaped_exam=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$exam")
  escaped_module=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$module")
  escaped_status=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$sched_status")
  escaped_era=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$era")
  escaped_freshness=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$freshness")
  escaped_priority=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$priority")
  escaped_imported=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$imported")
  escaped_text=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$textfile")

  if [[ "$first_json" -eq 0 ]]; then
    echo "," >> "$JSON"
  fi
  first_json=0

  cat >> "$JSON" <<JSONITEM
  {
    "id": "$id",
    "title": $escaped_title,
    "term": $escaped_term,
    "exam": $escaped_exam,
    "module": $escaped_module,
    "status": $escaped_status,
    "era": $escaped_era,
    "freshness": $escaped_freshness,
    "priority": $escaped_priority,
    "imported_file": $escaped_imported,
    "text_file": $escaped_text,
    "modified_at": "$modified",
    "imported_at": "$imported_at"
  }
JSONITEM

done

echo "" >> "$JSON"
echo "]" >> "$JSON"

python3 - <<PY
from pathlib import Path
import csv, json, html
from collections import Counter, defaultdict

base = Path.home() / "Medical School"
data = base / "09 Admin/App Data/Schedule Atlas"
reports = base / "09 Admin/Reports"
tsv = data / "schedule_atlas.tsv"
out = reports / "Schedule Atlas Dashboard.html"

rows = []
with tsv.open(newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter="\t")
    rows = list(reader)

terms = Counter(r["term"] for r in rows)
modules = Counter(r["module"] for r in rows)
fresh = Counter(r["freshness"] for r in rows)
high = sum(1 for r in rows if r["priority"] == "High")
updated = sum(1 for r in rows if r["status"] == "Updated Version")
historical = sum(1 for r in rows if r["era"] == "Historical")

def badge_class(value):
    v = value.lower()
    if "most" in v or "updated" in v: return "blue"
    if "caution" in v or "progress" in v: return "amber"
    if "historical" in v: return "violet"
    if "high" in v: return "green"
    return "soft"

cards = []
for r in rows:
    text_path = Path(r["text_file"])
    preview = ""
    if text_path.exists():
        preview = text_path.read_text(errors="ignore")[:420].replace("\\n", " ")
    cards.append(f"""
    <article class="schedule-card" data-term="{html.escape(r['term'])}" data-module="{html.escape(r['module'])}" data-freshness="{html.escape(r['freshness'])}">
      <div class="edge-luster"></div>
      <div class="card-top">
        <div>
          <div class="eyebrow">{html.escape(r['term'])} • {html.escape(r['exam'])}</div>
          <h2>{html.escape(r['title'])}</h2>
        </div>
        <div class="id">#{html.escape(r['id'])}</div>
      </div>
      <div class="badges">
        <span class="badge {badge_class(r['module'])}">{html.escape(r['module'])}</span>
        <span class="badge {badge_class(r['status'])}">{html.escape(r['status'])}</span>
        <span class="badge {badge_class(r['freshness'])}">{html.escape(r['freshness'])}</span>
        <span class="badge {badge_class(r['priority'])}">{html.escape(r['priority'])}</span>
      </div>
      <p class="preview">{html.escape(preview) if preview else "No readable preview extracted yet."}</p>
      <div class="actions">
        <button onclick="copyPath('{html.escape(r['text_file'])}')">Copy Text Path</button>
        <button onclick="openPath('{html.escape(r['imported_file'])}')">Open Doc</button>
        <button onclick="openPath('{html.escape(r['text_file'])}')">Open Text</button>
      </div>
      <div class="meta">Modified {html.escape(r['modified_at'])} • Imported {html.escape(r['imported_at'])}</div>
    </article>
    """)

term_options = "".join(f'<option value="{html.escape(k)}">{html.escape(k)} ({v})</option>' for k,v in sorted(terms.items()))
module_options = "".join(f'<option value="{html.escape(k)}">{html.escape(k)} ({v})</option>' for k,v in sorted(modules.items()))
fresh_options = "".join(f'<option value="{html.escape(k)}">{html.escape(k)} ({v})</option>' for k,v in sorted(fresh.items()))

html_doc = f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Schedule Atlas Dashboard</title>
<style>
:root {{
  --bg-0:#030711; --bg-1:#070b17; --bg-2:#101827;
  --glass-a:rgba(255,255,255,.105); --glass-b:rgba(255,255,255,.047); --glass-c:rgba(255,255,255,.022);
  --stroke:rgba(255,255,255,.155); --text:#f8fafc; --soft:#cbd5e1; --muted:#94a3b8;
  --blue:#93c5fd; --cyan:#67e8f9; --violet:#c4b5fd; --green:#86efac; --amber:#fde68a; --red:#fecaca;
}}
* {{ box-sizing:border-box; }}
body {{
  margin:0; min-height:100vh; color:var(--text);
  font-family:Futura, Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  background:
    radial-gradient(circle at 14% 12%, rgba(99,102,241,.20), transparent 28%),
    radial-gradient(circle at 82% 18%, rgba(14,165,233,.145), transparent 31%),
    radial-gradient(circle at 48% 92%, rgba(20,184,166,.09), transparent 34%),
    linear-gradient(145deg,var(--bg-0),var(--bg-1) 42%,var(--bg-2));
  padding:34px;
}}
.orb {{ position:fixed; border-radius:999px; filter:blur(42px); opacity:.42; pointer-events:none; }}
.a {{ width:340px;height:340px;top:7%;left:7%;background:radial-gradient(circle,rgba(147,197,253,.31),transparent 67%); }}
.b {{ width:430px;height:430px;right:3%;bottom:6%;background:radial-gradient(circle,rgba(196,181,253,.24),transparent 68%); }}
.shell {{
  max-width:1440px; margin:0 auto; position:relative; overflow:hidden;
  border:1px solid var(--stroke); border-radius:34px; padding:28px;
  background:linear-gradient(145deg,var(--glass-a),var(--glass-b) 44%,var(--glass-c));
  backdrop-filter:blur(26px) saturate(155%);
  box-shadow:0 38px 95px rgba(0,0,0,.50), inset 0 1px 0 rgba(255,255,255,.24);
}}
.shell:before {{
  content:""; position:absolute; inset:0; border-radius:inherit; padding:1.2px; pointer-events:none;
  background:linear-gradient(135deg,rgba(255,255,255,.42),rgba(147,197,253,.115) 24%,transparent 46%,rgba(196,181,253,.115) 72%,rgba(255,255,255,.22));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;
}}
.hero {{ display:flex; justify-content:space-between; gap:22px; align-items:flex-start; margin-bottom:24px; position:relative; z-index:1; }}
h1 {{ font-size:44px; margin:0 0 8px; letter-spacing:-.04em; }}
.subtitle {{ color:var(--soft); max-width:760px; line-height:1.55; }}
.symbol {{ font-size:30px; color:rgba(248,250,252,.82); text-shadow:0 0 24px rgba(147,197,253,.24); }}
.stats {{ display:grid; grid-template-columns:repeat(6,1fr); gap:14px; margin:22px 0; }}
.stat, .control, .schedule-card {{
  position:relative; overflow:hidden; border-radius:24px; border:1px solid rgba(255,255,255,.14);
  background:linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.045) 45%,rgba(255,255,255,.02));
  box-shadow:0 20px 46px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.20);
}}
.stat {{ padding:18px; }}
.stat .num {{ font-size:30px; font-weight:750; }}
.stat .label {{ color:var(--muted); font-size:13px; margin-top:4px; }}
.controls {{ display:grid; grid-template-columns:1.2fr repeat(3,.7fr); gap:12px; margin:18px 0 24px; }}
.control {{ padding:13px 14px; color:var(--soft); }}
input, select {{
  width:100%; background:transparent; border:0; outline:0; color:var(--text); font-size:15px;
}}
option {{ color:#0f172a; }}
.grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(360px,1fr)); gap:16px; }}
.schedule-card {{ padding:20px; min-height:260px; }}
.edge-luster {{ position:absolute; inset:-2px; border-radius:inherit; pointer-events:none; overflow:hidden; }}
.edge-luster:after {{
  content:""; position:absolute; top:-50%; left:-42%; width:42%; height:200%;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.115),rgba(147,197,253,.07),transparent);
  transform:rotate(17deg); animation:lusterSweep 7s ease-in-out 700ms infinite;
}}
@keyframes lusterSweep {{
  0% {{ transform:translateX(-75%) rotate(17deg); opacity:0; }}
  5% {{ opacity:.82; }}
  13% {{ transform:translateX(355%) rotate(17deg); opacity:0; }}
  100% {{ transform:translateX(355%) rotate(17deg); opacity:0; }}
}}
.card-top {{ display:flex; justify-content:space-between; gap:12px; position:relative; z-index:1; }}
.eyebrow {{ color:var(--cyan); font-size:12px; text-transform:uppercase; letter-spacing:.14em; }}
h2 {{ font-size:20px; line-height:1.25; margin:8px 0 0; letter-spacing:-.02em; }}
.id {{ color:var(--muted); font-weight:700; }}
.badges {{ display:flex; flex-wrap:wrap; gap:8px; margin:16px 0; position:relative; z-index:1; }}
.badge {{ border:1px solid rgba(255,255,255,.14); border-radius:999px; padding:6px 10px; font-size:12px; background:rgba(255,255,255,.06); }}
.blue {{ color:var(--blue); }} .green {{ color:var(--green); }} .amber {{ color:var(--amber); }} .violet {{ color:var(--violet); }} .soft {{ color:var(--soft); }}
.preview {{ color:var(--soft); font-size:14px; line-height:1.55; min-height:88px; position:relative; z-index:1; }}
.actions {{ display:flex; flex-wrap:wrap; gap:8px; position:relative; z-index:1; }}
button {{
  border:1px solid rgba(255,255,255,.16); border-radius:14px; padding:9px 12px; color:var(--text);
  background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.045));
  cursor:pointer; box-shadow:inset 0 1px 0 rgba(255,255,255,.18);
}}
button:hover {{ transform:translateY(-1px); border-color:rgba(147,197,253,.34); }}
.meta {{ margin-top:14px; color:var(--muted); font-size:12px; position:relative; z-index:1; }}
@media(max-width:900px) {{
  body {{ padding:16px; }}
  .stats {{ grid-template-columns:repeat(2,1fr); }}
  .controls {{ grid-template-columns:1fr; }}
  .grid {{ grid-template-columns:1fr; }}
  h1 {{ font-size:34px; }}
}}
</style>
</head>
<body>
<div class="orb a"></div><div class="orb b"></div>
<main class="shell">
  <section class="hero">
    <div>
      <h1>Schedule Atlas</h1>
      <div class="subtitle">A visual command layer for imported medical school schedules. Use this as the map; later we wire it into calendar planning, Anki generation, and course-specific timelines.</div>
    </div>
    <div class="symbol">🃁</div>
  </section>

  <section class="stats">
    <div class="stat"><div class="num">{len(rows)}</div><div class="label">Schedules</div></div>
    <div class="stat"><div class="num">{len(terms)}</div><div class="label">Terms</div></div>
    <div class="stat"><div class="num">{len(modules)}</div><div class="label">Modules</div></div>
    <div class="stat"><div class="num">{updated}</div><div class="label">Updated Versions</div></div>
    <div class="stat"><div class="num">{high}</div><div class="label">High Priority</div></div>
    <div class="stat"><div class="num">{historical}</div><div class="label">Historical</div></div>
  </section>

  <section class="controls">
    <div class="control"><input id="search" placeholder="Search schedules, modules, exams..." oninput="filterCards()"></div>
    <div class="control"><select id="term" onchange="filterCards()"><option value="">All Terms</option>{term_options}</select></div>
    <div class="control"><select id="module" onchange="filterCards()"><option value="">All Modules</option>{module_options}</select></div>
    <div class="control"><select id="freshness" onchange="filterCards()"><option value="">All Freshness</option>{fresh_options}</select></div>
  </section>

  <section class="grid" id="grid">
    {''.join(cards)}
  </section>
</main>

<script>
function filterCards() {{
  const q = document.getElementById("search").value.toLowerCase();
  const term = document.getElementById("term").value;
  const module = document.getElementById("module").value;
  const freshness = document.getElementById("freshness").value;
  document.querySelectorAll(".schedule-card").forEach(card => {{
    const text = card.innerText.toLowerCase();
    const show =
      (!q || text.includes(q)) &&
      (!term || card.dataset.term === term) &&
      (!module || card.dataset.module === module) &&
      (!freshness || card.dataset.freshness === freshness);
    card.style.display = show ? "" : "none";
  }});
}}
function copyPath(path) {{
  navigator.clipboard.writeText(path);
}}
function openPath(path) {{
  alert("Native opening from browser is locked by macOS. Path copied instead. Paste into Finder > Go to Folder or use the native app button later.\\n\\n" + path);
  navigator.clipboard.writeText(path);
}}
</script>
</body>
</html>
"""

out.write_text(html_doc, encoding="utf-8")
print(out)
PY

cat > "$CHANGELOG" <<EOFCHANGE
# v0.02.01 - High Fidelity Schedule Atlas

Date: $(date)

## Theme
Convert low-fidelity schedule importing into a usable visual Schedule Atlas layer.

## Changes
- Rebuilt Schedule Atlas data as TSV instead of fragile CSV.
- Added JSON export for future native app integration.
- Added high-fidelity glassmorphic HTML dashboard.
- Added searchable and filterable visual cards.
- Added term, module, freshness, priority, and historical labels.
- Preserved imported DOCX files and text extracts.
- Added changelog branch for this iteration.

## Revert
Use the previous importer or remove:
- $DATA/schedule_atlas.tsv
- $DATA/schedule_atlas.json
- $HTML

EOFCHANGE

open "$HTML"

echo "Built high-fidelity Schedule Atlas:"
echo "$HTML"
echo ""
echo "Data files:"
echo "$TSV"
echo "$JSON"

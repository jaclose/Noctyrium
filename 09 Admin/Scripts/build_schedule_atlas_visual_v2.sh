#!/bin/zsh

BASE="$HOME/Medical School"
DOWNLOADS="$HOME/Downloads"

SCHEDULE_DIR="$BASE/09 Admin/Schedules"
IMPORT_DIR="$SCHEDULE_DIR/Imported"
TEXT_DIR="$SCHEDULE_DIR/Text Extracts"
DATA_DIR="$BASE/09 Admin/App Data/Schedule Atlas"
REPORT_DIR="$BASE/09 Admin/Reports"
CHANGE_DIR="$BASE/09 Admin/Update Log/🟦 Loved Previous Build/v0.02/v0.02.01 - Schedule Atlas Visual Timeline"

TSV="$DATA_DIR/schedule_atlas.tsv"
JSON="$DATA_DIR/schedule_atlas.json"
HTML="$REPORT_DIR/Schedule Atlas Dashboard.html"
REPORT="$REPORT_DIR/schedule_atlas_visual_v2_$(date '+%Y-%m-%d_%H-%M-%S').txt"

mkdir -p "$IMPORT_DIR" "$TEXT_DIR" "$DATA_DIR" "$REPORT_DIR" "$CHANGE_DIR"

echo "===== SCHEDULE ATLAS V2 BUILD =====" > "$REPORT"
echo "Generated: $(date)" >> "$REPORT"
echo "Downloads: $DOWNLOADS" >> "$REPORT"
echo "" >> "$REPORT"

echo -e "id\ttitle\tterm\texam\tmodule\tsched_status\tera\tfreshness\tpriority\tsource_file\timported_file\ttext_file\tmodified_at\timported_at\texcerpt" > "$TSV"

id=0

find "$DOWNLOADS" -maxdepth 1 -type f \( -iname "*schedule*.docx" -o -iname "*term*.docx" -o -iname "*exam*.docx" -o -iname "*BSCE*.docx" -o -iname "*Firehouse*.docx" -o -iname "*Redbull*.docx" -o -iname "*Fries*.docx" \) | sort | while read -r file; do
  filename="$(basename "$file")"
  lower="$(echo "$filename" | tr '[:upper:]' '[:lower:]')"

  # avoid non-schedule Word temp files
  [[ "$filename" == "~$"* ]] && continue

  id=$((id + 1))
  idpad=$(printf "%03d" "$id")

  clean_title="$(echo "$filename" | sed 's/(1)//g' | sed 's/  */ /g' | sed 's/^ *//;s/ *$//')"

  imported="$IMPORT_DIR/$clean_title"
  textfile="$TEXT_DIR/${clean_title:r}.txt"

  cp "$file" "$imported"

  # Extract readable text from docx without needing extra packages.
  unzip -p "$file" word/document.xml 2>/dev/null \
    | sed 's/<w:p[^>]*>/\
/g' \
    | sed 's/<[^>]*>//g' \
    | python3 -c 'import html,sys; print(html.unescape(sys.stdin.read()))' \
    | tr -s '[:space:]' ' ' \
    | sed 's/^ *//;s/ *$//' \
    > "$textfile"

  excerpt="$(cat "$textfile" | cut -c 1-720 | tr '\t' ' ' | tr '\n' ' ' | sed 's/  */ /g')"

  term="Unknown"
  exam="Unknown"
  module="General"
  sched_status="Imported"
  era="Reference"
  freshness="Reference"
  priority="Medium"

  [[ "$lower" == *"term 1"* || "$lower" == *"term1"* ]] && term="Term 1"
  [[ "$lower" == *"term 2"* || "$lower" == *"term2"* ]] && term="Term 2"
  [[ "$lower" == *"term 3"* || "$lower" == *"term3"* ]] && term="Term 3"
  [[ "$lower" == *"term 4"* || "$lower" == *"term4"* ]] && term="Term 4"
  [[ "$lower" == *"term 5"* || "$lower" == *"term5"* ]] && term="Term 5"

  [[ "$lower" == *"exam 1"* || "$lower" == *"exam-1"* ]] && exam="Exam 1"
  [[ "$lower" == *"exam 2"* || "$lower" == *"exam-2"* ]] && exam="Exam 2"
  [[ "$lower" == *"exam 3"* || "$lower" == *"exam-3"* ]] && exam="Exam 3"
  [[ "$lower" == *"exam 4"* || "$lower" == *"exam-4"* ]] && exam="Exam 4"
  [[ "$lower" == *"exam 5"* || "$lower" == *"exam-5"* ]] && exam="Exam 5"

  [[ "$lower" == *"ftm"* ]] && module="FTM / BSCE Prep"
  [[ "$lower" == *"bsce"* ]] && module="BSCE Prep"
  [[ "$lower" == *"er"* ]] && module="ER"
  [[ "$lower" == *"dm"* ]] && module="DM"
  [[ "$lower" == *"nb 1"* || "$lower" == *"nb1"* ]] && module="NB 1"
  [[ "$lower" == *"nb 2"* || "$lower" == *"nb2"* ]] && module="NB 2"
  [[ "$lower" == *"nb 3"* || "$lower" == *"nb3"* || "$lower" == *"psych"* ]] && module="NB 3 / Psych"

  [[ "$lower" == *"updated"* || "$lower" == *"update"* || "$lower" == *"new-"* ]] && sched_status="Updated Version"
  [[ "$lower" == *"in progress"* ]] && sched_status="In Progress / Older"

  [[ "$lower" == *"2020"* || "$lower" == *"2021"* ]] && era="Historical"
  [[ "$sched_status" == "Updated Version" ]] && freshness="Most Relevant"
  [[ "$sched_status" == "In Progress / Older" ]] && freshness="Caution"

  [[ "$term" == "Term 1" || "$term" == "Term 2" ]] && priority="High"
  [[ "$freshness" == "Most Relevant" ]] && priority="High"

  modified="$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$file")"
  imported_at="$(date '+%Y-%m-%d %H:%M')"

  echo -e "$idpad\t$clean_title\t$term\t$exam\t$module\t$sched_status\t$era\t$freshness\t$priority\t$file\t$imported\t$textfile\t$modified\t$imported_at\t$excerpt" >> "$TSV"

  echo "Imported [$idpad]: $clean_title" >> "$REPORT"
done

python3 - <<PY
from pathlib import Path
import csv, json, html
from collections import Counter, defaultdict

tsv = Path("$TSV")
json_path = Path("$JSON")
html_path = Path("$HTML")

rows = []
with tsv.open() as f:
    reader = csv.DictReader(f, delimiter="\t")
    for r in reader:
        rows.append(r)

json_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

terms = Counter(r["term"] for r in rows)
modules = Counter(r["module"] for r in rows)
freshness = Counter(r["freshness"] for r in rows)

def badge_class(value):
    v = value.lower()
    if "most" in v or "updated" in v:
        return "good"
    if "caution" in v or "older" in v:
        return "warn"
    if "high" in v:
        return "high"
    if "historical" in v:
        return "muted"
    return "neutral"

def sort_key(r):
    term_order = {"Term 1":1, "Term 2":2, "Term 3":3, "Term 4":4, "Term 5":5, "Unknown":99}
    exam_order = {"Exam 1":1, "Exam 2":2, "Exam 3":3, "Exam 4":4, "Exam 5":5, "Unknown":99}
    return (term_order.get(r["term"],99), exam_order.get(r["exam"],99), r["title"])

rows = sorted(rows, key=sort_key)

timeline_items = []
for r in rows:
    timeline_items.append(f'''
      <button class="timeline-node" data-search="{html.escape(r["title"])}" onclick="jumpToCard('{html.escape(r["id"])}')">
        <span class="node-dot"></span>
        <span class="node-term">{html.escape(r["term"])}</span>
        <span class="node-exam">{html.escape(r["exam"])}</span>
        <span class="node-module">{html.escape(r["module"])}</span>
      </button>
    ''')

cards = []
for r in rows:
    search_blob = " ".join([r["title"], r["term"], r["exam"], r["module"], r["freshness"], r["sched_status"], r["excerpt"]]).lower()
    cards.append(f'''
    <article class="schedule-card"
      id="card-{html.escape(r["id"])}"
      data-term="{html.escape(r["term"])}"
      data-module="{html.escape(r["module"])}"
      data-freshness="{html.escape(r["freshness"])}"
      data-search="{html.escape(search_blob)}">

      <div class="card-luster"></div>

      <div class="card-top">
        <div>
          <div class="eyebrow">{html.escape(r["term"])} • {html.escape(r["exam"])}</div>
          <h2>{html.escape(r["title"])}</h2>
        </div>
        <div class="id-pill">#{html.escape(r["id"])}</div>
      </div>

      <div class="chips">
        <span>{html.escape(r["module"])}</span>
        <span class="{badge_class(r["sched_status"])}">{html.escape(r["sched_status"])}</span>
        <span class="{badge_class(r["freshness"])}">{html.escape(r["freshness"])}</span>
        <span class="{badge_class(r["priority"])}">{html.escape(r["priority"])}</span>
      </div>

      <p class="excerpt">{html.escape(r["excerpt"])}</p>

      <div class="actions">
        <button onclick="copyText('{html.escape(r["text_file"])}')">Copy Text Path</button>
        <button onclick="openPath('{html.escape(r["imported_file"])}')">Open Doc</button>
        <button onclick="openPath('{html.escape(r["text_file"])}')">Open Text</button>
      </div>

      <div class="meta">Modified {html.escape(r["modified_at"])} • Imported {html.escape(r["imported_at"])}</div>
    </article>
    ''')

term_options = "\n".join(f'<option value="{html.escape(t)}">{html.escape(t)}</option>' for t in sorted(terms))
module_options = "\n".join(f'<option value="{html.escape(m)}">{html.escape(m)}</option>' for m in sorted(modules))
fresh_options = "\n".join(f'<option value="{html.escape(fr)}">{html.escape(fr)}</option>' for fr in sorted(freshness))

html_doc = f'''<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Schedule Atlas Dashboard</title>
<style>
:root {{
  --bg0: #030711;
  --bg1: #07111f;
  --bg2: #0f172a;
  --glass: rgba(255,255,255,.078);
  --glass2: rgba(255,255,255,.038);
  --stroke: rgba(255,255,255,.14);
  --text: #f8fafc;
  --soft: #cbd5e1;
  --muted: #94a3b8;
  --blue: #93c5fd;
  --cyan: #67e8f9;
  --violet: #c4b5fd;
  --green: #86efac;
  --amber: #fde68a;
  --red: #fecaca;
}}

* {{ box-sizing: border-box; }}

body {{
  margin: 0;
  min-height: 100vh;
  color: var(--text);
  font-family: Futura, "Futura PT", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at 12% 8%, rgba(147,197,253,.20), transparent 28%),
    radial-gradient(circle at 88% 18%, rgba(196,181,253,.16), transparent 30%),
    radial-gradient(circle at 45% 100%, rgba(103,232,249,.10), transparent 32%),
    linear-gradient(145deg, var(--bg0), var(--bg1), var(--bg2));
  background-attachment: fixed;
}}

.app {{
  width: min(1380px, calc(100vw - 34px));
  margin: 0 auto;
  padding: 30px 0 50px;
}}

.hero {{
  position: relative;
  overflow: hidden;
  border: 1px solid var(--stroke);
  border-radius: 34px;
  padding: 34px;
  background: linear-gradient(145deg, rgba(255,255,255,.10), rgba(255,255,255,.045));
  box-shadow: 0 34px 90px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.22);
  backdrop-filter: blur(26px) saturate(160%);
}}

.hero::after,
.schedule-card::after,
.control-panel::after {{
  content: "";
  position: absolute;
  top: -60%;
  left: -35%;
  width: 32%;
  height: 220%;
  background: linear-gradient(100deg, transparent, rgba(255,255,255,.12), rgba(147,197,253,.08), transparent);
  transform: rotate(17deg);
  animation: sweep 8s ease-in-out infinite;
  pointer-events: none;
}}

@keyframes sweep {{
  0%, 82% {{ transform: translateX(-40%) rotate(17deg); opacity: 0; }}
  87% {{ opacity: .9; }}
  96% {{ transform: translateX(420%) rotate(17deg); opacity: 0; }}
  100% {{ opacity: 0; }}
}}

.hero-grid {{
  display: grid;
  grid-template-columns: 1.3fr .7fr;
  gap: 26px;
  align-items: center;
}}

.kicker {{
  color: var(--cyan);
  letter-spacing: .18em;
  text-transform: uppercase;
  font-size: 12px;
}}

h1 {{
  margin: 10px 0 8px;
  font-size: clamp(36px, 5vw, 68px);
  letter-spacing: -0.055em;
  line-height: .94;
}}

.hero p {{
  color: var(--soft);
  max-width: 780px;
  line-height: 1.55;
  margin: 0;
}}

.symbol {{
  text-align: right;
  font-size: 58px;
  filter: drop-shadow(0 0 20px rgba(147,197,253,.24));
}}

.metrics {{
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-top: 26px;
}}

.metric {{
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 22px;
  padding: 16px;
  background: rgba(255,255,255,.045);
}}

.metric strong {{
  display: block;
  font-size: 28px;
}}

.metric span {{
  color: var(--muted);
  font-size: 13px;
}}

.timeline-wrap {{
  margin: 22px 0;
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 14px 0;
  backdrop-filter: blur(20px);
}}

.timeline {{
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 14px;
  border: 1px solid rgba(255,255,255,.11);
  border-radius: 26px;
  background: rgba(3,7,17,.58);
  box-shadow: 0 18px 40px rgba(0,0,0,.28);
}}

.timeline-node {{
  min-width: 174px;
  text-align: left;
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 18px;
  padding: 12px;
  color: var(--text);
  background: linear-gradient(145deg, rgba(255,255,255,.085), rgba(255,255,255,.035));
  cursor: pointer;
}}

.timeline-node:hover {{
  transform: translateY(-1px);
  border-color: rgba(147,197,253,.32);
}}

.node-dot {{
  display: block;
  width: 9px;
  height: 9px;
  border-radius: 99px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, var(--blue), var(--violet));
  box-shadow: 0 0 18px rgba(147,197,253,.5);
}}

.node-term, .node-exam, .node-module {{
  display: block;
}}

.node-term {{
  font-size: 12px;
  color: var(--muted);
}}

.node-exam {{
  font-size: 15px;
}}

.node-module {{
  font-size: 12px;
  color: var(--cyan);
}}

.control-panel {{
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.6fr repeat(3, .7fr);
  gap: 12px;
  margin: 22px 0;
  padding: 16px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 26px;
  background: rgba(255,255,255,.055);
  backdrop-filter: blur(22px) saturate(150%);
}}

input, select {{
  width: 100%;
  color: var(--text);
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 16px;
  padding: 13px 14px;
  background: rgba(255,255,255,.07);
  outline: none;
}}

input::placeholder {{ color: var(--muted); }}

.grid {{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}}

.schedule-card {{
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 28px;
  padding: 24px;
  background:
    radial-gradient(circle at 15% 0%, rgba(255,255,255,.10), transparent 30%),
    linear-gradient(145deg, rgba(255,255,255,.088), rgba(255,255,255,.035));
  box-shadow:
    0 28px 70px rgba(0,0,0,.38),
    inset 0 1px 0 rgba(255,255,255,.20);
  backdrop-filter: blur(24px) saturate(150%);
}}

.card-top {{
  display: flex;
  justify-content: space-between;
  gap: 18px;
}}

.eyebrow {{
  color: var(--cyan);
  font-size: 12px;
  letter-spacing: .13em;
  text-transform: uppercase;
}}

h2 {{
  margin: 8px 0 0;
  font-size: 22px;
  line-height: 1.18;
  letter-spacing: -0.025em;
}}

.id-pill {{
  height: fit-content;
  border-radius: 999px;
  padding: 8px 11px;
  color: var(--blue);
  background: rgba(147,197,253,.10);
  border: 1px solid rgba(147,197,253,.18);
}}

.chips {{
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}}

.chips span {{
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 12px;
  color: var(--soft);
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.045);
}}

.chips .good {{ color: var(--green); border-color: rgba(134,239,172,.25); }}
.chips .warn {{ color: var(--amber); border-color: rgba(253,230,138,.25); }}
.chips .high {{ color: var(--blue); border-color: rgba(147,197,253,.25); }}
.chips .muted {{ color: var(--muted); }}

.excerpt {{
  color: var(--soft);
  line-height: 1.55;
  font-size: 14px;
  max-height: 136px;
  overflow: hidden;
}}

.actions {{
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}}

button {{
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 14px;
  padding: 10px 13px;
  color: var(--text);
  background: linear-gradient(145deg, rgba(255,255,255,.10), rgba(255,255,255,.035));
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.16);
}}

button:hover {{
  border-color: rgba(147,197,253,.35);
  transform: translateY(-1px);
}}

.meta {{
  margin-top: 14px;
  color: var(--muted);
  font-size: 12px;
}}

.hidden {{ display: none; }}

@media (max-width: 900px) {{
  .hero-grid, .control-panel, .grid, .metrics {{
    grid-template-columns: 1fr;
  }}
  .symbol {{ text-align: left; }}
}}
</style>
</head>
<body>
<div class="app">
  <section class="hero">
    <div class="hero-grid">
      <div>
        <div class="kicker">Medical School Hub • Schedule Atlas</div>
        <h1>Schedule Atlas</h1>
        <p>A visual command layer for imported term schedules. Use this as the map; later we wire it into calendar planning, Anki generation, course timelines, and daily study missions.</p>
      </div>
      <div class="symbol">🃁</div>
    </div>

    <div class="metrics">
      <div class="metric"><strong>{len(rows)}</strong><span>Schedules</span></div>
      <div class="metric"><strong>{len(terms)}</strong><span>Terms</span></div>
      <div class="metric"><strong>{len(modules)}</strong><span>Modules</span></div>
      <div class="metric"><strong>{freshness.get("Most Relevant",0)}</strong><span>Updated</span></div>
      <div class="metric"><strong>{sum(1 for r in rows if r["priority"]=="High")}</strong><span>High Priority</span></div>
      <div class="metric"><strong>{sum(1 for r in rows if r["era"]=="Historical")}</strong><span>Historical</span></div>
    </div>
  </section>

  <section class="timeline-wrap">
    <div class="timeline">
      {''.join(timeline_items)}
    </div>
  </section>

  <section class="control-panel">
    <input id="search" placeholder="Search schedule, module, exam, phrase, resource..." oninput="filterCards()">
    <select id="term" onchange="filterCards()">
      <option value="">All Terms</option>
      {term_options}
    </select>
    <select id="module" onchange="filterCards()">
      <option value="">All Modules</option>
      {module_options}
    </select>
    <select id="fresh" onchange="filterCards()">
      <option value="">All Freshness</option>
      {fresh_options}
    </select>
  </section>

  <main class="grid" id="grid">
    {''.join(cards)}
  </main>
</div>

<script>
function filterCards() {{
  const q = document.getElementById("search").value.toLowerCase();
  const term = document.getElementById("term").value;
  const module = document.getElementById("module").value;
  const fresh = document.getElementById("fresh").value;

  document.querySelectorAll(".schedule-card").forEach(card => {{
    const okQ = !q || card.dataset.search.includes(q);
    const okT = !term || card.dataset.term === term;
    const okM = !module || card.dataset.module === module;
    const okF = !fresh || card.dataset.freshness === fresh;
    card.classList.toggle("hidden", !(okQ && okT && okM && okF));
  }});
}}

function jumpToCard(id) {{
  const el = document.getElementById("card-" + id);
  if (!el) return;
  el.scrollIntoView({{ behavior: "smooth", block: "center" }});
  el.animate(
    [
      {{ boxShadow: "0 0 0 rgba(147,197,253,0)" }},
      {{ boxShadow: "0 0 44px rgba(147,197,253,.42)" }},
      {{ boxShadow: "0 28px 70px rgba(0,0,0,.38)" }}
    ],
    {{ duration: 1100, easing: "ease-out" }}
  );
}}

function copyText(text) {{
  navigator.clipboard.writeText(text);
}}

function openPath(path) {{
  // Browser security blocks direct file opening in some contexts.
  // The copied path still lets you open it manually or through Finder.
  navigator.clipboard.writeText(path);
  alert("Path copied. Paste into Finder > Go to Folder or Terminal open command.");
}}
</script>
</body>
</html>
'''

html_path.write_text(html_doc, encoding="utf-8")
PY

cat > "$CHANGE_DIR/CHANGELOG - $(date '+%Y-%m-%d_%H-%M-%S').md" <<EOFCHANGE
# v0.02.01 - Schedule Atlas Visual Timeline

Mood marker: 🟦 Loved Previous Build

## What changed
- Rebuilt Schedule Atlas as a higher-fidelity visual dashboard.
- Added sticky horizontal timeline.
- Added glassmorphic schedule cards.
- Added search/filter system.
- Added term/module/freshness filters.
- Added excerpt previews.
- Added imported doc/text path actions.
- Added TSV and JSON data layers for future app integration.

## Revert
Remove or ignore:
- $HTML
- $TSV
- $JSON

Previous imported documents remain safely stored in:
- $IMPORT_DIR
- $TEXT_DIR
EOFCHANGE

open "$HTML"

echo "Built Schedule Atlas V2:"
echo "$HTML"
echo ""
echo "Data:"
echo "$TSV"
echo "$JSON"
echo ""
echo "Report:"
echo "$REPORT"

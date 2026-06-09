#!/bin/zsh

BASE="$HOME/Medical School"
DOWNLOADS="$HOME/Downloads"

SRC_DIR="$BASE/09 Admin/Schedules/Source DOCX"
PDF_DIR="$BASE/09 Admin/Schedules/PDF Previews"
TEXT_DIR="$BASE/09 Admin/Schedules/Text Extracts"
DATA_DIR="$BASE/09 Admin/App Data/Schedule Atlas"
REPORT_DIR="$BASE/09 Admin/Reports"

TSV="$DATA_DIR/schedule_atlas_preview.tsv"
HTML="$REPORT_DIR/Schedule Atlas Dashboard.html"
REPORT="$REPORT_DIR/schedule_atlas_preview_build_$(date '+%Y-%m-%d_%H-%M-%S').txt"

mkdir -p "$SRC_DIR" "$PDF_DIR" "$TEXT_DIR" "$DATA_DIR" "$REPORT_DIR"

echo "===== SCHEDULE ATLAS DOCUMENT PREVIEW BUILD =====" > "$REPORT"
echo "Generated: $(date)" >> "$REPORT"
echo "" >> "$REPORT"

echo "Moving first 13 .docx files from Downloads..." >> "$REPORT"

find "$DOWNLOADS" -maxdepth 1 -type f -iname "*.docx" ! -name "~$*" | sort | head -13 | while read -r file; do
  filename="$(basename "$file")"
  dest="$SRC_DIR/$filename"

  if [[ -f "$dest" ]]; then
    echo "Already exists, leaving Downloads copy untouched: $filename" >> "$REPORT"
  else
    mv "$file" "$dest"
    echo "Moved: $filename" >> "$REPORT"
  fi
done

echo "" >> "$REPORT"
echo "Building index..." >> "$REPORT"

echo -e "id\ttitle\tterm\texam\tmodule\tstatus\tdocx_path\tpdf_path\ttext_path\tmodified_at" > "$TSV"

id=0

find "$SRC_DIR" -maxdepth 1 -type f -iname "*.docx" ! -name "~$*" | sort | while read -r docx; do
  id=$((id + 1))
  idpad=$(printf "%03d" "$id")

  filename="$(basename "$docx")"
  stem="${filename:r}"
  lower="$(echo "$filename" | tr '[:upper:]' '[:lower:]')"

  pdf="$PDF_DIR/$stem.pdf"
  text="$TEXT_DIR/$stem.txt"

  term="Unknown"
  exam="Unknown"
  module="General"
  sched_status="Reference"

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

  [[ "$lower" == *"ftm"* ]] && module="FTM"
  [[ "$lower" == *"bsce"* ]] && module="BSCE Prep"
  [[ "$lower" == *"er"* ]] && module="ER"
  [[ "$lower" == *"dm"* ]] && module="DM"
  [[ "$lower" == *"nb 1"* || "$lower" == *"nb1"* ]] && module="NB 1"
  [[ "$lower" == *"nb 2"* || "$lower" == *"nb2"* ]] && module="NB 2"
  [[ "$lower" == *"nb 3"* || "$lower" == *"nb3"* || "$lower" == *"psych"* ]] && module="NB 3 / Psych"

  [[ "$lower" == *"updated"* || "$lower" == *"update"* || "$lower" == *"new-"* ]] && sched_status="Updated"
  [[ "$lower" == *"in progress"* ]] && sched_status="In Progress / Older"

  # Extract text as searchable metadata only.
  unzip -p "$docx" word/document.xml 2>/dev/null \
    | sed 's/<w:p[^>]*>/\
/g' \
    | sed 's/<[^>]*>//g' \
    | python3 -c 'import html,sys; print(html.unescape(sys.stdin.read()))' \
    | tr -s '[:space:]' ' ' \
    | sed 's/^ *//;s/ *$//' \
    > "$text"

  # Try PDF conversion.
  converted="no"

  if command -v soffice >/dev/null 2>&1; then
    soffice --headless --convert-to pdf --outdir "$PDF_DIR" "$docx" >/dev/null 2>&1
    [[ -f "$pdf" ]] && converted="yes"
  fi

  if [[ "$converted" == "no" ]] && [[ -d "/Applications/LibreOffice.app" ]]; then
    /Applications/LibreOffice.app/Contents/MacOS/soffice --headless --convert-to pdf --outdir "$PDF_DIR" "$docx" >/dev/null 2>&1
    [[ -f "$pdf" ]] && converted="yes"
  fi

  # If PDF was not created, leave pdf_path blank. Atlas will still show Open Doc.
  pdf_path=""
  [[ -f "$pdf" ]] && pdf_path="$pdf"

  modified="$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$docx")"

  echo -e "$idpad\t$filename\t$term\t$exam\t$module\t$sched_status\t$docx\t$pdf_path\t$text\t$modified" >> "$TSV"

  echo "Indexed [$idpad]: $filename | PDF: $converted" >> "$REPORT"
done

python3 - <<PY
from pathlib import Path
import csv, html, json

tsv = Path("$TSV")
html_path = Path("$HTML")
rows = list(csv.DictReader(tsv.open(), delimiter="\t"))

def esc(x):
    return html.escape(x or "")

cards = []
timeline = []

for r in rows:
    has_pdf = bool(r["pdf_path"])
    preview = ""
    if has_pdf:
        preview = f'''
        <div class="pdf-frame">
          <iframe src="file://{esc(r["pdf_path"])}"></iframe>
        </div>
        '''
    else:
        preview = '''
        <div class="pdf-missing">
          <div class="big">DOCX</div>
          <p>No PDF preview yet. Install LibreOffice later for automatic conversion, or open the source document directly.</p>
        </div>
        '''

    timeline.append(f'''
      <button onclick="jumpToCard('{esc(r["id"])}')" class="timeline-node">
        <span>{esc(r["term"])}</span>
        <strong>{esc(r["exam"])}</strong>
        <em>{esc(r["module"])}</em>
      </button>
    ''')

    cards.append(f'''
    <article class="schedule-card" id="card-{esc(r["id"])}" data-search="{esc((r["title"] + " " + r["term"] + " " + r["exam"] + " " + r["module"] + " " + r["status"]).lower())}">
      <div class="shine"></div>

      <header>
        <div>
          <div class="eyebrow">{esc(r["term"])} • {esc(r["exam"])} • {esc(r["module"])}</div>
          <h2>{esc(r["title"])}</h2>
        </div>
        <div class="id">#{esc(r["id"])}</div>
      </header>

      <div class="chips">
        <span>{esc(r["status"])}</span>
        <span>{esc(r["module"])}</span>
        <span>{esc(r["modified_at"])}</span>
      </div>

      {preview}

      <div class="actions">
        <button onclick="copyPath('{esc(r["docx_path"])}')">Copy DOCX Path</button>
        <button onclick="copyPath('{esc(r["pdf_path"])}')" {'disabled' if not has_pdf else ''}>Copy PDF Path</button>
        <button onclick="copyPath('{esc(r["text_path"])}')">Copy Text Path</button>
      </div>
    </article>
    ''')

doc = f'''<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Schedule Atlas</title>
<style>
:root {{
  --bg0:#030711;
  --bg1:#07111f;
  --bg2:#101827;
  --text:#f8fafc;
  --soft:#cbd5e1;
  --muted:#94a3b8;
  --blue:#93c5fd;
  --cyan:#67e8f9;
  --violet:#c4b5fd;
  --green:#86efac;
  --amber:#fde68a;
  --stroke:rgba(255,255,255,.145);
}}

* {{ box-sizing:border-box; }}

body {{
  margin:0;
  min-height:100vh;
  color:var(--text);
  font-family:Futura, "Futura PT", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at 12% 10%, rgba(147,197,253,.20), transparent 28%),
    radial-gradient(circle at 86% 16%, rgba(196,181,253,.17), transparent 30%),
    radial-gradient(circle at 46% 100%, rgba(103,232,249,.10), transparent 34%),
    linear-gradient(145deg,var(--bg0),var(--bg1),var(--bg2));
  background-attachment:fixed;
}}

.app {{
  width:min(1440px, calc(100vw - 36px));
  margin:0 auto;
  padding:30px 0 54px;
}}

.hero {{
  position:relative;
  overflow:hidden;
  border:1px solid var(--stroke);
  border-radius:34px;
  padding:34px;
  background:linear-gradient(145deg,rgba(255,255,255,.105),rgba(255,255,255,.038));
  box-shadow:0 38px 95px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.22);
  backdrop-filter:blur(26px) saturate(155%);
}}

.hero::after,
.schedule-card::after {{
  content:"";
  position:absolute;
  top:-60%;
  left:-36%;
  width:34%;
  height:220%;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.13),rgba(147,197,253,.075),transparent);
  transform:rotate(17deg);
  animation:sweep 7s ease-in-out infinite;
  pointer-events:none;
}}

@keyframes sweep {{
  0%,80% {{ transform:translateX(-50%) rotate(17deg); opacity:0; }}
  86% {{ opacity:.82; }}
  96% {{ transform:translateX(430%) rotate(17deg); opacity:0; }}
  100% {{ opacity:0; }}
}}

.kicker {{
  color:var(--cyan);
  text-transform:uppercase;
  letter-spacing:.18em;
  font-size:12px;
}}

h1 {{
  margin:10px 0;
  font-size:clamp(42px,6vw,78px);
  letter-spacing:-.06em;
  line-height:.92;
}}

.hero p {{
  color:var(--soft);
  max-width:880px;
  line-height:1.55;
  margin:0;
}}

.metrics {{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:12px;
  margin-top:24px;
}}

.metric {{
  border:1px solid rgba(255,255,255,.11);
  border-radius:22px;
  padding:16px;
  background:rgba(255,255,255,.045);
}}

.metric strong {{
  display:block;
  font-size:30px;
}}

.metric span {{
  color:var(--muted);
  font-size:13px;
}}

.timeline {{
  position:sticky;
  top:0;
  z-index:10;
  display:flex;
  gap:10px;
  overflow-x:auto;
  margin:22px 0;
  padding:14px;
  border:1px solid rgba(255,255,255,.12);
  border-radius:26px;
  background:rgba(3,7,17,.70);
  backdrop-filter:blur(24px);
}}

.timeline-node {{
  min-width:160px;
  text-align:left;
  border:1px solid rgba(255,255,255,.13);
  border-radius:18px;
  padding:12px;
  color:var(--text);
  background:linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.035));
  cursor:pointer;
}}

.timeline-node span,
.timeline-node em {{
  display:block;
  color:var(--muted);
  font-size:12px;
  font-style:normal;
}}

.timeline-node strong {{
  display:block;
  margin:4px 0;
  color:var(--cyan);
}}

.toolbar {{
  margin-bottom:18px;
}}

input {{
  width:100%;
  border:1px solid rgba(255,255,255,.13);
  border-radius:20px;
  padding:15px 17px;
  color:var(--text);
  background:rgba(255,255,255,.065);
  outline:none;
  backdrop-filter:blur(20px);
}}

.grid {{
  display:grid;
  grid-template-columns:1fr;
  gap:20px;
}}

.schedule-card {{
  position:relative;
  overflow:hidden;
  border:1px solid rgba(255,255,255,.13);
  border-radius:30px;
  padding:24px;
  background:
    radial-gradient(circle at 20% 0%, rgba(255,255,255,.11), transparent 28%),
    linear-gradient(145deg, rgba(255,255,255,.09), rgba(255,255,255,.035));
  box-shadow:0 30px 78px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.20);
  backdrop-filter:blur(26px) saturate(150%);
}}

header {{
  display:flex;
  justify-content:space-between;
  gap:18px;
  margin-bottom:14px;
}}

.eyebrow {{
  color:var(--cyan);
  font-size:12px;
  text-transform:uppercase;
  letter-spacing:.13em;
}}

h2 {{
  margin:7px 0 0;
  font-size:24px;
  letter-spacing:-.025em;
}}

.id {{
  height:fit-content;
  border-radius:999px;
  padding:8px 12px;
  color:var(--blue);
  border:1px solid rgba(147,197,253,.20);
  background:rgba(147,197,253,.09);
}}

.chips {{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin:12px 0 18px;
}}

.chips span {{
  border:1px solid rgba(255,255,255,.12);
  border-radius:999px;
  padding:7px 10px;
  color:var(--soft);
  font-size:12px;
  background:rgba(255,255,255,.045);
}}

.pdf-frame {{
  height:680px;
  border:1px solid rgba(255,255,255,.14);
  border-radius:22px;
  overflow:hidden;
  background:rgba(0,0,0,.20);
}}

.pdf-frame iframe {{
  width:100%;
  height:100%;
  border:0;
  background:white;
}}

.pdf-missing {{
  display:grid;
  place-items:center;
  min-height:260px;
  text-align:center;
  border:1px dashed rgba(255,255,255,.18);
  border-radius:22px;
  color:var(--muted);
  background:rgba(255,255,255,.035);
}}

.pdf-missing .big {{
  font-size:44px;
  color:var(--blue);
  letter-spacing:-.05em;
}}

.actions {{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:16px;
}}

button {{
  border:1px solid rgba(255,255,255,.14);
  border-radius:15px;
  padding:10px 13px;
  color:var(--text);
  background:linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.035));
  cursor:pointer;
}}

button:disabled {{
  opacity:.35;
  cursor:not-allowed;
}}

.hidden {{ display:none; }}

@media(max-width:900px) {{
  .metrics {{ grid-template-columns:1fr 1fr; }}
  .pdf-frame {{ height:520px; }}
}}
</style>
</head>
<body>
<div class="app">
  <section class="hero">
    <div class="kicker">Medical School Hub • Schedule Atlas</div>
    <h1>Schedule Atlas</h1>
    <p>The Atlas now prioritizes actual schedule document previews instead of noisy extracted text. Text remains searchable in the background; the visual document is the main artifact.</p>

    <div class="metrics">
      <div class="metric"><strong>{len(rows)}</strong><span>Schedule Docs</span></div>
      <div class="metric"><strong>{sum(1 for r in rows if r["pdf_path"])}</strong><span>PDF Previews</span></div>
      <div class="metric"><strong>{len(set(r["term"] for r in rows))}</strong><span>Terms</span></div>
      <div class="metric"><strong>🃜🃚🃖🃁🂭🂺</strong><span>Study Atlas</span></div>
    </div>
  </section>

  <section class="timeline">
    {''.join(timeline)}
  </section>

  <section class="toolbar">
    <input id="search" placeholder="Search by term, exam, module, schedule name..." oninput="filterCards()">
  </section>

  <main class="grid">
    {''.join(cards)}
  </main>
</div>

<script>
function filterCards() {{
  const q = document.getElementById("search").value.toLowerCase();
  document.querySelectorAll(".schedule-card").forEach(card => {{
    card.classList.toggle("hidden", q && !card.dataset.search.includes(q));
  }});
}}

function jumpToCard(id) {{
  const el = document.getElementById("card-" + id);
  if (!el) return;
  el.scrollIntoView({{ behavior: "smooth", block: "center" }});
  el.animate(
    [
      {{ boxShadow: "0 0 0 rgba(147,197,253,0)" }},
      {{ boxShadow: "0 0 48px rgba(147,197,253,.42)" }},
      {{ boxShadow: "0 30px 78px rgba(0,0,0,.42)" }}
    ],
    {{ duration: 1000, easing: "ease-out" }}
  );
}}

function copyPath(path) {{
  if (!path) return;
  navigator.clipboard.writeText(path);
}}
</script>
</body>
</html>
'''

html_path.write_text(doc, encoding="utf-8")
PY

open "$HTML"

echo "Built Schedule Atlas with document previews:"
echo "$HTML"
echo ""
echo "Source DOCX folder:"
echo "$SRC_DIR"
echo ""
echo "PDF Preview folder:"
echo "$PDF_DIR"
echo ""
echo "Report:"
echo "$REPORT"

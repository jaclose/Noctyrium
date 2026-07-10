# AXOM — Shipped Features

Living record of what is **built and working**. Update this whenever a feature ships.
The companion file is [ROADMAP.md](ROADMAP.md) — in-progress and proposed work lives there,
and items move from there to here when they ship.

Last updated: 2026-07-09 · app v0.0.1-prebeta · data schema v30

## Question Bank (flagship)

### Rescue phase (2026-07-09b)

- **Critical parser fix** — feedback/explanation text glued onto an answer
  choice (`E. Co-payment Correct Feedback: …`) is now split: the option keeps
  only its real text, the feedback moves to the explanation, and a "Correct
  Feedback" marker on a choice line marks that choice correct (Layer 2). Also
  handles `Incorrect Feedback` → choice rationale, standalone feedback/objective
  marker lines (never options), text-labeled feedback (`Co-insurance Correct
  Feedback: …`), and L3 semantic mapping (explanation opening that names an
  option's text). Explicit-vs-prose answer disagreement is a flagged conflict,
  never a silent guess. 7 new tests cover the exact reported failure cases.
- **Quiz explanation panel** — correct/incorrect verdict, per-choice rationales
  (correct one highlighted), source page + set, error-type dropdown, and a
  1–5 confidence selector with keyboard shortcut. Bigger, calmer answer choices.
- **Import convenience** — quick-select High-confidence only / Needs-review only
  / All / None across a parsed batch.
- **Today's Study shortcuts** — Review due, Retry missed, and Weak-topic block
  launchers on the Question Bank page.
- **AI Explanation Cleaner** — grounded rewrite of messy feedback that preserves
  the answer (mock-covered, provider-gated).
- **Orphan repair** — a non-destructive integrity pass (unlinks dangling
  question↔set↔document references, never deletes questions or attempt history)
  plus a backup reminder, surfaced in Local Data Health.

### Rehaul phase (2026-07-09)

- **Layered parser** — L1 questions, L2 answer keys, **L3 explanation blocks**
  (inline + "Answers and Explanations" sections mapped back by number), **L4
  choice rationales** ("A is incorrect because…"), **L5 conflict detection**
  (key vs prose vs rationale disagreement → flagged, unset, needs-review), **L6
  confidence** (high only when number/options/answer/explanation align). Handles
  "Correct Answer: C. …", "The answer is C because…", "1. C — explanation".
- **Mass Import** — queue many PDFs/DOCX/text files, extract in a bounded-
  concurrency pass, per-file status (extracting/parsing/ready/needs-review/
  no-text/error) with question count + answer-key-detected, batch-save clean
  files, inspect flagged ones in the full review screen.
- **Review screen upgrades** — needs-review badge, explanation-found status
  (inline vs answer-section), choice rationales, and **Show nearby source text**
  (jump-to-source excerpt from the extracted document).
- **Restrained USMLE taxonomy + keyless auto-categorizer** — 24 broad buckets,
  keyword-scored with a confidence gate (high auto-assigns, medium suggests, low
  leaves uncategorized); never invents a category. Applied on import.
- **Bank Browser** — full-text search (stems/options/topics/tags), category
  filter, multi-select, and **bulk category/tag editing**; rename/remove tag
  store actions.
- **Grounded AI** — Mapping Assist (suggest an answer ONLY with a quoted
  evidence snippet, else needs-review), Weakness Coach (behavioral diagnosis of
  misses + a targeted block suggestion), both review-gated with a local keyless
  fallback insight.
- **Quiz polish** — keyboard A–E to pick, Enter to submit/advance, F to flag;
  a progress bar; source page + set shown on each question.

- **Import Center** — one review-gated pipeline for every input path:
  - **PDF upload with real text extraction** (pdf.js, per-page; scanned PDFs are kept as
    provenance-only source records and say so honestly — no fake OCR).
  - **DOCX extraction** (mammoth), **TXT/Markdown** (question parser), **CSV** (header-mapped),
    **JSON** (array of questions), **pasted text** (single or multi-question).
  - Multi-question splitting on numbered stems ("1.", "Q2)"), metadata lines
    (`Topic:/System:/Source:/Tags:`), and **answer-key mapping** (`Answer key: 1. C`, `1-C`,
    `Answers: 1C, 2B`, `Question 3: D`) with conflict flagging — never invented answers.
  - **Mandatory review screen**: per-question include toggles, inline editing of stems/
    options/answers/explanations/topics, confidence + warnings per question.
  - **Save modes**: question set only · library document only · both (linked), plus an
    optional **AI enhancement** checkbox (digest, pitfalls, review targets — labeled).
- **Source Library** — uploaded documents with extracted text, page counts, linked sets,
  reference-only storage, text preview, delete-with-unlink (questions never silently lost),
  and "generate questions from this document" (AI, review-gated).
- **Question Sets** — first-class sets with accuracy from attempt history, tags, source
  links, AI digest cards (Question Intelligence), run-as-block, delete-with-unlink.
- **Block Builder** — saved re-runnable block definitions (mode, count, pool filters,
  sets, timing); filters stay live so "missed only" blocks track current misses.
- **Tutor mode** — immediate feedback, error-type taxonomy (12 types), confidence,
  repair cards, AI actions (explain simply · why was I wrong · memory hook).
- **Exam mode** — pool filters (unused/incorrect/marked/category/exam-style/sets),
  optional timer, flagging, deferred feedback, end-of-block review, retake missed.
- **Results & insights** — persisted quiz sessions, score by session and category,
  weakest categories, retry queue, error patterns, hedged faculty-style analyzer.
- Question metadata: banks/sets, categories, exam styles (IMCQ/ESOP/board/MCAT/shelf/
  lecture), difficulty, marked flag, document question numbers and source pages.

## Question → Anki flywheel

- Missed question → **error-repair card** in one tap (tutor mode, results screen, detail modal).
- **Card vault**: 11 typed card kinds, provenance, AI-generated labeling.
- **In-app spaced review** (SM-2-flavored) with review history.
- **Quality checks** on every save: duplicates, too-long, multi-fact, dangling pronouns,
  absolute claims, weak cloze, missing sources.
- **AI card generation** behind a per-draft approve/reject review gate.
- Anki-compatible TSV/CSV export; the classic prompt studio remains as a tab.

## Daily academic loop

- **Command Brief**: one operating mode (Maintain/Catch-Up/Recovery/Sprint/Exam Week) with
  plain-language rationale, one Next Best Move with Begin Session, Minimum Viable Win,
  and a factual since-yesterday delta. Transparent rules; honors last night's closeout.
- **Study sessions**: timestamp-segment timing (survives sleep/refresh/updates), quick
  logs, focus mode, completion capture; stale timers capped visibly.
- **Daily Closeout** (30–90s) feeding tomorrow's brief.
- **Recovery Protocol**: calm trigger detection, honest gap estimate, editable 4-bucket
  triage, 24h restart + 72h stabilization plans. No shame language.
- Course tracker, productivity logs + Pomodoro, journal/standups, reports, habits,
  study-methods library (14 techniques with when-NOT-to-use), resources, prep lanes.

## AI layer (local-first, review-gated)

- Provider abstraction: **Ollama local** (detection, model picker, no key), **Demo/mock**
  (deterministic, `[DEMO]`-labeled), cloud BYOK as config-only until a secure proxy exists
  (no key field ships in the client, by design).
- All outputs schema-validated; nothing mutates user data without review.
- Actions: card generation, question generation (topic/reference-grounded), set digests
  with pitfalls + review targets, explain simply, why-was-I-wrong, memory hooks.

## Data safety & updates

- IndexedDB vault + localStorage fallback; frozen `noctyrium-*` storage keys (rebrand-safe).
- Versioned schema (v30) with **additive-only migrations** and an automatic
  **pre-migration snapshot** before every upgrade.
- JSON **export backup**, **replace-restore** (confirmed), and **merge import**
  (union by id, newer wins, nothing deleted); last-backup age tracking.
- **Data health panel**: storage driver, record counts, migration state, snapshot status.
- **Update flow**: single version source (`web/src/lib/brand.ts`), deploy-difference
  detection (survives version-line resets), never fires during an active session,
  never destructive; service-worker cache versioned per release.

### Detector + premium page rehaul (2026-07-10b)

- **Stronger question/answer detector**: normalization pre-pass (markdown bold,
  list bullets, smart quotes, nbsp, tab noise), correct-markers on options
  (✓ / single leading-or-trailing * / "(correct)" suffix — all-marked = bullets,
  ignored), options crammed on one line expanded ("A. x B. y C. z"), extended
  answer vocabulary (Key/Solution/Correct option/Right answer), "Answer
  explanation" blocks. 10 new tests; 224 total.
- **Question Bank page rehaul**: black-marble hero with gold eyebrow + Poppins
  headline, framed liquid-glass stat tiles, gold-framed black-glass CTAs
  (gold is a frame, never a fill), quick-action chips, segmented tab control.
  Site-wide primary buttons and active pills de-yellowed to the framed style;
  marble/limestone/liquid-glass utility classes added to the theme.

## Identity

- AXOM brand: tintable SVG mark, Poppins wordmark (self-hosted), graphite/bone/muted-gold
  palette, regenerated icon set, brand config centralized for future changes.
- **Premium theme rehaul (2026-07-10)**: 450+ legacy cyan/blue/purple accent instances
  re-tinted to the identity palette across every stylesheet; machined-gold primary CTA
  with ink text; gold active-nav indicator + soft glow; architectural glass cards with
  bevel hairlines; Poppins 600 display headings (self-hosted); mineralized status colors
  (sage/amber/terracotta/slate) replacing loud web primaries; warmed all navy surface
  fills to neutral graphite; gold focus rings; refined scrollbars, filter pills, fields,
  empty states, and the shell's gold top seam; Safari backdrop-filter fixes.
  Verified visually via headless-browser screenshots of onboarding, dashboard, and
  Question Bank.

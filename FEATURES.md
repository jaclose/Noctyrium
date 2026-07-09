# AXOM — Shipped Features

Living record of what is **built and working**. Update this whenever a feature ships.
The companion file is [ROADMAP.md](ROADMAP.md) — in-progress and proposed work lives there,
and items move from there to here when they ship.

Last updated: 2026-07-08 · app v0.0.1-prebeta · data schema v30

## Question Bank (flagship)

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

## Identity

- AXOM brand: tintable SVG mark, Poppins wordmark (self-hosted), graphite/bone/muted-gold
  palette, regenerated icon set, brand config centralized for future changes.

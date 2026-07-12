# AXOM — Shipped Features

Living record of what is **built and working**. Update this whenever a feature ships.
The companion file is [ROADMAP.md](ROADMAP.md) — in-progress and proposed work lives there,
and items move from there to here when they ship.

Last updated: 2026-07-11 · app v0.0.1-prebeta · data schema v32

## Question Bank (flagship)

### Flagship entry experience (2026-07-11)

- **Focused first use** — an empty Question Bank now leads with one semantic
  heading, one dominant Import Questions action, a secondary Paste text action,
  a concise format note, and a three-step Import → Review → Practice explanation.
  Empty analytics and unavailable library tools stay out of the way; first use
  exposes only Overview and Import (plus Source Library when documents already
  exist), and both entries use the accepted review-gated Import Center.
- **Prioritized returning command center** — continuation copy accurately says it
  starts a new block with the previous session's filters, recent sets are ordered
  by numeric last-study time with stable invalid-date fallbacks, mapping issues
  route into a scoped bank filter, and due work appears before secondary insights
  and library administration.
- **Explicit performance language** — the landing and set cards distinguish
  Current mastery (latest scored attempt per active question) from Attempt accuracy
  (all scored attempts), Questions attempted, and Total attempts. Compact recent-set
  cards show attempted coverage, mapping issues, last activity, and one contextual
  primary action: Review issues, Continue, or Start.
- **One canonical mapping-review path** — Ready, Review suggested, and Unresolved
  share one classifier across landing counts, set metrics, the Bank Browser filter,
  and question repair. Confirming an answer mapping updates mapping diagnostics only;
  practice status and attempt history are not rewritten.
- **Landing accessibility and resilience** — the two-state hero shares a safe tour
  target, the tour honors reduced motion, tablists use labelled panels and roving
  Arrow/Home/End keyboard focus, route entry resets retained content scroll, and the
  focused layout is overflow-checked at 1360, 1024, 768, and 390 px in both themes.

### Command-center and integrity pass (2026-07-10c)

- **Question Bank Command Center foundation** — saved blocks, mass import, library
  navigation, due/missed/weak-topic loops, and weakest-category, error-pattern,
  confidence-mismatch, pacing, and improvement insights remain available after the
  prioritized landing content. The optional weakness coach is provider-gated and labeled.
- **Parser provenance and confidence** — imported questions now persist separate
  question, answer, explanation, and overall confidence values plus warnings,
  parser rule IDs, source snippets, answer evidence, source page, explanation
  source, and normalized `correctAnswerText`. Letter, letter-plus-text, normalized
  answer-text, inline, feedback-adjacent, compressed, and trailing answer keys are
  reconciled; disagreement is a review flag, never a silent mapping.
- **Deterministic explanation cleanup** — `cleanExplanationText` removes repeated
  stems, options, answer lines, objectives/sources, and extraction duplication
  without rewriting teaching content during import. Display surfaces trust
  the stored explanation so later manual edits are rendered verbatim. The reported
  PPD/CD4 fixture maps to B and shows only the type-IV-hypersensitivity rationale.
- **Structured quiz feedback** — the shared feedback surface provides a short
  correct/incorrect/needs-review banner, separate correct and learner answer rows,
  clean rationale, optional learning objective, collapsible source/confidence/rule
  evidence, and repair actions. Tutor mode and question detail reuse the shared
  component; tutor and deferred-result displays preserve the stored rationale.
- **Progress-rich question-set cards** — reusable full set cards show source/category,
  total/completed/remaining, completion, Current mastery from each active question's
  latest attempt, separately named Attempt accuracy across all attempts, last
  studied, aggregate import confidence, canonical mapping-review count, AI labeling,
  and study/miss/edit/insight actions; compact recent cards retain only high-value
  progress and one contextual primary action. Mastery colors are green ≥90, gold 80–89,
  orange 70–79, red ≤69, and neutral before attempts.
- **Source identity and duplicate protection** — PDF, DOCX, and text imports receive
  SHA-256 checksums when the browser supports SubtleCrypto. Matching sources are
  linked to the existing library record instead of being stored twice; Local Data
  Health surfaces checksum duplicates and non-destructive orphan repair.
- **Reusable development preview** — the hidden development-only
  `#design-preview` route uses production brand, set-card, feedback, and primitive
  components with representative local data, three restrained glass variants,
  desktop/mobile layouts, and loading/empty/error/review/correct/incorrect states.
  The page is excluded from production routing and code output.

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
- **Quiz explanation panel** — structured correct/incorrect verdict, answer
  comparison, cleaned rationale, source page/evidence, error classification,
  repair actions, and a 1–5 confidence selector with keyboard shortcut.
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
- **Question Sets** — first-class sets with completion, threshold-colored current mastery,
  separately labeled historical accuracy, remaining/review/import-confidence/last-studied
  metrics, tags, source links, AI digest
  cards (Question Intelligence), run-as-block, search, and delete-with-unlink.
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
  triage, 24h restart + 72h stabilization plans. The optional preview now exposes
  trigger severity, canonical task/tracker counts, configured daily target,
  recent completion range when enough history exists, estimate assumptions,
  Keep/Reduce/Dismiss/Restore overrides, and an explicit no-task-deletion guarantee.
  Fresh workspaces no longer manufacture missed-study history or a minimum load.
- Course tracker, productivity logs + Pomodoro, journal/standups, reports, habits,
  study-methods library (14 techniques with when-NOT-to-use), resources, prep lanes.
- **Pomodoro reliability**: the clock lifecycle is owned at the app root, so a running
  sprint keeps accurate time on any route and across reloads; wall-clock reconciliation
  on focus/visibility/pageshow catches up backgrounded tabs; a sprint that finishes
  while hidden logs exactly once. Short/long break sequencing follows the preset's
  cycles-before-long-break cadence (cancelled or skipped sprints never advance it).
- **Habit fairness**: a habit is never "missed" before it existed. Tracking starts on
  the local calendar day the habit was created (or an explicit start date; earliest log
  for malformed legacy records) — streaks, weekly adherence, heatmaps, and the recovery
  message all floor at that day. Streak and recovery messaging treat an unlogged
  creation day as a grace day, while still honoring an explicit miss.

## AI layer (local-first, review-gated)

- Provider abstraction: **Ollama local** (detection, model picker, no key), **Demo/mock**
  (deterministic, `[DEMO]`-labeled), cloud BYOK as config-only until a secure proxy exists
  (no key field ships in the client, by design).
- All outputs schema-validated; nothing mutates user data without review.
- Actions: card generation, question generation (topic/reference-grounded), set digests
  with pitfalls + review targets, mapping assist with quoted evidence, explanation cleanup,
  weakness coaching, explain simply, why-was-I-wrong, and memory hooks.
- With no reachable configured provider/model, AI actions remain unavailable and the
  deterministic import → review → quiz loop continues to work normally.

## Data safety & updates

- IndexedDB vault + localStorage emergency fallback; frozen `noctyrium-*` storage keys
  remain rebrand-safe while successful writes remove full workspace mirrors from localStorage.
  Primary state and backup writers share one exported database-version/store definition.
- Versioned schema (v32) with **additive-only migrations** and an automatic
  **pre-migration snapshot** in a dedicated IndexedDB backup store before every upgrade;
  localStorage retains only summary metadata unless IndexedDB is unavailable or blocked.
- Schema v32 adds import diagnostics and derived answer text without rewriting stems,
  options, explanations, attempts, set links, or source links. Legacy confidence buckets
  seed conservative numeric scores and are marked with a migration rule ID.
- JSON **export backup**, **replace-restore** (confirmed), and **merge import**
  (union by id, newer fields win while distinct same-question attempts are combined);
  older imports migrate to v32, and diagnostics/source checksums survive export/import.
- AI generation artifacts use the same IndexedDB-first adapter instead of storing large
  generated content in localStorage.
- **Settings and local-first clarity**: five accessible sections — Profile, Data,
  Backup, Personalization, and Advanced. Primary copy distinguishes the device-local
  workspace, automatic local migration snapshots, and portable exported backups;
  it does not promise an account or cloud sync. Storage usage/health and record counts
  live under Data, while schema/build/provider diagnostics and confirmation-gated reset
  are separated under Advanced.
- **Persistent startup recovery**: the existing migration-failure marker drives one
  understandable card with previous/current versions, safety-snapshot time and
  readability, export/portable-restore/verified-local-restore/retry actions, and a
  plain statement that the original workspace was not deleted. Unresolved state
  cannot be dismissed and clears only after a successful retry.
- **Persisted browser journey**: Playwright automates onboarding → exact PPD TXT import →
  linked set and saved block → incorrect answer/classification/repair card → reload, then
  verifies retained IndexedDB state and the absence of workspace payloads in localStorage.
- **Update flow**: single version source (`web/src/lib/brand.ts`), deploy-difference
  detection (survives version-line resets), never fires during an active session,
  never destructive; service-worker cache versioned per release.

## Explainable setup and recommendations

- **Four-step onboarding**: Identity, Core setup, Workspace, and Data safety. Optional
  fields stay skippable; progress resumes from a small session-only draft; theme and
  focused/expanded widget choices reuse existing preferences; backup export is optional;
  completion deliberately routes to Dashboard, Course Tracker, or Question Bank.
  Reruns are App-owned, never flip the persisted onboarding flag, never reseed course
  shells, and preserve unchanged profile preferences.
- **Seven-step guide**: current plan, Course Tracker, Question Bank, recommendation
  provenance, Reports, Customize, and Data safety. It retains skip/replay, session-step
  resume, missing-target fallback, reduced-motion scrolling, keyboard containment,
  and mobile-safe sizing without touring unfinished modules.
- **Journal catch-up clarity**: exact missed date, factual optional copy, and Complete
  catch-up / Skip / Do not remind today actions. Device-only date metadata deduplicates
  reminders; catch-up opens the exact date and edits an existing same-day entry instead
  of creating a duplicate.
- **Energy provenance**: deterministic readiness can show a lower-energy option only
  when confirmed evidence crosses the 40/100 threshold. The surface names the value,
  threshold, confirmed contributions, suggested presentation change, unchanged saved
  data, and Review / Restore / Update energy / Show calculation overrides. Unconfirmed
  journal-language signals remain excluded until the user confirms them.

### Detector + premium page rehaul (2026-07-10b)

- **Stronger question/answer detector**: normalization pre-pass (markdown bold,
  list bullets, smart quotes, nbsp, tab noise), correct-markers on options
  (✓ / single leading-or-trailing * / "(correct)" suffix — all-marked = bullets,
  ignored), options crammed on one line expanded ("A. x B. y C. z"), extended
  answer vocabulary (Key/Solution/Correct option/Right answer), "Answer
  explanation" blocks, with dedicated parser and explanation-cleaning regressions.
- **Question Bank page rehaul**: black-marble hero with gold eyebrow + Poppins
  headline, framed liquid-glass stat tiles, gold-framed black-glass CTAs
  (gold is a frame, never a fill), quick-action chips, segmented tab control.
  Site-wide primary buttons and active pills de-yellowed to the framed style;
  marble/limestone/liquid-glass utility classes added to the theme.

## Identity

- AXOM brand: reusable accessible `AxomMark`, `AxomWordmark`, and
  `AxomBrandLockup`; tintable official-shape SVG mark plus a real inline SVG
  wordmark matching the custom crossbar-free A, X, circular O, and geometric M
  lettering (no runtime raster or font approximation); semantic `--axom-*`
  graphite/ivory/gold/glass tokens; uppercase browser/PWA naming; and centralized
  brand config.
- **Theme foundation**: Light, Dark, and System preferences use one validated,
  device-local setting; an inline head script applies the resolved theme before
  first paint, while runtime listeners follow OS and cross-tab changes. The shell,
  shared primitives, onboarding, settings, and Question Bank have warm-paper light
  treatments without changing schema v32 or adding workspace data to localStorage.
- **Honest module navigation**: typed, centralized module-status metadata drives
  visible NEW, WIP, and BUILDING sidebar badges in normal and customization modes.
  Academic Prep and Tools are proper disclosure controls with stable
  `aria-expanded` / `aria-controls` relationships.
- **Premium theme rehaul (2026-07-10)**: 450+ legacy cyan/blue/purple accent instances
  re-tinted to the identity palette across every stylesheet; machined-gold primary CTA
  with ink text; gold active-nav indicator + soft glow; architectural glass cards with
  bevel hairlines; Poppins 600 display headings (self-hosted); mineralized status colors
  (sage/amber/terracotta/slate) replacing loud web primaries; warmed all navy surface
  fills to neutral graphite; gold focus rings; refined scrollbars, filter pills, fields,
  empty states, and the shell's gold top seam; Safari backdrop-filter fixes.
  Verified visually via headless-browser screenshots of onboarding, dashboard, and
  Question Bank.
- Release-facing web package metadata, portable/macOS archive names, embed example,
  and native wrapper error copy use uppercase AXOM. Frozen internal identifiers remain.

## Known Current Boundaries

- PDF extraction requires a digital text layer. Scanned PDFs and screenshots do not
  have OCR and remain provenance-only unless text is supplied separately.
- DOCX is supported; legacy binary `.doc` is not.
- The Source Library stores extracted/page text, metadata, and checksums, not the
  original uploaded binary. Users must retain their source files externally.
- AI is optional and requires a reachable configured provider/model. Cloud BYOK has
  no client-side secret path and stays disabled until a secure endpoint exists.
- The Local Vault is local to a browser origin/device. IndexedDB can fall back to
  localStorage, but neither replaces a user-held JSON backup or hardened account sync.
- AXOM does not yet retain a restore-history audit log or an exact user-visible timestamp
  for every vault write. Storage health, latest migration snapshot, and last portable
  export are shown accurately instead.
- Overload provenance can show a configured daily target and an estimated outstanding-
  work range; the current model does not contain a true scheduled-hours field. Reduced
  motion follows the operating-system preference and does not yet have an AXOM-specific
  override.
- Full browser E2E coverage and OCR remain roadmap work; parser confidence narrows
  review work but does not certify the medical correctness of source material.

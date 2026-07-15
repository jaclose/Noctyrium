# Wave 6+ — Architecture Consolidation & Long-Term Foundation

Status: **final planning document before Alpha**, recorded 2026-07-14. This is
deliberately the last major planning artifact: after this, work shifts to
implementation (per [WAVE-6A-EXECUTION-PLAN.md](WAVE-6A-EXECUTION-PLAN.md)),
parser hardening on the real corpus, testing, and polish.

Core philosophy: AXOM is an academic **operating system**, not a collection of
components. Every feature must generate useful information, consume useful
information, or strengthen another feature. Nothing here changes code,
schema, storage keys, or commits anything.

Binding parents remain: [WAVE-6-PLAN.md](WAVE-6-PLAN.md),
[UNIVERSAL-QUESTION-IMPORT-ENGINE.md](UNIVERSAL-QUESTION-IMPORT-ENGINE.md),
[COURSE-CENTRAL-ARCHITECTURE.md](COURSE-CENTRAL-ARCHITECTURE.md). This
document consolidates deferred systems and long-horizon designs; where a
binding spec already covers a topic, it is referenced, never restated.

---

## 1. Complete deferred-feature audit

Every previously deferred item from [ROADMAP.md](../ROADMAP.md), FEATURES.md
"Known Current Boundaries", the widget audit, and the Wave 6 plan, categorized.
No item is dropped; ROADMAP remains the living status ledger.

### Ready Next (small, isolated, no new infrastructure)

- Timed-block per-question pacing UI (seconds already recorded)
- Quiz sessions surfaced on Dashboard/Reports
- Restore-history audit trail (restore-event ledger in Settings)
- Exact vault-write timestamp display
- Widget-engine incremental refinement (per-widget settings depth, touch-drag)
- Backup "game-save" experience rename (P11 — naming/UX only)
- Reduced-motion AXOM-level override
- Accessibility continuation (contrast + screen-reader audit)
- React hook dependency hygiene (standing lint gate)
- Broader E2E coverage on existing Playwright infra

### Foundation Required (needs Wave 6A–6D infrastructure first)

- OCR for scans/screenshots (tesseract.js spike; gated in the 6A plan)
- Complex PDF layout recovery (6A layout model; 6B visuals)
- Deterministic import dedup (6A reconciliation provides it; AI-semantic
  dedup later)
- Source-binary retention + dedicated attachment store (6C; architecture
  approved 2026-07-14, implementation deferred)
- Scheduled-hours workload model (needs calendar-backed planned-hours field;
  pairs with Course Central Level 1 ICS)
- Route-level code splitting completion (enforced progressively by the 6A
  bundle gate)
- Multi-notebook journal asset management (depends on the attachment store)

### Future Alpha (after first real-user feedback)

- Per-question AI explanation generation (batching UX + progress)
- AI-proposed Command Brief overlay (validator exists; needs review UI)
- AI error-type classification wired into tutor flow
- Faculty-style question mode (analyzer exists)
- Distractor-pull analytics (per-option picks already recorded)
- Pitfall Map as a cross-set surface
- AnkiConnect verified sync (dry-run preview, deck mapping)
- Calendar integration (ICS export of day plans)
- Journal customization (paper, ink, fonts, covers — P5 first half)
- Daily Word statistics/achievements (P8)
- Module mini-tours (P10)
- Optional release-email capture (consent design first)

### Beta (large systems, additional architecture)

- **Journal Cinematic** (wireframed in §3; wraps Foundation, never replaces)
- Exam-simulation mode (sections, breaks, full-length)
- `.apkg` Anki-deck import
- Secure cloud AI proxy (server-side BYOK)
- First-navigation offline precache (build-aware precache design)
- Cloud sync hardening (real auth, consent, security review)
- Wave 6B/6C parser layers (slide intelligence; assets/tables) — gated in
  [WAVE-6-PLAN.md](WAVE-6-PLAN.md)

### Version 2 (future roadmap)

- Accounts + cross-device sync (architecture in §9; local-first preserved)
- Legacy `.doc` conversion path
- WebLLM in-browser models
- Native/Tauri shell refresh
- Premium-tier activation (deliberately free during beta)
- Application Checker maturation
- DAT / CASPer lanes (light surfaces)
- Leaderboards (deliberately deprioritized — calm tone)
- Doctordle collaboration (blocked on external approval)

## 2. Knowledge graph (internal)

Extends the question-to-curriculum graph
([Course Central §10](COURSE-CENTRAL-ARCHITECTURE.md)) to the whole workspace.
**Users never see a graph — they experience recommendations that can explain
themselves.**

Nodes (existing record types; the graph adds relationships, not new copies):
Course · Lecture · Objective · Question · Practice Set · Exam · Weakness ·
Journal Entry · Study Session · Habit · Daily Goal · Activity · Resource ·
Anki Deck · Small Group · Reading.

Edges: `covers` · `tests` · `depends_on` · `strengthens` · `requires` ·
`reviews` · `explains` · `appears_in` · `linked_to`.

Phase-1 storage (decided at review): plain typed edge records —
`{ id, fromRef, toRef, relation, evidence, source, createdAt }` — additive in
the existing workspace, derived in-memory by selectors exactly like the
target-contribution ledger. **No graph database.** Every edge carries evidence
and source (imported, template, user, inferred+confidence), so every
recommendation downstream stays inspectable. Later enrichment (weights,
objective rollups) stays additive.

Consumers: Command Brief ranking, Course Tracker readiness/dependencies,
Reports weakness analysis, Mastery Engine (§4), study-path suggestions.

## 3. Journal Cinematic — full wireframe (design only; Foundation stays independent)

Flow: **Shelf → Pickup → Open → Write → Page turn → Close → Return to shelf.**

- **Shelf**: notebooks stand/stack on a shelf (active, archived, yearly
  volumes). Covers show title, material, wear. Multiple notebooks; archive
  drawer beneath; a search field and tag chips live above the shelf —
  search/tags/timeline operate on Foundation data, usable even with cinematic
  off.
- **Pickup**: selected notebook lifts toward the viewer (transform +
  parallax), optional desk scene fades in behind (wood/leather/stone desk
  tones matching the identity palette). Optional ambient lighting vignette.
- **Open**: hardback cover swings with a slight page-block lag; bookmark
  ribbons fall naturally. Opens to today (or last bookmark).
- **Write**: the Foundation page, unchanged — same fields, autosave,
  attachments, Day at a Glance. Cinematic only decorates the frame (paper
  texture, edge shadow, ink options). Optional writing sounds (off by
  default).
- **Page turn**: physical curl with inertia; fast flip for multi-day jumps;
  timeline scrubber (month/year) as an overlay — timeline mode lists entries,
  memories, and monthly/yearly reflection pages.
- **Reflections**: monthly and yearly reflection pages are generated as
  ordinary Foundation entries (structured prompts), pinned as special pages
  with their own bookmark; "memories" resurface past entries by date or tag.
- **Close/return**: cover closes, notebook returns to shelf; archive system
  moves completed volumes to the archive shelf with year labels.

Invariants (restating the Foundation contract): writing and navigation work
without any animation; text persists before any transition; reduced motion
removes pickup/turn/desk entirely; no audio/haptics by default; the semantic
notebook remains usable if the cinematic renderer fails; attachments stay
local; the cinematic layer references Foundation entry/attachment IDs and
never duplicates bytes. Implementation remains **Beta** — nothing here blocks
current work.

## 4. Academic Mastery Engine (design)

Mastery is a per-lecture / per-objective state computed from **visible,
weighted contribution rows** — the same inspectable idiom as Command Brief
scoring and the target-contribution ledger. Inputs (each a separate row with
source + weight, never merged into a hidden score):

lecture completion · pass count vs. the user's configured passes (3/4/5/
custom) · trusted question performance (canonical-mapping-ready only) ·
objective coverage (graph `tests`/`covers` edges) · time since last review
(decay, shown honestly as "last touched 12 days ago", not a fake forgetting
curve) · user confidence self-report · weakness signals · difficulty ·
yield (kept separate per the yield policy).

Tool subscriptions scope which rows exist (Anki green-cards row only for Anki
users; passes row only for pass-trackers) but never hide trusted question
evidence. States: Untouched → In progress → Learned → Mastered → Needs
review, each explaining exactly which rows produced it. Seed/template data
never contributes (Command Brief evidence rules apply).

## 5. Course Central & institution templates — evolution notes

Adapters stay the only entry (contract in
[COURSE-CENTRAL-ARCHITECTURE.md §5](COURSE-CENTRAL-ARCHITECTURE.md)); levels
0–3 and permissions unchanged. Future Level 2/3 research candidates beyond
the current six, all via the same data-driven adapter model (never
hard-coded): **One45 (Acuity Insights) · MedHub · New Innovations · Leo
(DaVinci Education — merging with Elentra) · OASIS** — the AAMC Curriculum
Inventory vendor ecosystem is the authoritative candidate list.

Institution templates become **installable data packages** (Course Central
§9 interface): program families Medical School · Pre-Med · PA · Dentistry ·
Nursing · Graduate School, each with program-appropriate tool lists, mastery
defaults, and structure. Adding a school or program family must never modify
core code (WAVE-6-PLAN rule 10).

## 6. Reports 2.0 — wireframe set (evidence-derived only)

Each report is composed from canonical selectors; nothing renders without
eligible real data (progressive-Reports rule).

- **Daily**: targets met (ledger rows) · focus minutes · questions + accuracy ·
  check-in/closeout excerpt · readiness note.
- **Weekly**: trend vs. prior week · consistency (eligible days) · study
  balance by tool · top weakness worked.
- **Monthly**: mastery growth curve · course comparison · habit adherence ·
  journal reflection prompts.
- **Semester**: per-course mastery map · exam outcomes vs. practice
  accuracy · long-trend consistency.
- **Exam**: countdown · question pace vs. plan · weak-objective list ·
  readiness trajectory.
- **Course**: lecture completion grid · pass distribution · question accuracy
  by module · unused resources.
- **Mastery**: engine states with their contribution rows (§4) — the "why"
  view.
- **Study tools**: minutes/outcomes per subscribed tool; effectiveness stated
  only with enough eligible data.
- **Question trends / weaknesses / growth**: accuracy over time by
  discipline/organ/objective; weakness emergence and repair.

Hover reveals real insight (the contributing rows), never hidden raw dumps.

## 7. Readiness system — future inputs (bounded)

Future optional self-report inputs: sleep quality · sleep duration ·
nutrition · hydration · stress · physical wellbeing · mental wellbeing ·
recovery. All manual, all optional, all provenance-labeled, all editable.
**Never medical advice; never diagnosis** — inputs only ever adjust suggested
workload/block size (existing grounded-readiness rule: neutral baseline
ignored, no silent plan mutation). No health-device inference.

## 8. UX consolidation (Dashboard · Command Brief · full-width · daily loop)

- **Dashboard**: the widget audit in
  [DASHBOARD-WIDGET-ARCHITECTURE.md](DASHBOARD-WIDGET-ARCHITECTURE.md) is the
  standing anti-inflation instrument. Every widget must answer: does it
  deserve dashboard space · can it be secondary · can it merge? One
  recommendation system only (Command Brief); no competing suggestion
  surfaces.
- **Command Brief**: refine layout, spacing, button hierarchy, information
  density, and motion — deterministic evidence and "why" rows are untouched.
  Premium comes from restraint.
- **Full-width**: move page shells toward wider layouts with comfortable
  reading measures (target ~68–76ch text columns inside wider grids), better
  hierarchy, less dead whitespace — audited page by page, no layout that
  overwhelms.
- **Daily loop**: morning check-in → Command Brief → study/breaks →
  closeout → journal → reminders should read as one continuous flow; each
  handoff names the next step.
- **Premium UX audit** (every page, pre-Alpha): fewer clicks per common task ·
  typography scale consistency · spacing rhythm · button hierarchy ·
  interaction clarity. Restraint over decoration.
- **Accessibility**: keyboard, screen reader, reduced motion, contrast, touch
  targets, focus states — never regress; the remaining broad contrast/SR
  audit is Ready Next (§1).

## 9. Future accounts (architecture only)

Principle: an account is **optional sync of the same portable payload**, never
a requirement. Design: local-first workspace remains canonical on-device;
account layer syncs the schema-versioned backup payload (same
unknown-field-preserving normalization as backup/restore); device merge reuses
the existing non-destructive merge; migrations run locally with the existing
snapshot/rollback machinery; end-to-end encryption is the target posture;
revocation deletes server copies, local data survives. Users retain
everything across updates, deployments, and devices. No implementation now;
cloud sync hardening remains blocked pending real auth + security review.

## 10. Alpha release checklist (holistic)

Measurable criteria from the architecture review remain the gate (harness
green on corpus · zero false-ready · module import ≥90% correct · grounded
Command Brief · backup round-trip · v32 compatibility · tests+lint green ·
responsive import · honest connector labels · no doc overclaims). Added
product-level sweep before Alpha:

- [ ] Premium UX audit (§8) completed page-by-page, findings fixed or logged
- [ ] No duplicated ideas across surfaces (one recommendation system, one
      weekly interpretation, one mastery story)
- [ ] Every empty state honest and inviting; no fabricated data anywhere
- [ ] Every recommendation shows its "why" rows
- [ ] Accessibility spot-audit on the five core flows
- [ ] Onboarding skimmable; defaults sensible; nothing forced
- [ ] Deferred-item ledger (§1) reflected in ROADMAP statuses
- [ ] Docs claim only measured numbers

---

**Final requirement restated:** do not chase feature count. Every system
reinforces every other system — one intelligent academic workspace, with the
heroic engineering hidden underneath.

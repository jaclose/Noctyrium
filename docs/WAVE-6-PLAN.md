# AXOM Wave 6 — Academic Operating System

*"From Tool → Companion."* Wave 6 is the transition from a polished app to a
genuine academic operating system: Question Bank, Course Tracker, Command
Brief, Dashboard, Productivity, Journal, Reports, and the Daily Loop all
operating from **one underlying evidence model** instead of feeling like
separate apps stitched together.

Recorded 2026-07-14 from the Wave 6 planning directive. Binding companion
specs: [UNIVERSAL-QUESTION-IMPORT-ENGINE.md](UNIVERSAL-QUESTION-IMPORT-ENGINE.md)
and [COURSE-CENTRAL-ARCHITECTURE.md](COURSE-CENTRAL-ARCHITECTURE.md).

## Philosophy

Every feature must be: easier than doing it manually · beautiful enough that
users want to open it · flexible enough for every study style · deterministic
before AI · AI only enhances · local-first · no clutter. Every screen answers:
**"What should I do next?"**

## Three product layers

1. **Layer 1 — Universal Question Import** (immediate core; first real
   implementation attention once fixtures arrive). Spec:
   [UNIVERSAL-QUESTION-IMPORT-ENGINE.md](UNIVERSAL-QUESTION-IMPORT-ENGINE.md).
2. **Layer 2 — Curriculum Template Engine**: maps questions, lectures, DLAs,
   readings, events, cohorts, and tools into a school/term-specific plan.
3. **Layer 3 — Course Central connectors**: future institution-facing
   integration; wireframes/adapters/import contracts only until official APIs,
   permission, and security review exist. Spec:
   [COURSE-CENTRAL-ARCHITECTURE.md](COURSE-CENTRAL-ARCHITECTURE.md).

## Priorities

### P0 — Import Engine 2.0 (highest priority)

One **Import** button replaces everything (no visible "Mass Import"; multiple
files just show "Importing 14 files…"). Supports PDF, images, multiple PDFs,
ZIP, txt, md, docx, copied text, screenshots. Import intelligence recognizes
eSoft/ExamSoft, IMCQ, OPLG, SGU modules, NBME/UWorld/Bootcamp styles, B&B,
First Aid, Pathoma, AMBOSS, lecture slides, calendar exports, and course
software. Per-question confidence (question/answer/explanation/classification/
provenance); below-threshold items go to a card-based **Review Queue**
(Accept/Edit/Skip), never into the Question Bank. Automatic classification
(system, topic, organ, course, term, difficulty, yield, keywords, objective,
sources) — everything editable. **Whole-module import** splits an SGU module
PDF into lectures, DLAs, small groups, readings, practice questions, IMCQs,
eSoft, assignments, calendar events, and objectives with no manual sorting.
Full per-question provenance and version history. Details are binding in the
import-engine spec.

### P1 — Course Tracker 2.0 ("Mission Control")

Setup selects primary program (Medical, PA, Nursing, Dental, Pre-Med, MCAT,
Other) and current stage (SGU Term 1–3+, Step, Clinical, Dedicated, Residency,
…) — always visible, never buried. Entire-module import builds the whole
course automatically: cleaned lecture names (dates removed, numbering kept),
DLA/reading detection, small groups as events, calendar merge, parsed
objectives. **Tool subscriptions**: onboarding asks for **primary study
methods**, not vague questions — e.g. Anki, lecture passes, practice
questions, Boards & Beyond, Sketchy, Bootcamp, First Aid, Pathoma, Noji,
custom (with Noji/mind maps/flashcards/notes as supporting options).
Medical-school tools appear only for medical-school users; pre-med tools only
for pre-med. Subscriptions scope Mastery, Command Brief, Reports, Progress,
Daily Progress, and Suggestions to the tools the learner actually uses — but
never hide necessary practice merely because it wasn't selected. **Mastery
logic** per lecture from completion signals (e.g. 3 passes → Anki created →
green cards maintained → 30 questions → Mastered); pass counts configurable
(3/4/5/custom), user editable, never one forced workflow.

### P2 — Dashboard 2.0

Keep Welcome → Quote → Command Brief on top. Below: Apple-style widget engine
(small/medium/large/XL, resize, drag, keyboard reorder, flip animation,
settings on the back). Widget customization: visible fields, size, color,
priority, refresh behavior, displayed metrics. Soft limit 2–3 XL with
override. **Completely redesign every widget** — premium, purposeful,
beautiful; no generic cards. **Remove AI Suggested Actions permanently.**

### P3 — Command Brief 2.0

**Starter Mode** until enough evidence exists (import a module, create first
task, start timer, set today's goal, write today's intention), then
transforms into the real Command Brief. Ranking inputs: tasks, courses,
practice questions, energy, readiness, habits, focus, time available,
deadlines, exam — all deterministic. **Explain WHY for every suggestion.**

### P4 — Productivity OS

Logging feels instant: Recent, Frequently Used, Smart Suggestions, Study
Templates, Auto Fill. Better wording — "Quantity" becomes Questions, Minutes,
Pages, Cards, Repetitions (no generic "Count"). Daily targets link
automatically with Habits, Activity, Reports, Dashboard, and Command Brief.

### P5 — Journal OS

Foundation is done. Next: customization (paper, ink, fonts, leather, covers,
bookmarks, colors, automatic contrast). Future, as a **separate wave**:
Journal Cinematic (desk, notebook pickup, page turns, physics, images,
animations, optional sounds).

### P6 — Daily Check-In

Morning: intention, priority, expected obstacle, sleep, nutrition, energy,
mood, physical readiness, time available. Evening: wins, losses, reflection,
journal, tomorrow. Reminder default 8:30 PM, user editable.

### P7 — Reports 2.0

More insight, fewer raw numbers: weekly/monthly trends, heatmaps, consistency,
study balance, tool effectiveness, question accuracy, mastery growth, time
allocation, course comparison. Hover shows real insight, not hidden data.

### P8 — Daily Word

Add statistics, countdown, sharing, animations, better typography, an
achievement system — and Doctordle when the partnership completes.

### P9 — Identity

Cleaner, premium, more personal: program, term, primary focus, current
streak, goals, study philosophy, Promise. Easy editing.

### P10 — Help

Mini tours for every module: small, replayable, never annoying.

### P11 — Backup ("game-save feeling")

Rename the experience: Create Save File · Load Save · Backup Library ·
Recovery · Version History — instead of "Export JSON".

### P12 — Future accounts (architecture only, not now)

Account → sync → migration → schema upgrades → keep everything forever. **No
user should lose data after updates.**

## Design direction

Apple · Linear · Raycast · Arc · Notion Calendar. Glass / liquid glass, warm
stone, black, graphite, soft gold, Dune typography. Fewer borders, more depth,
fewer-but-better widgets, better whitespace. Everything should breathe.

## Rules going forward (every future feature must satisfy all)

1. Remove clutter before adding UI.
2. One obvious path for every common task.
3. Every recommendation must be explainable.
4. AI enhances decisions, never replaces deterministic logic.
5. Preserve all user data through every schema update.
6. Feel like a trusted study companion, not a collection of utilities.
7. If a feature can be inferred automatically, don't ask the user.
8. Configurable things get sensible defaults with advanced overrides.
9. Premium visuals never cost speed, clarity, or accessibility.
10. **Institution-agnostic by construction.** Do not optimize for the current
    SGU corpus alone. Every new school document format must land as a reusable
    parser strategy or curriculum template — never as special cases in shared
    code. AXOM gets progressively smarter with each supported institution
    without increasing complexity for existing users.

## Phase gates (6A–6E)

Implementation proceeds in lettered phases, each separately reviewable — never
one combined implementation commit. Each phase has an explicit blocking
condition:

| Phase | Scope | Gate |
| --- | --- | --- |
| **6A — Corpus & structural engine** | fixture registry, normalized document/page model, intake, family classification, segmentation, Practice Packet + ExamSoft strategies, answer-line resolution, cross-file pairing, provenance, diagnostics, unified Import — execution contract: [WAVE-6A-EXECUTION-PLAN.md](WAVE-6A-EXECUTION-PLAN.md) | **Blocked until (a) the original 63-section spec is supplied as `docs/PARSER-SPEC-ORIGINAL.md` and reconciled (Step 0) and (b) the corpus file list is confirmed and registered** (import spec §26; candidates exist locally — see execution plan Step 2); fixtures land before parser code |
| **6B — Slide intelligence** | duplicate-slide removal, question/answer slide pairing, checkmark/highlight/bold detection, explanation boxes, teaching-slide exclusion, IMCQ/OPLG | Blocked until real IMCQ/OPLG slide fixtures exist in the corpus |
| **6C — Assets & tables** | image association, attachments, crops, tables, missing-asset policy, source retention | Blocked until the source-binary retention decision is made (see ROADMAP) |
| **6D — Curriculum templates** | curriculum graph, SGU Term 3 template as data, chronology, cohort/college, question readiness, tool-aware mastery | May begin as a **data-only template prototype** (no SGU hard-coding in shared code) |
| **6E — Course Central Level 0** | manual imports, announcements, assignments, calendars, source labels, local summaries | Level 0 only; Levels 1–3 per the Course Central spec — **no live connector** |

## Standing constraints for this wave

- No live Sakai/Canvas/Elentra connector work (Course Central is design-only;
  Levels 2–3 gated on authorization and security review).
- Acceptance targets in the import spec are claims to be **measured**, never
  asserted.
- Deliverable-stage work is not committed, pushed, or deployed without
  explicit direction.

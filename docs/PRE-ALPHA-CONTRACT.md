# AXOM Pre-Alpha Master Implementation Contract (Wave 6A → Alpha)

Status: **binding master contract**, recorded 2026-07-15. This document
freezes the vision. Planning is complete. Every prompt and session between
now and Alpha either **implements one checkpoint, tests one checkpoint, or
reviews one checkpoint** — nothing else.

## Golden rule

This is no longer a planning project. Do not redesign major systems. Do not
rewrite accepted architecture. Do not introduce unrelated ideas. **Build the
system already designed.**

Every implementation decision answers one question: *"Does this help the
student study better today?"* If no, it belongs in a future wave.

## Binding documents (in precedence order for conflicts)

1. The original 63-section parser specification, once supplied as
   `PARSER-SPEC-ORIGINAL.md` (stricter reading always wins)
2. [UNIVERSAL-QUESTION-IMPORT-ENGINE.md](UNIVERSAL-QUESTION-IMPORT-ENGINE.md)
3. [WAVE-6A-EXECUTION-PLAN.md](WAVE-6A-EXECUTION-PLAN.md) (Steps 0–13 — no
   skipping, no combining stages)
4. [COURSE-CENTRAL-ARCHITECTURE.md](COURSE-CENTRAL-ARCHITECTURE.md)
5. [WAVE-6-PLAN.md](WAVE-6-PLAN.md) (priorities P0–P12, rules 1–10, phase
   gates 6A–6E)
6. [WAVE-6-CONSOLIDATION.md](WAVE-6-CONSOLIDATION.md) (deferred tiers,
   knowledge graph, mastery engine, wireframes, Alpha checklist)
7. [ROADMAP.md](../ROADMAP.md) (living status ledger) ·
   [FEATURES.md](../FEATURES.md) (shipped truth)
8. Subsystem contracts:
   [QUESTION-IMPORT-EVALUATION-HARNESS.md](QUESTION-IMPORT-EVALUATION-HARNESS.md) ·
   [COMMAND-BRIEF-EVIDENCE.md](COMMAND-BRIEF-EVIDENCE.md) ·
   [TARGET-CONTRIBUTION-LEDGER.md](TARGET-CONTRIBUTION-LEDGER.md) ·
   [JOURNAL-NOTEBOOK-ARCHITECTURE.md](JOURNAL-NOTEBOOK-ARCHITECTURE.md) ·
   [DASHBOARD-WIDGET-ARCHITECTURE.md](DASHBOARD-WIDGET-ARCHITECTURE.md)

## The six pillars

Everything AXOM builds — including every deferred item — belongs to exactly
one of these:

1. **Universal Question Import Engine** — the flagship. Everything else is
   secondary.
2. **Course Central + Course Tracker** — the semester brain.
3. **Command Brief + Daily Loop** — the decision engine.
4. **Academic Mastery + Reports** — the analytics engine.
5. **Journal + Reflection** — the long-term memory.
6. **Knowledge Graph** — the invisible intelligence tying them together.

A proposal that fits none of these pillars is out of scope before Alpha.

## Seventh pillar (meta principle)

AXOM is not a collection of features. AXOM is a single operating system —
*a local-first academic operating system that continuously understands a
student's curriculum, study resources, progress, and decisions, then quietly
recommends the next highest-value action while remaining fully explainable.*

Every new feature must improve one of the six systems above. If a feature
does not strengthen one of them, it is deferred until after Alpha.
**The default decision is no.**

## AXOM design philosophy (permanent)

AXOM never competes for the user's attention — it quietly organizes it. It
never overwhelms with possibilities — it reduces uncertainty. Every
recommendation is explainable. Every workflow feels natural. Every feature
strengthens another feature; nothing exists in isolation. **Complexity
belongs inside the software, not inside the user's head.** Premium software
is defined not by how much it can do, but by how little the user has to think
while doing difficult things.

**Identity-driven development:** every checkpoint asks *"does this still feel
like AXOM?"* before *"what should AXOM do next?"*

**The five working levels** (always in this order): 1 — product vision (what
feeling should this create?) · 2 — user psychology (what is the user
thinking, and what should they be thinking?) · 3 — system design (how do all
existing systems become stronger — one action, many systems smarter?) ·
4 — UI (the visual consequence of good architecture) · 5 — implementation.
Never start at level 4 or 5.

**Four questions before any feature:** What would make this disappear
(remove friction instead of adding UI)? · What makes this delightful (small
moments, not flash)? · What makes this trustworthy (show me why — trust
compounds)? · What survives five years?

**The 500-Hour Rule:** every interface must become *better* after the 500th
use, not just impressive on the first. For every page ask: would this annoy
me after six months of daily use? Is there unnecessary motion, text,
clicking, or decoration? Does this save me thought instead of demanding it?

## Engineering rule — no black boxes

Every major feature must expose its logic. Users must always be able to
answer:

- Why was this recommended?
- Why is this mastery score changing?
- Why is this lecture next?
- Why is this question considered high priority?
- Why did the parser choose this answer?

**Every recommendation has an evidence panel** — the same inspectable
contribution rows the ranking/scoring function actually used, never a
reconstructed explanation (the Command Brief pattern is the reference
implementation).

## Accepted work — do not regress

Dashboard · Widget Engine · Command Brief · Reports · Daily Word · Daily
Games · Backup · Local-first · Question Bank · Journal Foundation · Daily
Progress · Productivity · Parser trust · Provenance · Import verification ·
Data durability.

## Implementation order

Wave 6A Steps 0–13 exactly as written in
[WAVE-6A-EXECUTION-PLAN.md](WAVE-6A-EXECUTION-PLAN.md). The corpus defines
behavior — nothing is built around assumptions. Each step lands with its own
fixtures, tests, diagnostics, and evidence, and the Step 13 gate (all seven
verification commands + independent review) closes the wave.

Standing invariants: deterministic · inspectable · evidence-based ·
provenance-aware · AI optional and never load-bearing · every parser decision
explainable.

## Contract-level directives (beyond the parent docs)

- **Question Bank**: keep simplifying — easier navigation, less duplication,
  lower cognitive load. "Mass Import" becomes **Import**, with copy
  explaining that multiple files are supported.
- **Command Brief**: larger controls, better hierarchy, premium interactions,
  immediate usefulness; evidence always visible.
- **Daily Check-In**: morning (intention, priority, energy, sleep, nutrition,
  wellbeing, expected blocker) · evening (closeout, wins, journal,
  reflection, day-at-a-glance). Optional, never overwhelming.
- **Course Central adapter targets** (read-only, only when officially
  supported; adapters only, never hard-coded): Canvas · Sakai · Brightspace ·
  Moodle · Blackboard · Elentra · **One45 · Leo · MedHub · New Innovations**.
  Long-term objective: replace constant LMS usage.
- **Institution templates**: Medical School · Pre-Med · PA · Dentistry ·
  Nursing · Graduate. New institution support never requires rewriting AXOM.
- **Performance**: heavy work in workers/lazy routes/background processing.
  Dashboard startup time never increases.
- **Deferred features**: implement strictly by the consolidation tiers
  (Ready Next → Foundation Required → Future Alpha → Beta → V2). None are
  forgotten — the ledger explicitly includes Journal Cinematic, Knowledge
  Graph, institution templates, community curriculum submission, the adapter
  ecosystem, Reports 2.0, readiness evolution, account architecture, source
  binary retention, OCR, the visual parser, asset intelligence, template
  learning, parser upgrades, user-correction learning, and community parser
  templates.

## Implementation cadence (from here to Alpha)

Implement one checkpoint → test with real SGU files → fix →
**use it yourself for a week** → notice friction → improve → repeat.

Real usage outranks planning; design documents are no longer produced except
to record decisions forced by real usage.

## Alpha must-have tiers

- **Tier 1 (critical):** Universal Import Engine · rock-solid local storage ·
  reliable backup/restore · Course Tracker · Command Brief · Question Bank ·
  the daily workflow.
- **Tier 2 (strongly recommended):** mastery calculations · tool
  subscriptions · Reports · better onboarding · premium UI polish · import
  review queue.
- **Tier 3 (can wait):** Journal Cinematic · accounts/sync · OCR · community
  templates · live LMS adapters · advanced AI enrichment · knowledge-graph
  expansion beyond phase-1 edges.

Tier 3 items ship after Alpha regardless of enthusiasm.

## Gate status at contract signing (2026-07-15)

| Gate | Status |
| --- | --- |
| Step 0 — `PARSER-SPEC-ORIGINAL.md` supplied + reconciled | **Blocked on Jafar** |
| Step 2 — corpus list confirmed + per-file legal marking | **Blocked on Jafar** (candidate manifest: [CORPUS-CANDIDATES.md](CORPUS-CANDIDATES.md)) |
| Isolated documentation commit (precondition 7) | **Awaits explicit instruction** |
| Everything else in Steps 1–13 | Ready to execute in order once the above clear |

No commit, push, deploy, schema bump, or storage-key change happens without
explicit instruction. Local-first is never compromised.

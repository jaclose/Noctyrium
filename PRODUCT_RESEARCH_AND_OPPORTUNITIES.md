# Product Research & Opportunities

Research scan of best-in-class study, productivity, and AI-assisted learning tools, distilled
into what this app should adopt, avoid, and build next. The frame for every judgment is the
product's central job: **open the app overwhelmed → leave with one clear next move**, and the
daily loop *Open → Orient → Commit → Study → Capture → Review → Recover → Return tomorrow*.

---

## 1. Key patterns worth adapting

| Pattern | Seen in | Why it earns a daily open |
|---|---|---|
| **One next action, not a list** | Motion, Sunsama, Reclaim | Auto-planners win because the user never triages. The moment a dashboard shows five "urgent" items it has failed at Orient. |
| **Absolute-timestamp timers** | Forest, Toggl, Session | Timers that survive sleep/refresh build trust; visible counters that drift destroy it. Source of truth must be wall-clock timestamps, never a ticking integer. |
| **Daily shutdown ritual** | Sunsama's daily planning/reflection, Todoist's daily review | A 60–90 second closeout converts today's chaos into tomorrow's plan and is the single strongest "return tomorrow" mechanic. Sunsama caps it in time; that cap is the feature. |
| **Error logs as first-class assets** | UWorld-style qbanks, top scorers' spreadsheets | Med students already keep missed-question logs in spreadsheets. The tool that makes a missed question one-tap capturable — with *why* it was missed — replaces the spreadsheet. |
| **Review-before-new scheduling** | Anki, RemNote, AnkiHub | Spaced repetition works because the queue decides for you. Any card feature must ship with a due queue, not a card list. |
| **Confidence + reason capture at answer time** | UWorld, Amboss | Marking "guessed" vs "knew it" at answer time is cheap; reconstructing it later is impossible. Capture must happen in-flow, in one tap. |
| **Explanations that teach why the wrong options are wrong** | UWorld, Amboss | Distractor reasoning is where the learning is. Card/question generation should target "why not the others". |
| **Local-first, exportable data** | Obsidian, Anki | The trust story ("your data is files/exports you own") is a durable moat with students burned by subscription lock-in. |
| **Calm recovery, not streak guilt** | Forest's gentle framing vs Duolingo's streak anxiety | Missed-day flows that shame produce churn in high-pressure users. Recovery should sort, shrink, and restart — never scold. |
| **Templates for how to study, not just what** | StudySmarter guides, Notion templates | Naming a protocol ("exam-week triage", "low-energy protocol") reduces decision fatigue at the worst moments. |
| **AI as structured output behind review gates** | Modern AI note/card tools that survived | Users keep AI features that produce *editable drafts* validated against a schema. They abandon fire-and-forget generation. |
| **Onboarding that personalizes by asking 3 things, not 30** | Todoist, Notion | Ask program, phase, exam date. Everything else should be inferred or deferred. |

## 2. Patterns to avoid

- **Widget-wall dashboards** (generic Notion dashboards): passive stat displays don't answer "what now?". Stats belong behind the decision, not in front of it.
- **Streak-based guilt and red-alert theatrics** (Duolingo-style): actively harmful for behind/overwhelmed users — the exact users this product serves.
- **Fake AI buttons** that render canned text: users detect it within a session and downgrade their trust in the whole product.
- **Card confetti**: bulk-generating hundreds of low-quality cloze cards (a failure mode of most "AI flashcard" tools). Volume is a cost, not a feature.
- **Gamified XP/leaderboards as core loop** (Quizlet drift): entertaining for casual learners, irrelevant or insulting under real exam pressure.
- **Hover-only or buried critical actions**: study tools get used at 1 a.m. on trackpads; controls must be visible.
- **Mandatory accounts/cloud before value**: Anki and Obsidian prove local-first with optional sync wins serious learners.
- **Planning tools that take longer than the work** (heavyweight Notion setups): if closeout takes 10 minutes it will be skipped on exactly the days it matters.

## 3. Competitor comparison

| Tool | Strengths | Weaknesses (our opening) |
|---|---|---|
| **Anki** | Best-in-class scheduler; local-first; ecosystem (AnKing) | No planning layer; zero guidance on *what* to study; brutal UX; no error context |
| **AnkiHub / AnKing** | Curated, collaboratively maintained decks | Deck-consumption model; doesn't connect to your courses, errors, or schedule |
| **RemNote** | Notes ↔ cards in one graph | Heavy; note-first not decision-first; overwhelmed users bounce |
| **Quizlet** | Frictionless card creation; ubiquity | Shallow recall; ad-laden; not trusted for med-level depth |
| **Notion** | Infinitely flexible; templates | Everything is DIY; maintaining the system becomes procrastination |
| **Obsidian** | Local-first trust; plugins | Same DIY tax; no opinion about what to do next |
| **Motion / Reclaim** | Auto-scheduling removes triage | Calendar-centric, work-oriented; no learning model, no error/retention data |
| **Sunsama** | Daily planning + shutdown ritual; calm tone | $20/mo; no academic concepts; no question/card layer |
| **Todoist** | Fast capture; natural-language dates | Flat tasks; no notion of mastery, energy, or exams |
| **Forest** | Session commitment device; gentle | Single-mechanic; no content or planning |
| **UWorld-style qbanks** | Gold-standard questions + explanations; performance analytics | Closed silo; your errors die inside it; no cross-resource planning |
| **Amboss / Osmosis** | Integrated library ↔ questions; clinical depth | Expensive; content-first not workflow-first; no personal operating loop |
| **StudySmarter / Cram** | Study sets + guides | Undifferentiated; weak scheduling science |
| **Readwise** | Resurfacing highlights daily; excellent email/queue loop | Reading-centric; no exam pressure model |
| **Claude / ChatGPT / Gemini** | Explain anything, generate anything | Stateless about *you*: no deadlines, error history, retention data; output is unstructured and unvalidated |

## 4. Product opportunities (10+)

1. **Command Brief** — a rules-driven (later AI-assisted) top-of-app answer to "what now?": one mode, one next move, one fallback. No competitor combines deadlines + backlog + error data + energy into a single decision.
2. **Session engine with honest timers** — timestamp-based sessions tied to a specific task, surviving sleep/refresh, capturing confidence/blockers at close. (Forest's commitment + Toggl's reliability + academic context.)
3. **Daily Closeout in under 90 seconds** — Sunsama's ritual, stripped to taps: done/remaining/blocker/tomorrow's first task/energy. Feeds tomorrow's brief.
4. **Recovery Protocol as a feature, not an apology** — detect missed days/backlog, triage work into non-negotiable / high-yield / deferrable / droppable, emit a 24h restart + 72h stabilization plan. Nobody does this; every med student needs it monthly.
5. **Question Workspace + error taxonomy** — paste/upload questions, log *why* each miss happened (12-type taxonomy), surface repeat-offender patterns. Replaces the error-log spreadsheet and outlives any single qbank subscription.
6. **Error → card pipeline** — a missed question becomes a draft "error-repair" card in one tap, with provenance. The single highest-leverage link in the loop (Capture → Review).
7. **Local AI via Ollama, no key required** — private, free card/plan/error analysis for exactly the audience that won't paste patient-adjacent or licensed content into cloud chatbots. Cloud BYOK stays optional behind a proxy-ready abstraction.
8. **Faculty Style Analyzer** — aggregate structural patterns of a professor's/institution's question sets (stem length, "next best step" frequency, distractor shapes) to focus prep. Careful, hedged language; genuinely novel.
9. **Study Methods library with "when NOT to use it"** — named, evidence-informed protocols insertable into a day plan; the anti-decision-fatigue move.
10. **Data trust surface** — visible storage health, last-backup age, export/import with merge preview, migrations that never drop unknown keys. Trust is a feature you can see.
11. **Update flow that respects sessions** — version manifest + calm "update when ready" notice that never reloads over an active session.
12. **Readiness-aware fallback plans** — Minimum Viable Win generated from real data (8 due cards, 5 linked PQs) so a bad day still moves the loop.

## 5. Five highest-leverage features for daily use (ranked)

1. **Command Brief** — creates the daily open; everything else feeds it.
2. **Begin Session engine** — converts the decision into tracked work; source of the performance data everything else consumes.
3. **Daily Closeout** — closes today's loop and pre-loads tomorrow's open; cheapest retention mechanic per second of user effort.
4. **Question Workspace with error taxonomy + error→card pipeline** — makes the app valuable *during* studying and turns failures into assets.
5. **Recovery Protocol** — captures the highest-intent moment (returning after falling behind), which is when most tools lose the user forever.

## 6. Why would someone open this every day instead of Anki, Notion, or ChatGPT?

**Anki** tells you which *cards* are due, but not whether cards are even the right move today — it has no concept of your exam in 6 days, your backlog, or your 40% complement-question accuracy. This app decides *whether* to Anki, *what* to Anki, and builds the deck from your actual errors.

**Notion** is a workshop where you must build and maintain the machine yourself; under pressure the maintenance is the first thing to collapse, and then the system shames you with its own staleness. This app *is* the machine: it re-plans itself every morning from data captured as a side effect of studying, and its recovery mode is strongest exactly when a Notion setup would be most abandoned.

**ChatGPT/Claude** can explain anything but knows nothing about you at 7 a.m.: not your deadlines, your missed sessions, your weak topics, or what you said last night in closeout. This app owns that state locally, uses rules you can read (and optionally a local model) over it, and produces one committed, trackable next action — not another wall of text to interpret.

The honest daily-open case: **before studying** it removes the triage ("what now?" answered in one card); **during studying** it holds the timer, the task, and one-tap error capture; **after studying** a 90-second closeout guarantees tomorrow starts pre-decided. Each visit deposits data that makes the next visit smarter — a compounding loop none of the three incumbents closes.

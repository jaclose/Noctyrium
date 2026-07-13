# Dashboard widget architecture and audit

Status: implemented in the Wave 5.5D working checkpoint; independent acceptance
is still pending. This document audits the accepted dashboard before the rehaul
and records the compatibility, catalog, layout, and accessibility contracts the
implemented engine enforces.

The dashboard's job is to answer three questions in order:

1. What matters now?
2. How is today going?
3. Where should I act next?

Welcome + Quote and Command Brief are primary dashboard surfaces, not ordinary catalog cards. They remain above the customizable grid so a layout choice cannot hide the dashboard's orientation or best-next-action layer.

## Existing-widget audit

The accepted pre-rehaul model knew 15 IDs: 14 renderable IDs plus the
storage-only `aiActions` compatibility ID. The Wave 5.5D catalog keeps adapters
for all of them and adds explicit product-facing IDs; “Priority” below describes
visual prominence, not data importance.

| Current ID | Purpose and user question | Primary action | Canonical source | Usefulness and redundancy | Honest empty state | Priority | Supported sizes | Useful settings | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `winDay` | Set an intention and close the day: “What would make today count?” | Set/reopen check-in or complete closeout | `dayPlans`, `closeouts`, daily-loop reminder preferences and device reminder ledger | High-value daily-loop entry. Its old outcome controls overlap Journal closeout, so the two states should share one widget rather than two prompts. | Invite an optional check-in; never imply a missed day before the configured reminder. | Core | small, medium, large | show win conditions, context detail, reminder shortcut | **Keep and evolve** as Daily Check-In / Closeout. |
| `todayScore` | Explain scheduled targets: “Which targets count today, and what has contributed?” | Open target controls | canonical daily-success evaluator and contribution ledger | High-value, non-duplicative when it shows native progress and provenance rather than a generic score. | “No targets scheduled today” with Choose targets; zero is neutral. | Core | small, medium, large, extra-large | visible targets, compact/detailed, provenance | **Keep** as Today’s Targets. |
| `examCountdown` | Show exam horizon and question pace: “How close is my selected exam?” | Open the selected prep lane | `boardPrep`, selected focus exam, trusted question progress | Useful only with a real exam focus. Question totals must not duplicate a Question Bank widget beyond one concise pace indicator. | Do not render without a selected prep lane; if the lane exists without a date, invite Set exam date. | Contextual | small, medium, large | exam focus, question pace, milestone | **Keep conditionally** as Upcoming Exam. |
| `pomodoro` | Start or inspect a focus block: “Can I begin focused work now?” | Start/pause timer | canonical Pomodoro store and session lifecycle | High-value direct action; not a summary tile. | Timer remains usable with no history or intention. | Core | small, medium, large | preset, visible intention, compact controls | **Keep** as Focus Timer. |
| `weekly` | Summarize seven days: “What changed this week?” | Inspect a day or open Reports | logs, tasks, journal, readiness, daily-success eligibility | Useful trend surface, but duplicates `productivityTrend` and parts of `schedule`. It should own the canonical weekly interpretation. | “Not enough eligible days yet”; pre-tracking days stay neutral. | Core | small, medium, large, extra-large | metric, range, show daily columns, provenance | **Keep and merge** productivity trend plus the useful weekly part of schedule. |
| `suggested` | List reactive tracker/task jumps: “What could I do next?” | Open a suggested item | legacy `buildSuggestions` output from tasks/tracker state | Redundant with the evidence-ranked Command Brief and weaker because its rationale is not canonical or inspectable. | N/A after removal; old visibility/order data remains harmless. | Removed | none | none | **Remove from ordinary catalog and rendering**; preserve the ID only for safe preference hydration. |
| `aiActions` | Historical provider/action queue | None in the current product | legacy stored preferences; provider infrastructure remains elsewhere | Explicitly removed. It implies an AI recommendation surface and duplicates Command Brief. | Never show a user-facing empty card. | Storage only | none | none | **Retain as storage-only compatibility metadata**; never list in current, experimental, or available catalogs. |
| `schedule` | Show a month activity map: “When was I active?” | Inspect a day / remediate a missed journal day | logs, tasks, missed-journal selector | Calendar context is useful, but the card mixes activity, journal remediation, tracker-pass legends, and trend commentary. Much of it duplicates Reports and Weekly Trend. | Neutral calendar with tracking-start boundary; no retroactive failure color. | Secondary | medium, large, extra-large | activity metric, month, legend | **Merge** the activity calendar into Weekly Trend/Reports; retain a compatibility adapter until layouts normalize. |
| `termMap` | Summarize course structure: “Where is my course work concentrated?” | Open Course Tracker | terms, courses, tracker rows and pass state | Useful domain summary, but the full term sequence is too dense for the dashboard and duplicates Course Tracker. | Invite Add or import a course; never show fabricated readiness. | Core/contextual | small, medium, large | selected course/scope, weak/untouched emphasis | **Replace** with a concise Course Tracker widget; map the old ID through the adapter. |
| `localData` | Show data safety: “Is my local workspace protected?” | Export backup / open Data settings | persistence health, backup state, app/package facts | Useful reassurance, but technical vault/package detail must not compete with daily work. | Explain local-first storage and offer a portable save; no raw payload or schema jargon. | Hidden by default | small, medium | last save, backup status, compact/detailed | **Keep hidden by default** as Local Data Health. |
| `latestStandup` | Recall the latest journal entry: “What did I last record?” | Open Journal | journal entries | Useful continuity, but a raw latest-entry card is weaker than the planned Journal widget and may expose more text than expected on the dashboard. | Invite a first journal entry without moralizing. | Secondary | small, medium, large | excerpt visibility, energy, day-at-a-glance | **Replace** with Journal; keep the legacy ID adapter. |
| `productivityTrend` | Interpret logged effort: “Is productivity moving?” | Open Reports | canonical performance analysis and weekly summary | Direct duplicate of `weekly`; a second score/commentary card adds equal visual weight without a new job. | “Not enough eligible data yet”; never generate a score from seed data. | Removed/merged | none after merge | none after merge | **Merge into Weekly Trend** and omit from ordinary catalog. |
| `premedHours` | Track experience hours: “How is my pre-health portfolio progressing?” | Open Pre-Med | `premedExperiences` and verification flags | Valuable for pre-health paths, irrelevant for other profiles. Fixed hour targets must not masquerade as user requirements. | Invite the first experience; show zero neutrally and label user/configured targets. | Contextual | small, medium, large | categories, user targets, verification | **Keep conditionally** for relevant study paths. |
| `resourceFocus` | Surface favorites: “Which saved resources should I reopen?” | Open a favorite or Resource Library | resources and favorite flags | A convenient shortcut, but not a core dashboard question and empty for most new users. It can become a configurable field in Course Tracker or a secondary utility. | Invite Favorite a resource; no generic placeholder links. | Secondary | small, medium | number shown, category filter | **Merge or demote**; omit from focused preset. |
| `boardBlueprint` | Summarize installed prep blueprints: “How is my selected prep lane progressing?” | Open selected board/pre-health lane | blueprint installs, nodes, mastery | Useful only when installed; otherwise overlaps Upcoming Exam and Course Tracker with internal “container” language. | Invite choosing a sourced prep plan in plain language; no empty percentage. | Contextual | small, medium, large | lane, mastery fields, weak scope | **Merge** into Upcoming Exam/Course Tracker according to the active lane; retain compatibility mapping. |

### Audit decisions that are not optional

- `aiActions` is never a user-facing catalog item. It remains accepted only during hydration/backup so old preferences are not destructively rewritten.
- `suggested` is superseded by Command Brief and must not appear in Suggested, Available, Experimental, or Hidden catalog sections.
- `productivityTrend` is merged into Weekly Trend instead of becoming a second diagnostic tile.
- Raw storage, schema, provider, parser, and build diagnostics are Settings/Advanced concerns, not dashboard widgets.
- Removing or merging a widget changes presentation only. It never deletes its source records or silently drops its legacy preference fields.

## Target dashboard surfaces and core catalog

This is the product-facing catalog after adapters translate old IDs. A missing renderer is recorded honestly rather than filled with a vague metric card.

| Product widget | Current adapter or disposition | Core user question | Default placement |
| --- | --- | --- | --- |
| Welcome + Quote | Keep as a fixed orientation surface, not a catalog item | What day is it, and what calm context opens the workspace? | Fixed above the grid |
| Command Brief | Keep as the fixed primary action surface, not a catalog item | What is the best grounded next action and why? | Fixed above the grid |
| Daily Check-In / Closeout | `winDay` | What would make today count, and should I close the loop? | Focused preset |
| Today’s Targets | `todayScore` | Which scheduled signals are complete and why? | Focused preset |
| Focus Timer | `pomodoro` | Can I begin or resume focused work? | Focused preset |
| Weekly Trend | `weekly` plus accepted fields from `productivityTrend` / `schedule` | What changed over eligible days? | Focused preset |
| Upcoming Exam | `examCountdown`, with board context where relevant | What is approaching and what pace is grounded? | Suggested when configured |
| Course Tracker | implemented renderer, legacy `termMap` adapter | Which course/module needs attention? | Study-heavy preset |
| Question Bank | implemented trusted-mapping renderer | What trusted practice is due or ready? | Study-heavy preset |
| Tasks | implemented user-task renderer | What is due, overdue, or next? | Suggested when tasks exist |
| Energy / Readiness | implemented renderer using canonical readiness provenance | What capacity signal should shape today? | Wellbeing-balanced preset |
| Activity / Productivity | implemented as today/recent activity, distinct from the eligible-day Weekly Trend | What have I logged today? | Suggested |
| Journal | implemented renderer, legacy `latestStandup` adapter | What was captured today and what remains open? | Wellbeing-balanced preset |
| Streak / Consistency | implemented from schedule-aware daily-success history | How consistently did I meet eligible days? | Available, not focused by default |
| Daily Word | implemented optional renderer; module remains optional | Is today’s local puzzle available or complete? | Available |
| Local Data Health | `localData` | Is this device-local workspace protected? | Hidden by default |
| Pre-Med Hours | `premedHours`, path-gated | How is my experience portfolio progressing? | Suggested only for pre-health profiles |

Welcome + Quote and Command Brief are intentionally outside the editable catalog because users cannot remove the dashboard's orientation and primary recommendation by editing the widget grid. Command Brief remains deterministic and inspectable; it is never relabeled as AI output unless provider-backed AI actually contributed.

## Size contract

- **Small**: half-width at desktop; one primary value or action, one short state label, and no hidden essential meaning.
- **Medium**: normal one-card view; two to four insights and one compact action.
- **Large**: two-column-span interactive view with a chart, list, or richer direct action.
- **Extra-large**: full-width focused workspace. It must add real capability rather than duplicate the destination page.

Every active catalog definition declares its supported sizes and a field map for each size. Legacy widgets without a completed renderer remain medium through their adapter; no content is guessed from an unrelated widget.

The engine recommends no more than three extra-large widgets. Adding a fourth presents this advisory choice:

> AXOM usually recommends no more than three extra-large widgets to keep the dashboard readable. Continue anyway?

The actions are **Keep recommended layout**, **Add anyway**, and **Do not ask again**. This is a recommendation, never a hard limit and never a reason to resize or remove another widget automatically.

## Settings contract

Only meaningful fields are configurable. Each configurable widget uses the same top-right settings control:

- accessible name includes the widget title;
- `aria-expanded` and `aria-controls` describe the settings reveal;
- opening moves focus to the settings surface and closing returns focus to the trigger;
- Escape and Cancel discard unsaved drafts; Save applies atomically;
- reduced motion swaps front/settings content immediately;
- front and settings views are never simultaneously exposed to assistive technology;
- the card avoids mirrored text and preserves its dimensions where practical.

Shared settings may include size, visible fields, compact/detail mode, title, range, primary action, threshold, accent, and provenance. A widget must not expose a setting merely to make the panel look full.

## Responsive grid and ordering

- Desktop uses a two-column base. Small occupies one column; medium may occupy one or two according to its content contract; large normally spans both; extra-large spans the full grid.
- Tablet supports one or two columns without changing semantic order.
- Mobile is one column with no horizontal overflow.
- DOM order is keyboard and screen-reader order.
- Pointer/touch dragging is optional convenience. Move earlier/later controls and a polite position announcement are required.
- Reordering, resizing, hiding, and changing presets do not delete widget or module data.

## Catalog interaction

The editor is headed **Build your dashboard** with the explanation **Choose what deserves your attention. Hidden widgets keep their data.** It has these sections:

- On your dashboard
- Suggested
- Available
- Experimental
- Hidden

Preview cards show name, purpose, supported sizes, current data status, Add/Remove, and configuration when meaningful. Presets are Focused, Study-heavy, Wellbeing-balanced, and Custom. Restoring a preset changes layout fields only.

Catalog membership is derived from active, product-facing definitions—not from every ID accepted by the persistence layer. This separation is what keeps storage-only, removed, and future unknown IDs from leaking into ordinary UI.

## Visual system

Widgets share tokens rather than one uniform card treatment:

- size and span tokens;
- compact/standard/workspace padding;
- restrained glass and border levels;
- a compact functional icon container;
- one focal element and one primary action;
- an honest empty-state style;
- chart colors with text summaries;
- settings-state and focus treatments;
- short opacity/transform transitions with an immediate reduced-motion path.

Gold is a restrained selected/accent state, not a dashboard-wide glow. Icons communicate function. Hover may reinforce affordance but never carry the only meaning.

## Persistence, compatibility, and backup

Persist only user choices:

- order and visibility;
- size;
- enabled fields and widget-specific preferences;
- selected preset;
- dismissal of the extra-large recommendation.

Do not persist computed metrics, hover/focus, open settings state, or animation state.

The additive layout object remains optional in the profile so schema v32 can be retained. Normalization and backup rules must:

- adapt every known old ID;
- retain `aiActions` and other removed IDs as inert storage metadata when encountered;
- tolerate unknown future IDs and unknown future preference fields without crashing;
- apply defaults only when no explicit layout exists;
- preserve hidden and ordered data across replace restore and deterministic merge;
- keep all workspace payloads in IndexedDB, never localStorage;
- never delete source records when a widget disappears.

## Acceptance matrix

Before the widget rehaul is accepted, automated coverage must prove:

- every old widget ID normalizes without a crash;
- `aiActions`, `suggested`, merged duplicate trend cards, and raw diagnostics are absent from ordinary catalog sections;
- unknown and removed IDs survive safe round-trip handling without rendering;
- add/remove/reorder/keyboard reorder work without deleting data;
- small, medium, large, and extra-large spans respond correctly;
- the fourth-extra-large warning can be accepted, declined, or permanently dismissed;
- settings focus, Escape, cancel, save, and reduced-motion behavior are correct;
- mobile has no horizontal overflow and 44px action targets;
- profile hydration, backup replace, and deterministic merge preserve layout choices;
- changing presets never changes the underlying tasks, questions, logs, journal, timer history, course data, or module enablement.

Route-level code splitting, Journal Cinematic, and broad page redesign remain separate checkpoints. The widget engine must not absorb them merely because it touches the dashboard.

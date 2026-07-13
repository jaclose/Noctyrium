# Command Brief evidence and ranking

Status: deterministic evidence gate and ranking implemented in Wave 5.5D.
Command Brief is not presented as AI-generated.

## Product contract

Command Brief names one supported next action, explains why it ranked first,
estimates effort, states a useful completion outcome, and offers a smaller
fallback. It remains in a Learning state until the workspace contains real,
rankable evidence.

Shipped examples, templates, and starter tasks can teach the interface but do
not activate a recommendation. The engine recognizes template course/tracker
fingerprints and explicit seed/template origins. Question work is rankable only
when the canonical mapping classifier says it is ready.

## Activation gate

`assessCommandBriefEvidence` separates three kinds of evidence:

- **Actionable work:** open user tasks, active real Course Tracker items,
  trusted due questions, unfinished scheduled targets, and recurring habits
  genuinely due today.
- **Current context:** today’s activity, practice attempts, live or recent focus
  sessions, an unfinished Daily Check-In, and grounded readiness.
- **Workload context:** real courses, imported/saved sources, and saved questions.

Automatic activation requires either two actionable items, or one actionable
item plus one current-context signal. If any user-backed evidence exists but the
automatic threshold is not met, the user may explicitly request a
limited-confidence first brief. A seed-only or empty workspace cannot force
activation.

Before activation, the Dashboard shows a concrete starter checklist: add or
import real work, set today’s intention, start a timer or log activity, and,
optionally, add trusted question practice. The checklist never fabricates a
diagnosis from absence of history.

## Candidate sources

`rankCommandBriefCandidates` builds candidates from:

- open tasks, using due date, carryover, and prior-closeout commitment;
- incomplete real Course Tracker items, using review/high-yield/pass state;
- the trusted due-question queue;
- scheduled daily targets that are unfinished;
- due recurring habits that are not already represented by a linked target;
- the user’s Daily Check-In priority or intention;
- an active or paused focus session.

Completed, archived, off-schedule, unavailable, untrusted, and template records
are excluded. Flexible weekly Habits are not called “due today” without a chosen
weekday. A linked Habit target and the underlying Habit do not become duplicate
candidates.

## Inspectable scoring

Every candidate carries weighted contribution rows with a stable ID, plain-
language label, numeric weight, and source label. Examples include overdue or
due-today status, Course Tracker review/high-yield flags, due trusted questions,
scheduled-target weight, a pinned priority, yesterday’s chosen first task,
recent continuity, and an already-active focus session.

Scores are the sum of those visible weights. Candidates sort by descending
score and then stable candidate ID, making ties deterministic. “Why this
suggestion?” displays the same contributions used by the ranking function;
the UI does not reconstruct a separate explanation.

Daily Check-In context can size the proposed block and boost an exact matching
priority or intention. Readiness changes effort only when it is grounded by a
self-report source or a user-confirmed contribution. The neutral readiness
baseline is ignored. Low grounded readiness may shorten a block, but it does
not silently mutate tasks or plans.

## Mode and recovery boundary

Once the evidence gate is satisfied, existing deterministic signals select
Maintain, Catch-Up, Recovery, Sprint, or Exam Week. Fresh workspaces have no
invented missed-study history; historical inactivity starts only after a real
prior active day. Yesterday’s explicit closeout mode may override the rule set.

Recovery remains a separately inspectable, optional presentation. Command Brief
does not delete tasks, apply a catch-up plan automatically, invoke a hidden AI
provider, or turn unsupported free text into a real task.

## Persistence and extension

Evidence assessment and candidate rows are derived, not stored. Source records
stay in the existing schema-v32 workspace. Starting a suggested session is an
explicit user action. A future provider-backed proposal may use the existing
review-gated schema, but it must remain visibly distinct from AXOM’s calculation
and cannot bypass this trust boundary.


# Target contribution ledger

Status: implemented in Wave 5.5D. The ledger is the canonical, inspectable
projection used by daily-success evaluation; it is not a second activity or
habit database.

## Purpose

Every enabled daily target declares where completion comes from. AXOM then
projects the existing source records for one target and one local day into a
normalized ledger. The same result feeds the target editor, the daily progress
breakdown, Dashboard, Reports, Command Brief, closeout, and Day at a Glance.

Supported completion sources are:

- academic study minutes, including finalized Pomodoro/focus logs;
- card and practice-question quantities in the activity log;
- a linked Productivity tracker;
- an exact target-specific activity alias;
- a linked Habit Tracker entry;
- a saved Journal closeout;
- a manual check-off, quantity, signed correction, or explicit override.

There is no inferred health-device input and no conversion of unrelated habits
into invented “minute equivalents.” Values stay in their native unit:
`minutes`, `cards`, `questions`, `pages`, `repetitions`, `count`, or a bounded
custom label.

## Derived row contract

`buildTargetContributionLedger` returns pure derived rows with:

- event and source-record type;
- event ID and source-record ID;
- target ID;
- finite value and normalized native unit;
- local day key;
- deterministic deduplication key;
- match provenance (`native`, `linked`, `alias`, `manual`, or `reassigned`);
- confidence;
- correction and manual-override flags.

The aggregate also exposes the resulting value, source IDs in stable source
order, and the winning override ID when one exists. Non-finite values normalize
to zero, aggregate values cannot be negative, and the output is sorted
deterministically.

## Matching and deduplication

Activity aliases use normalized exact phrase equality. Case, punctuation, and
spacing differences are ignored, but a longer label containing the alias is not
accepted as a weak substring match. This avoids assigning “UWorld block review
later” to an alias that is only “UWorld block.”

Study logs and manual rows are canonicalized by ID. When a linked event also
matches an alias, the higher-confidence native/linked row wins under the same
deduplication key. The latest same-day Habit entry is a correction, not an
additional completion. The latest same-day manual override replaces the derived
total; signed manual additions remain visible as separate corrections.

## User correction

The target editor shows matched activity and lets the user:

- undo a match for this target;
- restore an excluded match;
- reassign a source activity to another target;
- enter a manual value or check-off.

Corrections are stored on the target as bounded source-ID inclusion/exclusion
lists or manual-contribution records. They do not delete or rewrite the original
activity, Habit entry, Journal closeout, question history, or timer history.
Reassignment adds one explicit inclusion to the destination and one exclusion
to the source target, so the same source is not counted twice within either
ledger.

## Schedule and weighting boundary

The contribution ledger answers only “what contributed on this day?”
`evaluateDailySuccess` remains responsible for:

- tracking-start floors;
- daily, selected-weekday, and times-per-week eligibility;
- unavailable linked-source handling;
- native target progress;
- the separately displayed weight toward today.

For weekly quotas, a day counts as an occurrence only when its native target is
met. A target created partway through its first week cannot demand more
occurrences than the remaining calendar opportunities. Historical weekly
results are emitted once at the end of the week rather than repeated as seven
failures.

## Persistence and safety

Source records remain authoritative in the existing IndexedDB-first workspace.
The derived ledger itself is not persisted. Only optional target configuration,
aliases, corrections, and manual contribution facts are stored and included in
portable backup normalization. This remains additive under schema v32 and does
not add a database or object store.

Focused regression coverage proves native-unit handling, exact aliases,
duplicate suppression, signed corrections, linked-source priority, Habit
corrections, manual overrides, explicit reassignment, source preservation, and
order-independent output.


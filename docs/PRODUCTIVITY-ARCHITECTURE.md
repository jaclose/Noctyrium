# Productivity & Daily-File Architecture

Status notes + a careful plan for the "one file per study day" work that
v0.03.01.5's CHANGELOG flagged as *"not functional yet."* This is the fragile
core of Noctyrium — **change it conservatively, prove each step, never cut over blind.**

## Current state (mapped 2026-06)

Files (all live under `~/Medical School/09 Admin/App Data/`, outside the code repo):

| File | Header / shape | Role |
|---|---|---|
| `productivity_log.csv` | `date,type,minutes,cards,note` | Append-only event log (all study events ever) |
| `Noctyrium/Productivity/Days/<YYYY-MM-DD>.csv` | `timestamp,type,minutes,cards,note` | **Per-day files — partially populated.** The intended source of truth per day |
| `Noctyrium/Productivity/active_study_day.txt` | `YYYY-MM-DD` | Pointer to the current study day (fallback: `manual_study_day.txt`) |
| `Noctyrium/Productivity/productivity_day_archive.csv` | `date_key,study_minutes,anki_cards,completed_tasks,open_tasks,standup_*,energy,rating,updated` | One row appended per "Start New Study Day" |
| `Noctyrium/Productivity/productivity_day_offset.csv` | `base_minutes,base_anki,updated` | Per-day baseline offset |

**External dependency:** stats shown on the Dashboard are computed by a shell
script the app shells out to at runtime —
`~/Medical School/09 Admin/Scripts/dashboard_stats.sh`. **It is NOT in the code
repo**, so the app currently only runs correctly on JD's machine. (A legacy copy
exists at `scripts/legacy/dashboard_stats.original.sh`.)

Known issues (from CHANGELOG): daily-file routing, active-day drift, duplicate
corrections, archive duplication, heatmap callback failure (✅ now fixed — cells
are clickable and open `Days/<date>.csv`).

## Target design

- Each study day = **one durable file** `Days/<key>.csv` = the source of truth for that day.
- Today's numbers read from `Days/<activeKey>.csv` instead of being recomputed ad hoc.
- **"Start New Study Day"** = close the current day file, advance the pointer, create
  the next day's file. Idempotent + transaction-safe (no duplicate archive rows).
- Heatmap cell → opens `Days/<key>.csv` (✅ done).
- `x = 0 / -1 / -2` cascade = active day, previous day, day-before reliably resolvable.

## Safe migration plan (in order, verify between each)

1. **Vendor the stats script** — copy `dashboard_stats.sh` into the repo (`scripts/`)
   and point the app at a stable copy, so the app is self-contained/portable.
2. **Add a read path** — derive a day's totals from `Days/<key>.csv` (fallback:
   filter `productivity_log.csv` by `study_day=`). Confirm the numbers match the
   current display **before** changing any writes.
3. **Dual-write** — every productivity write also appends to `Days/<key>.csv`, so
   per-day files become complete, without removing the existing system yet.
4. **Switch reads** to per-day files once trusted; retire ad-hoc recompute.
5. **Make `startNewStudyDay()` idempotent** — guard against duplicate archive rows
   (the CHANGELOG flagged archive duplication).
6. **Add a recovery action** — "rebuild Days/ from productivity_log.csv" for repair.

## Principles

- **Faithful:** don't change visible behavior until the new path is proven equal.
- **Reversible:** keep timestamped backups (the app already does this).
- **Local-first:** everything stays human-readable CSV under `~/Medical School/`.

# AXOM-0002b.1 — Institutional Archive Remediation Report

**Scope:** Only the corrections from the AXOM-0002b independent audit
([AUDIT-REPORT.md](AUDIT-REPORT.md), verdict READY WITH MINOR CORRECTIONS).
Every change below cites the finding it repairs. No AX ID was assigned or
consumed; no priority, board, Product DNA, acceptance criteria, success
metric, verification, or owner acceptance was assigned; no conflict was
resolved; no governance document was modified; no product concept was
invented; no application code was touched.

---

## 1. Remediation record (what changed, why, evidence)

### 1.1 Durability — findings A1, A2 (checkpoint item 1)

- The entire `docs/product-memory/` tree (AXOM-0002a archive, AXOM-0002b
  audit, this remediation) is committed to version control in this
  checkpoint's commit. Before remediation it was untracked working files.
- The archive `README.md` was updated to describe the remediated layout and
  the audit/remediation lineage.
- A repository-wide `*.csv` ignore rule was silently excluding four vendored
  evidence CSVs from version control; an archive-scoped negation
  (`!docs/product-memory/**/*.csv`) was appended to `.gitignore` so archival
  evidence can never be ignored. This is the only change outside
  `docs/product-memory/`, and it exists solely to make the durability repair
  effective.

### 1.2 Volatile evidence roots — findings A2, E2 (item 2)

- The eleven Sol full-audit documents previously resident only in
  `/tmp/axom-sol-full-audit/` are vendored at
  `AXOM-0002A/evidence/full-audit/` (120 KB: full report, findings CSV,
  deferred-feature ledger, storage/backup map, accessibility audit,
  performance audit, release checklist, quality gates, feature matrix,
  route/test matrix, manifest).
- `AXOM-0002A/EVIDENCE-DEPENDENCIES.md` (new) registers every evidence
  dependency: what is durable in-repo, what remains external
  (`~/.codex/sessions/…` corpora, `~/.codex/attachments/…` directives, the
  full-audit `screenshots/`+`logs/`), each external source's location, size,
  and loss impact. No provenance was removed; the original catalogue
  citations are untouched, with a durable-counterpart addendum appended to
  `sources/historical-review.md`.

### 1.3 Failed catalogue handoff — finding A3 (item 3)

The whole archive was searched for concepts lost during normalization. The
loss surface was exactly the three core-systems §J/§L rows deliberately
assigned to the Question pass and never received by it (the audit verified
all other 250 raw units and 53 notes are represented). Restored:

| Restored record | Source evidence |
| --- | --- |
| `CAND-000194` — Dashboard and Reports quiz-session surfacing | `ROADMAP.md:80`; core-systems §J row (line 2152); question-system Q-28/Q-30 fields |
| `CAND-000195` — Pitfall Map as a dedicated surface | `ROADMAP.md:81`; `FEATURES.md:328-330,430-432`; core-systems §J row (line 2153) |
| `CAND-000196` — AI error-type classification of misses | `ROADMAP.md:58`; `FEATURES.md:341`; core-systems §J row (line 2154); question-system AI scope note (line 2007) |

Each record uses only preserved locators, carries a restoration note naming
finding A3, holds `Medium` confidence / `Repository` origin / `Incomplete`
lifecycle under the verified vocabulary rules, and opens an Owner Decision
Required question instead of assuming scope. All ten indexes, the ledger
header, and FINAL-REPORT totals were rebuilt to 196; the three Missing
Evidence Index rows now state the restoration while preserving their
original wording.

### 1.4 Relationship consistency — findings A4, B (items 4, 7)

100 directed edges were added; the graph is now fully bidirectional
(380 directed edges, zero asymmetry, zero orphans — machine-checked):

- **30 reciprocal closures** of crosswalk-recorded relationships that existed
  in only one direction (all involving records `CAND-000168`–`CAND-000193`).
- **58 directed edges (29 pairs) stated in crosswalk rows but absent from the
  ledger in both directions** — including the audit's named examples
  007↔099 (HR-17/HR-44), 078↔079 (HR-15), 005↔021 (HR-11), plus the full
  sweep: 004↔{006,074,075,076} (HR-04), 008↔{025,029} (HR-19), 036↔037
  (HR-70), 100↔{060–064} (HR-02), 106↔{138–142} (HR-21), 123↔124 (HR-20),
  124↔125 (HR-36), 142↔{143,144} (HR-34), 152↔{154–158} (HR-65).
- **6 directed edges (3 pairs)** stated in the question-system Deduplication
  notes: 115↔116, 115↔117, 116↔117.
- **4 directed edges (2 pairs)** for the audit-identified cross-catalogue
  overlaps: 044↔119 (independent difficulty/yield decision restated in
  question metadata) and 030↔069 (dashboard-scoped vs broader route-level
  code splitting). Both are documented as **intentionally separate pending
  Product Owner disposition** — no merge was performed, satisfying item 7
  without exercising product authority.
- **2 reciprocal edges** (128→194, 130→194) for the restored record.

Every restored relationship carries its provenance as an exact file:line
citation in the relationship description, with an empty `source_refs` list so
no record's evidence composition (and therefore `origin` classification and
discovery-index placement) was mutated by remediation. The convention is
defined in `ARCHIVE-VOCABULARY.md` §9. **No links were inferred**: every
added edge quotes a crosswalk row, a catalogue deduplication note, or a named
audit finding.

### 1.5 Vocabulary definitions — finding A5 (item 5)

`AXOM-0002A/ARCHIVE-VOCABULARY.md` (new) defines every archival vocabulary
locally — `lifecycle`, `historical_epoch`, confidence levels and bases,
`origin`, `source_kind`, unit-identifier conventions, System-Index grouping
semantics, `Observed …` labels, and relationship-provenance conventions.
AX-0009 was not amended. The `lifecycle` and `origin` definitions are not
retroactive guesses: AXOM-0002b.1 mechanically re-derived both fields for all
196 records with zero mismatches, and the integrity suite now enforces the
rules permanently. `historical_epoch` could not be mechanically re-derived;
its definitions are descriptive, its limitation is documented, no epoch value
was changed, and the one observed anomaly is escalated in §4 below.

### 1.6 Product DNA leakage — finding F1 (item 6)

- All 350 canonical-label occurrences inside ledger evidence text
  (`**Design Intent:**`, `**Product Principle:**`, `**Core Promise:**`,
  `**User Feeling:**`, `**Product Truth:**` — 70 each, spanning all 67
  Question-catalogue records) and 15 occurrences inside `INDEXES.md`
  conflict quotes were rewritten to `Observed …` labels. Zero canonical DNA
  labels remain in the ledger or indexes (machine-checked).
- `sources/question-system.md` received an appended addendum declaring every
  `Product DNA:` block above it cataloguer-synthesized evidenced language
  under core-systems' "Evidenced DNA" rule, never owner-authored DNA. The
  catalogue body is byte-for-byte unchanged; no cited line number shifted.
- Evidence content was not weakened: only the labels changed, in the derived
  artifacts.

### 1.7 Review evidence coverage — finding E3 (item 8)

Available review evidence was inventoried rather than invented:
`EVIDENCE-DEPENDENCIES.md` §1 registers the tracked independent review
artifacts (`artifacts/site-audit/`, `artifacts/site-audit-v2/`,
`artifacts/beta-audit-v3/`, `ASK_DETAILED_REPORT.md`) and the vendored
full-audit package. Verification confirmed `CAND-000174` already cites
`artifacts/site-audit-v2/report.md` directly, and the archive's single
Review-kind citation (`CAND-000025`) reflects the totality of independent
rendered-acceptance evidence in available history. No additional review
references could be attached without inventing history; the
underrepresentation is now a documented limitation, not a silent one.

### 1.8 Reproducibility — findings E5, E6 (validation requirement)

- `AXOM-0002A/UNIT-ANCHORS.md` (new, generated) pins all 250 synthetic unit
  ordinals to line number and exact heading text, making `Q-xx`/`H-xx`
  recoverable if lines ever drift.
- `validate-integrity.py` (this directory) re-runs the complete 37-check
  integrity suite from the raw files; `INTEGRITY-REPORT.md` was rewritten
  from its output.
- All three catalogues were modified **only by appending addenda after their
  final line**; the validation suite re-confirmed that all 250 cited line
  locators still resolve to the correct heading ordinals.

## 2. Integrity report

Re-run from scratch: **PASS, 37/37 checks, 0 warnings** — see
[`../AXOM-0002A/INTEGRITY-REPORT.md`](../AXOM-0002A/INTEGRITY-REPORT.md) and
reproduce with `python3 validate-integrity.py`.

## 3. Coverage delta

| Dimension | Before (AXOM-0002a) | After (AXOM-0002b.1) |
| --- | --- | --- |
| Candidate Records | 193 | 196 (3 dropped concepts restored) |
| Raw concepts represented | 250 units; 3 promised handoffs dropped | 250 units + 3 restored exclusion-row concepts; none dropped |
| Relationship edges | 278 directed; 30 asymmetric; crosswalk-stated links missing | 380 directed; 0 asymmetric; every crosswalk/dedup-note/audit-stated link present |
| Cross-catalogue dedup | C↔Q never linked (044/119, 030/069 unconnected) | Overlaps linked and documented as intentionally separate |
| Evidence durability | Archive untracked; full-audit docs only in `/tmp`; dependencies undocumented | Archive committed; full-audit vendored in-repo; every external dependency registered with loss impact |
| Archival vocabulary | `lifecycle`, `historical_epoch` undefined | All vocabularies defined; `lifecycle`/`origin` rules mechanically verified 196/196 and enforced |
| Product DNA leakage | 350 canonical labels in ledger + 15 in indexes; no provenance marker in question catalogue | 0 canonical labels in derived artifacts; catalogue addendum declares observed-DNA status |
| Review references | 1 Review-kind citation; underrepresentation silent | Still 1 (all that exists); review artifacts inventoried; limitation documented |
| Unit-ID reproducibility | Synthetic ordinals unanchored | 250 units pinned in `UNIT-ANCHORS.md`; append-only catalogue rule stated and machine-checked |
| Integrity checking | One-time report | Re-runnable 37-check suite, committed |

## 4. Outstanding issues (Product Owner judgment required — not remediable)

1. **Epoch anomaly:** `CAND-000016` (Current) vs `CAND-000023` (AXOM Alpha)
   with same-dated, same-shaped lineages; no assignment rule is recoverable.
   Reassignment is interpretation and was not performed (finding A5).
2. **DNA process rule for 0002c:** whether catalogue-authored `Observed …`
   DNA blocks may seed owner-authored records as drafts, or DNA must be
   re-authored from scratch (audit question G1).
3. **Doctrine vs backlog routing** for Product Decision candidates that
   restate ratified governance meaning (audit question G2).
4. **Tooling boundary** for `CAND-000095/000179/000180` and the historical
   status of `CAND-000098` (audit question G4).
5. **External-source custody:** whether the `~/.codex` corpora and the
   full-audit `screenshots/`+`logs/` should be copied to durable storage
   while they still exist — prerequisite to any Noctyrium-era recovery pass
   (audit questions G5/G6; register in `EVIDENCE-DEPENDENCIES.md` §2).
6. **The 39 conflict records** remain unresolved by design; the Conflict
   Index enumerates each owner decision.
7. **Missing-concept intake** (global search/command palette, telemetry
   posture, notification policy, per-module export — audit §D items 4–8)
   are new-idea candidates for owner intake, deliberately not added here
   because no historical evidence exists to restore them from.

## 5. Readiness statement

### READY FOR AXOM-0002c

Evidence: all six audit corrections are applied and machine-verified — the
archive is committed and durable (A1/A2), every raw concept and every
promised handoff concept is represented exactly once (A3), the relationship
graph is complete, bidirectional, and reproducible from cited sources (A4),
every archival vocabulary is defined with verified derivation rules (A5),
canonical DNA wording no longer appears outside verbatim source catalogues
(F1), and the cross-catalogue overlaps are linked with documented intent (B).
The re-run integrity suite passes 37/37 with zero warnings and is committed
for future re-verification. No Product Authority was exercised: zero owner
fields exist, zero conflicts were resolved, zero AX IDs were consumed, and
governance is untouched — confirmed by the suite's authority-boundary checks.
The remaining decisions are enumerated in §4 and are exactly the decisions
AXOM-0002c exists to make.

---

## Appendix — Deferred Improvements (observed, deliberately not implemented)

Unrelated to audit findings; recorded per checkpoint instruction, untouched:

- Extracting the 48 owner messages from the `~/.codex` session corpora into a
  durable owner-statement archive (would expand the archive).
- A deeper semantic C↔Q deduplication pass beyond the audit-identified
  overlaps (the audit found no further pairs; a fresh pass is new analysis).
- Normalizing the 178 raw `observed_area_system` strings (would alter
  observed evidence values).
- Removing or repurposing the uniformly empty `suggested_merge_candidates`
  field (schema redesign).
- Reconciling the repo-README version/identity conflicts the archive records
  (product/documentation work owned by conflict records, not the archive).
- The pending ~4 GB personal-data repository cleanup (owner custody
  decision; noted because it is the main deletion risk adjacent to this
  archive).

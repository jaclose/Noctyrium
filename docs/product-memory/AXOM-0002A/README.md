# AXOM-0002a — Institutional Evidence Normalization

This directory is an archival staging layer for Product Owner disposition.
Nothing here is a Product Backlog Item.

It was produced by AXOM-0002a, independently audited by AXOM-0002b
(verdict: READY WITH MINOR CORRECTIONS), and remediated by AXOM-0002b.1,
which applied only the audit's corrections. The audit and remediation
reports live in `../AXOM-0002B/`.

## Files

- `RECONSTRUCTION-LEDGER.md` — human-readable 25-field Candidate ledger
  (196 records: 193 normalized plus `CAND-000194`–`CAND-000196` restored by
  AXOM-0002b.1 from documented catalogue-exclusion rows).
- `RECONSTRUCTION-LEDGER.jsonl` — machine-readable equivalent.
- `INDEXES.md` — ten required discovery and traceability indexes.
- `FINAL-REPORT.md` — totals, coverage, unknowns, and disposition guidance.
- `INTEGRITY-REPORT.md` — structural and authority-boundary validation,
  re-run from scratch after remediation.
- `ARCHIVE-VOCABULARY.md` — definitions of every archival vocabulary
  (`lifecycle`, `historical_epoch`, `origin`, confidence levels, source
  kinds, unit identifiers). Archival only; it does not amend AX-0009.
- `UNIT-ANCHORS.md` — mechanical anchors pinning every raw provenance unit
  (`C-xx`/`Q-xx`/`H-xx`) to its catalogue heading.
- `EVIDENCE-DEPENDENCIES.md` — register of durable and external evidence
  sources, including what is lost if an external source disappears.
- `evidence/full-audit/` — the Sol full-audit documents vendored from their
  previous volatile `/tmp` location.
- `sources/` — provenance catalogues and the 83-record historical crosswalk
  referenced by ledger source locators. Preserved verbatim; AXOM-0002b.1
  changes are append-only addenda so no cited line number shifted.

Candidate IDs are disposable and must never be copied into
`docs/governance`. Canonical disposition and AX ID assignment are later,
Product Owner-controlled checkpoints.

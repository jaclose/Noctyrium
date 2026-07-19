# AXOM-0002a — Integrity Report

Re-run from scratch by AXOM-0002b.1 after archival remediation. The
reproducible check suite is `../AXOM-0002B/validate-integrity.py`; every value
below was recomputed from the raw JSONL, catalogues, and indexes, not carried
forward.

## Result

**PASS with 0 warning(s) — 37/37 checks.**

## Structural checks

- Candidate records: 196 (193 normalized by AXOM-0002a; `CAND-000194`–
  `CAND-000196` restored by AXOM-0002b.1 from documented exclusion rows)
- Candidate IDs: unique and contiguous from CAND-000001 through CAND-000196
- Required top-level fields: exactly 25, uniform across all records
- Owner-controlled top-level fields: 0
- Raw provenance units accounted for: 250/250 (100 C, 67 Q, 83 H)
- All 250 unit locators resolve to catalogue headings at the cited line with
  the correct ordinal (catalogue addenda are append-only; no line shifted)
- Evidence-bearing records: 196/196; evidence sources: 848, all validated
- Directly unresolvable or abbreviated evidence locators preserved: 0
- Dangling evidence references (confidence, notes, lexicon, questions,
  conflicts, relationships): 0
- Orphan related Candidate references: 0
- Relationship graph: 380 directed edges, fully bidirectional; related lists
  sorted, deduplicated, and consistent with relationship entries
- Reference lists (`repository/conversation/checkpoint/review/audit`) match
  evidence source kinds exactly: 196/196
- Invalid observed categories: 0
- Multi-category records preserving classification conflicts: 21
- Raw historical `Product Polish` values normalized to permitted `Polish`: 7
- Canonical Product DNA labels inside ledger or indexes: 0 (rewritten as
  `Observed …` labels per AXOM-0002b finding F1; catalogues verbatim with
  addendum)
- Archival vocabulary: every `lifecycle`, `historical_epoch`, and `origin`
  value is defined in `ARCHIVE-VOCABULARY.md`; the `lifecycle` and `origin`
  derivation rules and the `confidence` mirror were mechanically verified
  196/196
- Conflict records: 39; both sides preserved; silent conflict resolutions: 0
- MD ↔ JSONL parity: 196 matching IDs and titles; all field labels present
  196× each
- System Index: 196 candidates placed exactly once across 16 groups;
  Category and Chronological indexes match ledger distributions
- Canonical AX IDs consumed: 0; Candidate identifiers inside governance: 0
- Durability artifacts present: `evidence/full-audit/` (11 vendored files),
  `ARCHIVE-VOCABULARY.md`, `UNIT-ANCHORS.md`, `EVIDENCE-DEPENDENCIES.md`

## Warnings

- None.

## Preserved limitations

- Candidate IDs are disposable archival locators.
- A source reference marked unvalidated preserves the citation but signals
  that the underlying source was missing, abbreviated, permission-unknown, or
  otherwise unavailable for direct confirmation (none currently exist).
- Original AXOM-0002a relationships are recorded only where the reviewed
  crosswalk or source text explicitly grouped concepts; AXOM-0002b.1 restored
  crosswalk-stated and audit-identified links with textual file:line
  provenance (see `ARCHIVE-VOCABULARY.md` §9) and closed all reciprocals.
- Textual dependencies remain unresolved when mapping them to a Candidate
  would require inference.
- `historical_epoch` assignments are preserved as-is; no mechanical
  assignment rule is recoverable and one anomaly is recorded as an
  outstanding Product Owner issue (see `ARCHIVE-VOCABULARY.md` §2).
- External evidence dependencies and their loss impact are registered in
  `EVIDENCE-DEPENDENCIES.md`.

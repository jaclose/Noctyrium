# AXOM-0002a — Archival Vocabulary

Created by AXOM-0002b.1 archival remediation (AXOM-0002b finding A5).

This file defines the controlled vocabulary of the AXOM-0002a archive. It is
**archival** vocabulary, local to `docs/product-memory/`: it does not amend
[AX-0009 — Product Lexicon](../../governance/AX-0009-PRODUCT-LEXICON.md), it
defines no product term, and it grants no governing authority. Where a rule
below is marked **verified**, AXOM-0002b.1 mechanically re-derived the field
for all 196 Candidate Records and found zero mismatches; the rule is
documented reverse-engineering, not retroactive invention.

## 1. `lifecycle` (verified derivation, 196/196)

The lifecycle of a Candidate Record is determined by the first matching rule:

| Value | Rule | Meaning |
| --- | --- | --- |
| `Conflict` | `conflict_flags` is non-empty | The record preserves at least one unresolved historical conflict. Both sides are retained; only the Product Owner may resolve it. |
| `Incomplete` | otherwise, `open_questions` is non-empty | Evidence identifies the concept but at least one open question (typically missing owner-controlled meaning) blocks a self-contained disposition read. |
| `Merged` | otherwise, the record's confidence-bearing evidence spans two or more raw provenance units (`C-xx`/`Q-xx`/`H-xx`) | Normalization merged multiple independently observed raw units into this one concept without residual conflicts or questions. |
| `Ready For Owner` | otherwise, evidence confidence is `High` | A single-lineage, high-confidence, conflict-free record awaiting Product Owner disposition. |
| `Observed` | otherwise (confidence `Medium` or `Low`) | A single-lineage record whose evidence is preserved but thinly corroborated. |

`Ready For Owner` is an evidence-state description, not a priority, ordering,
or acceptance signal; every record of every lifecycle still requires Product
Owner disposition.

## 2. `historical_epoch` (descriptive; assignment rule not recoverable)

| Value | Meaning as used |
| --- | --- |
| `Noctyrium` | Evidence rooted in the pre-web native era, before the AXOM identity. |
| `Transition` | Evidence rooted in the Noctyrium→AXOM identity/hosting transition itself. |
| `AXOM Alpha` | Evidence rooted in binding pre-Alpha/Alpha-era direction (for example `docs/PRE-ALPHA-CONTRACT.md` and Alpha-wave directives). |
| `Current` | Evidence describing the current shipped web product state at the audited baseline. |

**Documented limitation (AXOM-0002b finding A5):** unlike `lifecycle` and
`origin`, no mechanical assignment rule for epochs could be re-derived from
the records, and at least one assignment pair looks inconsistent
(`CAND-000016` = Current vs `CAND-000023` = AXOM Alpha with same-dated,
same-shaped lineages). AXOM-0002b.1 changed no epoch value — reassignment
would be interpretation, which remediation is forbidden to perform. The
anomaly is recorded in the AXOM-0002b.1 outstanding issues.

## 3. `evidence_confidence` / `confidence` (verified, 196/196)

`confidence` is a denormalized copy of `evidence_confidence.level`, retained
for scan convenience; the integrity check enforces equality. Levels use these
exact bases:

| Level | Basis |
| --- | --- |
| `High` | Multiple independently located evidence fragments or source classes converge on the normalized concept. |
| `Medium` | At least one validated evidence locator identifies the concept; broader corroboration is limited. |
| `Low` | Evidence is preserved but contains an explicit provenance, recency, or sufficiency limitation. |

Lexicon-mapping evidence sources (locators into `docs/governance/AX-0009…`)
are terminology anchors and are excluded from
`evidence_confidence.source_refs`.

## 4. `origin` (verified derivation, 196/196)

Computed over the record's confidence-bearing evidence sources (those listed
in `evidence_confidence.source_refs`), with `Checkpoint` classed as
`Repository` (commits are repository evidence):

- exactly one source class → that class (`Repository`, `Conversation`,
  `Audit`, `Review`);
- more than one source class → `Mixed`.

## 5. `source_kind` of evidence sources

| Kind | Meaning |
| --- | --- |
| `Repository` | Tracked repository files, including docs, governance, and the archive's own catalogues. |
| `Checkpoint` | Cited git commits and checkpoint/wave execution evidence. |
| `Conversation` | Owner-role conversation corpora and owner directive attachments (see `EVIDENCE-DEPENDENCIES.md` §2). |
| `Audit` | Audit artifacts: the Sol full-audit package (vendored at `evidence/full-audit/`), `ASK_DETAILED_REPORT.md`, `IMPLEMENTATION_AUDIT.md`, and tracked site/beta audit reports. |
| `Review` | Independent rendered-acceptance/review evidence (one citation exists in available history, on `CAND-000025`). |

## 6. Raw provenance unit identifiers (`C-xx`, `Q-xx`, `H-xx`)

- `C-01`–`C-100` are real labels printed inside `sources/core-systems.md`.
- `Q-01`–`Q-67` and `H-01`–`H-83` are **synthetic ordinals** created during
  AXOM-0002a: `Q-n`/`H-n` denotes the *n*-th `###` candidate heading of
  `sources/question-system.md` / `sources/historical-review.md`; the cited
  line number is that heading's line. The identifiers do not appear inside
  those two files.
- `HR-xx` labels are crosswalk-local row locators in
  `sources/historical-crosswalk.md`; `HR-n` corresponds to `H-n`.
- Because ordinals and line numbers both drift if a catalogue is edited,
  catalogues may only be changed by appending below their final line (the
  AXOM-0002b.1 addenda follow this rule), and every unit is pinned in
  [`UNIT-ANCHORS.md`](UNIT-ANCHORS.md) by ordinal, line, and exact heading
  text so any future drift is detectable and repairable
  (AXOM-0002b finding E5).

## 7. System Index groups vs `observed_area_system`

`observed_area_system` preserves raw observed area strings exactly as the
evidence used them, including case and spacing variants; they were
deliberately not normalized. The 16 System Index groups in
[`INDEXES.md` §1](INDEXES.md) are an interpretive discovery layer over those
raw strings, and the System Index itself is the authoritative
candidate→group mapping (AXOM-0002b finding E6). Do not treat raw area
strings as a controlled vocabulary.

## 8. `Observed …` evidence labels

Inside ledger and index evidence text, the labels `Observed design intent`,
`Observed product principle`, `Observed core promise`, `Observed user
feeling`, and `Observed product truth` mark cataloguer-synthesized,
evidence-supported language (AXOM-0002b finding F1; rewritten by
AXOM-0002b.1). They are **not** the owner-controlled Product DNA fields of
[AX-0001 §3](../../governance/AX-0001-MASTER-PRODUCT-BACKLOG.md) and must not
be copied into canonical records without Product Owner authorship. Source
catalogues retain their original labels verbatim with an appended
clarification addendum.

## 9. Relationship provenance conventions (AXOM-0002b.1)

Relationships restored by AXOM-0002b.1 carry their provenance as an exact
file:line citation inside the `relationship` description and use an empty
`source_refs` list. This avoids mutating any record's evidence composition
(and therefore its `origin`) during remediation. Original AXOM-0002a
relationships keep their evidence-linked `source_refs`. All relationships are
bidirectional: an edge appears in `related_candidate_records` of both records.

# AXOM-0002a — Final Archival Report

## Outcome

AXOM-0002a produced a non-canonical institutional evidence ledger. It created
no Product Backlog Item, consumed no AX ID, and assigned no owner-controlled
value.

## Candidate totals

- Raw candidate headings reviewed: **250**
- Normalized Candidate Records: **193**
- Candidate Records restored from documented exclusion rows by AXOM-0002b.1: **3** (`CAND-000194`–`CAND-000196`)
- Total Candidate Records: **196**
- Duplicate/composite reduction: **57**
- Reconstruction and insufficiency notes indexed: **53**
- Candidate records with unresolved conflict flags: **39**

## Per-category totals

Records with conflicting historical classifications appear in each observed
permitted category; category totals are therefore intentionally non-exclusive.
Multi-category Candidate Records: **21**.

| Observed category | Candidates |
| --- | ---: |
| Bug | 12 |
| Feature | 105 |
| Polish | 7 |
| Product Debt | 10 |
| Product Decision | 40 |
| Research | 28 |
| Technical Debt | 17 |

## Per-system totals

| Normalized index grouping | Candidates |
| --- | ---: |
| Accounts, Security, and Privacy | 3 |
| AI | 2 |
| Applications and Academic Prep | 3 |
| Core Product | 12 |
| Course Central and Academic Planning | 20 |
| Cross-product | 3 |
| Daily Games and Utilities | 7 |
| Daily Loop and Productivity | 13 |
| Dashboard and Command Brief | 10 |
| Data Safety and Platform | 14 |
| Engineering and Release | 11 |
| Journal | 7 |
| Question System | 70 |
| Shell and Experience | 15 |
| Study Methods and Integrations | 4 |
| Tasks | 2 |

## Confidence distribution

| Evidence confidence | Candidates |
| --- | ---: |
| High | 139 |
| Low | 2 |
| Medium | 55 |

## Origin distribution

| Evidence origin | Candidates |
| --- | ---: |
| Audit | 11 |
| Conversation | 1 |
| Mixed | 91 |
| Repository | 93 |

## Historical-epoch distribution

| Historical epoch | Candidates |
| --- | ---: |
| AXOM Alpha | 54 |
| Current | 139 |
| Noctyrium | 1 |
| Transition | 2 |

## Duplicate reduction

The three evidence passes produced 250 raw headings. The historical crosswalk
classified its 83 headings as 44 direct merges, 20 new concepts, 18 composite
splits, and one unresolved conflict. Six independently observed concepts were
recovered from composite split evidence. The result is 193 normalized concepts,
a conservative reduction of 57 raw headings without discarding their source
locators. AXOM-0002b.1 later restored three concepts (`CAND-000194`–`CAND-000196`)
that the catalogue handoff had dropped; they came from documented exclusion rows,
not from the 250 raw headings, bringing the total to 196.

## Coverage assessment

- Repository product, architecture, roadmap, audit, release, and checkpoint
  documentation: reviewed through the three provenance catalogues.
- Git history: 91 commits available at the audited baseline were included as
  checkpoint evidence where cited.
- Full pre-Alpha audit: included as audit evidence, with its older
  `26707a8` baseline preserved rather than treated as current truth.
- Local conversation archive: 87 raw session matches were filtered to nine
  substantive owner chronologies containing 48 unique owner messages.
- Broader historical conversation universe: not fully available. Missing
  conversations remain explicit evidence gaps for later ingestion.

## Remaining unknowns

- Product Owner disposition is required for every Candidate Record.
- Conflict records preserve both sides and select no interpretation.
- Multi-category Candidate Records preserve conflicting historical
  classifications without selecting a winning category.
- Exact concept-first dates are unavailable for evidence that lacks dated
  conversation or commit locators.
- Reconstruction notes remain in the Missing Evidence Index and were not
  promoted merely to increase ledger completeness.

## Product Owner disposition recommendation

Review candidates in this order:

1. Conflict lifecycle records.
2. Low-confidence and Incomplete records.
3. Product Decision evidence.
4. Confirmed Bug evidence.
5. Merged Feature evidence.
6. Product Debt, Technical Debt, Research, and Polish evidence.

For each record the Product Owner may accept, reject, merge, split, defer, or
request more evidence. Canonical AX assignment remains a separate AXOM-0002b/
AXOM-0002c activity.

## Scope integrity

- Governing documents modified: **No**
- Application or test files modified: **No**
- Dependencies/configuration/schema modified: **No**
- Canonical AX IDs assigned: **No**
- Owner-controlled values assigned: **No**
- Candidate identifiers written inside governance: **No**

## AXOM-0002b.1 remediation

The independent AXOM-0002b audit returned READY WITH MINOR CORRECTIONS.
AXOM-0002b.1 applied only those corrections:

- Restored `CAND-000194`–`CAND-000196` from the core-systems §J exclusion rows
  whose promised Question-pass ownership was never fulfilled (finding A3).
- Restored 100 candidate relationships stated in the crosswalk, the
  question-system deduplication notes, and the audit's cross-catalogue overlap
  finding; the relationship graph is now fully bidirectional (findings A4, B).
- Rewrote canonical-sounding Product DNA labels inside ledger and index
  evidence text as `Observed …` labels; source catalogues remain verbatim with
  an appended provenance addendum (finding F1).
- Defined all archival vocabularies in `ARCHIVE-VOCABULARY.md` and anchored the
  synthetic C/Q/H unit identifiers in `UNIT-ANCHORS.md` (findings A5, E5).
- Vendored the previously `/tmp`-resident full-audit documents into
  `evidence/full-audit/` and documented every remaining external evidence
  dependency in `EVIDENCE-DEPENDENCIES.md` (finding A2, E3).
- No AX ID, priority, board, Product DNA, acceptance criteria, verification,
  or owner acceptance was assigned; no conflict was resolved; governance was
  not modified.

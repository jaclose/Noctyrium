# AXOM-0002c.1 — Conditional Canonical Insertion Plan

## Status

**NOT READY — BATCHES 1–2 ARE CONFIRMED; 27 PRODUCT OWNER DISPOSITIONS REMAIN
PENDING.**

This plan describes the mechanical next checkpoint if the current analytical
defaults are accepted. It neither approves those defaults nor assigns
permanent `AX-` IDs.

## Current conditional record count

The current confirmed decisions plus pending recommendations would produce:

- Source proposals: 35;
- Evidence-only proposals: 1 (`FOUND-030`), producing no new backlog record;
- Split proposals: 5, producing 11 temporary records:
  - `FOUND-011` → two;
  - `FOUND-012` → two;
  - `FOUND-022` → two;
  - `FOUND-033` → three;
  - `FOUND-035` → two;
- Current merge outputs: 0;
- **40 potential future canonical records** if every recommendation is
  accepted unchanged.

This count is provisional and must be recomputed from confirmed Owner
decisions.

## Conditional temporary disposition handles

These handles remain recommendations until their parent decisions are
confirmed. They preserve the proposed insertion mapping without allocating any
permanent ID.

| Parent proposal | Conditional temporary handles | Candidate provenance |
| --- | --- | --- |
| `FOUND-011` | `DISP-011A`, `DISP-011B` | `CAND-000060`, `CAND-000061`, `CAND-000062` |
| `FOUND-012` | `DISP-012A`, `DISP-012B` | `CAND-000023`, `CAND-000046`, `CAND-000130` |
| `FOUND-022` | `DISP-022A`, `DISP-022B` | `CAND-000023`, `CAND-000130`, contextual `CAND-000194` |
| `FOUND-033` | `DISP-033A`, `DISP-033B`, `DISP-033C` | `CAND-000068`, `CAND-000097`, `CAND-000178` |
| `FOUND-035` | `DISP-035A`, `DISP-035B` | `CAND-000075`, `CAND-000076`, boundary `CAND-000074` |

## Proposal-to-insertion reconciliation

This table maps every proposal to exactly one current insertion outcome.
Confirmed rows are authoritative for this checkpoint; pending rows remain
conditional recommendations.

| Proposal | Decision basis | Insertion record count | Future home | Candidate provenance |
| --- | --- | ---: | --- | --- |
| `FOUND-001` | `CONFIRMED: APPROVE WITH REWORDING` | `1` | Canonical AX-0001 Product Decision | `CAND-000001`, identity facet of `CAND-000007` |
| `FOUND-002` | `CONFIRMED: APPROVE WITH REWORDING` | `1` | Canonical AX-0001 Product Decision | `CAND-000002`, `CAND-000008`, `CAND-000168` |
| `FOUND-003` | `CONFIRMED: APPROVE AS RECORD` | `1` | Canonical AX-0001 Product Decision | `CAND-000003`, relationship facet of `CAND-000042` |
| `FOUND-004` | `CONFIRMED: APPROVE WITH REWORDING` | `1` | Canonical AX-0001 Product Decision | `CAND-000001`, `CAND-000031`, `CAND-000032`, `CAND-000040`, `CAND-000082`, `CAND-000083`, `CAND-000085` |
| `FOUND-005` | `CONFIRMED: APPROVE AS RECORD` | `1` | Canonical AX-0001 Product Decision | `CAND-000005`, supporting `CAND-000015`, `CAND-000021`, `CAND-000086` |
| `FOUND-006` | `CONFIRMED: APPROVE WITH REWORDING` | `1` | Canonical AX-0001 Product Decision | `CAND-000101`, facets of `CAND-000117`, `CAND-000129`, `CAND-000159` |
| `FOUND-007` | `CONFIRMED: APPROVE AS RECORD` | `1` | Canonical AX-0001 Product Decision | Facets of `CAND-000023`, `CAND-000044`, `CAND-000130` |
| `FOUND-008` | `CONFIRMED: APPROVE WITH REWORDING` | `1` | Canonical AX-0001 Product Decision | `CAND-000168`, `CAND-000169`, mission facet of `CAND-000008` |
| `FOUND-009` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Product Decision | `CAND-000002` |
| `FOUND-010` | `PENDING RECOMMENDATION: APPROVE WITH REWORDING` | `1` | Canonical AX-0001 Product Decision | `CAND-000101` |
| `FOUND-011` | `PENDING RECOMMENDATION: SPLIT` | `2` | Canonical AX-0001 Features | `CAND-000060`, `CAND-000061`, `CAND-000062` |
| `FOUND-012` | `PENDING RECOMMENDATION: SPLIT` | `2` | Canonical AX-0001 Product Decisions | Facets of `CAND-000023`, `CAND-000046`, `CAND-000130` |
| `FOUND-013` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Feature | `CAND-000025`, `CAND-000026` |
| `FOUND-014` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Feature | `CAND-000008` |
| `FOUND-015` | `PENDING RECOMMENDATION: APPROVE WITH REWORDING` | `1` | Canonical AX-0001 Feature | `CAND-000108`, `CAND-000109`, `CAND-000110`, `CAND-000152`, related `CAND-000102` |
| `FOUND-016` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Feature | `CAND-000127`, `CAND-000128`, `CAND-000131`, `CAND-000132` |
| `FOUND-017` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Feature | `CAND-000045` |
| `FOUND-018` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Feature | `CAND-000031` |
| `FOUND-019` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Feature | `CAND-000032`, boundary evidence `CAND-000033`, `CAND-000038` |
| `FOUND-020` | `PENDING RECOMMENDATION: APPROVE WITH REWORDING` | `1` | Canonical AX-0001 Feature | `CAND-000042`, system evidence `CAND-000003` |
| `FOUND-021` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Feature | `CAND-000046` |
| `FOUND-022` | `PENDING RECOMMENDATION: SPLIT` | `2` | Canonical AX-0001 Features | `CAND-000023`, `CAND-000130`, related `CAND-000194` |
| `FOUND-023` | `PENDING RECOMMENDATION: APPROVE WITH REWORDING` | `1` | Canonical AX-0001 Product Decision | `CAND-000074`, related `CAND-000004` |
| `FOUND-024` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Feature | `CAND-000053` |
| `FOUND-025` | `PENDING RECOMMENDATION: APPROVE WITH REWORDING` | `1` | Canonical AX-0001 Product Decision | `CAND-000004`, facet of `CAND-000006`, context `CAND-000074`, `CAND-000103` |
| `FOUND-026` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Product Decision | `CAND-000012`, `CAND-000016`, `CAND-000022`, `CAND-000026`, `CAND-000105`, `CAND-000169` |
| `FOUND-027` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Product Decision | `CAND-000033`, `CAND-000045`, `CAND-000106`, direction `CAND-000157` |
| `FOUND-028` | `PENDING RECOMMENDATION: APPROVE WITH REWORDING` | `1` | Canonical AX-0001 Product Decision | `CAND-000102` |
| `FOUND-029` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Product Decision | `CAND-000103`, `CAND-000104`, `CAND-000105`, policy facet `CAND-000114` |
| `FOUND-030` | `PENDING RECOMMENDATION: EVIDENCE ONLY` | `0` | Evidence Only | `CAND-000123`, `CAND-000127`, `CAND-000128` |
| `FOUND-031` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Product Debt | `CAND-000092` |
| `FOUND-032` | `PENDING RECOMMENDATION: APPROVE AS RECORD` | `1` | Canonical AX-0001 Product Debt | `CAND-000175` |
| `FOUND-033` | `PENDING RECOMMENDATION: SPLIT` | `3` | Canonical AX-0001 Technical Debt records | `CAND-000068`, `CAND-000097`, `CAND-000178` |
| `FOUND-034` | `PENDING RECOMMENDATION: RESEARCH ONLY` | `1` | Canonical AX-0001 Research | `CAND-000067` |
| `FOUND-035` | `PENDING RECOMMENDATION: SPLIT` | `2` | Canonical AX-0001 Research records | `CAND-000075`, `CAND-000076`, boundary `CAND-000074` |

## Confirmed insertion reconciliation

These machine-readable values reflect confirmed decisions to date. They are
not the final insertion totals until all seven batches are confirmed:

- **Confirmed approved single records:** `8`
- **Confirmed split child records:** `0`
- **Confirmed merge output records:** `0`
- **Confirmed Evidence-only proposals:** `0`
- **Confirmed Deferred proposals:** `0`
- **Confirmed Rejected proposals:** `0`
- **Confirmed future record total:** `8`

The validator derives these totals from confirmed records in
`OWNER-DECISIONS.md` and requires this section to match on every run.
Recommendation totals cannot substitute for confirmed Owner truth.

## Conditional insertion sequence

1. Identity and Audience
2. Product Philosophy
3. Core Pillars
4. Major Systems
5. Cross-System Principles
6. Major Product Decisions
7. Product Debt
8. Technical Debt
9. Research

Within each group, preserve the confirmed conceptual dependency order rather
than Candidate chronology. Do not assign exact permanent IDs until explicitly
authorized in the canonical-insertion checkpoint.

## Conditional authority outcomes

- Backlog records own product-specific identity, system, decision, debt, and
  research meaning.
- Constitution and UX Standards retain generic doctrine.
- `FOUND-030` supports existing AX-0009 definitions as Evidence only.
- If the corresponding dispositions are approved, companion Lexicon
  follow-ups are required for Course Tracker, Knowledge Graph, Journal,
  Review-Gated AI Assistance, and Source Intake.
- No governance amendment is currently recommended. Any Owner decision that
  changes existing constitutional meaning must be routed into a separate
  amendment process, not inserted silently.

## Required inputs before insertion

1. Explicit confirmed decisions for all seven batches.
2. Final split and merge allocation.
3. Reconciled authority routing.
4. Final future-record count.
5. Product Owner authorization to plan permanent IDs.
6. A separate checkpoint authorized to edit AX-0001 and any approved Lexicon
   follow-ups.

## Current blockers

- 27 of 35 Product Owner decisions are pending.
- Confirmed decisions currently contribute 8 future canonical records.
- Temporary split handles are recommendations only.
- The disposition package is not authorized for commit.

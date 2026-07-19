# AXOM-0002a — Evidence Dependency Register

Created by AXOM-0002b.1 archival remediation (AXOM-0002b findings A2, E3, E4).
This register documents every evidence source the archive depends on, where it
durably lives, and what is lost if an external source disappears. Nothing here
changes any citation in the catalogues; original locators are preserved
verbatim there.

## 1. Durable, inside this repository

| Evidence class | Location | Status |
| --- | --- | --- |
| Repository product/architecture/roadmap docs (`README.md`, `FEATURES.md`, `ROADMAP.md`, `IMPLEMENTATION_AUDIT.md`, `CHANGELOG.md`, `docs/*.md`) | repository root and `docs/` | Tracked |
| Governance layer (`AX-0000`–`AX-0003`, `AX-0009`, `AX-0010`) | `docs/governance/` | Tracked |
| Historical audit `ASK_DETAILED_REPORT.md` (2026-07-08) | repository root | Tracked |
| Independent site/beta review artifacts | `artifacts/site-audit/`, `artifacts/site-audit-v2/`, `artifacts/beta-audit-v3/` (reports + screenshots) | Tracked |
| Sol full-audit documents (generated 2026-07-16 against baseline `26707a8`): full report, findings CSV, deferred-feature ledger, storage/backup map, accessibility audit, performance audit, pre-alpha release checklist, quality gates, feature matrix, route/test matrix, manifest | `docs/product-memory/AXOM-0002A/evidence/full-audit/` (vendored by AXOM-0002b.1 from `/tmp/axom-sol-full-audit/`) | Vendored copy tracked; original was volatile |
| Cited git commits (`26707a8` … `d4db0f4`; 17 SHAs verified by AXOM-0002b) | repository history | Tracked |

## 2. External, machine-local — NOT in this repository

These sources exist only on the archivist's machine. The catalogues quote or
summarize their load-bearing content, so first-order knowledge survives their
loss; the ability to re-verify, re-mine, or deepen that content does not.

| Source | Location | Size | Loss impact |
| --- | --- | --- | --- |
| Owner alpha corpus (session of 2026-06-14) | `/Users/jd/.codex/sessions/2026/06/14/rollout-2026-06-14T17-44-15-019ec817-abc3-7351-8840-3d3398cd851b.jsonl` | ~63 MB | Conversation-kind evidence for the June alpha era becomes unverifiable; pre-June/Noctyrium recovery mining becomes impossible. |
| Owner blueprint corpus (2026-06-20) | `/Users/jd/.codex/sessions/2026/06/20/rollout-2026-06-20T19-22-24-019ee757-b054-7a81-b030-716dde7697e2.jsonl` | ~150 MB | Same as above for blueprint-era owner intent. |
| Owner update corpus (2026-07-09) | `/Users/jd/.codex/sessions/2026/07/09/rollout-2026-07-09T14-12-40-019f4814-f385-7c10-a91b-73bdf240c09d.jsonl` | ~1 MB | Update-safety owner statement becomes unverifiable. |
| Owner checkpoint corpora (2026-07-10, 2026-07-11, 2026-07-16) | `/Users/jd/.codex/sessions/2026/07/{10,11,16}/rollout-…jsonl` | varies | Checkpoint-era owner directives become unverifiable. |
| Owner directive attachments (Pre-Beta `85c0440c…`, Question Bank/UI `5bc1d2b2…`, Wave 3 `e5bccbe6…`, Wave 5 `c05800af…`, Wave 5.5A `ef1323da…`, Wave 5.5D `ac58344a…`, structured trust `3dbc3f68…`) | `/Users/jd/.codex/attachments/<attachment-id>/` | small | Exact directive texts (heavily quoted in `historical-review.md`) become unverifiable at source. |
| Full-audit `screenshots/` and `logs/` | `/tmp/axom-sol-full-audit/{screenshots,logs}/` | ~60 MB | Visual/log corroboration of the vendored audit documents is lost; the documents themselves are vendored and survive. |

**Limitation:** `/tmp` contents do not survive OS cleanup; `~/.codex` contents
survive only as long as that tool's local store is retained on this machine.
Any future pass that needs these sources (for example a Noctyrium-era recovery
mining pass) should copy them to durable storage first. Whether to preserve
them beyond this register is a Product Owner / repository-custody decision
recorded in the AXOM-0002b.1 outstanding issues.

## 3. Known-missing sources (unchanged from AXOM-0002a)

- The broader historical conversation universe before 2026-06-13 was never
  available; missing conversations remain explicit evidence gaps.
- `docs/PARSER-SPEC-ORIGINAL.md` is absent from the repository (see the
  question-system reconstruction note "Original parser specification gate").
- No Fable review files were among the AXOM-0002a assigned sources; the single
  Review-kind evidence citation (`CAND-000025`) reflects available history,
  not an omission that can be repaired without inventing evidence.

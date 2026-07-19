# AXOM-0002c.1 — Recommended Split and Merge Plan

## Authority boundary

All splits below are analytical recommendations. `DISP-*` handles are
temporary and disposable. They become active disposition handles only after
explicit Product Owner confirmation and never become permanent product IDs.

No merges are currently recommended.

## FOUND-011 — Learner-owned continuity and recovery

**Recommended disposition:** `SPLIT`

### DISP-011A — Learner-Owned Local Workspace and Vault

- **Candidate provenance:** System facet of `CAND-000060`.
- **Recommended category / area:** Feature — Workspace and Local Vault.
- **Boundary:** Learner-owned durable Workspace and truthful local Vault
  persistence.
- **Exclusions:** Compatibility fallback defect, backup/restore operations,
  quota strategy, accounts/sync, and storage implementation.

### DISP-011B — Recovery, Backup, Restore, and Migration

- **Candidate provenance:** `CAND-000061`, `CAND-000062`; `CAND-000060`
  shared only as ownership-boundary context.
- **Recommended category / area:** Feature — Recovery and Data Continuity.
- **Boundary:** Portable Backup, Restore, Merge, safety snapshots, and
  migration recovery as explicit recoverable user capabilities.
- **Exclusions:** Accounts/sync, unsupported binary inclusion, quota debt,
  fallback Bug, and low-level migration implementation.

**Overlap prevention:** `DISP-011A` owns durable local persistence;
`DISP-011B` owns recovery operations and portability. AX-0009 retains every
term definition.

## FOUND-012 — Reflection and learning evidence

**Recommended disposition:** `SPLIT`

### DISP-012A — Reflection and Journal Continuity

- **Candidate provenance:** `CAND-000046`.
- **Recommended category / area:** Product Decision — Reflection and Journal.
- **Boundary:** Preserve learner-authored reflection and subjective meaning.
- **Exclusions:** Analytics, progress claims, Journal mechanics, future modes,
  and recommendations.

### DISP-012B — Learning Evidence and Insight

- **Candidate provenance:** `CAND-000023`, `CAND-000130`.
- **Recommended category / area:** Product Decision — Learning Evidence and
  Insights.
- **Boundary:** Preserve attributable evidence and produce qualified insight
  without claiming subjective meaning.
- **Exclusions:** Journal/reflection, metric redefinition, Reports UI,
  Question Analytics behavior, and opaque recommendations.

**Overlap prevention:** A owns learner-authored meaning; B owns measured
evidence and qualified interpretation.

## FOUND-022 — Reports and Learning Analytics

**Recommended disposition:** `SPLIT`

### DISP-022A — Reports and Cross-Product Insights

- **Candidate provenance:** `CAND-000023`; `CAND-000194` shared only as
  contextual surfacing evidence.
- **Recommended category / area:** Feature — Reports.
- **Boundary:** Explain cross-product trends, change drivers, implications, and
  source records while treating missing/small history neutrally.
- **Exclusions:** Question-specific algorithms, metric redefinition, exact
  charts/tabs, and Dashboard placement.

### DISP-022B — Question Analytics and Learning Evidence

- **Candidate provenance:** `CAND-000130`; `CAND-000194` shared only as
  contextual surfacing evidence.
- **Recommended category / area:** Feature — Question Analytics.
- **Boundary:** Explain Question performance, current state, and error patterns
  from qualified evidence and canonical metrics.
- **Exclusions:** General productivity Reports, global recommendation
  ownership, exact UI, and cross-surface session placement.

**Overlap prevention:** A owns cross-product insight; B owns
Question-domain analysis. Shared calculations may have one implementation
without collapsing product boundaries.

Across proposal families, `DISP-012B` owns the product rule for preserving and
qualifying learning evidence. `DISP-022A` and `DISP-022B` own the user-visible
Reports and Question-domain analytics capabilities and may apply, but never
redefine, that rule. Shared Candidate provenance does not create duplicate
authority.

## FOUND-033 — Data-platform scalability and failure resilience

**Recommended disposition:** `SPLIT`

### DISP-033A — Data Storage Scalability and Binary Separation

- **Candidate provenance:** `CAND-000068`; shared scale evidence from
  `CAND-000178`.
- **Recommended category / area:** Technical Debt — Data Platform and Storage.
- **Boundary:** Scalable separation between serialized Workspace records and
  learner-owned binary data without prescribing an implementation.
- **Exclusions:** Schema choice, object-store mandate, attachment
  implementation, and fixed quota numbers.

### DISP-033B — Quota, Persistence, and Recoverable Failure Handling

- **Candidate provenance:** `CAND-000097`; quota/failure facet of
  `CAND-000178`.
- **Recommended category / area:** Technical Debt — Data Safety and Storage
  Reliability.
- **Boundary:** Understandable, recoverable behavior under persistence and
  quota pressure.
- **Exclusions:** Confirmed Bug classification without reproduction and
  unsupported environmental assumptions.

### DISP-033C — Large-Workspace Validation and Operational Proof

- **Candidate provenance:** Operational-proof facet of `CAND-000178`.
- **Recommended category / area:** Technical Debt — Storage and Performance
  Validation.
- **Boundary:** Realistic capacity measurement and operational proof.
- **Exclusions:** Production architecture mandates and fabricated capacity
  targets.

**Overlap prevention:** A owns structural scalability; B owns failure behavior;
C owns measurement and proof. Shared `CAND-000178` evidence is facet-labeled.

## FOUND-035 — Optional private AI execution models

**Recommended disposition:** `SPLIT`

### DISP-035A — Consent-Based Cloud AI Execution

- **Candidate provenance:** `CAND-000075`; review/truth boundary shared from
  `CAND-000074`.
- **Recommended category / area:** Research — AI and Privacy / Cloud
  Execution.
- **Boundary:** Investigate explicitly consented remote execution, privacy,
  cost, quality, security, and operations.
- **Exclusions:** Product commitment, provider/model selection, client secrets,
  invisible transmission, AI dependency, and implementation.

### DISP-035B — Private On-Device or In-Browser AI Execution

- **Candidate provenance:** `CAND-000076`; non-load-bearing review boundary
  shared from `CAND-000074`.
- **Recommended category / area:** Research — AI and Privacy / Local
  Execution.
- **Boundary:** Investigate private local execution, performance, quality,
  storage, accessibility, and device constraints.
- **Exclusions:** Product commitment, model choice, quality claims, and
  implementation.

**Overlap prevention:** A owns consented transmission and remote operation; B
owns local execution constraints. `FOUND-023` retains the current governed AI
capability boundary.

## Merge assessment

No recommended merge survives the smallest-decision test:

- Dashboard and Command Brief have different user promises.
- Course Tracker and Course Central differ by learner-owned versus
  institutional source scope.
- Question Import, Quiz, and Question Bank remain distinct.
- Journal and Reports differ by subjective meaning versus measured evidence.
- AI capability and AI execution Research remain distinct.
- Accounts/sync Research and Local Vault capability remain distinct.

Any Product Owner-requested merge must preserve all contributing `FOUND-*` and
Candidate provenance, assign one temporary `DISP-*` handle, state the surviving
boundary, and preserve rejected wording in Decision History.

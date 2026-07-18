# AX-0001 — Master Product Backlog

| Field | Value |
| --- | --- |
| Document ID | `AX-0001` |
| Version | `0.1.0` |
| Owner | AXOM Product Owner |
| Approval Status | Pending Product Owner acceptance |
| Approval Date | — |
| Current Status | Draft; records pending reconstruction |
| Last Updated | 2026-07-18 |
| Canonical Path | `docs/governance/AX-0001-MASTER-PRODUCT-BACKLOG.md` |

> **Draft authority:** This owner-directed draft is non-normative until the
> AXOM Product Owner accepts it. Backlog reconstruction has not begun.

## Product DNA

**Status:** Proposed. These fields become immutable when the Product Owner
approves this document.

**Design Intent:** Move AXOM’s product memory out of conversations and into one
ordered, owner-controlled artifact.

**Product Principle:** One Source of Truth.

**User Feeling:** “The product remembers why every piece exists.”

After approval, the original Product DNA above and each approved record’s
original Product DNA are immutable. Evolution is appended to Decision History.

---

<a id="ax-0001-s1"></a>

## 1. Authority and scope

This document is the sole canonical backlog for AXOM product work. It records
features, bugs, polish, product debt, technical debt, research, and product
decisions. It is living, versioned, continuously refined, and controlled by
the AXOM Product Owner under
[AX-0003 — Governance](AX-0003-GOVERNANCE.md).

The backlog does not replace:

- [AX-0002 — Constitution](AX-0002-CONSTITUTION.md), which owns permanent
  product principles;
- [AX-0009 — Product Lexicon](AX-0009-PRODUCT-LEXICON.md), which owns
  terminology;
- [AX-0010 — UX Standards](AX-0010-UX-STANDARDS.md), which owns visual and
  interaction standards.

No implementation prompt proceeds until every affected product outcome exists
here with a stable `AX-` ID. Conversation history may be evidence for a record,
but it is never an implementation contract.

<a id="ax-0001-s2"></a>

## 2. Stable product IDs

- Product records begin at `AX-0100`.
- The Product Owner assigns IDs.
- IDs are sequential where practical, unique, permanent, and never reused.
- Merged, rejected, and deferred records remain searchable.
- Duplicate discoveries link through `Related IDs` or merge history; they do
  not create parallel sources of truth.
- Governing IDs `AX-0000` through `AX-0099` are unavailable for product work.

<a id="ax-0001-s3"></a>

## 3. Canonical record schema

Every backlog record contains every field below. Use `None`, `Not yet
assigned`, or `Not yet verified` rather than deleting a field whose value is
unknown.

| Field | Allowed value or rule |
| --- | --- |
| Stable ID | Permanent `AX-XXXX`; product work starts at `AX-0100` |
| Title | Short, outcome-oriented, and unique enough to scan |
| Area | Canonical product area from [AX-0009](AX-0009-PRODUCT-LEXICON.md) where defined |
| Category | `Feature`, `Bug`, `Polish`, `Product Debt`, `Technical Debt`, `Research`, `Product Decision` |
| Board | Exactly one board from [§5](#ax-0001-s5) |
| Priority | `P0`, `P1`, `P2`, `P3` |
| Status | `Idea`, `Planned`, `In Progress`, `Implemented`, `Verified`, `Deferred`, `Rejected` |
| Impact | `Critical`, `High`, `Medium`, `Low` |
| Confidence | `Confirmed`, `Suspected`, `Idea` |
| Source | One or more of `Conversation`, `Fable`, `Sol`, `Claude`, `Manual QA`, `User Observation` |
| Evidence | Reproducible observation, review reference, artifact, test, screenshot, or source citation |
| Design Intent | Immutable reason the outcome exists |
| Product Principle | Immutable product principle expressed by the outcome |
| User Feeling | Immutable intended user perception, written in the user’s voice |
| Constitution | Applicable stable constitutional IDs from [AX-0002](AX-0002-CONSTITUTION.md) |
| Acceptance Criteria | Observable conditions required for owner acceptance |
| Explicit Exclusions | Adjacent work this record does not authorize |
| Dependencies | Blocking or enabling AX IDs; `None` when independent |
| Related IDs | Non-blocking relationships, duplicates, successors, or merge history |
| Checkpoint | `AXOM-NNNN` execution checkpoint that owns implementation; `Not assigned` until planned |
| Verification | Evidence required by [§8](#ax-0001-s8), or `Not yet verified` |
| Commit | Exact commit SHA(s), or `Not implemented` |
| Created | ISO date |
| Last Updated | ISO date |
| Decision History | Append-only dated decisions; never rewrite prior entries |
| Notes | Bounded context that does not redefine another field |

`Design Intent`, `Product Principle`, and `User Feeling` form **Product DNA**.
They are not implementation requirements. They explain why the work deserves
to exist.

<a id="ax-0001-s4"></a>

## 4. Status workflow

The normal delivery path is:

`Idea → Planned → In Progress → Implemented → Verified → Completed Archive`

`Completed Archive` is a board, not a status. A record enters it only with
`Status: Verified`.

- **Idea:** captured, not committed.
- **Planned:** owner-approved intent, priority, acceptance criteria, and
  exclusions exist.
- **In Progress:** an authorized checkpoint is actively implementing it.
- **Implemented:** code or documentation exists, but acceptance is incomplete.
- **Verified:** acceptance criteria, regression gates, independent review,
  browser verification when applicable, and Product Owner acceptance all pass.
- **Deferred:** intentionally postponed without erasing the decision.
- **Rejected:** explicitly declined without erasing the history.

Implementation can regress. A supported regression moves an item out of
`Verified` and the Completed Archive to the appropriate active board and status
while preserving its prior verification and decision history.

Only the Product Owner promotes an idea, assigns priority, declares final
acceptance, rejects an item, or changes roadmap placement.

<a id="ax-0001-s5"></a>

## 5. The eight boards

One canonical record has exactly one active board.

<a id="ax-0001-s5-1"></a>

### 5.1 Release Critical

P0 correctness, safety, data integrity, security containment, and release
blockers. Cosmetic work does not belong here.

<a id="ax-0001-s5-2"></a>

### 5.2 Current Development

The active checkpoint and its bounded dependencies, normally 10–25 items.

<a id="ax-0001-s5-3"></a>

### 5.3 Product Polish

Small, isolated experience improvements, normally 5–60 minutes, that can
piggyback safely without architectural redesign.

<a id="ax-0001-s5-4"></a>

### 5.4 Product Debt

Cross-cutting experience liabilities such as workflow friction, inconsistent
hierarchy, fragmented onboarding, information architecture, navigation
philosophy, settings organization, and design-system drift. Product Debt is
not Technical Debt and is not reduced to a cosmetic grab bag.

<a id="ax-0001-s5-5"></a>

### 5.5 Future Features

Owner-approved product possibilities that are not current commitments.

<a id="ax-0001-s5-6"></a>

### 5.6 Research

Questions requiring evidence or exploration before commitment. Research
outcomes may recommend work; they do not promote themselves into requirements.

<a id="ax-0001-s5-7"></a>

### 5.7 Technical Debt

Performance, architecture, refactors, indexing, optimization, test
infrastructure, and maintainability work that does not itself define the user
experience.

<a id="ax-0001-s5-8"></a>

### 5.8 Completed Archive

Verified records only. Historical evidence, review linkage, verification, and
commit references remain attached.

<a id="ax-0001-s6"></a>

## 6. Canonical board ledger

Backlog reconstruction has not begun in this checkpoint. The empty sections
below are deliberate: no product direction is inferred merely to populate the
new system.

### Release Critical

No owner-approved records yet.

### Current Development

No owner-approved records yet.

### Product Polish

No owner-approved records yet.

### Product Debt

No owner-approved records yet.

### Future Features

No owner-approved records yet.

### Research

No owner-approved records yet.

### Technical Debt

No owner-approved records yet.

### Completed Archive

No owner-verified records yet.

<a id="ax-0001-s7"></a>

## 7. Record and acceptance template

```md
## AX-XXXX — Title

- **Area:**
- **Category:**
- **Board:**
- **Priority:**
- **Status:**
- **Impact:**
- **Confidence:**
- **Source:**
- **Evidence:**
- **Created:** YYYY-MM-DD
- **Last Updated:** YYYY-MM-DD

### Product DNA

- **Design Intent:**
- **Product Principle:**
- **User Feeling:**
- **Constitution:**

### Acceptance Criteria

- [ ] Observable outcome

### Explicit Exclusions

- Excluded adjacent work

### Delivery

- **Dependencies:**
- **Related IDs:**
- **Checkpoint:**
- **Verification:** Not yet verified
- **Commit:** Not implemented

### Decision History

| Date | Owner | Decision | Rationale |
| --- | --- | --- | --- |

### Notes

Bounded context only.
```

Acceptance criteria describe observable outcomes, boundaries, and failure
behavior. They do not prescribe implementation unless an architectural
constraint has been owner-approved or is required by a governing artifact.

<a id="ax-0001-s8"></a>

## 8. Verification workflow

`Implemented` and `Verified` are deliberately different.

A record becomes `Verified` only after all applicable evidence exists:

1. every acceptance criterion is demonstrated;
2. required regression gates pass;
3. independent review reaches an accepted verdict or all supported findings
   are repaired;
4. browser verification covers the affected user workflow, themes, responsive
   states, keyboard behavior, and accessibility where applicable;
5. evidence and exact commit SHA are linked;
6. the Product Owner gives final acceptance.

Documentation-only records replace browser evidence with rendered Markdown,
link integrity, scope classification, and repository-diff evidence.

A verification entry records:

- date and verifier;
- acceptance-criteria result;
- exact regression commands and totals;
- browser or rendered evidence location;
- independent review reference and verdict;
- supported limitations;
- owner acceptance date;
- verified commit SHA.

<a id="ax-0001-s9"></a>

## 9. Checkpoint contract

Every implementation checkpoint specifies:

1. primary AX IDs;
2. acceptance criteria being satisfied;
3. bulletproof and regression requirements;
4. optional Product Polish AX IDs;
5. explicit exclusions and untouched AX IDs;
6. verification gates;
7. allowed backlog status transitions;
8. evidence, review, and commit-linkage requirements.

Engineering may implement only referenced AX IDs and repairs already authorized
by their acceptance criteria. A newly discovered issue returns as a proposed
backlog entry unless it is a supported defect within the active checkpoint’s
approved scope.

<a id="ax-0001-s10"></a>

## 10. Contribution and change rules

- Reviewer findings do not become requirements automatically.
- Ideas remain `Idea` until Product Owner promotion.
- Sol may propose entries and update truthful implementation evidence, but may
  not assign product meaning, priority, Product DNA, or roadmap placement.
- Duplicate discoveries become `Related IDs` or append-only merge history.
- Rejected and deferred records remain searchable.
- Product DNA is never overwritten. If intent materially changes, record the
  dated decision and create a successor item when the outcome is no longer the
  same product promise.
- Every edit updates `Last Updated` and appends Decision History when meaning,
  priority, scope, or acceptance changes.
- Governing-document changes follow
  [AX-0002 §4](AX-0002-CONSTITUTION.md#ax-0002-s4), not ordinary backlog
  editing.

<a id="ax-0001-s11"></a>

## 11. Amendment history

| Version | Date | Owner | Change | Rationale | Affected AX IDs |
| --- | --- | --- | --- | --- | --- |
| `0.1.0` | 2026-07-18 | Sol, at Product Owner direction | Drafted schema, Product DNA, boards, workflows, templates, and contribution rules for Product Owner acceptance. | Replace fragmented conversational memory with one canonical product backlog without inferring approval. | `AX-0001` |

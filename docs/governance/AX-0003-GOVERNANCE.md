# AX-0003 — AXOM Governance

| Field | Value |
| --- | --- |
| Document ID | `AX-0003` |
| Version | `1.0.0` |
| Owner | AXOM Product Owner |
| Approval Status | Approved by Product Owner |
| Approval Date | 2026-07-18 |
| Current Status | Active |
| Last Updated | 2026-07-18 |
| Canonical Path | `docs/governance/AX-0003-GOVERNANCE.md` |

## Product DNA

**Design Intent:** Separate product authority, engineering execution, and
independent verification so each decision has one accountable owner.

**Product Principle:** One Source of Truth.

**User Feeling:** “AXOM changes deliberately, and every claim has an owner.”

The original Product DNA above is immutable.

---

<a id="ax-0003-s1"></a>

## 1. Operating model

AXOM uses three non-overlapping authorities:

1. Product Authority — AXOM Product Owner;
2. Engineering Authority — Sol;
3. Independent Verification — Fable.

The separation is permanent unless the Product Owner approves a formal
governance amendment. Delegating a task does not delegate the underlying
authority.

<a id="ax-0003-s2"></a>

## 2. Product Authority

**Owner:** AXOM Product Owner.

Product Authority is non-delegable and owns:

- product vision;
- Design Intent;
- Product Principles;
- User Feeling;
- priority;
- acceptance criteria;
- roadmap;
- board placement;
- Product Debt;
- product meaning;
- final acceptance.

Only Product Authority may promote an idea into planned work, redefine scope,
change priority, approve a constitutional amendment, or declare a backlog
record `Verified`.

<a id="ax-0003-s3"></a>

## 3. Engineering Authority

**Owner:** Sol.

Engineering Authority owns:

- implementation of approved scope;
- architecture within that scope and applicable governing constraints;
- tests;
- browser verification;
- regression safety;
- commits and authorized pushes;
- execution evidence;
- truthful implementation-status updates.

Engineering may propose backlog records and supported repairs. Engineering may
not:

- change priority;
- change or invent Product DNA;
- promote an idea into a requirement;
- assign roadmap or board placement;
- redefine product meaning;
- expand a checkpoint without Product Owner approval;
- mark its own work finally accepted.

An implementation discovery that is not already authorized returns to Product
Authority as a proposed record. A repair may proceed without a new record only
when it is clearly required by the active item’s approved acceptance criteria
and exclusions.

<a id="ax-0003-s4"></a>

## 4. Independent Verification

**Owner:** Fable.

Independent Verification owns:

- adversarial QA;
- accessibility review;
- browser validation;
- regression review;
- architecture critique;
- release-confidence assessment;
- supported findings with reproducible evidence.

Independent Verification may return `ACCEPT`, `ACCEPT WITH FIXES`, or `REJECT`
for the reviewed scope. A verdict informs Product Owner acceptance; it does
not replace it.

Independent Verification may not:

- rewrite the roadmap;
- change priority;
- invent features;
- silently expand acceptance criteria;
- assign Product DNA or product meaning;
- implement the work it is independently reviewing.

Reviewer findings do not become requirements automatically. Product Authority
accepts them into existing scope or assigns new backlog records.

<a id="ax-0003-s5"></a>

## 5. Governing-document changes

The governing layer is production infrastructure.

- Every governing change receives the same scope review, diff review, and
  evidence discipline as production code.
- Only Product Authority approves substantive governing changes.
- Constitution changes follow
  [AX-0002 §4](AX-0002-CONSTITUTION.md#ax-0002-s4).
- Registry identity or location changes update
  [AX-0000](AX-0000-REGISTRY.md) in the same commit.
- Governing rules are amended at their canonical source and linked elsewhere;
  they are never copied into a competing definition.
- Amendment history is append-only.
- Documentation-only checkpoints may not smuggle in product, configuration,
  dependency, schema, build, or migration changes.

<a id="ax-0003-s6"></a>

## 6. Checkpoint lifecycle

Every engineering checkpoint:

1. references owner-approved AX IDs;
2. cites their acceptance criteria and exclusions;
3. verifies the expected baseline and dirty-tree boundaries;
4. implements only the authorized scope;
5. runs proportionate regression and browser verification;
6. records exact evidence and supported limitations;
7. receives independent review when required;
8. repairs only supported, in-scope findings;
9. links the isolated commit;
10. returns final acceptance to Product Authority.

Conversation history is context, not authority. The canonical backlog record is
the implementation contract.

<a id="ax-0003-s7"></a>

## 7. Backlog update permissions

| Change | Product Owner | Sol | Fable |
| --- | --- | --- | --- |
| Assign ID, priority, board, Product DNA, or acceptance criteria | Owns | May propose | May propose finding |
| Move to `In Progress` | Approves checkpoint | Records approved start | Observes |
| Move to `Implemented` | May direct | Records with evidence | Reviews |
| Move to `Verified` / Completed Archive | Owns final acceptance | Cannot self-approve | Supplies independent verdict |
| Record commit, commands, totals, or browser evidence | Accepts | Owns execution truth | May independently verify |
| Create a review finding | May create | May create supported defect proposal | Owns independent findings |
| Change roadmap or product meaning | Owns | Prohibited | Prohibited |

<a id="ax-0003-s8"></a>

## 8. Conflict resolution

1. Use [AX-0000](AX-0000-REGISTRY.md) to identify the canonical document.
2. Use [AX-0002](AX-0002-CONSTITUTION.md) for permanent principles.
3. Use this document for authority.
4. Use [AX-0009](AX-0009-PRODUCT-LEXICON.md) for definitions.
5. Use [AX-0010](AX-0010-UX-STANDARDS.md) for approved UX standards.
6. Use [AX-0001](AX-0001-MASTER-PRODUCT-BACKLOG.md) for the authorized product
   outcome and delivery state.
7. Product Authority resolves remaining product conflicts and appends the
   decision to affected records.

An older roadmap, conversation, implementation note, or review cannot silently
override a newer approved governing amendment or backlog decision.

<a id="ax-0003-s9"></a>

## 9. Amendment history

| Version | Date | Owner | Change | Rationale | Affected AX IDs |
| --- | --- | --- | --- | --- | --- |
| `0.1.0` | 2026-07-18 | Sol, at Product Owner direction | Drafted Product, Engineering, and Independent Verification authority and the checkpoint workflow for Product Owner acceptance. | Prevent scope inference and keep product meaning owner-controlled. | `AX-0003` |
| `1.0.0` | 2026-07-18 | AXOM Product Owner | Ratified the Product, Engineering, and Independent Verification authority model and checkpoint workflow. | Activate explicit, non-overlapping authority for product decisions, execution, and independent review. | `AX-0003` |

# AX-0002 — AXOM Constitution

| Field | Value |
| --- | --- |
| Document ID | `AX-0002` |
| Version | `0.1.0` |
| Owner | AXOM Product Owner |
| Approval Status | Pending Product Owner acceptance |
| Approval Date | — |
| Current Status | Draft |
| Last Updated | 2026-07-18 |
| Canonical Path | `docs/governance/AX-0002-CONSTITUTION.md` |

> **Draft authority:** This owner-directed draft is non-normative until the
> AXOM Product Owner accepts it. Existing approved contracts retain authority.

## Product DNA

**Status:** Proposed. These fields become immutable when the Product Owner
approves this document.

**Design Intent:** Preserve the permanent principles that keep AXOM coherent
across features, contributors, and time.

**Product Principle:** Every Feature Must Earn Its Place.

**User Feeling:** “AXOM protects my work, respects my attention, and keeps me
in control.”

After approval, the original Product DNA above is immutable.

---

<a id="ax-0002-s1"></a>

## 1. Constitutional authority

The Constitution is AXOM’s permanent product lens. Every roadmap decision,
backlog record, architecture choice, interaction, review, and release decision
is evaluated against these principles.

The Constitution does not authorize implementation. Product authority and
execution authority are defined by
[AX-0003 — Governance](AX-0003-GOVERNANCE.md), and product work is authorized
only through [AX-0001 — Master Product Backlog](AX-0001-MASTER-PRODUCT-BACKLOG.md).

<a id="ax-0002-s2"></a>

## 2. Permanent principles

<a id="ax-0002-c-001"></a>

### C-001 — Local First

Nothing critical depends on cloud availability. AXOM remains useful without an
account, provider, or network connection. Optional remote capability must not
silently become the only path to the learner’s critical work.

<a id="ax-0002-c-002"></a>

### C-002 — Trust Over Cleverness

Never silently infer when certainty matters. Surface uncertainty, evidence,
limits, and required user decisions. A visible unknown is safer than a
confident invention.

<a id="ax-0002-c-003"></a>

### C-003 — The Student Never Loses Work

Persistence, backups, migrations, recovery, and reversible operations take
precedence over convenience. No change may silently discard learner-owned work
or pretend a recovery boundary does not exist.

<a id="ax-0002-c-004"></a>

### C-004 — Premium Minimalism

Use fewer controls, cleaner layouts, restrained materials, and intentional
whitespace. Visual weight must express hierarchy rather than decoration.

<a id="ax-0002-c-005"></a>

### C-005 — Power Without Complexity

Start with simple defaults. Reveal depth when it is useful. Complexity belongs
inside the system, not inside the learner’s head.

<a id="ax-0002-c-006"></a>

### C-006 — Every Screen Has One Primary Action

The learner should understand what matters now. Secondary actions remain
available without competing with the screen’s primary purpose.

<a id="ax-0002-c-007"></a>

### C-007 — Everything Should Feel Fast

Respond immediately to input. When work takes time, show truthful progress,
appropriate skeletons, optimistic behavior only when safely reversible, and
clear completion or failure feedback.

<a id="ax-0002-c-008"></a>

### C-008 — One Source of Truth

Each product concept, decision, state, and governing rule has one canonical
owner. Other surfaces reference it rather than creating a competing copy.

<a id="ax-0002-c-009"></a>

### C-009 — The User Should Feel In Control

Behavior is understandable, reversible where possible, and never surprising.
AXOM explains consequential actions and requires confirmation when recovery is
not trivial.

<a id="ax-0002-c-010"></a>

### C-010 — Every Feature Must Earn Its Place

AXOM does not ship checkbox features. Every module and control must have a
clear reason to exist, strengthen the product, and justify the attention it
asks from the learner.

<a id="ax-0002-s3"></a>

## 3. Applying the Constitution

Every product backlog record identifies the constitutional principles it
serves. A principle is a lens, not a slogan or a substitute for acceptance
criteria.

No principle silently outranks another. When principles create tension, the
Product Owner resolves the product tradeoff and records the decision in the
affected backlog items. A permanent precedence rule requires a constitutional
amendment; no contributor may infer one.

<a id="ax-0002-s4"></a>

## 4. Amendment rules

The Constitution is permanent, versioned, and amendment-only.

- Existing principles are never silently rewritten.
- An amendment appends history and preserves the prior wording.
- Constitutional IDs and stable anchors are never reused.
- Only the AXOM Product Owner may approve an amendment.
- Each proposal is reviewed with production-code rigor before approval.
- Each amendment records date, owner, exact change, rationale, and affected AX
  IDs.
- A changed interpretation is recorded as an amendment note. A materially new
  principle receives a new, permanent constitutional ID.
- Removal means `Retired`, not deletion; the text and history remain visible.

An approved amendment updates the version, metadata, and table below in the
same commit.

<a id="ax-0002-s5"></a>

## 5. Related governing documents

- [AX-0000 — Registry](AX-0000-REGISTRY.md)
- [AX-0001 — Master Product Backlog](AX-0001-MASTER-PRODUCT-BACKLOG.md)
- [AX-0003 — Governance](AX-0003-GOVERNANCE.md)
- [AX-0009 — Product Lexicon](AX-0009-PRODUCT-LEXICON.md)
- [AX-0010 — UX Standards](AX-0010-UX-STANDARDS.md)

<a id="ax-0002-s6"></a>

## 6. Amendment history

| Version | Date | Owner | Change | Rationale | Affected AX IDs |
| --- | --- | --- | --- | --- | --- |
| `0.1.0` | 2026-07-18 | Sol, at Product Owner direction | Drafted `C-001` through `C-010` and the append-only amendment process for Product Owner acceptance. | Preserve AXOM’s permanent product principles as institutional memory without inventing their precedence. | `AX-0002` |

# AX-0000 — Governing Document Registry

| Field | Value |
| --- | --- |
| Document ID | `AX-0000` |
| Version | `0.1.0` |
| Owner | AXOM Product Owner |
| Approval Status | Pending Product Owner acceptance |
| Approval Date | — |
| Current Status | Draft |
| Last Updated | 2026-07-18 |
| Canonical Path | `docs/governance/AX-0000-REGISTRY.md` |

> **Draft authority:** This owner-directed draft is non-normative until the
> AXOM Product Owner accepts it. Existing approved contracts retain authority.

## Product DNA

**Status:** Proposed. These fields become immutable when the Product Owner
approves this document.

**Design Intent:** Give AXOM one permanent, inspectable index for the documents
that govern the product.

**Product Principle:** One Source of Truth.

**User Feeling:** “AXOM remembers what governs it.”

After approval, a later interpretation belongs in the amendment history; it
never replaces the original Product DNA.

---

<a id="ax-0000-s1"></a>

## 1. Purpose and authority

This registry is the canonical index of AXOM governing artifacts. It records
identity, ownership, location, version, approval, and lifecycle status. It does
not contain the governing rules themselves.

The governing documents are treated as production infrastructure. Changes are
code-reviewed with the same rigor as production code because changing product
governance changes the product just as surely as changing the application.

<a id="ax-0000-s2"></a>

## 2. Permanent ID policy

- `AX-0000` through `AX-0099` are permanently reserved for governing
  artifacts.
- Product backlog records begin at `AX-0100`.
- IDs are unique, permanent, and never reused.
- A retired or rejected artifact keeps its ID and registry entry.
- A title or canonical path may change only through an approved amendment.
- Stable section anchors are never reassigned to a different meaning.

`AX-0000` identifies this registry. `AX-0001` identifies the living Master
Product Backlog. They are governing artifacts, not product features.
Execution checkpoints use the separate `AXOM-NNNN` namespace; for example,
`AXOM-0001` establishes this layer while `AX-0001` identifies the backlog
document it creates.

<a id="ax-0000-s3"></a>

## 3. Canonical registry

| ID | Title | Owner | Canonical Path | Version | Approval Status | Approval Date | Current Status | Amendment History |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AX-0000` | Governing Document Registry | AXOM Product Owner | [AX-0000-REGISTRY.md](AX-0000-REGISTRY.md) | `0.1.0` | Pending Product Owner acceptance | — | Draft | [§6](#ax-0000-s6) |
| `AX-0001` | Master Product Backlog | AXOM Product Owner | [AX-0001-MASTER-PRODUCT-BACKLOG.md](AX-0001-MASTER-PRODUCT-BACKLOG.md) | `0.1.0` | Pending Product Owner acceptance | — | Draft; records pending reconstruction | [§11](AX-0001-MASTER-PRODUCT-BACKLOG.md#ax-0001-s11) |
| `AX-0002` | Constitution | AXOM Product Owner | [AX-0002-CONSTITUTION.md](AX-0002-CONSTITUTION.md) | `0.1.0` | Pending Product Owner acceptance | — | Draft | [§6](AX-0002-CONSTITUTION.md#ax-0002-s6) |
| `AX-0003` | Governance | AXOM Product Owner | [AX-0003-GOVERNANCE.md](AX-0003-GOVERNANCE.md) | `0.1.0` | Pending Product Owner acceptance | — | Draft | [§9](AX-0003-GOVERNANCE.md#ax-0003-s9) |
| `AX-0004` | Design System | AXOM Product Owner | Not yet assigned — registry entry only | — | Not approved | — | Reserved | Reserved 2026-07-18; no document history |
| `AX-0005` | Architecture Principles | AXOM Product Owner | Not yet assigned — registry entry only | — | Not approved | — | Reserved | Reserved 2026-07-18; no document history |
| `AX-0006` | Release Policy | AXOM Product Owner | Not yet assigned — registry entry only | — | Not approved | — | Reserved | Reserved 2026-07-18; no document history |
| `AX-0007` | Review Standard | AXOM Product Owner | Not yet assigned — registry entry only | — | Not approved | — | Reserved | Reserved 2026-07-18; no document history |
| `AX-0008` | Testing Standard | AXOM Product Owner | Not yet assigned — registry entry only | — | Not approved | — | Reserved | Reserved 2026-07-18; no document history |
| `AX-0009` | Product Lexicon | AXOM Product Owner | [AX-0009-PRODUCT-LEXICON.md](AX-0009-PRODUCT-LEXICON.md) | `0.1.0` | Pending Product Owner acceptance | — | Draft; initialized | [§8](AX-0009-PRODUCT-LEXICON.md#ax-0009-s8) |
| `AX-0010` | UX Standards | AXOM Product Owner | [AX-0010-UX-STANDARDS.md](AX-0010-UX-STANDARDS.md) | `0.1.0` | Pending Product Owner acceptance | — | Draft; initialized | [§19](AX-0010-UX-STANDARDS.md#ax-0010-s19) |

Registry-only reservations preserve identity without inventing policy. They do
not become governing authority until the Product Owner charters, versions, and
approves their substantive contents in later checkpoints.

<a id="ax-0000-s4"></a>

## 4. Source-of-truth boundaries

| Artifact | Sole authority |
| --- | --- |
| `AX-0000` | Governing-document identity and location |
| `AX-0001` | Product work, board placement, and delivery state |
| `AX-0002` | Permanent product principles |
| `AX-0003` | Decision and execution authority |
| `AX-0004` | Design tokens, components, and assets after approval |
| `AX-0005` | Architecture principles after approval |
| `AX-0006` | Release policy after approval |
| `AX-0007` | Independent review standard after approval |
| `AX-0008` | Testing standard after approval |
| `AX-0009` | Canonical product terminology |
| `AX-0010` | Visual and interaction standards |

When two documents appear to duplicate a rule, the document that owns the
domain above is authoritative. The other document must link to it instead of
creating a second definition.

Ownership becomes normative when the corresponding document is approved. While
an artifact remains a draft, existing approved contracts retain authority.

<a id="ax-0000-s5"></a>

## 5. Lifecycle and amendments

Every governing artifact records:

- version;
- owner;
- approval status and approval date;
- current status;
- last-updated date;
- canonical path;
- append-only amendment history.

No artifact is silently deleted. `Retired` means retained for historical
discovery and no longer normative. `Rejected` means considered but never
approved. Amendments follow [AX-0002 §4](AX-0002-CONSTITUTION.md#ax-0002-s4)
and the authority rules in
[AX-0003 §5](AX-0003-GOVERNANCE.md#ax-0003-s5).

<a id="ax-0000-s6"></a>

## 6. Amendment history

| Version | Date | Owner | Change | Rationale | Affected AX IDs |
| --- | --- | --- | --- | --- | --- |
| `0.1.0` | 2026-07-18 | Sol, at Product Owner direction | Drafted the governing-document registry and permanent ID reservations for Product Owner acceptance. | Create institutional memory and a single index for product governance without self-approving Product Owner decisions. | `AX-0000`–`AX-0010` |

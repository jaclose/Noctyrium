# AX-0009 — AXOM Product Lexicon

| Field | Value |
| --- | --- |
| Document ID | `AX-0009` |
| Version | `0.1.0` |
| Owner | AXOM Product Owner |
| Approval Status | Pending Product Owner acceptance |
| Approval Date | — |
| Current Status | Draft; initialized |
| Last Updated | 2026-07-18 |
| Canonical Path | `docs/governance/AX-0009-PRODUCT-LEXICON.md` |

> **Draft authority:** This owner-directed draft is non-normative until the
> AXOM Product Owner accepts it. Existing approved terminology retains
> authority where it conflicts.

## Product DNA

**Status:** Proposed. These fields become immutable when the Product Owner
approves this document.

**Design Intent:** Give every important AXOM concept one durable meaning so
product decisions, interfaces, tests, and reviews speak the same language.

**Product Principle:** One Source of Truth.

**User Feeling:** “AXOM uses words consistently, so I always understand what
will happen.”

After approval, the original Product DNA above is immutable.

---

<a id="ax-0009-s1"></a>

## 1. Lexicon rules

This document is the canonical source for AXOM product terminology.

- Governing documents and
  [backlog records](AX-0001-MASTER-PRODUCT-BACKLOG.md) cite stable sections
  instead of redefining terms.
- Product UI uses the canonical term unless an approved backlog item defines a
  context-specific label.
- A code identifier, legacy storage key, or historical Noctyrium name does not
  redefine the user-facing concept.
- Ambiguous nouns are qualified. In particular, `Snapshot`, `Mastery`,
  `Readiness`, and `Vault` are never used alone when the qualifier changes the
  meaning.
- New meanings require a Product Owner-approved amendment.
- Existing section numbers and anchors are never renumbered or reused. A
  retired term remains in place with its history.

Each definition records its definition, purpose, related terms, and
cross-references. The implementation evidence used to initialize this lexicon
does not make implementation details permanent product meaning.

<a id="ax-0009-s2"></a>

## 2. Data, ownership, and recovery

<a id="ax-0009-s2-1"></a>

### 2.1 AXOM Workspace

**Definition:** The complete active, user-owned AXOM state graph: profile,
courses, tracker data, tasks, Journal content, questions, sessions, games, and
other supported records. It is local-first and scoped to the current browser,
device, and origin. Device-only preferences, executable actions, caches, and
separately stored binary bytes are not part of the serialized Workspace.

**Purpose:** Name the learner’s durable body of work without conflating it with
the application shell, an account, or one product module.

**Related terms:** Local Vault, Portable Backup, Restore, Question Workspace.

**Cross-references:** [AX-0002 C-001](AX-0002-CONSTITUTION.md#ax-0002-c-001),
[AX-0002 C-003](AX-0002-CONSTITUTION.md#ax-0002-c-003).

<a id="ax-0009-s2-2"></a>

### 2.2 Local Vault

**Definition:** AXOM’s device- and origin-local persistence boundary for the
Workspace, local recovery data, and learner-owned binary stores such as
Question attachment blobs. The current web implementation uses IndexedDB as
primary storage and retains an emergency fallback for the serialized
Workspace. `Vault` without the `Local` qualifier is not a persistence term.

**Purpose:** Make the location and ownership boundary of local data explicit.

**Related terms:** AXOM Workspace, Automatic Safety Snapshot, Portable Backup,
Card Vault.

**Cross-references:** [AX-0002 C-001](AX-0002-CONSTITUTION.md#ax-0002-c-001),
[AX-0002 C-003](AX-0002-CONSTITUTION.md#ax-0002-c-003).

<a id="ax-0009-s2-3"></a>

### 2.3 Portable Backup

**Definition:** A user-initiated, validated, portable export of the supported
AXOM Workspace in a documented backup representation. It is separate from the
live Workspace and must state whether separately stored binary originals are
included. In user-facing copy, unqualified `Backup` means Portable Backup;
automatic local recovery copies are named Automatic Safety Snapshots.

**Purpose:** Let the learner carry and recover work across supported
environments without depending on cloud availability.

**Related terms:** Automatic Safety Snapshot, Restore, Merge, AXOM Workspace.

**Cross-references:** [AX-0002 C-001](AX-0002-CONSTITUTION.md#ax-0002-c-001),
[AX-0002 C-003](AX-0002-CONSTITUTION.md#ax-0002-c-003),
[Restore §2.5](#ax-0009-s2-5).

<a id="ax-0009-s2-4"></a>

### 2.4 Automatic Safety Snapshot

**Definition:** A bounded, device-local, point-in-time copy created to protect
the Workspace before a risky migration or recovery boundary. It is not the
live Workspace and is not a Portable Backup file.

**Purpose:** Provide a recoverable local checkpoint when AXOM changes stored
data.

**Related terms:** Snapshot, Local Vault, Portable Backup, Restore.

**Cross-references:** [Snapshot §2.7](#ax-0009-s2-7),
[AX-0002 C-003](AX-0002-CONSTITUTION.md#ax-0002-c-003).

<a id="ax-0009-s2-5"></a>

### 2.5 Restore

**Definition:** A confirmation-gated operation that validates and normalizes a
supported Portable Backup or verified Automatic Safety Snapshot, then replaces
the applicable current local Workspace state. Restore is not Merge.

**Purpose:** Recover a known state without hiding the replacement boundary.

**Related terms:** Portable Backup, Automatic Safety Snapshot, Merge,
AXOM Workspace.

**Cross-references:** [Merge §2.6](#ax-0009-s2-6),
[AX-0002 C-009](AX-0002-CONSTITUTION.md#ax-0002-c-009).

<a id="ax-0009-s2-6"></a>

### 2.6 Merge

**Definition:** A validated import operation that combines supported backup
records with the current Workspace according to deterministic, documented
conflict rules. Merge does not mean replacement and must not silently delete
current records.

**Purpose:** Add recoverable data while preserving the distinction between
combination and replacement.

**Related terms:** Restore, Portable Backup, AXOM Workspace.

**Cross-references:** [Restore §2.5](#ax-0009-s2-5),
[AX-0002 C-002](AX-0002-CONSTITUTION.md#ax-0002-c-002),
[AX-0002 C-003](AX-0002-CONSTITUTION.md#ax-0002-c-003).

<a id="ax-0009-s2-7"></a>

### 2.7 Snapshot

**Definition:** A point-in-time capture that does not automatically track later
changes in its source. `Snapshot` is a family term and must be qualified, such
as Question-Set Membership Snapshot or Automatic Safety Snapshot.

**Purpose:** Prevent materially different frozen artifacts from being treated
as interchangeable.

**Related terms:** Automatic Safety Snapshot, Question-Set Membership Snapshot.

**Cross-references:** [Automatic Safety Snapshot §2.4](#ax-0009-s2-4),
[Question-Set Membership Snapshot §4.4](#ax-0009-s4-4).

<a id="ax-0009-s3"></a>

## 3. Academic planning and the daily system

<a id="ax-0009-s3-1"></a>

### 3.1 Blueprint

**Definition:** A source-governed academic pathway organized into typed
categories and nodes. A Catalog Blueprint is the reusable template; an
Installed Blueprint is the learner-owned instance; a Blueprint Node is one
trackable object inside it. Reconciliation may update catalog structure but
must preserve learner-owned progress, evidence, links, and notes.

**Purpose:** Represent academic pathways without hard-coding one institution’s
curriculum into AXOM.

**Related terms:** Course Central, Course Tracker, Blueprint Node, Installed
Blueprint.

**Cross-references:** [Course Central §3.5](#ax-0009-s3-5),
[AX-0002 C-003](AX-0002-CONSTITUTION.md#ax-0002-c-003).

<a id="ax-0009-s3-2"></a>

### 3.2 Command Brief

**Definition:** AXOM’s deterministic, evidence-gated daily decision surface. It
selects one supported next action, explains why it ranked first, estimates the
effort and outcome, and may offer a smaller fallback. Without enough real
evidence it remains in a visible learning state. It does not mutate the
Workspace until the learner chooses an action and is not presented as
AI-generated unless AI actually contributed.

**Purpose:** Reduce uncertainty to one inspectable next move.

**Related terms:** Daily Focus, Study Session, Learner Readiness.

**Cross-references:** [Study Session §3.3](#ax-0009-s3-3),
[AX-0002 C-002](AX-0002-CONSTITUTION.md#ax-0002-c-002),
[AX-0002 C-006](AX-0002-CONSTITUTION.md#ax-0002-c-006).

<a id="ax-0009-s3-3"></a>

### 3.3 Study Session

**Definition:** A persisted focus record linked to a task, tracker item,
Question Set, Blueprint Node, card review, or free work. It records absolute
time segments, status, source, study day, quick logs, and optional completion
capture. A Study Session is distinct from a Quiz Session and a Pomodoro
interval.

**Purpose:** Preserve truthful, reload-safe evidence of focused work and its
outcome.

**Related terms:** Command Brief, Quiz Session, Question Set, Blueprint.

**Cross-references:** [Command Brief §3.2](#ax-0009-s3-2),
[Question Set §4.3](#ax-0009-s4-3).

<a id="ax-0009-s3-4"></a>

### 3.4 Daily Focus

**Definition:** The learner-authored intention for the current study day,
captured through the Daily Check-In. It may be supported by win conditions and
context, but it is not an academic-track selection, timer, or automatic
recommendation.

**Purpose:** Let the learner state what should matter today in their own words.

**Related terms:** Command Brief, Daily Check-In, Study Session.

**Cross-references:** [Command Brief §3.2](#ax-0009-s3-2),
[AX-0002 C-009](AX-0002-CONSTITUTION.md#ax-0002-c-009).

<a id="ax-0009-s3-5"></a>

### 3.5 Course Central

**Definition:** The planned learner-owned integration layer that brings
authorized schedules, announcements, assignments, resources, assessments, and
curriculum progress into one provenance-aware Workspace through adapters.
Institutional systems remain authoritative; AXOM adds planning, practice,
progress, and next-action overlays. Course Central is not currently a claim of
live LMS replacement and is distinct from the implemented Course Tracker.

**Purpose:** Create a calm curriculum center without surrendering local-first
ownership or source truth.

**Related terms:** Blueprint, Course Tracker, Command Brief, AXOM Workspace.

**Cross-references:** [Blueprint §3.1](#ax-0009-s3-1),
[AX-0002 C-001](AX-0002-CONSTITUTION.md#ax-0002-c-001),
[AX-0002 C-002](AX-0002-CONSTITUTION.md#ax-0002-c-002).

<a id="ax-0009-s4"></a>

## 4. Question system

<a id="ax-0009-s4-1"></a>

### 4.1 Question

**Definition:** A durable Question Bank practice record containing a stem,
answer options, provenance, answer-mapping state, optional explanation and
rationales, and learner-owned practice data such as attempts, tags, notes, and
annotations. A Question is not the raw source document or a transient parser
candidate. A stored imported Question may remain unrunnable until Mapping
Readiness is sufficient.

**Purpose:** Provide one durable, reviewable unit of practice without losing
source evidence or learner work.

**Related terms:** Question Set, Mapping Readiness, Question-Set Membership
Snapshot, Quiz Session.

**Cross-references:** [Question Set §4.3](#ax-0009-s4-3),
[Mapping Readiness §5.5](#ax-0009-s5-5),
[AX-0002 C-002](AX-0002-CONSTITUTION.md#ax-0002-c-002).

<a id="ax-0009-s4-2"></a>

### 4.2 Collection

**Definition:** A non-owning, context-specific grouping or view of Questions.
AXOM currently has no canonical persisted `Collection` entity. `Collection`
must not be used as a synonym for Question Set unless a future owner-approved
model explicitly establishes that relationship.

**Purpose:** Preserve room for future organization without misrepresenting a
live view as a durable membership artifact.

**Related terms:** Question, Question Set, filter, view.

**Cross-references:** [Question §4.1](#ax-0009-s4-1),
[Question Set §4.3](#ax-0009-s4-3).

<a id="ax-0009-s4-3"></a>

### 4.3 Question Set

**Definition:** A named, persisted, ordered membership artifact. Its stored
`questionIds` are authoritative launch membership and preserve their stored
order. Optional source links, tags, filter snapshot, ordering, and seed
describe provenance; later filter or tag changes do not alter membership.
Explicit Question deletion or validated orphan repair may remove unavailable
IDs while preserving the relative order of survivors.

**Purpose:** Give the learner a durable, reproducible set of Questions that can
be revisited, backed up, and launched consistently.

**Related terms:** Question, Question-Set Membership Snapshot, Quiz Block,
Quiz Session.

**Cross-references:** [Question-Set Membership Snapshot §4.4](#ax-0009-s4-4),
[Quiz Block §4.5](#ax-0009-s4-5),
[AX-0002 C-008](AX-0002-CONSTITUTION.md#ax-0002-c-008).

<a id="ax-0009-s4-4"></a>

### 4.4 Question-Set Membership Snapshot

**Definition:** The ordered `questionIds` captured when a Question Set is
created. It is frozen against later filter or tag drift; creation filters,
ordering, and seed are provenance and do not cause runtime reshuffling.
Explicit Question deletion or validated orphan repair may remove an unavailable
member, but no other path silently reconstructs membership.

**Purpose:** Keep a Question Set stable across launches, reloads, and supported
backup operations.

**Related terms:** Question Set, Snapshot, filter, ordering, seed.

**Cross-references:** [Question Set §4.3](#ax-0009-s4-3),
[Snapshot §2.7](#ax-0009-s2-7).

<a id="ax-0009-s4-5"></a>

### 4.5 Quiz Block

**Definition:** A saved, re-runnable practice recipe containing mode, timing,
and live pool filters. Unlike a Question Set, a Quiz Block may resolve a
different eligible pool when the Question Bank changes.

**Purpose:** Let the learner repeat a practice configuration without pretending
its membership is frozen.

**Related terms:** Question Set, Quiz Session, filter.

**Cross-references:** [Question Set §4.3](#ax-0009-s4-3),
[Quiz Session §4.6](#ax-0009-s4-6).

<a id="ax-0009-s4-6"></a>

### 4.6 Quiz Session

**Definition:** A persisted tutor- or exam-mode attempt over a resolved,
ordered list of Question IDs, with answers, timing, filters, and an optional
score. A Quiz Session is the historical run, not the reusable Question Set or
Quiz Block that may have launched it.

**Purpose:** Preserve the exact practice event and its results.

**Related terms:** Question Set, Quiz Block, Study Session, Accuracy.

**Cross-references:** [Question Set §4.3](#ax-0009-s4-3),
[Quiz Block §4.5](#ax-0009-s4-5),
[Accuracy §5.1](#ax-0009-s5-1).

<a id="ax-0009-s5"></a>

## 5. Metrics and evidence

<a id="ax-0009-s5-1"></a>

### 5.1 Accuracy

**Definition:** Correct scored responses divided by all scored responses in an
explicitly named scope and time window. Unscored or unresolved mappings are
excluded. `Accuracy` must identify its numerator, denominator, scope, and
window; parser-validation accuracy is a separate engineering metric.

**Purpose:** Report historical performance without hiding the denominator or
mixing product and parser metrics.

**Related terms:** Attempt Accuracy, Quiz Session Accuracy, Mapping Readiness,
Mastery.

**Cross-references:** [Quiz Session §4.6](#ax-0009-s4-6),
[Mastery §5.2](#ax-0009-s5-2),
[AX-0002 C-002](AX-0002-CONSTITUTION.md#ax-0002-c-002).

<a id="ax-0009-s5-2"></a>

### 5.2 Mastery

**Definition:** A family of scope-specific measures of current learning state,
never one universal AXOM score. Every use must qualify the domain and disclose
the calculation—for example, Question Current Mastery, Course Tracker Mastery,
or Blueprint Node Mastery.

**Purpose:** Prevent incompatible calculations from appearing to describe the
same thing.

**Related terms:** Question Current Mastery, Accuracy, Blueprint, Course
Tracker.

**Cross-references:** [Question Current Mastery §5.3](#ax-0009-s5-3),
[Accuracy §5.1](#ax-0009-s5-1),
[AX-0002 C-002](AX-0002-CONSTITUTION.md#ax-0002-c-002).

<a id="ax-0009-s5-3"></a>

### 5.3 Question Current Mastery

**Definition:** The percentage of in-scope Questions with at least one stored
scored attempt whose latest scored attempt is correct. Unattempted Questions
are excluded, and each attempted Question contributes only its latest scored
attempt.

**Purpose:** Show current Question Bank state separately from historical
Attempt Accuracy.

**Related terms:** Mastery, Attempt Accuracy, Question, Quiz Session.

**Cross-references:** [Mastery §5.2](#ax-0009-s5-2),
[Accuracy §5.1](#ax-0009-s5-1).

<a id="ax-0009-s5-4"></a>

### 5.4 Learner Readiness

**Definition:** A dated, deterministic estimate of present study capacity from
inspectable, grounded learner signals. It is not medical advice. It may shape
suggested effort only when supported by user-confirmed or otherwise approved
evidence.

**Purpose:** Adapt workload without presenting an opaque wellness judgment.

**Related terms:** Command Brief, Daily Check-In, Mapping Readiness.

**Cross-references:** [Command Brief §3.2](#ax-0009-s3-2),
[AX-0002 C-002](AX-0002-CONSTITUTION.md#ax-0002-c-002).

<a id="ax-0009-s5-5"></a>

### 5.5 Mapping Readiness

**Definition:** The trust state of an imported Question’s answer mapping:
`Ready`, `Review suggested`, or `Unresolved`. Only `Ready` mappings are
runnable and scoreable as known answers.

**Purpose:** Prevent uncertain parser output from becoming false answer truth.

**Related terms:** Question, Learner Readiness, import review, provenance.

**Cross-references:** [Question §4.1](#ax-0009-s4-1),
[AX-0002 C-002](AX-0002-CONSTITUTION.md#ax-0002-c-002).

<a id="ax-0009-s6"></a>

## 6. Daily Games

<a id="ax-0009-s6-1"></a>

### 6.1 Daily Games

**Definition:** AXOM’s optional, locally usable product area for bounded daily
play experiences. The area may contain multiple Games, but its visibility does
not imply every planned Game is implemented.

**Purpose:** Make AXOM feel like a living ecosystem without allowing optional
play to compete with core academic work.

**Related terms:** Game, Puzzle, Daily Word, Doctordle.

**Cross-references:** [Game §6.2](#ax-0009-s6-2),
[AX-0002 C-010](AX-0002-CONSTITUTION.md#ax-0002-c-010).

<a id="ax-0009-s6-2"></a>

### 6.2 Game

**Definition:** A named, rules-based playable experience within Daily Games.
There is no generic persisted `Game` entity; stored state belongs to the
specific Game or Puzzle implementation.

**Purpose:** Name the user-facing activity without inventing a shared storage
contract.

**Related terms:** Daily Games, Puzzle, Daily Word, Doctordle.

**Cross-references:** [Daily Games §6.1](#ax-0009-s6-1),
[AX-0002 C-010](AX-0002-CONSTITUTION.md#ax-0002-c-010).

<a id="ax-0009-s6-3"></a>

### 6.3 Puzzle

**Definition:** One dated or otherwise bounded playable instance of a Game,
including its specific state and completion result.

**Purpose:** Distinguish the Game concept from one day’s playable record.

**Related terms:** Game, Daily Games, game history.

**Cross-references:** [Game §6.2](#ax-0009-s6-2).

<a id="ax-0009-s7"></a>

## 7. Adding or changing a term

Only the Product Owner approves a canonical definition under
[AX-0003 — Governance](AX-0003-GOVERNANCE.md).

1. Identify the ambiguity and affected AX IDs.
2. Propose a definition, purpose, related terms, and cross-references.
3. Review code and documentation evidence without allowing current
   implementation accidents to become product intent.
4. Append the decision and preserve prior wording.
5. Add a new stable section for a materially new meaning.
6. Update affected backlog records and UX copy through their own AX IDs.

<a id="ax-0009-s8"></a>

## 8. Amendment history

| Version | Date | Owner | Change | Rationale | Affected AX IDs |
| --- | --- | --- | --- | --- | --- |
| `0.1.0` | 2026-07-18 | Sol, at Product Owner direction | Drafted canonical terminology for Workspace data, recovery, planning, Questions, metrics, and Daily Games for Product Owner acceptance. | Eliminate ambiguity before backlog reconstruction without self-approving product meaning. | `AX-0009` |

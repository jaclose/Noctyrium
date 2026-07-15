# AXOM Course Central — Architecture

**Status: design and wireframe only.** This feature is **not permissioned for
live SGU integration**. No live Sakai/Canvas/Elentra connector may be built
from this document. Levels 2 and 3 (§6) require explicit authorization and a
security review before any implementation.

Name: **AXOM Course Central** (alternative: AXOM School Link).

Product promise: *"Bring schedules, announcements, assignments, resources,
assessments, and curriculum progress into one learner-centered workspace."*

Related: [UNIVERSAL-QUESTION-IMPORT-ENGINE.md](UNIVERSAL-QUESTION-IMPORT-ENGINE.md)
(Layer 1 parsing), [WAVE-6-PLAN.md](WAVE-6-PLAN.md) (Layer 2/3 placement).

---

## 1. Hard boundaries (non-negotiable)

Do not: scrape authenticated school pages · store school credentials ·
automate login behind the user's back · bypass institutional access controls ·
imply school endorsement · claim live Sakai integration exists · expose
private institutional content · poll school systems without authorization.

For any connector: no credential scraping; no password storage; OAuth/API only
where the institution or LMS supports it; read-only first; explicit
institution attribution; explicit user consent; revocation and deletion;
data minimization; no automatic redistribution; no school-endorsement claims;
no medical-school private content in public templates; no grades imported
without explicit scope and need; no hidden analytics; no remote AI analysis of
institutional content without consent.

## 2. Institutional source of truth vs. AXOM learner overlay

| Institutional system (authoritative) | AXOM (learner-owned overlay) |
| --- | --- |
| Official curriculum and mapping | Study strategy and planning |
| Official assessments and grades | Question practice and mastery tracking |
| Official announcements and schedules | Command Brief and next-step logic |
| Administrative compliance | Study-tool integration (Anki, Noji, passes) |
| Legal record | Local notes, Journal, reflections |

AXOM pulls **authorized institutional evidence** into the learner's system.
It never replaces, mirrors, or competes with the institution's legal or
administrative source of truth, and every imported item carries visible
institution attribution.

## 3. Canadian medical-platform case study

**Elentra (formerly Entrada).** Began in 2008 as a collaboration between the
University of Calgary UME and Queen's University to manage curricular
information and deliver curriculum content; it grew into a consortium-
maintained "Integrated Teaching and Learning Platform" adopted by medical
schools across Canada, the US, and Singapore (exact membership count
unverified — the consortium page is offline), with tightly integrated
curriculum management, learning-event repositories, clinical/rotation
scheduling, assessment and evaluation, learner assignments, and
competency/accreditation (CBME) tracking. Queen's became an Elentra SaaS
customer and Elentra Inc. assumed consortium operations effective
Feb 26, 2024.

**UBC.** The Faculty of Medicine ran Entrada for MD UG/PG and allied programs
(Occupational Therapy, Audiology & Speech Sciences) and migrated to Elentra
Cloud in May 2026, adding a mobile app for checking schedules and completing
EPAs on the go. Separately, UBC's MedNet portal was refreshed (Dec 2022)
citing "an updated and streamlined navigation" and improved mobile
compatibility — evidence that even purpose-built medical platforms accumulate
navigation debt inside deeply nested learning spaces.

**Design lessons for AXOM:**

1. The institutional backbone worth integrating is: curriculum resources,
   schedules, assessments, events, learner assignments, clinical scheduling,
   curriculum mapping.
2. The recurring failure mode is sprawl — deeply nested spaces that users
   cannot navigate. AXOM must centralize the learner's work **without becoming
   a second sprawling LMS**: one calm page (§7), source labels, and
   exception-based attention.
3. AXOM's differentiator is the learner-facing intelligence layer connecting
   official records to study actions, questions, mastery, reflection, and
   next-step recommendations — not curriculum administration.
4. Do not clone Elentra.

Sources (last verified 2026-07-14):
[Elentra Consortium retrospective](https://elentra.org/retrospective/),
[Queen's joins Elentra Cloud](https://elentra.com/elentra-news/queens-university-joins-elentra-cloud),
[Queen's homegrown-platform history](https://www.queensu.ca/alumni/news/from-homegrown-software-platform-to-world-class-solution),
[UBC Entrada→Elentra Cloud upgrade](https://mednet.med.ubc.ca/announcements/upgrades-to-learning-platform-entrada-elentra-2026-03/),
[UBC MedNet refresh](https://mednet.med.ubc.ca/announcements/community-update/launch-of-refreshed-mednet-website/).
Two previously cited consortium pages
(`elentra.org/consortium/`, the 2018 consortium announcement) now return 404
and were removed rather than left as false support.

## 4. Potential sources

Sakai · Canvas · D2L Brightspace · Blackboard · Moodle · Elentra/Entrada ·
school-specific portals · calendar feeds · exported course packages ·
announcements · assignment lists · module schedules · assessment schedules.

## 5. Connector architecture and adapter contract

Every source enters through a **source adapter** that emits a common,
minimal, provenance-carrying shape. Adapters never touch UI; Course Central
consumes only normalized items.

```ts
type CourseCentralItemKind =
  | "event" | "announcement" | "assignment" | "resource"
  | "assessment" | "schedule_change" | "curriculum_item" | "unknown";

interface CourseCentralItem {
  id: string;                       // stable per source + sourceItemId
  kind: CourseCentralItemKind;
  title: string;                    // cleaned; original retained in provenance
  body?: string;
  startsAt?: string; endsAt?: string; dueAt?: string;
  courseRef?: string;               // mapped course/module in AXOM
  provenance: {
    sourceId: string;               // which configured source
    sourceLabel: string;            // "Sakai" | "Canvas" | "Course PDF" | "Manual" | "SGU template" | "User import"
    sourceItemId?: string;
    fetchedAt: string;              // staleness display derives from this
    originalTitle?: string;
    attribution: string;            // institution attribution, always displayable
  };
  classification: {
    label: "action_required" | "schedule_change" | "resource_posted"
         | "assessment_information" | "informational" | "urgent" | "unclear";
    confidence: number;
    evidence: string[];             // why AXOM classified it this way
  };
  state: "new" | "linked" | "dismissed" | "informational" | "needs_attention";
}

interface CourseSourceAdapter {
  id: string;
  label: string;
  level: 0 | 1 | 2 | 3;             // integration level, §6
  capabilities: { events: boolean; announcements: boolean;
                  assignments: boolean; resources: boolean;
                  assessments: boolean };
  // Level 0/1: parse user-supplied files; Level 2/3: authorized fetch.
  ingest(input: AdapterInput): Promise<CourseCentralItem[]>;
  // Read-only by default. Write-back (if ever) is a separate, explicit,
  // per-capability grant — never implied by read access.
}
```

Rules:

- **Read-only vs. write-back**: everything ships read-only. Write-back to any
  institutional system is out of scope for all current levels and would
  require its own consent, scope, and review.
- **Data minimization**: adapters request/parse only the capability fields the
  user enabled; grades are never ingested without explicit scope and need.
- **Revocation**: per-source disable and full deletion remove tokens, cached
  items, and derived links; provenance stubs remain only on items the user
  explicitly kept, relabeled as `Manual`.
- **Stale data**: every item shows freshness from `fetchedAt`; stale sources
  banner rather than silently showing old truth; nothing auto-polls beyond
  the authorized schedule.
- **Sync conflicts**: institutional data wins over AXOM's cached copy for
  institutional fields; learner-owned fields (links, notes, dismissals,
  mastery) always survive a refresh; a changed date on a linked item raises a
  `schedule_change` update instead of silently moving the learner's plan.

## 6. Four integration levels

**Level 0 — Manual structured import** (buildable now). User uploads course
calendar PDFs, module schedule PDFs, LMS exports, screenshots, copied
announcements, assignment lists, resource lists. AXOM parses locally. No
institutional permission needed beyond the user's lawful access to their own
materials. This is also the permanent **no-connector fallback**.

**Level 1 — Standard export integration** (buildable next). Institution-
provided formats: ICS calendars, CSV, Common Cartridge, LMS export packages,
downloadable outlines, assignment/announcement exports.

**Level 2 — User-authorized connector** (blocked on authorization + security
review). Only where the institution/LMS provides a supported OAuth/API
integration. Requirements: explicit user consent, token revocation, narrow
scopes, encrypted token handling, no password storage, read-only by default,
clear sync status, per-source disable, deletion support.

**Level 3 — Institutional partnership** (blocked on institution agreement).
Institution-approved integration, school-specific curriculum template,
supported cohorts, official course identifiers, authorized announcements and
schedules, validated mappings, support and change-management agreement.

**Do not implement Level 2 or 3 without explicit authorization and a security
review.**

### Institution-approval plan (path to Level 3)

1. Ship Levels 0–1; accumulate real learner value with zero institutional
   surface.
2. Prepare a data-flow and privacy dossier (this document + threat model).
3. Approach the institution (e.g. SGU) with a read-only, learner-consented
   proposal scoped to schedules/announcements/resources — explicitly excluding
   grades and administrative records.
4. Security review, pilot cohort, change-management agreement, then Level 3
   template validation (§9).

## 7. Learner experience — one calm page (wireframe)

```
┌─ Course Central ────────────────────────────────────────────────┐
│ Today                                                           │
│  09:00 Small Group 8            [SGU template]   → calendar     │
│  17:00 IMCQ 8                   [Course PDF]     → practice     │
│  Due: Ethics reflection         [Manual]         → tasks        │
│  ⚑ Announcement needs action    [Sakai export]   → view         │
├─────────────────────────────────────────────────────────────────┤
│ Courses                                                         │
│  BPM502  ▓▓▓▓▓▓░░ 74%   2 new items · 1 changed  [Course PDF]   │
│  PPM502  ▓▓▓░░░░░ 38%   no changes               [SGU template] │
├─────────────────────────────────────────────────────────────────┤
│ Updates                                                         │
│  • New announcement (informational)              [User import]  │
│  • Lecture 13 date changed (schedule change)     [Course PDF]   │
│  • New practice set uploaded (resource posted)   [User import]  │
├─────────────────────────────────────────────────────────────────┤
│ Needs attention                                                 │
│  ! Overdue: DLA 4                                               │
│  ! Schedule conflict: Small Group 8 vs. clinic                  │
│  ! Unmapped file: "Week4_extra.pdf"                             │
└─────────────────────────────────────────────────────────────────┘
```

- The **source label is always visible** on every item: Sakai, Canvas, Course
  PDF, Manual, SGU template, User import.
- Every imported update supports: View source · Add to Course Tracker · Add to
  calendar · Add to tasks · Dismiss · Mark informational · Link to
  lecture/module · Summarize locally · **Explain why AXOM classified it this
  way**.
- **Never treat every announcement as a task.** Announcements classify as:
  action required · schedule change · resource posted · assessment
  information · informational · urgent · unclear. Only `action required` (and
  user-promoted items) can create tasks.

## 8. Course-software item classification

When a course-software PDF, screenshot, export, or copied page is imported,
classify each item into: lecture · DLA · required reading · optional reading ·
small group · assignment · quiz · practice-question set · IMCQ event · IMCQ
question file · eSoft event · eSoft question file · OPLG · announcement ·
exam · office hours · administrative event · teaching resource · unknown.

**Use context, not keywords alone:**

| Signal | Classification |
| --- | --- |
| "IMCQ 8 — Friday 5 PM" in a calendar | event |
| "IMCQ 8 wAnswers.pdf" among uploaded files | practice-question source |
| "eSoft Quiz opens Monday" | assessment event |
| "eSoft Quiz Questions with Answers.pdf" | question set |
| "Small Group 8 workbook" | learning resource linked to the small-group event |
| "Small Group 8 — Thursday 10 AM" | event |

Preserve classification evidence and allow bulk correction. Title/metadata
cleanup follows the import engine's rules
([spec §6](UNIVERSAL-QUESTION-IMPORT-ENGINE.md)).

## 9. School-specific curriculum templates

Templates describe institution/program/term structure without hard-coding any
school into the universal core. **No SGU assumptions in shared code — SGU is
an adapter/template like any other school.**

```ts
interface InstitutionTemplate {
  id: string;
  institutionId: string;
  programId: string;
  version: string;
  academicPeriod?: string;
  supportedCohorts?: string[];
  supportedGroups?: string[];
  courseTemplates: CourseTemplateDefinition[];
  importRules?: TemplateImportRule[];
  metadata: TemplateMetadata;
}
```

A template may describe: institution, program, academic year, term,
course/module, cohort, college/group, lecture sequence, DLA sequence,
readings, small-group schedule, IMCQ schedule, eSoft schedule, practice sets,
question-to-lecture relationships, completion prerequisites, and recommended
study-tool configuration.

Learner selects institution → program → term → cohort → college/group. AXOM
then configures: Course Tracker structure, scheduled events, suggested
imports, Question Bank collections, recommended study-tool signals, and
Command Brief defaults.

### SGU Term workload template (starting with Term 3)

Supports: lecture chronology; DLAs positioned before or after the correct
lecture; required readings; small groups as events; IMCQs as scheduled events
when found in a calendar and as practice sets when uploaded as documents;
eSoft quizzes as events when scheduled and as practice sets when uploaded;
OPLGs as practice/teaching sets; learning objectives; associated question
ranges; prerequisite lectures; course-specific study-tool defaults; cohort and
college (A/B/C/D) selection.

Example relationship: Practice Set A — questions 1–8 recommended after
Lecture 12; questions 9–15 after Lectures 13–14; the whole set after
Lecture 14; explanation review links back to those lectures.

Default behavior is **"Recommended after these lectures"** — never a hard
lock. Optional strict mode: "Hide until prerequisites are complete." Do not
technically block a learner from opening questions unless they chose strict
sequencing.

## 10. Question-to-curriculum graph

A local graph linking: term · course · module · week · lecture · objective ·
DLA · reading · small group · practice set · question · explanation · study
activity · mastery signal.

Relationship examples: *Lecture 12 covers Question Set A Q1–8* · *DLA 4
precedes Lecture 13* · *Small Group 7 applies Lectures 11–14* · *Question 23
tests Objective IMM.4.2* · *Anki review exists for Lecture 12* · *Question
performance indicates Lecture 12 weakness*.

Command Brief and Course Tracker consume this graph to answer:

- What should I do next?
- Which lectures should I review before this question set?
- Which questions are now appropriate?
- Which objectives remain weak?
- Which uploaded resources have not been used?
- Which lectures are over-reviewed but under-practiced?

## 11. Community-submitted school support

For unsupported schools, a learner may submit: course schedule, module
structure, lectures, readings, practice sets, source-type examples,
anonymized curriculum relationships, or a proposed template.

Submission requirements: confirm the submitter is permitted to share the
material; warn against uploading restricted/copyrighted material for
redistribution; separate template **metadata** from protected **source
files**; allow private/local use without any submission; strip personal
information, grades, and student identifiers; never auto-publish school
materials.

Review workflow:

1. Learner builds a local course template.
2. Learner chooses "Submit template for support".
3. AXOM identifies the metadata that is safe to submit.
4. The user reviews every submitted field.
5. Submission enters administrator review.
6. Approved templates become a supported institution/program version.
7. Protected documents are not redistributed unless legally permitted.

Support levels, always displayed: **Community template → AXOM reviewed →
Institution verified → Official partnership.**

## 12. Yield and difficulty policy (curriculum-aware)

Conceptual difficulty ≠ exam yield; the graph stores them independently per
[import spec §17](UNIVERSAL-QUESTION-IMPORT-ENGINE.md). Immunology may be
conceptually difficult without every item being high yield; ethics may be
conceptually easier yet repeatedly examined and therefore high priority. Every
suggestion explains itself and both axes are independently overridable.

## 13. Implementation order

1. **Now (Layer 2 groundwork)**: `CourseCentralItem` + classification
   taxonomy, Level 0 manual import path reusing the import engine's intake
   stages, template data model, curriculum-graph schema.
2. **Next**: Level 1 (ICS/CSV/exports), Course Central page, SGU Term 3
   template as data (not code).
3. **Later, gated**: Level 2 connectors (per-LMS, post security review),
   community template submission, Level 3 partnership.

No live LMS connectivity before official APIs, permission, security review,
and — ideally — institutional cooperation.

# AXOM Universal Question Import Engine

**Status: binding product and architecture specification.** All future parser
work must conform to this document. It is not optional commentary and must not
be reduced to a roadmap paragraph.

Provenance note: this document consolidates the full Universal Question Import
Engine specification as supplied in the Wave 6 planning directive (sections
50–66 of that directive). If the original 63-section source text is re-supplied
verbatim, reconcile it against this document and keep the stricter reading
wherever they differ.

Related documents:

- [QUESTION-IMPORT-EVALUATION-HARNESS.md](QUESTION-IMPORT-EVALUATION-HARNESS.md) —
  the deterministic acceptance command that already exists (Wave 5.5D). It
  becomes the seed of the regression corpus described here.
- [COURSE-CENTRAL-ARCHITECTURE.md](COURSE-CENTRAL-ARCHITECTURE.md) — curriculum
  templates, the question-to-curriculum graph, and institutional boundaries.
- [WAVE-6-PLAN.md](WAVE-6-PLAN.md) — where this engine sits in Wave 6
  (Priority 0, Layer 1).

---

## 1. Objective

One `Import` action accepts anything a learner lawfully possesses — PDFs,
images, screenshots, ZIPs, txt, md, docx, copied text, LMS exports, one file or
fourteen — and produces correctly bounded, correctly answered, correctly
explained, correctly classified, fully provenanced questions, with everything
uncertain routed to an exception-based review queue instead of the Question
Bank.

## 2. Success definition

The engine succeeds when:

- a learner can drop an entire module's files in at once and practice the
  ready questions immediately;
- no question ever carries an invented, defaulted, or silently conflicting
  answer;
- nothing the parser cannot prove is presented as proven;
- no source document, user correction, or prior answer state is ever lost;
- review is the exception, not the workflow.

## 3. The eight document families

| # | Family | Typical source | Answer evidence |
| --- | --- | --- | --- |
| 1 | ExamSoft questions-only | `BPM502 … Quiz_Questions.pdf` | none in-file |
| 2 | ExamSoft answered | `… Questions with Answers.pdf` | checkmark / selected-icon per option |
| 3 | Practice packet, split Q/A | question section + trailing key/explanations | explicit answer lines in a later section |
| 4 | Practice packet, inline answers | answer + explanation after each question | explicit answer line adjacent to stem |
| 5 | IMCQ slide deck | lecture-polling slide exports | answer slide repetition, checkmarks, highlights; poll charts present |
| 6 | OPLG slide deck | small-group teaching decks | highlight/bold on correct option; teaching slides interleaved |
| 7 | LMS/Sakai export | exported quizzes, common cartridge, HTML dumps | structured answer metadata when present |
| 8 | Answer key only | `… Answer Key.pdf`, compressed A–E lists | key only; questions live elsewhere |

Multi-part cases and generic MCQ text are cross-cutting shapes handled by
dedicated strategies (§7), not additional families.

## 4. Ten-stage pipeline

Do not build one monolithic `parsePdf()` function. The pipeline is:

1. **File intake** — accept files/paste/ZIP, checksum, quarantine unsupported
   types with a truthful message.
2. **Source normalization** — bytes → normalized source documents (§5).
3. **Layout and page extraction** — text with coordinates, fonts, styling,
   images, vectors, page renders, reading order.
4. **Document-family classification** — which of the eight families (with
   confidence and evidence), driving strategy selection.
5. **Section segmentation** — question section vs. answer key vs. explanation
   section vs. teaching content vs. front matter vs. noise.
6. **Question candidate detection** — boundaries, numbering, stems, option
   blocks.
7. **Cross-page and cross-file reconciliation** — representations merged into
   canonical questions (§9); batch-level pairing (§12).
8. **Answer and explanation resolution** — the evidence hierarchy (§10) and
   explanation model (§13).
9. **Academic classification** — institution/term/course/topic/type/difficulty
   suggestions (§16–17).
10. **Validation and persistence** — invariants enforced (§11), runnable policy
    applied (§18), provenance and logs stored (§19–20).

Every stage must emit: structured intermediate output, per-field confidence,
evidence, warnings, processing events, and recoverable source references. A
failure at stage N must leave stages 1–(N−1) outputs inspectable.

Canonical entities (each owned by one module; no entity may be collapsed into
another "for simplicity"): `SourceDocument` · `NormalizedDocument` ·
`QuestionRepresentation` · `CanonicalQuestion` · `AnswerSignal` ·
`AnswerResolution` · `ExplanationData` · `QuestionAsset` · `FieldProvenance` ·
`ParserIssue` · `UserCorrection` · `ParserRun` · `SourceTemplateProfile` ·
`QuestionSet` · curriculum relationships (Course Central §10).

Suggested module layout under `web/src/lib/import/`:

```
intake/  normalize/  layout/  classify/  segment/  questions/
reconcile/  answers/  explanations/  assets/  academic/
validate/  persist/  diagnostics/
```

## 5. Normalized document and layout model

Text extraction alone is insufficient. Normalized pages preserve, where the
source provides them:

- text runs with coordinates, font family, size, weight, underline, color,
  background color;
- vector graphics (checkmarks, boxes, highlight rects);
- embedded images with bounds;
- a rasterized page render (for visual diffing and crop fallbacks);
- computed reading order (not raw extraction order).

The normalized model is the only input the later stages may consume; no stage
reaches back to raw bytes except assets (§15) and diagnostics.

## 6. Cleanup rules — titles and metadata

Clean display titles without losing originals (§19 stores everything).

- Raw `2026-07-09_IMCQ 8_wAnswers.pdf` → display **IMCQ 8**, metadata
  `{ date: 2026-07-09, sourceType: IMCQ, variant: answered, originalFilename }`.
- Raw `BPM502_Summer 2026_Week 4 Exam Soft Quiz_Questions with Answers` →
  display **BPM502 Week 4 ExamSoft Quiz**.

Keep: lecture number, week, question-set number, course code.
Remove or demote to metadata: duplicate dates, underscores, extensions,
"copy", download counters, redundant "with answers" once variant metadata
carries it. Never remove meaningful numbering.

## 7. Strategy registry

A registry of parsing strategies; family classification proposes candidates,
strategies produce **proposals**, and reconciliation chooses with recorded
rationale. Do not silently take the last parser result.

Required strategies:

- `ExamSoftQuestionsOnlyStrategy`
- `ExamSoftAnsweredStrategy`
- `PracticeSplitQuestionsAnswersStrategy`
- `PracticeInlineAnswersStrategy`
- `IMCQSlideStrategy`
- `OPLGSlideStrategy`
- `SakaiExportStrategy`
- `AnswerKeyStrategy`
- `MultiPartCaseStrategy`
- `GenericMCQStrategy` — **fallback only**, never preferred over a matching
  specific strategy.

Multiple strategies may run (ensemble parsing). All proposals and their
evidence are retained for diagnostics; disagreement between strategies lowers
field confidence rather than being discarded.

**Institution-agnostic growth rule:** when a new school or publisher format is
encountered, the system gains a new registry strategy or a template profile
(§23) — never inline special-case branches inside an existing strategy. Each
supported institution must make the engine smarter without making it more
complex for existing users.

## 8. Question candidate detection, options, and stems

- Boundaries come from numbering, layout, typography, and section context —
  not keywords alone.
- Option parsing accepts A–E/a–e/1–5 labels but only with structural support:
  lowercase `a.` `b.` `c.` `d.` inside a mini-case stem is **not** an option
  block without alignment/typography evidence (§21).
- Stem cleanup removes headers, footers, page numbers, watermark noise, and
  broken hyphenation while recording every cleanup operation performed.
- Question-set grouping preserves the source's set identity (e.g. "IMCQ 8" is
  one set) and multi-file batches may contribute to one set.

## 9. Source representations vs. canonical questions

A question may appear in a questions-only section, an answered section, a
repeated answer slide, a paired answered file, an answer key, and an
explanation section. Each appearance is stored as a **representation** with
its own provenance. Reconciliation merges representations into **one canonical
question**.

- Never create duplicate runnable questions merely because the answered
  version repeats the question.
- Duplicate suppression uses normalized stem + option matching, then layout
  evidence for near-misses; uncertain merges become review items, not silent
  merges.
- Every representation is preserved as provenance forever.

## 10. Answer-signal hierarchy

From strongest to weakest:

1. User-confirmed correction (outranks everything, §24).
2. Authoritative explicit source: answer line ("Answer: C"), structured LMS
   answer metadata, answer key row matched to the question.
3. Visual selection evidence: ExamSoft checkmark / selected-answer icon,
   OPLG highlight/bold, answer-slide difference (§10a).
4. Answer-text matching: key gives answer *text* rather than a letter — match
   against option text with normalization; ambiguous matches stay unresolved.
5. Cross-file pairing evidence (§12).
6. AI/medical inference — **never source truth**; may only annotate, suggest
   in review, or flag inconsistency (§22).

Conflicts between levels 2–5 are surfaced as conflicts, not auto-resolved.
Two disagreeing authoritative sources remain `conflict` until a human decides.

### 10a. Visual answer evidence and polling charts

Visual answer evidence includes: checkmarks, selected-answer icons, colored
highlights, changed font weight, answer-slide differences, and explanation
boxes aligned to an option.

**Poll charts are analytics, not answer keys.** Do not infer correctness from
polling popularity — store poll distributions as engagement metadata only.

## 11. Answer resolution invariants (encode in code and tests)

1. Unknown is never A.
2. No answer index initializes to zero.
3. No `parsedIndex || 0` (or any falsy-coalescing on an index).
4. Invalid labels remain unresolved.
5. A confirmed answer must exist in the parsed options.
6. Conflict remains conflict.
7. Medical inference is not source truth.
8. Poll popularity does not determine correctness.
9. Questions-only is a valid state, not a failure.
10. Unresolved questions do not enter scored pools.
11. User-confirmed corrections outrank parser output.
12. Reparse cannot silently overwrite a user-confirmed answer.

Required regression: a fixture whose expected sequence is `B, D, A, C, E` must
persist exactly `B, D, A, C, E`. Any drift (especially toward A) fails the
gate.

## 12. Questions-only, answer-key, and paired files

Questions-only import is a first-class outcome: `answerStatus: "not_provided"`.
Allow: store as draft set; study answerless only if the user explicitly
enables it; link an answer key later; pair with an answered version; reprocess
later.

Answer-key-only files are stored as **relationship candidates**, not orphans.

Mass import compares the entire batch before finalizing any file
independently. Relationship types:

`questions_answered_pair` · `answer_key_for` · `explanation_key_for` ·
`duplicate_export` · `revision_of` · `probable_match` · `unknown`

**Sequence alignment.** Pairing a key or answered version to a question set
requires explicit numbering alignment: detect offsets, gaps, renumbering, and
sub-lettered items before mapping any row. A key row that cannot be aligned to
exactly one question stays unmapped (never nearest-match), and a detected
offset is recorded as evidence on every mapping it produced.

## 13. Explanation data model

Explanations are structured, never one forced plain string:

- general explanation;
- correct-answer rationale;
- distractor rationales keyed by option;
- key points, risk factors, protective factors;
- objective codes, references, teaching support;
- raw explanation candidate + cleaned explanation + cleanup operations;
- source page/span, confidence.

Never: place an explanation in option E; swallow the next question into an
explanation; delete valid distractor rationales; replace an explanation with a
bare objective code; automatically promote a teaching slide to a clean
rationale.

Answer confidence and explanation confidence are separate fields. When an
associated explanation argues for a different option than the resolved answer,
the answer keeps its source evidence but the question is deterministically
routed to review with an `explanation_answer_mismatch` issue — a correct
answer with a mismatched explanation is never presented as fully trusted.

## 14. Teaching-slide handling

Slide decks interleave teaching content with questions. Teaching slides are
classified and retained as linked learning resources — excluded from question
extraction, but available as explanation *support* with explicit provenance.
Target: ≥98% teaching-slide exclusion (§27).

## 15. Images, attachments, and tables

If a stem references visual material ("shown below", "attached", "histology",
"graph", "figure", "table") and no asset is associated, block or warn by
severity — an image-dependent question without its image is not runnable.

Store per asset: original asset, crop, page, bounds, type, caption, relation
confidence.

Tables: attempt structured rows/columns; always preserve a rendered crop for
uncertain tables and display the crop as fallback. Never flatten a complex
table into unusable prose and call that success.

## 16. Question types

`single best answer` · `multiple select` · `true/false` · `matching` ·
`numeric` · `free response` · `multi-part case` · `image-based MCQ` ·
`table-based MCQ` · `unknown`

Multi-part cases keep a shared vignette with ordered sub-questions; scoring
and navigation treat the case as a unit.

## 17. Academic, cognitive, and difficulty classification

Automatically **suggest** (all fields editable): institution, program, term,
course, course code, module, week, source type, assessment name, discipline,
organ system, topic, subtopic, lecture number, objective code, difficulty,
cognitive level.

Evidence hierarchy: (1) explicit document metadata → (2) filename →
(3) course/module title → (4) objective codes → (5) linked curriculum graph →
(6) content inference.

The user's current academic focus may influence **ranking** of suggestions but
never rewrites source truth: a Term 3 user importing immunology content gets
Term 3 as a strong suggestion only when source evidence supports it — never
merely because it is their current term.

**Yield ≠ difficulty.** Store separately: source emphasis, curriculum
centrality, exam relevance, conceptual difficulty, user weakness, historical
question frequency, instructor emphasis, confidence. Suggested yield:
`foundational | standard | high priority | exam critical`. Suggested
difficulty: `straightforward | moderate | difficult | integrated`. Every
suggestion is explainable ("High priority because this objective appears
across three lectures and two practice sets") and independently overridable.

## 18. Field confidence, runnable policy, and review queue

Confidence is **field-specific**: document format, question boundary, question
number, stem, options, answer, explanation, image, classification, duplicate
reconciliation.

Runnable requires internally valid structure **and** supported answer
evidence. Prefer unresolved over falsely ready.

Review is exception-based. Default result buckets:

`Ready` · `Review suggested` · `Unresolved` · `No source answer` ·
`Images missing` · `Possible duplicates`

High-confidence questions are never forced through manual review. The Review
Queue UI is card-based with a large preview (question, correct answer,
explanation, detected source/topic/lecture/term) and one-click
Accept / Edit / Skip.

Manual repair operations (all recorded as user corrections, §22–23): re-map an
answer · reassign or detach an explanation · merge or split questions · fix a
boundary · re-pair files or key rows · attach/crop a missing asset · edit any
classification field. Repairs never mutate the source document or its
extracted representations.

## 19. Provenance and the source-document model

Every question stores field-level provenance: question source, answer source,
explanation source, lecture source, module source, import batch, import
confidence, nearby source reference for repair, and version history.

Every source document stores: original filename, checksum, family
classification, extraction results, relationships, and import batch. Source
documents are never lost (`Lost source documents: 0`, §27) — original binary
retention remains governed by the storage-budget item in
[ROADMAP.md](../ROADMAP.md), but extracted text, layout, page provenance, and
checksums are mandatory today.

## 20. Processing logs, diagnostics, and issue taxonomy

Every import records a structured processing log: per-stage events, strategy
proposals, chosen resolutions, warnings, and timings. A parser issue taxonomy
(boundary error, option misparse, answer conflict, missing asset, pairing
failure, classification doubt, …) tags every warning so recurring failure
modes are countable across the corpus.

## 21. Semantic consistency and medical-inference guardrails

Deterministic checks run before any AI: answer exists in options; option
counts sane; stem non-empty; referenced assets present; explanation does not
contain the next question's stem; sets have contiguous numbering or an
explained gap.

AI responsibilities are strictly bounded: AI may summarize, classify, flag
inconsistency ("the explanation argues for B but the key says C"), and propose
review-queue suggestions. AI may **not** decide answers, invent explanations,
or overwrite deterministic output. Source-answer verification (AI agreeing or
disagreeing with the source answer) is stored as an annotation with its own
provenance, never as the answer.

## 22. Parser versioning and reparse

Every import records: parser version, strategy, processing events, field
provenance, confidence, source checksum.

When the parser improves, offer: "A newer parser may improve this set." with
actions Preview changes · Reparse · Preserve existing · Apply safe
improvements · Review conflicts.

Merge priority: **user-confirmed correction > authoritative later source >
deterministic parser > AI inference.** Reparse never silently overwrites a
user-confirmed field.

## 23. User-correction learning and template recognition

Record local correction patterns as **template profiles** (e.g. "this SGU OPLG
uses turquoise highlight", "this professor bolds the correct option",
"explanation appears in a right-side box", "answer slide follows question
slide", "footer text is noise", "this source uses lowercase option labels").

Profiles are local-first. Never send source files or corrections to a remote
model without explicit consent. Users can view, disable, reset, or scope a
learned template (this source only vs. this institution/template).

## 24. Testing: regression fixtures and property-based tests

- Golden fixtures per family — each fixture pairs the source (or sanitized
  source) with a **golden canonical JSON** of the expected persisted result —
  seeded by the existing Wave 5.5D harness
  ([QUESTION-IMPORT-EVALUATION-HARNESS.md](QUESTION-IMPORT-EVALUATION-HARNESS.md))
  and grown with the permanent corpus (§26).
- Property-based tests for invariants (§11): shuffled keys, missing labels,
  degenerate options, off-by-one numbering — the persisted answers must always
  match the source or stay unresolved.
- Every fixed bug adds a fixture before the fix lands.

## 25. Performance and local-first storage

Parsing is local-first: heavy stages (pdf.js, rasterization, diffing) run in
workers/lazy chunks consistent with the existing code-splitting policy; large
batches stream per-file progress ("Importing 14 files…") and never block the
UI. All artifacts persist in local storage under the existing workspace/vault
model; nothing leaves the device without explicit consent.

## 26. Acceptance corpus

Initial permanent corpus (grows as the user supplies more):

Ethics practice packet · Family Violence · Health Systems · Immunology
practice set · IMCQ 8 · IMCQ 9 · ExamSoft questions-only · ExamSoft answered ·
Anatomy OPLG · DM OPLG · Sakai question examples · future OPLGs/IMCQs/eSofts.

## 27. Acceptance targets

| Metric | Target |
| --- | --- |
| Question count accuracy | 100% |
| Stem boundary accuracy | ≥99.5% |
| Option extraction accuracy | ≥99.5% |
| Duplicate suppression | 100% |
| Explicit answer-line mapping | 100% |
| ExamSoft checkmarks | 100% |
| OPLG highlights | ≥98% |
| IMCQ checkmarks | ≥98% |
| Answer-slide pairing | ≥99% |
| Explicit explanation mapping | ≥99% |
| Distractor rationale mapping | ≥97% |
| Teaching-slide exclusion | ≥98% |
| Invented answers | 0 |
| Silent answer conflicts | 0 |
| Default-to-A failures | 0 |
| Lost source documents | 0 |
| Overwritten user corrections | 0 |

**Do not claim these targets are met until measured against the actual
corpus.**

## 28. Unified import experience

One primary Question Bank action: **Import**. No separate visible "Mass
Import".

Copy: "Upload one file or several related files." Accepted: PDFs,
screenshots, images, text, DOCX, supported LMS exports.

Batch recognition result, e.g.:

> We found: one questions-only file, one answered version, two IMCQ sets, one
> OPLG deck.

Processing view: files · questions found · answer sources matched ·
explanations found · images attached · issues requiring review.

Final states: Ready to practice · Needs review · No source answer · Blocked.
Primary action: **Open ready questions**. Secondary: Review issues. Tertiary:
Save sources only.

## 29. Implementation phases

- **Phase 1 — Structural reliability**: normalized document/layout model,
  Practice Packet + ExamSoft strategies, answer-line parsing, cross-file
  pairing, provenance, all-A safeguards, golden fixtures.
- **Phase 2 — Slide intelligence**: repeated-slide pairing, same-slide
  duplicate removal, checkmark/bold/highlight detection, slide differencing,
  teaching-slide exclusion.
- **Phase 3 — Assets**: image association, attachment mapping, table
  preservation, missing-asset detection.
- **Phase 4 — Semantic enrichment**: topic/term/course, question type,
  cognitive level, difficulty, yield, explanation cleanup.
- **Phase 5 — Adaptive parsing**: template profiles, correction learning,
  parser version upgrades, reparse, source-answer verification.

Do not attempt every phase in one unreviewed commit.

## 30. Core invariants (summary)

- Deterministic before AI; AI annotates, never decides.
- Every field carries confidence, evidence, and provenance.
- Unknown is never A; unresolved beats falsely ready.
- Conflicts surface; nothing resolves silently.
- User corrections are permanent unless the user changes them.
- Sources, representations, and processing logs are never lost.
- Local-first; nothing leaves the device without explicit consent.

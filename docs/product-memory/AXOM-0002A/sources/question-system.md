# AXOM Institutional Backlog Reconstruction — Question System Evidence Catalogue

Read-only evidence catalogue prepared for AXOM-0002 Phase A. This is not a
backlog assignment, an implementation plan, or an architecture proposal. It
contains no proposed AX IDs. Candidate records below are deduplicated product
observations that have enough evidence to be named and classified. Items whose
canonical meaning cannot be established without Product Owner judgment are
kept in **Reconstruction notes**, not promoted as candidates.

## Evidence boundary

Primary evidence reviewed:

- `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md`
- `docs/QUESTION-IMPORT-EVALUATION-HARNESS.md`
- `docs/EXPERIENCE-REFINEMENT-WAVE.md`
- `docs/WAVE-6-PLAN.md`
- `docs/WAVE-6A-EXECUTION-PLAN.md`
- `docs/WAVE-6-CONSOLIDATION.md`
- `docs/CORPUS-CANDIDATES.md`
- `docs/PRE-ALPHA-CONTRACT.md`
- `docs/governance/AX-0009-PRODUCT-LEXICON.md`
- `FEATURES.md` and `ROADMAP.md` only where they provide status evidence for
  Question-system claims
- Question-system tests as behavioral evidence, not as product authority
- Relevant commit subjects and committed ledger evidence
- Owner attachment `3dbc3f68-5a54-4646-9c08-35dd09549f77/pasted-text.txt`
- Owner attachment `5bc1d2b2-34cf-4abc-a750-414b16d32f03/pasted-text.txt`

Status vocabulary in this catalogue is descriptive:

- **Verified:** committed behavior has direct test/review/gate evidence.
- **Implemented, not independently verified here:** repository evidence says it
  exists, but this reconstruction did not rerun it.
- **Partial:** a bounded shipped capability exists and a broader approved
  product outcome remains open.
- **Planned / Deferred / Blocked:** source documents say so explicitly.
- **Owner Decision Required:** evidence conflicts or is not canonical enough to
  choose a meaning.

No priority or board is supplied unless a source explicitly assigns one.

---

## Candidate catalogue

### Question Bank as AXOM's flagship practice loop

- **Category:** Product Decision
- **Area/System:** Question Bank
- **Observed status:** Confirmed product direction; the current product contains
  the corresponding Question Bank system.
- **Priority / board:** Question Bank is Tier 1 critical before Alpha
  (`docs/PRE-ALPHA-CONTRACT.md:164-171`). No canonical backlog board is assigned
  in the evidence.
- **Product DNA:**
  - **Design Intent:** Turn messy source material into reliable practice while
    always making the next useful action obvious.
  - **Product Principle:** One cohesive academic operating system; convenience
    is part of the product.
  - **Core Promise:** “Import, review, quiz, repair, repeat.”
  - **User Feeling:** The Question Bank should feel premium, powerful,
    convenient, and reliable, not like disconnected React screens.
  - **Product Truth:** The Question Bank is a flagship product pillar, not an
    ancillary file viewer.
- **Acceptance / success evidence:** A first-time learner can enter through
  Import; a returning learner can continue, review mappings, or practice due,
  missed, and weak material; uncertain mappings remain outside scored pools.
- **Evidence:** owner attachment
  `5bc…/pasted-text.txt:1-10,274-325,732-768`; `FEATURES.md:199-233`;
  `docs/PRE-ALPHA-CONTRACT.md:110-127,164-171`.
- **Explicit exclusions:** This record does not prescribe parser architecture,
  visual implementation, AI, or a roadmap checkpoint.
- **Conflicts / unknowns:** None material. The broad owner rehaul request was
  later decomposed into narrower accepted checkpoints.
- **Dedupe key:** `question-bank.flagship-import-review-practice-repair-loop`

### One visible Import action

- **Category:** Product Decision
- **Area/System:** Question Bank / Import
- **Observed status:** Verified as a visible-surface consolidation; the broader
  Universal Import capability remains partial.
- **Priority / board:** Import Engine 2.0 is explicitly P0/highest priority
  (`docs/WAVE-6-PLAN.md:32-49`). Board not explicitly sourced.
- **Product DNA:**
  - **Design Intent:** Remove artificial distinctions between one-file and
    multi-file intake.
  - **Product Principle:** One obvious path for a common task; power without
    complexity.
  - **Core Promise:** One Import action accepts one file or several related
    files.
  - **User Feeling:** “I do not need to know which importer to choose.”
  - **Product Truth:** “Mass Import” is batch behavior, not a second primary
    product surface.
- **Acceptance / success evidence:** The visible Question Bank has one Import
  tab/action, copy explicitly permits multiple related files, and paste/inspect
  routing remains reachable.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:471-489`;
  `docs/WAVE-6-PLAN.md:34-49`;
  `docs/EXPERIENCE-REFINEMENT-WAVE.md:651-664`;
  `docs/PRE-ALPHA-CONTRACT.md:129-133`; committed checkpoint `99fa3ac`.
- **Explicit exclusions:** Does not claim all planned formats or the full
  ten-stage engine are implemented.
- **Conflicts / unknowns:** The older owner attachment requested separate
  “Quick import” and “Mass import” buttons (`5bc…:280-287`). The later binding
  decision explicitly replaces visible Mass Import with Import. Both sources
  are preserved; chronology and binding status resolve the surface naming.
- **Dedupe key:** `question-import.single-visible-action`

### Mapping Readiness is the runnable truth boundary

- **Category:** Product Decision
- **Area/System:** Import trust / Quiz eligibility
- **Observed status:** Verified and lexically canonical.
- **Priority / board:** Parser trust is accepted work that must not regress;
  Universal Import is Tier 1/P0. Board not explicitly sourced.
- **Product DNA:**
  - **Design Intent:** Prevent uncertain parser output from becoming a false
    answer presented to the learner.
  - **Product Principle:** Trust over cleverness; unresolved beats falsely
    ready.
  - **Core Promise:** Only `Ready` answer mappings are runnable and scoreable as
    known answers.
  - **User Feeling:** “AXOM will tell me when it does not know.”
  - **Product Truth:** `Ready`, `Review suggested`, and `Unresolved` are
    different trust states, not cosmetic labels.
- **Acceptance / success evidence:** Unresolved and review-suggested mappings
  are excluded from runnable pools; false-ready count remains zero; repair
  changes mapping diagnostics without rewriting attempts.
- **Evidence:** `docs/governance/AX-0009-PRODUCT-LEXICON.md:617-628`;
  `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:334-357`;
  `docs/QUESTION-IMPORT-EVALUATION-HARNESS.md:55-78`;
  `web/src/lib/questionBank.test.ts:867-899`;
  `web/src/lib/questions.test.ts:122-185`;
  `FEATURES.md:214-222`.
- **Explicit exclusions:** Mapping Readiness is not Learner Readiness, medical
  correctness certification, or an AI confidence score.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question-mapping.readiness-runnable-boundary`

### Unknown answers never default to A

- **Category:** Product Decision
- **Area/System:** Import trust
- **Observed status:** Verified invariant.
- **Priority / board:** Part of P0 Import Engine trust; no explicit board.
- **Product DNA:**
  - **Design Intent:** Make absence, invalidity, and conflict visible instead of
    manufacturing certainty.
  - **Product Principle:** Trust over cleverness.
  - **Core Promise:** Missing, malformed, ambiguous, or conflicting answer
    evidence never becomes option A or the first option.
  - **User Feeling:** “AXOM would rather stop me than confidently teach me the
    wrong answer.”
  - **Product Truth:** Unknown is a valid state; questions-only import is not a
    parser failure.
- **Acceptance / success evidence:** No default index, invalid labels remain
  unresolved, conflicts remain conflicts, confirmed keys must exist among
  options, and `B,D,A,C,E` survives exactly.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:218-235,508-516`;
  `docs/WAVE-6A-EXECUTION-PLAN.md:190-214`;
  `web/src/lib/questionAnswerTrust.test.ts:21-102`;
  `web/src/lib/questionBank.test.ts:465-731`.
- **Explicit exclusions:** Does not assert that source answers are medically
  correct.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question-answer.unknown-never-default-a`

### User-confirmed answer mappings outrank parser output

- **Category:** Product Decision
- **Area/System:** Import trust / Repair
- **Observed status:** Verified.
- **Priority / board:** No standalone priority or board sourced.
- **Product DNA:**
  - **Design Intent:** Keep deliberate learner corrections authoritative across
    re-import and parser evolution.
  - **Product Principle:** The user stays in control; the student never loses
    work.
  - **Core Promise:** A parser or reparse never silently overwrites a
    user-confirmed mapping.
  - **User Feeling:** “My correction will not mysteriously revert.”
  - **Product Truth:** User confirmation is higher-order evidence than
    deterministic parser output or AI inference.
- **Acceptance / success evidence:** Re-import preserves the confirmed mapping;
  confirmation clears only the answer review gate; attempts and practice state
  remain unchanged.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:191-207,394-405`;
  `web/src/components/questions/ImportPanel.test.tsx:241-321`;
  `FEATURES.md:219-222`.
- **Explicit exclusions:** The user may still deliberately change or undo the
  correction.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question-answer.user-confirmed-precedence`

### Source text and learner overlays remain distinct

- **Category:** Product Decision
- **Area/System:** Question provenance / Annotations
- **Observed status:** Verified for notes, highlights, and repair behavior.
- **Priority / board:** No explicit standalone priority or board.
- **Product DNA:**
  - **Design Intent:** Preserve source truth and learner work without making
    either overwrite the other.
  - **Product Principle:** One source of truth; the student never loses work.
  - **Core Promise:** Repairs, notes, highlights, and parser reruns never rewrite
    imported source text or erase its representations.
  - **User Feeling:** “I can add my learning without corrupting the source.”
  - **Product Truth:** Annotations are learner-owned overlays; provenance is
    source evidence.
- **Acceptance / success evidence:** Highlights preserve exact source text;
  source corrections reconcile or mark anchors for repair; manual repair does
  not rewrite attempts or source excerpts.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:176-190,353-370`;
  `docs/EXPERIENCE-REFINEMENT-WAVE.md:900-959,993-1018`;
  `web/src/lib/questionAnnotations.test.ts:28-133`;
  `web/src/components/questions/QuestionDetailModal.test.tsx:59-168`.
- **Explicit exclusions:** Learner notes are not source explanations; generated
  content is not source truth.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question.source-immutable-learner-overlay`

### Field-level provenance and inspectable parser evidence

- **Category:** Feature
- **Area/System:** Import / Question detail / Quiz feedback
- **Observed status:** Implemented and behaviorally covered; the future Universal
  Engine expands the same principle.
- **Priority / board:** Universal Import is P0; no standalone board.
- **Product DNA:**
  - **Design Intent:** Let a learner answer “Why did the parser choose this
    answer?”
  - **Product Principle:** No black boxes; every consequential decision is
    inspectable.
  - **Core Promise:** Question, answer, and explanation sources remain separately
    attributable with confidence and conflict evidence.
  - **User Feeling:** “I can inspect the evidence instead of trusting a mystery
    score.”
  - **Product Truth:** Confidence is field-specific, and question, answer, and
    explanation provenance are independent.
- **Acceptance / success evidence:** Separate pages/spans and source snippets
  render through disclosure; ambiguous provenance remains unset; bounded nearby
  grounded evidence is offered without inventing a fallback.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:334-378`;
  `docs/PRE-ALPHA-CONTRACT.md:94-108`;
  `web/src/lib/questionProvenance.test.ts:5-120`;
  `FEATURES.md:234-249`.
- **Explicit exclusions:** Diagnostics do not certify medical truth and need not
  appear as ordinary user-facing noise.
- **Conflicts / unknowns:** Full per-stage `ParserRun` diagnostics belong to the
  unbuilt Universal Engine and must not be marked complete from current
  per-question evidence alone.
- **Dedupe key:** `question-import.field-provenance-inspectable-evidence`

### Current multi-format Question import

- **Category:** Feature
- **Area/System:** Import
- **Observed status:** Partial.
- **Priority / board:** Import Engine is P0/highest priority; no explicit board.
- **Product DNA:**
  - **Design Intent:** Let learners bring lawfully possessed question material
    into AXOM without manual re-entry.
  - **Product Principle:** Convenience with truthful capability boundaries.
  - **Core Promise:** Supported inputs use the same review-gated Question flow.
  - **User Feeling:** “I can start with the source I actually have.”
  - **Product Truth:** PDF text layers, DOCX, TXT/Markdown, CSV, JSON, and pasted
    text are supported today; scanned/image sources are not OCR claims.
- **Acceptance / success evidence:** Supported formats create drafts or honest
  source-only records; malformed JSON yields a clear warning; images without
  extractable text remain provenance-only.
- **Evidence:** `FEATURES.md:319-334`;
  `web/src/lib/questionBank.test.ts:799-865`;
  `web/src/components/questions/LibraryPanels.test.tsx:30-42`;
  commit `29c70c1`.
- **Explicit exclusions:** ZIP, legacy `.doc`, general screenshots/images as
  extracted questions, and arbitrary LMS exports are not verified current
  support.
- **Conflicts / unknowns:** The Universal Import objective lists broader future
  types (`docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:25-32`). Do not turn that
  objective into a shipped-status claim.
- **Dedupe key:** `question-import.current-supported-inputs`

### Batch intake and exception handoff

- **Category:** Feature
- **Area/System:** Import
- **Observed status:** Implemented, not independently rerun in this
  reconstruction.
- **Priority / board:** Import Engine P0; no explicit board.
- **Product DNA:**
  - **Design Intent:** Import related files together and spend attention only
    where evidence is uncertain.
  - **Product Principle:** Power without complexity; review is the exception.
  - **Core Promise:** Multiple files show bounded progress and preserve every
    field and warning into inspection.
  - **User Feeling:** “I can import a batch without babysitting each clean
    question.”
  - **Product Truth:** Batch status and review routing are distinct from false
    trust.
- **Acceptance / success evidence:** Per-file state, bounded concurrency,
  question counts, source identity, pages and warnings survive the handoff;
  ready mappings may be batch saved only under the canonical trust classifier.
- **Evidence:** `FEATURES.md:299-305`;
  `web/src/components/questions/MassImport.test.tsx:56-129`;
  `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:471-489`.
- **Explicit exclusions:** Current batch intake is not evidence that future
  cross-file reconciliation and sequence alignment are complete.
- **Conflicts / unknowns:** Internal component names retain “Mass Import,” while
  visible product terminology is Import. That is intentional compatibility, not
  a second visible product.
- **Dedupe key:** `question-import.batch-intake-exception-handoff`

### Source Library and parse-later workflow

- **Category:** Feature
- **Area/System:** Source Library / Import
- **Observed status:** Verified by focused component tests and shipped-feature
  record.
- **Priority / board:** No standalone priority or board sourced.
- **Product DNA:**
  - **Design Intent:** Preserve a useful source even when it cannot yet produce
    valid Questions.
  - **Product Principle:** Sources are never lost; truthful partial capability
    beats fabricated output.
  - **Core Promise:** A source can be saved without fake Questions and parsed
    locally later.
  - **User Feeling:** “My file is safe even when AXOM cannot yet interpret it.”
  - **Product Truth:** A Source Document is not a Question, and an empty parse
    is not permission to invent records.
- **Acceptance / success evidence:** No-question sources save library-only;
  failed validation creates no empty set; saved document identity is reused when
  Questions are created later; local parsing requires no AI provider.
- **Evidence:** `FEATURES.md:95-102,331-334`;
  `web/src/components/questions/ImportPanel.test.tsx:181-240,323-340`;
  `web/src/components/questions/LibraryPanels.test.tsx:30-42`.
- **Explicit exclusions:** Original PDF/DOCX binary retention is separate and
  currently blocked.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question-source-library.parse-later-no-fake-records`

### Layered current parser behavior

- **Category:** Feature
- **Area/System:** Question parsing
- **Observed status:** Implemented and regression-covered for the shipped parser;
  not equivalent to the planned ten-stage Universal Engine.
- **Priority / board:** Parser reliability is within P0 Import Engine.
- **Product DNA:**
  - **Design Intent:** Preserve document structure well enough to separate
    questions, options, answers, explanations, and metadata.
  - **Product Principle:** Deterministic before AI.
  - **Core Promise:** Structure is parsed without swallowing the next question
    or treating ordinary A–E prose as options.
  - **User Feeling:** “What I imported still looks like the question I own.”
  - **Product Truth:** Question boundaries require structural evidence, not
    keywords alone.
- **Acceptance / success evidence:** Numbered and unnumbered forms, Q/Question
  prefixes, multiline stems/options, OCR-like spacing, inline options, trailing
  keys, later explanations, and A–E-leading rationale prose have focused tests.
- **Evidence:** `web/src/lib/questionBank.test.ts:23-169,262-731`;
  `docs/QUESTION-IMPORT-EVALUATION-HARNESS.md:11-34`;
  `FEATURES.md:293-308`.
- **Explicit exclusions:** Complex columns, damaged text layers, visual
  checkmarks/highlights across arbitrary PDFs, and OCR are not certified by
  these fixtures.
- **Conflicts / unknowns:** The current parser predates the modular Universal
  Engine. Its existence does not satisfy or invalidate the future engine
  contract.
- **Dedupe key:** `question-parser.current-layered-structural-behavior`

### Questions-only and answer-key workflows

- **Category:** Feature
- **Area/System:** Import / Answer mapping
- **Observed status:** Partial.
- **Priority / board:** Within P0 Import Engine.
- **Product DNA:**
  - **Design Intent:** Preserve useful Questions and keys even when answer
    evidence arrives separately.
  - **Product Principle:** Absence is a valid state; do not fabricate.
  - **Core Promise:** Questions-only content stays draft/unresolved, and supported
    keys map deterministically by explicit number.
  - **User Feeling:** “I can import now and supply the answer source later.”
  - **Product Truth:** A questions-only document is not a failed import.
- **Acceptance / success evidence:** Trailing keys in several formats map by
  question number; missing/conflicting/impossible entries remain review-gated;
  malformed key sections do not become fake Questions.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:237-256`;
  `web/src/lib/questionBank.test.ts:62-118,465-710`.
- **Explicit exclusions:** Full batch-wide cross-file relationship scoring and
  dynamic sequence alignment are future Universal Engine scope.
- **Conflicts / unknowns:** The current degree of answered-file pairing is not
  independently established by the reviewed tests.
- **Dedupe key:** `question-import.questions-only-and-answer-key`

### Exception-based mapping inspection and repair

- **Category:** Feature
- **Area/System:** Import review / Question detail
- **Observed status:** Partial: a review-gated current surface exists; the
  Universal Engine's full exception queue is planned.
- **Priority / board:** Import review queue is Tier 2 strongly recommended;
  answer-mapping correctness is P0.
- **Product DNA:**
  - **Design Intent:** Require deliberate review only where evidence cannot
    safely establish a runnable mapping.
  - **Product Principle:** Review is the exception, not the default workflow.
  - **Core Promise:** A learner can inspect evidence, confirm or repair a
    mapping, and never have attempts rewritten by that repair.
  - **User Feeling:** “AXOM shows me exactly what needs my judgment.”
  - **Product Truth:** Review volume and false trust are different problems.
- **Acceptance / success evidence:** Current review shows candidates and
  conflicts, supports deliberate confirmation, preserves non-answer review
  gates, and never advertises unresolved Questions as runnable.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:343-357`;
  `web/src/components/questions/ImportPanel.test.tsx:46-179,241-321`;
  `web/src/pages/QuestionWorkspacePage.test.tsx:266-302`;
  `docs/PRE-ALPHA-CONTRACT.md:164-172`.
- **Explicit exclusions:** No claim that every future repair operation (merge,
  split, re-pair, crop) exists today.
- **Conflicts / unknowns:** Ordinary product copy uses “Inspect” for parser
  output and “Review” for academic study; persisted historical enums retain
  review wording.
- **Dedupe key:** `question-mapping.exception-inspection-and-repair`

### Structured answer evidence preserves harmless drift

- **Category:** Bug
- **Area/System:** Pasted text / CSV / JSON answer mapping
- **Observed status:** Verified fixed across both shipped import paths.
- **Priority / board:** Q1 was explicitly P0/highest (`docs/EXPERIENCE-REFINEMENT-WAVE.md:807-815`).
- **Product DNA:**
  - **Design Intent:** Preserve explicit source evidence without turning it into
    trusted truth when trailing wording drifts.
  - **Product Principle:** Trust over cleverness.
  - **Core Promise:** A valid explicit letter with harmless textual drift
    remains a review-gated candidate; an exact cross-option contradiction
    remains unresolved.
  - **User Feeling:** “AXOM does not lose the answer carrying it across the
    room.”
  - **Product Truth:** Candidate is not equivalent to runnable.
- **Acceptance / success evidence:** Exact/letter-only resolves; singular,
  parenthetical, or explanatory drift preserves candidate plus review gate;
  cross-option contradiction preserves both keys with no chosen answer; CSV and
  JSON behave like pasted text; mixed `B,D,A,C,E` stays exact.
- **Evidence:** owner attachment `3dbc…:39-102,162-271`;
  `docs/EXPERIENCE-REFINEMENT-WAVE.md:675-721,831-844`;
  `web/src/lib/questionAnswerTrust.test.ts:21-102`;
  `web/src/lib/questionStructuredAnswerTrust.test.ts:15-105`;
  commits `b94e6f1` and `cdfff38`.
- **Explicit exclusions:** No fuzzy semantic answer inference, AI answer choice,
  schema change, or parser-wide redesign.
- **Conflicts / unknowns:** None remaining in the tested pasted/CSV/JSON paths.
- **Dedupe key:** `bug.answer-explicit-letter-drift-discarded`

### Explanation and feedback text never contaminates an option

- **Category:** Bug
- **Area/System:** Parser / Quiz feedback
- **Observed status:** Verified fixed for the recorded failure shapes.
- **Priority / board:** The owner classified parser/explanation cleaning first
  in the priority order (`5bc…:753-762`); no canonical P number.
- **Product DNA:**
  - **Design Intent:** Keep options and teaching explanations cognitively and
    semantically distinct.
  - **Product Principle:** Trustworthy structure before visual polish.
  - **Core Promise:** “Correct Feedback,” “Incorrect Feedback,” explanation,
    objective, source, and rationale markers do not become answer-choice text.
  - **User Feeling:** “The quiz shows the question cleanly instead of dumping
    extraction debris.”
  - **Product Truth:** Option E is never an explanation container.
- **Acceptance / success evidence:** Glued feedback is separated, the intended
  correct option is retained, standalone feedback markers never become options,
  and the exact PPD/CD4 fixture maps to B with only its teaching explanation.
- **Evidence:** owner attachment `5bc…:28-167,170-229,556-601,707-729`;
  `web/src/lib/questionBank.test.ts:170-261,325-464`;
  `web/src/lib/questionExplanation.test.ts:16-128`;
  `FEATURES.md:240-249,267-280`; commit `0a26a8e`.
- **Explicit exclusions:** Cleaning does not rewrite teaching meaning or
  silently “improve” a manually edited explanation.
- **Conflicts / unknowns:** Current fixtures do not certify every publisher or
  damaged PDF layout.
- **Dedupe key:** `bug.parser-feedback-contaminates-option-or-explanation`

### Deterministic explanation cleanup

- **Category:** Feature
- **Area/System:** Import / Quiz feedback
- **Observed status:** Verified for bounded known cases.
- **Priority / board:** Owner priority places parser/explanation cleaning first;
  no P number or board.
- **Product DNA:**
  - **Design Intent:** Show only teaching content in the explanation reading
    surface.
  - **Product Principle:** Cleaner layouts without altering source meaning.
  - **Core Promise:** Repeated stem, options, answer lines, and source/objective
    clutter are removed while rationale and teaching points remain.
  - **User Feeling:** “I can read why the answer is right without rereading the
    whole extracted document.”
  - **Product Truth:** Raw explanation evidence and cleaned display prose are
    distinct artifacts.
- **Acceptance / success evidence:** Exact contaminated fixture reduces to its
  PPD teaching explanation; cleaning is idempotent; next-question and trailing
  key boundaries stop extraction; raw candidate and cleanup operations remain
  auditable.
- **Evidence:** `web/src/lib/questionExplanation.test.ts:16-128`;
  `web/src/components/questions/ImportPanel.persistence.test.tsx:64-88`;
  `FEATURES.md:240-244`.
- **Explicit exclusions:** Manual edits render verbatim; this record does not
  authorize AI rewriting.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question-explanation.deterministic-cleaning`

### Structured quiz feedback and repair

- **Category:** Feature
- **Area/System:** Quiz player / Question detail
- **Observed status:** Verified by rendered component tests and shipped ledger.
- **Priority / board:** Owner priority ranks quiz feedback third; no P number.
- **Product DNA:**
  - **Design Intent:** Make the learning result immediately understandable
    without mixing answers, rationale, evidence, and repair controls.
  - **Product Principle:** One primary learning message, with detail available
    on demand.
  - **Core Promise:** Short result banner; separate correct and learner answers;
    clean explanation; collapsible evidence; explicit repair.
  - **User Feeling:** “I know what happened, why, and what I can fix.”
  - **Product Truth:** A truthy but unreviewed key is not displayed as trusted.
- **Acceptance / success evidence:** Correct/incorrect/needs-review banners,
  distinct answer rows, source metadata outside prose, manual explanation
  preservation, and repair callbacks have focused tests.
- **Evidence:** owner attachment `5bc…:170-229,641-657`;
  `web/src/components/questions/QuizFeedback.test.tsx:35-96`;
  `FEATURES.md:245-249,278-280`.
- **Explicit exclusions:** Does not authorize generated rationales or an exam
  simulation redesign.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `quiz-feedback.structured-result-evidence-repair`

### Sanitized real-layout import acceptance corpus

- **Category:** Feature
- **Area/System:** Import verification
- **Observed status:** Verified current seed harness; broader permanent corpus
  remains unconfirmed.
- **Priority / board:** Part of the P0/Tier 1 Import gate.
- **Product DNA:**
  - **Design Intent:** Make importer claims measurable against representative
    layouts rather than anecdotes.
  - **Product Principle:** The corpus is the test; measured truth over claimed
    capability.
  - **Core Promise:** Every fixed import defect becomes reproducible acceptance
    evidence.
  - **User Feeling:** “Reliability claims are backed by actual source shapes.”
  - **Product Truth:** A generated/sanitized fixture corpus is a regression
    instrument, not certification of every document.
- **Acceptance / success evidence:** Eight fixtures, 21 expected Questions,
  100% exact-answer and explanation association in the recorded run, zero
  false-ready, no all-A collapse, no lost or invented Questions.
- **Evidence:** `docs/QUESTION-IMPORT-EVALUATION-HARNESS.md:1-83`;
  `web/src/lib/questionImportEvaluation.test.ts:9-22`;
  `FEATURES.md:9-20`.
- **Explicit exclusions:** Does not certify medical correctness, OCR, unusual
  publishers, scanners, tables, or damaged text layers.
- **Conflicts / unknowns:** The 175 personal corpus candidates remain
  permission-unknown (`docs/CORPUS-CANDIDATES.md:1-11,223-224`).
- **Dedupe key:** `question-import.sanitized-real-layout-acceptance-harness`

### Restrained academic classification

- **Category:** Feature
- **Area/System:** Question metadata / Import
- **Observed status:** Partial.
- **Priority / board:** Within P0 Import; no standalone board.
- **Product DNA:**
  - **Design Intent:** Reduce manual organization without inventing academic
    truth.
  - **Product Principle:** Broad, explainable suggestions first; user remains in
    control.
  - **Core Promise:** High-confidence classifications may auto-assign; uncertain
    classifications remain suggestions or blank.
  - **User Feeling:** “AXOM organizes what it can prove and leaves the rest to
    me.”
  - **Product Truth:** Yield and difficulty are distinct; user focus may rank
    suggestions but cannot rewrite source truth.
- **Acceptance / success evidence:** Current shipped taxonomy has a confidence
  gate and no-category fallback; future specification requires editable,
  provenance-backed fields.
- **Evidence:** `FEATURES.md:303-308`;
  `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:310-332`.
- **Explicit exclusions:** No tag spam, no current-term-only relabeling, no AI
  classification as unquestioned truth.
- **Conflicts / unknowns:** Current breadth of automatic fields is smaller than
  the future specification and should remain marked partial.
- **Dedupe key:** `question-classification.restrained-evidence-backed-suggestions`

### Canonical normalized user tags

- **Category:** Feature
- **Area/System:** Question library / Tags
- **Observed status:** Verified.
- **Priority / board:** No explicit priority or board.
- **Product DNA:**
  - **Design Intent:** Make user organization stable despite case, whitespace,
    and Unicode variation.
  - **Product Principle:** One identity for one tag.
  - **Core Promise:** Equivalent user tag text collapses deterministically on
    every supported path.
  - **User Feeling:** “My library stays clean instead of accumulating spelling
    variants.”
  - **Product Truth:** User tags are canonical normalized text, not arbitrary
    duplicated labels.
- **Acceptance / success evidence:** NFC/trim/whitespace/lowercase normalization,
  bounded length, idempotence, order-preserving deduplication, rename/merge, and
  load-time migration are tested.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:1057-1089`;
  `web/src/lib/questionTags.test.ts:14-76`;
  `web/src/lib/questionBankTags.test.ts:22-58`; commit `8439f97`.
- **Explicit exclusions:** Imported academic classifications and future
  provenance classes are not silently converted into user tags.
- **Conflicts / unknowns:** The broader provenance-aware tag model in
  `docs/EXPERIENCE-REFINEMENT-WAVE.md:869-874` is not shown as complete by the
  current user-tag tests.
- **Dedupe key:** `question-tags.canonical-user-tags`

### Composable Question library filters and search

- **Category:** Feature
- **Area/System:** Question library
- **Observed status:** Verified.
- **Priority / board:** No explicit priority or board.
- **Product DNA:**
  - **Design Intent:** Let learners find the exact practice population they
    intend without changing source data.
  - **Product Principle:** Deep capability appears through clear, deterministic
    controls.
  - **Core Promise:** Search and facets compose predictably, and empty criteria
    preserve the current order.
  - **User Feeling:** “I can narrow a large bank without wondering what the
    filters did.”
  - **Product Truth:** Filters are views; they do not own or mutate Questions.
- **Acceptance / success evidence:** Search spans stem/options/tags/notes/source;
  tag ALL/ANY and other facets compose with AND; saved presets normalize invalid
  criteria; live counts and accessible pressed states render.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:1065-1089`;
  `web/src/lib/questionFilters.test.ts:24-94`;
  `web/src/components/questions/BankBrowser.library.test.tsx:49-130`.
- **Explicit exclusions:** A filtered live view is not a persisted Collection
  entity and not a Question Set until membership is captured.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question-library.composable-filters-search-presets`

### Bulk Question tagging and selection

- **Category:** Feature
- **Area/System:** Question library / Bulk actions
- **Observed status:** Verified.
- **Priority / board:** No explicit priority or board.
- **Product DNA:**
  - **Design Intent:** Make large-library organization efficient without
    disturbing unselected Questions.
  - **Product Principle:** Convenience with explicit scope.
  - **Core Promise:** Bulk add/remove/replace/clear affects only the deliberate
    selection.
  - **User Feeling:** “I can organize hundreds of Questions safely.”
  - **Product Truth:** Selection is session-scoped UI state, not durable
    Workspace content.
- **Acceptance / success evidence:** Selection persists through remount in
  session storage, stale IDs are pruned, bulk operations are one scoped pass,
  live count is announced, and unselected records remain unchanged.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:1075-1089`;
  `web/src/lib/questionBankTags.test.ts:22-45`;
  `web/src/components/questions/BankBrowser.library.test.tsx:75-109`.
- **Explicit exclusions:** Selection does not enter localStorage, backups, or
  Question provenance.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question-library.bulk-selection-tagging`

### Question Set is a deterministic membership snapshot

- **Category:** Product Decision
- **Area/System:** Question Sets
- **Observed status:** Verified and lexically canonical.
- **Priority / board:** No explicit priority or board.
- **Product DNA:**
  - **Design Intent:** Preserve a learner's exact chosen practice population
    across time.
  - **Product Principle:** One source of truth; reproducibility over hidden
    reshuffling.
  - **Core Promise:** Stored `questionIds` are authoritative membership and
    retain their order across launch, reload, and supported backup.
  - **User Feeling:** “The set I saved is the set I get.”
  - **Product Truth:** Filters, ordering mode, and seed describe creation
    provenance; they do not rebuild membership at runtime.
- **Acceptance / success evidence:** Later tag edits do not change membership;
  stored order is preserved; missing/deleted IDs are skipped without reordering
  survivors; no random call occurs in explicit-membership resolution.
- **Evidence:** `docs/governance/AX-0009-PRODUCT-LEXICON.md:470-505`;
  `web/src/lib/questionBankTags.test.ts:73-115`;
  `web/src/lib/questionBank.test.ts:732-783`;
  `web/src/components/questions/ExamRunner.test.tsx:82-156`;
  commits `8439f97` and `9654ba2`.
- **Explicit exclusions:** A Question Set is not a live filter recipe or a
  Collection synonym.
- **Conflicts / unknowns:** None after the deterministic-launch fix.
- **Dedupe key:** `question-set.authoritative-membership-snapshot`

### Filter-created sets launch from explicit membership

- **Category:** Bug
- **Area/System:** Question Sets / Quiz launch
- **Observed status:** Verified fixed.
- **Priority / board:** Independent review classified the defect as the required
  correctness blocker; no P number in the reviewed source.
- **Product DNA:**
  - **Design Intent:** Make the stored set card and actual runnable pool describe
    the same Questions.
  - **Product Principle:** One source of truth.
  - **Core Promise:** Snapshot sets do not require legacy question backlinks and
    never silently launch as an empty pool.
  - **User Feeling:** “A set that says it contains Questions actually starts.”
  - **Product Truth:** Explicit membership wins; the legacy backlink path is a
    compatibility fallback only.
- **Acceptance / success evidence:** Non-empty launch, exact valid-ID length,
  stored order, missing-ID skip, repeatability, JSON persistence, backup
  round-trip, no `Math.random`, and legacy fallback are covered.
- **Evidence:** commit `9654ba2`;
  `web/src/lib/questionBank.test.ts:732-783`;
  `web/src/components/questions/ExamRunner.test.tsx:82-156`;
  `web/src/lib/backup.test.ts` additions in `9654ba2`.
- **Explicit exclusions:** Does not restamp Questions, reconstruct filters, or
  redesign quiz architecture.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `bug.question-set-snapshot-launch-empty-pool`

### Legacy set launch compatibility

- **Category:** Product Decision
- **Area/System:** Question Sets
- **Observed status:** Verified compatibility behavior.
- **Priority / board:** No explicit priority or board.
- **Product DNA:**
  - **Design Intent:** Correct new snapshot semantics without breaking older
    imported sets.
  - **Product Principle:** The student never loses work.
  - **Core Promise:** Sets without explicit membership continue to resolve by
    their historical set backlink.
  - **User Feeling:** “An update does not make my old sets disappear.”
  - **Product Truth:** Legacy fallback is compatibility, not the canonical model
    for new sets.
- **Acceptance / success evidence:** A legacy set without explicit
  `questionIds` still launches; new snapshot sets do not depend on the fallback.
- **Evidence:** `web/src/lib/questionBank.test.ts:770-783`; commit `9654ba2`.
- **Explicit exclusions:** Compatibility does not authorize stamping backlinks
  on new snapshot Questions.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question-set.legacy-backlink-launch-compatibility`

### Progress-rich Question Set cards

- **Category:** Feature
- **Area/System:** Question Sets
- **Observed status:** Implemented and component-tested.
- **Priority / board:** Owner priority ranked set progress/accuracy cards fourth;
  no P number.
- **Product DNA:**
  - **Design Intent:** Make a set's current learning state and next action
    visible without spreadsheet-like clutter.
  - **Product Principle:** Meaningful metrics, fewer controls, clear hierarchy.
  - **Core Promise:** Completion, Current Mastery, Attempt Accuracy, mapping
    issues, confidence, and last study are named distinctly.
  - **User Feeling:** “I understand this set at a glance.”
  - **Product Truth:** Current Mastery and historical Attempt Accuracy are
    different measures.
- **Acceptance / success evidence:** Full cards expose source/category,
  total/completed/remaining, neutral no-attempt state, threshold colors, mapping
  review priority, and contextual Start/Continue/Review action.
- **Evidence:** owner attachment `5bc…:233-270`;
  `FEATURES.md:250-256,335-338`;
  `web/src/components/questions/QuestionSetCard.test.tsx:27-84`.
- **Explicit exclusions:** A color is not the only state signal; cards must
  remain compact and not become analytics tables.
- **Conflicts / unknowns:** The owner's early “accuracy color” wording was later
  clarified in shipped docs as **Current Mastery** color with Attempt Accuracy
  separately labeled. Preserve that clarification.
- **Dedupe key:** `question-set.progress-mastery-accuracy-card`

### Quiz Block is a reusable live-pool recipe

- **Category:** Product Decision
- **Area/System:** Block Builder / Quiz
- **Observed status:** Implemented and lexically canonical.
- **Priority / board:** No explicit priority or board.
- **Product DNA:**
  - **Design Intent:** Let learners rerun a practice strategy whose eligible
    Questions can change with the bank.
  - **Product Principle:** Use the correct artifact for the intended kind of
    continuity.
  - **Core Promise:** Mode, timing, count, and live filters can be saved and
    rerun.
  - **User Feeling:** “My missed-only block stays current without rebuilding
    it.”
  - **Product Truth:** A Quiz Block is not a frozen Question Set.
- **Acceptance / success evidence:** Saved blocks reopen with the saved mode and
  do not mark themselves run until Start; live filters resolve at launch.
- **Evidence:** `docs/governance/AX-0009-PRODUCT-LEXICON.md:509-521`;
  `FEATURES.md:339-340`;
  `web/src/components/questions/ExamRunner.test.tsx:82-112`.
- **Explicit exclusions:** A Quiz Block does not promise immutable membership.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `quiz-block.live-filter-recipe`

### Quiz Session preserves the historical run

- **Category:** Feature
- **Area/System:** Quiz / Results
- **Observed status:** Implemented and lexically canonical.
- **Priority / board:** Surfacing sessions on Dashboard/Reports is explicitly
  “next,” but session persistence itself is shipped (`ROADMAP.md:80`).
- **Product DNA:**
  - **Design Intent:** Preserve exactly what the learner attempted and how it
    went.
  - **Product Principle:** Learning evidence remains durable and inspectable.
  - **Core Promise:** Ordered Question IDs, answers, timing, filters, and score
    remain attached to the historical run.
  - **User Feeling:** “My practice history is a record, not a transient screen.”
  - **Product Truth:** A Quiz Session is neither the reusable Block nor the Set
    that launched it.
- **Acceptance / success evidence:** Session/category scoring and weakest-first
  aggregation exist; current mastery uses latest-attempt state while accuracy
  uses all scored attempts.
- **Evidence:** `docs/governance/AX-0009-PRODUCT-LEXICON.md:525-538`;
  `web/src/lib/questionBank.test.ts:867-922`;
  `web/src/lib/questions.test.ts:70-120`;
  `FEATURES.md:345-346`.
- **Explicit exclusions:** Dashboard/Reports session surfacing is a separate
  deferred item.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `quiz-session.persisted-historical-run`

### Due, missed, and weak-topic practice loops

- **Category:** Feature
- **Area/System:** Question Bank / Study loop
- **Observed status:** Implemented, not independently rerun here.
- **Priority / board:** No explicit priority or board.
- **Product DNA:**
  - **Design Intent:** Turn performance evidence into immediate, useful practice
    choices.
  - **Product Principle:** Every screen helps answer what to do next.
  - **Core Promise:** Review due, Retry missed, and weak-topic block entry
    points are available from the Question Bank.
  - **User Feeling:** “AXOM turns my misses into the next useful action.”
  - **Product Truth:** The loops are grounded in stored attempts and review
    state, not invented recommendations.
- **Acceptance / success evidence:** Due detection, repeat-offender rules, weak
  topic ranking, and mode filtering have pure tests; landing prioritizes due work
  before secondary insights.
- **Evidence:** `FEATURES.md:209-233,281-284`;
  `web/src/lib/questions.test.ts:53-69,187-215`;
  `web/src/pages/QuestionWorkspacePage.test.tsx:178-302`.
- **Explicit exclusions:** AI is not required for these deterministic loops.
- **Conflicts / unknowns:** “Continue last block” starts a new run with the prior
  filters; it does not resume an in-progress session.
- **Dedupe key:** `question-study-loop.due-missed-weak-topic`

### Question performance and error-pattern insights

- **Category:** Feature
- **Area/System:** Question analytics
- **Observed status:** Partial.
- **Priority / board:** Dashboard/Reports surfacing is “next”; distractor
  analytics remain proposed.
- **Product DNA:**
  - **Design Intent:** Help the learner understand both what is weak and why
    misses recur.
  - **Product Principle:** More insight, fewer raw numbers.
  - **Core Promise:** Accuracy, weakest categories, confidence mismatch, error
    patterns, pacing, and improvement use stored learner evidence.
  - **User Feeling:** “My practice history explains what to work on next.”
  - **Product Truth:** Insights require explicit denominators and sufficient
    evidence.
- **Acceptance / success evidence:** Category accuracy, latest-attempt mastery,
  weak topics, and error-pattern grouping are tested; tiny samples do not
  support overclaimed faculty-style conclusions.
- **Evidence:** `FEATURES.md:230-233,345-346`;
  `web/src/lib/questionBank.test.ts:909-922`;
  `web/src/lib/questions.test.ts:70-120,187-236`;
  `docs/governance/AX-0009-PRODUCT-LEXICON.md:546-597`.
- **Explicit exclusions:** No universal “Mastery” score; no claim that correlation
  proves learning causality.
- **Conflicts / unknowns:** Full pacing UI, distractor pull, and faculty-style
  filtering remain open.
- **Dedupe key:** `question-analytics.performance-error-pattern-insights`

### Exam mode for ordinary timed blocks

- **Category:** Feature
- **Area/System:** Quiz
- **Observed status:** Implemented bounded mode; full exam simulation is not
  implemented.
- **Priority / board:** Full simulation is proposed/Beta; ordinary exam blocks
  are shipped.
- **Product DNA:**
  - **Design Intent:** Let learners defer feedback and practice under time and
    selection constraints.
  - **Product Principle:** Simple default capability before high-fidelity
    simulation.
  - **Core Promise:** Exam blocks support filters, optional timing, flags,
    deferred feedback, end review, and missed-question retake.
  - **User Feeling:** “I can practice under exam-like constraints without
    pretending AXOM is proprietary exam software.”
  - **Product Truth:** Exam mode is not full sectioned simulation.
- **Acceptance / success evidence:** Shipped-feature record documents the mode;
  saved timed-block behavior and mapping-safe retake are component-tested.
- **Evidence:** `FEATURES.md:343-344`;
  `web/src/components/questions/ExamRunner.test.tsx:82-112,205-236`;
  `ROADMAP.md:47`.
- **Explicit exclusions:** Sections, scheduled breaks, proctor lobby, device
  checks, and proprietary branding.
- **Conflicts / unknowns:** None if bounded terminology is preserved.
- **Dedupe key:** `quiz.exam-mode-bounded-timed-block`

### Tutor mode with immediate learner feedback

- **Category:** Feature
- **Area/System:** Quiz
- **Observed status:** Implemented bounded mode; advanced conversational Tutor
  remains future.
- **Priority / board:** Advanced Tutor is future after Q1/Q2 stability; no P
  number.
- **Product DNA:**
  - **Design Intent:** Turn each submitted Question into an immediate learning
    and repair opportunity.
  - **Product Principle:** Feedback supports, rather than obscures, source truth.
  - **Core Promise:** Immediate feedback, error classification, confidence, and
    repair are available in tutor-mode practice.
  - **User Feeling:** “A miss becomes understandable and actionable.”
  - **Product Truth:** Existing Tutor mode is not the future progressive-hint
    conversational Tutor.
- **Acceptance / success evidence:** Shipped feature record; answer, flag,
  confidence, error classification, and mapping-safe retake behaviors have
  component tests.
- **Evidence:** `FEATURES.md:341-342`;
  `web/src/components/questions/ExamRunner.test.tsx:157-236`;
  `docs/EXPERIENCE-REFINEMENT-WAVE.md:887-893`.
- **Explicit exclusions:** No claim of progressive hints, differential
  narrowing, AI conversation, or “tell me more” flow today.
- **Conflicts / unknowns:** The same “Tutor Mode” name covers shipped bounded
  mode and future redesign; the backlog must keep those scopes distinct.
- **Dedupe key:** `quiz.tutor-mode-current-immediate-feedback`

### Answer-choice elimination

- **Category:** Feature
- **Area/System:** Quiz reading tools
- **Observed status:** Verified.
- **Priority / board:** No explicit P number or board.
- **Product DNA:**
  - **Design Intent:** Support active test-taking reasoning without changing the
    submitted answer.
  - **Product Principle:** Power without complexity.
  - **Core Promise:** Pointer or Shift+letter toggles elimination; Reset clears
    only eliminations; reveal preserves both elimination and correctness.
  - **User Feeling:** “I can reason through distractors the way I do on exam
    software.”
  - **Product Truth:** Elimination is transient reasoning state, not selection or
    durable annotation.
- **Acceptance / success evidence:** Does not select, remains legible, survives
  reveal, coexists with correct/wrong state, resets between Questions, and
  ignores typing/interactive contexts.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:723-757,759-790`;
  commit `943a3f9`.
- **Explicit exclusions:** No persistence, analytics, or exam-simulation claim.
- **Conflicts / unknowns:** Optional elimination analytics remain future and are
  not part of this candidate.
- **Dedupe key:** `quiz-tool.answer-elimination`

### New Question returns to the stem

- **Category:** Feature
- **Area/System:** Quiz navigation / Accessibility
- **Observed status:** Verified.
- **Priority / board:** No explicit P number or board.
- **Product DNA:**
  - **Design Intent:** Begin every Question at its logical reading start,
    regardless of the prior explanation's length.
  - **Product Principle:** Navigation preserves orientation and feels immediate.
  - **Core Promise:** Next Question scrolls the actual reading surface to zero
    and focuses the stem.
  - **User Feeling:** “I never arrive halfway down the next Question.”
  - **Product Truth:** Reduced motion uses an instant transition, not a missing
    transition.
- **Acceptance / success evidence:** ScrollTop zero, active stem focus, assistive
  announcement, mobile overflow safety, and rapid navigation without annotation
  duplication.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:737-739,773-790`;
  `web/src/components/questions/ExamRunner.test.tsx:237-250`; commit `943a3f9`.
- **Explicit exclusions:** Prior-position restoration is only appropriate for
  an explicit return-to-previous flow.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `quiz-navigation.new-question-stem-focus`

### Device-only quiz reading scale

- **Category:** Feature
- **Area/System:** Quiz reading tools
- **Observed status:** Verified.
- **Priority / board:** No explicit P number or board.
- **Product DNA:**
  - **Design Intent:** Let learners adjust Question readability without altering
    academic data.
  - **Product Principle:** Accessibility preference stays lightweight and
    local.
  - **Core Promise:** Stem and choices scale together from 0.9 to 1.4 and persist
    only as a device preference.
  - **User Feeling:** “I can make the Question readable without changing the
    workspace.”
  - **Product Truth:** Reading scale is not learner content and does not belong
    in the serialized Workspace.
- **Acceptance / success evidence:** Stem and options both increased 14px to
  16.8px in recorded browser proof; bounds disable correctly; reload preserves
  only `axom.quiz.reading-scale.v1`; no Workspace leak.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:740-743,759-790`; commit
  `943a3f9`.
- **Explicit exclusions:** Does not scale unrelated modal controls; does not
  change schema, backup, or Workspace persistence.
- **Conflicts / unknowns:** Wider reading width, high contrast, and reduced
  distraction remain separate future reading-tool ideas.
- **Dedupe key:** `quiz-tool.device-reading-scale`

### Session calculator

- **Category:** Feature
- **Area/System:** Quiz tools
- **Observed status:** Verified.
- **Priority / board:** No explicit P number or board.
- **Product DNA:**
  - **Design Intent:** Provide basic arithmetic without forcing the learner to
    leave the Question.
  - **Product Principle:** Deep capability appears only when needed.
  - **Core Promise:** Keyboard-accessible, arithmetic-only, session-scoped
    calculation with controlled errors and reliable close/focus return.
  - **User Feeling:** “I can calculate quickly and return to the Question.”
  - **Product Truth:** Calculator state is not Workspace data.
- **Acceptance / success evidence:** Recorded browser proof covers
  `12 + 7 × 3 = 33`, `50% = 0.5`, controlled invalid/divide-by-zero handling,
  Escape close, and trigger focus restoration.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:744-746,781-790`; commit
  `943a3f9`.
- **Explicit exclusions:** No persisted history, arbitrary expression
  evaluation, or exam-profile policy.
- **Conflicts / unknowns:** Future Exam Mode may disable it; that decision is not
  part of this verified record.
- **Dedupe key:** `quiz-tool.session-calculator`

### Rationale reading hierarchy

- **Category:** Feature
- **Area/System:** Quiz feedback
- **Observed status:** Verified for source-provided rationales.
- **Priority / board:** No explicit P number or board.
- **Product DNA:**
  - **Design Intent:** Prioritize the explanation a learner needs after a
    response without overwhelming the screen.
  - **Product Principle:** One primary learning message; other detail is
    progressive disclosure.
  - **Core Promise:** Correct rationale comes first; on a miss, selected-wrong
    rationale comes next; remaining distractors are collapsed.
  - **User Feeling:** “I immediately see why the answer is right and why my
    choice was wrong.”
  - **Product Truth:** A correct response never receives a false “your answer is
    wrong” section.
- **Acceptance / success evidence:** Correct/wrong/empty rationale ordering,
  collapse behavior, and 68ch explanation measure passed recorded browser proof.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:747-751,781-790`; commit
  `943a3f9`.
- **Explicit exclusions:** No rationale is fabricated when none exists; AI
  generation is separate.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `quiz-feedback.rationale-priority-and-collapse`

### Persistent stem and explanation highlights

- **Category:** Feature
- **Area/System:** Question annotations
- **Observed status:** Verified.
- **Priority / board:** No explicit P number or board.
- **Product DNA:**
  - **Design Intent:** Let learners preserve meaningful passages as durable
    study overlays.
  - **Product Principle:** Learner work survives reload without mutating source
    text.
  - **Core Promise:** Semantic highlights on stem and explanation survive
    reload, attempts, mapping changes, and supported backup operations.
  - **User Feeling:** “The important part I marked is still there when I return.”
  - **Product Truth:** Highlight meaning is exposed through semantics and an
    underline cue, not color alone.
- **Acceptance / success evidence:** Dark/light/390px rendered proof, keyboard
  focus, semantic mark labels, unaltered source text, backup/merge, and no
  localStorage content leak.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:900-944,961-991,993-1018`;
  `web/src/lib/questionAnnotations.test.ts:28-133`;
  `web/src/components/questions/QuestionAnnotations.test.tsx:14-113`;
  commit `80c8e5b`.
- **Explicit exclusions:** Persistent option highlights, drawing, OCR, AI
  annotations, and cloud sync.
- **Conflicts / unknowns:** The older Q2 text named stem + option highlights;
  the accepted Q2b-1 scope shipped stem + explanation. Option-highlight intent
  requires Product Owner disposition (see reconstruction notes).
- **Dedupe key:** `question-annotation.persistent-text-highlights`

### Persistent plain Question notes

- **Category:** Feature
- **Area/System:** Question annotations
- **Observed status:** Verified.
- **Priority / board:** No explicit P number or board.
- **Product DNA:**
  - **Design Intent:** Give each Question a durable learner-authored reflection
    separate from attempt notes and source explanation.
  - **Product Principle:** The learner owns their layer.
  - **Core Promise:** Plain-text notes autosave, announce state politely, survive
    navigation/reload, and round-trip through backup/merge.
  - **User Feeling:** “My own explanation stays attached to the Question.”
  - **Product Truth:** Question note is learner content, not transformed medical
    content.
- **Acceptance / success evidence:** Debounced save, `Saving`/`Saved` live
  status, close flush, navigation persistence, merge/backup, and no preference
  localStorage are covered.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:933-944,983-1010`;
  `web/src/components/questions/QuestionAnnotations.test.tsx:59-79`;
  commit `80c8e5b`.
- **Explicit exclusions:** No rich text, AI interpretation, or medical-content
  transformation.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question-note.persistent-plain-text-autosave`

### Resilient annotation anchoring and repair

- **Category:** Feature
- **Area/System:** Question annotations
- **Observed status:** Verified.
- **Priority / board:** No explicit P number or board.
- **Product DNA:**
  - **Design Intent:** Keep learner highlights attached through safe source
    revisions without guessing ambiguous text.
  - **Product Principle:** Trust over cleverness.
  - **Core Promise:** Exact offsets are accepted only when valid; exact
    text/context may reanchor uniquely; ambiguity becomes `needs-repair`.
  - **User Feeling:** “AXOM preserves my annotation or asks me to repair it; it
    never moves it somewhere random.”
  - **Product Truth:** Repair state preserves the original excerpt and remains
    authoritative until repaired or deleted.
- **Acceptance / success evidence:** Identical revision, small shift, ambiguous
  repetition, removed text, attempt/mapping changes, and deletion authority all
  have focused tests.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:911-931,955-959`;
  `web/src/lib/questionAnnotations.test.ts:28-133`.
- **Explicit exclusions:** No nearest-match anchoring or silent discard.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question-annotation.resilient-anchor-repair`

### Annotation overlap integrity

- **Category:** Bug
- **Area/System:** Question annotations
- **Observed status:** Verified fixed.
- **Priority / board:** Independent review classified the original issue
  INFO/LOW; no board.
- **Product DNA:**
  - **Design Intent:** Keep persisted annotation state identical to what can
    render.
  - **Product Principle:** One source of truth; do not silently trim, merge, or
    guess selection intent.
  - **Core Promise:** A new highlight cannot overlap an active or repair-state
    highlight on the same target; touching edges remain valid.
  - **User Feeling:** “Every saved highlight is visible and understandable.”
  - **Product Truth:** Stem, explanation, and each option are independent overlap
    domains.
- **Acceptance / success evidence:** Partial/nested overlap rejects, adjacent
  ranges pass, targets remain isolated, `needs-repair` blocks, deletion permits
  recreation, blank/collapsed selections ignore, duplicate IDs and rapid
  navigation do not duplicate.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:1011-1015`;
  `web/src/lib/questionAnnotations.test.ts:135-279`;
  `web/src/components/questions/QuestionAnnotations.test.tsx:30-58,100-113`;
  commit `1e06a94`.
- **Explicit exclusions:** No automatic range trimming or merging.
- **Conflicts / unknowns:** None after the fix.
- **Dedupe key:** `bug.annotation-overlap-stored-not-rendered`

### Question-note image attachments

- **Category:** Feature
- **Area/System:** Question annotations / Local Vault / Backup
- **Observed status:** Implemented and focused-test verified; full repository
  gate evidence in the ledger is narrower than the surrounding checkpoints.
- **Priority / board:** No explicit P number or board.
- **Product DNA:**
  - **Design Intent:** Let learners preserve screenshots and images alongside
    their Question notes without bloating serialized Workspace data.
  - **Product Principle:** Local first; the student never loses work.
  - **Core Promise:** Valid images remain durable, described, viewable, removable,
    and portable under explicit backup semantics.
  - **User Feeling:** “The image I needed for this Question stays with my note.”
  - **Product Truth:** Attachment metadata belongs to the Question; binary bytes
    live separately in the Local Vault.
- **Acceptance / success evidence:** PNG/JPEG/WebP/GIF validation, decode probe,
  count/byte limits, deterministic multi-file behavior, exact blob round-trip,
  alt-text editing, lightbox Escape/focus return, missing-blob safe state,
  localStorage exclusion, backup payload round-trip, and orphan maintenance have
  tests.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:1022-1055`;
  `web/src/lib/questionAttachments.test.ts:62-248`;
  `web/src/components/questions/QuestionAttachmentsPanel.test.tsx:45-122`;
  commit `2f4f290`.
- **Explicit exclusions:** SVG/PDF, OCR, drawing/markup, AI image
  interpretation, cloud upload, and account sync.
- **Conflicts / unknowns:** This is learner-note media, not original imported
  source-binary retention. Those are separate product concepts.
- **Dedupe key:** `question-note.local-image-attachments`

### Portable attachment backup is explicit and fault-tolerant

- **Category:** Product Decision
- **Area/System:** Question attachments / Backup
- **Observed status:** Verified for current Question-note images.
- **Priority / board:** No explicit priority or board.
- **Product DNA:**
  - **Design Intent:** Make portable media recovery truthful without hiding
    missing or corrupt bytes.
  - **Product Principle:** The student never loses work; uncertainty is surfaced.
  - **Core Promise:** Backup clearly includes supported attachment payloads,
    deduplicates deterministically, and warns rather than deleting metadata when
    bytes are unavailable.
  - **User Feeling:** “I know whether my images are actually in the backup.”
  - **Product Truth:** Separately stored bytes are not silently assumed to be in
    every serialized Workspace export.
- **Acceptance / success evidence:** Exact-byte export/import, malformed and
  oversized rejection, ownership checks, later-update conflict behavior, and
  missing payload reporting are tested.
- **Evidence:** `docs/governance/AX-0009-PRODUCT-LEXICON.md:247-263`;
  `docs/EXPERIENCE-REFINEMENT-WAVE.md:939-953,1040-1049`;
  `web/src/lib/questionAttachments.test.ts:156-229`.
- **Explicit exclusions:** This decision does not include original imported
  document binaries by default.
- **Conflicts / unknowns:** None for Question-note attachments.
- **Dedupe key:** `question-attachment.explicit-portable-backup`

### Question and attachment deletion integrity

- **Category:** Feature
- **Area/System:** Question library / Attachments / Historical sessions
- **Observed status:** Verified for current deletion paths.
- **Priority / board:** No explicit priority or board.
- **Product DNA:**
  - **Design Intent:** Remove only what the learner explicitly targets while
    preserving historical evidence and neighboring content.
  - **Product Principle:** Everything understandable and reversible where
    possible; no silent loss.
  - **Core Promise:** Deleting a Question unlinks set membership without
    deleting session history; deleting one annotation or blob affects only that
    target.
  - **User Feeling:** “Delete means exactly what the confirmation says.”
  - **Product Truth:** Relationship cleanup and historical record deletion are
    different operations.
- **Acceptance / success evidence:** Set unlink preserves relative membership,
  session history remains, targeted annotation/blob deletion does not disturb
  neighbors, and bounded orphan maintenance touches only unreachable blobs.
- **Evidence:** `web/src/lib/questionDeletion.test.ts:7-19`;
  `web/src/lib/questionAnnotations.test.ts:230-238`;
  `web/src/lib/questionAttachments.test.ts:111-155`;
  `FEATURES.md:287-289,331-338`.
- **Explicit exclusions:** Deleting a Source Document must not silently delete
  Questions; broad destructive cleanup is not authorized.
- **Conflicts / unknowns:** Source-document deletion behavior is described as
  shipped in FEATURES, but no focused source-deletion test was among the
  reviewed files; keep that subclaim implemented, not independently verified.
- **Dedupe key:** `question-data.targeted-deletion-and-unlink`

### Accessible Question Bank navigation

- **Category:** Feature
- **Area/System:** Question Bank accessibility
- **Observed status:** Verified for named current surfaces; broader product
  audit remains in progress.
- **Priority / board:** Accessibility continuation is “Ready Next” and roadmap
  in-progress; no P number.
- **Product DNA:**
  - **Design Intent:** Keep core Question workflows usable by keyboard,
    assistive technology, reduced motion, and mobile.
  - **Product Principle:** Premium visuals never cost accessibility.
  - **Core Promise:** Tabs, selection controls, highlight tools, quiz shortcuts,
    dialogs, and focus transitions expose meaningful names and state.
  - **User Feeling:** “I can operate the Question Bank without fighting the
    interface.”
  - **Product Truth:** Meaning cannot rely on color alone.
- **Acceptance / success evidence:** Roving tabs, Arrow/Home/End behavior,
  unique selection names with stem excerpts, aria-pressed states, semantic
  highlights, polite live status, focus restoration, reduced motion, and 390px
  no-overflow evidence exist.
- **Evidence:** `FEATURES.md:223-226`;
  `web/src/pages/QuestionWorkspacePage.test.tsx:65-176`;
  `web/src/components/questions/BankBrowser.library.test.tsx:109-130`;
  `web/src/components/questions/QuestionAnnotations.test.tsx:14-113`;
  `docs/EXPERIENCE-REFINEMENT-WAVE.md:759-790,961-966`.
- **Explicit exclusions:** This is not a claim of complete WCAG conformance.
- **Conflicts / unknowns:** A broader contrast/screen-reader audit remains open
  (`ROADMAP.md:89`).
- **Dedupe key:** `question-system.accessible-keyboard-responsive-surfaces`

### Accurate “Recently added” ordering language

- **Category:** Product Polish
- **Area/System:** Question library / Ordering
- **Observed status:** Verified changed in the deterministic-set cleanup.
- **Priority / board:** No explicit priority or board.
- **Product DNA:**
  - **Design Intent:** Make control labels describe actual behavior.
  - **Product Principle:** Trustworthy wording; no hidden mismatch.
  - **Core Promise:** The newest-first option is called “Recently added,” not
    “Original import order.”
  - **User Feeling:** “The label tells me what will happen.”
  - **Product Truth:** Runtime semantics were not changed by the wording repair.
- **Acceptance / success evidence:** Old label no longer appears in the Q2b-3
  UI and rendered option reads “Recently added.”
- **Evidence:** commit `9654ba2`; `web/src/lib/questionOrdering.ts` and
  `web/src/components/questions/BankBrowser.library.test.tsx` changes in that
  commit.
- **Explicit exclusions:** Does not change ordering or snapshot membership.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question-ordering.label-recently-added`

### Distinct accessible names for Question selection

- **Category:** Bug
- **Area/System:** Question library accessibility
- **Observed status:** Verified fixed in the deterministic-set cleanup.
- **Priority / board:** Independent review classified it required accessibility
  cleanup; no P number.
- **Product DNA:**
  - **Design Intent:** Let assistive-technology users distinguish repeated row
    selection controls.
  - **Product Principle:** Every control has a meaningful name.
  - **Core Promise:** Select/Deselect includes a cleanly truncated Question-stem
    excerpt while preserving pressed state.
  - **User Feeling:** “I know which Question this control selects.”
  - **Product Truth:** Repeated generic labels are not sufficient accessible
    identity.
- **Acceptance / success evidence:** Labels differ across rows, contain a stem
  excerpt, truncate long stems cleanly, and retain `aria-pressed`.
- **Evidence:** `web/src/components/questions/BankBrowser.library.test.tsx:109-130`;
  commit `9654ba2`.
- **Explicit exclusions:** No visual behavior change.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `bug.question-selection-repeated-accessible-name`

### Focused first-use Question Bank

- **Category:** Feature
- **Area/System:** Question Bank entry
- **Observed status:** Verified by rendered page tests and shipped-feature
  record.
- **Priority / board:** No explicit priority or board.
- **Product DNA:**
  - **Design Intent:** Prevent an empty Question Bank from presenting analytics
    and administration before the learner has anything to study.
  - **Product Principle:** Every screen has one primary action.
  - **Core Promise:** First use leads with Import, offers Paste second, explains
    Import → Review → Practice, and hides unavailable noise.
  - **User Feeling:** “I immediately know how to begin.”
  - **Product Truth:** Empty states teach rather than fabricate.
- **Acceptance / success evidence:** One semantic heading, dominant Import,
  reduced tab set, honest format copy, real paste routing, reachable Source
  Library when populated, safe tour, and roving tabs.
- **Evidence:** `FEATURES.md:201-208,223-226`;
  `web/src/pages/QuestionWorkspacePage.test.tsx:65-176`;
  commit `c1328f3`.
- **Explicit exclusions:** No empty analytics or unavailable tools on first use.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question-bank.focused-first-use`

### Returning Question Bank command center

- **Category:** Feature
- **Area/System:** Question Bank entry
- **Observed status:** Verified by rendered page tests and shipped-feature
  record.
- **Priority / board:** No explicit priority or board.
- **Product DNA:**
  - **Design Intent:** Put continuation, due work, and mapping repair ahead of
    secondary administration.
  - **Product Principle:** The page answers “What should I do next?”
  - **Core Promise:** Returning state prioritizes one contextual action and
    honest metrics.
  - **User Feeling:** “I open the bank and know the next useful move.”
  - **Product Truth:** Continuation starts a new block with previous filters; it
    does not falsely claim to resume an in-progress run.
- **Acceptance / success evidence:** Recent sets, mapping review, explicit
  metrics, due priority, scoped issue routing, and unresolved-pool exclusion are
  component-tested.
- **Evidence:** `FEATURES.md:209-233`;
  `web/src/pages/QuestionWorkspacePage.test.tsx:178-302`.
- **Explicit exclusions:** Secondary insight and library surfaces must not
  compete with the primary return action.
- **Conflicts / unknowns:** None.
- **Dedupe key:** `question-bank.returning-command-center`

### Question Bank noise and duplicate-control cleanup

- **Category:** Product Debt
- **Area/System:** Question Bank / Import
- **Observed status:** Partial; explicit E5 work remains queued.
- **Priority / board:** Checkpoint E5 queued; no P number or canonical board
  assignment in source.
- **Product DNA:**
  - **Design Intent:** Reduce whitespace, duplicate controls, and competing
    groupings without removing capability.
  - **Product Principle:** Premium minimalism; one obvious path.
  - **Core Promise:** Common Question workflows remain easy to find and do not
    require choosing between redundant controls.
  - **User Feeling:** “The bank is powerful without feeling crowded.”
  - **Product Truth:** A second seedless file-import pill still duplicates the
    queue's intake even after visible Import-tab consolidation.
- **Acceptance / success evidence:** Duplicate entry is removed or contextually
  hidden; whitespace/grouping pass preserves routing, trust, accessibility, and
  empty states.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:35-43,56-60,816-817`;
  `docs/PRE-ALPHA-CONTRACT.md:129-133`.
- **Explicit exclusions:** No parser, schema, storage, or architecture change.
- **Conflicts / unknowns:** The exact remaining E5 scope has not received an
  owner-approved backlog record.
- **Dedupe key:** `product-debt.question-bank-noise-duplicate-import-control`

### Premium Quiz reading surface

- **Category:** Product Polish
- **Area/System:** Quiz player
- **Observed status:** Partial.
- **Priority / board:** Owner priority places quiz feedback before broader
  rehaul; no P number.
- **Product DNA:**
  - **Design Intent:** Make the quiz player one of AXOM's best screens while
    keeping attention on the Question.
  - **Product Principle:** Premium minimalism; readability before decoration.
  - **Core Promise:** Clear progress and metadata, readable stem, tappable
    choices, obvious state, and restrained feedback at desktop and mobile.
  - **User Feeling:** “This feels like serious study software, not a cramped
    modal.”
  - **Product Truth:** Brand decoration must not compete with the Question.
- **Acceptance / success evidence:** Existing Q2a reading tools, 68ch feedback
  measure, keyboard options, correct/wrong states, mobile overflow checks, and
  sticky/tappable-control intent form the evidence boundary.
- **Evidence:** owner attachment `5bc…:605-671,1156-1165`;
  `docs/EXPERIENCE-REFINEMENT-WAVE.md:723-790`.
- **Explicit exclusions:** No redesign, exam simulation, or new durable data in
  this record.
- **Conflicts / unknowns:** The owner attachment describes a full ideal layout;
  current evidence confirms only part of it. Exact remaining visual delta needs
  rendered Product Owner review before a canonical acceptance boundary can be
  completed.
- **Dedupe key:** `product-polish.quiz-premium-reading-surface`

### Universal Question Import Engine

- **Category:** Feature
- **Area/System:** Import
- **Observed status:** Planned and blocked at Wave 6A preconditions; current
  shipped parser is a legacy/accepted path, not this complete engine.
- **Priority / board:** Explicit P0/highest priority and Tier 1 critical.
- **Product DNA:**
  - **Design Intent:** Accept an entire module's heterogeneous lawful sources
    and produce correct, provenanced, review-routed Questions.
  - **Product Principle:** Deterministic before AI; sources and uncertainty are
    never lost.
  - **Core Promise:** Ready Questions are immediately practiceable; everything
    uncertain is an exception, never false truth.
  - **User Feeling:** “I can drop in the material I have and trust what comes
    out.”
  - **Product Truth:** The engine is a staged evidence pipeline, not one
    monolithic PDF parser.
- **Acceptance / success evidence:** The binding success definition and measured
  targets require correct boundaries, answers, explanations, provenance,
  review routing, zero invented answers/conflicts/default-A/lost sources/
  overwritten corrections.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:25-95,446-469`;
  `docs/WAVE-6-PLAN.md:20-49,160-181`;
  `docs/WAVE-6A-EXECUTION-PLAN.md:16-51,289-329`;
  `docs/PRE-ALPHA-CONTRACT.md:117-127,164-171`.
- **Explicit exclusions:** Do not claim the acceptance targets are met against
  the full real corpus; current 21-question harness is only the seed.
- **Dependencies / related evidence:** Original-spec reconciliation, owner
  corpus confirmation/legal marking, frozen expected outputs.
- **Conflicts / unknowns:** `docs/PARSER-SPEC-ORIGINAL.md` is absent in the
  reviewed repository, and all 175 candidate files remain permission-unknown.
  This blocks new Wave 6A work under the historical contract but does not make
  the shipped parser invalid.
- **Dedupe key:** `future.question-import.universal-evidence-pipeline`

### Batch-wide source relationship and sequence reconciliation

- **Category:** Feature
- **Area/System:** Universal Import
- **Observed status:** Planned; only bounded current key mapping is verified.
- **Priority / board:** Part of P0 Wave 6A.
- **Product DNA:**
  - **Design Intent:** Reconcile questions-only files, answered versions,
    explanation keys, and revisions without creating duplicates or nearest-match
    mistakes.
  - **Product Principle:** Source relationships are evidence, never guesses.
  - **Core Promise:** A key row maps only when sequence and source evidence
    identify exactly one Question.
  - **User Feeling:** “Related files become one trustworthy set instead of
    duplicate or misaligned Questions.”
  - **Product Truth:** Every source appearance remains a representation of one
    canonical Question.
- **Acceptance / success evidence:** 100% duplicate suppression target; explicit
  gap/offset/reorder handling; ambiguous merges and pairings become review
  items; every representation remains provenanced.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:176-190,237-256`;
  `docs/WAVE-6A-EXECUTION-PLAN.md:216-230,289-305`.
- **Explicit exclusions:** No nearest-number or nearest-text fallback.
- **Dependencies / related evidence:** Confirmed multi-file corpus and expected
  canonical outputs.
- **Conflicts / unknowns:** Current degree of cross-file pairing should not be
  inferred from single-document trailing-key tests.
- **Dedupe key:** `future.question-import.batch-reconciliation-sequence-alignment`

### Slide-deck answer intelligence

- **Category:** Feature
- **Area/System:** Universal Import / IMCQ / OPLG
- **Observed status:** Deferred to Wave 6B and blocked on real slide fixtures.
- **Priority / board:** Wave 6B; no standalone P number.
- **Product DNA:**
  - **Design Intent:** Recover Questions and source-supported answers from
    lecture polling and teaching decks without treating teaching slides as
    Questions.
  - **Product Principle:** Visual evidence is source evidence; polling
    popularity is not correctness.
  - **Core Promise:** Repeated answer slides, checkmarks, highlights, bold,
    explanation boxes, and teaching content are distinguished truthfully.
  - **User Feeling:** “My IMCQ/OPLG deck becomes usable practice without AXOM
    guessing from popularity.”
  - **Product Truth:** Poll charts are engagement metadata, never answer keys.
- **Acceptance / success evidence:** Planned thresholds: OPLG highlight and IMCQ
  checkmark ≥98%, answer-slide pairing ≥99%, teaching-slide exclusion ≥98%.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:46-60,209-216,281-286,446-469`;
  `docs/WAVE-6-PLAN.md:169-170`;
  `docs/WAVE-6A-EXECUTION-PLAN.md:28-32,373-375`.
- **Explicit exclusions:** No claim before approved real visual fixtures exist.
- **Dependencies / related evidence:** Legal/owner-confirmed IMCQ and OPLG corpus.
- **Conflicts / unknowns:** All candidate files are still permission-unknown.
- **Dedupe key:** `future.question-import.slide-answer-intelligence`

### Imported image and table integrity

- **Category:** Feature
- **Area/System:** Universal Import / Source assets
- **Observed status:** Deferred to Wave 6C.
- **Priority / board:** Wave 6C; no standalone P number.
- **Product DNA:**
  - **Design Intent:** Prevent image- and table-dependent Questions from losing
    the material necessary to answer them.
  - **Product Principle:** Missing evidence blocks or warns; never call unusable
    flattening success.
  - **Core Promise:** Associated assets retain source page/bounds/crop, and
    uncertain tables retain a rendered fallback.
  - **User Feeling:** “If the Question says ‘shown below,’ the thing shown below
    is actually there.”
  - **Product Truth:** An image-dependent Question without its image is not
    runnable.
- **Acceptance / success evidence:** Missing-asset validation, original/crop
  provenance, table structure attempt plus crop fallback, and runnable blocking
  are specified.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:288-305,499-500`;
  `docs/WAVE-6-PLAN.md:169-171`.
- **Explicit exclusions:** This is imported source evidence, not learner note
  attachments.
- **Dependencies / related evidence:** Original source-binary retention decision
  and representative asset/table fixtures.
- **Conflicts / unknowns:** Implementation remains blocked despite Question-note
  image attachments having shipped; the systems have different ownership.
- **Dedupe key:** `future.question-import.source-images-and-tables`

### Local OCR for scans and screenshots

- **Category:** Research
- **Area/System:** Import
- **Observed status:** Blocked / Tier 3 can wait.
- **Priority / board:** Tier 3 after Alpha; roadmap status blocked.
- **Product DNA:**
  - **Design Intent:** Eventually make scanned and screenshot sources usable
    without falsely claiming a text layer today.
  - **Product Principle:** Truthful limitation before fabricated extraction.
  - **Core Promise:** Until approved OCR exists, scans remain honest
    provenance-only sources.
  - **User Feeling:** “AXOM tells me why it cannot parse this file.”
  - **Product Truth:** Screenshot intake and OCR extraction are separate
    capabilities.
- **Acceptance / success evidence:** A future research result must establish
  local/security posture and measured recognition quality before an OCR product
  claim.
- **Evidence:** `ROADMAP.md:35-42`;
  `docs/WAVE-6A-EXECUTION-PLAN.md:377-385`;
  `docs/PRE-ALPHA-CONTRACT.md:147-154,172-176`;
  `docs/WAVE-6-CONSOLIDATION.md:40-53`.
- **Explicit exclusions:** No OCR dependency, remote upload, or product promise
  is authorized by this record.
- **Conflicts / unknowns:** Historical plan names a tesseract.js spike, while a
  secure server path was also mentioned. Selecting an approach requires owner
  and security decisions.
- **Dedupe key:** `research.question-import.ocr`

### Original imported source-binary retention

- **Category:** Product Decision
- **Area/System:** Source Library / Storage
- **Observed status:** Architecture direction approved; implementation
  explicitly blocked.
- **Priority / board:** Blocks Wave 6C; no P number or canonical board.
- **Product DNA:**
  - **Design Intent:** Preserve optional originals without forcing large binary
    payloads into every Workspace or backup.
  - **Product Principle:** Local first; user controls storage cost.
  - **Core Promise:** Extracted text remains default; “keep original” is an
    explicit per-import choice with quota truth.
  - **User Feeling:** “I decide whether AXOM keeps the original file and whether
    it travels in a backup.”
  - **Product Truth:** Source-binary bytes do not belong in serialized Workspace
    JSON.
- **Acceptance / success evidence:** Approved direction requires a separate
  binary store, opt-in retention, explicit backup inclusion, and quota warning.
- **Evidence:** `ROADMAP.md:39-42`;
  `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:359-370`;
  `docs/WAVE-6-PLAN.md:169-171`.
- **Explicit exclusions:** No implementation go-ahead; Question-note attachment
  storage does not imply source retention is approved to build.
- **Conflicts / unknowns:** Exact source-retention lifecycle and recovery
  acceptance remain unratified product work.
- **Dedupe key:** `question-source.optional-original-binary-retention`

### Parser versioning, reparse, and template learning

- **Category:** Feature
- **Area/System:** Universal Import
- **Observed status:** Deferred to Import Engine Phase 5.
- **Priority / board:** Phase 5 / later than 6A–6C; no P number.
- **Product DNA:**
  - **Design Intent:** Let parser improvements benefit old imports without
    erasing corrections or hiding changes.
  - **Product Principle:** Product continuity; user remains in control.
  - **Core Promise:** A learner can preview, preserve, safely apply, or review a
    reparse; local correction patterns remain visible and resettable.
  - **User Feeling:** “AXOM gets smarter without rewriting my history.”
  - **Product Truth:** User-confirmed correction outranks later parser output.
- **Acceptance / success evidence:** Every run records version/source checksum;
  changes are previewable; conflicts require review; local template profiles are
  scoped, inspectable, disableable, and never transmitted without consent.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:394-428,501-504`;
  `docs/WAVE-6A-EXECUTION-PLAN.md:28-32`.
- **Explicit exclusions:** No community sharing, remote-model upload, or silent
  background reparse.
- **Dependencies / related evidence:** Stable Universal Engine entities,
  provenance, version history, and accepted corpus.
- **Conflicts / unknowns:** Community template learning is mentioned elsewhere
  but has no approved trust/privacy contract in the reviewed sources.
- **Dedupe key:** `future.question-parser.reparse-template-learning`

### Structured source rationales and provenance

- **Category:** Feature
- **Area/System:** Explanation model
- **Observed status:** Partial.
- **Priority / board:** Q1 functional-wave item; Q1 answer-mapping defect was P0,
  but no separate P number for rationale structure.
- **Product DNA:**
  - **Design Intent:** Preserve why-correct and per-distractor teaching evidence
    as distinct, attributable content.
  - **Product Principle:** Source-provided before derived; uncertainty remains
    visible.
  - **Core Promise:** Correct rationale, distractor rationales, general
    explanation, objectives, references, and confidence are not flattened into
    one ambiguous string.
  - **User Feeling:** “I can see exactly why each option is right or wrong and
    where that explanation came from.”
  - **Product Truth:** Answer confidence and explanation confidence are separate.
- **Acceptance / success evidence:** Current parser extracts choice rationales
  and current quiz prioritizes them; full future model includes raw/cleaned
  evidence, source spans, and mismatch routing.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:258-279`;
  `docs/EXPERIENCE-REFINEMENT-WAVE.md:818-825,846-874`;
  `web/src/lib/questionBank.test.ts:262-324`.
- **Explicit exclusions:** No generated rationale may be represented as source
  explanation.
- **Conflicts / unknowns:** Current stored coverage of every specified
  structured field is not proven by the reviewed tests; keep partial.
- **Dedupe key:** `question-explanation.structured-source-rationales`

### Optional AI-generated missing rationales with field-level disclosure

- **Category:** Feature
- **Area/System:** AI / Question explanations
- **Observed status:** Planned/Future Alpha; current provider-gated cleaner and
  digest do not satisfy this feature.
- **Priority / board:** Roadmap “next”; consolidation Future Alpha.
- **Product DNA:**
  - **Design Intent:** Fill genuine explanation gaps without disguising generated
    teaching content as source truth.
  - **Product Principle:** AI enhances; it never decides canonical answers.
  - **Core Promise:** Every generated rationale carries a visible field-level
    disclaimer and never changes the source answer.
  - **User Feeling:** “I know which explanation came from my source and which
    came from AI.”
  - **Product Truth:** A global Settings disclaimer is not sufficient
    provenance.
- **Acceptance / success evidence:** Missing-only generation, batching/progress,
  optional provider, evidence grounding, explicit per-field label, review gate,
  and zero source-answer mutation.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:818-825`;
  `ROADMAP.md:43`;
  `docs/WAVE-6-CONSOLIDATION.md:54-68`;
  owner attachment `5bc…:468-527`.
- **Explicit exclusions:** AI may not invent or override the canonical answer;
  ordinary practice must work without an API key.
- **Conflicts / unknowns:** The approved product wording for the disclaimer and
  cost/batching limits remain unspecified.
- **Dedupe key:** `future.question-ai.generated-rationale-disclosure`

### Advanced conversational Tutor

- **Category:** Feature
- **Area/System:** Quiz / AI
- **Observed status:** Future, after Q1/Q2 stability.
- **Priority / board:** Future; no P number.
- **Product DNA:**
  - **Design Intent:** Help learners articulate reasoning and narrow uncertainty
    before revealing an answer.
  - **Product Principle:** Progressive help, never mandatory AI.
  - **Core Promise:** Thinking prompt, progressive hints, differential
    narrowing, clue/mechanism walkthrough, and user-controlled answer reveal.
  - **User Feeling:** “AXOM helps me reason rather than merely telling me.”
  - **Product Truth:** AI teaching content is labeled and cannot alter source
    answer truth.
- **Acceptance / success evidence:** Explicit user controls include “Tell me
  more” and “Give me the answer”; ordinary practice works without the Tutor.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:887-893`;
  `docs/WAVE-6-CONSOLIDATION.md:54-68`.
- **Explicit exclusions:** No requirement for ordinary practice; no hidden
  answer remapping.
- **Conflicts / unknowns:** “Tutor Mode” already names a shipped bounded mode.
  Product naming must distinguish the future experience from current capability.
- **Dedupe key:** `future.quiz.advanced-conversational-tutor`

### Full exam-software simulation

- **Category:** Feature
- **Area/System:** Quiz
- **Observed status:** Proposed/Beta.
- **Priority / board:** Beta in consolidation; roadmap proposed.
- **Product DNA:**
  - **Design Intent:** Support high-fidelity exam preparation beyond ordinary
    timed blocks.
  - **Product Principle:** Reproduce useful workflow concepts without copying
    proprietary identity.
  - **Core Promise:** Configurable sections, breaks, instructions, and optional
    pre-start/proctor flow.
  - **User Feeling:** “I can rehearse the exam sequence before exam day.”
  - **Product Truth:** Current Exam mode is not full simulation.
- **Acceptance / success evidence:** Generic/school/custom profiles, sectioned
  timing, breaks, and optional lobby states; no proprietary branding/assets/UI.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:887-898`;
  `ROADMAP.md:47`;
  `docs/WAVE-6-CONSOLIDATION.md:69-79`.
- **Explicit exclusions:** No Examplify trademarked assets or cloned interface.
- **Conflicts / unknowns:** Exact Alpha/Beta timing is Beta in consolidation,
  while the earlier deferred wave simply says future; Beta is the later explicit
  tier.
- **Dedupe key:** `future.quiz.full-exam-simulation`

### Answer-choice distractor analytics

- **Category:** Research
- **Area/System:** Question analytics
- **Observed status:** Proposed; underlying option picks are recorded.
- **Priority / board:** Roadmap proposed; Future Alpha for distractor-pull
  analytics in consolidation.
- **Product DNA:**
  - **Design Intent:** Reveal which distractors attract learners and whether
    elimination behavior reflects useful reasoning.
  - **Product Principle:** Analytics are optional evidence, not surveillance.
  - **Core Promise:** Any surfaced metric explains its event definition and
    denominator.
  - **User Feeling:** “I understand the traps I fall for, without feeling
    monitored.”
  - **Product Truth:** A chosen/eliminated option event is not itself proof of
    understanding.
- **Acceptance / success evidence:** Proposed events include distractor picks
  and optional elimination transitions; analytics require explicit definitions
  and sufficient sample.
- **Evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:858-863`;
  `ROADMAP.md:49`;
  `docs/WAVE-6-CONSOLIDATION.md:54-68`.
- **Explicit exclusions:** No surveillance framing or hidden behavioral score.
- **Conflicts / unknowns:** Owner acceptance criteria and minimum sample sizes
  are absent; this remains research rather than a committed feature.
- **Dedupe key:** `research.question-analytics.distractor-and-elimination`

### Per-question pacing insight

- **Category:** Product Debt
- **Area/System:** Quiz analytics
- **Observed status:** Partial/in-progress.
- **Priority / board:** “Ready Next” in consolidation; roadmap in-progress.
- **Product DNA:**
  - **Design Intent:** Turn already-recorded Question seconds into useful pacing
    feedback.
  - **Product Principle:** Show meaningful interpretation, not a raw stopwatch
    dump.
  - **Core Promise:** Learners can understand pace against an explicitly named
    block or plan.
  - **User Feeling:** “I can see where time is going without extra logging.”
  - **Product Truth:** Coarse seconds are already recorded; the missing product
    surface is the debt.
- **Acceptance / success evidence:** A future surface uses real per-question
  timing, names scope/denominator, and does not imply causal weakness from time
  alone.
- **Evidence:** `ROADMAP.md:45`;
  `docs/WAVE-6-CONSOLIDATION.md:27-39`;
  owner attachment `5bc…:313-319`.
- **Explicit exclusions:** No hidden readiness or mastery mutation.
- **Conflicts / unknowns:** The desired presentation and comparison baseline are
  not owner-specified.
- **Dedupe key:** `product-debt.quiz.per-question-pacing-surface`

### Faculty-style Question mode

- **Category:** Research
- **Area/System:** Question analytics / Block building
- **Observed status:** Proposed; analyzer exists, filter does not.
- **Priority / board:** Roadmap proposed; Future Alpha in consolidation.
- **Product DNA:**
  - **Design Intent:** Let learners practice structural patterns associated with
    a faculty source when enough evidence supports a restrained analysis.
  - **Product Principle:** Hedge conclusions and refuse small-sample overclaim.
  - **Core Promise:** No style filter appears as reliable without sufficient
    grounded Questions.
  - **User Feeling:** “AXOM can surface patterns without pretending to read a
    professor's mind.”
  - **Product Truth:** Analyzer output is a hedged structural observation, not
    an answer source.
- **Acceptance / success evidence:** Existing tests refuse tiny-sample claims
  and produce hedged findings only on a real sample; future mode must preserve
  that gate.
- **Evidence:** `web/src/lib/questions.test.ts:217-236`;
  `ROADMAP.md:46`;
  `docs/WAVE-6-CONSOLIDATION.md:54-68`.
- **Explicit exclusions:** No faculty intent inference or answer generation.
- **Conflicts / unknowns:** No owner-approved filter acceptance criteria yet;
  remain Research.
- **Dedupe key:** `research.question-mode.faculty-style`

### Parser modularization and eager-bundle containment

- **Category:** Technical Debt
- **Area/System:** Import parser / Performance
- **Observed status:** Planned as Wave 6A structural debt; current legacy parser
  remains accepted until parity.
- **Priority / board:** Within P0 Wave 6A; no explicit Technical Debt board
  assignment.
- **Product DNA:**
  - **Design Intent:** Let import formats grow without one fragile parser or
    slowing the Dashboard.
  - **Product Principle:** Institution-agnostic growth; everything should feel
    fast.
  - **Core Promise:** New source families extend registered strategies and heavy
    parsing stays outside the eager app shell.
  - **User Feeling:** “Adding another school format does not make AXOM slower or
    less reliable.”
  - **Product Truth:** The accepted current parser stays until fixture parity is
    proven.
- **Acceptance / success evidence:** Modular stage parity, lazy/worker boundary,
  no eager Dashboard leakage, current harness green, recoverable progress and
  cancellation.
- **Evidence:** `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:62-103,134-162,430-436`;
  `docs/WAVE-6A-EXECUTION-PLAN.md:149-188,289-329`;
  `docs/WAVE-6-PLAN.md:143-158`.
- **Explicit exclusions:** No big-bang rewrite, no school-specific branches, no
  removing the legacy path before parity.
- **Conflicts / unknowns:** The historical execution plan says
  `questionParse.ts` stops growing, but subsequent bounded fixes did touch it.
  Whether that rule still governs the next parser checkpoint requires owner/
  architecture confirmation rather than silent enforcement.
- **Dedupe key:** `technical-debt.question-parser.modularization-bundle-boundary`

### Complex PDF layout recovery

- **Category:** Technical Debt
- **Area/System:** Import extraction
- **Observed status:** In progress / foundation required.
- **Priority / board:** Foundation Required; no P number.
- **Product DNA:**
  - **Design Intent:** Preserve reading order and structure in columns, tables,
    unusual positioning, and damaged text layers.
  - **Product Principle:** Layout evidence is part of source truth.
  - **Core Promise:** Digital extraction remains page-aware, and uncertain
    layouts require review instead of fake confidence.
  - **User Feeling:** “A difficult PDF fails honestly instead of becoming a
    plausible-looking wrong Question.”
  - **Product Truth:** Plain extracted text is insufficient for every PDF.
- **Acceptance / success evidence:** Normalized pages retain coordinates,
  typography, vectors/images, rendered page reference, and computed reading
  order where available.
- **Evidence:** `ROADMAP.md:42`;
  `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:105-119`;
  `docs/WAVE-6-CONSOLIDATION.md:40-53`.
- **Explicit exclusions:** OCR and source-asset intelligence remain separate.
- **Conflicts / unknowns:** Measured layout-corpus acceptance is not yet
  available.
- **Dedupe key:** `technical-debt.question-import.complex-pdf-layout`

---

## Reconstruction notes — do not create records yet

### Original parser specification gate

- **Known truth:** `docs/PARSER-SPEC-ORIGINAL.md` was required by the historical
  Wave 6A execution contract and is absent from the reviewed repository.
- **Historical evidence:** `docs/WAVE-6A-EXECUTION-PLAN.md:34-70,398-405`;
  `docs/WAVE-6-PLAN.md:166-170`.
- **Why no record:** The missing historical source does not itself make the
  shipped parser invalid. The Product Owner must decide whether the hard gate
  remains binding for future Wave 6A work under the new institutional backlog.
- **Required disposition:** Owner Decision Required.

### Real corpus registration and legal markings

- **Known truth:** The candidate manifest contains 175 rows; all reviewed rows
  remain `permission-unknown`.
- **Historical evidence:** `docs/CORPUS-CANDIDATES.md:1-11,223-224`;
  `docs/WAVE-6A-EXECUTION-PLAN.md:93-120`.
- **Why no record:** Source selection and permission classification are Product
  Owner/legal decisions; no accepted corpus is evidenced.
- **Required disposition:** Owner Decision Required.

### Option highlights

- **Known truth:** The early Q2 backlog named stem + option highlights; the
  binding Q2b-1 acceptance and verified implementation cover stem +
  explanation highlights.
- **Historical evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:852-857`,
  compared with `900-991`.
- **Why no record:** It is unclear whether option highlighting remains an
  approved future capability or was superseded by explanation highlighting.
- **Required disposition:** Owner Decision Required.

### Q2b-4 and Q2b-5 residual scope

- **Known truth:** The original checkpoint sequence reserved Q2b-4 for
  attachment backup/lifecycle fault recovery and Q2b-5 for final integrated UX.
  Q2b-2 already shipped attachment backup, restore, merge, and orphan
  maintenance; player/detail integration also exists in part.
- **Historical evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:968-981`,
  compared with `1022-1055`.
- **Why no record:** Evidence does not state whether Q2b-4 is satisfied,
  superseded, or still contains uncovered fault cases, nor what Q2b-5 acceptance
  remains.
- **Required disposition:** Owner Decision Required after a bounded gap review.

### State vocabulary: Viewed / Attempted / Unseen / Unattempted

- **Known truth:** The Q2 ledger calls this a “recommended” decision, not an
  accepted owner decision.
- **Historical evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:875-877`.
- **Why no record:** Recommendation cannot be promoted to Product Truth without
  owner acceptance.
- **Required disposition:** Owner Decision Required.

### Question tag provenance classes

- **Known truth:** Canonical normalized user tags are verified. The older
  desired model also names imported-source, AXOM-suggested,
  institution-course, topic-system, and error-pattern ownership classes.
- **Historical evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:869-874`,
  compared with `1057-1089`.
- **Why no record:** It is unclear which non-user classes remain product
  requirements versus superseded taxonomy ideas.
- **Required disposition:** Owner Decision Required.

### Schema-version historical drift

- **Known truth:** Q2b-3 explicitly moved the Workspace schema from v32 to v33.
  Older `FEATURES.md` and Wave 6A text still describe v32.
- **Historical evidence:** `docs/EXPERIENCE-REFINEMENT-WAVE.md:1057-1089`;
  `FEATURES.md:1-8,444-452`;
  `docs/WAVE-6A-EXECUTION-PLAN.md:247-266`.
- **Why no record:** This is documentation drift, not a product requirement.
  Parent reconstruction should use current v33 as observed state and preserve
  older references only as history.
- **Required disposition:** Repository documentation reconciliation, outside
  this read-only reconstruction.

### AI Question-system scope boundary

- **Known truth:** Current sources mention Mapping Assist, Explanation Cleaner,
  Study Digest, Weakness Coach, Block Builder, category tagging, future
  generated rationales, and source-answer verification.
- **Historical evidence:** owner attachment `5bc…:468-527`;
  `FEATURES.md:285-286,312-315,329-346`;
  `docs/UNIVERSAL-QUESTION-IMPORT-ENGINE.md:380-392`;
  `docs/WAVE-6-CONSOLIDATION.md:54-68`.
- **Why no single record:** Some are shipped bounded/provider-gated features,
  some are future features, and some are research concepts. The owner has not
  provided enough current evidence to decide whether each remains canonical or
  how they relate after the “AI never source truth” rule.
- **Required disposition:** Owner Decision Required during the AI-area
  reconstruction. Preserve the non-negotiable rule that AI never decides or
  overwrites canonical answers.

### Full-width Question page rehaul and “premium cards”

- **Known truth:** The owner requested a premium command-center rehaul; later
  checkpoints shipped a focused first-use/returning hierarchy and a global
  identity system.
- **Historical evidence:** owner attachment `5bc…:274-327,329-466`;
  `FEATURES.md:199-265`; `docs/EXPERIENCE-REFINEMENT-WAVE.md:1-48`.
- **Why no broader record:** “Premium” and “full rehaul” are not measurable
  acceptance criteria by themselves, and much of the request was already
  decomposed. Remaining delta requires owner-rendered review.
- **Required disposition:** Preserve the focused entry, returning command
  center, Quiz reading, and E5 debt candidates above; do not invent a second
  catch-all rehaul record.

### Import support for commercial-source styles

- **Known truth:** Historical plans name NBME/UWorld/Bootcamp/B&B/First
  Aid/Pathoma/AMBOSS styles, but commercial-source material has explicit local
  use and redistribution constraints.
- **Historical evidence:** `docs/WAVE-6-PLAN.md:34-49`;
  `docs/WAVE-6A-EXECUTION-PLAN.md:377-385`.
- **Why no record:** Style recognition is not the same as source redistribution
  or verified support, and no owner-approved acceptance corpus establishes
  capability.
- **Required disposition:** Research/legal decision after corpus policy.

---

## Deduplication notes

- Pasted-text Q1 and CSV/JSON structured-answer Q1 are one canonical defect
  candidate because the owner explicitly required one evidence policy across
  formats. Their separate commits remain evidence, not separate product truths.
- Explanation contamination, deterministic cleanup, and structured feedback are
  three independent records: the first is the historical parser defect; the
  second is the content-normalization capability; the third is the user-facing
  result/repair contract.
- Question-note attachments and imported source assets are intentionally
  separate. They have different owners, runnable consequences, and backup
  defaults.
- Current Tutor mode and future conversational Tutor are separate because the
  same name currently covers materially different promises.
- Current Exam mode and full exam simulation are separate because the latter
  adds sections, breaks, and optional lobby/proctor workflow.
- Question Set, Quiz Block, and Quiz Session are deliberately separate canonical
  artifacts per AX-0009 §§4.3–4.6.
- Current supported import formats and the Universal Import Engine are separate:
  the former is observable shipped capability; the latter is a binding future
  outcome with unmet gates.

## Catalogue counts

Creatable candidates in this file:

| Category | Count |
| --- | ---: |
| Feature | 42 |
| Bug | 5 |
| Product Debt | 2 |
| Technical Debt | 2 |
| Research | 3 |
| Product Decision | 11 |
| Product Polish | 2 |
| **Total** | **67** |

Non-creatable reconstruction notes: **10**.

Status distribution:

| Observed status | Count |
| --- | ---: |
| Verified / lexically canonical / verified fixed | 33 |
| Implemented or behaviorally covered, not independently rerun here | 10 |
| Partial / in progress | 9 |
| Confirmed product direction | 1 |
| Planned / deferred / blocked / proposed | 14 |
| **Total** | **67** |

The status table is descriptive evidence only. It does not assign canonical
backlog Status or Board, and it does not substitute for Product Owner acceptance.

---

## AXOM-0002b.1 addendum (appended; all line numbers above are unchanged)

Two clarifications recorded by AXOM-0002b.1 archival remediation; the catalogue
text above is preserved verbatim as an AXOM-0002a historical artifact.

1. **Observed, not owner-authored, Product DNA.** Every `**Product DNA:**`
   block in the candidate records above is cataloguer-synthesized evidenced
   language, assembled from the cited sources under the same rule that
   `core-systems.md` states explicitly ("Evidenced DNA … is not a substitute
   for Product Owner-authored immutable Product DNA"). No block above is
   Product Owner-authored immutable Product DNA, and none may be copied into a
   canonical backlog record without owner authorship. The reconstruction
   ledger renders these labels as `Observed design intent`, `Observed product
   principle`, `Observed core promise`, `Observed user feeling`, and `Observed
   product truth` (AXOM-0002b finding F1).
2. **Failed handoff restored.** The core-systems catalogue excluded
   Dashboard/Reports quiz-session surfacing, Pitfall Map, and AI error-type
   classification as owned by this pass; this catalogue never represented
   them. AXOM-0002b.1 restored them as `CAND-000194`–`CAND-000196`
   (AXOM-0002b finding A3).

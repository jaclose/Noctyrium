# Wave 6A — Execution Plan (Corpus & Structural Engine)

Status: **binding execution contract**, recorded 2026-07-14 at the Wave 6
finalization checkpoint and updated the same day with the exact
implementation order from the Wave 6+ consolidation directive. Binding
parents: [UNIVERSAL-QUESTION-IMPORT-ENGINE.md](UNIVERSAL-QUESTION-IMPORT-ENGINE.md)
(the spec), [WAVE-6-PLAN.md](WAVE-6-PLAN.md) (phase gates), and the
independent architecture review (**accepted with documentation fixes**).

Wave 6A must follow the sequence below. Do not skip ahead. Do not combine
unrelated stages into one implementation patch. Each stage lands with its own
fixtures, tests, diagnostics, and evidence.

---

## Scope

**In 6A** (spec §29 Phase 1 + diagnostics): fixture registry + harness
extension; canonical entity types; intake; normalized document/layout model
(text runs with coordinates/fonts; raster/vector capture recorded but visual
*detection* deferred to 6B); family classification + strategy registry;
segmentation; question/option/stem detection; representations → canonical
reconciliation; cross-file pairing + sequence alignment; answer resolution for
explicit evidence (answer lines, keys, answer-text); all trust invariants;
field provenance, ParserRun logs, issue taxonomy; one unified **Import**
action behind a lazy chunk.

**Not in 6A**: checkmark/highlight/bold/slide differencing (6B — needs slide
fixtures); image/table assets, crops, missing-asset policy, source-binary
retention (6C — retention is architecture-only by decision of 2026-07-14);
OCR (see Boundaries); curriculum templates/graph (6D); Course Central Level 0
UI (6E); template profiles, correction learning, reparse merge (spec Phase 5).

## Immediate preconditions

Wave 6A implementation may begin only after **all** of the following:

1. The original 63-section parser specification is supplied and reconciled
   (Step 0).
2. Jafar confirms the corpus list.
3. Every local source is marked: `local-only` · `sanitized fixture approved` ·
   `restricted` · `permission unknown`.
4. OPLG and Sakai examples are identified (none surfaced in the initial local
   scan).
5. Expected fixture outputs are recorded **before** parser behavior changes.
6. The fixture registry is committed or otherwise frozen before parser
   behavior is changed.
7. The documentation checkpoint receives its own isolated commit (on explicit
   instruction — nothing is committed autonomously).

The corpus is the test. Everything else is a promise.

---

## Step 0 — Original specification reconciliation

Before implementation begins:

- add the original 63-section parser specification to the repository as
  **`docs/PARSER-SPEC-ORIGINAL.md`** (it is not yet in the repository or any
  session context — it must be supplied by Jafar);
- reconcile it line by line against
  [UNIVERSAL-QUESTION-IMPORT-ENGINE.md](UNIVERSAL-QUESTION-IMPORT-ENGINE.md);
- preserve the stricter requirement wherever the documents differ;
- record every requirement added, strengthened, merged, or intentionally
  deferred;
- never weaken provenance, uncertainty, user-correction, or
  data-preservation rules.

**No parser implementation begins until this reconciliation is complete.**

## Step 1 — Canonical types and fixture-registry schema

Define stable contracts (in `web/src/lib/import/types.ts`) for:

`ImportBatch` · `SourceDocument` · `NormalizedDocument` · `NormalizedPage` ·
`TextBlock` · `ImageBlock` · `VectorBlock` · `QuestionRepresentation` ·
`CanonicalQuestion` · `ParsedOption` · `AnswerSignal` · `AnswerResolution` ·
`ExplanationData` · `QuestionAsset` · `FieldProvenance` · `FieldConfidence` ·
`ParserIssue` · `ParserRun` · `ProcessingEvent` · `UserCorrection` ·
`SourceTemplateProfile` · `DocumentRelationship` · `QuestionSet` · curriculum
relationships (Course Central §10).

Fixture-registry schema — each entry supports: fixture ID · local source path
**or** sanitized committed source · checksum · source family · legal/use
status · expected question count · expected representations · expected answer
sequence · expected explanation mapping · expected assets · expected
unresolved items · expected duplicates · expected warnings · expected
provenance · expected canonical JSON path.

Do not create parser logic in this step.

## Step 2 — Corpus registration

**Wait for Jafar's confirmation of the corpus list.** Register the approved
examples, including where available: Ethics practice packet · Family
Violence · Health Systems · Immunology practice set · IMCQ 8 · IMCQ 9 ·
ExamSoft questions-only · ExamSoft answered · Anatomy OPLG · DM OPLG · Sakai
questions · additional IMCQs/eSofts/OPLGs · other practice packets.

Known local candidates (read-only inventory, 2026-07-14; personal folders are
never modified or committed): ExamSoft pairs
(`BPM2_ESOFT QUIZ 1/2 … Blank` + `… with answers`), IMCQ decks
(`DM IMCQ 03/04/06/09`, `DM IMCQ 5 F2020`) with separate keys
(`DM_IMCQ 4/6/7_KEY`, `ER IMCQ 1/2/3 KEY`), and `ER Week 1–3` practice
packets across disciplines.

For every source: calculate SHA-256 · mark local-only vs. safe-for-sanitized
inclusion · preserve the original untouched · **no restricted school material
committed without explicit approval** · create sanitized structural
derivatives where needed · define expected output before parser
implementation. No parser behavior is written against an undocumented source.

Fixture directory layout:

```text
web/src/lib/import/__fixtures__/
  registry.ts      # ids, paths/derivatives, checksums, legal status, expectations
  unit/  structural/  golden/  visual/  migration/  performance/  real-failures/
```

## Step 3 — Extend the import verification harness

Extend `npm run verify:question-imports` to consume the fixture registry.
The harness **intentionally fails** where current behavior does not meet the
newly registered expectations — this red state is expected and useful.

The report measures: expected/detected question count · lost questions ·
unexpected questions · expected/detected answer keys · unresolved questions ·
false-ready questions · explanation association accuracy · source-page
accuracy · duplicate suppression · all-A collapse · runnable-pool safety ·
final persistence accuracy. The existing invariant stands: **`B, D, A, C, E`
must persist exactly.**

## Step 4 — Intake and checksums

Staged file intake supporting: one file · multiple related files · PDF · TXT ·
Markdown · DOCX · screenshots · images · pasted text · supported LMS exports.

Per file: checksum · duplicate-upload detection · preserve filename, MIME
type, byte size · detect text-layer availability · estimate extraction
quality · classify likely source role · identify likely related files ·
preserve original source references.

Screenshots and scans are valid intake sources even while OCR is unavailable:
stored honestly as `textLayerStatus: "unavailable"`. **Never fabricate
extracted content.**

## Step 5 — PDF.js layout adapter

Normalized layout via PDF.js preserving, where available: text · normalized
text · page number · coordinates · dimensions · reading order · font family/
size/weight · italic · underline · fill color · background color · image
blocks · vector blocks · page dimensions · rendered page reference ·
extraction quality.

The adapter is isolated from question parsing — it emits normalized pages,
not questions. Lazy-loaded and worker-compatible. **No parser-heavy module
may enter the eager Dashboard bundle.**

## Step 6 — Family classifier and strategy registry

Implement: document-family classifier · source-role classifier · strategy
registry · proposal scoring · evidence ledger · ensemble reconciliation.

Required strategies: `ExamSoftQuestionsOnlyStrategy` ·
`ExamSoftAnsweredStrategy` · `PracticeSplitQuestionsAnswersStrategy` ·
`PracticeInlineAnswersStrategy` · `IMCQSlideStrategy` · `OPLGSlideStrategy` ·
`SakaiExportStrategy` · `AnswerKeyStrategy` · `MultiPartCaseStrategy` ·
`GenericMCQStrategy` (**fallback only**).

Do not embed professor-, school-, or filename-specific exceptions in shared
parsing functions. Reusable source patterns belong in strategy rules,
template profiles, institution templates, or fixture-specific diagnostics
(institution-agnostic growth rule, WAVE-6-PLAN rule 10).

## Step 7 — Segmentation and question detection

Port the current working structural parser into modular stages: front-matter /
question-section / answer-section / explanation-section / answer-key /
teaching-content detection · question-number normalization · boundary
detection · option detection + continuation · stem cleanup · duplicate-text
removal · mini-case detection · question-type detection.

Do not terminate a question at every page break. Do not treat every `A.`–`E.`
in prose as an option block. Do not treat teaching slides as questions.
**`questionParse.ts` stops growing now** — behavior ports into staged modules
while the accepted legacy harness stays green until parity is proven.

## Step 8 — Answer signals and trust invariants

Answer evidence as first-class records: explicit letter · explicit answer
text · checkmark · highlight · bold · underline · answer key · answer slide ·
explanation reference · paired document · semantic inference.

Non-negotiable invariants (encoded in code and tests):

1. Unknown is never A.
2. No answer index initializes to zero.
3. No `parsedIndex || 0`.
4. Invalid labels remain unresolved.
5. Confirmed answers must belong to question options.
6. Conflict remains conflict.
7. Questions-only is valid.
8. Medical inference is not source truth.
9. Poll popularity never determines correctness.
10. Unresolved questions never enter scored pools.
11. User-confirmed corrections outrank parser output.
12. Reparse never silently overwrites user corrections.
13. Answer and explanation confidence remain separate.
14. A correct answer with a conflicting explanation is not fully trusted.

The harness proves that no absent, malformed, or conflicting evidence
silently becomes option A.

## Step 9 — Reconciliation, pairing, and sequence alignment

Reconcile across: duplicate text on one page · duplicate questions across
sections · questions-only + answered versions · answer-key files ·
explanation-key files · repeated answer slides · prior imports · revised
exports.

Implement: normalized fingerprints · fuzzy matching · option-set similarity ·
document-relationship scoring · dynamic sequence alignment · numbering-gap /
inserted-question / omitted-question / reordered-question handling ·
duplicate suppression · probable-match review states.

**Never map an answer key to the nearest question merely because numbers are
close.** Sequence evidence, stem similarity, option similarity, and document
relationship must jointly support every pairing.

## Step 10 — Explanation model and mismatch routing

Structured explanations per spec §13: general explanation · correct-answer
rationale · distractor rationales · key points · risk/protective factors ·
objective codes · references · teaching support · raw + cleaned explanation +
cleanup operations · source pages/spans · confidence.

Never: explanation text into option E · swallow the next question · delete
valid distractor rationales · confuse objective codes with explanations ·
promote a teaching slide into a rationale without evidence.

When answer evidence and explanation evidence disagree:
`status: needs_review`, `issue: explanation_answer_mismatch`. A strong answer
key alone does not make the question fully trusted.

## Step 11 — Persistence and ParserRun diagnostics

Persist **additively under schema v32** unless a written migration review
proves otherwise. Optional durable structures for: representations ·
relationships · parser runs · processing events · provenance · confidence ·
issues · user corrections · parser version · template-profile references.
Do not bump schema merely because new interfaces exist.

Preserve: existing questions · attempts · mappings · question sets · user
corrections · unknown fields · backup compatibility · import/merge behavior ·
legacy workspace loading.

Diagnostics include: stage · strategy · evidence · page · question ·
warning/error · confidence · selected proposal · rejected-proposal rationale ·
processing duration.

**No new parser/import structure may be written to localStorage** — the
IndexedDB-backed workspace is the only home for import payloads. (The
pre-existing Local Vault emergency localStorage fallback is legacy recovery
behavior outside this rule; it gains no new payload types.)

## Step 12 — Unified Import UI and exception-based Review Queue

One primary action: **Import** ("Upload one file or several related files.").
Relationships are detected across the full batch before any individual file
is finalized.

Processing summary: files received · source roles detected · questions found ·
answer sources matched · explanations found · images found · possible
duplicates · questions ready · needing review · no source answer · blocked.

Completion actions: **Open ready questions** · Review issues · Save sources
only. The review queue shows only exceptions.

Manual repairs (each recorded as a `UserCorrection`; the original source is
never touched): edit stem · edit option · change answer · mark unanswered ·
split question · merge questions · attach/detach image · reassign
explanation · choose source span · re-pair documents · restore parser
output · undo correction.

The import surface remains lazy-loaded.

## Step 13 — Acceptance and delegation gate

Wave 6A is accepted only when **all** pass:

**Corpus accuracy:** question-count accuracy 100% · explicit answer-line
mapping 100% · duplicate suppression 100% · false-ready 0 · invented
answers 0 · silent conflicts 0 · default-to-A failures 0 · lost sources 0 ·
overwritten user corrections 0.

**Mixed-key invariant:** `B, D, A, C, E` survives extraction →
representation → reconciliation → review → persistence → runnable-set
creation, exactly.

**Legacy parity:** current accepted imports stay green · existing question
sets load · attempts unchanged · explanations unchanged unless explicitly
reparsed · existing backups restore · schema v32 compatible.

**Runtime safety:** parser work out of the eager Dashboard bundle · heavy
work in workers/staged async · responsive progress · working cancellation ·
recoverable partial batches · browser closure does not destroy completed
intermediate work.

**Full gates** (all scripts verified present in `web/package.json`,
2026-07-14):

```sh
cd /Users/jd/Developer/AXOM/web
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
npm run verify:daily-games-offline
npm run verify:question-imports
cd /Users/jd/Developer/AXOM
git diff --check
```

Only after the harness is green on the confirmed corpus, bundle boundaries
are verified, legacy parity is proven, and an **independent reviewer accepts
the checkpoint** may Wave 6A be committed or delegated further.

---

## Module file list (planned)

Everything under `web/src/lib/import/`, loaded lazily:

```text
web/src/lib/import/
  index.ts                      # lazy public API
  types.ts                      # canonical entities (Step 1)
  intake/intake.ts              # files/paste/ZIP, quarantine messages
  intake/checksum.ts            # reuse existing SHA-256 path
  normalize/normalizedDocument.ts
  layout/pdfLayout.ts           # pdf.js adapter (Step 5, lazy)
  layout/readingOrder.ts
  classify/documentFamily.ts
  classify/sourceRole.ts
  strategies/registry.ts        # proposals, ensemble, recorded rationale
  strategies/practicePacketSplit.ts
  strategies/practicePacketInline.ts
  strategies/examSoftQuestionsOnly.ts
  strategies/examSoftAnswered.ts   # 6A: structural parts; visuals in 6B
  strategies/answerKey.ts
  strategies/genericMcq.ts      # fallback only
  segment/sections.ts
  questions/candidates.ts
  questions/options.ts
  questions/stemCleanup.ts
  reconcile/representations.ts
  reconcile/canonical.ts
  reconcile/pairing.ts          # relationships + sequence alignment (Step 9)
  answers/signals.ts
  answers/resolve.ts            # Step 8 invariants
  explanations/model.ts
  explanations/associate.ts
  academic/suggest.ts           # 6A: filename/metadata-level only
  validate/invariants.ts
  persist/persist.ts            # additive v32 (Step 11)
  diagnostics/parserRun.ts
  __fixtures__/…                # Step 2
```

`IMCQSlideStrategy`, `OPLGSlideStrategy`, and `SakaiExportStrategy` register
as skeletons in 6A (classification + honest "needs 6B/format sample"
diagnostics) and gain their visual/structured behavior in 6B.

## Boundaries

- **OCR:** screenshots/scans are first-class intake with
  `textLayerStatus: "unavailable"` and produce no extracted questions until
  the tesseract.js spike is approved (ROADMAP: blocked). No OCR claim ships
  before it.
- **Commercial sources** (UWorld/AMBOSS/B&B…): style recognition is
  local-only; no redistribution; template profiles stay device-local.

## Risks

1. Corpus confirmation stalls → Step 2 blocks everything, by design.
2. Parser port regresses the green harness → legacy path retained until
   Step 13 parity.
3. Commercial-source ToS/copyright → boundary above.
4. Bundle growth → Step 13 runtime-safety gate.
5. Scope creep into 6B visuals before slide fixtures → phase gates forbid it.
6. 63-section reconciliation debt → Step 0 is now a hard gate; if the
   original text is stricter anywhere, the stricter rule wins even if code
   must change.

## Open decisions (Jafar)

1. Supply `docs/PARSER-SPEC-ORIGINAL.md` (Step 0 gate).
2. Confirm the corpus list + per-file legal marking (Step 2 gate), including
   OPLG and Sakai examples.
3. Approve which sanitized derivatives may be committed.
4. OCR spike timing (tesseract.js) — before or after 6B.
5. Explicit instruction for the isolated documentation-checkpoint commit
   (precondition 7).

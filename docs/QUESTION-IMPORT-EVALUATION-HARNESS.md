# Question import evaluation harness

Status: deterministic acceptance command implemented in Wave 5.5D.

Run from `web/`:

```sh
npm run verify:question-imports
```

## What it exercises

The harness uses eight sanitized, repository-authored fixtures that reproduce
real import layouts without copying a proprietary question bank. They contain
21 expected questions across:

- a generated multi-page PDF with questions, a trailing key, and later
  explanations;
- a generated PDF with an answer and explanation after each question;
- pasted exact-answer text;
- Markdown with a compressed mixed A–E key;
- text with a two-column key plus page-header/footer noise;
- OCR-like spacing and a wrapped option;
- explanation prose whose lines begin with A–E;
- missing and conflicting answer evidence.

PDF fixtures are turned into actual in-memory PDF bytes and pass through
`extractPdfText`, the production parser, and page-provenance assignment. Text,
Markdown, and paste fixtures pass through the same production question parser.
The harness therefore tests extraction-to-draft behavior, not a mocked result
object.

This is a real-layout regression corpus, not a claim that the generated PDFs
represent every publisher, scanner, font, table, or damaged text layer.

## Row-level audit output

For every expected question, the evaluator records:

- fixture and question number;
- expected and detected answer;
- canonical pre-save trust state (`ready`, `review-suggested`, or
  `unresolved`);
- answer correctness;
- whether the expected explanation text and page were associated;
- answer confidence and evidence;
- conflict reason;
- question, answer-evidence, and explanation pages;
- whether the row was falsely classified ready.

The same pure import-mapping ledger used by development diagnostics supplies
confidence, evidence, and conflict detail. These diagnostics are not exposed as
ordinary user-facing noise.

## Aggregate gates

The command fails unless:

- explicit answer accuracy is at least 95%;
- explanation association accuracy is at least 90%;
- false-ready count is zero;
- a mixed expected key has not collapsed to all A;
- no expected question is lost;
- no unexpected question is invented.

The current Wave 5.5D fixture run reports 21 questions, 100% exact answer
accuracy, 100% explanation association, two intentionally unresolved questions
(9.52%), zero false-ready rows, no all-A collapse, no lost questions, and no
unexpected questions. The mixed-key fixture preserves `B, D, A, C, E`.

## Trust boundary

The harness intentionally treats review volume as different from false trust.
Questions with a supported answer but no explanation may remain
`review-suggested`; missing or conflicting evidence remains `unresolved`.
Neither state is promoted to option A. Import UI and persistence use the same
pre-save status policy, so an acceptance-only classifier cannot hide a runtime
defect.

The harness does not certify source medical correctness, OCR quality, or every
complex PDF layout. Scanned PDFs still require a separate OCR design, and
unusual real documents may require human mapping review. New field failures
should be reduced to a sanitized fixture before parser rules are broadened.

import type { QuestionOption } from "./questions";

export type QuestionImportFixtureFormat = "pdf" | "paste" | "text" | "markdown";

export interface QuestionImportExpectation {
  number: number;
  answer?: string;
  explanationIncludes?: string;
  questionPage?: number;
  answerPage?: number;
  explanationPage?: number;
}

export interface QuestionImportAcceptanceFixture {
  id: string;
  format: QuestionImportFixtureFormat;
  description: string;
  /** PDF fixtures use one string per generated page; other formats use one entry. */
  pages: string[];
  expected: QuestionImportExpectation[];
}

const options = (suffix: string, count = 5): QuestionOption[] =>
  ["A", "B", "C", "D", "E"].slice(0, count).map((key) => ({
    key,
    text: `${key.toLowerCase()}${suffix}`,
  }));

function question(number: number, label: string, count = 5): string[] {
  return [
    `${number}. ${label}?`,
    ...options(String(number), count).map((option) => `${option.key}. ${option.text}`),
  ];
}

/**
 * Sanitized, authored fixtures that mimic real import layouts without copying
 * a proprietary question bank. PDF entries are converted to real in-memory
 * PDFs by the acceptance test before they reach AXOM's extraction pipeline.
 */
export const QUESTION_IMPORT_ACCEPTANCE_FIXTURES: QuestionImportAcceptanceFixture[] = [
  {
    id: "pdf-trailing-key-and-later-explanations",
    format: "pdf",
    description: "Answered PDF with questions first, a trailing key, and explanations on a later page",
    pages: [
      [
        "SANITIZED STUDY SET — Page 1",
        ...question(1, "Which marker belongs to sample one"),
        "",
        ...question(2, "Which marker belongs to sample two"),
        "Footer · educational fixture",
      ].join("\n"),
      [
        "SANITIZED STUDY SET — Page 2",
        ...question(3, "Which marker belongs to sample three"),
        "",
        "Answer Key",
        "1. B   2. D   3. A",
        "Footer · educational fixture",
      ].join("\n"),
      [
        "Explanations",
        "1. b1 is supported by the first sanitized finding.",
        "2. d2 is supported by the second sanitized finding.",
        "3. a3 is supported by the third sanitized finding.",
      ].join("\n"),
    ],
    expected: [
      { number: 1, answer: "B", explanationIncludes: "first sanitized finding", questionPage: 1, answerPage: 2, explanationPage: 3 },
      { number: 2, answer: "D", explanationIncludes: "second sanitized finding", questionPage: 1, answerPage: 2, explanationPage: 3 },
      { number: 3, answer: "A", explanationIncludes: "third sanitized finding", questionPage: 2, answerPage: 2, explanationPage: 3 },
    ],
  },
  {
    id: "pdf-inline-answer-and-explanation",
    format: "pdf",
    description: "PDF with each answer and explanation immediately after its question",
    pages: [
      [
        "Question 1: Which inline marker is supported?",
        "A. Alpha marker",
        "B. Beta marker",
        "C. Gamma marker",
        "D. Delta marker",
        "Answer: C",
        "Rationale: Gamma marker follows from the sanitized observation.",
      ].join("\n"),
      [
        "Question 2: Which second inline marker is supported?",
        "A. First marker",
        "B. Second marker",
        "C. Third marker",
        "D. Fourth marker",
        "Correct answer: D",
        "Why: Fourth marker follows from the second sanitized observation.",
      ].join("\n"),
    ],
    expected: [
      { number: 1, answer: "C", explanationIncludes: "Gamma marker follows", questionPage: 1, answerPage: 1, explanationPage: 1 },
      { number: 2, answer: "D", explanationIncludes: "Fourth marker follows", questionPage: 2, answerPage: 2, explanationPage: 2 },
    ],
  },
  {
    id: "pasted-inline-answer-text",
    format: "paste",
    description: "Pasted questions whose answers are exact option text rather than letters",
    pages: [[
      "1. Which immune cell is named in this sanitized example?",
      "A. B lymphocytes",
      "B. CD4+ T lymphocytes",
      "C. Neutrophils",
      "D. Eosinophils",
      "Answer: CD4+ T lymphocytes",
      "Explanation: CD4+ T lymphocytes are the explicitly named answer in this fixture.",
      "",
      "2. Which mediator is named in the second example?",
      "A. Histamine",
      "B. Bradykinin",
      "C. Complement C3b",
      "D. Interferon gamma",
      "Answer: Interferon gamma",
      "Feedback: Interferon gamma is the exact option text supplied by the author.",
    ].join("\n")],
    expected: [
      { number: 1, answer: "B", explanationIncludes: "explicitly named answer" },
      { number: 2, answer: "D", explanationIncludes: "exact option text" },
    ],
  },
  {
    id: "markdown-compressed-mixed-key",
    format: "markdown",
    description: "Structured Markdown with five choices and a compressed mixed A–E key",
    pages: [[
      "# Sanitized mixed-key set",
      ...question(1, "Choose marker one"),
      "",
      ...question(2, "Choose marker two"),
      "",
      ...question(3, "Choose marker three"),
      "",
      ...question(4, "Choose marker four"),
      "",
      ...question(5, "Choose marker five"),
      "",
      "## Answer key",
      "1.B 2.D 3.A 4.C 5.E",
    ].join("\n")],
    expected: [
      { number: 1, answer: "B" },
      { number: 2, answer: "D" },
      { number: 3, answer: "A" },
      { number: 4, answer: "C" },
      { number: 5, answer: "E" },
    ],
  },
  {
    id: "text-multicolumn-key-with-page-noise",
    format: "text",
    description: "Text export with a two-column answer key and page headers/footers",
    pages: [[
      "SANITIZED REVIEW PACKET 12",
      ...question(11, "Choose marker eleven", 4),
      "",
      ...question(12, "Choose marker twelve", 4),
      "",
      ...question(13, "Choose marker thirteen", 4),
      "",
      ...question(14, "Choose marker fourteen", 4),
      "",
      "ANSWERS",
      "11. C        13. B",
      "12. A        14. D",
      "Page 12 of 12",
    ].join("\n")],
    expected: [
      { number: 11, answer: "C" },
      { number: 12, answer: "A" },
      { number: 13, answer: "B" },
      { number: 14, answer: "D" },
    ],
  },
  {
    id: "text-ocr-spacing-and-wrapped-options",
    format: "text",
    description: "OCR-like spacing, spaced punctuation, and wrapped option lines",
    pages: [[
      "Q u e s t i o n  # :  1",
      "Which wrapped choice is supported?",
      "A . First wrapped choice",
      "continues on a second line",
      "B . Second choice",
      "C . Third choice",
      "D . Fourth choice",
      "A n s w e r :  B",
      "E x p l a n a t i o n : The second choice is explicitly supported.",
    ].join("\n")],
    expected: [
      { number: 1, answer: "B", explanationIncludes: "explicitly supported" },
    ],
  },
  {
    id: "text-explanations-with-leading-letters",
    format: "text",
    description: "Explanations containing A–E-leading sentences that must not become options",
    pages: [[
      "1. Which marker is supported?",
      "A. Alpha",
      "B. Beta",
      "C. Gamma",
      "D. Delta",
      "Answer: B",
      "Explanation:",
      "A. common distraction is to choose Alpha.",
      "B. Beta is supported by the stated observation.",
      "C. Gamma would require a different finding.",
      "",
      "2. Which later marker is supported?",
      "A. First",
      "B. Second",
      "C. Third",
      "D. Fourth",
      "Answer: C",
      "Explanation: Third is supported; the other options are not.",
    ].join("\n")],
    expected: [
      { number: 1, answer: "B", explanationIncludes: "common distraction" },
      { number: 2, answer: "C", explanationIncludes: "Third is supported" },
    ],
  },
  {
    id: "text-unresolved-and-conflict",
    format: "text",
    description: "Missing and conflicting evidence must remain non-runnable",
    pages: [[
      "1. Which unresolved marker is supported?",
      "A. Alpha",
      "B. Beta",
      "C. Gamma",
      "D. Delta",
      "",
      "2. Which conflicting marker is supported?",
      "A. Alpha",
      "B. Beta",
      "C. Gamma",
      "D. Delta",
      "Answer: A",
      "",
      "Answer key:",
      "2. D",
    ].join("\n")],
    expected: [
      { number: 1 },
      { number: 2 },
    ],
  },
];


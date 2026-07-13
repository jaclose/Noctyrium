import { describe, expect, it } from "vitest";
import { extractPdfText } from "./extractText";
import { evaluateQuestionImports } from "./questionImportEvaluation";
import { QUESTION_IMPORT_ACCEPTANCE_FIXTURES } from "./questionImportFixtures";
import { parseQuestionBlocks, type ParsedQuestionDraft } from "./questionParse";
import { assignDraftProvenancePages } from "./questionProvenance";

describe("real-style question import acceptance", () => {
  it("meets the answer, explanation, and false-ready gates", async () => {
    const parsed = new Map<string, ParsedQuestionDraft[]>();
    const legacyPdf = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const worker = new URL("../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();

    for (const fixture of QUESTION_IMPORT_ACCEPTANCE_FIXTURES) {
      let pages = fixture.pages;
      let text = fixture.pages.join("\n\n");
      if (fixture.format === "pdf") {
        const extracted = await extractPdfText(
          makePdf(fixture.pages),
          legacyPdf as unknown as typeof import("pdfjs-dist"),
          worker,
        );
        pages = extracted.pages;
        text = extracted.text;
      }
      const drafts = parseQuestionBlocks(text);
      if (fixture.format === "pdf") assignDraftProvenancePages(drafts, pages);
      parsed.set(fixture.id, drafts);
    }

    const result = evaluateQuestionImports(QUESTION_IMPORT_ACCEPTANCE_FIXTURES, parsed);
    const failures = result.rows.filter((row) => (
      !row.answerCorrect || !row.explanationAssociated || row.falseReady
    ));
    console.table(result.rows.map((row) => ({
      fixture: row.fixtureId,
      question: row.questionNumber,
      expected: row.expectedAnswer ?? "unresolved",
      detected: row.detectedAnswer ?? "unresolved",
      status: row.status,
      answerConfidence: `${Math.round(row.confidence * 100)}%`,
      explanation: row.explanationExpected ? (row.explanationAssociated ? "matched" : "wrong/missing") : "not supplied",
      sourcePages: [row.questionPage, row.answerPage, row.explanationPage].filter(Boolean).join("/") || "n/a",
      falseReady: row.falseReady ? "YES" : "no",
    })));
    console.info("Question import acceptance summary", {
      totalQuestions: result.totalQuestions,
      exactAnswerAccuracy: `${result.answerAccuracy}%`,
      explanationAssociationAccuracy: `${result.explanationAccuracy}%`,
      unresolvedRate: `${result.unresolvedRate}%`,
      falseReady: result.falseReady,
      allACollapse: result.allACollapse,
      lostQuestions: result.lostQuestions,
      unexpectedQuestions: result.unexpectedQuestions,
      perFixtureFailures: failures.map((row) => `${row.fixtureId}#${row.questionNumber}`),
    });

    expect(result.answerAccuracy, "explicit answer accuracy").toBeGreaterThanOrEqual(95);
    expect(result.explanationAccuracy, "explanation association accuracy").toBeGreaterThanOrEqual(90);
    expect(result.falseReady, "false-ready mappings").toBe(0);
    expect(result.allACollapse, "all-A collapse").toBe(false);
    expect(result.lostQuestions, "question loss").toBe(0);
    expect(result.unexpectedQuestions, "unexpected parser-created questions").toBe(0);
  }, 20_000);
});

/** A tiny, uncompressed, multi-line PDF used to exercise the real extractor. */
function makePdf(pageTexts: string[]): ArrayBuffer {
  const objects: string[] = [];
  const pageObjects: number[] = [];
  const fontObject = 3 + pageTexts.length * 2;
  pageTexts.forEach((_, index) => pageObjects.push(3 + index * 2));
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageObjects.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageTexts.length} >>`;
  pageTexts.forEach((text, index) => {
    const page = 3 + index * 2;
    const content = page + 1;
    const commands = text.split("\n").flatMap((line, lineIndex) => [
      lineIndex === 0 ? "" : "0 -14 Td",
      `(${escapePdfText(line)}) Tj`,
    ]).filter(Boolean).join("\n");
    const stream = `BT /F1 9 Tf 54 748 Td\n${commands}\nET`;
    objects[page] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${content} 0 R >>`;
    objects[content] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  objects[fontObject] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let number = 1; number < objects.length; number += 1) {
    offsets[number] = pdf.length;
    pdf += `${number} 0 obj\n${objects[number]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let number = 1; number < objects.length; number += 1) {
    pdf += `${String(offsets[number]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf).buffer;
}

function escapePdfText(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, " ").replace(/[()\\]/g, (character) => `\\${character}`);
}

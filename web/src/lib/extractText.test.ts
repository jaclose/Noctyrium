import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { extractDocxText, extractPdfText, extractPlainText } from "./extractText";

describe("document text extraction", () => {
  it("preserves TXT line breaks while normalizing CRLF", () => {
    const result = extractPlainText("Question one\r\nA. Alpha\r\nB. Beta\r\n\r\nAnswer: B");
    expect(result.pages).toHaveLength(1);
    expect(result.text).toBe("Question one\nA. Alpha\nB. Beta\n\nAnswer: B");
    expect(result.empty).toBe(false);
  });

  it("extracts DOCX paragraphs with their breaks intact", async () => {
    const zip = new JSZip();
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
        <Default Extension="xml" ContentType="application/xml"/>
        <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
      </Types>`);
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
      </Relationships>`);
    zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
        <w:p><w:r><w:t>Question 1. Which answer is correct?</w:t></w:r></w:p>
        <w:p><w:r><w:t>A. Alpha</w:t></w:r></w:p>
        <w:p><w:r><w:t>B. Beta</w:t></w:r></w:p>
        <w:p><w:r><w:t>Answer: B</w:t></w:r></w:p>
      </w:body></w:document>`);
    const buffer = await zip.generateAsync({ type: "arraybuffer" });
    const result = await extractDocxText(buffer);
    expect(result.text).toContain("Question 1. Which answer is correct?\n\nA. Alpha\n\nB. Beta\n\nAnswer: B");
    expect(result.empty).toBe(false);
  });

  it("extracts PDF text per page", async () => {
    const legacyPdf = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const result = await extractPdfText(
      makePdf(["Question 1 page one", "Question 2 page two"]),
      legacyPdf as unknown as typeof import("pdfjs-dist"),
      new URL("../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString(),
    );
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0]).toContain("Question 1 page one");
    expect(result.pages[1]).toContain("Question 2 page two");
    expect(result.text).toContain("Question 1 page one");
    expect(result.text).toContain("Question 2 page two");
  });
});

/** Tiny standards-compliant, uncompressed PDF fixture generated in memory. */
function makePdf(pageTexts: string[]): ArrayBuffer {
  const objects: string[] = [];
  const pageObjectNumbers: number[] = [];
  const fontObject = 3 + pageTexts.length * 2;
  pageTexts.forEach((_, index) => pageObjectNumbers.push(3 + index * 2));
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageTexts.length} >>`;
  pageTexts.forEach((text, index) => {
    const page = 3 + index * 2;
    const content = page + 1;
    const stream = `BT /F1 12 Tf 72 720 Td (${text.replace(/[()\\]/g, (char) => `\\${char}`)}) Tj ET`;
    objects[page] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${content} 0 R >>`;
    objects[content] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  objects[fontObject] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let number = 1; number < objects.length; number++) {
    offsets[number] = pdf.length;
    pdf += `${number} 0 obj\n${objects[number]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let number = 1; number < objects.length; number++) {
    pdf += `${String(offsets[number]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf).buffer;
}

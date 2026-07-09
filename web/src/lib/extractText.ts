// ===========================================================================
// Document text extraction (Import Center layer 1). PDF via pdfjs-dist
// (digital text layer only — a scanned/image PDF yields no text and we say so
// honestly; OCR remains future work). DOCX via mammoth. Both libraries load
// lazily so the main bundle stays lean. Extraction returns per-page text where
// the format has pages, letting parsed questions carry a source page.
// ===========================================================================

export interface ExtractedText {
  /** Per-page text (PDF) or a single element (DOCX/TXT). */
  pages: string[];
  /** Joined convenience form. */
  text: string;
  /** True when the file opened fine but contained no extractable text. */
  empty: boolean;
  warnings: string[];
}

/** Rough cap on stored raw text so a giant textbook can't bloat the vault. */
export const RAW_TEXT_CAP = 400_000;

export async function extractPdfText(buffer: ArrayBuffer): Promise<ExtractedText> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const warnings: string[] = [];
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Rebuild line structure from item positions: a new baseline = new line.
    let lastY: number | null = null;
    let text = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 2) text += "\n";
      else if (text && !text.endsWith("\n") && !text.endsWith(" ")) text += " ";
      text += item.str;
      lastY = y;
    }
    pages.push(text.trim());
  }
  await doc.cleanup();

  const joined = pages.join("\n\n").trim();
  if (!joined) {
    warnings.push(
      "This PDF has no extractable text layer — it's likely a scan or image export. OCR isn't available in-app yet; the file is kept as a source record.",
    );
  }
  if (joined.length > RAW_TEXT_CAP) {
    warnings.push(`Text truncated at ${Math.round(RAW_TEXT_CAP / 1000)}k characters to protect local storage.`);
  }
  return {
    pages: capPages(pages),
    text: joined.slice(0, RAW_TEXT_CAP),
    empty: !joined,
    warnings,
  };
}

export async function extractDocxText(buffer: ArrayBuffer): Promise<ExtractedText> {
  const mammoth = await import("mammoth");
  const warnings: string[] = [];
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  for (const message of result.messages ?? []) {
    if (message.message) warnings.push(message.message);
  }
  const text = (result.value ?? "").trim();
  if (!text) warnings.push("No text found in this DOCX file.");
  if (text.length > RAW_TEXT_CAP) {
    warnings.push(`Text truncated at ${Math.round(RAW_TEXT_CAP / 1000)}k characters to protect local storage.`);
  }
  return { pages: [text.slice(0, RAW_TEXT_CAP)], text: text.slice(0, RAW_TEXT_CAP), empty: !text, warnings: warnings.slice(0, 5) };
}

function capPages(pages: string[]): string[] {
  let budget = RAW_TEXT_CAP;
  const out: string[] = [];
  for (const page of pages) {
    if (budget <= 0) break;
    out.push(page.slice(0, budget));
    budget -= page.length;
  }
  return out;
}

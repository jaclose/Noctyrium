import { describe, expect, it } from "vitest";
import {
  createTextAnnotation,
  normalizeQuestionAnnotations,
  reconcileQuestionAnnotationSources,
  reconcileTextAnnotation,
  sourceTextHash,
} from "./questionAnnotations";
import { applyAttempt, withCorrectAnswerText, type QuestionRecord } from "./questions";

const NOW = "2026-07-16T12:00:00.000Z";

function annotationFor(text: string, exactText: string) {
  const startOffset = text.indexOf(exactText);
  return createTextAnnotation({
    id: "annotation-1",
    target: "stem",
    sourceText: text,
    startOffset,
    endOffset: startOffset + exactText.length,
    tone: "yellow",
    now: NOW,
  });
}

describe("question annotation anchoring", () => {
  it("creates and restores an exact stem highlight", () => {
    const text = "A durable stem highlight survives reload.";
    const annotation = annotationFor(text, "stem highlight");
    expect(annotation.exactText).toBe("stem highlight");
    expect(reconcileTextAnnotation(annotation, text)).toMatchObject({
      status: "active",
      startOffset: 10,
      endOffset: 24,
    });
  });

  it("supports explanation targets", () => {
    const text = "The explanation identifies beta as the answer.";
    const startOffset = text.indexOf("beta");
    const annotation = createTextAnnotation({
      id: "explanation-1",
      target: "explanation",
      sourceText: text,
      startOffset,
      endOffset: startOffset + 4,
      tone: "cyan",
      now: NOW,
    });
    expect(annotation.target).toBe("explanation");
    expect(reconcileTextAnnotation(annotation, text).status).toBe("active");
  });

  it("keeps an anchor when a source revision has identical text", () => {
    const text = "The exact passage remains stable.";
    const annotation = annotationFor(text, "exact passage");
    expect(annotation.sourceTextHash).toBe(sourceTextHash(text));
    expect(reconcileTextAnnotation(annotation, `${text}`)).toMatchObject({
      status: "active",
      startOffset: 4,
    });
  });

  it("reanchors a small source shift using exact text and context", () => {
    const original = "Alpha context selected phrase omega context.";
    const annotation = annotationFor(original, "selected phrase");
    const shifted = `Preface. ${original}`;
    expect(reconcileTextAnnotation(annotation, shifted)).toMatchObject({
      status: "active",
      startOffset: annotation.startOffset + 9,
      endOffset: annotation.endOffset + 9,
      sourceTextHash: sourceTextHash(shifted),
    });
  });

  it("marks an ambiguous repeated passage for repair instead of guessing", () => {
    const original = "prefix chosen text suffix";
    const annotation = annotationFor(original, "chosen text");
    const ambiguous = "prefix chosen text suffix / prefix chosen text suffix";
    expect(reconcileTextAnnotation(annotation, ambiguous)).toMatchObject({
      status: "needs-repair",
      startOffset: annotation.startOffset,
      endOffset: annotation.endOffset,
      exactText: "chosen text",
    });
  });

  it("survives attempt recording and correct-answer mapping changes", () => {
    const text = "A persistent annotation remains.";
    const annotation = annotationFor(text, "persistent annotation");
    const question: QuestionRecord = {
      id: "q1", source: "manual", stem: text,
      options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }],
      correctKey: "A", correctAnswerText: "Alpha", status: "unseen", tags: [],
      annotations: [annotation], attempts: [], createdAt: NOW, updatedAt: NOW,
    };
    const attempted = applyAttempt(question, { answerKey: "B", status: "incorrect" });
    expect(attempted.annotations).toEqual([annotation]);
    const corrected = withCorrectAnswerText({ ...attempted, correctKey: "B" });
    expect(corrected.correctAnswerText).toBe("Beta");
    expect(corrected.annotations).toEqual([annotation]);
  });

  it("persists reanchoring or repair state when question source text changes", () => {
    const original = "Alpha context selected phrase omega context.";
    const annotation = annotationFor(original, "selected phrase");
    const shifted = reconcileQuestionAnnotationSources({
      stem: `Preface. ${original}`, options: [], annotations: [annotation],
    });
    expect(shifted.annotations?.[0]).toMatchObject({
      status: "active",
      startOffset: annotation.startOffset + 9,
    });
    const ambiguous = reconcileQuestionAnnotationSources({
      stem: "Alpha context selected phrase omega context. Alpha context selected phrase omega context.",
      options: [], annotations: [annotation],
    });
    expect(ambiguous.annotations?.[0].status).toBe("needs-repair");
  });

  it("keeps deletion authoritative when the stored array is empty", () => {
    expect(normalizeQuestionAnnotations([])).toBeUndefined();
  });

  it("does not write annotation content to device-preference localStorage", () => {
    const before = typeof localStorage === "undefined" ? null : Object.keys(localStorage);
    annotationFor("Local-first annotation metadata.", "annotation");
    const after = typeof localStorage === "undefined" ? null : Object.keys(localStorage);
    expect(after).toEqual(before);
  });
});

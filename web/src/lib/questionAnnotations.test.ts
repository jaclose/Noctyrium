import { describe, expect, it } from "vitest";
import {
  createTextAnnotation,
  createTextAnnotationWithIntegrity,
  normalizeQuestionAnnotations,
  removeTextAnnotationById,
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

describe("question annotation integrity", () => {
  const text = "0123456789abcdefghij";

  function tryCreate(
    id: string,
    startOffset: number,
    endOffset: number,
    existingAnnotations: ReturnType<typeof annotationFor>[],
    target: "stem" | "explanation" = "stem",
  ) {
    return createTextAnnotationWithIntegrity({
      id,
      target,
      sourceText: text,
      startOffset,
      endOffset,
      tone: "yellow",
      now: NOW,
      existingAnnotations,
    });
  }

  it("rejects partial and nested overlaps but permits touching edges", () => {
    const existing = createTextAnnotation({
      id: "existing", target: "stem", sourceText: text,
      startOffset: 0, endOffset: 10, tone: "yellow", now: NOW,
    });
    expect(tryCreate("partial", 8, 15, [existing])).toMatchObject({
      status: "overlap",
      existingAnnotationId: "existing",
      reason: "Highlight overlaps an existing highlight.",
    });
    const enclosing = createTextAnnotation({
      id: "enclosing", target: "stem", sourceText: text,
      startOffset: 0, endOffset: 20, tone: "yellow", now: NOW,
    });
    expect(tryCreate("nested", 5, 10, [enclosing]).status).toBe("overlap");
    expect(tryCreate("adjacent", 10, 20, [existing]).status).toBe("created");
  });

  it("isolates overlap checks by target", () => {
    const stem = createTextAnnotation({
      id: "stem", target: "stem", sourceText: text,
      startOffset: 0, endOffset: 10, tone: "yellow", now: NOW,
    });
    expect(tryCreate("explanation", 5, 10, [stem], "explanation").status).toBe("created");
  });

  it("isolates option A from option B while blocking overlap within one option", () => {
    const optionA = createTextAnnotation({
      id: "option-a", target: "option", optionKey: "A", sourceText: text,
      startOffset: 0, endOffset: 10, tone: "yellow", now: NOW,
    });
    const createOption = (id: string, optionKey: string) => createTextAnnotationWithIntegrity({
      id, target: "option" as const, optionKey, sourceText: text,
      startOffset: 5, endOffset: 12, tone: "cyan" as const, now: NOW,
      existingAnnotations: [optionA],
    });
    expect(createOption("same-option", "A").status).toBe("overlap");
    expect(createOption("different-option", "B").status).toBe("created");
  });

  it("treats a needs-repair annotation as authoritative until deletion", () => {
    const repair = {
      ...createTextAnnotation({
        id: "repair", target: "stem", sourceText: text,
        startOffset: 0, endOffset: 10, tone: "yellow", now: NOW,
      }),
      status: "needs-repair" as const,
    };
    expect(tryCreate("blocked", 5, 12, [repair]).status).toBe("overlap");
    const afterDelete = removeTextAnnotationById([repair], "repair");
    expect(tryCreate("recreated", 5, 12, afterDelete).status).toBe("created");
  });

  it("checks overlap against an active annotation's reconciled rendered range", () => {
    const original = "Alpha context selected phrase omega context.";
    const shifted = `Preface. ${original}`;
    const annotation = annotationFor(original, "selected phrase");
    const shiftedStart = shifted.indexOf("selected phrase");
    expect(createTextAnnotationWithIntegrity({
      id: "rendered-overlap",
      target: "stem",
      sourceText: shifted,
      startOffset: shiftedStart,
      endOffset: shiftedStart + "selected".length,
      tone: "cyan",
      now: NOW,
      existingAnnotations: [annotation],
    })).toMatchObject({
      status: "overlap",
      existingAnnotationId: annotation.id,
    });
  });

  it("deletes only the requested annotation", () => {
    const first = annotationFor("first second third", "first");
    const second = createTextAnnotation({
      id: "annotation-2", target: "stem", sourceText: "first second third",
      startOffset: 6, endOffset: 12, tone: "cyan", now: NOW, note: "linked note",
    });
    expect(removeTextAnnotationById([first, second], first.id)).toEqual([second]);
  });

  it("ignores collapsed, whitespace-only, and duplicate-id saves", () => {
    expect(tryCreate("collapsed", 5, 5, [])).toEqual({ status: "ignored", reason: "collapsed" });
    expect(createTextAnnotationWithIntegrity({
      id: "space", target: "stem", sourceText: "alpha   beta",
      startOffset: 5, endOffset: 8, tone: "yellow", now: NOW, existingAnnotations: [],
    })).toEqual({ status: "ignored", reason: "whitespace" });
    const existing = createTextAnnotation({
      id: "same-id", target: "stem", sourceText: text,
      startOffset: 0, endOffset: 5, tone: "yellow", now: NOW,
    });
    expect(tryCreate("same-id", 10, 15, [existing])).toEqual({
      status: "ignored",
      reason: "duplicate-id",
    });
  });

  it("normalizes repeated navigation snapshots without duplicating annotation IDs", () => {
    const annotation = createTextAnnotation({
      id: "stable-id", target: "stem", sourceText: text,
      startOffset: 0, endOffset: 5, tone: "yellow", now: NOW,
    });
    const restored = normalizeQuestionAnnotations([
      annotation,
      { ...annotation, updatedAt: "2026-07-16T12:01:00.000Z" },
      annotation,
    ]);
    expect(restored).toHaveLength(1);
    expect(restored?.[0]).toMatchObject({ id: "stable-id", updatedAt: "2026-07-16T12:01:00.000Z" });
  });

  it("marks a competing persisted overlap for repair instead of silently hiding it", () => {
    const source = "0123456789abcdefghij";
    const first = createTextAnnotation({
      id: "first-active", target: "stem", sourceText: source,
      startOffset: 0, endOffset: 10, tone: "yellow", now: NOW,
    });
    const second = createTextAnnotation({
      id: "second-overlap", target: "stem", sourceText: source,
      startOffset: 5, endOffset: 15, tone: "cyan", now: "2026-07-16T12:01:00.000Z",
    });
    const reconciled = reconcileQuestionAnnotationSources({
      stem: source, options: [], annotations: [second, first],
    });
    expect(reconciled.annotations).toEqual([
      expect.objectContaining({ id: "second-overlap", status: "needs-repair" }),
      expect.objectContaining({ id: "first-active", status: "active" }),
    ]);
  });
});

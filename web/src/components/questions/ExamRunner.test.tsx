// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuestionSet } from "../../lib/library";
import type { QuestionRecord } from "../../lib/questions";
import type { QuizBlock } from "../../lib/quiz";
import { ExamRunner } from "./ExamRunner";
import { createTextAnnotation } from "../../lib/questionAnnotations";

const mocked = vi.hoisted(() => ({
  store: {} as Record<string, unknown>,
  saveQuizBlock: vi.fn(),
  updateQuestion: vi.fn(),
  recordQuestionAttempt: vi.fn(),
}));

vi.mock("../../lib/store", () => ({ useStore: () => mocked.store }));
vi.mock("../../lib/ai", () => ({
  resolveActiveProvider: () => null,
  explainSimply: vi.fn(),
  explainWhyWrong: vi.fn(),
  memoryHook: vi.fn(),
}));
vi.mock("../../lib/toast", () => ({ pushToast: vi.fn() }));

const question: QuestionRecord = {
  id: "question-1",
  source: "manual",
  stem: "Which option is correct?",
  options: [{ key: "A", text: "Alpha" }, { key: "B", text: "Beta" }],
  correctKey: "B",
  correctAnswerText: "Beta",
  explanation: "Beta is correct.",
  setId: "set-1",
  status: "unseen",
  tags: [],
  attempts: [],
  createdAt: "2026-07-10T00:00:00.000Z",
  updatedAt: "2026-07-10T00:00:00.000Z",
};

const questionSet: QuestionSet = {
  id: "set-1",
  title: "Saved set",
  sourceDocumentIds: [],
  createdAt: "2026-07-10T00:00:00.000Z",
  questionIds: [question.id],
  tags: [],
  aiEnhanced: false,
  parserWarnings: [],
};

const savedBlock: QuizBlock = {
  id: "block-1",
  title: "Timed saved block",
  mode: "exam",
  timed: true,
  filters: { count: 10, status: "all", setIds: [questionSet.id] },
  createdAt: "2026-07-10T00:00:00.000Z",
};

function setStore() {
  mocked.store = {
    questions: [question],
    questionSets: [questionSet],
    quizBlocks: [savedBlock],
    quizSessions: [],
    saveQuizBlock: mocked.saveQuizBlock,
    saveQuizSession: vi.fn(),
    recordQuestionAttempt: mocked.recordQuestionAttempt,
    updateQuestion: mocked.updateQuestion,
    addAnkiCards: vi.fn(() => ({ saved: 1, errors: [] })),
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ExamRunner saved blocks and selection semantics", () => {
  it("reopens a timed block as timed and advances lastRunAt only when Start is pressed", async () => {
    setStore();
    const user = userEvent.setup();
    render(
      <ExamRunner
        mode={savedBlock.mode}
        presetFilters={savedBlock.filters}
        presetTimed={savedBlock.timed}
        blockId={savedBlock.id}
        onClose={() => {}}
      />,
    );

    expect(screen.getByRole("checkbox", { name: /Timed/i })).toHaveProperty("checked", true);
    expect(screen.getByRole("button", { name: /Exam \(feedback at the end\)/i }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Saved set (1)" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "10" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("true");
    expect(mocked.saveQuizBlock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Start exam block/i }));

    expect(mocked.saveQuizBlock).toHaveBeenCalledOnce();
    const updated = mocked.saveQuizBlock.mock.calls[0][0] as QuizBlock;
    expect(updated.id).toBe(savedBlock.id);
    expect(updated.timed).toBe(true);
    expect(Number.isNaN(Date.parse(updated.lastRunAt ?? ""))).toBe(false);
    expect(screen.getByText(question.stem)).toBeTruthy();
  });

  it("announces answer, flag, and confidence selection while preserving shortcut guards", async () => {
    setStore();
    const user = userEvent.setup();
    render(<ExamRunner mode="tutor" retakeIds={[question.id]} onClose={() => {}} />);

    const optionA = screen.getByRole("button", { name: "A. Alpha" });
    const optionB = screen.getByRole("button", { name: "B. Beta" });
    expect(optionA.getAttribute("aria-pressed")).toBe("false");

    await user.click(optionA);
    expect(optionA.getAttribute("aria-pressed")).toBe("true");

    fireEvent.keyDown(optionA, { key: "B" });
    expect(optionA.getAttribute("aria-pressed")).toBe("true");
    expect(optionB.getAttribute("aria-pressed")).toBe("false");

    fireEvent.keyDown(window, { key: "B" });
    expect(optionB.getAttribute("aria-pressed")).toBe("true");

    fireEvent.keyDown(window, { key: "F" });
    expect(screen.getByRole("button", { name: "Flag question" }).getAttribute("aria-pressed")).toBe("true");

    await user.click(optionA);
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    const confidence = screen.getByRole("button", { name: "Confidence 3 of 5" });
    expect(confidence.getAttribute("aria-pressed")).toBe("false");
    await user.click(confidence);
    expect(confidence.getAttribute("aria-pressed")).toBe("true");
  });

  it("persists the latest error classification and confidence when ArrowRight advances", async () => {
    setStore();
    const user = userEvent.setup();
    render(<ExamRunner mode="tutor" retakeIds={[question.id]} onClose={() => {}} />);

    await user.click(screen.getByRole("button", { name: "A. Alpha" }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    await user.selectOptions(screen.getByLabelText("Why did this go wrong?"), "knowledge-gap");
    fireEvent.keyDown(window, { key: "4" });
    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(mocked.recordQuestionAttempt).toHaveBeenCalledWith(question.id, expect.objectContaining({
      status: "incorrect",
      errorType: "knowledge-gap",
      confidence: 4,
    }));
  });

  it("renders a manually edited explanation verbatim in deferred results", async () => {
    const edited = "Answer choice B is wrong because receptor affinity alone does not determine signaling.";
    setStore();
    mocked.store = { ...mocked.store, questions: [{ ...question, explanation: edited }] };
    const user = userEvent.setup();
    render(<ExamRunner mode="exam" retakeIds={[question.id]} onClose={() => {}} />);

    await user.click(screen.getByRole("button", { name: "A. Alpha" }));
    await user.click(screen.getByRole("button", { name: "Submit & finish" }));

    expect(screen.getByText(edited).textContent).toBe(edited);
  });

  it("does not retake a missed question after its answer mapping is marked wrong", async () => {
    const transitioning = { ...question, id: "mapping-transition" };
    setStore();
    mocked.store = { ...mocked.store, questions: [transitioning] };
    mocked.updateQuestion.mockImplementationOnce((_id, patch) => Object.assign(transitioning, patch));
    const user = userEvent.setup();
    render(<ExamRunner mode="tutor" retakeIds={[transitioning.id]} onClose={() => {}} />);

    await user.click(screen.getByRole("button", { name: "A. Alpha" }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    await user.click(screen.getByRole("button", { name: /Answer wrong/ }));
    await user.click(screen.getByRole("button", { name: "Finish block" }));

    expect(transitioning.needsReview).toBe(true);
    expect(screen.getByRole("heading", { name: "Block results" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Retake .* missed/ })).toBeNull();
    expect(screen.getByText(/correct unresolved/)).toBeTruthy();
  });

  it("keeps persisted highlights visible when navigating away and back", async () => {
    const startOffset = question.stem.indexOf("option");
    const annotated = {
      ...question,
      annotations: [createTextAnnotation({
        id: "ann-nav", target: "stem", sourceText: question.stem, startOffset,
        endOffset: startOffset + "option".length, tone: "yellow",
        now: "2026-07-16T12:00:00.000Z",
      })],
    };
    const second = { ...question, id: "question-2", stem: "Which second option is correct?" };
    setStore();
    mocked.store = { ...mocked.store, questions: [annotated, second] };
    const user = userEvent.setup();
    render(<ExamRunner mode="tutor" retakeIds={[annotated.id, second.id]} onClose={() => {}} />);

    expect(screen.getByLabelText("Highlighted text: option")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "B. Beta" }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    await user.click(screen.getByRole("button", { name: "Next question" }));
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByLabelText("Highlighted text: option")).toBeTruthy();
  });
});

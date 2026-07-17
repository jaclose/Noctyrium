// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseQuestionBlocks } from "../../lib/questionParse";
import { useStore } from "../../lib/store";
import { ImportPanel } from "./ImportPanel";
import { importFromCsv } from "../../lib/questionImport";
import { questionMappingStatus } from "../../lib/questions";
import { parseImport, toPortableState } from "../../lib/backup";

vi.mock("../../lib/toast", () => ({ pushToast: vi.fn() }));
vi.mock("../../lib/ai", () => ({
  checkProviderHealth: vi.fn(async () => ({ ok: false, detail: "No provider" })),
  cleanExplanation: vi.fn(),
  enhanceQuestionSet: vi.fn(),
  generateQuestionDrafts: vi.fn(),
  loadAiSettings: vi.fn(() => ({ mode: "demo" })),
  mapAnswerFromText: vi.fn(),
  resolveActiveProvider: vi.fn(() => null),
}));

const original = {
  questions: useStore.getState().questions,
  questionSets: useStore.getState().questionSets,
  documents: useStore.getState().documents,
};

beforeEach(() => useStore.setState({ questions: [], questionSets: [], documents: [] }));
afterEach(() => {
  cleanup();
  useStore.setState(original);
});

describe("Import Center persistence invariant", () => {
  it("preserves B, D, A, C, E through ImportPanel and the real store", async () => {
    const user = userEvent.setup();
    const rawText = [
      "1. One?", "A. a1", "B. b1", "C. c1", "D. d1", "E. e1", "",
      "2. Two?", "A. a2", "B. b2", "C. c2", "D. d2", "E. e2", "",
      "3. Three?", "A. a3", "B. b3", "C. c3", "D. d3", "E. e3", "",
      "4. Four?", "A. a4", "B. b4", "C. c4", "D. d4", "E. e4", "",
      "5. Five?", "A. a5", "B. b5", "C. c5", "D. d5", "E. e5", "",
      "Answer key:", "1. B", "2. D", "3. A", "4. C", "5. E",
    ].join("\n");
    const drafts = parseQuestionBlocks(rawText);

    render(<ImportPanel seed={{
      drafts,
      rawText,
      title: "Mixed mapping invariant",
      fileName: "mixed.txt",
      fileType: "text",
    }} />);
    await user.click(screen.getByRole("button", { name: /^Save$/ }));

    const state = useStore.getState();
    const savedSet = state.questionSets.find((set) => set.title === "Mixed mapping invariant");
    expect(savedSet).toBeDefined();
    const keys = savedSet!.questionIds.map((id) => state.questions.find((question) => question.id === id)?.correctKey);
    expect(keys).toEqual(["B", "D", "A", "C", "E"]);
  });

  it("persists the raw explanation candidate beside cleaned prose and cleanup operations", async () => {
    const user = userEvent.setup();
    const rawText = [
      "1. Which option?", "A. Alpha", "B. Beta", "C. Gamma", "",
      "Answer key:", "1. B", "",
      "Explanations:",
      "1. Explanation: Beta follows from the finding.",
      "Learning Objective: Recognize the relevant finding.",
    ].join("\n");
    const drafts = parseQuestionBlocks(rawText);

    render(<ImportPanel seed={{ drafts, rawText, title: "Explanation audit", fileName: "audit.txt", fileType: "text" }} />);
    await user.click(screen.getByRole("button", { name: /^Save$/ }));

    const saved = useStore.getState().questions.find((question) => question.bank === "Explanation audit");
    expect(saved?.explanation).toBe("Beta follows from the finding.");
    expect(saved?.extraction?.explanationRawCandidate).toContain("Explanation:");
    expect(saved?.extraction?.explanationRawCandidate).toContain("Learning Objective:");
    expect(saved?.extraction?.explanationCleanupOperations).toEqual(expect.arrayContaining([
      "remove-explanation-label",
      "remove-objective-metadata",
    ]));
    expect(saved?.extraction?.explanationSourceSnippet).toContain("Explanation:");
    expect(saved?.extraction?.explanationDetectionConfidence).toBeGreaterThanOrEqual(0.9);
  });

  it("persists a structured drift candidate as non-runnable until the user confirms it", async () => {
    const user = userEvent.setup();
    const rawText = [
      "question,a,b,c,answer",
      '"Which cell releases histamine?","Mast cells","CD4+ T lymphocytes","B lymphocytes","A. Mast cell"',
    ].join("\n");
    const drafts = importFromCsv(rawText).drafts;
    render(<ImportPanel seed={{ drafts, rawText, title: "Structured trust", fileName: "trust.csv", fileType: "csv" }} />);
    await user.click(screen.getByRole("button", { name: /^Save$/ }));

    const candidate = useStore.getState().questions.find((question) => question.bank === "Structured trust");
    expect(candidate?.correctKey).toBe("A");
    expect(candidate?.needsReview).toBe(true);
    expect(candidate && questionMappingStatus(candidate)).not.toBe("ready");
    expect(candidate?.extraction?.parserRuleIds).toContain("answer.explicit-letter-text-drift");

    useStore.getState().updateQuestion(candidate!.id, {
      needsReview: false,
      extraction: {
        ...candidate!.extraction!,
        reviewed: true,
        reviewedAt: "2026-07-17T00:00:00.000Z",
        parserRuleIds: [...new Set([...(candidate!.extraction?.parserRuleIds ?? []), "answer.user-reviewed-mapping"])],
      },
    });
    const confirmed = useStore.getState().questions.find((question) => question.id === candidate!.id);
    expect(confirmed && questionMappingStatus(confirmed)).toBe("ready");
    expect(confirmed?.correctKey).toBe("A");

    const restored = parseImport(JSON.stringify({
      _app: "AXOM",
      ...toPortableState(useStore.getState()),
    }));
    const reloaded = restored.questions.find((question) => question.id === candidate!.id);
    expect(reloaded).toMatchObject({
      correctKey: "A",
      needsReview: false,
      extraction: {
        reviewed: true,
        reviewedAt: "2026-07-17T00:00:00.000Z",
      },
    });
    expect(reloaded?.extraction?.parserRuleIds).toContain("answer.user-reviewed-mapping");
    expect(questionMappingStatus(reloaded!)).toBe("ready");
  });
});

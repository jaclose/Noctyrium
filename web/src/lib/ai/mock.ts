// ===========================================================================
// Demo/mock provider (directive §7C) — development only. Deterministic,
// clearly labeled output. Every string it produces carries a "Demo" marker so
// mock data can never masquerade as real analysis.
// ===========================================================================
import type { AIProvider, AiJsonRequest } from "./types";

export const MOCK_LABEL = "Demo (mock output — not real analysis)";

export function createMockProvider(): AIProvider {
  return {
    info: { kind: "mock", label: MOCK_LABEL, local: true, requiresKey: false },
    available: async () => ({ ok: true, detail: "Demo mode active — responses are canned examples.", models: ["demo"] }),
    async completeJson(req: AiJsonRequest): Promise<unknown> {
      // Deterministic: keyed off the prompt so tests are stable.
      if (/card/i.test(req.prompt)) {
        return {
          cards: [
            {
              type: "basic",
              front: "[DEMO] What activates the classical complement pathway?",
              back: "[DEMO] Antigen-antibody complexes (IgM or IgG).",
              tags: ["demo"],
              source: "Demo output — replace with a real provider",
            },
            {
              type: "cloze",
              front: "[DEMO] C3b's main role is {{c1::opsonization}}.",
              back: "",
              tags: ["demo"],
              source: "Demo output — replace with a real provider",
            },
          ],
        };
      }
      if (/error|classif/i.test(req.prompt)) {
        return { errorType: "knowledge-gap", rationale: "[DEMO] Canned classification for development.", confidence: 0.5 };
      }
      if (/questions/i.test(req.system ?? "") && /topic/i.test(req.prompt)) {
        return {
          questions: [{
            stem: "[DEMO] A 34-year-old presents with recurrent Neisseria infections. Which complement component is most likely deficient?",
            options: [
              { key: "A", text: "C3" }, { key: "B", text: "C5-C9" },
              { key: "C", text: "C1 esterase inhibitor" }, { key: "D", text: "Factor H" },
            ],
            correctKey: "B",
            explanation: "[DEMO] Terminal complement (MAC) deficiency classically predisposes to recurrent Neisseria infections.",
            whyOthersWrong: "[DEMO] C3 deficiency causes pyogenic infections; C1-INH deficiency causes angioedema.",
            tags: ["demo", "immunology"],
            estimatedDifficulty: "medium",
          }],
        };
      }
      if (/\{"text"/.test(req.system ?? "")) {
        return { text: "[DEMO] Canned explanation for development — connect a real provider for actual analysis." };
      }
      return {
        mode: "maintain",
        rationale: "[DEMO] Canned brief for development — not real analysis.",
        nextBestMove: { title: "[DEMO] Review a flagged lecture", reason: "Demo output", estimatedMinutes: 45 },
        minimumViableWin: { title: "[DEMO] Review 8 due cards", estimatedMinutes: 5 },
        recommendedDuration: 45,
        priorityLevel: "medium",
        recoveryActions: [],
        warnings: ["This is demo output."],
        confidence: 0.5,
        assumptions: ["Demo mode is active."],
      };
    },
  };
}

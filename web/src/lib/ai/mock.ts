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

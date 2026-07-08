// ===========================================================================
// Provider resolution + feature helpers. resolveActiveProvider() is the ONLY
// entry point UI code should use: it maps the user's AI settings to a concrete
// provider (or null when AI is off/unavailable) so no feature ever claims AI
// is active without a reachable provider behind it.
// ===========================================================================
import type { AIProvider, CardGenerationStyle, GeneratedCardDraft } from "./types";
import { loadAiSettings, type AiSettings } from "./settings";
import { createOllamaProvider, detectOllama } from "./ollama";
import { createMockProvider } from "./mock";
import { validateGeneratedCards } from "./schemas";

export { detectOllama } from "./ollama";
export { loadAiSettings, saveAiSettings, DEFAULT_AI_SETTINGS } from "./settings";
export type { AiSettings } from "./settings";
export * from "./types";
export { validateAiBrief, validateGeneratedCards, validateGeneratedQuestions } from "./schemas";

/**
 * Resolve the configured provider without a network probe. Returns null when
 * AI is off or misconfigured — callers must treat null as "feature hidden".
 */
export function resolveActiveProvider(settings: AiSettings = loadAiSettings()): AIProvider | null {
  if (settings.mode === "mock") return createMockProvider();
  if (settings.mode === "local" && settings.localModel) {
    return createOllamaProvider(settings.localEndpoint, settings.localModel);
  }
  // Cloud mode intentionally resolves to null until a secure proxy exists —
  // there is no client-side key path by design (directive §7B).
  return null;
}

/** Probe the configured provider; used by settings UI and feature gates. */
export async function checkProviderHealth(settings: AiSettings = loadAiSettings()) {
  if (settings.mode === "off") return { ok: false, detail: "AI is turned off." };
  if (settings.mode === "cloud") {
    return { ok: false, detail: "Cloud AI needs the secure server proxy (not yet available). Local Ollama works today without any key." };
  }
  if (settings.mode === "mock") return { ok: true, detail: "Demo mode — canned outputs, clearly labeled." };
  return detectOllama(settings.localEndpoint);
}

const CARD_PROMPT_VERSION = "cardgen-v1";

const STYLE_HINT: Record<CardGenerationStyle, string> = {
  concise: "Prefer short basic cards, one fact each.",
  detailed: "Include an extra field with mechanism context on each card.",
  "cloze-heavy": "Prefer cloze deletions ({{c1::...}}) for discrete facts.",
  "clinical-vignette-heavy": "Prefer short clinical vignettes asking for diagnosis or next step.",
  "exam-style": "Mirror board-exam phrasing; include 'why-not-others' cards where useful.",
  "mechanism-focused": "Prefer mechanism-chain cards (A → B → C).",
  "image-labeling": "Create image-occlusion placeholder cards describing the structure to label.",
};

/**
 * Generate a SMALL reviewed batch of card drafts (directive §11: quality over
 * volume, small batch first, user review before save).
 */
export async function generateCardDrafts(
  provider: AIProvider,
  req: { material: string; topic?: string; style: CardGenerationStyle; maxCards: number; source?: string },
): Promise<{ drafts: GeneratedCardDraft[]; warnings: string[]; promptVersion: string }> {
  const max = Math.min(req.maxCards, 12);
  const raw = await provider.completeJson({
    system: [
      "You create high-quality active-recall flashcards for a medical student.",
      "Rules: one testable idea per card; no vague trivia; no copied long passages;",
      "clinically useful phrasing; include a source string on every card;",
      "cloze cards must use {{c1::...}} syntax. Quality over volume — fewer, better cards.",
      `Return JSON: {"cards":[{"type","front","back","extra?","tags":[],"source"}]}. Max ${max} cards.`,
    ].join(" "),
    prompt: [
      req.topic ? `Topic: ${req.topic}` : "",
      req.source ? `Source: ${req.source}` : "",
      `Style: ${STYLE_HINT[req.style]}`,
      "Material:",
      req.material.slice(0, 8000),
    ].filter(Boolean).join("\n"),
    maxTokens: 2000,
  });
  const result = validateGeneratedCards(raw);
  if (!result.ok || !result.value) {
    throw new Error(`The model's card output failed validation: ${result.errors.join(" ")}`);
  }
  return { drafts: result.value.slice(0, max), warnings: result.errors, promptVersion: CARD_PROMPT_VERSION };
}

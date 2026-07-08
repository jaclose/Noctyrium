// ===========================================================================
// Provider resolution + feature helpers. resolveActiveProvider() is the ONLY
// entry point UI code should use: it maps the user's AI settings to a concrete
// provider (or null when AI is off/unavailable) so no feature ever claims AI
// is active without a reachable provider behind it.
// ===========================================================================
import type { AIProvider, CardGenerationStyle, GeneratedCardDraft, GeneratedQuestionDraft } from "./types";
import { loadAiSettings, type AiSettings } from "./settings";
import { createOllamaProvider, detectOllama } from "./ollama";
import { createMockProvider } from "./mock";
import { validateGeneratedCards, validateGeneratedQuestions } from "./schemas";

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

// --- question-level AI actions (pre-beta §9) -----------------------------------
// All plain-text answers come back as {"text": "..."} so completeJson stays the
// single transport; callers render the text, never auto-save it.

const QUESTION_PROMPT_VERSION = "questiongen-v1";

async function completeText(provider: AIProvider, system: string, prompt: string): Promise<string> {
  const raw = await provider.completeJson({
    system: `${system} Return JSON: {"text": "your answer"}. Keep it under 120 words.`,
    prompt,
    maxTokens: 500,
  });
  const text = typeof raw === "object" && raw !== null && typeof (raw as { text?: unknown }).text === "string"
    ? (raw as { text: string }).text.trim()
    : "";
  if (!text) throw new Error("The model returned an empty answer.");
  return text;
}

export function explainSimply(provider: AIProvider, q: { stem: string; correct?: string; explanation?: string }): Promise<string> {
  return completeText(
    provider,
    "You explain exam questions to a tired medical student in plain language, mechanism first.",
    `Question: ${q.stem.slice(0, 2000)}\nCorrect answer: ${q.correct ?? "unknown"}\nExisting explanation: ${q.explanation?.slice(0, 1500) ?? "none"}\nExplain simply why the correct answer is right.`,
  );
}

export function explainWhyWrong(provider: AIProvider, q: { stem: string; picked: string; correct?: string }): Promise<string> {
  return completeText(
    provider,
    "You explain, without judgment, why a chosen exam answer is wrong and what clue distinguishes the right one.",
    `Question: ${q.stem.slice(0, 2000)}\nStudent picked: ${q.picked}\nCorrect answer: ${q.correct ?? "unknown"}\nWhy was the pick wrong, and what's the discriminating clue?`,
  );
}

export function memoryHook(provider: AIProvider, q: { stem: string; correct?: string }): Promise<string> {
  return completeText(
    provider,
    "You create one short, vivid, accurate memory hook (mnemonic, analogy, or contrast) for a medical fact.",
    `Fact to anchor — question: ${q.stem.slice(0, 1500)}\nCorrect answer: ${q.correct ?? "unknown"}\nGive one memory hook.`,
  );
}

/**
 * Generate NEW practice questions behind the review gate (§5C). Output is
 * schema-validated, capped, labeled AI-generated by the caller, and never
 * saved without explicit user approval.
 */
export async function generateQuestionDrafts(
  provider: AIProvider,
  req: {
    topic: string;
    category?: string;
    examStyle?: string;
    difficulty: "easy" | "medium" | "hard";
    count: number;
    reference?: string;
  },
): Promise<{ drafts: GeneratedQuestionDraft[]; warnings: string[]; promptVersion: string }> {
  const count = Math.min(Math.max(1, req.count), 10);
  const raw = await provider.completeJson({
    system: [
      "You write ORIGINAL board-style practice questions for a medical student.",
      "Never reproduce copyrighted question-bank content. One best answer, 4-5 options,",
      "plausible distractors, and a real explanation including why the wrong options are wrong.",
      `Return JSON: {"questions":[{"stem","options":[{"key","text"}],"correctKey","explanation","whyOthersWrong?","tags":[],"estimatedDifficulty"}]}. Exactly ${count} questions.`,
    ].join(" "),
    prompt: [
      `Topic: ${req.topic}`,
      req.category ? `Category: ${req.category}` : "",
      req.examStyle ? `Style: ${req.examStyle}` : "",
      `Difficulty: ${req.difficulty}`,
      req.reference ? `Reference material (base questions on this):\n${req.reference.slice(0, 6000)}` : "",
    ].filter(Boolean).join("\n"),
    maxTokens: 2500,
  });
  const result = validateGeneratedQuestions(raw);
  if (!result.ok || !result.value) {
    throw new Error(`The model's question output failed validation: ${result.errors.join(" ")}`);
  }
  return { drafts: result.value.slice(0, count), warnings: result.errors, promptVersion: QUESTION_PROMPT_VERSION };
}

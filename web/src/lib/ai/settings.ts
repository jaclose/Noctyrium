// ===========================================================================
// AI settings — persisted OUTSIDE the vault/backup (localStorage) because they
// are device-specific (an Ollama endpoint on this machine means nothing on
// another). API keys are NEVER stored here or anywhere client-side: cloud BYOK
// stays a labeled, disabled configuration surface until a secure server proxy
// exists (directive §7B).
// ===========================================================================
import { STORAGE_KEYS } from "../brand";
import type { AiMode } from "./types";

export type CloudProviderId = "openai" | "anthropic" | "gemini" | "deepseek" | "openai-compat";

export interface AiSettings {
  mode: AiMode;
  /** Local (Ollama-compatible) endpoint. */
  localEndpoint: string;
  /** Selected local model name (must exist on the endpoint). */
  localModel?: string;
  /** Cloud preference — configuration only; calls require the future proxy. */
  cloudProvider?: CloudProviderId;
  /** Future server proxy base URL. Cloud calls stay disabled while unset. */
  cloudProxyUrl?: string;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  mode: "off",
  localEndpoint: "http://localhost:11434",
};

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.aiSettings);
    if (!raw) return { ...DEFAULT_AI_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    return {
      mode: (["off", "local", "cloud", "mock"] as AiMode[]).includes(parsed.mode as AiMode) ? parsed.mode as AiMode : "off",
      localEndpoint: typeof parsed.localEndpoint === "string" && parsed.localEndpoint.trim()
        ? parsed.localEndpoint.trim().replace(/\/$/, "")
        : DEFAULT_AI_SETTINGS.localEndpoint,
      localModel: typeof parsed.localModel === "string" && parsed.localModel.trim() ? parsed.localModel.trim() : undefined,
      cloudProvider: parsed.cloudProvider,
      cloudProxyUrl: typeof parsed.cloudProxyUrl === "string" && parsed.cloudProxyUrl.trim() ? parsed.cloudProxyUrl.trim() : undefined,
    };
  } catch {
    return { ...DEFAULT_AI_SETTINGS };
  }
}

export function saveAiSettings(settings: AiSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.aiSettings, JSON.stringify(settings));
  } catch {
    /* storage unavailable — settings stay in memory for this session */
  }
}

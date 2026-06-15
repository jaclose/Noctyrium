import type { AiFeature, AiRequest, AiResponse } from "../types/ai";

export async function runAi(feature: AiFeature, input: AiRequest) {
  if (isLocalOnlyRuntime()) {
    throw new Error("AI endpoints require the hosted Vercel app; local fallback is active.");
  }
  const res = await fetch(`/api/ai/${feature}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.message === "string" ? data.message : "AI request failed.");
  }
  return data as AiResponse;
}

function isLocalOnlyRuntime() {
  if (typeof window === "undefined") return false;
  if (window.location.protocol === "file:") return true;
  const localHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return localHost && ["5173", "4173"].includes(window.location.port);
}

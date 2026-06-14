import type { AiFeature, AiRequest, AiResponse } from "../types/ai";

export async function runAi(feature: AiFeature, input: AiRequest) {
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

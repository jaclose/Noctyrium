import { describe, expect, it, vi } from "vitest";
import { detectOllama, createOllamaProvider } from "./ollama";
import { createMockProvider } from "./mock";
import { validateAiBrief, validateGeneratedCards, validateGeneratedQuestions } from "./schemas";
import { resolveActiveProvider } from "./index";
import { DEFAULT_AI_SETTINGS } from "./settings";

function fetchReturning(status: number, body: unknown): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}

describe("local AI provider detection", () => {
  it("detects a running Ollama with models", async () => {
    const result = await detectOllama("http://localhost:11434", fetchReturning(200, {
      models: [{ name: "llama3.2" }, { name: "qwen2.5:14b" }],
    }));
    expect(result.ok).toBe(true);
    expect(result.models).toEqual(["llama3.2", "qwen2.5:14b"]);
  });

  it("reports a running Ollama with no models as not usable, with pull guidance", async () => {
    const result = await detectOllama("http://localhost:11434", fetchReturning(200, { models: [] }));
    expect(result.ok).toBe(false);
    expect(result.detail).toMatch(/ollama pull/i);
  });

  it("reports unreachable endpoints calmly with setup instructions", async () => {
    const failing = vi.fn(async () => { throw new Error("ECONNREFUSED"); }) as unknown as typeof fetch;
    const result = await detectOllama("http://localhost:11434", failing);
    expect(result.ok).toBe(false);
    expect(result.detail).toMatch(/not reachable/i);
  });

  it("completeJson parses model JSON and rejects non-JSON output loudly", async () => {
    const good = createOllamaProvider("http://x", "m", fetchReturning(200, { message: { content: "{\"a\":1}" } }));
    await expect(good.completeJson({ prompt: "p" })).resolves.toEqual({ a: 1 });

    const bad = createOllamaProvider("http://x", "m", fetchReturning(200, { message: { content: "not json" } }));
    await expect(bad.completeJson({ prompt: "p" })).rejects.toThrow(/non-JSON/i);
  });
});

describe("provider resolution honesty", () => {
  it("resolves null when AI is off — features must hide, not fake", () => {
    expect(resolveActiveProvider({ ...DEFAULT_AI_SETTINGS, mode: "off" })).toBeNull();
  });

  it("resolves null for local mode without a chosen model", () => {
    expect(resolveActiveProvider({ ...DEFAULT_AI_SETTINGS, mode: "local" })).toBeNull();
  });

  it("resolves null for cloud mode — no client-side key path exists", () => {
    expect(resolveActiveProvider({ ...DEFAULT_AI_SETTINGS, mode: "cloud", cloudProvider: "anthropic" })).toBeNull();
  });

  it("mock provider is unmistakably labeled as demo output", async () => {
    const mock = createMockProvider();
    expect(mock.info.label).toMatch(/demo|mock/i);
    const out = await mock.completeJson({ prompt: "generate cards" }) as { cards: Array<{ front: string }> };
    expect(out.cards[0].front).toContain("[DEMO]");
  });
});

describe("structured output validation", () => {
  it("accepts a well-formed brief proposal and clamps numbers", () => {
    const result = validateAiBrief({
      mode: "sprint", rationale: "r",
      nextBestMove: { title: "Do X", reason: "because", estimatedMinutes: 9999 },
      minimumViableWin: { title: "Small", estimatedMinutes: 5 },
      confidence: 3,
    });
    expect(result.ok).toBe(true);
    expect(result.value?.nextBestMove.estimatedMinutes).toBe(240);
    expect(result.value?.confidence).toBe(1);
  });

  it("rejects a brief with an unknown mode or missing move", () => {
    expect(validateAiBrief({ mode: "panic", nextBestMove: { title: "x" }, minimumViableWin: { title: "y" } }).ok).toBe(false);
    expect(validateAiBrief({ mode: "maintain", minimumViableWin: { title: "y" } }).ok).toBe(false);
  });

  it("filters invalid cards but keeps valid ones, reporting what was dropped", () => {
    const result = validateGeneratedCards({
      cards: [
        { type: "basic", front: "Good card?", back: "Yes." },
        { type: "cloze", front: "claims cloze but has none", back: "" },
        { front: "", back: "no front" },
      ],
    });
    expect(result.ok).toBe(true);
    expect(result.value).toHaveLength(1);
    expect(result.errors.length).toBe(2);
  });

  it("rejects generated questions without an explanation — unexplained answers aren't studyable", () => {
    const result = validateGeneratedQuestions({
      questions: [{
        stem: "s", correctKey: "A",
        options: [{ key: "A", text: "1" }, { key: "B", text: "2" }, { key: "C", text: "3" }],
      }],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/explanation/i);
  });
});

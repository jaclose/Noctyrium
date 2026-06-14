export type AiFeature =
  | "next-move"
  | "anki-generator"
  | "step-planner"
  | "weak-area-analysis"
  | "daily-report";

export interface AiRequest {
  userId?: string;
  context?: Record<string, unknown>;
  notes?: string;
  cardType?: "Basic" | "Cloze" | "Custom";
  tags?: string[];
}

export interface AiResponse {
  provider: string;
  feature: AiFeature;
  result: Record<string, unknown>;
  safetyNote: string;
}

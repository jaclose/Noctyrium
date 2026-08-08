import type { Course, TrackerItem, TrackerKind } from "./types";

export type StudyMethodId = "lecture-passes" | "practice-questions" | "anki" | "quizlet" | "noji" | "remnote" | "notes" | "teach-aloud" | "recall" | "external-resource" | "custom";
export type PracticeTiming = "before" | "after-first-pass" | "after-learning" | "near-exam" | "ongoing";
export interface StudyMethodPreference { id: StudyMethodId; enabled: boolean; label?: string; timing?: PracticeTiming; }
export interface StudyPlanSettings { methods?: StudyMethodPreference[]; lecturePasses?: number; reviewAfterDays?: number; customContext?: string; }
export interface StudyWorkflowPreferences extends StudyPlanSettings { configured: boolean; itemKindDefaults?: Partial<Record<TrackerKind, StudyPlanSettings>>; }
export interface EffectiveStudyPlan { methods: StudyMethodPreference[]; lecturePasses: number; reviewAfterDays: number; customContext?: string; sources: string[]; }

export const DEFAULT_STUDY_WORKFLOW: StudyWorkflowPreferences = {
  configured: false,
  methods: [
    { id: "lecture-passes", enabled: true },
    { id: "practice-questions", enabled: true, timing: "after-learning" },
  ],
  lecturePasses: 2,
  reviewAfterDays: 3,
};

export function normalizeStudyWorkflow(value: unknown): StudyWorkflowPreferences {
  const source = record(value);
  return {
    configured: source.configured === true,
    ...normalizeSettings(source),
    itemKindDefaults: record(source.itemKindDefaults) as StudyWorkflowPreferences["itemKindDefaults"],
  };
}

export function resolveStudyPlan(profile: StudyWorkflowPreferences | undefined, course: Course | undefined, item: TrackerItem): EffectiveStudyPlan {
  const layers: Array<[string, StudyPlanSettings | undefined]> = [
    ["learner defaults", profile ?? DEFAULT_STUDY_WORKFLOW],
    ["course override", course?.studyPlanOverride],
    ["item-kind default", profile?.itemKindDefaults?.[item.kind]],
    ["item override", item.studyPlanOverride],
  ];
  let plan: StudyPlanSettings = {};
  const sources: string[] = [];
  for (const [name, layer] of layers) {
    if (!layer) continue;
    plan = mergePlan(plan, layer);
    sources.push(name);
  }
  return {
    methods: plan.methods ?? DEFAULT_STUDY_WORKFLOW.methods!,
    lecturePasses: clamp(plan.lecturePasses, 1, 6, 2),
    reviewAfterDays: clamp(plan.reviewAfterDays, 1, 14, 3),
    customContext: plan.customContext,
    sources,
  };
}

function mergePlan(base: StudyPlanSettings, next: StudyPlanSettings): StudyPlanSettings {
  const methods = new Map((base.methods ?? []).map((method) => [method.id, method]));
  for (const method of next.methods ?? []) methods.set(method.id, { ...methods.get(method.id), ...method });
  return { ...base, ...next, methods: [...methods.values()] };
}
function clamp(value: unknown, min: number, max: number, fallback: number) { return typeof value === "number" && Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : fallback; }
function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function normalizeSettings(source: Record<string, unknown>): StudyPlanSettings {
  const valid = new Set<StudyMethodId>(["lecture-passes", "practice-questions", "anki", "quizlet", "noji", "remnote", "notes", "teach-aloud", "recall", "external-resource", "custom"]);
  const methods = Array.isArray(source.methods) ? source.methods.flatMap((candidate) => { const item = record(candidate); return valid.has(item.id as StudyMethodId) ? [{ id: item.id as StudyMethodId, enabled: item.enabled !== false, label: typeof item.label === "string" ? item.label.slice(0, 80) : undefined, timing: typeof item.timing === "string" ? item.timing as PracticeTiming : undefined }] : []; }) : undefined;
  return { methods, lecturePasses: clamp(source.lecturePasses, 1, 6, 2), reviewAfterDays: clamp(source.reviewAfterDays, 1, 14, 3), customContext: typeof source.customContext === "string" ? source.customContext.slice(0, 500) : undefined };
}

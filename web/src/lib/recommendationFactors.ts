import type { Course, TrackerItem } from "./types";
import { resolveStudyPlan, type StudyWorkflowPreferences } from "./studyPreferences";
import { isCompletionKind, isQuestionKind, passStage, PASS_COLOR, targetPassesForItem, type Suggestion } from "./tracker";

export interface RecommendationFactor { id: string; label: string; value: number; }
export interface RankedTrackerItem { item: TrackerItem; score: number; factors: RecommendationFactor[]; reason: string; }
export function rankTrackerItems(items: TrackerItem[], options: { preferences?: StudyWorkflowPreferences; courses?: Course[]; now?: Date } = {}): RankedTrackerItem[] {
  const now = options.now ?? new Date();
  return items.flatMap((item) => {
    const target = targetPassesForItem(item);
    if (item.passes >= target) return [];
    const course = options.courses?.find((candidate) => item.path.toLowerCase().includes(candidate.code.toLowerCase()) || item.path.toLowerCase().includes(candidate.name.toLowerCase()));
    const plan = resolveStudyPlan(options.preferences, course, item);
    const ageDays = Math.max(0, (now.getTime() - Date.parse(item.updated)) / 86400000);
    const factors: RecommendationFactor[] = [];
    add(factors, "completion", "Unfinished work", Math.min(24, (target - item.passes) * 6));
    add(factors, "first-exposure", "Not started yet", item.passes === 0 ? 30 : 0);
    add(factors, "yield", item.yield === "high" ? "High-yield" : item.yield === "review" ? "Marked for review" : "", item.yield === "high" ? 18 : item.yield === "review" ? 22 : item.yield === "low" ? -8 : 0);
    const stale = item.passes === 1 && ageDays >= plan.reviewAfterDays ? Math.min(24, 12 + (ageDays - plan.reviewAfterDays) * 3) : 0;
    add(factors, "stale-review", `Second review due after ${plan.reviewAfterDays} days`, stale);
    add(factors, "weak-evidence", "Notes indicate difficulty", item.note && /miss|weak|again|wrong|confus|unclear|hard/i.test(item.note) ? 12 : 0);
    const questionsEnabled = plan.methods.some((method) => method.id === "practice-questions" && method.enabled);
    add(factors, "learner-plan", "Matches your study workflow", isQuestionKind(item.kind) && questionsEnabled ? 8 : 0);
    add(factors, "recency", "Recently updated", ageDays < 1 && item.passes > 0 ? -6 : 0);
    const score = factors.reduce((sum, factor) => sum + factor.value, 0);
    return [{ item, score, factors, reason: factors.filter((factor) => factor.value > 0).sort((a, b) => b.value - a.value).slice(0, 3).map((factor) => factor.label).join(" · ") }];
  }).sort((a, b) => b.score - a.score || a.item.updated.localeCompare(b.item.updated) || a.item.id.localeCompare(b.item.id));
}
export function personalizedSuggestions(items: TrackerItem[], n = 3, options: { preferences?: StudyWorkflowPreferences; courses?: Course[]; now?: Date } = {}): Suggestion[] {
  if (!items.length) return [{ title: "Import the first tracker items", reason: "Add course work so AXOM can recommend a useful first move.", color: PASS_COLOR.untouched }];
  const ranked = rankTrackerItems(items, options);
  if (!ranked.length) return [{ title: "This scope is complete", reason: "Every item has reached its current study-plan target.", color: PASS_COLOR.mastered }];
  return ranked.slice(0, n).map(({ item, reason }) => ({ title: moveTitle(item), reason, color: PASS_COLOR[passStage(item.passes)], itemId: item.id }));
}
function add(list: RecommendationFactor[], id: string, label: string, value: number) { if (value && label) list.push({ id, label, value }); }
function moveTitle(item: TrackerItem) { if (isCompletionKind(item.kind)) return `${item.passes ? "Verify" : "Complete"}: ${item.label}`; if (!item.passes) return `Start: ${item.label}`; if (isQuestionKind(item.kind)) return `${item.kind} #${Math.min(item.passes + 1, 3)}: ${item.label}`; return `Review: ${item.label}`; }

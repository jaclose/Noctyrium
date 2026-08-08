import type { Course, TrackerItem } from "./types";
import { resolveStudyPlan, type StudyWorkflowPreferences } from "./studyPreferences";
import { isCompletionKind, isQuestionKind, passStage, PASS_COLOR, targetPassesForItem, type Suggestion } from "./tracker";

export interface RecommendationFactor { id: string; label: string; value: number; }
export interface RankedTrackerItem { item: TrackerItem; score: number; factors: RecommendationFactor[]; reason: string; }
export function rankTrackerItems(items: TrackerItem[], options: { preferences?: StudyWorkflowPreferences; courses?: Course[]; now?: Date } = {}): RankedTrackerItem[] {
  const now = options.now ?? new Date();
  return items.flatMap((item) => {
    if (item.recommendationSnoozedUntil && Date.parse(item.recommendationSnoozedUntil) > now.getTime()) return [];
    const course = options.courses?.find((candidate) => item.path.toLowerCase().includes(candidate.code.toLowerCase()) || item.path.toLowerCase().includes(candidate.name.toLowerCase()));
    const plan = resolveStudyPlan(options.preferences, course, item);
    const target = !isQuestionKind(item.kind) && !isCompletionKind(item.kind) ? plan.lecturePasses : targetPassesForItem(item);
    if (item.passes >= target) return [];
    const ageDays = Math.max(0, (now.getTime() - Date.parse(item.updated)) / 86400000);
    const factors: RecommendationFactor[] = [];
    add(factors, "completion", "Unfinished work", Math.min(24, (target - item.passes) * 6));
    add(factors, "first-exposure", "Not started yet", item.passes === 0 ? 30 : 0);
    add(factors, "yield", item.yield === "high" ? "High-yield" : item.yield === "review" ? "Marked for review" : "", item.yield === "high" ? 18 : item.yield === "review" ? 22 : item.yield === "low" ? -8 : 0);
    const reviewRamp = item.passes === 1 ? Math.max(0, Math.min(24, 6 + (ageDays - plan.reviewAfterDays) * 4)) : 0;
    add(factors, "review-urgency", ageDays >= plan.reviewAfterDays ? `Review overdue after ${plan.reviewAfterDays} days` : "Review window approaching", reviewRamp);
    const difficulty = item.difficulty === "very-hard" ? 14 : item.difficulty === "hard" ? 10 : item.difficulty === "moderate" ? 4 : item.difficulty === "easy" ? -3 : 0;
    add(factors, "difficulty", item.difficulty ? `Marked ${item.difficulty.replace("-", " ")}` : "", difficulty);
    const daysToAssessment = item.assessmentDate ? Math.ceil((Date.parse(`${item.assessmentDate}T12:00:00`) - now.getTime()) / 86400000) : null;
    const assessment = daysToAssessment !== null && daysToAssessment >= 0 ? Math.min(24, Math.max(0, 18 - daysToAssessment)) * (item.yield === "low" ? 0.4 : 1) : 0;
    add(factors, "assessment-urgency", daysToAssessment === 0 ? "Assessment today" : daysToAssessment === 1 ? "Assessment tomorrow" : daysToAssessment !== null && daysToAssessment >= 0 ? `Assessment in ${daysToAssessment} days` : "", assessment);
    add(factors, "weak-evidence", "Notes indicate difficulty", item.note && /miss|weak|again|wrong|confus|unclear|hard/i.test(item.note) ? 12 : 0);
    const questionsEnabled = plan.methods.some((method) => method.id === "practice-questions" && method.enabled);
    add(factors, "learner-plan", "Matches your study workflow", isQuestionKind(item.kind) && questionsEnabled ? 8 : 0);
    add(factors, "explicit-priority", "Learner-set priority", item.explicitPriority ? Math.min(16, item.explicitPriority * 3) : 0);
    add(factors, "item-type", "Practice work", isQuestionKind(item.kind) ? 4 : 0);
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

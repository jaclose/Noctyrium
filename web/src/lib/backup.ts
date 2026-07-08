// ===========================================================================
// JSON export / import. The portable backup story for the browser-stored data.
// ===========================================================================
import type { NoctyriumState } from "./types";
import { APP_VERSION_LABEL, DEFAULT_DASHBOARD_WIDGETS, DEFAULT_HIDDEN_DASHBOARD_WIDGETS, SCHEMA_VERSION } from "./seed";
import { BRAND, STORAGE_KEYS } from "./brand";
import { userIdFromName } from "./userIdentity";
import { DEFAULT_FOCUS_IDS, focusOption, normalizedFocusIds } from "./experience";
import { resolveTrack } from "./tracks";

const DATA_KEYS = [
  "profile", "terms", "courses", "tracker", "productivityTrackers", "resources", "tasks", "journal",
  "premedExperiences", "prompts", "folders", "logs", "integrations", "boardPrep", "blueprintInstalls", "dayPlans", "activeDayKey", "schemaVersion",
  "lastActiveLocalDate", "lastTimezoneOffset", "dailyArchives", "dailyRolloverEvents", "energyFactors", "habits", "habitEntries",
  "sessions", "closeouts", "recoveryPlans", "questions", "quizSessions", "ankiCards", "cardReviews",
] as const;

export function toPortableState(state: NoctyriumState): NoctyriumState {
  const payload: Record<string, unknown> = {};
  const src = state as unknown as Record<string, unknown>;
  for (const k of DATA_KEYS) payload[k] = src[k];
  return payload as unknown as NoctyriumState;
}

export function exportState(state: NoctyriumState) {
  const payload: Record<string, unknown> = {
    _app: BRAND.productName,
    _exported: new Date().toISOString(),
    ...toPortableState(state),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${BRAND.productName.toLowerCase()}-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
  markBackupDone();
}

/** Record when the user last exported, for the data-health panel. */
export function markBackupDone(at: Date = new Date()) {
  try {
    localStorage.setItem(STORAGE_KEYS.lastBackupAt, at.toISOString());
  } catch { /* best effort */ }
}

export function lastBackupAt(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.lastBackupAt);
  } catch {
    return null;
  }
}

/**
 * Merge an imported backup into the current state instead of replacing it.
 * Record lists are unioned by id; when the same id exists on both sides the
 * one with the later updated/created timestamp wins. Profile and day-cursor
 * fields keep the CURRENT values — merge never silently changes who you are
 * or what day it is. Use replace (with explicit confirmation) for full restore.
 */
export function mergeStates(current: NoctyriumState, imported: NoctyriumState): NoctyriumState {
  const listKeys = [
    "terms", "courses", "tracker", "productivityTrackers", "resources", "tasks", "journal",
    "premedExperiences", "prompts", "folders", "logs", "boardPrep" /* handled below */, "blueprintInstalls",
    "dayPlans", "dailyArchives", "dailyRolloverEvents", "energyFactors", "habits", "habitEntries",
    "sessions", "closeouts", "recoveryPlans", "questions", "quizSessions", "ankiCards", "cardReviews",
  ] as const;

  const merged: Record<string, unknown> = { ...toPortableState(current) };
  const cur = current as unknown as Record<string, unknown>;
  const imp = imported as unknown as Record<string, unknown>;

  for (const key of listKeys) {
    if (key === "boardPrep") continue;
    const a = Array.isArray(cur[key]) ? cur[key] as Array<Record<string, unknown>> : [];
    const b = Array.isArray(imp[key]) ? imp[key] as Array<Record<string, unknown>> : [];
    merged[key] = mergeById(a, b, key === "dayPlans" ? "dayKey" : key === "dailyArchives" ? "date" : "id");
  }
  // boardPrep is a keyed map — imported lanes fill gaps, current lanes win ties by `updated`.
  const curPrep = (cur.boardPrep ?? {}) as Record<string, { updated?: string } | undefined>;
  const impPrep = (imp.boardPrep ?? {}) as Record<string, { updated?: string } | undefined>;
  const prep: Record<string, unknown> = { ...impPrep };
  for (const [lane, value] of Object.entries(curPrep)) {
    const other = impPrep[lane];
    prep[lane] = !other || String(value?.updated ?? "") >= String(other.updated ?? "") ? value : other;
  }
  merged.boardPrep = prep;
  return merged as unknown as NoctyriumState;
}

function mergeById(
  current: Array<Record<string, unknown>>,
  imported: Array<Record<string, unknown>>,
  idKey: string,
): Array<Record<string, unknown>> {
  const stamp = (r: Record<string, unknown>) =>
    String(r.updatedAt ?? r.updated ?? r.createdAt ?? r.created ?? "");
  const byId = new Map<string, Record<string, unknown>>();
  for (const record of imported) {
    const id = String(record[idKey] ?? "");
    if (id) byId.set(id, record);
  }
  for (const record of current) {
    const id = String(record[idKey] ?? "");
    if (!id) continue;
    const other = byId.get(id);
    byId.set(id, !other || stamp(record) >= stamp(other) ? record : other);
  }
  // Keep unkeyed records from both sides rather than dropping them.
  const unkeyed = [...current, ...imported].filter((r) => !String(r[idKey] ?? ""));
  return [...byId.values(), ...unkeyed];
}

export function parseImport(text: string): NoctyriumState {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object" || !Array.isArray(data.terms)) {
    throw new Error("This file doesn't look like an Axom backup.");
  }
  // accept the file even if schemaVersion is missing/older — fill the gaps
  const profile = data.profile && typeof data.profile === "object"
    ? data.profile as Record<string, unknown>
    : {};
  const name = String(profile.name ?? "");
  const focusSubscriptions = normalizedFocusIds(profile.focusSubscriptions);
  const activeFocusId = focusSubscriptions.includes(profile.activeFocusId as (typeof focusSubscriptions)[number])
    ? profile.activeFocusId as NoctyriumState["profile"]["activeFocusId"]
    : focusSubscriptions[0] ?? DEFAULT_FOCUS_IDS[0];
  const activeFocus = focusOption(activeFocusId);
  const educationTrack = resolveTrack(typeof profile.educationTrack === "string" ? profile.educationTrack : undefined).id;

  return {
    schemaVersion: data.schemaVersion ?? SCHEMA_VERSION,
    profile: {
      name,
      userId: typeof profile.userId === "string" && profile.userId.trim() ? profile.userId : userIdFromName(name),
      versionLabel: String(profile.versionLabel ?? APP_VERSION_LABEL),
      tagline: String(profile.tagline ?? "Designed for execution, not decoration."),
      avatarDataUrl: typeof profile.avatarDataUrl === "string" ? profile.avatarDataUrl : undefined,
      dailyCardTarget: typeof profile.dailyCardTarget === "number" ? profile.dailyCardTarget : 120,
      dailyMinuteTarget: typeof profile.dailyMinuteTarget === "number" ? profile.dailyMinuteTarget : 240,
      onboarded: typeof profile.onboarded === "boolean" ? profile.onboarded : true,
      tourDone: typeof profile.tourDone === "boolean" ? profile.tourDone : undefined,
      promise: normalizePromise(profile.promise),
      phase: typeof profile.phase === "string" ? profile.phase as NoctyriumState["profile"]["phase"] : activeFocus?.phase,
      educationTrack,
      showSguResources: typeof profile.showSguResources === "boolean"
        ? profile.showSguResources
        : educationTrack === "sgu",
      activeFocusId,
      focusSubscriptions,
      dashboardWidgetOrder: normalizeDashboardWidgetOrder(profile.dashboardWidgetOrder),
      hiddenDashboardWidgets: normalizeDashboardWidgetList(profile.hiddenDashboardWidgets),
      hiddenNav: normalizeHiddenNav(profile.hiddenNav, educationTrack),
      toolsCollapsed: typeof profile.toolsCollapsed === "boolean" ? profile.toolsCollapsed : undefined,
      prepCollapsed: typeof profile.prepCollapsed === "boolean" ? profile.prepCollapsed : undefined,
      journalReviewTime: normalizeJournalReviewTime(profile.journalReviewTime),
      // Preserve newer opt-in settings across export/import.
      taskAutofillDisabled: typeof profile.taskAutofillDisabled === "boolean" ? profile.taskAutofillDisabled : undefined,
      taskTemplates: Array.isArray(profile.taskTemplates) ? profile.taskTemplates as NoctyriumState["profile"]["taskTemplates"] : undefined,
      experimentalFlags: profile.experimentalFlags && typeof profile.experimentalFlags === "object"
        ? profile.experimentalFlags as NoctyriumState["profile"]["experimentalFlags"] : undefined,
      pomodoroCustom: profile.pomodoroCustom && typeof profile.pomodoroCustom === "object"
        ? profile.pomodoroCustom as NoctyriumState["profile"]["pomodoroCustom"] : undefined,
    },
    terms: data.terms ?? [],
    courses: data.courses ?? [],
    tracker: data.tracker ?? [],
    productivityTrackers: Array.isArray(data.productivityTrackers) ? data.productivityTrackers : [],
    resources: data.resources ?? [],
    tasks: data.tasks ?? [],
    journal: data.journal ?? [],
    premedExperiences: data.premedExperiences ?? [],
    prompts: data.prompts ?? [],
    folders: data.folders ?? [],
    logs: data.logs ?? [],
    integrations: data.integrations ?? [],
    boardPrep: {
      step1: defaultBoardPrep("MS2", "light", 18, 40),
      step2: defaultBoardPrep("MS3", "not-started", 14, 40),
      step3: defaultBoardPrep("Graduate / IMG", "not-started", 10, 30),
      shelf: defaultBoardPrep("MS3", "light", 10, 25),
      mcat: defaultBoardPrep("Pre-Med", "light", 12, 35),
      premed: defaultBoardPrep("Pre-Med", "not-started", 8, 15),
      ...(data.boardPrep ?? {}),
    },
    blueprintInstalls: Array.isArray(data.blueprintInstalls) ? data.blueprintInstalls : [],
    dayPlans: data.dayPlans ?? [],
    activeDayKey: typeof data.activeDayKey === "string" ? data.activeDayKey : new Date().toISOString().slice(0, 10),
    lastActiveLocalDate: typeof data.lastActiveLocalDate === "string" ? data.lastActiveLocalDate : (typeof data.activeDayKey === "string" ? data.activeDayKey : new Date().toISOString().slice(0, 10)),
    lastTimezoneOffset: typeof data.lastTimezoneOffset === "number" ? data.lastTimezoneOffset : new Date().getTimezoneOffset(),
    dailyArchives: Array.isArray(data.dailyArchives) ? data.dailyArchives : [],
    dailyRolloverEvents: Array.isArray(data.dailyRolloverEvents) ? data.dailyRolloverEvents : [],
    energyFactors: Array.isArray(data.energyFactors) ? data.energyFactors : [],
    habits: Array.isArray(data.habits) ? data.habits : [],
    habitEntries: Array.isArray(data.habitEntries) ? data.habitEntries : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    closeouts: Array.isArray(data.closeouts) ? data.closeouts : [],
    recoveryPlans: Array.isArray(data.recoveryPlans) ? data.recoveryPlans : [],
    questions: Array.isArray(data.questions) ? data.questions : [],
    quizSessions: Array.isArray(data.quizSessions) ? data.quizSessions : [],
    ankiCards: Array.isArray(data.ankiCards) ? data.ankiCards : [],
    cardReviews: Array.isArray(data.cardReviews) ? data.cardReviews : [],
  } as NoctyriumState;
}

function normalizeDashboardWidgetOrder(value: unknown): NonNullable<NoctyriumState["profile"]["dashboardWidgetOrder"]> {
  if (!Array.isArray(value)) return [...DEFAULT_DASHBOARD_WIDGETS];
  const valid = new Set(DEFAULT_DASHBOARD_WIDGETS);
  const incoming = value.filter((item): item is typeof DEFAULT_DASHBOARD_WIDGETS[number] =>
    typeof item === "string" && valid.has(item as typeof DEFAULT_DASHBOARD_WIDGETS[number]),
  );
  return [...new Set([...incoming, ...DEFAULT_DASHBOARD_WIDGETS])];
}

function normalizeDashboardWidgetList(value: unknown): NonNullable<NoctyriumState["profile"]["hiddenDashboardWidgets"]> {
  if (!Array.isArray(value)) return [...DEFAULT_HIDDEN_DASHBOARD_WIDGETS];
  const valid = new Set(DEFAULT_DASHBOARD_WIDGETS);
  return [...new Set(value.filter((item): item is typeof DEFAULT_DASHBOARD_WIDGETS[number] =>
    typeof item === "string" && valid.has(item as typeof DEFAULT_DASHBOARD_WIDGETS[number]),
  ))];
}

function normalizeHiddenNav(value: unknown, trackId: string) {
  if (Array.isArray(value)) {
    return [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0))];
  }
  const base = ["courses", "prompts", "integrations", "folders"];
  if (trackId === "premed" || trackId === "mcat" || trackId === "undergrad") return [...base, "step"];
  if (trackId === "nursing" || trackId === "pa") return [...base, "step", "premed"];
  return [...base, "premed"];
}

function normalizeJournalReviewTime(value: unknown) {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value) ? value : "20:00";
}

function normalizePromise(value: unknown): NoctyriumState["profile"]["promise"] {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const signedName = typeof record.signedName === "string" ? record.signedName.trim() : "";
  const signedAt = typeof record.signedAt === "string" ? record.signedAt : "";
  if (!signedName || !signedAt) return undefined;
  return {
    signedName,
    signedAt,
    promiseTextVersion: typeof record.promiseTextVersion === "string" ? record.promiseTextVersion : "promise-of-use-v1",
    journalEntryId: typeof record.journalEntryId === "string" ? record.journalEntryId : undefined,
  };
}

function defaultBoardPrep(medYear: string, contentStarted: string, weeklyHours: number, questionTarget: number) {
  return {
    medYear,
    contentStarted,
    weeklyHours,
    questionTarget,
    resourcesDone: [],
    installedBlueprintAreas: [],
    completedBlueprintItems: [],
    otherResources: "",
    confidence: "medium",
    blueprintLogs: [],
    aiStrategy: "",
    updated: new Date().toISOString(),
  };
}

// ===========================================================================
// JSON export / import. The portable backup story for the browser-stored data.
// ===========================================================================
import type { NoctyriumState } from "./types";
import { APP_VERSION_LABEL, DEFAULT_DASHBOARD_WIDGETS, SCHEMA_VERSION } from "./seed";
import { userIdFromName } from "./userIdentity";
import { DEFAULT_FOCUS_IDS, focusOption, normalizedFocusIds } from "./experience";
import { resolveTrack } from "./tracks";

const DATA_KEYS = [
  "profile", "terms", "courses", "tracker", "resources", "tasks", "journal",
  "prompts", "folders", "logs", "integrations", "boardPrep", "dayPlans", "activeDayKey", "schemaVersion",
] as const;

export function toPortableState(state: NoctyriumState): NoctyriumState {
  const payload: Record<string, unknown> = {};
  const src = state as unknown as Record<string, unknown>;
  for (const k of DATA_KEYS) payload[k] = src[k];
  return payload as unknown as NoctyriumState;
}

export function exportState(state: NoctyriumState) {
  const payload: Record<string, unknown> = {
    _app: "Noctyrium",
    _exported: new Date().toISOString(),
    ...toPortableState(state),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `noctyrium-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImport(text: string): NoctyriumState {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object" || !Array.isArray(data.terms)) {
    throw new Error("This file doesn't look like a Noctyrium backup.");
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
      journalReviewTime: normalizeJournalReviewTime(profile.journalReviewTime),
    },
    terms: data.terms ?? [],
    courses: data.courses ?? [],
    tracker: data.tracker ?? [],
    resources: data.resources ?? [],
    tasks: data.tasks ?? [],
    journal: data.journal ?? [],
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
    dayPlans: data.dayPlans ?? [],
    activeDayKey: data.activeDayKey,
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
  if (!Array.isArray(value)) return [];
  const valid = new Set(DEFAULT_DASHBOARD_WIDGETS);
  return [...new Set(value.filter((item): item is typeof DEFAULT_DASHBOARD_WIDGETS[number] =>
    typeof item === "string" && valid.has(item as typeof DEFAULT_DASHBOARD_WIDGETS[number]),
  ))];
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
    otherResources: "",
    confidence: "medium",
    blueprintLogs: [],
    aiStrategy: "",
    updated: new Date().toISOString(),
  };
}

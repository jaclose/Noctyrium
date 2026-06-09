// ===========================================================================
// JSON export / import. The portable backup story for the browser-stored data.
// ===========================================================================
import type { NoctyriumState } from "./types";
import { SCHEMA_VERSION } from "./seed";
import { userIdFromName } from "./userIdentity";

const DATA_KEYS = [
  "profile", "terms", "courses", "tracker", "resources", "tasks", "journal",
  "prompts", "folders", "logs", "integrations", "activeDayKey", "schemaVersion",
] as const;

export function exportState(state: NoctyriumState) {
  const payload: Record<string, unknown> = { _app: "Noctyrium", _exported: new Date().toISOString() };
  const src = state as unknown as Record<string, unknown>;
  for (const k of DATA_KEYS) payload[k] = src[k];

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

  return {
    schemaVersion: data.schemaVersion ?? SCHEMA_VERSION,
    profile: {
      name,
      userId: typeof profile.userId === "string" && profile.userId.trim() ? profile.userId : userIdFromName(name),
      versionLabel: String(profile.versionLabel ?? "v0.8.0 · web"),
      tagline: String(profile.tagline ?? "Designed for execution, not decoration."),
      avatarDataUrl: typeof profile.avatarDataUrl === "string" ? profile.avatarDataUrl : undefined,
      dailyCardTarget: typeof profile.dailyCardTarget === "number" ? profile.dailyCardTarget : 120,
      dailyMinuteTarget: typeof profile.dailyMinuteTarget === "number" ? profile.dailyMinuteTarget : 240,
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
    activeDayKey: data.activeDayKey,
  } as NoctyriumState;
}

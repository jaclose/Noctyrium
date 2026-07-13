export type FeedbackKind = "Suggestion" | "Bug" | "Urgent";

const FEEDBACK_EMAIL = "jafardabbagh@gmail.com";

export interface FeedbackDraftInput {
  kind: FeedbackKind;
  message: string;
  area?: string;
  contact?: string;
  appVersion: string;
  schemaVersion: number;
  route: string;
  userAgent?: string;
}

/**
 * Build a local email draft with coarse diagnostics only. Raw user-agent text
 * and AXOM workspace content never enter the draft.
 */
export function buildFeedbackMailto(input: FeedbackDraftInput): string {
  const route = normalizeRoute(input.route);
  const diagnostics = coarseDeviceLabels(input.userAgent ?? "");
  const area = cleanLine(input.area, 80);
  const subject = `[AXOM ${input.kind}]`;
  const body = [
    cleanMessage(input.message),
    "",
    area ? `Page or feature: ${area}` : "",
    "AXOM diagnostics (added locally):",
    `App version: ${cleanLine(input.appVersion, 80) || "unknown"}`,
    `Schema version: ${Number.isFinite(input.schemaVersion) ? Math.max(0, Math.trunc(input.schemaVersion)) : "unknown"}`,
    `Route: ${route}`,
    `Browser: ${diagnostics.browser}`,
    `OS: ${diagnostics.os}`,
    cleanLine(input.contact, 160) ? `Contact supplied by user: ${cleanLine(input.contact, 160)}` : "",
  ].filter(Boolean).join("\n");
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function coarseDeviceLabels(userAgent: string): { browser: string; os: string } {
  const ua = userAgent.slice(0, 1_000);
  const browser = /Edg\/([\d.]+)/.exec(ua)?.[1]
    ? `Edge ${/Edg\/([\d.]+)/.exec(ua)![1]}`
    : /Firefox\/([\d.]+)/.exec(ua)?.[1]
      ? `Firefox ${/Firefox\/([\d.]+)/.exec(ua)![1]}`
      : /Chrome\/([\d.]+)/.exec(ua)?.[1]
        ? `Chrome ${/Chrome\/([\d.]+)/.exec(ua)![1]}`
        : /Version\/([\d.]+).*Safari\//.exec(ua)?.[1]
          ? `Safari ${/Version\/([\d.]+).*Safari\//.exec(ua)![1]}`
          : "Unknown browser";
  const os = /Windows NT 10/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /(?:iPhone|iPad|iPod)/.test(ua)
        ? "iOS"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  return { browser, os };
}

function normalizeRoute(value: string): string {
  const route = cleanLine(value, 120).replace(/^#+/, "");
  return `#${route || "dashboard"}`;
}

function cleanLine(value: string | undefined, max: number): string {
  return (value ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

function cleanMessage(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim().slice(0, 8_000);
}

import type { Resource } from "./types";

export const RESOURCE_GROUPS = [
  "Personal Core",
  "Medical School / SGU",
  "Anki / Boards",
  "Step 1",
  "Community Wikis",
  "Automation / AI Tools",
  "External Archives",
  "Reference",
  "Question Banks",
  "General",
] as const;

export const SOURCE_TYPES = ["Google Drive", "MEGA", "Notion", "Other"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export function normalizeResourceUrl(input: string): string {
  const raw = input.trim();
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    ["usp", "pvs", "pli", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) => {
      url.searchParams.delete(key);
    });
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/$/, "");
  } catch {
    return withProtocol;
  }
}

export function usableResourceHref(input: string): string | null {
  try {
    const parsed = new URL(normalizeResourceUrl(input));
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function hostOfResource(input: string): string {
  try {
    return new URL(normalizeResourceUrl(input)).hostname.replace(/^www\./, "");
  } catch {
    return input;
  }
}

export function resourceSourceType(input: string): SourceType {
  const host = hostOfResource(input).toLowerCase();
  if (host.includes("drive.google.com")) return "Google Drive";
  if (host.includes("mega.nz")) return "MEGA";
  if (host.includes("notion.site") || host.includes("notion.so")) return "Notion";
  return "Other";
}

export function resourceGroup(resource: Pick<Resource, "category" | "tags" | "title">): string {
  if (resource.category === "Drives") {
    const first = resource.tags?.[0];
    if (first && !["sgu", "shared", "drive"].includes(first.toLowerCase())) return first;
    return "Medical School / SGU";
  }
  if (/step\s*1|usmle/i.test(resource.category)) return "Step 1";
  if (/anki|board|step\s*2/i.test(resource.category)) return "Anki / Boards";
  if (/tool|ai|automation/i.test(resource.category)) return "Automation / AI Tools";
  return resource.category || "General";
}

export function resourceAudience(resource: Pick<Resource, "title" | "tags" | "favorite">): "Personal" | "Public" {
  const haystack = `${resource.title} ${resource.tags?.join(" ") ?? ""}`.toLowerCase();
  return resource.favorite || /\b(my|mine|personal|jd|claudfather)\b/.test(haystack) ? "Personal" : "Public";
}

export function resourceSortScore(resource: Resource): number {
  const title = resource.title.toLowerCase();
  if (title.startsWith("my drive") || title.includes("claudfather auto")) return -200;
  if (resourceAudience(resource) === "Personal") return -150;
  return -(resource.rating ?? 0);
}

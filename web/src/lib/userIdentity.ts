const FALLBACK_USER_ID = "local-user";

export function userIdFromName(name: string | undefined): string {
  const cleaned = String(name ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || FALLBACK_USER_ID;
}

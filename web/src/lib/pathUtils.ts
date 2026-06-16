export function normalizeTrackerPath(input: string): string {
  return input
    .split("/")
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join("/");
}

export function trackerPathKey(input: string): string {
  return normalizeTrackerPath(input).toLowerCase();
}

export function canonicalTrackerPath(input: string, existingPaths: string[]): string {
  const clean = normalizeTrackerPath(input);
  if (!clean) return "";
  const key = trackerPathKey(clean);
  return existingPaths.find((path) => trackerPathKey(path) === key) ?? clean;
}

export function trackerItemKey(path: string, label: string): string {
  return `${trackerPathKey(path)}::${label.trim().replace(/\s+/g, " ").toLowerCase()}`;
}

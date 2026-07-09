import { BRAND, APP_RELEASE_VERSION } from "./brand";
import { SCHEMA_VERSION } from "./seed";

function envString(key: string): string | undefined {
  const value = import.meta.env[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export const BUILD_INFO = {
  appName: BRAND.productName,
  version: APP_RELEASE_VERSION,
  schemaVersion: SCHEMA_VERSION,
  commitSha:
    envString("VITE_COMMIT_SHA") ??
    envString("VITE_VERCEL_GIT_COMMIT_SHA") ??
    envString("VITE_GIT_COMMIT_SHA") ??
    "local",
  buildTime:
    envString("VITE_BUILD_TIME") ??
    envString("VITE_VERCEL_GIT_COMMIT_DATE") ??
    new Date().toISOString(),
} as const;

export type BuildInfo = typeof BUILD_INFO;

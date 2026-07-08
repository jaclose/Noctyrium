import { describe, expect, it } from "vitest";
import { isNewerVersion, BRAND, STORAGE_KEYS } from "./brand";

describe("update prompt version comparison", () => {
  it("newer core versions trigger, same or older do not", () => {
    expect(isNewerVersion("0.3.0", "0.2.0-alpha.1")).toBe(true);
    expect(isNewerVersion("0.2.0-alpha.1", "0.2.0-alpha.1")).toBe(false);
    expect(isNewerVersion("0.1.9", "0.2.0-alpha.1")).toBe(false);
    expect(isNewerVersion(undefined, "0.2.0-alpha.1")).toBe(false);
  });

  it("a release beats its own pre-release; pre-release tags compare numerically", () => {
    expect(isNewerVersion("0.2.0", "0.2.0-alpha.1")).toBe(true);
    expect(isNewerVersion("0.2.0-alpha.2", "0.2.0-alpha.1")).toBe(true);
    expect(isNewerVersion("0.2.0-alpha.1", "0.2.0")).toBe(false);
    expect(isNewerVersion("0.2.0-alpha.10", "0.2.0-alpha.9")).toBe(true);
  });
});

describe("rebrand readiness", () => {
  it("storage keys are frozen legacy identifiers, decoupled from the display name", () => {
    // A future rebrand changes BRAND.productName but must never change these.
    expect(STORAGE_KEYS.persistedState).toBe("noctyrium-state");
    expect(STORAGE_KEYS.vaultDb).toBe("noctyrium-local-vault");
    expect(BRAND.productName.length).toBeGreaterThan(0);
  });
});

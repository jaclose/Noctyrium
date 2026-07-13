import { describe, expect, it } from "vitest";
import { buildFeedbackMailto, coarseDeviceLabels } from "./feedback";

describe("safe feedback drafts", () => {
  it("uses the requested recipient and only coarse diagnostics", () => {
    const href = decodeURIComponent(buildFeedbackMailto({
      kind: "Bug",
      message: "The import preview mapped the wrong answer.",
      area: "Question Bank",
      contact: "user@example.com",
      appVersion: "Alpha 1",
      schemaVersion: 32,
      route: "questions",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36 secret-token",
    }));
    expect(href).toContain("mailto:jafardabbagh@gmail.com");
    expect(href).toContain("subject=[AXOM Bug]&");
    expect(href).toContain("Page or feature: Question Bank");
    expect(href).toContain("App version: Alpha 1");
    expect(href).toContain("Schema version: 32");
    expect(href).toContain("Route: #questions");
    expect(href).toContain("Browser: Chrome 126.0.0.0");
    expect(href).toContain("OS: macOS");
    expect(href).not.toContain("secret-token");
  });

  it("uses exact subject prefixes for every supported type", () => {
    for (const kind of ["Suggestion", "Bug", "Urgent"] as const) {
      expect(decodeURIComponent(buildFeedbackMailto({
        kind, message: "Message", appVersion: "v", schemaVersion: 32, route: "#help",
      }))).toContain(`subject=[AXOM ${kind}]`);
    }
  });

  it("does not mistake Chromium Edge for Chrome", () => {
    expect(coarseDeviceLabels("Mozilla/5.0 (Windows NT 10.0) Chrome/126 Safari/537.36 Edg/126.0")).toEqual({
      browser: "Edge 126.0",
      os: "Windows",
    });
  });
});

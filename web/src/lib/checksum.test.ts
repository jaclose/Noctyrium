import { describe, expect, it } from "vitest";
import { sha256Hex } from "./checksum";

describe("source-document checksums", () => {
  it("creates a stable SHA-256 fingerprint for duplicate detection", async () => {
    const first = await sha256Hex("same source text");
    const second = await sha256Hex(new TextEncoder().encode("same source text"));
    const other = await sha256Hex("different source text");
    expect(first).toHaveLength(64);
    expect(second).toBe(first);
    expect(other).not.toBe(first);
  });
});

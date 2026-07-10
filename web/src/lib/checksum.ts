// Stable source-document fingerprints. SHA-256 is available in modern
// browsers and Tauri's webview; when it is unavailable we return undefined
// and keep the import usable instead of pretending a weaker hash is reliable.

export async function sha256Hex(input: ArrayBuffer | Uint8Array | string): Promise<string | undefined> {
  if (!globalThis.crypto?.subtle) return undefined;
  const bytes = typeof input === "string"
    ? new TextEncoder().encode(input)
    : input instanceof Uint8Array
      ? input
      : new Uint8Array(input);
  // Copy into a plain ArrayBuffer so TypeScript/browser implementations never
  // see a SharedArrayBuffer-backed view at the SubtleCrypto boundary.
  const safe = new Uint8Array(bytes.byteLength);
  safe.set(bytes);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", safe.buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function checksumFile(file: File): Promise<string | undefined> {
  return sha256Hex(await file.arrayBuffer());
}

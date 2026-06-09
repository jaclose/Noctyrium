import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" keeps all asset URLs relative, so the same build works
// (1) served at any path / subdomain, (2) embedded in an <iframe>, and
// (3) opened directly from file:// after the download zip is unpacked.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});

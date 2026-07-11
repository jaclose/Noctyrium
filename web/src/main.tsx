import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { runStorageMigrations } from "./lib/storageMigrations";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/shell.css";
import "./styles/pages.css";
import "./styles/motion.css";
import "./styles/tour.css";
import "./styles/loop.css";
import "./styles/questionbank.css";

async function bootstrap() {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;
  const startupStatus = await runStorageMigrations();
  const { default: App } = await import("./App");
  const analyticsEnabled = import.meta.env.PROD && (
    location.hostname.endsWith(".vercel.app") || import.meta.env.VITE_ENABLE_ANALYTICS === "true"
  );
  createRoot(rootElement).render(
    <StrictMode>
      <App startupStatus={startupStatus} />
      {analyticsEnabled && <Analytics />}
    </StrictMode>,
  );
}

void bootstrap();

// Register the service worker for offline / installable use (only in prod build).
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => { /* offline is best-effort */ });
  });
}

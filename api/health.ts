import { hasDatabase } from "../lib/api/db.js";
import { sendJson, withApi } from "../lib/api/http.js";

export default withApi(["GET"], async (_req, res) => {
  sendJson(res, {
    ok: true,
    service: "axom-api",
    version: "0.0.1-prebeta",
    databaseConfigured: hasDatabase(),
    aiProvider: process.env.AI_PROVIDER || "mock",
    schemaVersion: Number(process.env.APP_SCHEMA_VERSION || 30),
  });
}, { rateLimit: 120 });

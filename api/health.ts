import { hasDatabase } from "./_lib/db";
import { sendJson, withApi } from "./_lib/http";

export default withApi(["GET"], async (_req, res) => {
  sendJson(res, {
    ok: true,
    service: "noctyrium-api",
    version: "alpha 1",
    databaseConfigured: hasDatabase(),
    aiProvider: process.env.AI_PROVIDER || "mock",
    schemaVersion: Number(process.env.APP_SCHEMA_VERSION || 11),
  });
}, { rateLimit: 120 });

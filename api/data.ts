import {
  createBackupSnapshot,
  getLatestSnapshot,
  listBackups,
  restoreBackup,
  saveCurrentSnapshot,
} from "../lib/api/dataService.js";
import {
  ApiError,
  assertUuid,
  getOptionalParam,
  getParam,
  optionalString,
  requireBodyObject,
  requireInteger,
  requireJsonObject,
  requireString,
  sendJson,
  type ApiRequest,
  withApi,
} from "../lib/api/http.js";

export default withApi(["GET", "POST"], async (req, res) => {
  const userId = assertUuid(getParam(req, "userId"), "user id");
  const action = getOptionalParam(req, "action") || "snapshot";

  if (action === "backups") {
    if (req.method !== "GET") throw new ApiError(405, "Use GET to list backups.");
    const backups = await listBackups(userId);
    sendJson(res, { backups });
    return;
  }

  if (action === "backup") {
    if (req.method !== "POST") throw new ApiError(405, "Use POST to create a backup.");
    const snapshot = await createBackupSnapshot(userId, readSnapshotPayload(req, true));
    sendJson(res, { snapshot }, 201);
    return;
  }

  if (action === "restore") {
    if (req.method !== "POST") throw new ApiError(405, "Use POST to restore a backup.");
    const backupId = assertUuid(getParam(req, "backupId"), "backup id");
    const restored = await restoreBackup(userId, backupId);
    sendJson(res, restored);
    return;
  }

  if (action !== "snapshot") throw new ApiError(400, "Invalid data action.");

  if (req.method === "GET") {
    const snapshot = await getLatestSnapshot(userId);
    sendJson(res, { snapshot });
    return;
  }

  const snapshot = await saveCurrentSnapshot(userId, readSnapshotPayload(req));
  sendJson(res, { snapshot }, 201);
});

function readSnapshotPayload(req: ApiRequest, allowBackupLabel = false) {
  const body = requireBodyObject(req);
  return {
    appVersion: requireString(body, "app_version", { min: 1, max: 80 }),
    schemaVersion: requireInteger(body, "schema_version"),
    dataJson: requireJsonObject(body, "data_json"),
    deviceLabel: optionalString(body, "device_label", 120),
    backupLabel: allowBackupLabel ? optionalString(body, "backup_label", 120) : undefined,
  };
}

import { createBackupSnapshot } from "../../_lib/dataService.js";
import {
  assertUuid,
  getParam,
  optionalString,
  requireBodyObject,
  requireInteger,
  requireJsonObject,
  requireString,
  sendJson,
  withApi,
} from "../../_lib/http.js";

export default withApi(["POST"], async (req, res) => {
  const userId = assertUuid(getParam(req, "userId"), "user id");
  const body = requireBodyObject(req);
  const snapshot = await createBackupSnapshot(userId, {
    appVersion: requireString(body, "app_version", { min: 1, max: 80 }),
    schemaVersion: requireInteger(body, "schema_version"),
    dataJson: requireJsonObject(body, "data_json"),
    deviceLabel: optionalString(body, "device_label", 120),
    backupLabel: optionalString(body, "backup_label", 120),
  });
  sendJson(res, { snapshot }, 201);
});

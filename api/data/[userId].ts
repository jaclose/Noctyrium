import { getLatestSnapshot, saveCurrentSnapshot } from "../_lib/dataService.js";
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
} from "../_lib/http.js";

export default withApi(["GET", "POST"], async (req, res) => {
  const userId = assertUuid(getParam(req, "userId"), "user id");

  if (req.method === "GET") {
    const snapshot = await getLatestSnapshot(userId);
    sendJson(res, { snapshot });
    return;
  }

  const body = requireBodyObject(req);
  const snapshot = await saveCurrentSnapshot(userId, {
    appVersion: requireString(body, "app_version", { min: 1, max: 80 }),
    schemaVersion: requireInteger(body, "schema_version"),
    dataJson: requireJsonObject(body, "data_json"),
    deviceLabel: optionalString(body, "device_label", 120),
  });
  sendJson(res, { snapshot }, 201);
});

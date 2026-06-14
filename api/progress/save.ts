import { loginByName, saveCurrentSnapshot } from "../_lib/dataService";
import {
  optionalString,
  requireBodyObject,
  requireInteger,
  requireJsonObject,
  requireString,
  sendJson,
  withApi,
} from "../_lib/http";

export default withApi(["POST"], async (req, res) => {
  const body = requireBodyObject(req);
  const user = await loginByName(requireString(body, "name", { min: 1, max: 80 }));
  const snapshot = await saveCurrentSnapshot(user.id, {
    appVersion: requireString(body, "app_version", { min: 1, max: 80 }),
    schemaVersion: requireInteger(body, "schema_version"),
    dataJson: requireJsonObject(body, "data_json"),
    deviceLabel: optionalString(body, "device_label", 120),
  });
  sendJson(res, { user, snapshot }, 201);
}, { rateLimit: 30 });

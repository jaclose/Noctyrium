import { createPinAccount, getUser, loginByName, loginByPin, logoutSession } from "../lib/api/dataService.js";
import {
  ApiError,
  assertUuid,
  getOptionalParam,
  requireBodyObject,
  requireString,
  sendJson,
  withApi,
} from "../lib/api/http.js";

export default withApi(["GET", "POST"], async (req, res) => {
  const action = getOptionalParam(req, "action");

  if (req.method === "POST") {
    if (action && !["login", "register", "pin-login", "logout"].includes(action)) throw new ApiError(400, "Invalid user action.");
    const body = requireBodyObject(req);
    if (action === "register") {
      const username = requireString(body, "username", { min: 1, max: 80 });
      const pin = requireString(body, "pin", { min: 4, max: 12 });
      const deviceLabel = typeof body.deviceLabel === "string" ? body.deviceLabel.slice(0, 120) : undefined;
      const result = await createPinAccount({ username, pin, deviceLabel });
      sendJson(res, result, 201);
      return;
    }
    if (action === "pin-login") {
      const username = requireString(body, "username", { min: 1, max: 80 });
      const pin = requireString(body, "pin", { min: 4, max: 12 });
      const deviceLabel = typeof body.deviceLabel === "string" ? body.deviceLabel.slice(0, 120) : undefined;
      const result = await loginByPin({ username, pin, deviceLabel });
      sendJson(res, result);
      return;
    }
    if (action === "logout") {
      const token = typeof body.sessionToken === "string" ? body.sessionToken : "";
      await logoutSession(token);
      sendJson(res, { ok: true });
      return;
    }
    const name = requireString(body, "name", { min: 1, max: 80 });
    const user = await loginByName(name);
    sendJson(res, { user });
    return;
  }

  const id = assertUuid(getOptionalParam(req, "id") || "", "user id");
  const user = await getUser(id);
  sendJson(res, { user });
}, { rateLimit: 40 });

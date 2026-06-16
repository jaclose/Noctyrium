import { getUser, loginByName } from "../lib/api/dataService.js";
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
    if (action && action !== "login") throw new ApiError(400, "Invalid user action.");
    const body = requireBodyObject(req);
    const name = requireString(body, "name", { min: 1, max: 80 });
    const user = await loginByName(name);
    sendJson(res, { user });
    return;
  }

  const id = assertUuid(getOptionalParam(req, "id") || "", "user id");
  const user = await getUser(id);
  sendJson(res, { user });
}, { rateLimit: 40 });

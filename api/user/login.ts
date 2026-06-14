import { loginByName } from "../_lib/dataService";
import { requireBodyObject, requireString, sendJson, withApi } from "../_lib/http";

export default withApi(["POST"], async (req, res) => {
  const body = requireBodyObject(req);
  const name = requireString(body, "name", { min: 1, max: 80 });
  const user = await loginByName(name);
  sendJson(res, { user });
}, { rateLimit: 20 });

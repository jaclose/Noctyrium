import { getLatestSnapshot, loginByName } from "../_lib/dataService";
import { requireBodyObject, requireString, sendJson, withApi } from "../_lib/http";

export default withApi(["POST"], async (req, res) => {
  const body = requireBodyObject(req);
  const user = await loginByName(requireString(body, "name", { min: 1, max: 80 }));
  const snapshot = await getLatestSnapshot(user.id);
  sendJson(res, { user, snapshot });
}, { rateLimit: 30 });

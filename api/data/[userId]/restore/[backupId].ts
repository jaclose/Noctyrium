import { restoreBackup } from "../../../_lib/dataService.js";
import { assertUuid, getParam, sendJson, withApi } from "../../../_lib/http.js";

export default withApi(["POST"], async (req, res) => {
  const userId = assertUuid(getParam(req, "userId"), "user id");
  const backupId = assertUuid(getParam(req, "backupId"), "backup id");
  const restored = await restoreBackup(userId, backupId);
  sendJson(res, restored);
});

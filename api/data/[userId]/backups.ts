import { listBackups } from "../../_lib/dataService";
import { assertUuid, getParam, sendJson, withApi } from "../../_lib/http";

export default withApi(["GET"], async (req, res) => {
  const userId = assertUuid(getParam(req, "userId"), "user id");
  const backups = await listBackups(userId);
  sendJson(res, { backups });
});

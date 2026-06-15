import { getUser } from "../_lib/dataService.js";
import { assertUuid, getParam, sendJson, withApi } from "../_lib/http.js";

export default withApi(["GET"], async (req, res) => {
  const id = assertUuid(getParam(req, "id"), "user id");
  const user = await getUser(id);
  sendJson(res, { user });
});

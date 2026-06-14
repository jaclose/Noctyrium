import { runAiFeature, type AiFeature, type AiRequestBody } from "./aiService";
import { requireBodyObject, sendJson, withApi } from "./http";

export function aiRoute(feature: AiFeature) {
  return withApi(["POST"], async (req, res) => {
    const body = requireBodyObject(req) as AiRequestBody;
    const result = await runAiFeature(feature, body);
    sendJson(res, result);
  }, { rateLimit: 30 });
}

import { aiErrorResponse, aiJson } from "@/lib/ai-http";
import { listOpenRouterModels } from "@/lib/ai-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.match(/^Bearer ([^\s]+)$/i);
  if (authorization !== null && !bearer) {
    return aiJson(
      {
        error:
          "Use a valid Bearer API key or omit Authorization for public model metadata.",
        code: "invalid_request",
      },
      400,
    );
  }
  try {
    const models = await listOpenRouterModels(bearer?.[1] ?? "");
    return aiJson({ models });
  } catch (error) {
    return aiErrorResponse(error);
  }
}

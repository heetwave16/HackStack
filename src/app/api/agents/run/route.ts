import { aiErrorResponse, aiJson } from "@/lib/ai-http";
import { requireCallerApiKey, resolveGatewayBaseUrl } from "@/lib/ai-policy";
import {
  agentRunRequestSchema,
  buildAgentPrompt,
  parseAgentPatch,
} from "@/lib/agents";
import { generateWithGateway, GatewayError } from "@/lib/ai-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = agentRunRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return aiJson(
      { error: "Invalid agent request", code: "invalid_request" },
      400,
    );

  const input = parsed.data;
  try {
    resolveGatewayBaseUrl(input.provider, input.baseUrl);
    const apiKey = requireCallerApiKey(input.apiKey);
    const output = await generateWithGateway({
      provider: input.provider,
      model: input.model,
      apiKey,
      baseUrl: input.baseUrl,
      system:
        "You are a specialist agent in a software product workbench. Return a clear structured artifact, not filler.",
      user: buildAgentPrompt(input.agent, input.idea, input.context),
      timeoutMs: 45_000,
    });
    let patch;
    try {
      patch = parseAgentPatch(output);
    } catch {
      throw new GatewayError(
        "Agent returned an invalid patch",
        "invalid_response",
      );
    }
    return aiJson({ agent: input.agent, output, patch });
  } catch (error) {
    return aiErrorResponse(error);
  }
}

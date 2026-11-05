import { z } from "zod";
import {
  buildHackStackUserPrompt,
  HACKSTACK_SYSTEM_PROMPT,
} from "@/lib/prompts";
import {
  normalizeAndRepairStudioOutput,
  passesGeneratedCodeChecks,
  validateHackStackOutput,
} from "@/lib/validator";
import { type HackStackInput, type HackStackOutput } from "@/types/hackstack";
import { getUserIdFromAccessToken, persistGenerationRun } from "@/lib/supabase";
import { GatewayError, generateWithGateway } from "@/lib/ai-gateway";
import {
  gatewayProviderSchema,
  requireCallerApiKey,
  resolveGatewayBaseUrl,
} from "@/lib/ai-policy";
import { aiErrorResponse, aiJson } from "@/lib/ai-http";
import { classifyIdea, isGenerationAllowed } from "@/lib/jev";

export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  idea: z.string().trim().min(1).max(2000),
  stack: z
    .string()
    .trim()
    .max(200)
    .optional()
    .default("Next.js + Node + Postgres"),
  features: z.array(z.string().trim().max(200)).max(100).optional().default([]),
  modelConfig: z
    .object({
      provider: gatewayProviderSchema,
      modelId: z.string().trim().min(1).max(160),
      apiKey: z.string().max(500).default(""),
      baseUrl: z.string().trim().url().optional(),
    })
    .optional(),
});

type ModelConfig = NonNullable<z.infer<typeof requestSchema>["modelConfig"]>;
const FREE_MODEL_FALLBACK = "meta-llama/llama-3.3-70b-instruct:free";

function supportsFreeModelFallback(config: ModelConfig): boolean {
  return (
    config.provider === "openrouter" &&
    (config.modelId === "openrouter/free" ||
      config.modelId.includes(":free")) &&
    config.modelId !== FREE_MODEL_FALLBACK
  );
}

function shouldRetryWithFreeModel(
  error: unknown,
  config: ModelConfig,
): boolean {
  return (
    supportsFreeModelFallback(config) &&
    error instanceof GatewayError &&
    (error.code === "invalid_response" ||
      error.code === "timeout" ||
      error.status === 408 ||
      error.status === 429 ||
      (error.status !== undefined && error.status >= 500))
  );
}

async function respondWithRun(
  output: HackStackOutput,
  input: HackStackInput,
  startedAt: number,
  request: Request,
) {
  // History is best-effort and authenticated; never persist request modelConfig or keys.
  try {
    const token =
      request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i)?.[1] ??
      null;
    const userId = await getUserIdFromAccessToken(token);
    if (userId) {
      await persistGenerationRun({
        input,
        output,
        latencyMs: Date.now() - startedAt,
        source: "live",
        userId,
      });
    }
  } catch {
    console.warn("Generation history could not be saved.");
  }
  return aiJson(output);
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const parsedBody = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsedBody.success) {
    return aiJson(
      { error: "Invalid HackStack input", code: "invalid_request" },
      400,
    );
  }
  const { idea, stack, features } = parsedBody.data;
  const input: HackStackInput = { idea, stack, features };
  const config: ModelConfig = parsedBody.data.modelConfig ?? {
    provider: "openrouter",
    modelId: "openrouter/free",
    apiKey: "",
  };

  try {
    // JEV pre-flight: fast safety + complexity classification (non-blocking on failure).
    const jevResult = await classifyIdea(idea);
    if (!isGenerationAllowed(jevResult)) {
      return aiJson(
        {
          error:
            jevResult.safetyNote ??
            "This idea cannot be generated. Please describe a different hackathon project.",
          code: "content_blocked",
        },
        422,
      );
    }

    resolveGatewayBaseUrl(config.provider, config.baseUrl);
    const apiKey = requireCallerApiKey(config.apiKey);
    const models = [config.modelId];
    if (supportsFreeModelFallback(config)) models.push(FREE_MODEL_FALLBACK);

    for (const [index, model] of models.entries()) {
      try {
        const timeoutMs = Math.min(30_000, 50_000 - (Date.now() - startedAt));
        if (timeoutMs <= 0)
          throw new GatewayError("Generation request timed out", "timeout");
        const text = await generateWithGateway({
          provider: config.provider,
          model,
          apiKey,
          baseUrl: config.baseUrl,
          system: HACKSTACK_SYSTEM_PROMPT,
          user: `${buildHackStackUserPrompt(input)}\n\nReturn the complete HackStack JSON output and follow every schema constraint.`,
          timeoutMs,
        });
        let parsedJson: unknown;
        try {
          parsedJson = normalizeAndRepairStudioOutput(text);
        } catch {
          throw new GatewayError(
            "Model output failed validation",
            "invalid_response",
          );
        }
        const candidate = {
          ...(parsedJson as object),
          validation: {
            schemaValid: true,
            compileCheckPassed: false,
            usedFallback: false,
            modelUsed: model,
          },
        };
        const checked = validateHackStackOutput({
          ...candidate,
          validation: {
            ...candidate.validation,
            compileCheckPassed: passesGeneratedCodeChecks(candidate),
          },
        });
        if (!checked.success)
          throw new GatewayError(
            "Model output failed validation",
            "invalid_response",
          );
        return respondWithRun(checked.data, input, startedAt, request);
      } catch (error) {
        if (
          index === models.length - 1 ||
          !shouldRetryWithFreeModel(error, config)
        )
          throw error;
      }
    }
    throw new GatewayError(
      "Model output failed validation",
      "invalid_response",
    );
  } catch (error) {
    return aiErrorResponse(error);
  }
}

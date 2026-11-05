import { z } from "zod";
import { HACKSTACK_SYSTEM_PROMPT } from "@/lib/prompts";
import {
  GatewayError,
  requireCallerApiKey,
  resolveGatewayBaseUrl,
  type GatewayProvider,
} from "@/lib/ai-policy";

export {
  GatewayError,
  gatewayProviderSchema,
  type GatewayProvider,
} from "@/lib/ai-policy";

export interface GatewayRequest {
  provider: GatewayProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  system: string;
  user: string;
  timeoutMs: number;
}

const chatResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.union([
            z.string(),
            z.array(z.object({ text: z.string().optional() })),
          ]),
        }),
      }),
    )
    .min(1),
});
const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string().optional() })),
        }),
      }),
    )
    .min(1),
});
const modelsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      pricing: z
        .object({
          prompt: z.string().optional(),
          completion: z.string().optional(),
        })
        .optional(),
      context_length: z.number().optional(),
    }),
  ),
});

async function fetchProviderJson(
  url: string,
  options: RequestInit,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      // Credentials must never follow a redirect, even to another approved provider.
      redirect: "error",
      cache: "no-store",
      credentials: "omit",
    });
  } catch (error) {
    if (
      options.signal?.aborted ||
      (error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError"))
    ) {
      throw new GatewayError("AI provider request timed out", "timeout");
    }
    throw new GatewayError("Could not reach the AI provider", "provider");
  }
  if (!response.ok) {
    void response.body?.cancel().catch(() => undefined);
    throw new GatewayError(
      "AI provider rejected the request",
      "provider",
      response.status,
    );
  }
  try {
    return await response.json();
  } catch (error) {
    if (
      options.signal?.aborted ||
      (error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError"))
    ) {
      throw new GatewayError("AI provider request timed out", "timeout");
    }
    throw new GatewayError(
      "AI provider returned invalid JSON",
      "invalid_response",
    );
  }
}

async function callChatCompletions(
  request: GatewayRequest,
  baseUrl: string,
): Promise<string> {
  const json = await fetchProviderJson(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${request.apiKey}`,
      ...(request.provider === "openrouter"
        ? {
            "HTTP-Referer":
              process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
            "X-Title": "HackStack",
          }
        : {}),
    },
    body: JSON.stringify({
      model: request.model,
      temperature: 0.3,
      messages: [
        { role: "system", content: request.system },
        { role: "user", content: request.user },
      ],
    }),
    signal: AbortSignal.timeout(request.timeoutMs),
  });
  const parsed = chatResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new GatewayError(
      "AI provider returned invalid content",
      "invalid_response",
    );
  const content = parsed.data.choices[0].message.content;
  const text =
    typeof content === "string"
      ? content
      : content.map((part) => part.text ?? "").join("");
  if (!text.trim())
    throw new GatewayError("AI provider returned no text", "invalid_response");
  return text;
}

async function callGemini(
  request: GatewayRequest,
  baseUrl: string,
): Promise<string> {
  const url = `${baseUrl}/models/${encodeURIComponent(request.model)}:generateContent`;
  const json = await fetchProviderJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": request.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: request.system }] },
      contents: [{ role: "user", parts: [{ text: request.user }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }),
    signal: AbortSignal.timeout(request.timeoutMs),
  });
  const parsed = geminiResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new GatewayError(
      "AI provider returned invalid content",
      "invalid_response",
    );
  const text = parsed.data.candidates[0].content.parts
    .map((part) => part.text ?? "")
    .join("");
  if (!text.trim())
    throw new GatewayError("AI provider returned no text", "invalid_response");
  return text;
}

export async function generateWithGateway(
  request: GatewayRequest,
): Promise<string> {
  const baseUrl = resolveGatewayBaseUrl(request.provider, request.baseUrl);
  const apiKey = requireCallerApiKey(request.apiKey);
  const approvedRequest = { ...request, apiKey };
  if (request.provider === "gemini")
    return callGemini(approvedRequest, baseUrl);
  return callChatCompletions(approvedRequest, baseUrl);
}

export async function listOpenRouterModels(apiKey: string) {
  const key = apiKey ? requireCallerApiKey(apiKey) : "";
  const json = await fetchProviderJson(
    `${resolveGatewayBaseUrl("openrouter")}/models`,
    {
      headers: key ? { Authorization: `Bearer ${key}` } : undefined,
      signal: AbortSignal.timeout(10_000),
    },
  );
  const parsed = modelsResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new GatewayError(
      "OpenRouter returned invalid model metadata",
      "invalid_response",
    );
  return parsed.data.data
    .filter(
      (model) =>
        model.id && model.context_length && model.context_length >= 8000,
    )
    .map((model) => ({
      id: model.id,
      name: model.name ?? model.id,
      contextLength: model.context_length,
      free: model.pricing?.prompt === "0" && model.pricing?.completion === "0",
    }))
    .sort(
      (a, b) => Number(b.free) - Number(a.free) || a.name.localeCompare(b.name),
    );
}

export { HACKSTACK_SYSTEM_PROMPT };

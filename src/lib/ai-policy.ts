import { z } from "zod";

export const gatewayProviderSchema = z.enum([
  "openrouter",
  "openai-compatible",
  "gemini",
]);
export type GatewayProvider = z.infer<typeof gatewayProviderSchema>;

const PROVIDER_BASE_URLS: Record<GatewayProvider, string> = {
  openrouter: "https://openrouter.ai/api/v1",
  "openai-compatible": "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
};

export class GatewayError extends Error {
  constructor(
    message: string,
    readonly code:
      | "missing_key"
      | "provider"
      | "timeout"
      | "invalid_response"
      | "unsafe_endpoint"
      | "invalid_request",
    readonly status?: number,
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

export function resolveGatewayBaseUrl(
  provider: GatewayProvider,
  baseUrl?: string,
): string {
  const approved = gatewayProviderSchema.safeParse(provider).success
    ? PROVIDER_BASE_URLS[provider]
    : undefined;
  // Compare the original spelling, not a normalized URL that may hide overrides.
  if (!approved || (baseUrl !== undefined && baseUrl !== approved)) {
    throw new GatewayError(
      "Custom gateway URLs are disabled. Use the selected provider’s approved endpoint.",
      "unsafe_endpoint",
    );
  }
  return approved;
}

export function requireCallerApiKey(apiKey: string): string {
  const key = apiKey.trim();
  if (!key) {
    throw new GatewayError(
      "Enter your provider API key in AI settings. Shared server keys are disabled.",
      "missing_key",
    );
  }
  if (key.length > 500 || !/^[\x21-\x7e]+$/.test(key)) {
    throw new GatewayError(
      "Enter a valid provider API key without spaces or control characters.",
      "invalid_request",
    );
  }
  return key;
}

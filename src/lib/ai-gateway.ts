import { z } from 'zod';
import { HACKSTACK_SYSTEM_PROMPT } from '@/lib/prompts';

export const gatewayProviderSchema = z.enum(['openrouter', 'openai-compatible', 'gemini']);
export type GatewayProvider = z.infer<typeof gatewayProviderSchema>;

export interface GatewayRequest {
  provider: GatewayProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  system: string;
  user: string;
  timeoutMs: number;
  maxTokens?: number;
}

export class GatewayError extends Error {
  status?: number;
  code: 'missing_key' | 'provider' | 'timeout' | 'invalid_response' | 'unsafe_endpoint';

  constructor(message: string, code: GatewayError['code'], status?: number) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
    this.status = status;
  }
}

function providerMessage(provider: string, status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } | string; message?: string };
    const error = typeof parsed.error === 'string' ? parsed.error : parsed.error?.message;
    return `${provider} rejected the request (${status})${error || parsed.message ? `: ${error || parsed.message}` : ''}`;
  } catch {
    return `${provider} rejected the request (${status})${body ? `: ${body.slice(0, 180)}` : ''}`;
  }
}

async function callChatCompletions(request: GatewayRequest): Promise<string> {
  const baseUrl = (request.baseUrl ?? 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${request.apiKey}`,
      ...(request.provider === 'openrouter'
        ? { 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000', 'X-Title': 'HackStack' }
        : {})
    },
    body: JSON.stringify({
      model: request.model,
      temperature: 0.3,
      max_tokens: request.maxTokens ?? 12_000,
      ...(request.provider === 'openrouter'
        ? { reasoning: { effort: 'low' } }
        : { response_format: { type: 'json_object' } }),
      messages: [
        { role: 'system', content: request.system },
        { role: 'user', content: request.user }
      ]
    }),
    signal: AbortSignal.timeout(request.timeoutMs)
  }).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new GatewayError(`${request.provider} request timed out`, 'timeout');
    }
    throw error;
  });

  if (!response.ok) {
    throw new GatewayError(providerMessage(request.provider, response.status, await response.text().catch(() => '')), 'provider', response.status);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string | { text?: string }[] } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content : content?.map((part) => part.text ?? '').join('');
  if (!text?.trim()) throw new GatewayError(`${request.provider} returned no text`, 'invalid_response');
  return text;
}

async function callGemini(request: GatewayRequest): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(request.model)}:generateContent?key=${encodeURIComponent(request.apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: request.system }] },
      contents: [{ role: 'user', parts: [{ text: request.user }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
    }),
    signal: AbortSignal.timeout(request.timeoutMs)
  });
  if (!response.ok) {
    throw new GatewayError(providerMessage('Gemini', response.status, await response.text().catch(() => '')), 'provider', response.status);
  }
  const json = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  if (!text) throw new GatewayError('Gemini returned no text', 'invalid_response');
  return text;
}

export async function generateWithGateway(request: GatewayRequest): Promise<string> {
  if (!request.apiKey.trim()) throw new GatewayError('Add an API key to generate a live result', 'missing_key');
  if (request.provider === 'gemini') return callGemini(request);
  if (request.provider !== 'openrouter') return callChatCompletions(request);

  const resolvedModel = await resolveOpenRouterModel(request.apiKey, request.model);
  const resolvedRequest = { ...request, model: resolvedModel };
  try {
    return await callChatCompletions(resolvedRequest);
  } catch (error) {
    if (!(error instanceof GatewayError) || (error.status !== 400 && error.status !== 404)) throw error;
    const retryModel = await resolveOpenRouterModel(request.apiKey, request.model, true);
    if (retryModel === resolvedModel) throw error;
    return callChatCompletions({ ...request, model: retryModel });
  }
}

type OpenRouterModel = {
  id: string;
  name?: string;
  pricing?: { prompt?: string; completion?: string };
  context_length?: number;
  supported_parameters?: string[];
};

const EXCLUDED_MODEL_TERMS = ['embed', 'rerank', 'safety', 'guard', 'transcribe'];

function parameterCountInBillions(model: OpenRouterModel): number | null {
  const match = `${model.id} ${model.name ?? ''}`.match(/\b(\d+(?:\.\d+)?)b\b/i);
  return match ? Number(match[1]) : null;
}

function isUsableFreeModel(model: OpenRouterModel): boolean {
  const identity = `${model.id} ${model.name ?? ''}`.toLowerCase();
  const parameters = parameterCountInBillions(model);
  return Boolean(
    model.id &&
    model.context_length &&
    Number(model.context_length) >= 8_000 &&
    model.pricing?.prompt === '0' &&
    model.pricing?.completion === '0' &&
    !EXCLUDED_MODEL_TERMS.some((term) => identity.includes(term)) &&
    !/\b(?:[0-6](?:\.\d+)?)b\b/i.test(identity) &&
    (parameters === null || parameters >= 7)
  );
}

function freeModelScore(model: { id: string; name: string; contextLength: number }): number {
  const identity = `${model.id} ${model.name}`.toLowerCase();
  let score = Math.min(model.contextLength / 10_000, 10);
  if (identity.includes('nemotron')) score += 40;
  if (identity.includes('llama-3.3-70b') || identity.includes('llama 3.3 70b')) score += 35;
  if (identity.includes('qwen')) score += 30;
  if (identity.includes('deepseek')) score += 25;
  if (identity.includes('instruct') || identity.includes('coder')) score += 10;
  return score;
}

export async function listOpenRouterModels(apiKey: string) {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new GatewayError(providerMessage('OpenRouter', response.status, await response.text().catch(() => '')), 'provider', response.status);
  const json = (await response.json()) as { data?: OpenRouterModel[] };
  return (json.data ?? [])
    .filter(isUsableFreeModel)
    .map((model) => ({ id: model.id, name: model.name ?? model.id, contextLength: Number(model.context_length), free: true }))
    .sort((a, b) => freeModelScore(b) - freeModelScore(a) || a.name.localeCompare(b.name));
}

export async function resolveOpenRouterModel(apiKey: string, requestedModel: string, forceRefresh = false): Promise<string> {
  if (!forceRefresh && requestedModel !== 'openrouter/free' && requestedModel.trim()) return requestedModel;
  const models = await listOpenRouterModels(apiKey);
  if (models.length === 0) {
    throw new GatewayError('OpenRouter has no suitable free text-generation models available. Choose a specific model or use offline build.', 'provider', 404);
  }
  if (!forceRefresh && requestedModel !== 'openrouter/free' && models.some((model) => model.id === requestedModel)) {
    return requestedModel;
  }
  return models[0].id;
}

export { HACKSTACK_SYSTEM_PROMPT };

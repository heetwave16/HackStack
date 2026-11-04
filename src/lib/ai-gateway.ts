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
      response_format: { type: 'json_object' },
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
  return callChatCompletions(request);
}

export async function listOpenRouterModels(apiKey: string) {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new GatewayError(providerMessage('OpenRouter', response.status, await response.text().catch(() => '')), 'provider', response.status);
  const json = (await response.json()) as { data?: { id: string; name?: string; pricing?: { prompt?: string; completion?: string }; context_length?: number }[] };
  return (json.data ?? [])
    .filter((model) => model.id && model.context_length && Number(model.context_length) >= 8000)
    .map((model) => ({ id: model.id, name: model.name ?? model.id, contextLength: model.context_length, free: model.pricing?.prompt === '0' && model.pricing?.completion === '0' }))
    .sort((a, b) => Number(b.free) - Number(a.free) || a.name.localeCompare(b.name));
}

export { HACKSTACK_SYSTEM_PROMPT };

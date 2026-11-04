import { NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { z } from 'zod';
import { HACKSTACK_SYSTEM_PROMPT, buildHackStackUserPrompt } from '@/lib/prompts';
import { passesGeneratedCodeChecks, validateHackStackOutput } from '@/lib/validator';
import { FALLBACK_HACKSTACK_RESULT, type HackStackInput, type HackStackOutput } from '@/types/hackstack';

export const maxDuration = 60;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL_TIMEOUT_MS = 35_000;
const TOTAL_MODEL_BUDGET_MS = 55_000;

const GEMINI_FALLBACK_CHAIN = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash'
];

const requestSchema = z.object({
  idea: z.string().trim().min(1).max(2000),
  stack: z.string().trim().max(200).optional().default('Next.js + Node + Postgres'),
  features: z.array(z.string().trim().max(200)).optional().default([]),
  modelConfig: z
    .object({
      provider: z.enum(['gemini', 'openai-compatible']),
      modelId: z.string().trim().min(1).max(120),
      apiKey: z.string().max(500).default(''),
      baseUrl: z.string().trim().url().optional()
    })
    .optional()
});

type ModelConfig = NonNullable<z.infer<typeof requestSchema>['modelConfig']>;

function cleanAndParseJson(text: string): unknown {
  if (!text) throw new Error('Empty response from model');
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    let inString = false;
    let escaped = false;
    let result = '';
    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (inString) {
        if (escaped) {
          escaped = false;
          result += ch;
        } else if (ch === '\\') {
          escaped = true;
          result += ch;
        } else if (ch === '"') {
          inString = false;
          result += ch;
        } else if (ch === '\n') {
          result += '\\n';
        } else if (ch === '\r') {
          result += '\\r';
        } else if (ch === '\t') {
          result += '\\t';
        } else if (ch.charCodeAt(0) < 32) {
          result += ' ';
        } else {
          result += ch;
        }
      } else {
        if (ch === '"') inString = true;
        result += ch;
      }
    }
    return JSON.parse(result);
  }
}

async function callGemini(modelId: string, apiKey: string, prompt: string, timeoutMs: number): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: HACKSTACK_SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4
      }
    }),
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const error = new Error(`Gemini ${modelId} HTTP ${response.status}: ${errorText.slice(0, 150)}`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  const json = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Gemini ${modelId} returned no candidate text`);
  return text;
}

async function callOpenAICompatible(
  config: ModelConfig,
  apiKey: string,
  prompt: string,
  timeoutMs: number
): Promise<string> {
  const base = (config.baseUrl ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
  const url = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.modelId,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: HACKSTACK_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    }),
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI-compatible HTTP ${response.status}: ${errorText.slice(0, 150)}`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI-compatible returned empty message content');
  return text;
}

function resolveApiKey(config: ModelConfig): string | null {
  if (config.apiKey && config.apiKey.trim().length > 0) return config.apiKey.trim();
  if (config.provider === 'gemini') {
    return process.env.GEMINI_API_KEY?.trim() || null;
  }
  if (config.baseUrl) return null;
  return process.env.OPENAI_API_KEY?.trim() || null;
}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  if (isIP(address) === 6) {
    const normalized = address.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb');
  }
  return true;
}

async function assertSafeEndpoint(baseUrl?: string): Promise<void> {
  if (!baseUrl) return;
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error('Custom endpoints must use HTTPS without embedded credentials');
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === 'metadata.google.internal') {
    throw new Error('Custom endpoint host is not allowed');
  }
  const addresses = isIP(hostname) ? [hostname] : (await lookup(hostname, { all: true })).map(({ address }) => address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new Error('Custom endpoint must resolve to a public address');
  }
}

function buildFallbackResponse(reason: string): HackStackOutput {
  return {
    ...FALLBACK_HACKSTACK_RESULT,
    validation: {
      ...FALLBACK_HACKSTACK_RESULT.validation,
      usedFallback: true,
      modelUsed: `offline fallback (${reason})`
    }
  };
}

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);
  const parsedBody = requestSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Invalid HackStack input', details: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  const input: HackStackInput = parsedBody.data;
  const config: ModelConfig = input.modelConfig ?? {
    provider: 'gemini',
    modelId: 'gemini-3.5-flash',
    apiKey: ''
  };

  const apiKey = resolveApiKey(config);
  if (!apiKey) {
    return NextResponse.json(buildFallbackResponse('no API key provided'));
  }

  const prompt = buildHackStackUserPrompt(input);
  const deadline = Date.now() + TOTAL_MODEL_BUDGET_MS;

  if (config.provider === 'openai-compatible') {
    try {
      await assertSafeEndpoint(config.baseUrl);
      const text = await callOpenAICompatible(config, apiKey, prompt, Math.min(MODEL_TIMEOUT_MS, deadline - Date.now()));
      const parsedJson = cleanAndParseJson(text);
      const candidate = { ...(parsedJson as object), validation: { schemaValid: true, compileCheckPassed: false, usedFallback: false, modelUsed: config.modelId } };
      const checked = validateHackStackOutput({
        ...candidate,
        validation: { ...candidate.validation, compileCheckPassed: passesGeneratedCodeChecks(candidate) }
      });

      if (checked.success) {
        return NextResponse.json(checked.data);
      }
      return NextResponse.json(buildFallbackResponse('validation failed on model output'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'openai-compatible request failed';
      console.warn('OpenAI-compatible failed, using fallback:', msg);
      return NextResponse.json(buildFallbackResponse(msg.includes('endpoint') || msg.includes('host') ? 'unsafe custom endpoint' : 'provider request failed'));
    }
  }

  // Gemini provider with fallback loop
  const candidateModels = Array.from(
    new Set([config.modelId, ...GEMINI_FALLBACK_CHAIN].filter(Boolean))
  );

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    const remainingMs = Math.min(MODEL_TIMEOUT_MS, deadline - Date.now());
    if (remainingMs < 1_000) break;
    try {
      const text = await callGemini(model, apiKey, prompt, remainingMs);
      const parsedJson = cleanAndParseJson(text);
      const candidate = { ...(parsedJson as object), validation: { schemaValid: true, compileCheckPassed: false, usedFallback: false, modelUsed: model } };
      const checked = validateHackStackOutput({
        ...candidate,
        validation: { ...candidate.validation, compileCheckPassed: passesGeneratedCodeChecks(candidate) }
      });

      if (checked.success) {
        return NextResponse.json(checked.data);
      }

      console.warn(`Gemini output on ${model} failed schema validation:`, checked.errors.slice(0, 3));
    } catch (err) {
      const status = (err as { status?: number }).status;
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Gemini model ${model} failed (status ${status || 'unknown'}): ${message}`);

      const isRecoverable = !status || [404, 429, 500, 503].includes(status);
      if (!isRecoverable) break;
    }
  }

  return NextResponse.json(buildFallbackResponse('all candidate models failed'));
}

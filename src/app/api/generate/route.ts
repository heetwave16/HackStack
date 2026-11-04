import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildHackStackUserPrompt } from '@/lib/prompts';
import { passesGeneratedCodeChecks, validateHackStackOutput } from '@/lib/validator';
import { FALLBACK_HACKSTACK_RESULT, type HackStackInput, type HackStackOutput } from '@/types/hackstack';
import { getUserIdFromAccessToken, persistGenerationRun } from '@/lib/supabase';
import { GatewayError, generateWithGateway } from '@/lib/ai-gateway';

export const maxDuration = 60;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  idea: z.string().trim().min(1).max(2000),
  stack: z.string().trim().max(200).optional().default('Next.js + Node + Postgres'),
  features: z.array(z.string().trim().max(200)).optional().default([]),
  modelConfig: z.object({
    provider: z.enum(['openrouter', 'gemini', 'openai-compatible']),
    modelId: z.string().trim().min(1).max(160),
    apiKey: z.string().max(500).default(''),
    baseUrl: z.string().trim().url().optional()
  }).optional()
});

type ModelConfig = NonNullable<z.infer<typeof requestSchema>['modelConfig']>;

function cleanAndParseJson(text: string): unknown {
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    let output = '';
    let inString = false;
    let escaped = false;
    for (const character of cleaned) {
      if (inString && character === '\n') output += '\\n';
      else if (inString && character === '\r') output += '\\r';
      else if (inString && character === '\t') output += '\\t';
      else output += character;
      if (character === '"' && !escaped) inString = !inString;
      escaped = character === '\\' && !escaped;
    }
    return JSON.parse(output);
  }
}

function resolveApiKey(config: ModelConfig): string | null {
  if (config.apiKey.trim()) return config.apiKey.trim();
  if (config.provider === 'openrouter') return process.env.OPENROUTER_API_KEY?.trim() || null;
  if (config.provider === 'gemini') return process.env.GEMINI_API_KEY?.trim() || null;
  if (!config.baseUrl) return process.env.OPENAI_API_KEY?.trim() || null;
  return null;
}

function assertSafeEndpoint(baseUrl?: string): void {
  if (!baseUrl) return;
  const parsed = new URL(baseUrl);
  const hostname = parsed.hostname.toLowerCase();
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.internal')) {
    throw new GatewayError('Custom gateways must use a public HTTPS URL without embedded credentials', 'unsafe_endpoint');
  }
}

function buildFallbackResponse(reason: string): HackStackOutput {
  return {
    ...FALLBACK_HACKSTACK_RESULT,
    validation: {
      ...FALLBACK_HACKSTACK_RESULT.validation,
      usedFallback: true,
      modelUsed: 'offline',
      fallbackReason: reason.slice(0, 240)
    }
  };
}

async function respondWithRun(output: HackStackOutput, input: HackStackInput, startedAt: number, userId: string | null) {
  await persistGenerationRun({
    input,
    output,
    latencyMs: Date.now() - startedAt,
    source: output.validation.usedFallback ? 'fallback' : 'live',
    userId
  });
  return NextResponse.json(output);
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const parsedBody = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid HackStack input', details: parsedBody.error.flatten() }, { status: 400 });
  }

  const input: HackStackInput = parsedBody.data;
  const authorization = request.headers.get('authorization');
  const userId = await getUserIdFromAccessToken(authorization?.startsWith('Bearer ') ? authorization.slice(7) : null);
  const config: ModelConfig = parsedBody.data.modelConfig ?? {
    provider: 'openrouter',
    modelId: 'openrouter/free',
    apiKey: ''
  };
  const apiKey = resolveApiKey(config);
  if (!apiKey) return respondWithRun(buildFallbackResponse('No API key configured. Add an OpenRouter key or set OPENROUTER_API_KEY.'), input, startedAt, userId);

  try {
    if (config.provider === 'openai-compatible') assertSafeEndpoint(config.baseUrl);
    const text = await generateWithGateway({
      provider: config.provider,
      model: config.modelId,
      apiKey,
      baseUrl: config.provider === 'openai-compatible' ? config.baseUrl : undefined,
      system: 'You are HackStack. Return only the complete JSON object matching the requested schema. Never include markdown fences.',
      user: `${buildHackStackUserPrompt(input)}\n\nReturn the complete HackStack JSON output and follow every schema constraint.`,
      timeoutMs: 45_000
    });
    const parsedJson = cleanAndParseJson(text);
    const candidate = {
      ...(parsedJson as object),
      validation: { schemaValid: true, compileCheckPassed: false, usedFallback: false, modelUsed: config.modelId }
    };
    const checked = validateHackStackOutput({
      ...candidate,
      validation: { ...candidate.validation, compileCheckPassed: passesGeneratedCodeChecks(candidate) }
    });
    if (!checked.success) return respondWithRun(buildFallbackResponse(`Model output failed validation: ${checked.errors[0] ?? 'invalid shape'}`), input, startedAt, userId);
    return respondWithRun(checked.data, input, startedAt, userId);
  } catch (error) {
    const reason = error instanceof GatewayError || error instanceof Error ? error.message : 'AI gateway request failed';
    console.warn('AI gateway failed:', reason);
    return respondWithRun(buildFallbackResponse(reason), input, startedAt, userId);
  }
}

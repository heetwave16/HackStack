import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/prompts';
import { validateHackStackOutput } from '@/lib/validator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL_TIMEOUT_MS = 35_000;

const requestSchema = z.object({
  idea: z.string().trim().min(10).max(800),
  stack: z.string().trim().min(1).max(120),
  features: z.array(z.string().trim().min(1).max(80)).max(10),
  modelConfig: z
    .object({
      provider: z.enum(['gemini', 'openai-compatible']),
      modelId: z.string().trim().min(1).max(120),
      apiKey: z.string().max(300).default(''),
      baseUrl: z.string().trim().url().optional()
    })
    .optional()
});

type ModelConfig = NonNullable<z.infer<typeof requestSchema>['modelConfig']>;

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

async function callGemini(config: ModelConfig, apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.modelId)}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
    }),
    signal: AbortSignal.timeout(MODEL_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
  const json = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');
  return text;
}

async function callOpenAICompatible(config: ModelConfig, apiKey: string, prompt: string): Promise<string> {
  const base = (config.baseUrl ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: config.modelId,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    }),
    signal: AbortSignal.timeout(MODEL_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`model endpoint returned ${response.status}`);
  const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error('model endpoint returned no content');
  return text;
}

function resolveKey(config: ModelConfig): string | null {
  if (config.apiKey) return config.apiKey;
  if (config.provider === 'gemini') return process.env.GEMINI_API_KEY ?? null;
  return process.env.OPENAI_API_KEY ?? null;
}

export async function POST(request: Request) {
  const parsedBody = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
  const input = parsedBody.data;
  const config: ModelConfig = input.modelConfig ?? {
    provider: 'gemini',
    modelId: 'gemini-3.5-flash',
    apiKey: ''
  };

  if (config.modelId === 'openai-compatible') {
    return NextResponse.json({ error: 'pick a named model or enter one' }, { status: 400 });
  }

  const apiKey = resolveKey(config);
  if (!apiKey) {
    return NextResponse.json({ error: 'no API key available' }, { status: 503 });
  }

  const prompt = buildUserPrompt(input);
  try {
    const text =
      config.provider === 'gemini'
        ? await callGemini(config, apiKey, prompt)
        : await callOpenAICompatible(config, apiKey, prompt);
    const checked = validateHackStackOutput({
      ...(extractJson(text) as object),
      validation: {
        schemaValid: true,
        compileCheckPassed: false,
        usedFallback: false,
        modelUsed: config.modelId
      }
    });
    if (!checked.success) {
      return NextResponse.json({ error: 'model output failed validation', details: checked.errors.slice(0, 5) }, { status: 502 });
    }
    return NextResponse.json(checked.data);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown error';
    console.error('generate failed:', reason);
    return NextResponse.json({ error: 'model call failed' }, { status: 502 });
  }
}

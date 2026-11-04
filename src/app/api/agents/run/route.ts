import { NextResponse } from 'next/server';
import { agentRunRequestSchema, buildAgentPrompt, parseAgentPatch } from '@/lib/agents';
import { generateWithGateway, GatewayError } from '@/lib/ai-gateway';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const parsed = agentRunRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid agent request', details: parsed.error.flatten() }, { status: 400 });

  const input = parsed.data;
  const apiKey = input.apiKey.trim() || (input.provider === 'openrouter'
    ? process.env.OPENROUTER_API_KEY?.trim()
    : input.provider === 'gemini'
      ? process.env.GEMINI_API_KEY?.trim()
      : process.env.OPENAI_API_KEY?.trim());
  if (!apiKey) return NextResponse.json({ error: 'Add an API key before running an agent.' }, { status: 400 });

  try {
    const output = await generateWithGateway({
      provider: input.provider,
      model: input.model,
      apiKey,
      baseUrl: input.baseUrl,
      system: 'You are a specialist agent in a software product workbench. Return a clear structured artifact, not filler.',
      user: buildAgentPrompt(input.agent, input.idea, input.context),
      timeoutMs: 45_000
    });
    let patch;
    try {
      patch = parseAgentPatch(output);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? `Agent returned an invalid patch: ${error.message}` : 'Agent returned an invalid patch' }, { status: 502 });
    }
    return NextResponse.json({ agent: input.agent, output, patch });
  } catch (error) {
    const message = error instanceof GatewayError || error instanceof Error ? error.message : 'Agent failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

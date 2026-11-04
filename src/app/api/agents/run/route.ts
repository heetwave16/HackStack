import { NextResponse } from 'next/server';
import { agentRunRequestSchema, buildAgentPrompt } from '@/lib/agents';
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
      system: 'You are a Domain-Specific Full-Stack Architect team member. Produce idea-specific, implementation-ready work with real domain logic and no boilerplate placeholders.',
      user: buildAgentPrompt(input.agent, input.idea, input.context),
      timeoutMs: 30_000,
      maxTokens: 6_000
    });
    return NextResponse.json({ agent: input.agent, output });
  } catch (error) {
    const message = error instanceof GatewayError || error instanceof Error ? error.message : 'Agent failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

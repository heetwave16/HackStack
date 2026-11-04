import { NextResponse } from 'next/server';
import { listOpenRouterModels, GatewayError } from '@/lib/ai-gateway';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const apiKey = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || process.env.OPENROUTER_API_KEY?.trim() || '';
  try {
    const models = await listOpenRouterModels(apiKey);
    return NextResponse.json({ models });
  } catch (error) {
    const message = error instanceof GatewayError ? error.message : 'Could not load gateway models';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

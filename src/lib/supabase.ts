import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { HackStackInput, HackStackOutput } from '@/types/hackstack';

let client: SupabaseClient | null | undefined;

function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  client = url && serviceRoleKey ? createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  }) : null;
  return client;
}

export async function persistGenerationRun({
  input,
  output,
  latencyMs,
  source
}: {
  input: HackStackInput;
  output: HackStackOutput;
  latencyMs: number;
  source: 'live' | 'fallback';
}): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from('hackstack_runs').insert({
    idea: input.idea,
    stack: input.stack,
    features: input.features,
    project_name: output.projectName,
    source,
    model_used: output.validation.modelUsed ?? null,
    latency_ms: Math.max(0, Math.round(latencyMs)),
    result: output
  });

  if (error) {
    console.warn('Supabase run persistence failed:', error.message);
  }
}

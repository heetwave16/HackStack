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

export async function getUserIdFromAccessToken(token: string | null): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data.user?.id ?? null;
}

export async function persistGenerationRun({
  input,
  output,
  latencyMs,
  source,
  userId
}: {
  input: HackStackInput;
  output: HackStackOutput;
  latencyMs: number;
  source: 'live' | 'fallback';
  userId?: string | null;
}): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from('hackstack_runs').insert({
    idea: input.idea,
    stack: input.stack,
    features: input.features,
    project_name: output.projectName,
    user_id: userId ?? null,
    source,
    model_used: output.validation.modelUsed ?? null,
    latency_ms: Math.max(0, Math.round(latencyMs)),
    result: output
  });

  if (error) {
    console.warn('Supabase run persistence failed:', error.message);
  }
}

export async function getSharedProject(token: string): Promise<{
  project: {
    id: string;
    project_name: string;
    idea: string;
    stack: string;
    features: string[];
    result: HackStackOutput;
    created_at: string;
    updated_at: string;
  };
  canEdit: boolean;
} | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !/^[a-zA-Z0-9_-]{20,128}$/.test(token)) return null;

  const { data, error } = await supabase
    .from('project_share_links')
    .select('can_edit, revoked_at, projects(id, project_name, idea, stack, features, result, created_at, updated_at)')
    .eq('token', token)
    .maybeSingle();

  if (error || !data || data.revoked_at || !data.projects) return null;
  const project = Array.isArray(data.projects) ? data.projects[0] : data.projects;
  if (!project) return null;

  return {
    project: project as {
      id: string;
      project_name: string;
      idea: string;
      stack: string;
      features: string[];
      result: HackStackOutput;
      created_at: string;
      updated_at: string;
    },
    canEdit: data.can_edit
  };
}

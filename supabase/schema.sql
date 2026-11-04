create table if not exists public.hackstack_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  idea text not null,
  stack text not null,
  features jsonb not null default '[]'::jsonb,
  project_name text not null,
  source text not null check (source in ('live', 'fallback')),
  model_used text,
  latency_ms integer not null check (latency_ms >= 0),
  result jsonb not null
);

create index if not exists hackstack_runs_created_at_idx
  on public.hackstack_runs (created_at desc);

alter table public.hackstack_runs enable row level security;

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

alter table public.hackstack_runs add column if not exists user_id uuid references auth.users(id) on delete set null;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_name text not null,
  idea text not null,
  stack text not null,
  features jsonb not null default '[]'::jsonb,
  result jsonb not null
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('viewer', 'editor')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now()
);

create table if not exists public.project_share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  can_edit boolean not null default false,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists hackstack_runs_created_at_idx
  on public.hackstack_runs (created_at desc);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  agent_id text not null check (agent_id in ('product', 'architecture', 'ui', 'code', 'pitch', 'qa')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists agent_runs_project_created_at_idx
  on public.agent_runs (project_id, created_at desc);

alter table public.hackstack_runs enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invites enable row level security;
alter table public.project_share_links enable row level security;
alter table public.agent_runs enable row level security;

create or replace function public.is_project_member(target_project uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p where p.id = target_project and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.project_members m where m.project_id = target_project and m.user_id = auth.uid()
  );
$$;

create policy "users read own runs" on public.hackstack_runs for select using (user_id = auth.uid());
create policy "users manage own agent runs" on public.agent_runs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owners manage projects" on public.projects for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "members read projects" on public.projects for select using (public.is_project_member(id));
create policy "members read membership" on public.project_members for select using (user_id = auth.uid() or public.is_project_member(project_id));
create policy "owners manage invites" on public.project_invites for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy "members manage share links" on public.project_share_links for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));

create or replace function public.accept_my_project_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  accepted_count integer;
begin
  if auth.uid() is null then
    return 0;
  end if;

  insert into public.project_members (project_id, user_id, role)
  select project_id, auth.uid(), role
  from public.project_invites
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and status = 'pending'
  on conflict (project_id, user_id) do update set role = excluded.role;

  update public.project_invites
  set status = 'accepted'
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and status = 'pending';

  get diagnostics accepted_count = row_count;
  return accepted_count;
end;
$$;

revoke all on function public.accept_my_project_invites() from public;
grant execute on function public.accept_my_project_invites() to authenticated;

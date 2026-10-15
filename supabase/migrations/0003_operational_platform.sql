-- Operational queue and notification state. These tables are intentionally
-- service-role-only; browser clients must never be able to claim work.
create table if not exists public.worker_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null check (job_type in ('ingest_jobs','score_matches','prepare_review','send_notifications')),
  payload jsonb not null default '{}',
  idempotency_key text not null unique,
  status text not null default 'pending' check (status in ('pending','running','succeeded','dead')),
  attempts integer not null default 0,
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists worker_jobs_claim_idx on public.worker_jobs(status, run_after);
alter table public.worker_jobs enable row level security;

create table if not exists public.worker_health (
  worker_id text primary key,
  last_seen_at timestamptz not null default now(),
  last_success_at timestamptz,
  last_error text,
  active_jobs integer not null default 0
);
alter table public.worker_health enable row level security;

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default false,
  high_match_enabled boolean not null default true,
  review_required_enabled boolean not null default true,
  status_change_enabled boolean not null default true,
  failure_alerts_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
create policy "users manage own notification preferences" on public.notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "users read own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.claim_worker_jobs(p_worker_id text, p_limit integer default 5)
returns setof public.worker_jobs language plpgsql security definer set search_path = public as $$
begin
  return query
  with candidates as (
    select id from public.worker_jobs
    where (status = 'pending' and run_after <= now())
       or (status = 'running' and locked_at < now() - interval '10 minutes')
    order by run_after asc, created_at asc
    for update skip locked limit greatest(1, least(p_limit, 50))
  )
  update public.worker_jobs w
  set status = 'running', attempts = w.attempts + 1, locked_at = now(), locked_by = p_worker_id
  from candidates c where w.id = c.id returning w.*;
end; $$;

revoke all on function public.claim_worker_jobs(text, integer) from public, anon, authenticated;

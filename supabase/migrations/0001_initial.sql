create extension if not exists pgcrypto;

create type public.work_arrangement as enum ('remote','hybrid','onsite');
create type public.application_status as enum ('saved','queued','needs_review','submitted','unknown','rejected','withdrawn');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, target_roles text[] not null default '{}', locations text[] not null default '{}',
  salary_min integer, work_authorization text, sponsorship_needed boolean, skills text[] not null default '{}',
  matching_consent_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.resume_assets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null, original_name text not null, sha256 text not null, extracted_text text,
  created_at timestamptz not null default now()
);
create table public.job_sources (
  id uuid primary key default gen_random_uuid(), name text not null, kind text not null, permitted boolean not null default false,
  adapter_key text not null unique, config jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.jobs (
  id uuid primary key default gen_random_uuid(), source_id uuid not null references public.job_sources(id), external_id text not null,
  source_url text not null, title text not null, company text not null, location text, arrangement public.work_arrangement,
  salary_min integer, salary_max integer, skills text[] not null default '{}', description text not null default '',
  posted_at timestamptz, expires_at timestamptz, content_hash text not null, created_at timestamptz not null default now(),
  unique(source_id, external_id)
);
create table public.automation_rules (
  user_id uuid primary key references auth.users(id) on delete cascade, enabled boolean not null default false,
  real_submit_opt_in boolean not null default false, strong_match_only boolean not null default true, max_per_run integer not null default 5,
  arrangements public.work_arrangement[] not null default '{remote,hybrid,onsite}', updated_at timestamptz not null default now()
);
create table public.applications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id), status public.application_status not null default 'saved',
  match_score integer, match_reasons jsonb not null default '[]', submission_receipt jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, job_id)
);
create table public.application_events (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, event_type text not null, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.audit_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);

alter table public.profiles enable row level security; alter table public.resume_assets enable row level security; alter table public.automation_rules enable row level security;
alter table public.applications enable row level security; alter table public.application_events enable row level security; alter table public.audit_events enable row level security;
alter table public.jobs enable row level security; alter table public.job_sources enable row level security;
create policy "users own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "users own resumes" on public.resume_assets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own rules" on public.automation_rules for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own applications" on public.applications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own application events" on public.application_events for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own audit events" on public.audit_events for select using (user_id = auth.uid());
create policy "authenticated users read jobs" on public.jobs for select to authenticated using (true);
create policy "authenticated users read permitted sources" on public.job_sources for select to authenticated using (permitted = true);

insert into public.job_sources(name, kind, permitted, adapter_key) values ('Mock ATS feed', 'mock', true, 'mock-ats') on conflict (adapter_key) do nothing;

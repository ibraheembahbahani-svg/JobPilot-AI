alter table public.jobs add column if not exists employment_type text;
alter table public.jobs add column if not exists normalized_company text;
alter table public.jobs add column if not exists ingested_at timestamptz not null default now();
alter table public.jobs add column if not exists last_seen_at timestamptz not null default now();
alter table public.jobs add column if not exists raw_payload jsonb not null default '{}';
alter table public.jobs add column if not exists canonical_key text;
create unique index if not exists jobs_canonical_key_idx on public.jobs(canonical_key) where canonical_key is not null;
create index if not exists jobs_posted_at_idx on public.jobs(posted_at desc nulls last);
create index if not exists jobs_source_company_idx on public.jobs(source_id, normalized_company);
create index if not exists jobs_location_idx on public.jobs using gin(to_tsvector('simple', coalesce(location, '')));

create table public.user_job_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_roles text[] not null default '{}', locations text[] not null default '{}',
  salary_min integer, arrangements public.work_arrangement[] not null default '{remote,hybrid,onsite}',
  employment_types text[] not null default '{}', skills text[] not null default '{}',
  frequency_minutes integer not null default 1440 check (frequency_minutes between 15 and 10080),
  discovery_enabled boolean not null default true, real_submit_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade, job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id, job_id)
);
create table public.dismissed_jobs (
  user_id uuid not null references auth.users(id) on delete cascade, job_id uuid not null references public.jobs(id) on delete cascade,
  reason text, created_at timestamptz not null default now(), primary key(user_id, job_id)
);
create table public.job_matches (
  user_id uuid not null references auth.users(id) on delete cascade, job_id uuid not null references public.jobs(id) on delete cascade,
  score integer not null check(score between 0 and 100), reasons jsonb not null default '[]', gaps jsonb not null default '[]',
  computed_at timestamptz not null default now(), primary key(user_id, job_id)
);
create table public.search_history (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  query jsonb not null default '{}', result_count integer not null default 0, created_at timestamptz not null default now()
);
create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(), source_id uuid references public.job_sources(id), status text not null,
  cursor text, fetched_count integer not null default 0, inserted_count integer not null default 0, error text,
  started_at timestamptz not null default now(), completed_at timestamptz
);
create unique index if not exists ingestion_idempotency_idx on public.ingestion_runs(source_id, started_at);

alter table public.user_job_preferences enable row level security; alter table public.saved_jobs enable row level security;
alter table public.dismissed_jobs enable row level security; alter table public.job_matches enable row level security; alter table public.search_history enable row level security;
create policy "users own job preferences" on public.user_job_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own saved jobs" on public.saved_jobs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own dismissed jobs" on public.dismissed_jobs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own matches" on public.job_matches for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own search history" on public.search_history for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "authenticated users read job matches" on public.job_matches for select to authenticated using (user_id = auth.uid());

insert into storage.buckets(id, name, public) values ('resumes', 'resumes', false) on conflict (id) do update set public = false;
create policy "users manage own resume objects" on storage.objects for all using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

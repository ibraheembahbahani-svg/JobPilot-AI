-- Safe, non-user seed data for local/staging previews. Auth identities are
-- created separately so passwords never enter source control.
insert into public.job_sources (name, kind, permitted, adapter_key)
values ('Greenhouse demo', 'greenhouse', true, 'greenhouse:demo')
on conflict (adapter_key) do update set permitted = excluded.permitted;

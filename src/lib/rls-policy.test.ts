import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const sql = readFileSync(resolve(process.cwd(), 'supabase/migrations/0002_live_discovery.sql'), 'utf8');
describe('RLS isolation contract', () => { it('uses auth.uid ownership checks for every user-owned discovery table', () => { for (const table of ['user_job_preferences', 'saved_jobs', 'dismissed_jobs', 'job_matches', 'search_history']) { expect(sql).toContain(`alter table public.${table} enable row level security`); expect(sql).toContain(`user_id = auth.uid()`); } }); it('keeps resume storage private and scoped by user folder', () => { expect(sql).toContain("values ('resumes', 'resumes', false)"); expect(sql).toContain("storage.foldername(name))[1] = auth.uid()::text"); }); });

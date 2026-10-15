import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('operational safety contracts', () => {
  it('keeps queue tables and claim function service-role-only', () => {
    const sql = readFileSync('supabase/migrations/0003_operational_platform.sql', 'utf8');
    expect(sql).toContain('alter table public.worker_jobs enable row level security');
    expect(sql).toContain('revoke all on function public.claim_worker_jobs');
    expect(sql).toContain("status in ('pending','running','succeeded','dead')");
  });

  it('keeps real submission opt-in disabled at the database/API contract', () => {
    const sql = readFileSync('supabase/migrations/0002_live_discovery.sql', 'utf8');
    expect(sql).toContain('real_submit_opt_in boolean not null default false');
    expect(readFileSync('src/app/api/preferences/route.ts', 'utf8')).toContain('z.literal(false)');
  });
});

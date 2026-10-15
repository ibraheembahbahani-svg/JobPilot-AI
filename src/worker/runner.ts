import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { scoreJob } from '@/lib/matching';
import type { Job, Profile } from '@/lib/types';
import { postgresQueue, type QueueRecord } from './postgres-queue';
import { runIngestionCycle } from './queue';

function toJob(row: Record<string, unknown>): Job {
  return { id: String(row.id), source: String(row.source_name ?? 'unknown'), sourceUrl: String(row.source_url), externalId: String(row.external_id), title: String(row.title), company: String(row.company), location: row.location ? String(row.location) : undefined, arrangement: row.arrangement as Job['arrangement'], employmentType: row.employment_type ? String(row.employment_type) : undefined, skills: Array.isArray(row.skills) ? row.skills.map(String) : [], description: String(row.description ?? ''), postedAt: row.posted_at ? String(row.posted_at) : undefined, rawPayload: row.raw_payload };
}

async function scoreMatches(payload: Record<string, unknown>) {
  const admin = createSupabaseAdmin();
  const ids = Array.isArray(payload.jobIds) ? payload.jobIds.map(String) : [];
  if (!ids.length) return 0;
  const { data: jobs, error: jobError } = await admin.from('jobs').select('*, job_sources(name)').in('id', ids);
  if (jobError) throw jobError;
  const { data: preferences, error: preferenceError } = await admin.from('user_job_preferences').select('*').eq('discovery_enabled', true);
  if (preferenceError) throw preferenceError;
  let count = 0;
  for (const preference of preferences ?? []) {
    for (const row of jobs ?? []) {
      const result = scoreJob(toJob({ ...row, source_name: row.job_sources?.name }), { targetRoles: preference.target_roles ?? [], locations: preference.locations ?? [], salaryMin: preference.salary_min ?? undefined, skills: preference.skills ?? [] } satisfies Profile);
      const { error } = await admin.from('job_matches').upsert({ user_id: preference.user_id, job_id: row.id, score: result.score, reasons: result.reasons, gaps: result.gaps, computed_at: new Date().toISOString() });
      if (error) throw error;
      count += 1;
    }
  }
  return count;
}

async function processRecord(record: QueueRecord, queue: ReturnType<typeof postgresQueue>) {
  if (record.job_type === 'ingest_jobs') return runIngestionCycle(undefined, queue);
  if (record.job_type === 'score_matches') return scoreMatches(record.payload);
  if (record.job_type === 'send_notifications') return 0;
  if (record.job_type === 'prepare_review') return 0;
  throw new Error(`Unsupported worker job type: ${record.job_type}`);
}

export async function runWorkerOnce(workerId = `worker-${process.pid}`) {
  const queue = postgresQueue();
  await queue.health(workerId);
  const records = await queue.claim(workerId, 5);
  const results: { id: string; status: 'succeeded' | 'retrying' | 'dead' }[] = [];
  for (const record of records) {
    try { await processRecord(record, queue); await queue.complete(record.id); results.push({ id: record.id, status: 'succeeded' }); }
    catch (error) { await queue.fail(record.id, error instanceof Error ? error.message : 'Unknown worker error'); results.push({ id: record.id, status: record.attempts >= record.max_attempts ? 'dead' : 'retrying' }); }
  }
  return results;
}

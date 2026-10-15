import { createHash } from 'node:crypto';
import { greenhouseAdapter } from '@/lib/ingestion/greenhouse';
import { leverAdapter } from '@/lib/ingestion/lever';
import type { JobAdapter } from '@/lib/ingestion/types';
import type { Job } from '@/lib/types';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export type WorkerJob = 'ingest_jobs' | 'score_matches' | 'prepare_review' | 'send_notifications';
export type QueueClient = { enqueue: (job: WorkerJob, payload: Record<string, unknown>, options?: { idempotencyKey?: string; delayMs?: number }) => Promise<void> };
export const localQueue: QueueClient = { async enqueue(job, payload) { console.info(JSON.stringify({ event: 'worker.enqueue', job, payload })); } };
export const configuredAdapters = (): JobAdapter[] => { const adapters: JobAdapter[] = []; if (process.env.GREENHOUSE_BOARDS) process.env.GREENHOUSE_BOARDS.split(',').map((x) => x.trim()).filter(Boolean).forEach((board) => adapters.push(greenhouseAdapter(board))); if (process.env.LEVER_COMPANIES) process.env.LEVER_COMPANIES.split(',').map((x) => x.trim()).filter(Boolean).forEach((company) => adapters.push(leverAdapter(company))); return adapters; };

export async function runIngestionCycle(adapters = configuredAdapters(), queue: QueueClient = localQueue) {
  const results: { source: string; fetched: number; inserted: number; error?: string }[] = [];
  for (const adapter of adapters) {
    let cursor: string | undefined; let pages = 0; let fetched = 0; let inserted = 0;
    try {
      do { const page = await adapter.fetchPage(cursor); pages++; fetched += page.jobs.length; inserted += await persistJobs(page.jobs); await queue.enqueue('score_matches', { source: page.source, jobIds: page.jobs.map((job) => job.id) }, { idempotencyKey: `score:${page.source}:${cursor || 'first'}` }); cursor = page.nextCursor; } while (cursor && pages < 100);
      results.push({ source: adapter.source, fetched, inserted });
    } catch (error) { const message = error instanceof Error ? error.message : 'Unknown ingestion error'; console.error(JSON.stringify({ event: 'worker.ingestion_failed', source: adapter.source, message })); results.push({ source: adapter.source, fetched, inserted, error: message }); }
  }
  return results;
}

async function persistJobs(jobs: Job[]) {
  if (!jobs.length || !process.env.SUPABASE_SERVICE_ROLE_KEY) return 0;
  const admin = createSupabaseAdmin(); const sourceName = jobs[0].source;
  const sourceResult = await admin.from('job_sources').upsert({ name: sourceName, kind: sourceName.split(':')[0], permitted: true, adapter_key: sourceName }, { onConflict: 'adapter_key' }).select('id').single();
  if (sourceResult.error) throw sourceResult.error; const sourceId = sourceResult.data.id;
  const rows = jobs.map((job) => ({ source_id: sourceId, external_id: job.externalId, source_url: job.sourceUrl, title: job.title, company: job.company, normalized_company: job.company.toLowerCase().trim(), location: job.location, arrangement: job.arrangement, employment_type: job.employmentType, skills: job.skills, description: job.description, posted_at: job.postedAt, raw_payload: job.rawPayload || {}, content_hash: createHash('sha256').update(`${job.source}:${job.externalId}:${job.title}:${job.description}`).digest('hex'), canonical_key: `${job.company.toLowerCase().trim()}:${job.title.toLowerCase().trim()}:${(job.location || '').toLowerCase().trim()}`, last_seen_at: new Date().toISOString() }));
  const { data, error } = await admin.from('jobs').upsert(rows, { onConflict: 'source_id,external_id', ignoreDuplicates: false }).select('id'); if (error) throw error; return data?.length || 0;
}

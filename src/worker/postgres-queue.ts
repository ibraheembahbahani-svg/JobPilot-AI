import { createSupabaseAdmin } from '@/lib/supabase/admin';
import type { QueueClient, WorkerJob } from './queue';

export type QueueRecord = {
  id: string;
  job_type: WorkerJob;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
  status: 'pending' | 'running' | 'succeeded' | 'dead';
};

const backoffMs = (attempt: number) => Math.min(60 * 60 * 1000, 1000 * 2 ** Math.max(0, attempt - 1));

export function postgresQueue(): QueueClient & {
  claim(workerId: string, limit?: number): Promise<QueueRecord[]>;
  complete(id: string): Promise<void>;
  fail(id: string, error: string): Promise<void>;
  health(workerId: string): Promise<void>;
} {
  const admin = createSupabaseAdmin();
  return {
    async enqueue(job, payload, options = {}) {
      const idempotencyKey = options.idempotencyKey ?? `${job}:${JSON.stringify(payload)}`;
      const { error } = await admin.from('worker_jobs').upsert({
        job_type: job, payload, idempotency_key: idempotencyKey,
        run_after: new Date(Date.now() + (options.delayMs ?? 0)).toISOString()
      }, { onConflict: 'idempotency_key', ignoreDuplicates: true });
      if (error) throw error;
    },
    async claim(workerId, limit = 5) {
      const { data, error } = await admin.rpc('claim_worker_jobs', { p_worker_id: workerId, p_limit: limit });
      if (error) throw error;
      return (data ?? []) as QueueRecord[];
    },
    async complete(id) {
      const { error } = await admin.from('worker_jobs').update({ status: 'succeeded', completed_at: new Date().toISOString(), locked_at: null }).eq('id', id);
      if (error) throw error;
    },
    async fail(id, message) {
      const { data, error } = await admin.from('worker_jobs').select('attempts,max_attempts').eq('id', id).single();
      if (error) throw error;
      const dead = data.attempts >= data.max_attempts;
      const update = dead ? { status: 'dead', last_error: message, locked_at: null } : { status: 'pending', last_error: message, locked_at: null, run_after: new Date(Date.now() + backoffMs(data.attempts)).toISOString() };
      const result = await admin.from('worker_jobs').update(update).eq('id', id);
      if (result.error) throw result.error;
    },
    async health(workerId) {
      const { error } = await admin.from('worker_health').upsert({ worker_id: workerId, last_seen_at: new Date().toISOString() });
      if (error) throw error;
    }
  };
}

import { NextResponse } from 'next/server';
import { createQueue } from '@/worker/queue';
import { rateLimit } from '@/lib/rate-limit';
export async function POST(request: Request) {
  if (request.headers.get('x-worker-secret') !== process.env.WORKER_SECRET || !process.env.WORKER_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const limit = rateLimit('worker-scheduler', 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  const queue = createQueue();
  await queue.enqueue('ingest_jobs', { requestedAt: new Date().toISOString() }, { idempotencyKey: `ingest:${new Date().toISOString().slice(0, 13)}` });
  return NextResponse.json({ queued: true, mode: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'durable' : 'local-dev' });
}

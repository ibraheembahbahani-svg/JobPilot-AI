import { NextResponse } from 'next/server';
import { createQueue } from '@/worker/queue';
export async function POST(request: Request) {
  if (request.headers.get('x-worker-secret') !== process.env.WORKER_SECRET || !process.env.WORKER_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const queue = createQueue();
  await queue.enqueue('ingest_jobs', { requestedAt: new Date().toISOString() }, { idempotencyKey: `ingest:${new Date().toISOString().slice(0, 13)}` });
  return NextResponse.json({ queued: true, mode: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'durable' : 'local-dev' });
}

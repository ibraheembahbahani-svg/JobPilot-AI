import { NextResponse } from 'next/server';
import { runWorkerOnce } from '@/worker/runner';
import { rateLimit } from '@/lib/rate-limit';
export async function POST(request: Request) {
  if (!process.env.WORKER_SECRET || request.headers.get('x-worker-secret') !== process.env.WORKER_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!rateLimit('worker-run', 20, 60_000).allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Worker is not configured' }, { status: 503 });
  return NextResponse.json({ processed: await runWorkerOnce(request.headers.get('x-worker-id') || undefined) });
}

import { NextResponse } from 'next/server';
import { runIngestionCycle } from '@/worker/queue';
export async function POST(request: Request) { if (request.headers.get('x-worker-secret') !== process.env.WORKER_SECRET || !process.env.WORKER_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const jobs = await runIngestionCycle(); return NextResponse.json({ queued: jobs.length }); }

import { NextResponse } from 'next/server';

export async function GET() {
  const hasPublicConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasWorkerConfig = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.WORKER_SECRET);
  const status = hasPublicConfig && hasWorkerConfig ? 'ok' : 'degraded';
  return NextResponse.json({ status, checks: { publicConfig: hasPublicConfig, workerConfig: hasWorkerConfig, realSubmission: false }, timestamp: new Date().toISOString() }, { status: status === 'ok' ? 200 : 503, headers: { 'cache-control': 'no-store' } });
}

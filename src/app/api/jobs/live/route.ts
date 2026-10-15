import { NextResponse } from 'next/server';
import { greenhouseAdapter } from '@/lib/ingestion/greenhouse';
import { leverAdapter } from '@/lib/ingestion/lever';

export async function GET(request: Request) {
  const url = new URL(request.url); const source = url.searchParams.get('source'); const board = url.searchParams.get('board');
  const adapter = source === 'greenhouse' && board ? greenhouseAdapter(board) : source === 'lever' && board ? leverAdapter(board) : null;
  if (!adapter) return NextResponse.json({ error: 'Provide source=greenhouse|lever and board=<public board/company slug>.' }, { status: 400 });
  try { const page = await adapter.fetchPage(url.searchParams.get('cursor') || undefined); return NextResponse.json({ mode: 'live', ...page }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Live source unavailable' }, { status: 502 }); }
}

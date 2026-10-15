import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({})); const { id } = await params; const { error } = await supabase.from('dismissed_jobs').upsert({ user_id: user.id, job_id: id, reason: typeof body.reason === 'string' ? body.reason.slice(0, 200) : null }); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ dismissed: true });
}

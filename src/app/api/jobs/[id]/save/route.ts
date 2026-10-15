import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params; const { error } = await supabase.from('saved_jobs').upsert({ user_id: user.id, job_id: id }); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ saved: true });
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params; const { error } = await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', id); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ saved: false });
}

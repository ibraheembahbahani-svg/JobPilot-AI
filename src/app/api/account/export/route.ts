import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [profile, resumes, applications, events] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('resume_assets').select('id,original_name,sha256,created_at').eq('user_id', user.id),
    supabase.from('applications').select('*').eq('user_id', user.id),
    supabase.from('audit_events').select('*').eq('user_id', user.id)
  ]);
  return NextResponse.json({ user: { id: user.id, email: user.email }, profile: profile.data, resumes: resumes.data, applications: applications.data, auditEvents: events.data });
}

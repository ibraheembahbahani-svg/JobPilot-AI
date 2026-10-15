import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const confirmation = (await request.json().catch(() => ({})) as { confirmation?: string }).confirmation;
  if (confirmation !== 'DELETE MY ACCOUNT') return NextResponse.json({ error: 'Explicit confirmation is required.' }, { status: 400 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Deletion service is not configured.' }, { status: 503 });
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: assets } = await admin.from('resume_assets').select('storage_path').eq('user_id', user.id);
  if (assets?.length) await admin.storage.from('resumes').remove(assets.map((asset) => asset.storage_path));
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}

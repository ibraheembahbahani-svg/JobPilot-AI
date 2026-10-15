import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim();
  const location = url.searchParams.get('location')?.trim();
  const arrangement = url.searchParams.get('arrangement');
  const employmentType = url.searchParams.get('employment_type');
  const sort = url.searchParams.get('sort') === 'score' ? 'score' : 'freshness';
  let query = supabase.from('jobs').select('*, job_sources!inner(name,permitted), job_matches(score,reasons,gaps)').eq('job_sources.permitted', true).limit(50);
  if (q) query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%,description.ilike.%${q}%`);
  if (location) query = query.ilike('location', `%${location}%`);
  if (arrangement && ['remote', 'hybrid', 'onsite'].includes(arrangement)) query = query.eq('arrangement', arrangement);
  if (employmentType) query = query.eq('employment_type', employmentType);
  if (sort === 'freshness') query = query.order('posted_at', { ascending: false, nullsFirst: false });
  else query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from('search_history').insert({ user_id: user.id, query: Object.fromEntries(url.searchParams), result_count: data?.length ?? 0 });
  return NextResponse.json({ jobs: data ?? [], mode: 'live' });
}

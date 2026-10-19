import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const errorDescription = url.searchParams.get('error_description');
  const code = url.searchParams.get('code');
  const requestedNext = url.searchParams.get('next');
  const safeNext = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/dashboard';
  if (errorDescription) return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(errorDescription)}`, url.origin));
  if (!code) return NextResponse.redirect(new URL('/auth?error=Missing%20authentication%20code', url.origin));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(`Could not establish your session: ${error.message}`)}`, url.origin));
  return NextResponse.redirect(new URL(safeNext, url.origin));
}

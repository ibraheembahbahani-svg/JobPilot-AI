import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return response;
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { getAll: () => request.cookies.getAll(), setAll: (values) => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) } });
  const { data: { user } } = await supabase.auth.getUser();
  const protectedPath = ['/dashboard', '/profile', '/applications', '/settings', '/jobs'].some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`));
  if (protectedPath && !user) { const redirect = request.nextUrl.clone(); redirect.pathname = '/auth'; redirect.searchParams.set('next', request.nextUrl.pathname); return NextResponse.redirect(redirect); }
  return response;
}

export const config = { matcher: ['/dashboard/:path*', '/profile/:path*', '/applications/:path*', '/settings/:path*', '/jobs/:path*', '/api/account/:path*', '/api/profile/:path*', '/api/preferences/:path*', '/api/resumes/:path*'] };

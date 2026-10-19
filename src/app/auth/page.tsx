import { Suspense } from 'react';
import AuthForm from './auth-form';
type Mode = 'magic' | 'password' | 'signup' | 'recovery';
export default async function AuthPage({ searchParams }: { searchParams: Promise<{ mode?: string; next?: string; error?: string }> }) { const params = await searchParams; const mode = ['magic', 'password', 'signup', 'recovery'].includes(params.mode ?? '') ? params.mode as Mode : 'magic'; const next = params.next?.startsWith('/') && !params.next.startsWith('//') ? params.next : '/dashboard'; return <Suspense><AuthForm initialMode={mode} nextPath={next} initialError={params.error ?? ''} /></Suspense>; }

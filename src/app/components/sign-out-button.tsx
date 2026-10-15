'use client';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
export function SignOutButton() { const router=useRouter(); async function signOut() { if (!process.env.NEXT_PUBLIC_SUPABASE_URL) { router.push('/'); return; } await createSupabaseBrowserClient().auth.signOut(); router.push('/'); } return <button className="btn-outline" onClick={signOut}>Sign out</button>; }

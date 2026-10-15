'use client';
import { useState } from 'react';

export function JobActions({ id }: { id: string }) {
  const [state, setState] = useState<'idle' | 'saved' | 'dismissed'>('idle');
  async function act(action: 'save' | 'dismiss') {
    const response = await fetch(`/api/jobs/${id}/${action}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: action === 'dismiss' ? JSON.stringify({ reason: 'User dismissed' }) : undefined });
    if (response.ok) setState(action === 'save' ? 'saved' : 'dismissed');
  }
  if (state === 'dismissed') return <span className="text-xs text-slate-400">Dismissed</span>;
  return <div className="flex gap-2"><button className="btn-outline" onClick={() => act('save')}>{state === 'saved' ? 'Saved' : 'Save job'}</button><button className="text-xs text-slate-400" onClick={() => act('dismiss')}>Dismiss</button></div>;
}

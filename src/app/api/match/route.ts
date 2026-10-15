import { NextResponse } from 'next/server';
import { scoreJob } from '@/lib/matching';
import type { Job, Profile } from '@/lib/types';
export async function POST(request: Request) { const body = await request.json() as { job: Job; profile: Profile }; return NextResponse.json(scoreJob(body.job, body.profile)); }

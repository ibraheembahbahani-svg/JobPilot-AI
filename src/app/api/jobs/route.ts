import { NextResponse } from 'next/server';
import { deduplicateFreshJobs, mockSource } from '@/lib/mock-ingestion';
export async function GET() { const jobs = deduplicateFreshJobs(await mockSource.fetchJobs()); return NextResponse.json({ jobs, mode: 'mock', realSourcesEnabled: false }); }

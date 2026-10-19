import { createSupabaseServerClient } from '@/lib/supabase/server';
import { mockSource } from '@/lib/mock-ingestion';
import JobsClient from './jobs-client';
import type { Job } from '@/lib/types';

export default async function JobsPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return <JobsClient initialJobs={await mockSource.fetchJobs()} initialMode="mock" />;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <JobsClient initialJobs={[]} initialMode="live" />;
  const { data } = await supabase.from('jobs').select('id,title,company,location,description,skills,source_url,posted_at').order('posted_at', { ascending: false, nullsFirst: false }).limit(50);
  const jobs: Job[] = (data ?? []).map((job) => ({ id: job.id, source: 'persisted', sourceUrl: job.source_url, externalId: job.id, title: job.title, company: job.company, location: job.location ?? undefined, skills: job.skills ?? [], description: job.description ?? '', postedAt: job.posted_at ?? undefined }));
  return <JobsClient initialJobs={jobs} initialMode="live" />;
}

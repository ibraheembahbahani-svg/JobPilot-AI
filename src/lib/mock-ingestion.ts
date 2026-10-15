import type { Job } from './types';

export type JobSourceAdapter = { name: string; permitted: boolean; fetchJobs: () => Promise<Job[]> };

export const mockSource: JobSourceAdapter = {
  name: 'Mock ATS feed', permitted: true,
  async fetchJobs() { return [
    { id: 'mock-1', source: 'Mock ATS feed', sourceUrl: 'https://example.com/jobs/mock-1', externalId: 'mock-1', title: 'Data Science Intern', company: 'Northstar Analytics', location: 'Dallas, TX', arrangement: 'hybrid', salaryMin: 60000, salaryMax: 72000, skills: ['Python', 'SQL', 'Data Analysis'], description: 'Illustrative sandbox listing.', postedAt: new Date().toISOString() },
    { id: 'mock-2', source: 'Mock ATS feed', sourceUrl: 'https://example.com/jobs/mock-2', externalId: 'mock-2', title: 'Mechanical Engineering Intern', company: 'Vector Mobility', location: 'Plano, TX', arrangement: 'onsite', salaryMin: 58000, salaryMax: 65000, skills: ['CAD', 'SolidWorks'], description: 'Illustrative sandbox listing.', postedAt: new Date().toISOString() }
  ]; }
};

export function deduplicateFreshJobs(jobs: Job[], now = Date.now()) {
  const seen = new Set<string>();
  return jobs.filter((job) => { const key = `${job.source}:${job.externalId}`; const postedAt = job.postedAt ? new Date(job.postedAt).getTime() : undefined; const fresh = postedAt === undefined || now - postedAt < 1000 * 60 * 60 * 24 * 30; if (seen.has(key) || !fresh) return false; seen.add(key); return true; });
}

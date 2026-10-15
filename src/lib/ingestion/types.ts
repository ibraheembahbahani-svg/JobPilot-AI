import type { Job } from '@/lib/types';
export type IngestionPage = { jobs: Job[]; nextCursor?: string; source: string };
export type JobAdapter = { source: string; fetchPage: (cursor?: string) => Promise<IngestionPage> };

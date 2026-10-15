import { deduplicateFreshJobs, mockSource } from '@/lib/mock-ingestion';
export type WorkerJob = 'ingest_jobs' | 'score_matches' | 'prepare_review' | 'send_notifications';
export type QueueClient = { enqueue: (job: WorkerJob, payload: Record<string, unknown>) => Promise<void> };
export const localQueue: QueueClient = { async enqueue(job, payload) { console.info(`[worker:${job}]`, payload); } };
export async function runIngestionCycle(queue: QueueClient = localQueue) { const jobs = deduplicateFreshJobs(await mockSource.fetchJobs()); await queue.enqueue('score_matches', { jobIds: jobs.map((job) => job.id) }); return jobs; }

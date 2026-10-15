import { describe, expect, it } from 'vitest';
import { deduplicateFreshJobs } from './mock-ingestion';
import type { Job } from './types';

const job = (externalId: string, postedAt = new Date().toISOString()): Job => ({ id: externalId, source: 'test', sourceUrl: 'https://example.test/jobs/' + externalId, externalId, title: 'Test role', company: 'Test Co', location: 'Remote', arrangement: 'remote', skills: [], description: '', postedAt });

describe('job ingestion safety', () => {
  it('deduplicates by source and external id while retaining fresh jobs', () => {
    expect(deduplicateFreshJobs([job('a'), job('a'), job('b')])).toHaveLength(2);
  });
  it('drops jobs older than the freshness window', () => {
    expect(deduplicateFreshJobs([job('old', new Date(Date.now() - 31 * 86400000).toISOString())])).toHaveLength(0);
  });
});

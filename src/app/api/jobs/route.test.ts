import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('jobs API integration', () => {
  it('returns source-attributed mock jobs and keeps real sources disabled', async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.mode).toBe('mock');
    expect(body.realSourcesEnabled).toBe(false);
    expect(body.jobs[0]).toHaveProperty('sourceUrl');
  });
});

import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('worker security', () => {
  it('rejects requests without the worker secret', async () => {
    const previous = process.env.WORKER_SECRET;
    delete process.env.WORKER_SECRET;
    const response = await POST(new Request('http://localhost/api/worker'));
    expect(response.status).toBe(401);
    if (previous) process.env.WORKER_SECRET = previous;
  });
});

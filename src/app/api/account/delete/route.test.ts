import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('account deletion security', () => {
  it('requires the exact destructive confirmation phrase', async () => {
    const response = await POST(new Request('http://localhost/api/account/delete', { method: 'POST', body: JSON.stringify({ confirmation: 'delete' }) }));
    expect(response.status).toBe(400);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { leverAdapter } from './lever';
describe('Lever adapter', () => { it('preserves missing location and timestamp', async () => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: '1', text: 'Role', hostedUrl: 'https://example.test/1', descriptionPlain: 'Description', categories: {} }] })); const page = await leverAdapter('demo').fetchPage(); expect(page.jobs[0].location).toBeUndefined(); expect(page.jobs[0].postedAt).toBeUndefined(); vi.unstubAllGlobals(); }); });

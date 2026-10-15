import { afterEach, describe, expect, it } from 'vitest';
import { rateLimit, resetRateLimits } from './rate-limit';
afterEach(resetRateLimits);
describe('rateLimit', () => {
  it('limits a caller within a window and resets after expiry', () => {
    expect(rateLimit('user:1', 2, 1000, 0).allowed).toBe(true);
    expect(rateLimit('user:1', 2, 1000, 1).allowed).toBe(true);
    expect(rateLimit('user:1', 2, 1000, 2).allowed).toBe(false);
    expect(rateLimit('user:1', 2, 1000, 1001).allowed).toBe(true);
  });
});

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 2000;

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const existing = buckets.get(key);
  const bucket = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + windowMs } : existing;
  bucket.count += 1;
  if (buckets.size > MAX_BUCKETS) buckets.forEach((value, candidate) => { if (value.resetAt <= now) buckets.delete(candidate); });
  buckets.set(key, bucket);
  return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

export function resetRateLimits() { buckets.clear(); }

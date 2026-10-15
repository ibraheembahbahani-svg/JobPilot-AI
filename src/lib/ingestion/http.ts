export async function fetchJson<T>(url: string, options: RequestInit = {}, config: { retries?: number; timeoutMs?: number; minIntervalMs?: number } = {}) {
  const retries = config.retries ?? 2, timeoutMs = config.timeoutMs ?? 10000;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal, headers: { accept: 'application/json', 'user-agent': 'JobPilotAI/0.1 (+permitted-public-feed)', ...options.headers } });
      if (response.ok) return await response.json() as T;
      if (![408, 425, 429, 500, 502, 503, 504].includes(response.status) || attempt === retries) throw new Error(`Job source returned HTTP ${response.status}`);
      const retryAfter = Number(response.headers.get('retry-after') || 0); await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 250 * 2 ** attempt)));
    } finally { clearTimeout(timeout); }
  }
  throw new Error('Job source request failed');
}

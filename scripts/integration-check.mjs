const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'TEST_USER_A_EMAIL', 'TEST_USER_A_PASSWORD', 'TEST_USER_B_EMAIL', 'TEST_USER_B_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  const message = `Supabase integration test requires ${missing.join(', ')}`;
  if (process.env.REQUIRE_STAGING_INTEGRATION === 'true') {
    console.error(`FAIL: ${message}. Staging verification is mandatory.`);
    process.exit(1);
  }
  console.log(`SKIP: ${message}. Run with REQUIRE_STAGING_INTEGRATION=true to make this a release failure.`);
  process.exit(0);
}
const { createClient } = await import('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
const users = [];
for (const suffix of ['A', 'B']) {
  const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({ email: process.env[`TEST_USER_${suffix}_EMAIL`], password: process.env[`TEST_USER_${suffix}_PASSWORD`] });
  if (error || !data.user) throw new Error(`Could not sign in test user ${suffix}: ${error?.message ?? 'missing user'}`);
  users.push({ client, user: data.user });
}
const [a, b] = users;
const own = await a.client.from('user_job_preferences').select('*').eq('user_id', b.user.id);
if (own.error) throw own.error;
if ((own.data ?? []).length) throw new Error('RLS isolation failed: user A can read user B preferences');
const objectPath = `${a.user.id}/integration-check.txt`;
const uploaded = await a.client.storage.from('resumes').upload(objectPath, new Blob(['integration check']), { contentType: 'text/plain', upsert: true });
if (uploaded.error) throw new Error(`Private resume upload failed: ${uploaded.error.message}`);
const forbidden = await b.client.storage.from('resumes').download(objectPath);
if (!forbidden.error) throw new Error('Storage isolation failed: user B downloaded user A resume');
const removed = await service.storage.from('resumes').remove([objectPath]);
if (removed.error) throw new Error(`Integration cleanup failed: ${removed.error.message}`);
const inserted = await service.from('worker_jobs').insert({ job_type: 'ingest_jobs', payload: { integration: true }, idempotency_key: `integration:${Date.now()}` }).select('id').single();
if (inserted.error) throw inserted.error;
console.log('PASS: two-account RLS isolation and service-role queue persistence verified');

import { readFile } from 'node:fs/promises';

const files = ['0001_initial.sql', '0002_live_discovery.sql', '0003_operational_platform.sql'];
for (const file of files) {
  const sql = await readFile(`supabase/migrations/${file}`, 'utf8');
  if (!sql.trim().endsWith(';')) throw new Error(`${file} does not end with a statement terminator`);
  if (!/enable row level security/i.test(sql)) throw new Error(`${file} does not enable RLS`);
  if (/SUPABASE_SERVICE_ROLE_KEY|service_role_key/i.test(sql)) throw new Error(`${file} contains a secret-like service role reference`);
}
const operational = await readFile('supabase/migrations/0003_operational_platform.sql', 'utf8');
for (const required of ['claim_worker_jobs', 'worker_jobs', 'notification_preferences']) {
  if (!operational.includes(required)) throw new Error(`0003 missing ${required}`);
}
console.log(`PASS: validated migration order and safety markers for ${files.join(', ')}`);

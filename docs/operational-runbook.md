# JobPilot AI operational runbook

## Staging database

Create a Supabase staging project, apply `supabase/migrations/0001_initial.sql`, `0002_live_discovery.sql`, and `0003_operational_platform.sql` in order, then set the variables in `.env.example`. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Configure two test accounts and run `npm run test:integration` with the six `TEST_USER_*` variables. The integration test verifies cross-user preference isolation and service-role queue persistence; storage policy checks should be run from the Supabase SQL editor with the same two users before production rollout.

## Worker deployment

The queue is Postgres-backed, so it works with a scheduled HTTP call or a small long-running worker on Render, Fly.io, Railway, or a container platform. Call `POST /api/worker` with `x-worker-secret` from a scheduler at the configured discovery interval. A worker process should claim `worker_jobs` through `claim_worker_jobs`, process each item, then call the queue `complete` or `fail` operation. Failed jobs retry with exponential backoff and become `dead` after five attempts. Add an alert on `worker_jobs.status = 'dead'` and stale `worker_health.last_seen_at`.

This avoids a separate queue vendor at MVP scale, but Postgres compute and scheduled invocations are still billable and have connection/throughput limits. Move to Redis/BullMQ or a managed queue when job volume or concurrency outgrows the database.

## Notifications and submissions

Notification preferences and in-app notifications are persisted, but no email provider is configured by default. Email delivery requires an approved provider, sender domain, recipient consent, and server-only credentials. Real job submission remains disabled (`real_submit_opt_in` is constrained to false); only authorized source integrations may be added later with explicit user scope, duplicate protection, truthful answers, and receipts.

## Security checks

Run `npm audit` and review the full report with `npm run audit:full`. The current dependency tree still reports five high-severity `braces` findings through the Next lint dependency chain; the critical-only CI gate is not evidence that all high findings are resolved. Do not expose service-role keys, and do not place unknown or protected application questions into automatic submission.

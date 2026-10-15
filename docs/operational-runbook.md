# JobPilot AI operational runbook

## Staging database

Create a dedicated Supabase staging project, set its URL and anon key, and apply the migrations in order with `supabase db push --db-url "$STAGING_DATABASE_URL"` or the Supabase SQL editor. Run `npm run db:validate` first and `supabase db reset` locally to exercise `supabase/config.toml` and `supabase/seed.sql`. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Configure two test accounts and run `npm run test:integration:required` with the seven staging variables. The integration test verifies cross-user preference isolation, private resume upload, forbidden cross-user download, cleanup, and queue persistence. Account export/deletion must be smoke-tested from the deployed staging app because those operations are destructive.

## Hosting

Create separate Vercel projects or environments for staging and production. Set the staging project’s default `*.vercel.app` URL as `APP_URL`, expose only `NEXT_PUBLIC_*` values to the browser, and configure service-role, worker, OpenAI, and email secrets only as server environment variables. Deploy a preview, verify `/api/health`, then test sign-up, login, resume upload, job discovery, and dashboard flows against the reachable preview URL. A successful build is not a deployment confirmation.

## Worker deployment

The queue is Postgres-backed, so it works with a scheduled HTTP call or a small long-running worker on Render, Fly.io, Railway, or a container platform. Call `POST /api/worker` with `x-worker-secret` from a scheduler, then call `POST /api/worker/run` from a worker or scheduled container. The worker claims `worker_jobs`, performs ingestion or scoring, and records success/retry/dead state. Failed jobs retry with exponential backoff and become `dead` after five attempts. Add an alert on `worker_jobs.status = 'dead'` and stale `worker_health.last_seen_at`.

This avoids a separate queue vendor at MVP scale, but Postgres compute and scheduled invocations are still billable and have connection/throughput limits. Move to Redis/BullMQ or a managed queue when job volume or concurrency outgrows the database.

## Notifications and submissions

Notification preferences and in-app notifications are persisted, but no email provider is configured by default. Email delivery requires an approved provider, sender domain, recipient consent, and server-only credentials. Real job submission remains disabled (`real_submit_opt_in` is constrained to false); only authorized source integrations may be added later with explicit user scope, duplicate protection, truthful answers, and receipts.

## Security checks

Run `npm audit` and review the full report with `npm run audit:full`. The current dependency tree still reports five high-severity `braces` findings through the Next lint dependency chain; the critical-only CI gate is not evidence that all high findings are resolved. Do not expose service-role keys, and do not place unknown or protected application questions into automatic submission.

# JobPilot AI operational runbook

## Staging database

Create a dedicated Supabase staging project, set its URL and anon key, and apply the migrations in order with `supabase db push --db-url "$STAGING_DATABASE_URL"` or the Supabase SQL editor. Run `npm run db:validate` first and `supabase db reset` locally to exercise `supabase/config.toml` and `supabase/seed.sql`. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Configure two test accounts and run `npm run test:integration:required` with the seven staging variables. The integration test verifies cross-user preference isolation, private resume upload, forbidden cross-user download, cleanup, and queue persistence. Account export/deletion must be smoke-tested from the deployed staging app because those operations are destructive.

## Hosting and Vercel deployment

Use separate Vercel Preview/Staging and Production environments. From a machine authenticated to the Vercel team, link the repository without committing generated files:

```sh
vercel login
vercel link
vercel pull --environment=preview
vercel deploy
```

For the Git-based workflow, connect `ibraheembahbahani-svg/JobPilot-AI` in Vercel, set the Sprint 5.1 branch as the preview branch, and wait for the deployment to finish. The resulting deployment URL—not the Git branch page—is the URL to test. Promote only the verified commit after the preview smoke tests pass; never use `--force` or put secrets in the repository.

Configure these variables in Vercel’s Preview and Production environments separately. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `APP_URL` are the only browser-visible values. Keep `SUPABASE_SERVICE_ROLE_KEY`, `WORKER_SECRET`, `OPENAI_API_KEY`, provider credentials, and test-account credentials server-side; do not add them to `NEXT_PUBLIC_*` variables or client code.

In Supabase Authentication → URL Configuration, set the matching Site URL for each environment and add only the exact callback URLs:

```text
https://<staging-deployment>.vercel.app/auth/callback
https://<production-domain>/auth/callback
http://localhost:3000/auth/callback
```

The application exchanges PKCE codes at `/auth/callback` and redirects only to a safe relative path. Verify `/api/health`, sign-up, password login, magic-link callback, logout, profile persistence, private resume operations, settings persistence, live job-search errors, and `/sandbox` separately. Vercel Deployment Protection must either permit the authorized staging testers or be disabled only for the dedicated public smoke-test deployment; do not claim a deployment is reachable while it redirects to a Vercel login wall.

The current production URL `https://job-pilot-ai-wheat.vercel.app/` still serves the previous build and must not be reported as fixed until its response contains the Sprint 5.1 sandbox/auth changes and browser smoke tests pass. A successful build or a Vercel deployment record is not a deployment confirmation.

## Worker deployment

The queue is Postgres-backed, so it works with a scheduled HTTP call or a small long-running worker on Render, Fly.io, Railway, or a container platform. Call `POST /api/worker` with `x-worker-secret` from a scheduler, then call `POST /api/worker/run` from a worker or scheduled container. The worker claims `worker_jobs`, performs ingestion or scoring, and records success/retry/dead state. Failed jobs retry with exponential backoff and become `dead` after five attempts. Add an alert on `worker_jobs.status = 'dead'` and stale `worker_health.last_seen_at`.

This avoids a separate queue vendor at MVP scale, but Postgres compute and scheduled invocations are still billable and have connection/throughput limits. Move to Redis/BullMQ or a managed queue when job volume or concurrency outgrows the database.

## Notifications and submissions

Notification preferences and in-app notifications are persisted, but no email provider is configured by default. Email delivery requires an approved provider, sender domain, recipient consent, and server-only credentials. Real job submission remains disabled (`real_submit_opt_in` is constrained to false); only authorized source integrations may be added later with explicit user scope, duplicate protection, truthful answers, and receipts.

## Security checks

Run `npm audit` and review the full report with `npm run audit:full`. The current dependency tree still reports five high-severity `braces` findings through the Next lint dependency chain; the critical-only CI gate is not evidence that all high findings are resolved. Do not expose service-role keys, and do not place unknown or protected application questions into automatic submission.

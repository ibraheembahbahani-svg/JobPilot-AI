# JobPilot AI

Production-oriented foundation for a consent-first, multi-user job discovery and application platform. The original browser MVP files remain in the repository as the visual reference; the running app is the typed Next.js implementation under `src/`.

## Local setup

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add a Supabase project URL and anon key for real auth/data, or leave them blank to use the local UI sandbox.
5. Apply `supabase/migrations/0001_initial.sql` through the Supabase CLI or SQL editor.
6. Run `npm run dev` and open `http://localhost:3000`.

Useful checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run e2e`.

`npm run audit` runs the dependency audit with a critical-severity gate. The current audit reports five high-severity `braces` findings inherited through `eslint-config-next`/`fast-glob`; npm has no patched `braces` release beyond 3.0.3, so this residual development-tooling issue is surfaced rather than hidden and should be revisited when the dependency chain changes.

## Architecture

- Next.js App Router + TypeScript + Tailwind for the web UI.
- Supabase Auth, Postgres, Storage, and row-level security. User-owned tables require `auth.uid()` equality; jobs and permitted sources are readable to authenticated users.
- `src/lib/mock-ingestion.ts` is the only enabled source adapter. It is intentionally labeled mocked and uses deterministic freshness/deduplication.
- `src/lib/matching.ts` is an interpretable baseline matcher. The OpenAI boundary in `src/lib/openai.ts` is present for a future structured matcher/tailoring service; it is not called without an API key.
- `src/worker/queue.ts` defines the queue contract. Replace `localQueue` with a managed worker provider and keep the worker secret server-side.
- `src/lib/ingestion/greenhouse.ts` and `src/lib/ingestion/lever.ts` use documented public ATS endpoints, retain source URLs, paginate where supported, retry transient failures, and leave unknown timestamps/locations unset.
- `src/lib/application-state.ts` centralizes legal application transitions and hard safety gates.

Sprint 3 adds `supabase/migrations/0002_live_discovery.sql` for preferences, saved/dismissed jobs, matches, search history, ingestion runs, indexes, private resume storage, and RLS. Set `GREENHOUSE_BOARDS` and/or `LEVER_COMPANIES` to enable worker adapter configuration; the browser dashboard remains visibly mocked unless a live endpoint is requested.

## Safety and production boundaries

Real auto-submit is off by default. A future submitter must require an authorized source integration, explicit user opt-in and scope, verified source receipt, idempotency, rate limits, and a user-scoped audit event. CAPTCHA, MFA, unknown answers, protected-sensitive questions, uncertain authorization, duplicate jobs, and any unsupported source route to human review. Mocked submissions never create employer receipts and remain visibly separate in the tracker.

Resume files and extracted profile data are sensitive. Use private Supabase Storage buckets, short-lived signed URLs, encryption at rest, retention/deletion workflows, and least-privilege service keys before handling real users.

## Still required before deployment

- Supabase project configuration, email provider, storage bucket policies, and production RLS verification.
- A permitted job source/ATS agreement and source-specific adapter implementation.
- A managed queue/worker, scheduler, notification provider, monitoring, rate limiting, and secret management.
- OpenAI API key plus an evaluated structured matching/tailoring prompt and human approval UX.
- Data export/deletion routes, billing/abuse controls, legal/privacy review, and end-to-end tests against staging integrations.

This repository is not claimed to be production-ready until those integrations, credentials, deployment controls, and staging tests are completed.

The worker is not continuously operational from this repository alone. Deploy `src/worker/queue.ts` behind a managed scheduler/queue, provide `WORKER_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`, add durable retry/concurrency controls, and verify ingestion runs in staging before calling discovery continuous.

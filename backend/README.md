# OneRun backend

NestJS API for the «Сводный рейс» demo.

## Deployment

- Production API: `https://onerun-production.up.railway.app/api`
- Health-check: `https://onerun-production.up.railway.app/api/health`
- Railway deploys the `feat/backend-core` branch with `backend/` as the service root.

## Local setup

```bash
cp .env.example .env
npm install
npm run start:dev
```

The API is served under `/api`; the health-check is `GET /api/health`.

## Database

Create a Supabase project, then apply SQL files in this order:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_persist_trip.sql`
3. `supabase/seed.sql`

`0001_initial_schema.sql` adds `orders` to the `supabase_realtime` publication.

## Environment

- `SUPABASE_URL` — Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY` — backend-only service role key.
- `ORS_API_KEY` — OpenRouteService key.
- `CORS_ORIGINS` — comma-separated frontend origins.
- `PORT` — HTTP port, defaults to `3000`.
- `LLM_PROVIDER`, `GEMINI_API_KEY` — consumed by the Backend-2 report module.

If `ORS_API_KEY` is absent or OpenRouteService cannot build a route, the
routing module returns deterministic straight-line geometry and applies the
configured detour factor. Production uses the HeiGIT OpenRouteService endpoint;
authenticated road geometry has been verified against the full demo route.

## Verification

```bash
npm test
npm run typecheck
npm run build
```

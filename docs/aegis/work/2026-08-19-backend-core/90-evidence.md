# Backend Core Evidence

## Slice 1: backend scaffold

- `npm test -- --runInBand`: 1 suite and 1 test passed.
- `npm run typecheck`: exited 0.
- `npm run build`: exited 0.
- Covered: NestJS compilation, health controller contract, TypeScript integrity.
- Uncovered: live Supabase, public deployment, and downstream feature modules.
- Confidence: B for the local scaffold.

## Slice 2: data and demo flow

- Nominatim returned real OSM-backed coordinates for all 11 required settlements.
- Mapper, pool threshold, and demo fixture tests pass.
- Demo total is 520 kg and crosses 500 kg only on the sixth order.
- Covered: local contracts, migration/seed artifacts, and deterministic demo data.
- Uncovered: applying SQL to a live Supabase project and observing Realtime.

## Slice 3: routing, pricing, and trips

- Nearest-neighbour, haversine, ORS failure fallback, pricing convergence, LIFO, trip mapping, report stub, and HTTP health contract tests pass.
- Trip persistence is grouped in the `persist_trip` PostgreSQL function.
- `GET /api/trips/:id` reads persisted rows and does not call external APIs.
- Covered: local logic and compile-time integration.
- Uncovered: live ORS road geometry, SQL execution in Supabase, Gemini implementation, and public deployment.
- Confidence: B for local implementation; C for external integration until credentials are configured.

## Slice 4: live Supabase and Railway integration

- Fresh local verification passed: 13 suites, 16 tests, typecheck, production build, and format check.
- Applied `0001_initial_schema.sql`, `0002_persist_trip.sql`, and `seed.sql` to the Supabase production project.
- Verification query returned 11 settlements, zero initial orders, `orders_realtime = true`, and `persist_trip_exists = true`.
- Public `GET https://onerun-production.up.railway.app/api/health` returned `200 {"status":"ok"}`.
- Six live `POST /api/demo/seed` calls produced 520 kg; `GET /api/pool` returned six orders and `isReady = true`.
- Live `POST /api/trips` persisted `TRIP-001`, routed all six orders, and allocated exactly 228475 KZT, matching rounded trip cost.
- Repeated `GET /api/trips/:id` returned identical route geometry and report content without a new routing/report call.
- Three consecutive live `POST /api/demo/reset` calls returned `{ "ok": true }`; afterwards orders and pool counts were zero, and the deleted trip returned HTTP 404.
- Covered: production database schema, Realtime publication membership, demo threshold, transactional persistence, public deployment, and cached readback.
- Uncovered: authenticated ORS road geometry (no `ORS_API_KEY`), Gemini/Backend-2, frontend Realtime rendering, and final CORS origin.
- Confidence: A for the live Backend-1 fallback path; C for the remaining external-owner integrations.

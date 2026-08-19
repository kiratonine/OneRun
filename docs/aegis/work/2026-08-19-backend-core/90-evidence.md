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

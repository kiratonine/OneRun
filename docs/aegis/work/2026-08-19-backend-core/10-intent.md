# Backend Core Implementation Intent

- Requested outcome: create `feat/backend-core` and implement `plan-backend-1.md`.
- Scope: `backend/` core, database migrations and seed, REST API, routing, pricing, trips, and integration with the owned `report` contract.
- Non-goals: frontend changes, authentication, extended validation, payments, history, and edits to Backend-2 implementation after the report handoff.
- Baseline refs: `plan-backend-1.md`, `TZ-OneRun.md`, current React/Vite repository layout.
- Risk hints: external ORS/Supabase availability, fixed API compatibility, deterministic demo reset, and consistent monetary calculations.

## Execution Readiness View

- Intent lock: deliver the backend MVP required by the 90-second demo.
- Scope fence: new `backend/`; existing frontend remains unchanged.
- Owner constraint: Backend-1 owns all backend modules except the implementation inside `src/report/` after the initial contract is created.
- Compatibility boundary: JSON is camelCase; GeoJSON coordinates are `[lon, lat]`; report DTO is the Backend-2 seam.
- Test obligations: targeted unit tests, full backend test suite, typecheck, and production build.
- Review gate: no completion claim without fresh verification evidence.

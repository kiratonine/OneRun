# Backend Core Checkpoint

- Current todo: live Supabase migration, ORS route verification, Backend-2 merge, and deployment.
- Active slice: waiting for configured external services after the local backend-core implementation.
- Completed: task-start Git snapshot; `feat/backend-core` created; NestJS skeleton; health-check; constants; Supabase owner; report DTO/stub; settlements/orders/pool/demo APIs; verified settlement seed; routing fallback; pricing; transactional trip persistence; cached trip readback.
- Evidence refs: Git snapshot at `8e250e1a85ec31a02d2ec975c0c262c0ca117a58`; `npm test -- --runInBand` (11 suites, 14 tests); `npm run typecheck`; `npm run build`; `npm run format:check`; `npm audit --omit=dev` (all exited 0).
- Blockers: no backend `.env`; Supabase, ORS, Gemini, and deployment credentials are absent. Git commit is also blocked by missing repository/user `user.name` and `user.email`.
- Next step: configure `.env`, apply migrations and seed to Supabase, verify ORS against every demo destination, then run the full API flow.

## Resume State Hint

Resume from live integration. Preserve the four pre-existing untracked planning documents. Do not edit `backend/src/report/` after Backend-2 takes ownership.

## Drift Check Draft

- Scope: local implementation aligned with `plan-backend-1.md` H+0 to H+8.
- Compatibility: report DTO and `/api/health` match the documented contract.
- New owners: only the planned `health`, `supabase`, and `report` modules.
- Evidence: local unit/integration tests, typecheck, build, dependency audit, and deterministic fallback coverage.
- External compatibility: not yet proven against live Supabase, ORS, or Backend-2.
- Decision: needs-verification.

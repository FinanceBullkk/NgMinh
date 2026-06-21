# Phase 09 — Testing (Unit + Integration + E2E)

## Context Links
- Spec: `/team-tracker-spec.md` (all — invariants to protect: §2.1 append-only, §6 sentiment archive, §10 RLS isolation)
- Overview: `plan.md` · Depends on: Phases 4-8

## Overview
- **Priority:** P1 (protect core invariants before daily use)
- **Status:** ✅ done (2026-06-21)
- **Description:** Test matrix covering pure-util unit tests, data-layer/RLS integration tests against a real local Supabase, and a thin happy-path E2E for the most-used flows. Right-sized for a single-user MVP (no over-testing — YAGNI).
- **Result:** 28 tests green — **16 unit + 11 integration + 1 e2e**. lint + production build clean.
- **Deviations:** integration/e2e read creds live from `supabase status` (no `.env.test` file). To make logic unit-testable, extracted pure helpers `lib/utils/sparkline-points.ts` and `lib/data/user-data.ts` (export/delete) and wired them into the DAL/actions. E2E builds to `test-dist-e2e/` on port 3100 (`next.config.ts` distDir) so it doesn't clobber the dev `.next`. Added those generated dirs to ESLint ignores.

## Key Insights
- Highest-value tests protect the invariants that make this app correct: RLS isolation, append-only timeline, current_take overwrite independence, sentiment archive preserves history color, export completeness, delete completeness.
- Integration tests MUST hit a REAL local Postgres (`supabase start`) — RLS cannot be validated with mocks. Use service-role to set up two test users, then anon/user clients to assert isolation.
- Pure utils (day-grouping, sparkline-points, hex-color, debounce, closeness) → fast unit tests, no DB.
- E2E: one happy path (login → add employee → quick-add entry → see in profile + feed → edit take). Keep minimal (Playwright); not exhaustive.

## Requirements
**Functional**
- Test runner + config; CI-runnable scripts.
- Unit tests for all `lib/utils/*`.
- Integration tests for RLS + key invariants.
- One E2E happy path.

**Non-functional**
- Tests reproducible via `supabase db reset` fixture. No flaky timing; no fake data passing as real coverage.

## Architecture
**Tooling**
- Unit/integration: Vitest. E2E: Playwright. Local Supabase for integration.
- `tests/unit/*`, `tests/integration/*`, `tests/e2e/*`.
- Test DB lifecycle: `supabase start` + `supabase db reset` before integration suite; helper to create/cleanup two test users via admin client.

**Test Matrix**
| Area | Type | What |
|------|------|------|
| day-grouping util | unit | relative labels, TZ boundary (Asia/Saigon midnight) |
| sparkline-points util | unit | order asc, cap N, archived color retained, empty |
| hex-color util | unit | valid/invalid/normalize |
| closeness util | unit | clamp 1-5, label |
| RLS isolation | integration | user A cannot read/write user B rows (all 6 tables) |
| user_id default | integration | insert w/o user_id → owned by caller; WITH CHECK rejects spoof |
| new-user seed | integration | signup → exactly 3 sentiment_options |
| append-only | integration | entries insert works; (assert app exposes no edit/delete path — component test) |
| current_take | integration | update take does NOT alter entries; updated_at bumps |
| sentiment archive | integration | archive in-use → hidden active list, history join still returns color; FK RESTRICT blocks hard delete |
| export | integration | export helper returns all tables' rows for user only |
| delete-all / delete-account | integration | rows gone / cascade wipes everything |
| happy path | e2e | login→create employee→quick-add→profile+feed→edit take |

## Related Code Files
**Create**
- `vitest.config.ts`, `playwright.config.ts`
- `tests/setup/supabase-test-clients.ts` (admin + per-user clients, create/cleanup users)
- `tests/unit/day-grouping.test.ts`, `sparkline-points.test.ts`, `hex-color.test.ts`, `closeness.test.ts`
- `tests/integration/rls-isolation.test.ts`, `user-id-default.test.ts`, `new-user-seed.test.ts`, `append-only.test.ts`, `current-take.test.ts`, `sentiment-archive.test.ts`, `export.test.ts`, `delete-data.test.ts`
- `tests/e2e/happy-path.spec.ts`
- `tests/README.md` (how to run; requires local Supabase)

**Modify**
- `package.json` (scripts: `test`, `test:unit`, `test:integration`, `test:e2e`)
- `README.md` (testing section)

**Delete:** none

## Implementation Steps
1. Add Vitest + Playwright; configs; npm scripts.
2. `supabase-test-clients` helper: admin client (service-role, local), create two users, return scoped clients, cleanup after.
3. Unit tests for all utils.
4. Integration: RLS isolation across all 6 tables (A vs B).
5. Integration: user_id DEFAULT + WITH CHECK spoof rejection.
6. Integration: new-user seed = 3 sentiments.
7. Integration: append-only insert + current_take independence + updated_at.
8. Integration: sentiment archive keeps history color + FK RESTRICT.
9. Integration: export completeness + delete-all + delete-account cascade.
10. E2E happy path (Playwright) against local dev server.
11. Run full suite; fix failures (no skipping, no fake passes).

## Todo List
- [x] Vitest + Playwright setup + scripts
- [x] supabase-test-clients helper (2 users, cleanup)
- [x] Unit: day-grouping, sparkline-points, hex-color, closeness (16 tests)
- [x] Integration: RLS isolation (6 tables)
- [x] Integration: user_id default + spoof rejection
- [x] Integration: new-user seed = 3
- [x] Integration: append-only + current_take independence
- [x] Integration: sentiment archive + FK RESTRICT
- [x] Integration: export + delete-all + delete-account
- [x] E2E happy path
- [x] Full suite green (28 tests) + tests/README + lint/build clean

## Success Criteria
- All unit + integration + e2e tests pass against local Supabase.
- RLS isolation proven: user A cannot see/modify user B data on any table.
- Invariants proven: append-only, take independence, sentiment archive color retention, seed=3, export/delete completeness.
- No skipped/fake tests; CI-runnable.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Integration tests need real DB → CI complexity | Med | Med | Use `supabase` CLI in CI; document local-first; keep suite small |
| Flaky E2E (timing) | Med | Med | Playwright auto-wait; single happy path; stable selectors |
| Test users not cleaned up → pollution | Med | Med | `db reset` before suite + explicit cleanup in teardown |
| Mocking DB hides RLS bugs | Low | High | Forbid mocks for RLS/integration — real Postgres only |

## Security Considerations
- Test service-role key from local `.env.test` (never committed; not production key).
- RLS isolation is the headline security test — must pass before any real data entered.

## Next Steps
- After green: ship MVP. Phase 2 features (nudges, review pack, daily reminder) planned at high level (see plan.md / spec §3, §8) — not designed here.

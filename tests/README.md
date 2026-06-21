# Tests

Right-sized for a single-user MVP — protects the invariants that make the app correct,
no over-testing.

| Suite | Runner | Needs | Run |
|-------|--------|-------|-----|
| Unit (`tests/unit`) | Vitest | nothing | `npm run test:unit` |
| Integration (`tests/integration`) | Vitest | **local Supabase running** | `npm run test:integration` |
| E2E (`tests/e2e`) | Playwright | local Supabase + chromium | `npm run test:e2e` |
| All | — | local Supabase + chromium | `npm test` |

## Prerequisites

```bash
supabase start                 # local Postgres/Auth/Studio (integration + e2e)
npx playwright install chromium # one-time, for e2e
```

Credentials are read live from `supabase status` (no `.env.test` needed). Tests create
**throwaway users** via the admin API and delete them in teardown — they never touch your
real account or `db reset` your data. The e2e suite builds into `test-dist-e2e/` and serves
on port 3100 (see `next.config.ts` / `playwright.config.ts`).

## What's covered

- **Unit:** `day-grouping` (relative labels, Asia/Saigon), `sparkline-points` (order/cap/archived-color), `hex-color`, `closeness`.
- **Integration (real RLS):** cross-user isolation on all 6 tables · `user_id` DEFAULT + WITH-CHECK spoof rejection · new-user seed = 3 sentiments · append-only + `current_take` independence · sentiment archive keeps history color + FK RESTRICT · export completeness · delete-all / delete-account cascade.
- **E2E:** login → add employee → quick-add evidence → revise take → see it in Feed.

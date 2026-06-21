# Project Roadmap

> Last verified: 2026-06-21 · Source: `plans/260621-0121-team-tracker-mvp/`

## Current status

| Metric | Result |
|--------|--------|
| Plan status | In progress |
| Phase progress | 8/9 complete (88.9%) |
| Task progress | 77/88 complete (87.5%) |
| Feature scope | Phases 1-8 complete |
| Release gate | Phase 9 automated testing |

## MVP milestones

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 | Next.js/PWA scaffold | Complete |
| 2 | Supabase schema, migrations, RLS, seed | Complete |
| 3 | Auth and typed data-access layer | Complete |
| 4 | Roster, employee CRUD, tags, search | Complete |
| 5 | Profile, take, goals, timeline, quick-add | Complete |
| 6 | Feed by time with filters and pagination | Complete |
| 7 | Configurable sentiment and SVG sparkline | Complete |
| 8 | Settings, export, data/account deletion | Complete |
| 9 | Unit, integration, and E2E test suite | Pending |

## Quality gates

| Check | 2026-06-21 result |
|-------|-------------------|
| `npm run lint` | Pass |
| `npm run build` | Pass; TypeScript clean |
| Local Supabase | Running and reachable |
| Automated tests | Not configured; no `test` scripts or `tests/` tree |
| Device PWA install | Manual verification pending |

## Next milestone

Complete Phase 9 before using the app for real manager data:

1. Add Vitest and Playwright configuration and npm scripts.
2. Protect RLS, ownership, append-only evidence, sentiment archive, export, and deletion invariants with real local-Supabase tests.
3. Add the minimal authenticated happy-path E2E.
4. Run the full suite, then perform Android/iOS install checks and replace placeholder icons before launch.

## Risks

- Core flows exist, but regressions are not automatically detected.
- Security behavior was smoke-tested during implementation; persistent RLS isolation tests are still absent.
- PWA metadata builds successfully, but device installability remains unverified.

## Unresolved questions

- Are branded icons and physical-device PWA checks MVP launch gates or post-MVP follow-ups?

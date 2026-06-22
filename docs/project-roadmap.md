# Project Roadmap

> Last verified: 2026-06-22 · Source: `plans/260621-0121-team-tracker-mvp/` +
> `plans/260622-2213-security-remediation-rls-auth/`

## Current status

| Metric | Result |
|--------|--------|
| Plan status | MVP complete; security remediation in progress |
| Phase progress | 9/9 MVP complete (100%) |
| Feature scope | MVP + spec Phase-2 features complete |
| Release gate | **Security audit remediation** before real employee data |

## Security remediation (audit 2026-06-22)

Audit found 5 High + 5 Medium + 2 Low. Remediation landed migrations 009–014 + auth config +
step-up reauth + scoped self-delete RPC (service-role removed from runtime) + CSP/security headers +
audit trail. All High/Medium fixes verified live against local Supabase (75 tests green; attack matrix 10/10). **Not "production-ready"**
until the hosted-config residuals (dashboard signup/MFA/leaked-password, TLS/HSTS, backups/PITR) are
owner-verified — see `plans/reports/security-remediation-260622-2213-rls-auth-service-role.md`.

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

# Phase 03 — Data/Access Layer + Auth Flow

## Context Links
- Spec: `/team-tracker-spec.md` §9 (auth), §10 (privacy), §1 (multi-device)
- Research: `research/researcher-01-nextjs-supabase-ssr-auth.md`
- Overview: `plan.md` · Depends on: Phase 1, 2

## Overview
- **Priority:** P1 (every screen depends on this)
- **Status:** pending
- **Description:** Wire `@supabase/ssr` clients (browser/server), session-refresh middleware + route protection, email/password login, sign-out, generated DB types, and a thin typed data-access module per entity.

## Key Insights
- Use `@supabase/ssr` (`createBrowserClient` / `createServerClient`); `@supabase/auth-helpers-nextjs` is removed/deprecated.
- Cookie handling MUST use `getAll`/`setAll` (not deprecated `get/set/remove`). Server Components can't write cookies → `setAll` wrapped in try/catch; middleware does the real cookie writes.
- Always create clients **fresh per request** (never module scope) to avoid session contamination in serverless.
- Use `getUser()` (verifies with auth server) for protection, NEVER `getSession()`.
- All **writes via Server Actions** — never mutate from Server Components.
- Multi-device sync = Supabase cookie session + middleware refresh on each device; no extra work needed. Realtime is NOT needed for MVP (single user, one active tab typically) — YAGNI; skip Realtime subscriptions.
- Email/password chosen over magic link (single user, no cross-browser link friction).

## Requirements
**Functional**
- Login page (email + password). On success → redirect to Roster (`/`).
- Unauthenticated access to app routes → redirect `/login`. Authenticated on `/login` → redirect `/`.
- Sign-out clears session.
- Typed data-access functions for employees/entries/goals/tags/sentiment used by all later phases (DRY).

**Non-functional**
- `Cache-Control: private, no-store` set in middleware (prevent session leakage).
- Files < 200 LOC; one DAL module per entity.

## Architecture
**Clients**
- `lib/supabase/client.ts` — `createClient()` browser (Client Components).
- `lib/supabase/server.ts` — `async createClient()` server (Server Components read / Server Actions write).
- `lib/supabase/middleware.ts` — `updateSession(request)` helper used by `middleware.ts`.

**Auth**
- `middleware.ts` (root) — calls `updateSession`, refreshes token, `getUser()`, redirect logic, cache headers. Matcher excludes static assets.
- `app/(auth)/login/page.tsx` — login form (Client Component).
- `app/(auth)/login/actions.ts` — `signIn` Server Action (`supabase.auth.signInWithPassword`).
- `app/(app)/actions/sign-out.ts` — `signOut` Server Action.
- `app/(app)/layout.tsx` — protected layout; `getUser()` guard + redirect; renders nav shell.

**DAL (server-side, used by Server Components + Actions)**
- `lib/data/employees.ts`, `lib/data/entries.ts`, `lib/data/goals.ts`, `lib/data/tags.ts`, `lib/data/sentiment.ts` — thin typed wrappers over Supabase queries (no business logic beyond shaping).
- `lib/types/database.ts` — generated via `supabase gen types typescript`.
- `lib/types/models.ts` — hand app-facing types (e.g., `EmployeeCard`, `TimelineEntry`) derived from DB types.

**Data flow (read):** Server Component → `lib/data/*` → server supabase client (RLS-scoped) → typed rows.
**Data flow (write):** Client form → Server Action → server supabase client (RLS WITH CHECK) → `revalidatePath`.

## Related Code Files
**Create**
- `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`
- `middleware.ts` (root)
- `app/(auth)/login/page.tsx`, `app/(auth)/login/login-form.tsx`, `app/(auth)/login/actions.ts`
- `app/(app)/layout.tsx`, `app/(app)/actions/sign-out.ts`
- `lib/data/employees.ts`, `lib/data/entries.ts`, `lib/data/goals.ts`, `lib/data/tags.ts`, `lib/data/sentiment.ts`
- `lib/types/database.ts` (generated), `lib/types/models.ts`
- `components/nav/app-nav.tsx` — Roster / Feed / Settings + sign-out

**Modify**
- `app/page.tsx` → move under `app/(app)/page.tsx` (Roster home, real content in Phase 4)
- `README.md` (auth/login + type-gen steps)

**Delete:** temporary placeholder `app/page.tsx`

## Implementation Steps
1. Install `@supabase/ssr @supabase/supabase-js`.
2. Create browser + server clients with `getAll`/`setAll` cookie pattern (try/catch in server `setAll`).
3. Create `updateSession` middleware helper (refresh token, mirror cookies to request+response).
4. Create root `middleware.ts`: call helper, `getUser()`, redirect rules (unauth→/login on app routes; auth→/ on /login), set `Cache-Control: private, no-store`, matcher excludes `_next/static|_next/image|favicon.ico|icons`.
5. Build `(auth)/login` route: client form + `signIn` Server Action; show error on bad creds; `redirect('/')` on success.
6. Build `(app)/layout.tsx` protected layout: `getUser()` guard, render `app-nav` + children.
7. `signOut` Server Action → `supabase.auth.signOut()` → `redirect('/login')`. Wire into nav.
8. Generate types: `supabase gen types typescript --local > lib/types/database.ts`. Add npm script `gen:types`.
9. Write per-entity DAL modules with typed signatures (function stubs returning real queries; consumed in later phases).
10. Manual e2e: log in, land on Roster shell, refresh persists session, sign out returns to login, visiting `/` while logged out redirects.

## Todo List
- [ ] Install @supabase/ssr + supabase-js
- [ ] Browser + server clients (getAll/setAll)
- [ ] updateSession middleware helper
- [ ] Root middleware: refresh + protect + cache headers
- [ ] Login route (form + signIn action)
- [ ] Protected (app) layout with getUser guard
- [ ] signOut action + nav wiring
- [ ] Generate DB types + gen:types script
- [ ] Per-entity DAL modules
- [ ] Manual auth e2e (login/persist/signout/redirect)

## Success Criteria
- Logging in with valid creds reaches Roster; invalid shows error.
- Session survives page refresh and a second device/browser login (multi-device).
- Logged-out user hitting any `(app)` route is redirected to `/login`.
- Sign-out clears session; back-nav cannot re-enter app routes.
- `lib/types/database.ts` reflects Phase 2 schema; DAL compiles against it.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Wrong cookie pattern → broken refresh/redirect loop | Med | High | Follow getAll/setAll exactly; test refresh + token expiry |
| Module-scope client → session bleed | Low | High | Factory functions; create fresh per request (lint/review check) |
| `getSession()` used for auth → spoofable | Low | High | Standardize on `getUser()`; grep for getSession in review |
| Type drift after schema change | Med | Med | `gen:types` script; regenerate whenever migrations change |
| Redirect loop login↔app | Med | Med | Explicit matcher + path checks; test both directions |

## Security Considerations
- `getUser()` everywhere for auth; never trust `getSession()`.
- Cache headers prevent CDN/edge session leakage.
- Publishable key only on client; service-role key absent from this phase.
- No sign-up UI exposed (single-user): create the one account manually via Supabase dashboard OR a guarded one-time signup — decide (open question). MVP default: account provisioned via dashboard, no public signup route.

## Next Steps
- Phases 4-8 consume DAL + auth. Phase 4 (Roster) is the first real screen.

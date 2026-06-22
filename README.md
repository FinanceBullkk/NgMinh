# Team Tracker

Private, single-user PWA for **one manager** to log observations about their direct
reports over time — prep 1:1s and write reviews without recency bias.

Append-only `entries` timeline (evidence) backs an overwritable `current_take` per
employee. One `entries` table, two query axes: **by-person** (Profile) and **by-time** (Feed).

> Full spec: [`team-tracker-spec.md`](team-tracker-spec.md) · Plan: [`plans/260621-0121-team-tracker-mvp/`](plans/260621-0121-team-tracker-mvp/)

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first config, no `tailwind.config.js`)
- **Supabase** (Postgres + Auth + Row-Level Security) — wired from Phase 2
- **PWA** via native `app/manifest.ts` (no service worker in MVP)

## Prerequisites

- Node.js ≥ 20 (developed on 22)
- npm
- A Supabase project (needed from Phase 2 onward — not required to boot the shell)

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase values (Phase 2+)
npm run dev                  # http://localhost:3000
```

### Environment variables

| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Not used by the app runtime** — only tests + manual user provisioning |

**Never** add the Supabase `service_role` key to a `NEXT_PUBLIC_*` var — it bypasses RLS.
Account deletion now runs through the scoped `delete_own_account()` RPC (migration 012), so the
app runtime **no longer needs** the service_role key. Only the integration/e2e tests use it, read
at runtime from `supabase status` (the `SERVICE_ROLE_KEY` value) — never committed, never shipped.

## Local Supabase (development)

Local-first: a full Postgres + Auth + Studio stack runs in Docker. Cloud project is only
needed at deploy time (same migrations apply).

```bash
brew install supabase/tap/supabase   # one-time
supabase start                       # boot local stack (Docker must be running)
supabase status                      # print API URL + keys → put into .env.local
supabase db reset                    # re-apply all migrations from scratch (+ seed)
supabase stop                        # shut the stack down
```

| Service | URL |
|---------|-----|
| API | http://127.0.0.1:54321 |
| Studio (browse/edit data) | http://127.0.0.1:54323 |
| Mailpit (test auth emails) | http://127.0.0.1:54324 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

- Schema lives in `supabase/migrations/` (version-controlled). See `docs/data-model.md`.
- `psql` not on host? Use `docker exec -it supabase_db_NgMinh psql -U postgres`.
- After a reboot, run `supabase start` again before `npm run dev`.

### Auth & accounts

Single-user app — **public sign-up is disabled** (`config.toml` `enable_signup=false`). Provision
the one manager only via Auth Admin. Password must be **12+ chars with upper/lower/digits**.

- **Studio (easiest):** http://127.0.0.1:54323 → Authentication → Add user → tick *Auto Confirm*.
- **Admin API** (needs the service_role key from `supabase status`; the `signup` endpoint is closed):

```bash
curl -s -X POST http://127.0.0.1:54321/auth/v1/admin/users \
  -H "apikey: <SERVICE_ROLE_KEY>" -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"Str0ngPassw0rd","email_confirm":true}'
```

Then log in at `/login`. Logged-out requests to any app route redirect to `/login`.
Re-run after a `supabase db reset` (it wipes auth users too).

### Regenerating DB types

After changing migrations: `npm run gen:types` (writes `lib/types/database.ts`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run gen:types` | Regenerate `lib/types/database.ts` from local schema |
| `npm run test:unit` | Vitest unit tests (no DB) |
| `npm run test:integration` | Vitest integration tests (needs local Supabase) |
| `npm run test:e2e` | Playwright happy-path E2E (needs local Supabase + chromium) |
| `npm test` | All of the above |

## Testing

See [`tests/README.md`](tests/README.md). Unit tests need nothing; integration + E2E need
`supabase start` running (creds read from `supabase status`) and create throwaway users that
never touch your real data. E2E also needs `npx playwright install chromium` once.

## PWA / install

- Android Chrome: menu → "Add to Home Screen".
- iOS Safari: Share → "Add to Home Screen" (no automatic prompt on iOS).
- Requires HTTPS in production for installability.

## Project docs

See [`docs/`](docs/) — start with `project-roadmap.md`, `system-architecture.md`, and `code-standards.md`.

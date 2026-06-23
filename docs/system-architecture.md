# System Architecture

> Seeded in Phase 1. Expanded as phases land.

## Overview

Private single-user PWA. One manager logs observations about direct reports.
Next.js (App Router) frontend + Supabase (Postgres/Auth/RLS) backend. No service
worker in MVP. All sensitive data scoped per user via Row-Level Security.

## Layers

| Layer | Tech | Notes |
|-------|------|-------|
| UI | Next.js 16 App Router, React 19, Tailwind v4 | Mobile-first; route groups `(auth)` / `(app)` planned |
| PWA | `app/manifest.ts` | Installable; no offline/SW in MVP |
| Data access | Supabase JS via `@supabase/ssr` | Browser + server clients (Phase 3) |
| Writes | Next.js Server Actions | Never write from Server Components |
| Backend | Supabase Postgres + Auth | RLS per-table by `user_id`, `TO authenticated` |

## Security model (hardened — see `plans/reports/security-audit-260622-*`)

- **RLS** on all 7 tables, scoped `TO authenticated`. Most tables use one `FOR ALL` owner policy;
  `entries` is split into **SELECT / INSERT / DELETE** (no UPDATE) to keep evidence append-only.
- **Append-only `entries`** enforced in the DB, not the UI: UPDATE revoked at grant + policy level;
  INSERT is column-scoped so `id` / `user_id` / `created_at` fall back to server-controlled defaults.
- **Cross-owner integrity:** a composite FK `entries(sentiment_id, user_id) → sentiment_options(id, user_id)`
  (plus migration-008 triggers for employee/tag) guarantees every reference is same-owner.
- **Login = Google OAuth** (production). Initiated client-side (`lib/auth/oauth-client.ts`) so the
  cross-origin OAuth redirect is a top-level navigation, not a `form-action 'self'`-blocked form
  POST; PKCE completes in the `app/auth/callback` Route Handler (`exchangeCodeForSession`).
  Email/password is rendered only in dev + the e2e harness (`login/page.tsx`).
- **Destructive actions** (delete-all, delete-account) require a **recent interactive sign-in**
  (`last_sign_in_at` within 5 min — provider-agnostic step-up); stale sessions are bounced to a fresh
  Google login (`prompt=login`). Account deletion runs through the scoped `delete_own_account()`
  SECURITY DEFINER RPC — **no service-role key in the app runtime**.
- **Browser headers:** CSP in `proxy`/middleware (`frame-ancestors 'none'`, `object-src 'none'`,
  `base-uri`/`form-action 'self'`, Supabase-scoped `connect-src`; `script-src 'unsafe-inline'` —
  Next-static-compatible, a nonce CSP would need app-wide dynamic rendering, deferred) + HSTS (prod)
  + X-Frame-Options + nosniff + `Referrer-Policy: strict-origin-when-cross-origin` (NOT no-referrer,
  which breaks Server Action CSRF) + Permissions-Policy. Auth cookies `Secure` over HTTPS.
- **Audit trail:** append-only `security_events` (export / delete_all / reauth_failure) via a
  SECURITY DEFINER logger; login failures + delete_account to server stderr. Never logs tokens/PII.
- **Auth strength:** Google OAuth (no app password to leak → HIBP moot; Google 2FA covers MFA);
  public signup OFF; min password 12 + composition kept as defense for the dev/test email path.

## Core data model (see spec §4)

`EMPLOYEE` (1—N `ENTRY`, 1—N `GOAL`) · `SENTIMENT_OPTION` (per-user, configurable) ·
`TAG` (per-user, M—N with employee). Every table carries `user_id`.

Key invariant: **`entries` is append-only** (evidence over time); **`current_take`**
on `employee` is overwrite-in-place. Sentiment is configurable per user — never hardcoded.

## Phase status

Plan progress: **9/9 phases (100%) — MVP complete**. Last verified 2026-06-21 with clean
lint, production build, and 28 passing tests (16 unit + 11 integration + 1 e2e).

- [x] Phase 1 — project + tooling + PWA scaffold
- [x] Phase 2 — Supabase schema + migrations + RLS + seed (6 migrations, smoke-tested)
- [x] Phase 3 — data/access layer + auth flow (`@supabase/ssr`, `proxy.ts`, login, DAL, e2e-verified)
- [x] Phase 4 — Roster: employee CRUD + tags + name/content search (Server Component + Server Actions)
- [x] Phase 5 — Profile: current_take auto-save, goals, append-only timeline + filters, shared quick-add
- [x] Phase 6 — Feed: by-time view, day grouping (Asia/Saigon), person/tag/type filters, load-older
- [x] Phase 7 — Configurable sentiment (Settings) + real SVG sparkline (archive-not-delete keeps history color)
- [x] Phase 8 — Settings: tag management + JSON export + delete-all-data + delete-account (service-role, server-only)
- [x] Phase 9 — Testing: 16 unit + 11 integration (real RLS) + 1 e2e happy path

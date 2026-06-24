# CLAUDE.md — Team Tracker

Project-specific guidance. The global `~/.claude/CLAUDE.md` still applies; this file
only adds what is specific to **this** repo. Keep it short — point to docs, don't duplicate them.

## What this is
**Multi-tenant PWA**: each manager signs in with Google and gets their own **private,
isolated workspace** (RLS scopes every row by `user_id`) to log observations about their
direct reports over time — to prep 1:1s and write reviews **without recency bias**. Not a
CRM, no sharing between accounts. Each account is one manager's private notebook.

> **Direction (2026-06-24):** opened from single-user → **multi-user for a small, trusted
> group**. Enable = Supabase signup ON + Google OAuth consent screen published; data
> isolation is already enforced by RLS on every table, and sign-out clears the client cache
> (`sign-out-button.tsx`) for shared-browser safety. **Public/commercial launch is deferred**
> — privacy policy, consent, PDPD/data-subject-rights, billing live in
> `plans/260622-2235-compliant-commercialization/` and are NOT yet built.

- **Spec (source of truth):** `team-tracker-spec.md`
- **Plan:** `plans/260621-0121-team-tracker-mvp/` (9 phases, MVP)
- **Docs:** `docs/system-architecture.md`, `docs/code-standards.md`

## Stack
Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 (CSS-first,
no `tailwind.config.js`) · Supabase (Postgres + Auth + RLS via `@supabase/ssr`) ·
PWA via native `app/manifest.ts` + `app/icon.png` conventions (no service worker in MVP).

## Commands
- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build; **must pass before a phase is "done"**
- `npm run lint` — ESLint; **must pass before a phase is "done"**
- Env: copy `.env.example` → `.env.local`, fill Supabase URL + publishable key (Phase 2+).

## Non-negotiable invariants (from spec — breaking these breaks the product)
1. **Append vs Revise.** `entries` is append-only for *content* — never EDIT/overwrite a past
   entry. Deleting a mis-entered entry is allowed (delete ≠ edit). `employee.current_take` is
   overwrite-in-place. Keep these distinct behaviors.
2. **One table, two axes.** Query the single `entries` table by-person (Profile) and
   by-time (Feed). Do not fork it into separate tables.
3. **Configurable sentiment — never hardcoded.** Sentiment options live per-user in the DB
   (`label` + `color` + `order`). Ship 3 defaults, but UI + sparkline read from config.
   Deleting an in-use option = **archive**, not hard-delete (don't break history).
4. **RLS on every table.** Every table carries `user_id`; RLS `FOR ALL` using
   `(select auth.uid()) = user_id`. This is sensitive data about real people — treat it so.
5. **Writes via Server Actions only.** Never mutate Supabase from a Server Component
   render. Server-side auth must VERIFY the token — `getUser()` (middleware refresh) or
   `getClaims()` (verifies the JWT signature; local & fast with asymmetric keys). Never
   `getSession()` (unverified).
6. **No AI in MVP.** AI summarize / relationship-map are Phase 3, out of scope — do not
   design tech around them now.

## Conventions
- Files **< 200 LOC**; split by concern (component / hook / server action / query).
- **kebab-case** for all `.ts` / `.tsx` files and folders.
- **Mobile-first** — quick-add is the most-used screen.
- Sentiment colors come from **data**, not CSS. CSS tokens are chrome only.
- Full standards: `docs/code-standards.md`.

## Security
- Only the publishable/anon key goes in `NEXT_PUBLIC_*`. The `service_role` key never
  touches client env (it bypasses RLS).
- `.env.local` is gitignored. **Repo is public** — no real secrets in commits, ever.

## Git
- Conventional commits (`feat:` / `fix:` / `refactor:` / `test:` / `docs:`). No AI references.
- After each phase: update the phase status in `plans/260621-0121-team-tracker-mvp/` and
  any affected file in `docs/`.

## Current state
- **MVP (9 phases) + spec Phase-2 features ✅.** Roster · Profile · Feed · sentiment config (with polarity `weight`) + sparkline · Settings (tags+export+delete) · **nudges** (cooling/stale-1:1) · **review pack** · **daily reminder**.
- **Security audit remediation ✅ (2026-06-22, migrations 009–014).** See `docs/system-architecture.md` →
  "Security model" + `plans/reports/security-remediation-260622-2213-rls-auth-service-role.md`. Public
  signup OFF; `entries` append-only at DB layer; composite same-owner sentiment FK; destructive actions
  require **recent-sign-in step-up**; account deletion via `delete_own_account()` RPC; CSP + security
  headers; `security_events` audit. **NOT production-ready until hosted-config residuals are owner-verified.**
- **Login = Google OAuth** (production). Initiated client-side (`lib/auth/oauth-client.ts`) to dodge
  CSP `form-action 'self'`; PKCE completes in `app/auth/callback/route.ts`. Email/password renders only
  in dev + e2e (`login/page.tsx` gates on `NODE_ENV`/`E2E_BUILD`). Destructive actions use a recency
  step-up (`last_sign_in_at` < 5 min, `lib/auth/recent-auth.ts`) → bounce to Google `prompt=login`.
  Google OAuth closes the Free-plan HIBP + MFA residuals (no password; Google 2FA).
- **Service-role key is no longer used by the app runtime** (account deletion moved to the RPC). Only
  tests use it, read from `supabase status`. `lib/supabase/admin.ts` was removed.
- Tests: 103 green (75 unit + 27 integration + 1 e2e). `npm test` (needs `supabase start` + `npx playwright install chromium`). E2E runs against a **production build** (port 3100, distDir `test-dist-e2e`). See `tests/README.md`.
- **DB migrations:** use `supabase migration up` on a populated DB — `supabase db reset` WIPES all local data.
- **Local config gotcha:** `[auth.email] enable_signup` maps to `GOTRUE_EXTERNAL_EMAIL_ENABLED` (toggles email
  *login*). Public signup is closed via the **global** `[auth] enable_signup=false` only. Applying config
  changes needs `supabase stop && supabase start`; if `start` hangs on a macOS keychain prompt, set
  `SUPABASE_ACCESS_TOKEN=<anything> supabase start`.
- Remaining (spec Phase 3, not built): AI summarize timeline, relationship map.
- Notes: root middleware uses **`proxy.ts`** (Next 16 rename, not `middleware.ts`). Writes = Server Actions; reads = `lib/data/*`. Run `supabase start` before `npm run dev`. Regenerate types with `npm run gen:types` after migration changes.

## Agent skills

### Issue tracker

Issues are tracked in **GitHub Issues** via the `gh` CLI; external PRs are **not** a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary — `needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

**Single-context** layout (one root `CONTEXT.md` + `docs/adr/`). See `docs/agents/domain.md`.

# Deployment Guide — Team Tracker (Vercel + Supabase Cloud)

Recommended path for Next.js 16 + Supabase: **Vercel** hosts the frontend + Server Actions;
**Supabase Cloud** hosts Postgres/Auth/RLS. The app is deployable today. The one real gate is
operational (manually provision the single account); the code is ready.

## 0. In-repo readiness (✅ already applied)
- ✅ e2e build dir decoupled from `PORT` → gated on `E2E_BUILD=1` (`next.config.ts`); Playwright
  webServer sets `E2E_BUILD=1` for build+start. (Avoids hosts that inject `PORT` mis-routing the build.)
- ✅ Node pinned: `engines.node >=20.0.0` + `.nvmrc` (22) + `packageManager` in `package.json`.
- Do **not** add `vercel.json` or `output: "standalone"` (standalone is Docker/self-host only).

## 1. Prerequisites
- Node 20+ / npm. Supabase CLI (`supabase --version` ≥ 2.x) — **not** logged into cloud yet.
- Accounts: GitHub (repo `FinanceBullkk/NgMinh`), Vercel, Supabase.

## 2. Create the Supabase cloud project
Dashboard → New project. Choose **Postgres 17** (matches `supabase/config.toml` `db.major_version=17`;
otherwise set that to match). Pick a nearby region. `gen_random_uuid()` is core (PG13+), no extension needed.

## 3. Link CLI + push the 7 migrations
`supabase db push` migrates **schema only** (no `config.toml` auth settings; there is no `seed.sql`).
```bash
# from repo root
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```
Applies in order: `001_enums` → `002_tables` → `003_indexes` → `004_rls_policies` (RLS enable +
owner `FOR ALL` policy + grants to `authenticated`) → `005_triggers_updated_at` →
`006_new_user_sentiment_seed` (`handle_new_user` seeds 3 sentiments) → `007_sentiment_weight`
(adds `weight` + redefines the seed). Cloud-portable (no ports/paths/localhost). Run once — DDL is not idempotent.

## 4. Configure Auth URLs in the Supabase dashboard
`config.toml site_url` is **local-only** and never reaches cloud. Dashboard →
Authentication → URL Configuration: set **Site URL** to the prod origin
(`https://<app>.vercel.app`) and add it to **Redirect URLs**. For Vercel preview auth, also add a
preview pattern (`https://*-<team>.vercel.app`).

## 5. Get cloud API credentials
Dashboard → Project Settings → API: **Project URL** (`https://<ref>.supabase.co`),
**Publishable key** (`sb_publishable_…`), **service_role** secret (`sb_secret_…` or legacy `eyJ…`).
Do **not** copy local `supabase status` keys to cloud. Old/new key formats are both drop-in.

## 6. Provision the single manager account (REQUIRED — deploy blocker)
The app has **no signup route** (only `signInWithPassword`; the admin client only deletes). On a
fresh project there's no way to create the user from the app → login fails until you create it:
- **Option A (recommended):** Authentication → Users → Add user → email+password → tick **Auto Confirm User**.
- **Option B:** `supabase.auth.admin.createUser({ email, password, email_confirm: true })` against the
  cloud project with its service_role key.

Auto Confirm / `email_confirm:true` is mandatory → **no SMTP needed**. Then verify the trigger seeded
3 `sentiment_options` (weights 1/0/-1) for the user (007 backfill touches zero rows on a fresh DB).

## 7. Deploy to Vercel
Git integration (recommended): Vercel → Add New → Project → Import `FinanceBullkk/NgMinh`. Framework
auto-detected (Next.js); keep defaults (`next build`, `npm ci`). Or CLI: `npm i -g vercel` then `vercel --prod`.

**Environment variables** (Project Settings → Environment Variables, exact names):
| Var | Value | Scope | Notes |
|-----|-------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | Production (+Preview) | inlined into client bundle; must exist at **build** time |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | Production (+Preview) | public, RLS-protected. **Publishable**, not legacy anon |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_…` / `eyJ…` | Production (+Preview), **server-only, Sensitive** | no `NEXT_PUBLIC_` prefix; account deletion only |

Keep auth/admin code on the **Node.js runtime** (the default — no `export const runtime` is set, which is
correct). Don't set edge runtime on anything under `app/(app)` or that imports `lib/supabase/admin.ts`.

## 8. Verify
1. Login with the provisioned account (a failed first login usually = not provisioned/confirmed).
2. Auth gating: logged-out `/(app)` routes redirect to `/login` (proxy.ts + `(app)` layout `getUser`).
3. RLS isolation: `(select auth.uid()) = user_id` on all 6 tables.
4. `/settings/export` returns data when authed, 401 otherwise.
5. PWA install over HTTPS (manifest + 192/512 icons).
6. Run an account deletion once to confirm the service_role key is set.

## 9. Post-deploy checklist
- Replace the 4 **placeholder icons** (solid green): `app/icon.png` (32), `app/apple-icon.png` (180),
  `public/icons/icon-192x192.png`, `public/icons/icon-512x512.png`. Optionally add a 512 `purpose:"maskable"`.
- Deferred: column-level encryption of `entries.content` / `employees.current_take` (spec §10 optional;
  Supabase encrypts disks at rest, not columns). Accepted risk for a single-user app behind RLS.
- Future migrations: add timestamped files to `supabase/migrations/` + `supabase db push`. Never edit an
  applied migration; never push localhost URLs to prod via `supabase config push`.

## Alternative hosts (brief)
- **Netlify / Cloudflare Pages:** same 3 env vars + dashboard auth-URL step. On Cloudflare keep
  admin/auth on Node and verify Server Actions + middleware.
- **Railway / Render / Fly.io:** set `PORT` at runtime — exactly why the `distDir`→`E2E_BUILD` fix matters.
  Use `output: "standalone"` + a Dockerfile.
- **Docker / self-host:** `output: "standalone"`, `node server.js`, HTTPS via reverse proxy (required for
  PWA install + secure cookies). Same 3 env vars; service_role stays server-only.

Whatever the host: the **3 env vars**, the **Supabase dashboard auth-URL config**, and **manual user
provisioning** are identical.

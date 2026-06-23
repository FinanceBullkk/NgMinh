# Deployment Guide — Team Tracker (Vercel + Supabase Cloud)

Recommended path for Next.js 16 + Supabase: **Vercel** hosts the frontend + Server Actions;
**Supabase Cloud** hosts Postgres/Auth/RLS. The app is deployable today. The one real gate is
operational (manually provision the single account); the code is ready.

## Live deployment (2026-06-21)
- **App:** https://ng-minh.vercel.app (Vercel, GitHub integration)
- **Supabase:** project `lrejfdadkxusivskplmp` ("Hia", `https://lrejfdadkxusivskplmp.supabase.co`), region Southeast Asia (Singapore). NOTE: the earlier `kkhctymyfkhlnowjrmmn` (ap-northeast-1) project was removed — see `docs/migrate-to-singapore.md`.
- **Status:** all 15 migrations pushed (incl. security hardening 009–014 + English seed `015`); verified end-to-end in prod (auth, Server Actions, RLS isolation, seed trigger, PWA). 
- **Remaining user steps:** (1) provision the single manager account via Google sign-in — signup is OFF, so use the temporary-toggle flow in §3d; (2) set Auth → URL Configuration Site URL/Redirect to the app URL (§3c); (3) replace placeholder icons.

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

## 3. Link CLI + push the migrations (15)
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
(adds `weight` + redefines the seed) → `008_cross_owner_integrity` → **security hardening 009–014**
(`009` same-owner sentiment FK · `010` entries append-only · `011` least-privilege grants/policies ·
`012` `delete_own_account` RPC · `013` length limits · `014` `security_events` audit) →
`015_english_sentiment_seed` (English default sentiment labels for new users; redefines
`handle_new_user` — runs last, ordering-independent, and `CREATE OR REPLACE` preserves the
grant revoked in `011`). Cloud-portable (no ports/paths/localhost). Run once — DDL is not idempotent.

## 4. Configure Auth URLs in the Supabase dashboard
`config.toml site_url` is **local-only** and never reaches cloud. Dashboard →
Authentication → URL Configuration: set **Site URL** to the prod origin
(`https://<app>.vercel.app`) and add it to **Redirect URLs**. For Vercel preview auth, also add a
preview pattern (`https://*-<team>.vercel.app`).

## 4b. Harden hosted Auth — REQUIRED before real employee data (security audit)
`config.toml` auth settings **do not reach cloud** — set these in the dashboard to match the repo:
- **Authentication → Sign In / Providers → Email:** turn **Allow new users to sign up = OFF** (audit H1).
- **Authentication → Policies / Passwords:** min length **12**, require letters+digits+upper/lower,
  and enable **Leaked password protection** (HIBP) (audit H5).
- **Authentication → MFA:** enable **TOTP** (Pro plan) and enrol the manager (audit H5).
- **Project + org:** enforce **MFA** on the Supabase account/organization owners.
- **Database → Settings:** enable **SSL enforcement** + network restrictions; confirm **PITR/backups**
  and run a restore drill.
- Confirm the hosted `postgres` role can `DELETE` on `auth.users` (needed by `delete_own_account()`),
  or grant it; otherwise account deletion fails in prod.

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
| `SUPABASE_SERVICE_ROLE_KEY` | — | **not needed at runtime** | account deletion moved to the `delete_own_account()` RPC; remove it from Vercel envs (least privilege) |

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

## Production security hardening — step by step (audit remediation)

Run AFTER the remediation code is deployed. `config.toml` auth/SSL settings do NOT reach cloud — the
dashboard steps below are mandatory. Project ref: `lrejfdadkxusivskplmp` ("Hia", Singapore). App:
`ng-minh.vercel.app`.

### 1. Push migrations 009–014 to cloud (schema only)
```bash
# Already linked to `lrejfdadkxusivskplmp` ("Hia", Singapore) — `supabase projects list` shows ●.
supabase migration list                          # see what's remote vs local (001–008 remote, 009–014 local)
supabase db push                                 # applies 009–014
```
- If push fails on the composite FK / length CHECK, prod data violates the new invariant — inspect
  before forcing. On a single real account it should apply cleanly.
- Verify: Dashboard → Database → Migrations shows 009–014; `select to_regclass('public.security_events')`
  and `select to_regproc('public.delete_own_account')` are non-null (SQL Editor).

### 2. Verify `delete_own_account()` can delete `auth.users` on cloud
RESOLVED 2026-06-23 on `lrejfdadkxusivskplmp`: `has_table_privilege('postgres','auth.users','DELETE')
= true` (SQL Editor), RPC + `security_events` present. If a future project differs, run once:
`grant delete on auth.users to postgres;`.

### 3. Auth = Google OAuth (login method) — closes the HIBP + MFA residuals
The app logs in with **Google only** in production (email/password is dev/test-only). No app password
to leak (HIBP moot) and **Google's own 2FA covers MFA** — so the Free-plan gaps disappear, provided
the manager's Google account has 2FA enabled.

**a) Google Cloud Console** (https://console.cloud.google.com/apis/credentials):
- Create **OAuth client ID** → type **Web application**.
- **Authorized redirect URI** = the SUPABASE callback (NOT the app):
  `https://lrejfdadkxusivskplmp.supabase.co/auth/v1/callback`
- (Authorized JS origins optional: `https://ng-minh.vercel.app`.) Copy **Client ID + Secret**.

**b) Supabase → Authentication → Providers → Google:** paste Client ID + Secret, **Enable**, save.

**c) Supabase → Authentication → URL Configuration → Redirect URLs:** add the APP callbacks:
  `https://ng-minh.vercel.app/auth/callback` (+ `http://localhost:3000/auth/callback` for dev).
  Site URL = `https://ng-minh.vercel.app`.

**d) Provision the manager (signup is OFF):** the first Google sign-in would be a signup → blocked.
Either (i) temporarily turn ON "Allow new users to sign up" → click **Tiếp tục với Google** once to
create the account → turn it OFF again; or (ii) Authentication → Add user with your **Gmail**
(email_confirm) — the first Google login auto-links the identity (emails match).

**e) Keep signup OFF** afterwards (Providers → Email → "Allow new users to sign up" = OFF, audit H1).
Email provider stays ENABLED (do not disable it — that breaks email login used by tests; harmless in
prod since the Google account has no password). Password policy 12+ remains as defense in depth.

### 4. Ensure Google account + Supabase org have 2FA
- The manager's **Google account** must have 2-Step Verification ON (this IS the app's MFA now).
- Supabase account/org → enable MFA for the owner.

### 5. Database network + durability (Dashboard → Project Settings → Database)
- **SSL enforcement = ON.**
- Network restrictions: allowlist only needed IPs (optional but recommended).
- **Backups / PITR:** confirm enabled (Pro); run one **restore drill** to a scratch project.

### 6. Vercel (least privilege + redeploy)
- Project → Settings → Environment Variables: **delete `SUPABASE_SERVICE_ROLE_KEY`** (runtime no
  longer uses it; deletion is via the RPC). Keep `NEXT_PUBLIC_SUPABASE_URL` +
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Redeploy (push the merged branch or trigger a deploy).

### 7. Production smoke test (after deploy)
- Click **Tiếp tục với Google** → Google consent → back to `/auth/callback` → roster renders. Add an
  employee + entry; revise take; Feed shows it.
- `curl -s -o /dev/null -w "%{http_code}" -X POST https://<ref>.supabase.co/auth/v1/signup -H "apikey: <publishable>" -H "Content-Type: application/json" -d '{"email":"x@x.test","password":"Str0ngPassw0rd123"}'` → must be **422**.
- DevTools → Network → document response headers: `Content-Security-Policy`, `Strict-Transport-Security`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` present; Console has **no CSP violations**.
- Settings → Xoá tài khoản: if your last sign-in was >5 min ago it shows "đăng nhập lại với Google"
  (step-up) before deleting. After a fresh Google login it deletes.
- Auth cookie (Application → Cookies) is `Secure` over HTTPS.

Only flip to "approved for real employee data" once ALL of §1–§7 pass.

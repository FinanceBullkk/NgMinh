---
type: security-remediation
date: 2026-06-22
scope: Remediate RLS / Auth / service-role audit findings (High + Medium + Low)
source-audit: security-audit-260622-1902-rls-auth-service-role.md
status: complete (code+local verified) — hosted-config residuals owner-pending
---

# Security Remediation — RLS / Auth / Service-Role

## Method
Each finding reproduced live against local Supabase BEFORE fixing (no blind trust), fixed via new
migrations (009–014) + config + code, then the exploit re-run to prove it is dead. No `db reset`
(local held real data; backed up to `/tmp` first). New migrations only; applied with `migration up`.

## What changed
| # | Migration / file | Closes |
|---|------------------|--------|
| 009 | composite FK `entries(sentiment_id,user_id)→sentiment_options(id,user_id)` | H2 |
| 010 | `entries`: drop FOR ALL → SELECT/INSERT/DELETE `TO authenticated`, revoke UPDATE, column-scoped INSERT | H3, H3b |
| 011 | other 5 tables' policies `TO authenticated`; revoke TRUNCATE/REFERENCES/TRIGGER; revoke trigger-fn EXECUTE | M5, L2 |
| 012 | `delete_own_account()` SECURITY DEFINER RPC (auth.uid-scoped) | H4, M2 |
| 013 | length CHECK caps on all text columns | M4 |
| 014 | append-only `security_events` + `log_security_event()` SECURITY DEFINER | M3 |
| config.toml | signup OFF (global+email); min pw 12 + composition; TOTP enrol/verify on | H1, H5 |
| `lib/auth/reauth.ts` + `actions/data.ts` | password step-up before delete-all/delete-account | H4 |
| `lib/security/audit.ts` + login/data actions | audit events (no token/PII) | M3 |
| `lib/security/headers.ts` + middleware + `next.config.ts` | CSP + HSTS + frame/nosniff/referrer/permissions; Secure cookies (HTTPS) | M1 |
| `lib/data/feed-client.ts` | filtered-feed cap (500) | M4 |
| removed `lib/supabase/admin.ts` | service-role key out of app runtime | M2 |
| `lib/data/feed-client.ts` cap; PostCSS tracked (no force-downgrade) | M4, L1 |

## Finding-by-finding — evidence

### H1 Public signup → CLOSED
- Before: `POST /auth/v1/signup` (anon key) → **200 + session token** (6-char pw accepted).
- Fix: `enable_signup=false` (global + `[auth.email]`); manager provisioned via Auth Admin.
- After: anon signup → **rejected** (test `signup-disabled`). Config guarded by unit test
  `auth-config-policy`. *Hosted dashboard must mirror this (config.toml does not reach prod).*

### H2 Cross-owner sentiment / delete-DoS → FIXED
- Before: user B inserted entry with A's `sentiment_id` → **201**; admin delete(A) → **500**.
- Fix: composite FK enforces same-owner; `sentiment_options(id,user_id)` unique key added.
- After: B→A sentiment → **409 (23503)**; self-account with own sentiment-tagged entry deletes
  → **200**. Tests `cross-owner-sentiment` (3 cases). Self-delete is unaffected (RESTRICT only
  blocks foreign refs, now impossible).

### H3 / H3b Append-only via Data API → FIXED
- Before: `PATCH entries` content ORIGINAL→**TAMPERED (200)**; client set `created_at='1999' (201)`.
- Fix: UPDATE revoked (grant + no policy); INSERT column-scoped (id/user_id/created_at = defaults).
- After: UPDATE → **403 (42501)**, content unchanged; client `created_at` → **403 (42501)**;
  DELETE still allowed. Tests `entries-immutable` (3 cases).

### H4 Step-up before destructive / M2 service-role → FIXED
- Before: `deleteAccount` only checked `getUser()` then service-role `admin.deleteUser`.
- Fix: both destructive Server Actions re-verify the password server-side (throwaway client, no
  cookie side-effect); account deletion via scoped `delete_own_account()` RPC; **service-role key
  removed from the app runtime** (`admin.ts` deleted, env no longer needed at runtime).
- After: RPC requires a session (anon → **rejected**); deletes only the caller + cascades; wrong
  password rejected / right accepted. Tests `destructive-and-audit` (4 cases).

### H5 Auth strength → RAISED (config) + follow-up
- min password length 6→**12** + `lower_upper_letters_digits`; TOTP enrol/verify enabled.
- Guarded by unit test `auth-config-policy`. AAL2 hard-gate + TOTP enrolment UI + hosted leaked-
  password (HIBP) + org/account MFA are **owner follow-up** (see Residual).

### M1 Browser headers → ADDED
- CSP (`frame-ancestors 'none'`, `object-src 'none'`, `base-uri`/`form-action 'self'`, Supabase in
  `connect-src`) + HSTS (prod) + X-Frame-Options + nosniff + Permissions-Policy; auth cookies
  `Secure` over HTTPS. Unit test `security-headers`; e2e asserts headers on the prod build AND that
  the app hydrates under the CSP.
- Two CSP decisions verified the hard way against the prod build:
  - `Referrer-Policy: strict-origin-when-cross-origin` (NOT `no-referrer`): `no-referrer` makes the
    browser send `Origin: null` on Server Action POSTs → Next rejects them ("Invalid Server Actions
    request", 500). Reproduced + fixed.
  - `script-src 'self' 'unsafe-inline'` (NOT a nonce/`strict-dynamic` CSP): Next's statically
    prerendered pages cannot carry a per-request nonce, so a strict nonce CSP blocked every chunk +
    inline script (no hydration, blank roster). Reproduced via prod-build console (CSP violations),
    then switched to the static-compatible CSP (0 violations, roster hydrates). **Residual:** script
    `'unsafe-inline'`; the app renders no user-controlled HTML, so injection surface is low. A true
    nonce CSP needs app-wide dynamic rendering — deferred.

### M3 Audit trail → ADDED
- Append-only `security_events` (RLS own-read, writes only via SECURITY DEFINER logger → unforgeable);
  events: export / delete_all / reauth_failure. login_failure + delete_account → server stderr
  (their DB row would have no session / would cascade away). No tokens/PII logged.

### M4 Unbounded data → BOUNDED
- Length CHECKs on every text column; filtered Feed capped at 500 (+ PostgREST `max_rows=1000`).

### M5 / L2 Least privilege → TIGHTENED
- All policies `TO authenticated`; TRUNCATE/REFERENCES/TRIGGER revoked from anon/authenticated/
  service_role; trigger-fn PUBLIC EXECUTE revoked.

### L1 PostCSS advisory → TRACKED
- No exploit path (app parses no attacker CSS). Track a patched stable Next; **no** forced downgrade.

## Verification results (all PASS)
- `supabase db lint --local`: **No schema errors**.
- Migrations 009–014 applied via `migration up` on the **populated** local DB (6 employees / 12
  entries / 2 users preserved; backup taken first). No `db reset`.
- `npm test`: **75 green** — 46 unit + 28 integration (real local Supabase) + 1 e2e (prod build).
- `npx tsc --noEmit`: clean. `npm run lint`: clean. `npm run build`: success.
- Secret scan: client bundle has **no** service-role/secret (publishable key expected); git history
  has no committed service-role JWT (only the `sb_secret_…` doc placeholder); no hardcoded JWTs.
- **Attack matrix re-run (10/10 dead):** H1 signup→422 · H3 UPDATE→403 (content unchanged) ·
  H3b client `created_at`→403 · H2 cross-owner sentiment→409 · H2 account-delete→200 (not blocked) ·
  H4 `delete_own_account` anon→401, self-delete→204 · anon read→401 · email login works.
- Prod-build CSP: roster hydrates, **0 CSP violations**; security headers present on responses.

Note: the local Supabase stack was repeatedly killed by host memory pressure during this session
(environmental, not code) — each suite was confirmed green once the stack was stable.

## Residual risk / owner-only (NOT verifiable from the repo — blocks "production-ready")
1. **Hosted Supabase dashboard** must mirror: signup OFF, password policy, **leaked-password
   protection**, TOTP. config.toml does not reach prod. App is LIVE (`ng-minh.vercel.app`).
2. **AAL2 enforcement + TOTP enrolment UI** not built — password step-up is the current gate.
3. **Org + manager-account MFA**, TLS/HSTS preload, DB SSL enforcement, network restrictions.
4. **Backups / PITR + restore drill**, service-key rotation/incident runbook.
5. **CDN** preserves `private, no-store` + sets `Secure` cookies on the deployed domain.
6. Privacy impact assessment + access/retention policy for real employee observations.

## Unresolved questions
- Should TOTP AAL2 be a hard gate on destructive paths now (needs enrolment UI + Pro plan), or is
  password step-up acceptable for v1?
- Remove `SUPABASE_SERVICE_ROLE_KEY` from Vercel envs now that runtime no longer uses it?
- ~~Does the hosted `postgres` role retain DELETE on `auth.users` for `delete_own_account()`?~~
  **RESOLVED 2026-06-23:** confirmed on prod `lrejfdadkxusivskplmp` ("Hia", Singapore) —
  `has_table_privilege('postgres','auth.users','DELETE') = true`; migrations 009–014 pushed; RPC +
  `security_events` present.

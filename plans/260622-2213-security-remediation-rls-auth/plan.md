# Security Remediation — RLS / Auth / Service-Role

Status: in progress · Branch: `main` (work on `security/remediation-rls-auth`)
Source audit: `plans/reports/security-audit-260622-1902-rls-auth-service-role.md`

Goal: close every High + Medium finding so the app can hold **real employee data**.
Method: verify each finding live → write regression test (real local Supabase) → fix →
re-run full attack matrix. No `db reset` (local has real data; backup in `/tmp`). New
migrations only (009+), never edit applied ones.

## Attack matrix — reproduced (live, before fix)
H1 signup→200+token · H2 B→A sentiment ref→201, delete A→500 · H3 PATCH entries→200 tamper ·
H3b client set created_at→201 · H4 deleteAccount no step-up (code) · H5 pw6/no-MFA (config).
Defenses hold: cross-user read=0, anon=401, archive-invariant=409, self-delete works.

## Migrations (apply via `supabase migration up`)
- `009_cross_owner_sentiment_fk` — unique `sentiment_options(id,user_id)`; replace
  `entries_sentiment_id_fkey` with composite FK `(sentiment_id,user_id)→(id,user_id)` ON DELETE RESTRICT. (H2)
- `010_entries_append_only` — drop `entries_owner_all`; add SELECT/INSERT/DELETE policies
  `TO authenticated`; **no UPDATE**; revoke UPDATE; column-level INSERT grant
  (employee_id,entry_date,type,content,sentiment_id) → lock id/user_id/created_at. (H3,H3b)
- `011_harden_grants_policies` — recreate other 5 tables' policies `TO authenticated`;
  revoke TRUNCATE/REFERENCES/TRIGGER from anon/authenticated/service_role; revoke EXECUTE on
  trigger fns from public. (M5,L2)
- `012_self_delete_account_rpc` — `public.delete_own_account()` SECURITY DEFINER, deletes
  `auth.users where id = auth.uid()`; EXECUTE to authenticated only. Removes service-role from runtime. (H4,M2)
- `013_data_length_limits` — CHECK length caps on text columns. (M4)
- `014_security_events` — audit table + RLS (own SELECT) + `log_security_event()` SECURITY
  DEFINER insert; events: export, delete_all, delete_account, reauth_failure. (M3)

## Config (`supabase/config.toml`) — needs stop/start to apply locally
- `enable_signup=false` (global + `[auth.email]`); `minimum_password_length=12`;
  `password_requirements="lower_upper_letters_digits"`; `[auth.mfa.totp] enroll/verify=true`.
- Hosted dashboard equivalents documented (cannot verify from repo).

## Code
- `app/(app)/actions/data.ts` — both destructive actions take `password`; server re-verifies via
  fresh `signInWithPassword`; on fail → log `reauth_failure`, reject. `deleteAccount` → RPC (no admin client).
- `components/settings/*` — dialog collects password; pass to action; log success events.
- `lib/supabase/{server,middleware}.ts` — `cookieOptions.secure` in production.
- `lib/supabase/middleware.ts` (proxy path) — per-request nonce + CSP + security headers on every response.
- `lib/data/feed-client.ts` — cap filtered reads.
- Remove runtime dependency on `lib/supabase/admin.ts` (kept only if still needed; else delete).

## Tests-first (real local Supabase)
- `signup-disabled` (H1), `cross-owner-sentiment` + delete-account-not-blocked (H2),
  `entries-immutable` UPDATE rejected + client-set columns ignored (H3/H3b),
  `forged/expired/anon token` rejected, `destructive-requires-reauth` (H4),
  `password-policy config` (H5), `security-headers` present (M1), `security-events` logged (M3).

## Verify gate (all must pass)
`supabase db lint --local` · migration up on clean test DB · unit+integration+e2e · `npm run lint` ·
`npx tsc --noEmit` · `npm run build` · secret scan (source+history+bundle) · re-run attack matrix (all old exploits dead).

## Residual / owner-only (cannot verify from repo)
Hosted signup off · org+account MFA/AAL2 hard-gate + TOTP enrollment UI · TLS/HSTS/SSL-enforce ·
backups/PITR + restore drill · leaked-password (HIBP) protection · service-key rotation · CDN cookie/no-store.
Not "production-ready" until these are confirmed by the owner.

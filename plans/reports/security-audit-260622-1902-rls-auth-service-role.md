---
type: security-audit
date: 2026-06-22
scope: Security, RLS, authentication tokens, service-role
status: complete
---

# Security Audit — RLS, Auth, Service Role

## Executive verdict

**Not ready for real employee data.** No confirmed direct cross-user read leak, forged-token
bypass, or committed secret. However, five High findings can create unauthorized accounts,
corrupt evidence, block account deletion, or turn a stolen session into irreversible deletion.

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 5 |
| Medium | 5 |
| Low | 2 |
## Scope and method

- STRIDE + OWASP review of auth, proxy, Server Actions, browser Supabase paths, export/delete.
- All 8 SQL migrations and live Postgres catalog inspected.
- 173 tracked files scanned for structured secrets; git history scanned by filename match.
- Runtime attack matrix: anon, forged JWT, public signup, two authenticated users, cross-owner FKs,
  direct Data API mutation, service-role Auth Admin, cookie attributes.
- `supabase db lint --local --level warning`: pass.
- Integration suite: 9 files, 14 tests, all pass.
- `npm audit --omit=dev`: 2 moderate records from one transitive PostCSS advisory.
## High findings

### H1 — Public signup is enabled in a private single-user app
**Evidence:** `supabase/config.toml:176`, `:221`; runtime `auth.signUp()` succeeded without an
admin credential. Email confirmation is also disabled at `:226`.

**Impact:** anyone with the intentionally-public publishable key can create an authenticated
account, seed rows, consume database/Auth quota, and expand the attack surface to every RLS policy.
RLS prevented access to the manager's rows in testing, so this is not a demonstrated read leak.

**Required fix:** disable global and email signup locally and in the hosted Auth dashboard. Provision
the sole manager only through Auth Admin/Studio. Add a regression test that public signup fails.

### H2 — Cross-owner sentiment reference can block another user's account deletion
**Evidence:** migration 008 validates `employee_id` and `tag_id`, but never validates
`entries.sentiment_id` (`008_cross_owner_integrity.sql:11-62`). Runtime user B successfully inserted
an entry using user A's sentiment UUID. Deleting A through Auth Admin then returned HTTP 500 because
the foreign `ON DELETE RESTRICT` reference remained.

**Impact:** cross-tenant integrity corruption and account-deletion denial of service. RLS hid A's
sentiment fields from B, so no direct content disclosure was observed.

**Required fix:** enforce composite ownership in the database, preferably a composite FK
`entries(sentiment_id, user_id) -> sentiment_options(id, user_id)`, with a matching unique key.
Extend cross-owner tests to sentiment insert/update and account deletion.

### H3 — “Append-only” evidence is mutable through the public Data API
**Evidence:** `entries_owner_all` is `FOR ALL` and authenticated receives UPDATE
(`004_rls_policies.sql:22-35`). Runtime authenticated update of entry content succeeded. The UI does
not expose edit, but the browser already has the publishable key and user token.

**Impact:** a user or stolen session can rewrite content, type, dates, sentiment, and timestamps,
destroying the evidence-chain invariant without using the UI.

**Required fix:** revoke UPDATE on `entries`; replace the `FOR ALL` policy with explicit SELECT,
INSERT, and, only if typo removal remains intentional, DELETE policies scoped `TO authenticated`.
Restrict insertable columns so `id`, `user_id`, and `created_at` remain server/database controlled.

### H4 — Service-role account deletion has no step-up authentication

**Evidence:** `deleteAccount()` accepts any current session verified by `getUser()`, then calls
`auth.admin.deleteUser(user.id)` (`app/(app)/actions/data.ts:31-43`). The typed confirmation exists
only in client state (`confirm-destructive-dialog.tsx:43-55`) and is not part of server authorization.

**Impact:** a stolen valid session can invoke the Server Action directly and permanently delete the
account through a higher-privilege service credential. RLS cannot constrain this Auth Admin call.

**Required fix:** require recent password reauthentication and preferably `aal2` before delete-all
or delete-account. Verify the assurance level and recency server-side. Add rate limiting and a
security event. Evaluate a narrowly-scoped self-delete RPC to remove the general service key from
the application runtime.

### H5 — Authentication strength is below the data sensitivity level

**Evidence:** minimum password length 6, no composition requirement, TOTP disabled, no CAPTCHA
(`supabase/config.toml:182-185`, `:213-217`, `:297-307`). Rate limit is 30 sign-in/signup requests per
5 minutes per IP (`:197-211`), but distributed credential attacks remain possible.

**Impact:** manager account takeover exposes all employee observations and enables destructive
actions. This is a single high-value account, so password-only AAL1 is not sufficient.

**Required fix:** minimum 12+ characters, leaked-password protection, mandatory TOTP/passkey, and
AAL2 enforcement for sensitive data/destructive paths. Protect the Supabase organization itself
with enforced MFA.

## Medium findings

### M1 — Missing browser security headers around browser-readable auth cookies

Runtime cookie: `SameSite=Lax`, `HttpOnly=false`, `Secure=false` on local HTTP. Supabase documents
that browser access to SSR refresh tokens is expected, so `HttpOnly=false` alone is not a defect.
However, responses set no CSP, HSTS, frame-ancestors/X-Frame-Options, nosniff, Referrer-Policy, or
Permissions-Policy. Any future XSS has direct token access.

Add a production CSP (`default-src`, `script-src`, `connect-src` for Supabase, `frame-ancestors
'none'`, `base-uri`, `object-src`), HSTS after HTTPS-only validation, nosniff, no-referrer, and a
minimal Permissions-Policy. Explicitly enforce `Secure` cookies in production.

### M2 — Service-role blast radius remains high despite good source isolation

Positive evidence: `server-only` import, environment-only read, no current/history secret match, no
client-bundle match, and local service-role has no table SELECT. It still has Auth Admin ability to
list/delete users. Scope the secret to production only, exclude previews/client builds, rotate it,
monitor admin calls, and prefer a narrower deletion primitive.

### M3 — No security audit trail or alerting

No application record exists for login failures, export, delete-all, delete-account, or authorization
failures. This blocks incident reconstruction and makes repudiation easy. Log event metadata without
entry content/tokens; centralize and alert on destructive/admin events.

### M4 — Unbounded text and unbounded filtered reads

Employee/tag/take/entry/goal inputs have no database length checks. Browser-direct filtered Feed can
request the full matching dataset. With H1, attackers can cheaply consume storage and query resources.
Add business limits in DB + UI and enforce pagination/caps on every list path.

### M5 — Database roles/policies are broader than required

Live catalog shows policies assigned to `{public}` instead of `authenticated`. Default grants leave
`TRUNCATE`, `REFERENCES`, and `TRIGGER` on anon/authenticated/service_role; PostgREST does not expose
arbitrary TRUNCATE, so no direct exploit was demonstrated. Revoke unused privileges and recreate
policies with `TO authenticated` as Supabase recommends.

## Low findings

### L1 — PostCSS advisory present but current exploit path is absent

Next 16.2.9 embeds PostCSS 8.4.31, affected by CVE-2026-41305. Exploitation requires parsing
attacker-controlled CSS and embedding the serialized result in a style tag; this app accepts no CSS.
Track a patched stable Next release. Do not use npm's proposed forced downgrade to Next 9.3.3.

### L2 — Database trigger functions retain default PUBLIC execute ACL

Trigger-returning functions are not directly callable as normal RPCs, and all pin `search_path`.
Still revoke PUBLIC/anon/authenticated EXECUTE where not required for least privilege.

## Verified defenses

- All 6 public tables have RLS enabled; live catalog and migration match.
- Cross-user reads returned zero rows across all tables.
- Explicit owner spoofing rejected; employee/tag cross-owner references rejected with `23514`.
- Anon table access rejected with `42501`; forged JWT rejected with `PGRST301`.
- Server code uses `getUser()`, not unverified `getSession()`, for authorization decisions.
- Refresh-token rotation enabled; JWT lifetime 1 hour; authenticated responses use `private, no-store`.
- Export requires verified user, is RLS-scoped, and returns `Cache-Control: no-store`.
- No `dangerouslySetInnerHTML`, `eval`, dynamic SQL, or shell execution in application source.
- No structured credential/private-key/JWT found in tracked source or git history.
- Service-role identifier/key absent from client static bundle scan.
- SECURITY DEFINER seed function fully qualifies objects and pins empty `search_path`.

## Fix order

1. Block public signup in local + hosted Auth; verify runtime rejection.
2. Add same-owner sentiment constraint; prove delete-account no longer blocks.
3. Make entries non-updatable at grant + policy level.
4. Add mandatory MFA/recent-auth gate before destructive actions.
5. Add CSP/security headers and production Secure-cookie verification.
6. Tighten grants/policy roles; add limits, logs, and alerting.
7. Track patched Next/PostCSS release.

## External controls not verified

- Hosted Supabase Auth settings may differ from committed local config.
- Production TLS/HSTS, SSL enforcement, database network restrictions.
- Supabase organization MFA and member access.
- Backup/PITR, restore drill, retention, incident response, service-key rotation.
- CDN behavior for `Set-Cookie` and `private, no-store` on the deployed domain.
- Privacy impact assessment and access/retention policy for real employee observations.

## References

- [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase SSR auth and token verification](https://supabase.com/nextjs)
- [Supabase SSR cookie/caching guidance](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa)
- [Supabase production checklist](https://supabase.com/docs/guides/platform/going-into-prod/)
- [Next.js Server Action security](https://nextjs.org/docs/15/app/guides/data-security)
- [CVE-2026-41305](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)

## Unresolved questions

- Is public signup disabled in the hosted project despite local config saying enabled?
- Is mandatory MFA enforced for both the manager app account and Supabase organization owners?
- Are SSL enforcement, network restrictions, PITR/backups, and restore drills enabled?
- Is the service-role secret restricted to production and covered by a rotation/incident procedure?
- Does the deployed CDN preserve `private, no-store` and set production cookies `Secure`?

# Phase 08 — Settings + Export/Delete

## Context Links
- Spec: `/team-tracker-spec.md` §7 (Settings/Config), §3 (export+delete in MVP), §10 (data control, privacy)
- Overview: `plan.md` · Depends on: Phase 3, 7

## Overview
- **Priority:** P1 (data-control + privacy guarantees promised by spec §10)
- **Status:** ✅ done (2026-06-21)
- **Description:** Settings screen hosting sentiment manager (Phase 7) + tag management, full data export (download), and account/data deletion. Manager controls their own data.
- **Deviations:** skipped `settings-sections.tsx` (composed directly in the page — KISS). Service-role client (`lib/supabase/admin.ts`, `import "server-only"`) used only for `auth.admin.deleteUser`. Note: locally the legacy service-role JWT is accepted by GoTrue admin (deleteUser ✓) but not the new-key-mode PostgREST data API — irrelevant since the app never uses admin for data reads.
- **Verified (e2e):** export → 200 + attachment + all 6 tables; settings renders tags/export/delete; deleteAllData wipes employees+tags, keeps sentiments(3)+account; admin deleteUser removes the auth user (cascade wipes the rest via Phase-2 FKs).

## Key Insights
- Export must include ALL user data (employees, entries, goals, tags, employee_tags, sentiment_options) in a portable format → JSON (and optionally CSV per table). JSON is simplest + lossless (KISS).
- Account delete: two scopes — (a) "delete all data" (wipe rows, keep account) and (b) "delete account" (removes auth user → CASCADE wipes everything via Phase 2 FK). Deleting the auth user requires **service-role / admin API** server-side (cannot self-delete via anon). Use a Route Handler/Server Action with service-role key, server-only.
- Destructive actions need strong confirmation (type-to-confirm) — sensitive personnel data, irreversible.
- Tag management here = global tag list (rename/delete tag); deleting a tag cascades `employee_tags` (Phase 2). Per-employee tag assignment already in Phase 4.

## Requirements
**Functional**
- Settings page with sections: Sentiment (mount Phase 7 manager), Tags (list/rename/delete), Data (export, delete-all-data, delete-account).
- Export downloads a JSON file of all user data.
- Delete-all-data wipes user's rows (keeps login). Delete-account removes auth user + all data.

**Non-functional**
- Service-role key used ONLY server-side for account deletion; never shipped to client. Files < 200 LOC.

## Architecture
**Route:** `app/(app)/settings/page.tsx` — Server Component; mounts client sub-managers.

**Components**
- `components/settings/settings-sections.tsx` (layout/nav)
- `components/settings/tag-manager.tsx`, `tag-manager-row.tsx`
- `components/settings/data-controls.tsx` (export button, delete-all, delete-account with type-to-confirm dialogs)
- mounts `sentiment-manager` (Phase 7)

**Export**
- `app/(app)/settings/export/route.ts` — Route Handler (GET): auth via `getUser()`, RLS-scoped reads of all tables, returns JSON with `Content-Disposition: attachment`.

**Delete**
- `app/(app)/actions/data.ts`:
  - `deleteAllData()` — delete user's rows in dependency order (or rely on cascade by deleting employees + sentiment + tags) via RLS server client.
  - `deleteAccount()` — server-side: create admin client with `SUPABASE_SERVICE_ROLE_KEY`, `auth.admin.deleteUser(uid)`; CASCADE wipes data; then sign out + redirect.
- DAL `lib/data/export.ts` — gather-all-user-data query helper.

**Data flow (export):** GET route → getUser → read all tables (RLS) → serialize JSON → download.
**Data flow (delete account):** confirm → server action → admin.deleteUser → cascade → signOut → /login.

## Related Code Files
**Create**
- `app/(app)/settings/page.tsx`
- `components/settings/settings-sections.tsx`, `tag-manager.tsx`, `tag-manager-row.tsx`, `data-controls.tsx`, `confirm-destructive-dialog.tsx`
- `app/(app)/settings/export/route.ts`
- `app/(app)/actions/data.ts`
- `lib/data/export.ts`
- `lib/supabase/admin.ts` — service-role client (server-only; guard against client import)

**Modify**
- `app/(app)/actions/tags.ts` (renameTag, deleteTag)
- `lib/data/tags.ts` (listAllTags)
- `.env.example` (add `SUPABASE_SERVICE_ROLE_KEY` — server only, documented)
- `README.md` (service-role setup + warning)

**Delete:** none

## Implementation Steps
1. Settings Server Component + `settings-sections` layout; mount `sentiment-manager` (Phase 7).
2. `tag-manager`: list all tags, rename, delete (cascade warning). `renameTag`/`deleteTag` actions.
3. Export Route Handler: getUser, read all tables via `lib/data/export.ts`, return JSON attachment (filename with date).
4. `lib/supabase/admin.ts` service-role client — `import 'server-only'` guard; reads `SUPABASE_SERVICE_ROLE_KEY`.
5. `deleteAllData` action: wipe user rows (delete employees → cascade entries/goals/employee_tags; delete tags; reset sentiment to defaults? — decision: wipe sentiment too, re-seed on next? No: keep sentiment defaults; only wipe people data — document). Default decision: delete employees/entries/goals/tags; keep sentiment_options.
6. `deleteAccount` action: type-to-confirm → admin.deleteUser(uid) → cascade → signOut → redirect /login.
7. `confirm-destructive-dialog` (type employee-count or "DELETE" to enable).
8. `data-controls` UI wiring (export download, delete-all, delete-account).
9. Manual test: export downloads correct JSON; delete-all clears people but login + sentiment remain; delete-account removes everything and logs out.

## Todo List
- [x] Settings page mounts sentiment-manager + tag-manager + data-controls
- [x] tag-manager (rename/delete + cascade confirm)
- [x] Export Route Handler (JSON, all 6 tables, RLS)
- [x] admin.ts service-role client (server-only guard)
- [x] deleteAllData action (people data wipe, keeps account+sentiments)
- [x] deleteAccount action (admin.deleteUser + cascade + signout)
- [x] confirm-destructive-dialog (type-to-confirm)
- [x] data-controls UI wiring (export/delete-all/delete-account)
- [x] .env.example + README service-role docs
- [x] e2e: export + deleteAllData + deleteAccount paths

## Success Criteria
- Export downloads a JSON containing all of the user's employees/entries/goals/tags/sentiment.
- Delete-all-data removes people data but keeps account + sentiment config.
- Delete-account removes the auth user and ALL associated data (verified gone), logs out.
- Destructive actions require explicit type-to-confirm.
- Service-role key never reaches the client bundle.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Service-role key leaks to client | Low | Critical | `import 'server-only'`; only in route/action; never NEXT_PUBLIC; review/grep |
| Accidental irreversible delete | Med | Critical | Type-to-confirm dialog; distinct delete-all vs delete-account |
| Export omits a table | Low | Med | Single export helper enumerating all tables; verify against schema |
| Partial delete leaves orphans | Low | Med | Rely on FK CASCADE (Phase 2) or ordered deletes; verify post-delete counts |
| admin.deleteUser fails mid-way | Low | High | Cascade is DB-level (atomic on user delete); handle error + report |

## Security Considerations
- service-role bypasses RLS → strictly server-only, single use (account delete). Documented in README + `.env.example`.
- Export is RLS-scoped (anon/user client), not service-role → only own data.
- All destructive actions re-verify `getUser()`.
- Irreversibility communicated clearly in UI (spec §10 data control).

## Next Steps
- Phase 9 adds automated tests covering RLS isolation, append-only invariant, sentiment archive, export/delete.

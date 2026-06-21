# Phase 02 — Supabase Schema + Migrations + RLS + Seed

## Context Links
- Spec: `/team-tracker-spec.md` §4 (ER), §5 (entry types), §6 (sentiment), §10 (security)
- Research: `research/researcher-03-supabase-rls-patterns.md`
- Overview: `plan.md`

## Overview
- **Priority:** P1 (data foundation)
- **Status:** ✅ done (2026-06-21)
- **Description:** Create all tables, enum, indexes, RLS policies, and a per-user default-sentiment seed via `handle_new_user` trigger. Version-controlled via Supabase CLI migrations.
- **Setup:** Local-first Supabase (CLI 2.107.0 + Docker Desktop). `supabase start` stack running; `.env.local` wired with local API URL + publishable key.
- **Deviation (added during smoke test):** RLS alone gave `42501 permission denied` via PostgREST — tables also need role GRANTs. Added `GRANT SELECT/INSERT/UPDATE/DELETE ... TO authenticated` (anon intentionally left with none) to migration 004. 6 migrations total (no separate grants file).

## Key Insights
- **Spec mandates UUID PKs** (`uuid id PK`). Use `uuid DEFAULT gen_random_uuid()` everywhere — NOT bigint (research-03 sample used bigint; spec overrides).
- **Sentiment options are PER-USER** (SENTIMENT_OPTION has `user_id`, fully configurable). Research-03 wrongly treated them as app-wide constants — DO NOT seed globally. Seed 3 defaults per user via a trigger on `auth.users` insert.
- **Denormalize `user_id` onto every child table** (entries, goals, employee_tags) → simple `FOR ALL` policies, direct index lookups, no RLS recursion. Set via `DEFAULT auth.uid()`.
- Wrap policy predicate as `(select auth.uid()) = user_id` for InitPlan caching.
- Enabling RLS without a policy = locked out. Always pair enable + policy in same migration.
- Sentiment delete = **archive** (add `archived_at`/`is_archived`), never hard-delete, to preserve history colors.
- `entries` content is immutable by UX convention (append-only) — enforced in app layer, not DB (default: no edit). DB allows update for the rare correction path but app does not expose it in MVP.

## Requirements
**Functional**
- Tables: `employees`, `entries`, `goals`, `sentiment_options`, `tags`, `employee_tags` (join).
- `entries.type` is a fixed enum: `1:1`, `feedback`, `win`, `concern`, `note`.
- New user auto-gets 3 default sentiment options (Tích cực `#3F8F6B`, Trung tính `#9AA0A6`, Tiêu cực `#C45B4C`).
- All tables RLS-scoped to owner.

**Non-functional**
- RLS perf: index every `user_id` + FK column.
- Migrations idempotent-friendly, reproducible via `supabase db reset`.

## Architecture
**Schema (UUID PKs, all `user_id uuid` denormalized)**
- `employees(id, user_id→auth.users, name, role_title, team, start_date, closeness int 1-5, current_take text, created_at, updated_at)`
- `sentiment_options(id, user_id, label, color text /*hex*/, order_index int, is_archived bool default false, created_at)`
- `tags(id, user_id, name, created_at)` — unique `(user_id, name)`
- `entries(id, user_id, employee_id→employees, entry_date date default current_date, type entry_type, content text, sentiment_id→sentiment_options NULLable, created_at)`
- `goals(id, user_id, employee_id→employees, content, status goal_status default 'open', target_date date null, created_at, updated_at)`
- `employee_tags(user_id, employee_id→employees, tag_id→tags, PRIMARY KEY(employee_id, tag_id))`

**Enums:** `entry_type` (5 values), `goal_status` (`open`/`done`/`dropped`).

**FK / cascade:** `employees.user_id → auth.users(id) ON DELETE CASCADE`. Child FKs `employee_id → employees(id) ON DELETE CASCADE`. `entries.sentiment_id → sentiment_options(id) ON DELETE RESTRICT` (cannot hard-delete in-use sentiment — enforces archive path). `employee_tags.tag_id → tags(id) ON DELETE CASCADE`.

**`updated_at` trigger:** generic `set_updated_at()` BEFORE UPDATE on `employees`, `goals`.

**Per-user seed:** `handle_new_user()` SECURITY DEFINER trigger AFTER INSERT on `auth.users` → inserts 3 sentiment_options for `NEW.id`.

**Data flow:** auth.users insert → trigger seeds sentiments → app reads them in Phase 7/quick-add. App writes set `user_id` via column DEFAULT; RLS WITH CHECK validates.

## Related Code Files
**Create**
- `supabase/config.toml` (via `supabase init`)
- `supabase/migrations/<ts>_001_enums.sql`
- `supabase/migrations/<ts>_002_tables.sql`
- `supabase/migrations/<ts>_003_indexes.sql`
- `supabase/migrations/<ts>_004_rls_policies.sql`
- `supabase/migrations/<ts>_005_triggers_updated_at.sql`
- `supabase/migrations/<ts>_006_new_user_sentiment_seed.sql`
- `supabase/seed.sql` — optional local dev test rows (gitignored values? keep generic)
- `docs/data-model.md` — schema reference doc

**Modify:** `README.md` (add Supabase CLI setup section)
**Delete:** none

## Implementation Steps
1. `supabase init`; link or use local: `supabase start` (local Postgres for dev).
2. Migration 001: `CREATE TYPE entry_type AS ENUM ('1:1','feedback','win','concern','note');` and `goal_status`.
3. Migration 002: create 6 tables with UUID PKs (`gen_random_uuid()`), `user_id uuid NOT NULL DEFAULT auth.uid()` on all (employees gets FK to auth.users + `UNIQUE`? NO — manager can have many employees; user_id NOT unique). Add CHECK `closeness BETWEEN 1 AND 5`. Add FKs + cascade rules per Architecture.
4. Migration 003: indexes on every `user_id`; FKs `entries(employee_id)`, `entries(sentiment_id)`, `goals(employee_id)`, `employee_tags(tag_id)`; composite `entries(user_id, entry_date desc)` for Feed; `tags unique(user_id, name)`.
5. Migration 004: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on all 6; one `FOR ALL` policy each: `USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id)`.
6. Migration 005: `set_updated_at()` fn + triggers on `employees`, `goals`.
7. Migration 006: `handle_new_user()` SECURITY DEFINER inserting 3 sentiment_options (label/color/order_index) for `NEW.id`; `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users`.
8. `supabase db reset` — applies all migrations to local; verify no errors.
9. Manual smoke (local): sign up a test user → confirm 3 sentiment rows auto-created; insert employee → confirm `user_id` auto-set; query as anon → 0 rows (RLS works).
10. Write `docs/data-model.md` documenting tables, enums, RLS, archive rule.

## Todo List
- [x] `supabase init` + local start
- [x] Enums migration (entry_type, goal_status)
- [x] Tables migration (UUID PKs, denormalized user_id, FKs, CHECK closeness)
- [x] Indexes migration (user_id, FKs, Feed composite + Profile composite, tag uniqueness)
- [x] RLS enable + FOR ALL policies (all 6 tables) + GRANTs to authenticated
- [x] updated_at trigger
- [x] handle_new_user per-user sentiment seed trigger
- [x] `supabase db reset` clean apply (6 migrations, no error)
- [x] Smoke test: seed fires (3), anon denied, owner=3, user_id auto-set, closeness CHECK, FK RESTRICT, cross-user isolation, updated_at bumps
- [x] `docs/data-model.md` + README local-Supabase section

## Success Criteria
- `supabase db reset` applies all 6 migrations with no error.
- New test user receives exactly 3 sentiment_options scoped to their id.
- Insert without explicit user_id still gets correct owner (DEFAULT auth.uid()).
- Cross-user read returns 0 rows (verified by querying with a second test user).
- Hard-deleting an in-use sentiment_option is blocked by FK RESTRICT.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Enable RLS, forget policy → locked out | Med | High | Enable + policy in SAME migration; smoke test reads |
| Trigger seed fails silently on signup | Med | High | SECURITY DEFINER; test signup explicitly; log via Supabase dashboard |
| Hard-delete sentiment breaks history | Med | High | FK ON DELETE RESTRICT + app-level archive flag |
| `auth.uid()` NULL on server-action insert (no session) | Low | High | NOT NULL + WITH CHECK rejects; auth enforced upstream (Phase 3) |
| bigint vs uuid mismatch with spec | Low | Med | Use UUID per spec — explicit decision recorded here |

## Security Considerations
- RLS is the ONLY data isolation boundary — every table must have it. Single-user app but RLS still mandatory (defense in depth, spec §10).
- `handle_new_user` is SECURITY DEFINER (runs as owner to write into a user's rows pre-session) — scope it to ONLY insert sentiment_options; no other privileges.
- Service-role key (bypasses RLS) used ONLY in Phase 8 server-side delete/export, never client. Documented.
- At-rest encryption for `content`/`current_take`: Supabase Postgres is encrypted at rest by default (disk-level). Application-level field encryption is NOT in MVP (spec says "consider" — defer; note as open question). Document the decision.

## Next Steps
- Phase 3 consumes this schema via typed Supabase clients + generated types (`supabase gen types typescript`).

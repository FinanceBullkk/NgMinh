# Data Model

> Schema reference for Team Tracker. Source migrations: `supabase/migrations/`.
> Spec: `team-tracker-spec.md` §4 (ER), §5 (entry types), §6 (sentiment), §10 (security).

## Principles

- **UUID PKs** everywhere (`gen_random_uuid()`).
- **`user_id` denormalized onto every table** with `DEFAULT auth.uid()` → writes auto-set
  the owner; RLS validates it. Avoids RLS subquery recursion, enables direct index lookups.
- **One `entries` table, two query axes**: by-person (Profile) and by-time (Feed).
- **Append vs revise**: `entries` is append-only evidence; `employees.current_take` is
  overwrite-in-place.

## Tables

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `employees` | Direct reports | `name`, `role_title`, `team`, `start_date`, `closeness` (1–5, nullable), `current_take`, `updated_at` |
| `entries` | Append-only timeline | `employee_id`, `entry_date` (def today), `type` (enum), `content`, `sentiment_id` (nullable) |
| `goals` | Goals/commitments | `employee_id`, `content`, `status` (enum, def `open`), `target_date`, `updated_at` |
| `sentiment_options` | Per-user configurable sentiment | `label`, `color` (hex, CHECK), `order_index`, `is_archived` |
| `tags` | Per-user tags | `name`, unique `(user_id, name)` |
| `employee_tags` | M—N employee↔tag | PK `(employee_id, tag_id)` |

All tables also have `id uuid PK`, `user_id uuid` (→ `auth.users` ON DELETE CASCADE), `created_at`.

## Enums

- `entry_type`: `1:1`, `feedback`, `win`, `concern`, `note` (fixed, spec §5).
- `goal_status`: `open`, `done`, `dropped`.

## Foreign keys / cascade

- `*.user_id → auth.users(id)` **ON DELETE CASCADE** (delete account → all data gone).
- `entries.employee_id`, `goals.employee_id`, `employee_tags.employee_id → employees(id)` **CASCADE**.
- `employee_tags.tag_id → tags(id)` **CASCADE**.
- `entries.(sentiment_id, user_id) → sentiment_options(id, user_id)` **composite, ON DELETE
  RESTRICT** (migration 009) → enforces **same-owner** references AND keeps the archive-not-
  hard-delete invariant; the app archives an in-use sentiment instead (`is_archived = true`),
  preserving historical sparkline colors (spec §6).

## RLS & grants

- RLS on all 7 tables, scoped **`TO authenticated`** (migration 011). Most use one
  `FOR ALL USING/WITH CHECK ((select auth.uid()) = user_id)` policy (InitPlan-cached).
- **`entries` is append-only** (migration 010): separate SELECT / INSERT / DELETE policies, **no
  UPDATE** (revoked at grant + policy level); INSERT is **column-scoped** so `id`/`user_id`/
  `created_at` cannot be client-supplied (fall back to defaults).
- **Grants:** only the columns/commands needed; `anon` has none. TRUNCATE/REFERENCES/TRIGGER
  revoked from all Data API roles (migration 011).

## Security hardening (migrations 009–014, audit 2026-06-22)

- `security_events` (migration 014): append-only audit table; RLS own-SELECT only; writes solely
  via `log_security_event()` SECURITY DEFINER (unforgeable user_id). No tokens/PII stored.
- `delete_own_account()` (migration 012): SECURITY DEFINER RPC deleting only `auth.uid()`'s row →
  app runtime needs no service-role key. EXECUTE to `authenticated` only.
- Length CHECK caps on all text columns (migration 013).

## Triggers

- `set_updated_at()` — BEFORE UPDATE on `employees`, `goals`.
- `handle_new_user()` — AFTER INSERT on `auth.users`, **SECURITY DEFINER** (no session yet at
  signup), seeds 3 default sentiment options per user: Tích cực `#3F8F6B`, Trung tính
  `#9AA0A6`, Tiêu cực `#C45B4C`.

## Indexes

- Every `user_id` (RLS perf). For `entries`, the composite covers the `user_id` prefix.
- FK lookups: `entries(employee_id)`, `entries(sentiment_id)`, `goals(employee_id)`, `employee_tags(tag_id)`.
- Feed (by-time): `entries(user_id, entry_date desc, created_at desc)`.
- Profile (by-person): `entries(employee_id, entry_date desc, created_at desc)`.

## Verified behavior (Phase 2 smoke test)

Seed fires on signup (3 rows) · anon denied · owner sees own rows · `user_id` auto-set via
DEFAULT · `closeness` CHECK rejects out-of-range · FK RESTRICT blocks in-use sentiment delete
· cross-user isolation (user2 sees 0 of user1's rows) · `updated_at` bumps on update.

## Open questions

- App-level field encryption for `content` / `current_take`: spec §10 says "consider" — **deferred**
  (Postgres is encrypted at rest by disk). Revisit if threat model requires it.

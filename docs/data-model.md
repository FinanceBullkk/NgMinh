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
- `entries.sentiment_id → sentiment_options(id)` **ON DELETE RESTRICT** → an in-use sentiment
  **cannot be hard-deleted**; the app archives it instead (`is_archived = true`), preserving
  historical sparkline colors (spec §6).

## RLS & grants

- RLS enabled on all 6 tables; one combined policy each:
  `FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id)`.
  `(select auth.uid())` is wrapped for InitPlan caching (perf).
- **Grants:** `SELECT/INSERT/UPDATE/DELETE` to `authenticated` only. `anon` has **no**
  privileges on these tables — single-user app, logged-out requests are denied at the table
  level (defense in depth). RLS then restricts `authenticated` to their own rows.

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

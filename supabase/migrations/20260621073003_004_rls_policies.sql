-- 004 — Row-Level Security (spec §10: every table owner-scoped)
-- Enable RLS + add a policy in the SAME migration (enabling without a policy = locked out).
-- One combined FOR ALL policy per table. `(select auth.uid())` is wrapped so the
-- optimizer caches it once per query (InitPlan), not per row.

alter table public.employees enable row level security;
alter table public.sentiment_options enable row level security;
alter table public.tags enable row level security;
alter table public.entries enable row level security;
alter table public.goals enable row level security;
alter table public.employee_tags enable row level security;

create policy employees_owner_all on public.employees
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy sentiment_options_owner_all on public.sentiment_options
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy tags_owner_all on public.tags
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy entries_owner_all on public.entries
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy goals_owner_all on public.goals
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy employee_tags_owner_all on public.employee_tags
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Table privileges. RLS decides WHICH rows; roles still need table-level grants to
-- reach the table at all. Only `authenticated` gets access — this is a single-user
-- private app with no public data, so `anon` is intentionally left with none
-- (defense in depth: logged-out requests can't touch these tables).
grant select, insert, update, delete on all tables in schema public to authenticated;

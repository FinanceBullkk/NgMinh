-- 011 — Least-privilege grants + role-scoped policies (audit M5 / L2)
-- Two hardening passes recommended by the audit:
--  (M5) Policies were created without `TO authenticated`, so they applied to role `public`
--       (anon + authenticated). Recreate every remaining table's policy scoped TO authenticated
--       (entries already handled in 010). Logged-out `anon` then has no policy at all.
--  (M5) Default Postgres grants left TRUNCATE / REFERENCES / TRIGGER on anon/authenticated/
--       service_role. PostgREST never exposes these, but least privilege says revoke them.
--  (L2) Trigger functions keep their default PUBLIC EXECUTE. They return `trigger` and are not
--       RPC-callable, but revoke PUBLIC/anon/authenticated EXECUTE for hygiene.

-- (M5) Re-scope policies TO authenticated. Same predicate, narrower role.
drop policy employees_owner_all on public.employees;
create policy employees_owner_all on public.employees
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy sentiment_options_owner_all on public.sentiment_options;
create policy sentiment_options_owner_all on public.sentiment_options
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy tags_owner_all on public.tags;
create policy tags_owner_all on public.tags
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy goals_owner_all on public.goals;
create policy goals_owner_all on public.goals
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy employee_tags_owner_all on public.employee_tags;
create policy employee_tags_owner_all on public.employee_tags
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- (M5) Strip unused table privileges from every Data API role.
revoke truncate, references, trigger on all tables in schema public
  from anon, authenticated, service_role;

-- (L2) Trigger functions: drop default PUBLIC execute (not callable as RPCs anyway).
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.assert_employee_same_owner() from public;
revoke execute on function public.assert_employee_tag_same_owner() from public;

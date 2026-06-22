-- 008 — cross-owner integrity guard
-- RLS only checks `user_id = auth.uid()`. The FK on `employee_id` (and `tag_id`) is NOT
-- RLS-scoped, so a client inserting directly (browser→Supabase) could attach a row to
-- ANOTHER user's employee/tag while still passing the user_id check. Reads stay scoped so
-- nothing leaks, but it is an integrity hole. These BEFORE INSERT/UPDATE triggers reject
-- any row whose referenced employee/tag does not belong to the same user_id.
--
-- The functions are plain (NOT security definer): the inner SELECTs run under the caller's
-- RLS, so a foreign employee/tag is simply invisible → the guard raises. search_path pinned.

create or replace function public.assert_employee_same_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.employees e
    where e.id = new.employee_id and e.user_id = new.user_id
  ) then
    raise exception 'employee_id % does not belong to user_id %', new.employee_id, new.user_id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_entries_same_owner
  before insert or update on public.entries
  for each row execute function public.assert_employee_same_owner();

create trigger trg_goals_same_owner
  before insert or update on public.goals
  for each row execute function public.assert_employee_same_owner();

create or replace function public.assert_employee_tag_same_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.employees e
    where e.id = new.employee_id and e.user_id = new.user_id
  ) then
    raise exception 'employee_id % does not belong to user_id %', new.employee_id, new.user_id
      using errcode = 'check_violation';
  end if;
  if not exists (
    select 1 from public.tags t
    where t.id = new.tag_id and t.user_id = new.user_id
  ) then
    raise exception 'tag_id % does not belong to user_id %', new.tag_id, new.user_id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_employee_tags_same_owner
  before insert or update on public.employee_tags
  for each row execute function public.assert_employee_tag_same_owner();

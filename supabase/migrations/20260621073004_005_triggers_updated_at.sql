-- 005 — updated_at maintenance
-- Generic trigger to stamp updated_at on every UPDATE. Applied to the two tables
-- that carry updated_at (employees, goals). search_path pinned for safety.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_employees_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

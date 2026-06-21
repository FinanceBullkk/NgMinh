-- 006 — Per-user default sentiment seed (spec §6)
-- On signup, seed the 3 default sentiment options for the new user. SECURITY DEFINER
-- because there is no session yet at insert time (so it must bypass RLS to write the
-- new user's rows). search_path = '' + fully-qualified names prevents search_path hijack.
-- Scope is intentionally narrow: it only inserts sentiment_options.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.sentiment_options (user_id, label, color, order_index)
  values
    (new.id, 'Tích cực', '#3F8F6B', 0),
    (new.id, 'Trung tính', '#9AA0A6', 1),
    (new.id, 'Tiêu cực', '#C45B4C', 2);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

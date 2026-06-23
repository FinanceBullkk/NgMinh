-- 009 — English new-user sentiment seed
-- The app UI is English, so the shipped sentiment defaults should be too. Supersedes the seed
-- in 007 (same colors / order / polarity weights, English labels). Only affects users created
-- AFTER this migration runs; existing users' labels are their own data (rename in Settings).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.sentiment_options (user_id, label, color, order_index, weight)
  values
    (new.id, 'Positive', '#3F8F6B', 0, 1),
    (new.id, 'Neutral', '#9AA0A6', 1, 0),
    (new.id, 'Negative', '#C45B4C', 2, -1);
  return new;
end;
$$;

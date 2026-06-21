-- 007 — Sentiment polarity (Phase 2 nudges)
-- A per-option weight (+1 positive / 0 neutral / -1 negative) lets "cooling" be computed
-- even though sentiment labels are user-configurable. Default 0 → custom options are
-- neutral until the manager sets a polarity in Settings.

alter table public.sentiment_options
  add column weight int not null default 0;

-- Backfill the shipped defaults by their seed color (case-insensitive).
update public.sentiment_options set weight = 1 where lower(color) = '#3f8f6b';
update public.sentiment_options set weight = -1 where lower(color) = '#c45b4c';
-- '#9aa0a6' (neutral) keeps the default 0.

-- Seed weights for new users going forward.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.sentiment_options (user_id, label, color, order_index, weight)
  values
    (new.id, 'Tích cực', '#3F8F6B', 0, 1),
    (new.id, 'Trung tính', '#9AA0A6', 1, 0),
    (new.id, 'Tiêu cực', '#C45B4C', 2, -1);
  return new;
end;
$$;

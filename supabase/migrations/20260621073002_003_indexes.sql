-- 003 — Indexes
-- An index on every RLS policy column (user_id) is mandatory for performance.
-- Plus FK lookup indexes and the Feed composite (by-time view).

-- RLS / owner-scoped lookups.
create index idx_employees_user_id on public.employees (user_id);
create index idx_sentiment_options_user_id on public.sentiment_options (user_id);
create index idx_goals_user_id on public.goals (user_id);
create index idx_employee_tags_user_id on public.employee_tags (user_id);
-- (tags: covered by unique (user_id, name); entries: covered by the composite below.)

-- FK lookups (joins / cascades).
create index idx_entries_employee_id on public.entries (employee_id);
create index idx_entries_sentiment_id on public.entries (sentiment_id);
create index idx_goals_employee_id on public.goals (employee_id);
create index idx_employee_tags_tag_id on public.employee_tags (tag_id);

-- Feed view (by-time): newest first across the whole roster. Leading user_id also
-- serves the RLS predicate, so a standalone entries(user_id) index is redundant.
create index idx_entries_user_date on public.entries (user_id, entry_date desc, created_at desc);

-- Profile timeline (by-person): one employee's entries, newest first.
create index idx_entries_employee_date on public.entries (employee_id, entry_date desc, created_at desc);

-- 013 — Bounded text lengths (audit M4)
-- No column had a length bound, so a writer (especially with public signup, now closed) could
-- store unbounded text and cheaply consume storage. Add generous-but-finite CHECK caps. NULLs
-- pass (char_length(NULL) is NULL). Existing data is well under these (verified max: content 57,
-- name 13, current_take 104, label 10), so the constraints validate without touching live rows.

alter table public.employees
  add constraint employees_name_len       check (char_length(name) <= 200),
  add constraint employees_role_len       check (char_length(role_title) <= 200),
  add constraint employees_team_len       check (char_length(team) <= 200),
  add constraint employees_take_len       check (char_length(current_take) <= 20000);

alter table public.sentiment_options
  add constraint sentiment_label_len      check (char_length(label) <= 100);

alter table public.tags
  add constraint tags_name_len            check (char_length(name) <= 100);

alter table public.entries
  add constraint entries_content_len      check (char_length(content) <= 10000);

alter table public.goals
  add constraint goals_content_len        check (char_length(content) <= 5000);

-- 001 — Enums
-- Fixed entry types (spec §5) and goal lifecycle states (spec §4).

create type public.entry_type as enum ('1:1', 'feedback', 'win', 'concern', 'note');

create type public.goal_status as enum ('open', 'done', 'dropped');

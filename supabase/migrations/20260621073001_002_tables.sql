-- 002 — Tables (spec §4 ER diagram)
-- UUID PKs everywhere (spec). user_id denormalized onto every table with
-- DEFAULT auth.uid() so writes auto-set the owner; RLS (004) validates it.
-- FK to auth.users only on the owner column; child rows cascade from employees.

-- Manager's direct reports. user_id is NOT unique (one manager → many employees).
create table public.employees (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null,
  role_title   text,
  team         text,
  start_date   date,
  closeness    int check (closeness between 1 and 5), -- nullable until set; how well manager knows them
  current_take text,                                  -- overwrite-in-place "current read" (spec §2.1)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Per-user configurable sentiment scale (spec §6). NOT app-wide. color drives the sparkline.
create table public.sentiment_options (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label       text not null,
  color       text not null check (color ~ '^#[0-9A-Fa-f]{6}$'), -- hex
  order_index int not null default 0,
  is_archived boolean not null default false,                    -- archive instead of hard-delete (spec §6)
  created_at  timestamptz not null default now()
);

-- Per-user tags for filtering the roster.
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Append-only timeline of observations (spec §2.1). One table, queried by-person and by-time.
create table public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  entry_date  date not null default current_date, -- defaults to today, editable
  type        public.entry_type not null,
  content     text not null,
  -- RESTRICT: an in-use sentiment cannot be hard-deleted → forces the archive path (spec §6).
  sentiment_id uuid references public.sentiment_options (id) on delete restrict,
  created_at  timestamptz not null default now()
);

-- Goals / commitments tracked per employee.
create table public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  content     text not null,
  status      public.goal_status not null default 'open',
  target_date date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- M—N join: which tags an employee carries.
create table public.employee_tags (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  tag_id      uuid not null references public.tags (id) on delete cascade,
  primary key (employee_id, tag_id)
);

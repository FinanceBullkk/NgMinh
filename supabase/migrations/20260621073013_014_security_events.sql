-- 014 — Security audit trail (audit M3)
-- No application record existed for sensitive actions, blocking incident reconstruction and
-- making repudiation easy. Add an append-only events table for AUTHENTICATED security events
-- (export, delete_all, delete_account, reauth_failure). Pre-auth login failures are logged to
-- server stderr instead (a DB row there would need an anon-writable path = new attack surface).
--
-- Integrity model: authenticated can only SELECT their own rows. There is NO insert/update/delete
-- grant — the ONLY writer is the SECURITY DEFINER logger below, which always stamps user_id =
-- auth.uid(). So the client cannot forge, alter, or erase events. NEVER pass tokens or HR content
-- in metadata — only event type + small non-sensitive counters/flags.

create table public.security_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (char_length(event_type) <= 64),
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_security_events_user_time
  on public.security_events (user_id, created_at desc);

alter table public.security_events enable row level security;

create policy security_events_select_own on public.security_events
  for select to authenticated using ((select auth.uid()) = user_id);

-- Read-only for the client; writes go exclusively through log_security_event().
grant select on public.security_events to authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.security_events from anon, authenticated, service_role;

create or replace function public.log_security_event(
  p_event_type text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  insert into public.security_events (user_id, event_type, metadata)
  values (caller, p_event_type, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

revoke execute on function public.log_security_event(text, jsonb) from public, anon;
grant execute on function public.log_security_event(text, jsonb) to authenticated;

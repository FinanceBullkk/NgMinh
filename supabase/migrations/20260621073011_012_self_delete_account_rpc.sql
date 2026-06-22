-- 012 — Scoped self-delete RPC (audit H4 / M2)
-- deleteAccount() used the service-role key + auth.admin.deleteUser(). The service-role key can
-- list/delete ANY user, so a stolen session that reaches the Server Action triggers an
-- irreversible delete through a far-higher-privilege credential. Replace that with a narrowly
-- scoped RPC: it deletes ONLY the caller's own auth.users row (id = auth.uid()). FK CASCADE on
-- user_id wipes the caller's app rows; auth-schema cascades remove their sessions/identities.
-- This lets the application runtime drop the general service-role key entirely (smaller blast
-- radius). The Server Action still gates this behind a fresh password re-verification (step-up).
--
-- SECURITY DEFINER so it runs as the function owner (postgres) which can write auth.users.
-- search_path pinned + fully-qualified names. EXECUTE only to authenticated (never anon/public).
-- NOTE (hosted): confirm the migration-owner role retains DELETE on auth.users on the hosted
-- project; if a managed plan restricts it, grant DELETE on auth.users to the function owner.

create or replace function public.delete_own_account()
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
  delete from auth.users where id = caller;
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

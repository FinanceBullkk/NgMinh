-- 010 — Entries are append-only at the database layer (audit H3 / H3b)
-- The UI exposes no edit, but `entries_owner_all` was FOR ALL and `authenticated` held UPDATE,
-- so a user or stolen session could PATCH past content/type/date/sentiment via the Data API
-- (verified: content ORIGINAL -> TAMPERED, HTTP 200). "Append-only" must be enforced in the DB,
-- not just hidden in the UI. Delete of a mis-entered row stays allowed (delete != edit, spec §2.1).
--
-- H3b: the client could also set server-controlled columns on INSERT (verified: created_at set to
-- 1999). Replace the table-level INSERT grant with a column-level grant so id / user_id / created_at
-- fall back to their DEFAULTs (gen_random_uuid / auth.uid / now) and cannot be spoofed.

-- 1) Replace the one FOR ALL policy with explicit per-command policies. No UPDATE policy = no UPDATE.
drop policy entries_owner_all on public.entries;

create policy entries_select on public.entries
  for select to authenticated using ((select auth.uid()) = user_id);

create policy entries_insert on public.entries
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy entries_delete on public.entries
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 2) Revoke UPDATE at the grant level too (defense in depth: permission denied before RLS).
revoke update on public.entries from authenticated;

-- 3) Column-scoped INSERT: only the user-supplied columns. id/user_id/created_at are omitted, so
--    a client providing them is rejected ("permission denied for column"); omitting them uses the
--    column DEFAULT (server/database controlled). RLS WITH CHECK still pins user_id = auth.uid().
revoke insert on public.entries from authenticated;
grant insert (employee_id, entry_date, type, content, sentiment_id)
  on public.entries to authenticated;

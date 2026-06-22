-- 009 — Cross-owner sentiment integrity (audit H2)
-- RLS only checks user_id. The single-column FK entries.sentiment_id -> sentiment_options(id)
-- is NOT owner-scoped, so user B could attach user A's sentiment_id to B's own entry (verified:
-- insert returned 201). That foreign reference then blocks A's account deletion (verified:
-- admin deleteUser(A) returned HTTP 500 via ON DELETE RESTRICT). Reads never leaked (RLS), but
-- it is integrity corruption + an account-deletion denial of service.
--
-- Fix structurally (not just in a trigger): a COMPOSITE FK that carries user_id, so the database
-- itself guarantees a referenced sentiment belongs to the SAME owner. MATCH SIMPLE (default):
-- when sentiment_id is NULL the FK is skipped (null sentiment still allowed); when set, both
-- columns must match a sentiment_options row -> same owner enforced. ON DELETE RESTRICT is kept
-- to preserve the archive-not-hard-delete invariant for in-use sentiments (spec §6, verified 409).
--
-- Self-account deletion is unaffected: a user's own entries cascade-delete with their sentiments
-- in the same auth.users delete, so RESTRICT does not fire (verified: self-delete returns 200).

-- FK target must be a unique key over exactly (id, user_id).
alter table public.sentiment_options
  add constraint sentiment_options_id_user_key unique (id, user_id);

-- Replace the owner-blind single-column FK with the owner-scoped composite FK.
alter table public.entries
  drop constraint entries_sentiment_id_fkey;

alter table public.entries
  add constraint entries_sentiment_owner_fkey
  foreign key (sentiment_id, user_id)
  references public.sentiment_options (id, user_id)
  on delete restrict;

---
title: "Team Tracker — Configurable entry types (full, label-only)"
description: "Make entry `type` per-user configurable (add/rename/reorder/archive), mirroring sentiment_options. Additive, non-destructive migration on real data. RUN THIS ON A MACHINE WITH THE SUPABASE TOOLCHAIN (Docker or linked CLI)."
status: planned
created: 2026-06-23
depends_on: MVP + Phase 2 + Calendar + i18n (complete). Migration 009 is the latest applied.
---

# PROMPT — Implement configurable entry types

> Paste this whole file to an agent (or follow it yourself) **on the machine that has the Supabase
> toolchain set up** (Docker for `supabase start`, or the Supabase CLI linked to the remote
> project). This repo currently has NO local Supabase toolchain, which is why it's deferred here.
> `git pull` first so you have the latest `main`.

Implement a **fully user-configurable entry "type"** for this Next.js 16 + React 19 + TypeScript
(strict) + Supabase PWA. Today `entries.type` is a fixed Postgres enum
(`entry_type` = '1:1' | 'feedback' | 'win' | 'concern' | 'note'). Make types behave exactly like
**`sentiment_options`**: a per-user table the manager can add/rename/reorder/archive in Settings.

## Locked decisions (agreed with the user)
- **Full config, label-only.** No color, no polarity — a type is just a name. (Sentiment owns color.)
- **Mirror `sentiment_options`** in every respect (table shape, RLS, archive-not-delete, defaults seed).
- **Additive, non-destructive migration** on real data: add the new table + a nullable `type_id`,
  backfill, and **keep the old `entries.type` enum column** as a safety net (a *later* migration
  drops it once confident). Make `entries.type` nullable so custom types (which have no enum value)
  are possible.
- **Back up first** (Settings → Export) before applying to real data.

## Known tradeoff to surface in the UI/docs
`computeNudges` "stale 1:1" detects the **"1:1"** type by label. With configurable types, if the
user renames/archives the "1:1" type, that nudge stops firing for them. Acceptable; note it near
the nudge code. (A future enhancement could let the user mark which type means "1:1".)

## Step 0 — Backup
Run the app, Settings → Export, save the JSON. (Or `pg_dump` the project.)

## Step 1 — Migration (additive). Create `supabase/migrations/<next-ts>_010_configurable_entry_types.sql`
Use the next timestamp after `..._009_...`. SQL:

```sql
-- 010 — Configurable entry types (additive, non-destructive). Mirrors sentiment_options.
create table public.entry_types (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label       text not null,
  order_index int not null default 0,
  is_archived boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.entry_types enable row level security;
create policy "entry_types_owner" on public.entry_types
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- FK on entries; nullable (custom types have no enum value). RESTRICT → archive, never break history.
alter table public.entries add column type_id uuid references public.entry_types (id) on delete restrict;
create index entries_type_id_idx on public.entries (type_id);
-- old enum becomes nullable so new custom-type entries don't need it.
alter table public.entries alter column type drop not null;

-- Backfill: seed 5 defaults per existing user, then map each entry to its user's matching type.
insert into public.entry_types (user_id, label, order_index)
select u.id, d.label, d.ord
from auth.users u
cross join (values ('1:1',0),('Feedback',1),('Win',2),('Concern',3),('Note',4)) as d(label, ord);

update public.entries e
set type_id = et.id
from public.entry_types et
where et.user_id = e.user_id
  and et.label = case e.type
    when '1:1' then '1:1' when 'feedback' then 'Feedback' when 'win' then 'Win'
    when 'concern' then 'Concern' when 'note' then 'Note' end;

-- Seed entry_types for NEW users too — extend handle_new_user, keep the 009 sentiment seed.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.sentiment_options (user_id, label, color, order_index, weight) values
    (new.id,'Positive','#3F8F6B',0,1),(new.id,'Neutral','#9AA0A6',1,0),(new.id,'Negative','#C45B4C',2,-1);
  insert into public.entry_types (user_id, label, order_index) values
    (new.id,'1:1',0),(new.id,'Feedback',1),(new.id,'Win',2),(new.id,'Concern',3),(new.id,'Note',4);
  return new;
end; $$;
```

**Also mirror the cross-owner integrity guard:** migration `008_cross_owner_integrity` guards that
`entries.sentiment_id` belongs to the same user. Add the equivalent guard for `entries.type_id`
(read 008 and replicate its mechanism for the new column).

Apply: `supabase migration up` (linked) or `supabase db push`. Then **`npm run gen:types`** to
regenerate `lib/types/database.ts` (adds `entry_types` + `entries.type_id`).

## Step 2 — Types & resolution
- `lib/types/models.ts`: add `export type EntryTypeOption = Tables<"entry_types">;`. Keep the legacy
  `EntryType` enum alias only where the old column is still read. Add a resolved label to entry
  view types: `TimelineEntry` / `FeedEntry` gain `typeLabel: string` (resolved from `type_id` →
  `entry_types.label`, with fallback to the old `type` enum for any unbackfilled row).
- `lib/constants/entry-types.ts`: this static list is now **only the seed defaults** (not used for
  runtime display). Either delete it or clearly mark it as "defaults, see DB". Remove
  `ENTRY_TYPE_LABEL` usage from runtime (replaced by resolved `typeLabel`).

## Step 3 — Data layer (mirror how sentiment_options is fetched/resolved)
Files: `lib/data/{feed-client,profile-client,roster-client,employees}.ts`.
- Fetch active `entry_types` (order by order_index) wherever sentiments are fetched (feed bootstrap,
  profile, quick-add data, roster bootstrap as needed for the picker).
- In `resolveFeedRows` and the profile timeline mapping, resolve `typeLabel` from `type_id` (build a
  `Map<type_id, label>` from entry_types, incl. archived for history).
- `computeNudges`/`review-pack`: pass the **resolved type label** instead of the enum. Update
  `lib/utils/nudges.ts` `NudgeEntry.type` to a string label; keep `=== "1:1"` (see tradeoff above).
  Update `lib/utils/review-pack.ts` grouping to use labels.

## Step 4 — Filtering
- `lib/utils/entry-filter.ts`: change `selectedTypes: Set<EntryType>` → `Set<string>` (type_id), and
  `matchesEntryFilter` to check `e.type_id`. Update its unit test (`tests/unit/entry-filter.test.ts`).
- `components/feed/{feed-filters,feed-shell}.tsx`, `components/feed/feed-list.tsx` (global fetch),
  `components/profile/{timeline-filters,timeline-list}.tsx`: type chips come from configured types;
  filter by `type_id`. `fetchFeedFiltered` filters `.in("type_id", ids)`.

## Step 5 — Capture (quick-add)
- `components/quick-add/type-button-row.tsx`: take configured types (`{id,label}[]`) as props; value
  is `type_id`.
- `components/quick-add/quick-add-sheet.tsx`: `type` state → `typeId` (default = first active type's
  id); insert `type_id` (NOT the enum). Add entry_types to `fetchQuickAddData` (lazy) and the
  optimistic `FeedEntry` should carry `typeLabel`.
- `components/profile/timeline-entry.tsx`: render `entry.typeLabel` instead of
  `ENTRY_TYPE_LABEL[entry.type]`.

## Step 6 — Settings UI (mirror the sentiment manager, MINUS color/polarity)
New: `components/settings/entry-type-manager.tsx`, `entry-type-row.tsx`, `entry-type-form.tsx`
(copy the sentiment ones; drop ColorSwatchPopover + PolarityControl; keep label inline-edit with the
new editable-field style, reorder, archive, add). Wire into `components/settings/settings-view.tsx`.
New server actions `app/(app)/actions/entry-types.ts` (create/update/reorder/archive) mirroring
`app/(app)/actions/sentiment.ts`. Guard: ≥1 active type must remain (like sentiment).

## Step 7 — Cache + invalidation
`lib/cache/registry.ts` + `invalidate.ts`: add an `entryTypes` cache (for Settings + filters/picker
sources) and invalidate it (plus feed/profile/quick-add data) on entry-type create/update/reorder/
archive. Mirror `invalidate.sentiment`.

## Step 8 — Export
`app/(app)/actions/data.ts` / `app/(app)/settings/export/route.ts`: include `entry_types` and use
resolved labels for entries.

## Step 9 — Tests
- Integration: assert `entry_types` seeded with the 5 defaults for a new user (mirror
  `tests/integration/new-user-seed.test.ts`).
- Unit: update `tests/unit/entry-filter.test.ts` to type_id strings; add any pure mapping tests.
- e2e (`tests/e2e/happy-path.spec.ts`): if it selects a type by label, keep using a default label
  ("Note"/"Win") — still valid post-migration.

## Gates
`npm run lint` + `npm run build` + `npm test` (unit + integration + e2e — needs `supabase start` +
`npx playwright install chromium`) all green before "done". Then deploy and verify in the app:
add a custom type in Settings, use it in quick-add, filter by it, see it on the timeline/calendar.

## Surface (files that reference `type` today — update per above)
quick-add-sheet, type-button-row, timeline-list, timeline-filters, timeline-entry, feed-filters,
feed-shell, feed-list, entry-filter, review-pack, nudges, models, database (regen), constants/
entry-types, data/{feed-client,profile-client,roster-client,employees}. Plus NEW: settings entry-type
manager/row/form, actions/entry-types, migration 010.

## Rollback
Non-destructive: to revert, the app can read the kept `entries.type` enum again; drop `type_id` +
`entry_types` in a down-migration. (Don't drop the enum column until a separate, later migration.)

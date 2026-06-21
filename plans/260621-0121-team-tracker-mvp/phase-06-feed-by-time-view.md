# Phase 06 — Feed (By-Time View)

## Context Links
- Spec: `/team-tracker-spec.md` §2.2 (two axes), §7.3 (Feed), §3 (MVP)
- Overview: `plan.md` · Depends on: Phase 3, 5

## Overview
- **Priority:** P1 (the second query axis — weekly review without forgetting anyone)
- **Status:** ✅ done (2026-06-21)
- **Description:** Stream of ALL entries across all employees, grouped by day with relative headers (Hôm nay / Hôm qua / Tuần này / older dates), filterable by person / tag / type. Reuses timeline-entry rendering from Phase 5.
- **Deviations:** person filter is single-select (KISS; tag/type are multi). Filters apply client-side over the loaded window; "load older" via offset server action (`loadMoreFeed`). `groupByDay` buckets all this-week days into one "Tuần này" group (clean headers). Removed the unused `listFeed()` DAL stub (superseded by `listFeedEntries`). Global quick-add (person picker) now wired here.
- **Verified (e2e):** entries across 2 employees on 4 dates → correct day groups + explicit older date + cross-person names render. lint+build green.

## Key Insights
- Same `entries` table, second axis (spec §2.2) — DRY: reuse `timeline-entry` component, add employee name/link since it's cross-person.
- Grouping by day is a presentation concern over `entry_date` (not created_at) — group server-side or in a small client util; relative labels computed in Asia/Saigon timezone consistently.
- Filters: person (single/multi), tag, type. Tag filter requires joining entries→employee→employee_tags. Keep query in DAL; filter state client-side over a reasonable loaded window (e.g., last 90 days or last N=200), with "load more" for older (YAGNI: simple limit + offset, no infinite scroll lib).
- No sentiment filter required by spec for Feed (only person/tag/type) — don't add (YAGNI).

## Requirements
**Functional**
- List entries newest-first, grouped under day headers with relative labels.
- Each item: employee name (links to Profile) + type badge + sentiment dot + content + date.
- Filter by person, tag, type (combinable).
- Quick-add reachable from Feed (person picker shown).

**Non-functional**
- Reasonable initial load (limit), "load older" control. Files < 200 LOC.

## Architecture
**Route:** `app/(app)/feed/page.tsx` — Server Component fetches recent entries (joined employee name + sentiment color) + tag list + employee list (for filters).

**Components**
- `feed-list.tsx` (client; holds filter state, day grouping)
- `feed-day-group.tsx` (day header + items)
- `feed-item.tsx` (or reuse `timeline-entry` with `showEmployee` prop — preferred DRY)
- `feed-filters.tsx` (person, tag, type)

**DAL** (`lib/data/entries.ts`)
- `listFeedEntries({limit, before?, personIds?, tagIds?, types?})` — RLS-scoped, joins employee + sentiment.

**Utils**
- `lib/utils/day-grouping.ts` — group entries by entry_date + relative label (Asia/Saigon).

**Data flow:** Server Component → listFeedEntries → client feed-list groups + filters → render. Filters re-query via server action/route or refine loaded set (client refine for loaded window; server for "load older").

## Related Code Files
**Create**
- `app/(app)/feed/page.tsx`
- `components/feed/feed-list.tsx`, `feed-day-group.tsx`, `feed-filters.tsx`
- `lib/utils/day-grouping.ts`

**Modify**
- `lib/data/entries.ts` (listFeedEntries)
- `components/profile/timeline-entry.tsx` (add optional `showEmployee` prop for reuse) OR create thin `feed-item.tsx` wrapper
- `lib/types/models.ts` (FeedEntry type)

**Delete:** none

## Implementation Steps
1. DAL `listFeedEntries` with limit + optional filters (person/tag/type) + employee/sentiment joins.
2. `day-grouping` util: bucket by entry_date, relative labels (Hôm nay/Hôm qua/this-week/explicit date), Asia/Saigon.
3. Feed Server Component fetches first window + filter option lists (employees, tags, types).
4. `feed-filters` (person/tag/type multi-select) — client state.
5. `feed-list` renders `feed-day-group`s; reuse `timeline-entry` with `showEmployee` linking to Profile.
6. "Load older" control (limit/offset or `before` cursor) via server fetch.
7. Wire global quick-add from Feed (person picker).
8. Manual test: grouping correctness across day boundaries, all filter combos, links to profiles, load older.

## Todo List
- [x] DAL listFeedEntries (joins + range pagination)
- [x] day-grouping util (relative labels, Asia/Saigon)
- [x] Feed Server Component + filter option lists
- [x] feed-filters (person/tag/type)
- [x] feed-list + day groups reusing timeline-entry (employee link)
- [x] Load older control (offset server action)
- [x] Quick-add from Feed (person picker)
- [x] e2e: grouping + cross-person names + explicit older date

## Success Criteria
- Entries from all employees appear newest-first under correct day headers.
- Relative labels correct around midnight (Asia/Saigon).
- Person/tag/type filters narrow results correctly, combinable.
- Each item links to the right Profile.
- "Load older" fetches additional history.
- New quick-add entry appears in Feed after revalidation.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Timezone off-by-one in day grouping | Med | Med | Centralize TZ logic in one util; test boundary dates |
| Tag filter join slow/incorrect | Low | Med | Single DAL query with proper joins + indexes (Phase 2) |
| Reuse of timeline-entry causes layout coupling | Low | Low | `showEmployee` prop kept additive; no breaking change |
| Large feed perf | Low (MVP) | Low | Limit + load-older; full-text/pagination tuning is Phase 2 |

## Security Considerations
- RLS-scoped queries only; cross-user impossible.
- No new write surface beyond shared quick-add (already secured in Phase 5).

## Next Steps
- Phase 7 supplies sentiment colors used by feed dots + replaces sparkline slots app-wide.

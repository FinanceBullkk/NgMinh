---
title: "Team Tracker — Calendar view (by-time, grid)"
description: "A month-grid calendar as a third RENDERING of the by-time axis: find a note by date, team-wide. Toggle inside Feed. (Not in spec; user-requested premium build.)"
status: planned
created: 2026-06-23
depends_on: MVP (phases 1-9) + Phase 2 — complete
---

# Calendar View Plan

A premium **retrieval calendar**: a month grid where the manager finds the notes they
logged on a given day. It is **not a new axis or table** — it is the existing by-time axis
(Feed) re-rendered as a grid, so it honors the spec's "một dữ liệu, hai trục" invariant
(reads the same `entries` table). User wants the highest-quality version, polish over
feature-count.

## Decisions (locked with user via /grill-with-docs, 2026-06-23)

| Decision | Choice | Why |
|---|---|---|
| **Job** | Retrieval — *"find my note for a day"* | User picked this over a coverage/heatmap framing. Keeps the build focused. |
| **Scope** | Team-wide (all reports) | User's words "notes mình đã điền" = all notes, not one person. |
| **Home** | View toggle **inside Feed**: List ⇄ Calendar | It's the by-time axis re-rendered, not a 3rd axis. Bottom nav is full (4 tabs + FAB). Reuses `/feed`. |
| **Time axis** | Bucket by `entry_date` (observation date) | `created_at` is just the log stamp; `entry_date` is the day the note is *about*. Feed already sorts by `entry_date` first. |
| **Day cell** | Per-day **sentiment ribbon** (1-day slice of the signature sparkline); graceful at 1 entry (rounded pill) | Premium look; reuses the `color`-from-data language. |
| **Tap day w/ notes** | Bottom sheet (mobile) / **permanent two-pane** (desktop), reusing `TimelineEntryRow` | Calendar context never lost; fast day→day browsing. |
| **Tap empty day** | Back-dated Quick-add (`entry_date` preset to that day) | Turns the calendar into a capture surface; strengthens anti-recency mission. Requires small QuickAdd prop. |
| **Filters** | Shared person/type filters scope **both** views; filter state shared across the toggle | Biggest retrieval multiplier ("find An's note in March"). UI already exists. |
| **Data** | New `fetchEntriesForMonth(start, end, filters)`, per-month cache key | Feed cache is paginated (first page only) → wrong for a whole-month grid. Same `entries` table. |

## Docs decisions (this was /grill-with-docs)
- **No ADR.** The calendar follows the existing "one table, two axes" invariant — not a
  surprising architectural bet — and toggle-vs-tab is cheaply reversible. Fails 2 of the 3
  ADR tests, so skipped.
- **No CONTEXT.md yet.** The only glossary-worthy term touched (`entry_date` = the
  observation's date and the axis for all time-views; `created_at` = log stamp) is already
  documented in migration comments + spec.
- **Flip `docs/agents/domain.md` to single-context** — the multi-context layout we
  configured has nowhere to put a glossary in this single Next.js app. (One-line edit.)

## Steps (each: build → lint+build → verify → commit)

| # | Step | Key files |
|---|------|-----------|
| A | Pure utils (TDD): month matrix + ribbon segmentation | `lib/utils/month-grid.ts`, `lib/utils/day-ribbon.ts`, `tests/unit/month-grid.test.ts`, `tests/unit/day-ribbon.test.ts` |
| B | Month-scoped data + cache binding | `lib/data/calendar-client.ts`, `lib/cache` (per-month key) |
| C | Calendar components | `components/calendar/{calendar-view,month-nav,month-grid,day-cell,day-detail}.tsx` |
| D | Feed shell: lift filter state + view toggle | `components/feed/{feed-shell,view-toggle}.tsx`, refactor `feed-view.tsx` + `feed-list.tsx` |
| E | QuickAdd `initialDate` prop (for empty-day capture) | `components/quick-add/quick-add-sheet.tsx` |
| F | Docs: flip domain layout to single-context | `docs/agents/domain.md` |

## Definitions (bake into utils, unit-tested)
- **month grid**: a 6×7 matrix of days covering the visible month plus leading/trailing days
  from adjacent months; each cell flags `isCurrentMonth` and `isToday` (Asia/Saigon, reuse
  `todayInSaigon`).
- **day bucket**: entries whose `entry_date` equals the cell's date (NOT `created_at`).
- **ribbon segments**: for a day's entries, one segment per entry, colored by its
  sentiment `color` (null sentiment → neutral track color), proportional width; a single
  entry renders as one rounded pill, not a sliver.
- **today**: Asia/Saigon (reuse the day-grouping / nudges TZ approach).

## Cross-cutting
- Files < 200 LOC; kebab-case; mobile-first. Reuse `TimelineEntryRow`, `QuickAdd`,
  `FeedFilters`, day-grouping, `lib/cache` patterns. YAGNI/KISS/DRY.
- **No new RLS surface** — reads the already-scoped `entries` table.
- Honor invariants: append-only entries (calendar never edits), one table / two axes
  (calendar is a *rendering*, not a new table), sentiment color from data.
- Risk: lifting filter state out of `FeedList` touches its optimistic-filter + load-more
  logic. Keep that logic intact; only move the `useState`s up to `feed-shell`. Re-run the
  feed integration tests after.

## Open follow-ups (not in this plan)
- Per-person calendar on Profile (the other flavor of retrieval) — deferred; single Profile
  timeline already serves it.

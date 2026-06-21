---
title: "Team Tracker — Phase 2 features"
description: "Nudges, review pack, daily reminder — turn the archive into something that prompts action (spec §3 Phase 2, §8)."
status: complete
created: 2026-06-21
depends_on: MVP (phases 1-9, complete)
result: "All 3 features shipped. 41 tests green (29 unit + 11 integration + 1 e2e). lint + build clean."
---

# Phase 2 Features Plan

Build the spec's "Phase 2" batch on top of the complete MVP. Decisions (confirmed with user):
- **Cooling** is computed from a new **sentiment `weight`** (polarity), configurable in Settings.
- **Daily reminder** is an in-app banner (no push / service worker).
- Build all three features.

## Steps (each: build → lint+build → verify → commit)

| # | Step | Key files |
|---|------|-----------|
| A | ✅ Migration `007_sentiment_weight` (+ backfill defaults by color, update `handle_new_user`) + regen types | `supabase/migrations/..._007_sentiment_weight.sql` |
| B | ✅ Settings: weight selector in sentiment form/row; actions accept weight | `actions/sentiment.ts`, `components/settings/sentiment-*` |
| C | ✅ Nudges: `lib/utils/nudges.ts` (pure) + compute in `listEmployeesWithMeta`/profile; Roster sorts nudged first + badges | `lib/utils/nudges.ts`, `lib/data/employees.ts`, `components/roster/*` |
| D | ✅ Review pack: `buildReviewMarkdown` util + Profile component (date range → markdown + copy) | `lib/utils/review-pack.ts`, `components/profile/review-pack.tsx` |
| E | ✅ Daily reminder: Roster banner when no entry today + global quick-add | `components/roster/daily-reminder.tsx`, roster page, `hasEntryOn` |
| F | ✅ Tests: unit (nudges, review-pack) + integration (weight seed); e2e fixed for the new banner button | `tests/*` |

## Notes / fixes
- **`supabase db reset` wiped local data** (incl. the test account) while applying migration A — recreated the account; **use `supabase migration up` on a populated DB**, never `db reset`.
- E2E: the new daily-reminder "+ Ghi hôm nay" on Roster duplicated the profile's label; the happy-path raced onto it (employee card name is also a heading). Fixed by `waitForURL(/employees/…)` and switching the e2e webServer to a **production build** (no dev hydration races).

## Definitions (baked into utils, unit-tested)
- **stale1on1**: employee has ≥1 entry but no `1:1` entry within the last 30 days.
- **cooling**: of the most recent ≤5 entries that carry a sentiment, ≥2 exist and their average `weight` < 0.
- **today**: Asia/Saigon (reuse the day-grouping TZ approach).

## Cross-cutting
- Files < 200 LOC; YAGNI/KISS/DRY. Reuse existing quick-add, timeline-entry, day-grouping.
- No new RLS surface (weight lives on already-scoped sentiment_options).

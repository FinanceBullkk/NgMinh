---
title: "Manager's Team Tracker — MVP"
description: "Private single-user PWA for a manager to log append-only observations on direct reports, prep 1:1s, and write bias-free reviews."
status: complete
priority: P2
effort: ~46h
branch: main
tags: [nextjs, supabase, pwa, rls, mvp]
created: 2026-06-21
---

# Manager's Team Tracker — MVP Plan

Private, single-user PWA. One manager logs observations about direct reports over time.
Append-only `entries` timeline (evidence) backs an overwritable `current_take` per employee.
One `entries` table, two query axes: by-person (Profile) and by-time (Feed).
Signature: hand-rendered SVG sparkline colored by configurable sentiment.

**Source of truth:** `/team-tracker-spec.md` · **Research:** `research/` (3 reports)

## Stack (decided)
Next.js 16 App Router + TypeScript + Tailwind v4 + Supabase (Postgres/Auth/RLS via `@supabase/ssr`).
Native `app/manifest.ts` PWA (no service worker for MVP). Email/password auth. Server Actions for writes.
No chart library (SVG sparkline). No AI (out of MVP scope).

## Phases

| # | Phase | File | Status | Effort | Blockers |
|---|-------|------|--------|--------|----------|
| 1 | Project + tooling + PWA scaffold | [phase-01](phase-01-project-tooling-pwa-scaffold.md) | ✅ done | 4h | none |
| 2 | Supabase schema + migrations + RLS + seed | [phase-02](phase-02-supabase-schema-migrations-rls.md) | ✅ done | 6h | 1 |
| 3 | Data/access layer + auth flow | [phase-03](phase-03-data-access-layer-auth-flow.md) | ✅ done | 6h | 1,2 |
| 4 | Roster + employee CRUD + tags + search | [phase-04](phase-04-roster-employee-crud-tags-search.md) | ✅ done | 7h | 3 |
| 5 | Profile (current_take, goals, timeline, quick-add) | [phase-05](phase-05-profile-take-goals-timeline-quickadd.md) | ✅ done | 8h | 3,4 |
| 6 | Feed view (by-time) | [phase-06](phase-06-feed-by-time-view.md) | ✅ done | 3h | 3,5 |
| 7 | Configurable sentiment + sparkline component | [phase-07](phase-07-sentiment-config-sparkline.md) | ✅ done | 5h | 3,4,5 |
| 8 | Settings + export/delete | [phase-08](phase-08-settings-export-delete.md) | ✅ done | 4h | 3,7 |
| 9 | Testing (unit + integration + e2e) | [phase-09](phase-09-testing.md) | ✅ done | 3h | 4-8 |

**Progress:** 9/9 phases (100%) · MVP complete · 28 tests green (16 unit + 11 integration + 1 e2e) · lint + build clean · last verified 2026-06-21.

**Total: 9 phases (~46h).** Phases 1-3 strictly sequential (foundation). 4 unblocks 5; 6/7 depend on 5; 8 depends on 7; 9 last.

## Key dependencies
- Phase 7 sentiment options are referenced by entries from Phase 5 → seed defaults in Phase 2 so Phase 5 works before Phase 7 UI exists.
- Sparkline (Phase 7) is consumed by Roster cards (Phase 4) and Profile header (Phase 5) → built as standalone component, wired retroactively.

## Cross-cutting rules
- Files < 200 LOC; kebab-case names; YAGNI/KISS/DRY.
- Every table: `user_id` + RLS `FOR ALL` using `(select auth.uid()) = user_id`.
- All writes via Server Actions (never from Server Components). Auth checks use `getUser()`.
- No hardcoded sentiment levels. Deleting in-use sentiment = archive, not hard-delete.

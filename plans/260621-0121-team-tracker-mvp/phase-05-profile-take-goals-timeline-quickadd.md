# Phase 05 — Profile (current_take, Goals, Timeline, Quick-add)

## Context Links
- Spec: `/team-tracker-spec.md` §2.1 (append vs revise — CORE), §7.2 (Profile), §7.4 (Quick add), §5 (types), §10 (hint)
- Overview: `plan.md` · Depends on: Phase 3, 4

## Overview
- **Priority:** P1 (the differentiator — append-only evidence behind overwritable take)
- **Status:** ✅ done (2026-06-21)
- **Description:** Per-person view: header with name/tags/closeness slider + large auto-saving "Nhận định hiện tại" (current_take), Goals section, append-only Timeline (filter by type & sentiment), and the big "+ Ghi hôm nay" quick-add flow.
- **Deviations:** skipped `lib/utils/debounce.ts` — the take editor uses inline ref-based debounce with flush-on-blur/unmount (finer control, avoids the React 19 set-state-in-effect rule). Goals use optimistic local state. Quick-add component already supports a person-picker (`employees` prop) but Profile passes a fixed `employeeId`; the global Roster/Feed quick-add is wired in Phase 6. Tag actions revalidate `/` only (Profile relies on the optimistic TagEditor).
- **Verified (e2e):** append entries render in timeline, current_take renders, goal renders, roster sparkline reflects new entries. lint+build green.

## Key Insights
- **Append vs Revise is the whole point** (spec §2.1): `entries` are append-only (no edit UI in MVP); `current_take` is overwritten continuously with auto-save. Keep these two mechanisms visibly distinct in UI and code.
- Auto-save current_take: debounce (~800ms) + on-blur; optimistic UI; write via Server Action; update `employees.updated_at` (trigger from Phase 2). Show subtle "đã lưu" status. Guard against saving empty over existing accidentally? No — allow empty (user may clear), but confirm-less.
- Quick-add is the most-used action → lowest friction (spec §7.4): open with cursor in content field, entry_date = today (editable), type + sentiment as button rows, one tap to save. Reuse SAME quick-add component on Profile (person preselected) and globally from Roster/Feed (person picker shown).
- Sentiment buttons are data-driven from user's non-archived sentiment_options (color from config) — never hardcode.
- Privacy hint (spec §10): content textarea placeholder nudges concrete observations over emotional labels (e.g. "trễ deadline X 2 lần" not "lười").
- Timeline newest-first; each item = sentiment color dot + type badge + date + content. Filter by type and by sentiment (client-side over loaded entries; paginate if large).
- Goals: list with status (open/done/dropped), add goal, toggle done. Simple.

## Requirements
**Functional**
- Header: name, tags (reuse tag-editor), closeness slider (1-5, saves), current_take big textarea (auto-save).
- Goals: list, add, mark done/dropped, optional target_date.
- Timeline: append-only entry list, newest first, filter by type + sentiment.
- Quick-add: create entry (employee preselected, date today/editable, type buttons, sentiment buttons, content). No edit/delete of past entries in MVP.

**Non-functional**
- Auto-save must not lose input (debounce + flush on blur/unmount). Files < 200 LOC (split header, take-editor, goals, timeline, quick-add).

## Architecture
**Route:** `app/(app)/employees/[id]/page.tsx` — Server Component fetches employee + tags + goals + entries (with sentiment) + active sentiment_options.

**Components**
- `profile-header.tsx` (name, tags, closeness slider)
- `current-take-editor.tsx` (client, debounced auto-save, status indicator)
- `goals-section.tsx` + `goal-item.tsx`
- `timeline-list.tsx` + `timeline-entry.tsx` + `timeline-filters.tsx`
- `quick-add/quick-add-sheet.tsx` (shared) + `type-button-row.tsx` + `sentiment-button-row.tsx`
- Profile sparkline header slot (real render from Phase 7).

**Server Actions** (`app/(app)/actions/entries.ts`, `goals.ts`, `employees.ts`)
- `createEntry(employeeId, {entry_date, type, content, sentiment_id})` → insert (RLS) → `revalidatePath` profile + feed + roster.
- `updateCurrentTake(employeeId, text)` → update employees.current_take.
- `updateCloseness(employeeId, n)`.
- `createGoal`, `updateGoalStatus`.

**Data flow (append):** quick-add form → createEntry action → entries insert (user_id DEFAULT) → revalidate. current_take untouched by entries.
**Data flow (revise):** take editor change → debounce → updateCurrentTake action → employees update → updated_at trigger.

## Related Code Files
**Create**
- `app/(app)/employees/[id]/page.tsx`
- `components/profile/profile-header.tsx`, `current-take-editor.tsx`, `closeness-slider.tsx`
- `components/profile/goals-section.tsx`, `goal-item.tsx`
- `components/profile/timeline-list.tsx`, `timeline-entry.tsx`, `timeline-filters.tsx`
- `components/quick-add/quick-add-sheet.tsx`, `type-button-row.tsx`, `sentiment-button-row.tsx`
- `app/(app)/actions/entries.ts`, `app/(app)/actions/goals.ts`
- `lib/utils/debounce.ts`, `lib/constants/entry-types.ts` (the 5 fixed types + labels/icons)

**Modify**
- `lib/data/entries.ts`, `lib/data/goals.ts` (queries)
- `app/(app)/actions/employees.ts` (updateCurrentTake, updateCloseness)
- `lib/types/models.ts` (TimelineEntry, ProfileData)

**Delete:** none

## Implementation Steps
1. `entry-types.ts` constants (5 fixed: 1:1/feedback/win/concern/note + label + icon/color accent).
2. Profile Server Component fetches employee, tags, goals, entries(+sentiment join), active sentiment_options.
3. `profile-header` + `closeness-slider` (updateCloseness action).
4. `current-take-editor`: controlled textarea, debounced updateCurrentTake, "đang lưu/đã lưu" status, flush on blur/unmount; privacy hint placeholder.
5. `goals-section`: render goals, add-goal form (createGoal), status toggle (updateGoalStatus).
6. `timeline-list` newest-first; `timeline-entry` shows sentiment dot + type badge + date + content; `timeline-filters` (type + sentiment, client-side).
7. `quick-add-sheet` shared component: content (autofocus), date (default today), `type-button-row`, `sentiment-button-row` (from active sentiment_options). Save → createEntry → close + revalidate.
8. Wire big "+ Ghi hôm nay" on Profile (person preselected).
9. Ensure createEntry revalidates roster (sparkline) + feed.
10. Manual test: add entries (append-only, can't edit past), edit take (auto-saves, survives reload), goals, timeline filters, quick-add speed.

## Todo List
- [x] entry-types constants
- [x] Profile Server Component (fetch all profile data)
- [x] profile-header + closeness slider (save on release)
- [x] current-take-editor auto-save (debounce + flush) + status + privacy hint
- [x] goals-section (add/toggle status, optimistic)
- [x] timeline-list/entry/filters (type + sentiment, client-side)
- [x] quick-add-sheet (shared) + type/sentiment button rows (data-driven colors)
- [x] big "+ Ghi hôm nay" on Profile
- [x] createEntry revalidates roster + profile + feed
- [x] e2e: append renders, take renders, goal renders, sparkline updates

## Success Criteria
- Adding an entry appends to timeline (newest first); no UI path edits/deletes past entries.
- Editing current_take auto-saves (verified by reload) without affecting timeline.
- Closeness change persists. Goals add + status toggle persist.
- Timeline filters by type and sentiment correctly.
- Quick-add: open → type → pick type+sentiment → save in minimal taps; sentiment buttons reflect user's config colors.
- New entry updates Roster sparkline + Feed on next view.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Auto-save data loss (race/unmount) | Med | High | Debounce + flush on blur/unmount; last-write-wins; status indicator |
| current_take overwrite from a stale tab (multi-device) | Low | Med | Last-write-wins acceptable for single user; updated_at visible; note limitation |
| Accidental past-entry edit creeping in | Low | Med | No edit affordance in UI; DB allows but app doesn't expose (spec default) |
| Quick-add friction too high | Med | Med | Autofocus content, defaults (today, last/neutral sentiment), single save tap |
| Sentiment row empty if all archived | Low | Med | Always keep ≥1 active (Phase 7 guard); fallback "no sentiment" allowed (sentiment_id nullable) |

## Security Considerations
- Privacy hint in content placeholder (concrete observation vs emotional label) — spec §10, fairness + manager safety.
- All writes RLS-scoped via server actions with `getUser()`.
- Sensitive content stays server-rendered; no leaking via client props beyond what's displayed.

## Next Steps
- Phase 6 (Feed) reuses timeline-entry rendering + quick-add. Phase 7 replaces sparkline slot with real SVG and powers sentiment button colors from config.

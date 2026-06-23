# Codebase Full Audit — Team Tracker

**Date:** 2026-06-23 · **Branch:** security/remediation-rls-auth · **Method:** 5 parallel finders (security/RLS · spec-invariants · correctness-new · correctness-core · react/quality) → adversarial verify each finding (24 agents).

## Result
- Raised 19 → **confirmed 16** (3 dismissed as not-a-bug).
- Severity: **0 critical · 0 high · 1 medium · 13 low · 2 info**.
- **No security hole, no RLS gap, no spec-invariant violation.** tsc/lint/build green. Security lens found only 1 audit-log completeness gap (low). Strong posture for a security branch.

## Findings (deduped to 13 distinct + 2 info)

### MEDIUM
1. **⌘+Enter double-submit → duplicate entries** — `components/quick-add/quick-add-sheet.tsx:99-148,166-177`
   Keyboard save path has no in-flight guard (buttons are `disabled={pending}`, hotkey isn't). Double ⌘+Enter on a slow connection fires two `entries.insert` → duplicate rows in the **append-only** table (can't edit away — violates invariant #1). Most-used screen.
   **Fix (trivial):** ref-backed guard `if (saving.current || pending) return;` (ref survives the stale effect closure since `pending` is omitted from deps line 177); clear `content` synchronously before `start()` as belt-and-suspenders.

### LOW — correctness
2. **Feed global-filter last-write-wins race** — `components/feed/feed-list.tsx:38-49`
   Late stale fetch can overwrite the current filter's result, never re-fetches. **Fix:** per-effect `let active=true` cleanup flag, guard `setFetched`.
3. **`cache.feed.prepend` ignores entry_date DESC order** — `lib/cache/registry.ts:34-40` (flagged by 2 lenses)
   Back-dated optimistic entry jumps to feed top until revalidation. **Fix:** sorted splice by (entry_date, created_at) DESC.
4. **CalendarView `today` frozen at mount** — `components/calendar/calendar-view.tsx:25`
   `useMemo([],…)` → stale across midnight (Asia/Saigon): wrong `isToday`, goToday. **Fix:** recompute each render (cheap string). NB: Feed `groupByDay` has the same staleness — consistency follow-up.
5. **`reorderSentiment` upsert clobbers concurrent edit** — `app/(app)/actions/sentiment.ts:82-106`
   `select('*')`→re-write sends back stale label/color/weight (lost-update window). **Fix:** upsert only `{id, user_id, order_index}`.
6. **`createSentiment` order_index read-then-insert can collide** — `app/(app)/actions/sentiment.ts:40-52`
   Concurrent creates → duplicate order_index → nondeterministic order. **Fix:** `created_at` tiebreaker in client sort + `.order("order_index").order("created_at")` reads. No constraint (MVP).
7. **`deleteEntry` error swallowed** — `components/profile/delete-entry-button.tsx:19-22`
   Failed delete → row silently re-appears, no feedback. **Fix:** surface error, invalidate only on success (mirror `goal-item.tsx`).
8. **Export route never logs the `export` security event it claims to** — `app/(app)/settings/export/route.ts:6-26`
   Full people-data dump (most sensitive read) leaves no audit row; migration 014 + audit.ts + docs all assert it's tracked. **Fix:** `logEvent(supabase,"export",{tables:N})` after getUser (non-sensitive counters only).

### LOW — cleanup / UI
9. **Delete-account button mislabeled "Xoá toàn bộ dữ liệu"** — `components/settings/data-controls.tsx:84-99`
   Heading says data-wipe, action is full account delete. **Fix:** relabel "Xoá tài khoản" (and either wire up the data-only path or remove it — see #10).
10. **Dead code: `deleteAllData` branch unreachable in DataControls** — `components/settings/data-controls.tsx:4,18-25,103-113`
    Import + `doDeleteAll` + `confirm==="all"` dialog never reachable. **Fix:** remove UI wiring (keep the server action — tested, may re-expose), OR wire a 2nd "data-only" row. Couples with #9.
11. **Dead file: `tag-manager-row.tsx` returns null, never imported** — `components/settings/tag-manager-row.tsx`
    **Fix:** `git rm` (also removes the only `no-unused-vars` eslint-disable).
12. **`CurrentTakeEditor` doesn't re-seed after SWR revalidation** — `components/profile/current-take-editor.tsx:18-22`
    Inconsistent w/ `useSyncedState`; stale value persists after background refresh. **Fix:** render-phase re-seed guard that preserves in-flight edits. `closeness-slider.tsx` same pattern.
13. **Native `<dialog>` sheets/menus: a11y gaps** — quick-add-sheet, confirm-destructive-dialog, employee-form-dialog, sentiment-row popover, app-nav account menu, calendar mobile sheet
    Missing `aria-labelledby`; popovers/menus not Escape-dismissible / no focus return. **Fix:** add `aria-labelledby` to dialogs (cheap, high value); Escape+focus-return on popovers; calendar sheet → native `<dialog>`.

### INFO (optional)
14. Two files >200 LOC: `quick-add-sheet.tsx` (312), `sentiment-row.tsx` (265). Split candidates (`database.ts` 425 is generated — exempt).
15. quick-add cmdK effect captures stale `loadingData` (defensive; ref-back the in-flight guard).

## Dismissed (3, not-a-bug)
Refuted on inspection — false positives from the finders (e.g. assumed-missing guards that exist, month-grid math that is intentionally drift-free).

## Recommended fix order
- **Batch A — correctness (recommended):** #1–#8. Mostly trivial; closes the one data-integrity bug + the real logic races. ~6 files.
- **Batch B — cleanup:** #9, #10, #11. Dead code + mislabel.
- **Batch C — polish:** #12, #13, (#14). Re-seed + a11y + modularize.

## Resolution (2026-06-23) — all 13 actionable fixed + verified
Fixed #1–#13 (A+B+C). Adversarial verify-workflow on the fixes (11 verifiers) → 7 OK + 2 concerns + 2 nits, all addressed:
- #1 — ref guard added; **+ try/finally** so the guard resets even on a network reject (verify nit).
- #2 — cleanup-flag suppresses late stale fetch.
- #3 — pure `insertByFeedOrder` (DESC slot) + 5 unit tests; wired into `cache.feed.prepend`.
- #4 — `today` recomputed each render.
- #5 — `reorderSentiment` per-row `order_index` UPDATEs (no full-row rewrite; label/color NOT NULL ⇒ partial upsert impossible).
- #6 — **corrected**: tiebreaker first landed on DEAD `lib/data/sentiment.ts` (0 callers); moved to the 4 LIVE fetchers (settings/profile/roster/quick-add-client) + `sentiment-manager` sort; reverted the dead edit.
- #7 — `deleteEntry` surfaces error, invalidates on success only.
- #8 — export route logs `export` event; **+ try/catch** (best-effort, never blocks export).
- #9/#10 — wired 3 rows (export · delete-data · delete-account) per user choice.
- #11 — dead `tag-manager-row.tsx` removed.
- #12 — re-seed moved to `useEffect([initial])` (writing refs in render was lint-illegal).
- #13 — `aria-labelledby` on 3 dialogs + Escape on AccountTab/ColorSwatchPopover; **corrected** QuickAdd to `useId()` (multi-mounted ⇒ static id was a duplicate-id regression).

Gates green: `lint` · `tsc --noEmit` · `build` · `vitest` (80 unit, +5 new).

## Unresolved questions
1. **#4 residual:** Feed `groupByDay` is memoized on `[source]` and is likewise stale across midnight (out of this fix's scope). Make it midnight-tolerant too, or leave (single-user PWA, low impact)?
2. **#6 follow-up:** the now-dead `listSentimentOptions`/`listAllSentimentOptions` in `lib/data/sentiment.ts` have 0 callers — delete them, or wire them as the canonical data-layer API? (left untouched for now)
3. **#13 depth:** stopped at `aria-labelledby` + Escape. Full focus-trap / roving-tabindex on the mobile calendar sheet + menus — worth it, or YAGNI for a private single-user touch app?

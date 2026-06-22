# Audit — Architecture, Functions, Tests (2026-06-22)

Independent review (3 reviewers): client state/cache, server data/RLS, test coverage.
Baseline commit `7336dcc`. Read-only audit; nothing changed yet.

## Verdict
Architecture is **salvageable and mostly sound** (RLS-backed auth is correct; append-only +
archive invariants hold). But there is **one structural flaw that causes the recurring
"stale after write" bugs**, plus a few concrete bugs, and **the new client layer has ~zero
test coverage** (every bug so far was caught only by manual testing).

## Root cause of the bug streak
The SSR→client SPA migration was done fast. Cache-invalidation knowledge is **scattered**:
(a) `revalidatePath` in Server Actions — now a **dead no-op** for SPA pages, (b) per-call-site
`revalidateKey(...)` in ~10 components, (c) implicit "which page shows which field". Every new
write makes a dev re-derive the full fan-out of SWR keys by hand — and it keeps being wrong
(closeness→roster, sentiment→feed/roster/profile, tag→roster). No single source of truth.

## Confirmed bugs (prioritized)
| # | Sev | Where | Bug | Fix |
|---|-----|-------|-----|-----|
| 1 | HIGH | feed-list.tsx loadMore | `fetchFeedPage(items.length, pageSize)` — **args swapped** (sig is `(limit, offset)`) → "Tải thêm" skips/oversizes pages | swap to `(pageSize, items.length)` |
| 2 | HIGH | swr invalidation (scattered) | closeness/take edits don't refresh Roster; sentiment/tag edits don't refresh Feed/Roster/Profile | centralized invalidation map (see below) |
| 3 | HIGH | quick-add optimistic id | temp id `tmp-${date}-${len}` can collide → 2nd note dropped from view | `crypto.randomUUID()` |
| 4 | HIGH | quick-add `todayISO()` | uses local TZ, rest of app uses Asia/Saigon → wrong day bucket / `hasEntryToday` misfire | pin `Asia/Saigon` at write site |
| 5 | HIGH | DB: entries/goals/employee_tags | client can insert row referencing **another user's** `employee_id` (FK bypasses RLS) — integrity hole | trigger / composite FK asserting employee.user_id = row.user_id |
| 6 | MED | goals-section, sentiment-manager, tag-manager | `useState(initialProp)` frozen-at-mount (same class as the feed bug) → background revalidate ignored | derive from SWR or sync prev-prop |
| 7 | MED | searchEmployeeIdsByContent | `%` `_` `\` in query treated as LIKE wildcards | escape metacharacters |
| 8 | MED | reorderSentiment | N sequential UPDATEs, non-atomic | single upsert / RPC |
| 9 | MED | roster-client entries fetch | unbounded full-table fetch to browser each load | cap to recent window (sparkline uses last ~20) |
| 10 | LOW | dead code | unused after migration: actions `createEntry`/`loadMoreFeed`/`filterFeed`/`loadQuickAddData`; data `listFeedEntries`/`listFeedEntriesFiltered`/`hasEntryOn`/`resolveFeedRows`; dead `revalidatePath` calls | remove |

Auth model verified sound: middleware `getUser()` gate + RLS; static shell carries no server
data; service_role server-only (deletion). No data reachable without a session.

## Structural fix (kills the bug class)
One module `lib/swr-revalidate.ts` (extend) with **named invalidators**, one per write type:
- `invalidate.entry()` → `feed-bootstrap`, `roster`, `profile:*`
- `invalidate.sentiment()` → `settings`, `feed-bootstrap`, `roster`, `profile:*`
- `invalidate.tag()` → `settings`, `roster`, `profile:*`
- `invalidate.employee(id)` → `roster`, `feed-bootstrap`, `profile:<id>`
- `invalidate.takeOrCloseness(id)` → `roster`, `profile:<id>`

Every write calls exactly **one** named invalidator. Plus: drop frozen-prop `useState` mirrors
(derive from SWR), delete dead `revalidatePath`, bound the roster fetch.

## Test coverage gap
- Current 41 tests cover the OLD SSR path + pure utils. New client layer = untested.
- Integration tests use the **admin key (bypasses RLS)** — the real **anon-key** browser path
  (where RLS is the only guard) is **unverified**.
- Needed (priority): (1) **anon-key RLS** isolation test, (2) optimistic write + cache
  reconcile (e2e), (3) regression tests for the bugs hit (frozen feed, stale picker, swapped
  paging), (4) extract pure functions (feed merge/dedup, optimistic-entry build, invalidation
  map) → cheap unit tests. Make `npm test` actually guard the new code.

## Open questions
1. person+tag Feed filter = AND (intersection) intended, or OR (widen)?
2. Open signup disabled on the Supabase project? (gates the cross-owner-FK risk)
3. Expected lifetime entry volume (bounds the roster fetch concern)?

## Reference
Detailed test analysis: `tester-260622-0642-*.md` (4 files, verbose — superseded by this summary).

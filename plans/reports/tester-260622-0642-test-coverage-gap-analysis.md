# Test Coverage Gap Analysis — Team Tracker PWA

**Date:** 2026-06-22  
**Scope:** Analyze existing test coverage (41 green tests) vs current architecture (SSR→client-side migration)  
**Outcome:** Prioritized test plan to close gaps exposed by recent migration + bug fixes

---

## Executive Summary

App recently migrated from SSR→client-side data fetching (commits 4e0043f, dc72aea). The existing 41 tests **do NOT reflect this architecture change**:

- **Integration tests use admin client** (bypass RLS) instead of anon client (the real path the browser uses)
- **No tests for SWR cache sync** (optimistic UI, revalidate patterns) — the frozen-entries bug (commit 7336dcc) wasn't caught by tests
- **No tests for client-side fetch functions** (`fetchRoster()`, `fetchFeedBootstrap()`, etc.) — these bear RLS responsibility now
- **No regression tests for recent bug fixes** (stale picker in commit bf63918, optimistic prepend in a6fe6da)

**Risk Level:** HIGH. The client-side data layer is untested against the actual (anon-key) RLS policies. A subtle RLS misconfiguration could silently leak data.

---

## Test Coverage Map: Current 41 Tests

### Unit Tests (29): Pure Functions, No I/O

| Area | Tests | What's Covered |
|------|-------|----------------|
| Day grouping | 2 | Asia/Saigon timezone, relative labels, order preservation |
| Sparkline points | 1 | Archive sentiment behavior, 20-point cap |
| Hex color | 1 | Color parsing + validation |
| Closeness | 1 | 5-level sentiment scale |
| Review pack | 1 | Markdown generation, date range filtering, section rendering |
| Nudges | 2 | Stale-1on1 detection, cooling calculation, edge cases |
| **Total** | **29** | **✅ Solid — pure logic well-tested** |

### Integration Tests (11): Real Supabase + RLS via Admin Client

| Test File | Count | What's Covered | **Issue** |
|-----------|-------|----------------|-----------|
| `rls-isolation.test.ts` | 2 | Cross-user visibility blocked, spoofing rejected (6 tables) | Uses `admin.auth.admin` to create users, then raw admin client queries. **Does NOT test anon-key path.** |
| `user-id-default.test.ts` | 1 | DEFAULT user_id constraint works | Admin insert. **Not the browser path.** |
| `append-only.test.ts` | 1 | Entries immutable, new rows append | Admin direct insert. **Not Server Action path.** |
| `current-take.test.ts` | 1 | `employee.current_take` overwrites (vs append-only entries) | Admin update. **Not tested via Server Action.** |
| `new-user-seed.test.ts` | 1 | 3 default sentiments on signup | Admin check. **Not tested via login flow.** |
| `sentiment-archive.test.ts` | 1 | Archive keeps color, FK RESTRICT prevents deletion | Admin manipulation. **Not realistic user scenario.** |
| `export.test.ts` | 1 | JSON export includes all data | Admin query result. **Not tested via Server Action or client fetch.** |
| `delete-data.test.ts` | 3 | Cascade delete, delete-account, orphan cleanup | Admin teardown. **Not tested via user-triggered Server Actions.** |
| **Total** | **11** | **RLS policies + DB invariants** | **⚠️ CRITICAL GAP: All tests bypass RLS (admin key) — the real client path (anon key) is untested.** |

### E2E Test (1): Browser UI + Network

| Test | What's Covered | **Issue** |
|------|----------------|-----------|
| `happy-path.spec.ts` | Login → add employee → quick-add evidence → revise take → see in feed | Linear happy path only. **No cache sync, no error recovery, no edge cases.** |
| **Total** | **1** | **Basic workflow** | **⚠️ Does NOT stress-test SWR cache patterns (the source of recent bugs).** |

---

## Stale/Misleading Tests (Architecture Shifted SSR→Client)

### The Migration

Recent commits shifted data fetching from **server-side (SSR)** to **client-side (browser):**
- Old: Server Component → Server-side fetch → `listFeedEntries()` → RLS at DB layer
- **New:** Client Component → `useSWR()` → `fetchFeedBootstrap()` → Anon client queries Supabase → RLS at DB layer

**Critical change:** The browser now holds an **anon key** and queries Supabase directly. RLS is the only guard.

### Why Existing Tests Don't Match

1. **Integration tests use admin client (`createSupabaseTestContext()`)**
   - Admin key **bypasses all RLS policies**
   - Tests pass because there's no data leak *with admin key*
   - But the real app uses **anon key** from browser
   - **Tests don't verify RLS actually works for client-side queries**
   
   **Example:** `rls-isolation.test.ts` line 23 tests:
   ```typescript
   const results = await Promise.all([
     context.userB.client.from("employees").select("id").eq("user_id", context.userA.id),
     // ... (more queries)
   ]);
   expect(result.error).toBeNull();  // ✅ Passes: admin key sees nothing, but only because RLS blocks it
   ```
   But it DOESN'T test:
   ```typescript
   const anonUserB = createAnonClient();  // Would fail because anon can't spoof user_id
   const badQuery = await anonUserB.from("employees")
     .select("id")
     .eq("user_id", context.userA.id);  // RLS blocks this ✅ (untested)
   ```

2. **Tests don't call `fetchX()` client functions — they call raw Supabase queries**
   - `fetchRoster()`, `fetchFeedBootstrap()`, `fetchProfile()`, `fetchQuickAddData()` are now the data entry points
   - These functions are untested
   - Example: `fetchFeedBootstrap()` (line 37 in feed-client.ts) calls `supabase.from("entries").select("*")` — no `.eq("user_id", userId)` explicit filter (relies on RLS)
   - **Tests don't verify RLS is working from the client path**

3. **Tests don't verify SWR cache sync — the real source of recent bugs**
   - Commit 7336dcc: "Feed reflects new notes live (don't freeze entries at mount)"
     - Bug: entries frozen at mount, new entries added via quick-add didn't appear
     - Root cause: `initialEntries` from props was stale, not re-derived from live SWR data
   - Commit bf63918: "quick-add picker shows newly added employees"
     - Bug: picker showed old employee list until reload
     - Root cause: `fetchQuickAddData()` called once; new employees added in another tab not visible
   - Commit a6fe6da: "show new note instantly (client-direct write + optimistic feed)"
     - Introduced: `prependEntryToFeed()` optimistic prepend + `revalidateAfterEntryWrite()` reconcile
     - **Neither pattern is tested**
   - **Tests don't verify these cache sync behaviors** — the frozen-entries bug was discovered in prod, not by tests

---

## Critical Untested Paths

### TIER 1: Client-Side Data Fetching via Anon Key (HIGH RISK)

All of these functions are called from the browser with an anon key. RLS is the only guard.

| Function | Why Matters | What Could Go Wrong | Missing Test |
|----------|-------------|-------------------|--------------|
| `fetchFeedBootstrap()` | Loads 50 newest entries + metadata. Called on Feed tab open. Browser makes request with anon key. | RLS fails → user sees other users' entries. No explicit `.eq("user_id", userId)` filter — relies on RLS policies. | **Missing:** Query Feed with anon key for user A; verify no user B entries returned. Repeat for user B. |
| `fetchRoster()` | Loads all employees + tags + entries + sentiments. Browser query. Anon key. | RLS fails → roster shows employees from other accounts. Sentiments include archived; archive logic could have gaps. | **Missing:** Query Roster with anon key; verify only current-user employees returned. Verify archived sentiments included (for color history). |
| `fetchProfile(employeeId)` | Loads single employee profile. URL param `employeeId` passed to function (no server validation of ownership). | RLS fails → user A fetches user B's employee via `/employees/<userB-empId>`. Potential privilege escalation. | **Missing:** Anon client for user A; attempt to fetch an employee_id that belongs to user B; verify error or empty result. |
| `fetchQuickAddData()` | Loads employees + active sentiments. Called every time quick-add sheet opens. Refetch on open was added to fix the stale-picker bug (commit bf63918). | Refetch doesn't happen or caches incorrectly → user adds employee, opens quick-add again, old list shown. Or: archived sentiments shown in picker (only active should be). | **Missing:** (a) Add employee in one flow; open quick-add; verify new employee appears. (b) Archive a sentiment; open quick-add; verify it's hidden. |
| `fetchSettings()` → `listSentimentOptions()` | Settings loads sentiments for editing. Includes archived. | Stale cached list, or wrong archive flag exposure. | **Missing:** Query Settings with anon key; create sentiment; archive it; re-fetch; verify `is_archived` flag respected. |

**Common Thread:** All use anon key from browser. RLS policies are untested for this path. Integration tests use admin key (bypasses RLS).

**Testability Blocker:** Integration test setup (`createSupabaseTestContext()`) creates an admin client, not an anon client that signs in as the user. To test the client path, new setup needed:
```typescript
// Pseudo-code (doesn't exist yet)
const userClient = createAnonClientAndSignIn(user.email, user.password);
const data = await fetchFeedBootstrap();  // Uses userClient (anon key)
expect(data.entries.every(e => e.user_id === user.id)).toBe(true);  // RLS enforced
```

---

### TIER 2: SWR Cache Sync & Optimistic UI (HIGH RISK)

All three views (Roster, Profile, Feed) use SWR with `revalidateOnFocus: true` and `keepPreviousData: true`. Recent bugs were here.

| Pattern | Why Matters | Root Cause of Recent Bugs | Missing Test |
|---------|-------------|--------------------------|--------------|
| `prependEntryToFeed(optimistic)` | Quick-add creates entry → optimistic prepend shows it instantly → revalidate fetches real row (replaces optimistic). If revalidate skipped/delayed, user sees optimistic entry with wrong ID or metadata. | Line 9–14 in swr-revalidate.ts: mutate cache without awaiting real write confirmation. | **Missing:** (a) Quick-add: fill form, submit. (b) Assert temporary entry visible immediately (optimistic). (c) Wait for server revalidate. (d) Assert row ID, timestamps, etc. correct. (e) Network error case: assert optimistic removed. |
| `revalidateAfterEntryWrite()` | After createEntry or deleteEntry, must refetch Feed + Roster + affected Profile. Cache keys must match exactly: `"roster"`, `"feed-bootstrap"`, `"profile:${id}"`. Regex `.startsWith("profile:")` at line 27. | Commit 7336dcc fixed "frozen entries" — root cause was stale `initialEntries` prop. SWR revalidate can fail if key doesn't match (e.g., typo in cache key name). | **Missing:** (a) Add entry. (b) Verify exact cache keys refetched (not just "some cache revalidated"). (c) Assert old and new entries both visible (keepPreviousData ensures smooth transition). |
| `revalidateOnFocus: true` | Tab switch triggers refetch. If user A adds entry, user B switches back to tab, should see it live (or at least on next action). | Not explicitly tested; hard to test without multi-tab simulation. | **Missing:** Multi-tab E2E: user A in tab1, user B in tab2. A adds entry. B's Feed tab still visible; B clicks elsewhere then back to Feed. Verify entry appears (or add assertion that it will appear on next refetch). |
| `keepPreviousData: true` | During refetch, old data visible (no skeleton). Prevents UI flicker. If broken, users see loading state on every interaction. | Implicit in design; not tested. | **Missing:** Quick-add "save & continue" scenario: entry 1 added → revalidate fires → entry 2 added (while reconcile in-flight). Assert both visible without skeleton flash. |
| Cache key uniqueness | Multiple Profiles open simultaneously (e.g., two browser tabs) shouldn't share cache. Keys: `"profile:<id>"` must be unique per `<id>`. | Profile key pattern at line 54 in profile-view.tsx uses `"profile:${employeeId}"`. If typo (e.g., `"profile-${id}"`), keys won't match and updates won't revalidate correctly. | **Missing:** Open two profiles in parallel (e.g., GET /employees/A and /employees/B). Verify cache keys are distinct. Verify revalidateKey works for each separately. |

**Testability Blocker:** SWR is React client state. Can't test from Node.js integration tests. Need either:
- E2E test with multi-step browser interactions (currently only 1 E2E test, linear happy path)
- Client-side integration test with SWR + mocked Supabase + useTransition assertions

---

### TIER 3: RLS Edge Cases (MEDIUM RISK)

| Scenario | Why Matters | Evidence from Code | Missing Test |
|----------|-------------|-------------------|--------------|
| Deleted employee, orphaned references | Employee deleted via Settings. If FK constraints not tight, entries/goals/tags remain. Or if soft-delete, old profile URL still works. | `delete-data.test.ts` tests cascade; but no test for "can I still access deleted employee's profile after deletion?" | **Missing:** Create employee A. Add entry to A. Delete A. Attempt to fetch profile for A. Verify 404 or null employee, not stale data. |
| Archived sentiment in historical rendering | Sentiment archived. Sparkline needs historical color. If archived sentiment color is NULL or missing, sparkline breaks. | Line 40 in roster-client.ts: `supabase.from("sentiment_options").select("*").order("order_index")` includes archived. But no test verifies rendering. | **Missing:** Create entry with sentiment S. Archive S. Re-fetch Roster. Render sparkline. Assert color is preserved (not NULL, not missing). |
| Stale employee in quick-add picker | User adds employee in one tab. Opens quick-add in another tab. Picker should show new employee (commit bf63918 added refetch on open). Bug was: list cached, not refreshed until reload. | Line 68–72 in quick-add-sheet.tsx: `if (lazy && !loadingData) { fetchQuickAddData()... }` refetch on every open. No regression test. | **Missing:** (a) Open quick-add, note employee count. (b) Add new employee (via roster dialog). (c) Re-open quick-add sheet. (d) Assert new employee in list, count incremented. (e) Simulate network delay to verify refetch still happens. |
| Tag filter consistency | Feed filters by tag. Tag→employee links in `employee_tags`. If a tag is deleted/archived, does filter still work? Do orphaned links break the filter? | Line 58–65 in feed-list.tsx: `tagEmployeeIds` computed from `tagsByEmployee` map. But `tagsByEmployee` can have orphaned tag IDs if tag is deleted. | **Missing:** Create tag T1. Assign to employee E1. Filter feed by T1. Delete T1. Assert filter error handled gracefully (no crash). |
| User isolation in concurrent writes | Two users add entries simultaneously. Must not corrupt each other's data via RLS bypass. | Not explicitly tested (only single-user E2E). | **Missing:** User A and B both open quick-add. Both add entries simultaneously (parallel requests). Assert both entries appear in their own feeds, not mixed. |

---

### TIER 4: Error Handling & Graceful Degradation (MEDIUM RISK)

| Case | Why Matters | Evidence | Missing Test |
|------|-----------|----------|--------------|
| Network error during optimistic write | Quick-add: prepend succeeds, server write fails. Optimistic entry should rollback (removed from cache). | Line 117–128 in quick-add-sheet.tsx: catch error after submit. If rollback logic fails, user sees phantom entry. | **Missing:** Mock Supabase.from().insert() to fail. Quick-add submit. Assert: (a) temporary entry flashed/rolled back (b) error message shown (c) cache cleaned up. |
| Partial bootstrap failure | `fetchFeedBootstrap()` has 5 parallel queries (line 39–50). If one fails (e.g., sentiment endpoint 500), whole fetch fails. | All throw early (line 51). No partial data fallback. | **Missing:** Mock sentiment query to fail. Call fetchFeedBootstrap(). Assert error thrown, not partial result. Or: decide if partial fallback is desired (e.g., show feed without sentiment colors). |
| Missing employee name in feed | Employee deleted. Entry still references deleted employee_id. `resolveFeedRows()` can't find name, uses "—" fallback (line 24 in feed-client.ts). | Fallback exists but untested. | **Missing:** Create entry with employee E. Delete E (cascade deletes entries? No, FK allows orphan). Query feed. Assert entry shows "—" for name, doesn't crash. |
| Supabase session timeout | Browser client token expires. Auto-refresh may fail if offline. Fetch requests will 401. | Not tested (requires long-running test or mocked time). | **Missing:** (Low priority) Mock supabase client to return 401. Attempt feed fetch. Assert error message, not hard crash. |
| Server Action error propagation | createEntry Server Action fails (e.g., DB error). Error.message returned to client. Should not leak internal details. | Server Actions in `actions/entries.ts` return `{ error: string }`. But no test for malformed input, SQL injection, etc. | **Missing:** (a) createEntry with invalid data (missing employeeId, empty content). Assert proper error message. (b) createEntry with employee ID from another user (Server Action should check). Assert error/rejection. |

---

## Prioritized Test Plan

### Phase 1: BLOCKER (Prevents shipping with confidence)

**1A. Client-side Anon-Key RLS Test (Integration)**
- **What:** Create two test users. Sign in as user A. Call `fetchRoster()`, `fetchFeedBootstrap()`, `fetchProfile()` with anon key. Verify results include only user A's data.
- **Why:** Client-side RLS is untested; data leak risk is HIGH.
- **Effort:** ~40 lines. Requires new test client setup that signs in (not admin).
- **Catches:** Misconfigured RLS policies, unfiltered queries, privilege escalation via employee_id param.

**1B. Optimistic Write + Cache Reconciliation Test (E2E or Client Integration)**
- **What:** (a) Quick-add: submit entry. (b) Assert temporary entry in feed (optimistic prepend). (c) Wait for server confirm. (d) Assert entry ID, timestamps correct (real row, not temporary). (e) Simulate network error; assert optimistic rolled back.
- **Why:** This is where the frozen-entries bug lived (commit 7336dcc). Optimistic UI is fragile.
- **Effort:** ~60 lines E2E + helper. Or ~80 lines client integration (mock SWR).
- **Catches:** Stale cache, missing revalidate, ID mismatches between optimistic and real row.

**1C. Stale Picker Regression Test (E2E)**
- **What:** Add employee in tab1. Open quick-add in tab2. Verify new employee appears in picker.
- **Why:** Bug was in commit bf63918 (stale picker). No regression test means it can happen again.
- **Effort:** ~30 lines E2E. Multi-tab.
- **Catches:** Stale `fetchQuickAddData()` cache, missing refetch on open.

---

### Phase 2: CORE (Improves coverage, catches edge cases)

**2A. Cross-User Data Isolation E2E (E2E)**
- **What:** User A adds employee E1, entry T1. User B in another browser. B attempts to view E1 (guess URL `/employees/<E1-id>`). Assert 404 or empty result (not other user's data).
- **Why:** Privilege escalation risk via URL parameter.
- **Effort:** ~40 lines E2E (multi-browser).
- **Catches:** RLS bypass via direct employee_id queries.

**2B. SWR Key Uniqueness Test (Unit or Simple E2E)**
- **What:** Verify cache keys are exactly `"roster"`, `"feed-bootstrap"`, `"profile:<id>"`. No typos. Revalidate regex matches all.
- **Why:** Key mismatch = silent cache desync.
- **Effort:** ~20 lines (grep assertions or mock SWR).
- **Catches:** Cache key typos.

**2C. Error Recovery: Network Fail During Write (E2E with mocked Supabase or client integration)**
- **What:** Mock `supabase.from("entries").insert()` to fail. Quick-add submit. Assert error message, no phantom entry.
- **Why:** Users confused by phantom entries that disappear.
- **Effort:** ~50 lines (mock Supabase or intercept XHR).
- **Catches:** Incomplete rollback logic, silent failures.

**2D. Archived Sentiment Color Preservation (Integration)**
- **What:** Create entry with sentiment S (color: `#FF0000`). Archive S. Re-fetch Roster. Render sparkline. Assert color is `#FF0000` (not NULL, not missing).
- **Why:** Archived sentiments should keep historical colors. If color is NULL, sparkline breaks.
- **Effort:** ~30 lines integration.
- **Catches:** NULL colors, missing sentiment_options in bootstrap.

---

### Phase 3: NICE-TO-HAVE (Completeness)

**3A. Rapid Successive Writes (E2E: "Save & Continue")**
- **What:** Quick-add: add entry 1 → click "Save & Continue" → add entry 2 (while revalidate from entry 1 in-flight). Assert both in feed, no dupes, no stale.
- **Why:** Real user pattern. Can expose race conditions.
- **Effort:** ~40 lines E2E.
- **Catches:** Race conditions in cache merge logic, deduplication failures (line 32–36 in feed-list.tsx has dedup via `Set<id>`; race could break it).

**3B. RevalidateOnFocus Multi-Tab (E2E)**
- **What:** User A in tab1. User B in parallel tab2. A adds entry. B's feed tab visible but in background. B clicks elsewhere then back to feed tab. Assert entry appears (revalidateOnFocus triggered refetch).
- **Why:** Live sync without tab switch is not guaranteed (spec doesn't require it). Refocus must work.
- **Effort:** ~50 lines multi-tab E2E.
- **Catches:** RevalidateOnFocus not working, stale data after tab switch.

**3C. Missing Employee Name Fallback (Integration)**
- **What:** Create entry with employee E. Delete E (or orphan the FK if possible). Query feed. Assert entry renders with "—" for name, doesn't crash.
- **Why:** Defensive: should handle orphans gracefully.
- **Effort:** ~30 lines integration.
- **Catches:** NULL dereference, crash on missing employee name.

**3D. Tag Filter with Orphaned Links (Integration)**
- **What:** Create tag T1, assign to employee E1. Delete T1. Apply tag filter. Assert no crash, appropriate error or empty result.
- **Why:** Defensive: tags can be deleted.
- **Effort:** ~35 lines integration.
- **Catches:** Foreign key constraint violations, stale tag IDs in filter.

---

## Testability Assessment

### Current Blockers

1. **No anon-key client in test setup**
   - Integration tests use `createSupabaseTestContext()` → creates admin + two users with admin clients
   - Doesn't create anon clients (the browser path)
   - To test client-side RLS, need: `const anonClient = createAnonClient(); await anonClient.auth.signInWithPassword(...); const data = await fetchRoster();`
   - **Fix:** Extend test setup to create anon clients + sign-in flow

2. **SWR cache sync can't be tested in Node.js**
   - Integration tests run Node.js; SWR is React browser state
   - Can't assert "cache key was revalidated" or "optimistic entry replaced" from Node
   - **Fix:** Either add E2E coverage (E2E runs in browser) or create a client-side test harness (vitest + React Testing Library + mocked SWR)

3. **No multi-tab/multi-browser test capability**
   - E2E test uses single Playwright browser instance
   - Can't test revalidateOnFocus or concurrent user scenarios
   - **Fix:** Extend E2E to spawn multiple browser contexts or tabs

4. **Missing pure-function extraction for testability**
   - Cache reconciliation logic (optimistic + real merge) is embedded in React components (`FeedList`, `QuickAdd`)
   - Hard to unit-test without rendering
   - **Recommendation:** Extract cache merge logic into pure function for easier testing
     - E.g., `mergeOptimisticAndReal(oldEntries: FeedEntry[], realEntries: FeedEntry[]): FeedEntry[]`
     - Deduplicate by ID, keep real row if both exist, maintain order
     - Currently spread across feed-list.tsx lines 27–36 and swr-revalidate.ts

### Recommendations for Better Testability

1. **Extract pure functions from cache sync logic**
   - `mergeEntriesWithDedup(optimistic, real): deduplicated`
   - `buildFeedCacheKey(bootstrap): string` (ensure key uniqueness)
   - `computeTagEmployeeFilter(tags, tagsByEmployee): string[]`
   - **Benefit:** Easy unit tests, no mocking

2. **Create client test harness**
   - Similar to integration test setup but with anon clients
   - Example: `createTestUserWithAnonClient()` → returns `{ user, anonClient, anon_supabase }`
   - **Benefit:** Test client-side fetch functions in isolation

3. **Add E2E multi-context support**
   - Playwright supports multiple contexts; can spawn two browser tabs/windows
   - Enables: multi-user scenarios, tab-switch tests, concurrent write detection
   - **Benefit:** Realistic user scenarios (the frozen-entries bug would've been caught)

4. **Mock Supabase at a higher level**
   - Current tests mock nothing; they hit real local Supabase
   - For error recovery tests, need to mock `.insert()` to fail, `.select()` to 500, etc.
   - Consider: MSW (Mock Service Worker) or jest.mock for Supabase JS client
   - **Benefit:** Error path testing without flaky network sim

---

## Gap Closure Roadmap

| Priority | Test Type | Effort (LOC) | Timeline | Risk Reduction |
|----------|-----------|--------------|----------|-----------------|
| Phase 1A | Integration (anon RLS) | 40 | 1 sprint | HIGH: Data leak risk |
| Phase 1B | E2E (optimistic sync) | 60 | 1 sprint | HIGH: Cache corruption risk |
| Phase 1C | E2E (stale picker) | 30 | 1 sprint | MEDIUM: Regression |
| Phase 2A | E2E (cross-user isolation) | 40 | 1 sprint | MEDIUM: Privilege escalation |
| Phase 2B | Unit (cache keys) | 20 | 1 sprint | LOW: Unlikely bug |
| Phase 2C | E2E (error recovery) | 50 | 1 sprint | MEDIUM: UX degradation |
| Phase 2D | Integration (archived color) | 30 | 1 sprint | LOW: Edge case |
| Phase 3A–D | E2E (advanced scenarios) | 40–50 each | After Phase 1 | LOW: Defensive |

**Estimate:** ~280 LOC across 4 phases, ~4 sprints (or 2 sprints if parallelized).

---

## Unresolved Questions

1. **Should `keepPreviousData: true` be tested explicitly?** Currently assumed to work; no test verifies old data is visible during refetch.
2. **Is multi-user concurrent-write testing in scope for MVP?** Spec is single-user PWA; but RLS must still protect multi-user accounts (if schema supports it). Should test this?
3. **Should archived sentiment be testable via UI (Settings) or only via integration test?** Currently Settings UI not E2E-tested; only raw DB test.
4. **Is the "quick-add refetch on every open" behavior intentional or workaround?** Commit bf63918 added it post-bug. Should it be tested as regression-safe or as implementation detail?
5. **Should error messages be translated (Vietnamese) in error recovery tests?** Tests currently en-only; production messages are Vietnamese. Risk: translation bugs untested.

---

## Conclusion

The app's client-side migration is **untested against real RLS policies**. Integration tests use admin keys (bypass RLS); E2E test is linear happy-path (no cache sync stress). The frozen-entries bug (commit 7336dcc) wasn't caught by tests because SWR cache patterns are unverified.

**Recommended action:** Implement Phase 1 tests (3 tests, ~130 LOC, ~1 sprint) to unblock shipping. Ensures anon-key RLS works, optimistic writes reconcile, picker stays fresh.

Phase 2–3 tests improve edge-case coverage and prevent regressions (ideal, not critical).

**Next step:** Extend test setup to create anon clients + sign-in. Then run Phase 1 tests. Gaps will surface quickly.

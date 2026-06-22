# Test Coverage Gap: Quick Reference

## The Problem in 30 Seconds

App migrated from **SSR→client-side** data fetching (June). Existing 41 tests **do NOT test the client-side path**:

- Tests use **admin key** (bypasses RLS) ❌
- Real app uses **anon key** from browser (RLS is the only guard) ✅
- **Result:** RLS is untested; data leak risk is HIGH

Recent bugs (frozen entries, stale picker) weren't caught by tests because **SWR cache sync is untested**.

---

## Current Test Coverage: 41 Green Tests

| Type | Count | Quality | Issue |
|------|-------|---------|-------|
| Unit | 29 | ✅ Solid | Pure logic well-tested |
| Integration | 11 | ⚠️ STALE | Use admin key, not anon key — RLS bypassed |
| E2E | 1 | ⚠️ LIMITED | Happy path only; no cache sync, no errors |
| **Total** | **41** | **INCOMPLETE** | **Client-side RLS + cache sync untested** |

---

## What's Untested (Ranked by Risk)

### 🔴 TIER 1: BLOCKER (Must fix before confident shipping)

| What | Why | Impact | Effort | Status |
|------|-----|--------|--------|--------|
| **Anon-key RLS** (client-side queries) | Tests use admin key (bypasses RLS). Real app queries Supabase as anon user. RLS is untested. | Data leak: User A could see User B's employees/entries. | 40 LOC | NOT TESTED |
| **Optimistic write + cache reconciliation** | Quick-add: prepend entry → show instantly → revalidate replaces with real row. If revalidate fails, stale entry visible. Bug: commit 7336dcc "frozen entries". | User sees phantom entries or stale data. | 60 LOC E2E | NOT TESTED |
| **Stale picker regression** | Quick-add picker should refetch on every open. Bug (commit bf63918): old employee list shown until reload. Fixed; no regression test. | User adds employee, opens quick-add again, new employee missing. | 30 LOC E2E | NOT TESTED |

### 🟠 TIER 2: CORE (Improves robustness)

| What | Why | Impact | Effort | Status |
|------|-----|--------|--------|--------|
| **Cross-user privilege escalation** | User A guesses User B's employee URL. RLS should block; untested. | User A views User B's profile + historical data. | 40 LOC E2E | NOT TESTED |
| **Cache key uniqueness** | Typo in key name → cache doesn't revalidate → stale data. E.g., `"profile-${id}"` instead of `"profile:${id}"`. | Users see stale employee profiles across tabs. | 20 LOC | NOT TESTED |
| **Error recovery during write** | Network fails during optimistic write. Entry should roll back; untested. | Phantom entries; confusing UX. | 50 LOC E2E | NOT TESTED |
| **Archived sentiment colors** | Sentiment archived; sparkline needs historical color. If NULL, sparkline breaks. | Roster sparklines render incorrectly or crash. | 30 LOC integration | NOT TESTED |

### 🟡 TIER 3: DEFENSIVE (Nice-to-have)

- Rapid successive writes (race conditions)
- Multi-tab revalidateOnFocus
- Missing employee name fallback
- Orphaned tag references
- ~40–50 LOC each

---

## Why Tests Are Stale

### Migration: SSR → Client-Side

```
OLD (SSR) → Server-side fetch → RLS at DB
  Server Component calls listFeedEntries()
  Server has user context (auth verified)
  ✅ RLS works

NEW (Client) → Browser fetch → RLS at DB
  Client Component calls fetchFeedBootstrap()
  Browser has anon key (RLS is ONLY guard)
  ⚠️ RLS is untested (admin key tests bypass it)
```

### Example: Integration Test ❌

```typescript
// Current test (WRONG PATH):
const admin = createAdminTestClient();  // Admin key — bypasses RLS
const result = await admin.from("entries").select("*");
// ✅ Passes because admin key sees no other users' entries
// BUT: Doesn't test real app path (anon key + RLS)

// Correct test (MISSING):
const anonClient = createAnonClientAndSignIn(user);  // Anon key
const result = await anonClient.from("entries").select("*");
// RLS filters to user's entries only
// Anon can't see other users' entries
```

---

## Recommended Test Plan (4 Phases)

### Phase 1: BLOCKER (1 sprint, ~130 LOC, HIGH impact)

| # | Test | Type | Why |
|---|------|------|-----|
| 1A | Anon-key RLS (roster, feed, profile) | Integration | Client-side RLS untested |
| 1B | Optimistic write + cache reconciliation | E2E | Frozen-entries bug not caught |
| 1C | Stale picker regression | E2E | Commit bf63918 not regression-tested |

**Goal:** Unblock shipping with confidence in RLS + cache sync.

### Phase 2: CORE (1 sprint, ~180 LOC)

| # | Test | Type | Why |
|---|------|------|-----|
| 2A | Cross-user isolation (privilege escalation) | E2E | URL-param privilege risk |
| 2B | Cache key uniqueness | Unit | Silent desync risk |
| 2C | Error recovery (network fail) | E2E | Incomplete rollback risk |
| 2D | Archived sentiment colors | Integration | Sparkline edge case |

**Goal:** Improve robustness for production use.

### Phase 3 & 4: DEFENSIVE (After Phase 2)

- Race conditions (rapid writes)
- Multi-tab scenarios
- Fallback paths (orphans, missing data)

---

## How to Implement

### 1. Extend Test Setup

Create anon client + sign-in flow:

```typescript
// tests/setup/anon-test-clients.ts (doesn't exist yet)
export async function createAnonClientAndSignIn(email: string, password: string) {
  const anonClient = createClient();  // Browser anon key
  await anonClient.auth.signInWithPassword({ email, password });
  return anonClient;
}
```

### 2. Write Phase 1A Test (Anon-key RLS)

```typescript
it("anon client can only see own entries", async () => {
  const userA = await createTestUser(admin, "A");
  const userB = await createTestUser(admin, "B");
  
  // User A adds entry
  const anonA = await createAnonClientAndSignIn(userA.email, userA.password);
  const entryA = await anonA.from("entries").insert({ ... }).select();
  
  // User B tries to see it (should fail RLS)
  const anonB = await createAnonClientAndSignIn(userB.email, userB.password);
  const badQuery = await anonB.from("entries").select("*");
  expect(badQuery.data).toEqual([]);  // Empty, not entryA
});
```

### 3. Write Phase 1B Test (Optimistic Sync)

Use Playwright with network interception or extend E2E test.

### 4. Write Phase 1C Test (Stale Picker)

Multi-tab E2E or simulate with rapid requests.

---

## Testability Gaps

| Gap | Why | Fix |
|-----|-----|-----|
| No anon-key setup | Integration tests use admin | Extend test setup to create anon client + sign-in |
| SWR cache untestable in Node.js | Integration tests are Node.js; SWR is React | Expand E2E (browser) or add client test harness |
| No multi-tab testing | Single Playwright instance | Spawn multiple Playwright contexts |
| Cache sync logic in components | Spread across FeedList + QuickAdd + swr-revalidate | Extract pure functions: `mergeEntries()`, `buildCacheKey()` |

---

## Impact Matrix

| Test | Catches | Effort | Priority |
|------|---------|--------|----------|
| Anon-key RLS | Data leak (CRITICAL) | 40 LOC | 🔴 P0 |
| Optimistic sync | Stale UI (CRITICAL) | 60 LOC | 🔴 P0 |
| Stale picker | Regression (MEDIUM) | 30 LOC | 🔴 P0 |
| Cross-user isolation | Privilege escalation (HIGH) | 40 LOC | 🟠 P1 |
| Cache key uniqueness | Silent desync (MEDIUM) | 20 LOC | 🟠 P1 |
| Error recovery | UX degradation (MEDIUM) | 50 LOC | 🟠 P1 |
| Archived colors | Edge case (LOW) | 30 LOC | 🟠 P1 |

---

## Bottom Line

✅ **What works:** Core invariants (append-only, RLS rejection at DB layer, new-user seed, cascade delete)  
❌ **What's broken:** RLS verification for anon key, SWR cache sync, error recovery  
⚠️ **Risk level:** HIGH — data leak + cache corruption possible

**Next step:** Implement Phase 1 tests (3 tests, ~130 LOC). Gaps will surface immediately when you try to create anon clients and call `fetchX()` functions. If tests pass, you'll have real confidence in the client-side path.

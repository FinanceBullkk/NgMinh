# Test Implementation Roadmap

**Purpose:** Concrete steps to close test coverage gaps (detailed checklist format)

---

## Phase 1: BLOCKER TESTS (1 sprint, ~130 LOC)

### Prerequisite: Extend Test Setup

**File:** `tests/setup/anon-test-clients.ts` (NEW)

```typescript
// Create anon client, sign in as user, return signed-in client
export async function createAnonClientAndSignIn(
  email: string,
  password: string,
): Promise<ReturnType<typeof createClient>> {
  const client = createClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

// Test helper: create user via admin, then sign in as that user with anon key
export async function createTestUserAndSignInAsAnon(
  admin: TestClient,
  prefix: string,
): Promise<{ user: TestUser; anonClient: ReturnType<typeof createClient> }> {
  const user = await createTestUser(admin, prefix);
  const anonClient = await createAnonClientAndSignIn(user.email, user.password);
  return { user, anonClient };
}
```

**Verification:** Can successfully sign in with anon key and run a query.

---

### Test 1A: Anon-Key RLS (fetchRoster, fetchFeedBootstrap, fetchProfile)

**File:** `tests/integration/anon-key-rls.test.ts` (NEW)  
**Type:** Integration  
**Dependencies:** anon-test-clients.ts  
**Estimated LOC:** 40

**Structure:**

```typescript
describe("anon-key RLS (client-side data fetching)", () => {
  let admin: TestClient;
  let userA: TestUser, anonA: ReturnType<typeof createClient>;
  let userB: TestUser, anonB: ReturnType<typeof createClient>;
  let empA: Employee;  // userA's employee
  let entryA: Entry;   // userA's entry

  beforeAll(async () => {
    admin = createAdminTestClient();
    const ctxA = await createTestUserAndSignInAsAnon(admin, "A");
    const ctxB = await createTestUserAndSignInAsAnon(admin, "B");
    userA = ctxA.user;
    anonA = ctxA.anonClient;
    userB = ctxB.user;
    anonB = ctxB.anonClient;
    
    // User A owns employee + entry
    empA = await createEmployee(anonA);
    entryA = await createEntry(anonA, empA.id, "Test entry");
  });

  afterAll(async () => {
    await admin.auth.admin.deleteUser(userA.id);
    await admin.auth.admin.deleteUser(userB.id);
  });

  it("fetchRoster returns only current-user employees", async () => {
    // User A fetches roster
    const rosterA = await fetchRoster(anonA);
    expect(rosterA.cards.every(c => c.user_id === userA.id)).toBe(true);
    
    // User B fetches roster (should be empty or contain only B's data)
    const rosterB = await fetchRoster(anonB);
    expect(rosterB.cards.every(c => c.user_id === userB.id)).toBe(true);
    expect(rosterB.cards.map(c => c.id)).not.toContain(empA.id);
  });

  it("fetchFeedBootstrap returns only current-user entries", async () => {
    const feedA = await fetchFeedBootstrap(anonA, 50);
    expect(feedA.entries.every(e => e.user_id === userA.id)).toBe(true);
    expect(feedA.entries.map(e => e.id)).toContain(entryA.id);
    
    const feedB = await fetchFeedBootstrap(anonB, 50);
    expect(feedB.entries.every(e => e.user_id === userB.id)).toBe(true);
    expect(feedB.entries.map(e => e.id)).not.toContain(entryA.id);
  });

  it("fetchProfile returns only current-user profile data", async () => {
    const profileA = await fetchProfile(anonA, empA.id);
    expect(profileA.employee?.id).toBe(empA.id);
    expect(profileA.employee?.user_id).toBe(userA.id);
    
    // User B attempts to fetch User A's employee (should fail RLS or return null)
    const profileB = await fetchProfile(anonB, empA.id);
    expect(profileB.employee).toBeNull();  // RLS filters it out
  });

  it("fetchQuickAddData returns only current-user employees and active sentiments", async () => {
    const quickAddA = await fetchQuickAddData(anonA);
    expect(quickAddA.employees.every(e => e.id in empA.user_id)).toBe(true);
    
    const quickAddB = await fetchQuickAddData(anonB);
    expect(quickAddB.employees.map(e => e.id)).not.toContain(empA.id);
  });

  it("anon client cannot spoof user_id in inserts", async () => {
    // User B tries to insert employee with User A's user_id
    const spoofAttempt = await anonB.from("employees")
      .insert({ name: "Spoof", user_id: userA.id });
    
    expect(spoofAttempt.error?.code).toBe("42501");  // Permission denied (RLS)
  });
});
```

**Assertions:**
- [ ] User A's roster contains only A's employees
- [ ] User B's roster contains only B's employees
- [ ] User B cannot see User A's entries in Feed
- [ ] User B cannot fetch User A's employee profile (by ID)
- [ ] Quick-add picker lists only current-user employees
- [ ] Spoofing `user_id` in insert is rejected (RLS)

**Catches:** Data leak, RLS bypass, privilege escalation

---

### Test 1B: Optimistic Write + Cache Reconciliation

**File:** `tests/e2e/optimistic-write-reconciliation.spec.ts` (NEW)  
**Type:** E2E (Playwright)  
**Estimated LOC:** 60

**Scenario:**
1. Quick-add sheet: fill form, submit
2. Assert temporary entry appears in Feed (optimistic prepend) **immediately**
3. Wait for server write confirmation
4. Assert row ID, timestamps are correct (real row, not temporary)
5. Simulate error: mock insert to fail
6. Assert optimistic entry removed, error shown

**Implementation:**

```typescript
test("optimistic prepend + cache reconciliation", async ({ page }) => {
  await login(page, testUser);
  await page.goto("http://localhost:3100/feed");
  
  // Wait for Feed to load
  await expect(page.locator("[data-testid=feed-ready]")).toBeVisible();
  const initialEntryCount = await page.locator("[data-testid=feed-entry]").count();
  
  // Open quick-add
  await page.getByRole("button", { name: /\+ Ghi/ }).click();
  
  // Fill and submit
  const observation = `Test obs ${Date.now()}`;
  await page.getByPlaceholder(/Quan sát/).fill(observation);
  await page.getByRole("button", { name: "Tích cực" }).click();
  await page.getByRole("button", { name: "Lưu" }).click();
  
  // ✅ Assert optimistic entry appears IMMEDIATELY (before server confirms)
  await expect(page.getByText(observation, { exact: true })).toBeVisible({ timeout: 100 });
  const afterOptimistic = await page.locator("[data-testid=feed-entry]").count();
  expect(afterOptimistic).toBe(initialEntryCount + 1);
  
  // Get the temporary entry (won't have a real ID yet if optimistic)
  const optimisticEntry = page.getByText(observation).first();
  const optimisticId = await optimisticEntry.getAttribute("data-entry-id");
  
  // ✅ Wait for server revalidate (replace with real row)
  await page.waitForTimeout(1000);  // Brief wait for revalidate
  
  // Assert real entry exists with correct metadata
  const realEntry = page.locator(`[data-entry-id!="${optimisticId}"]`).filter({ hasText: observation }).first();
  expect(realEntry).toBeDefined();
  
  // Extract real ID (should be a valid UUID, not "temp-xyz")
  const realId = await realEntry.getAttribute("data-entry-id");
  expect(realId).toMatch(/^[0-9a-f-]{36}$/);  // UUID format
});

test("optimistic rollback on error", async ({ page }) => {
  // Mock: intercept quick-add save request, return 500
  await page.route("**/rest/v1/entries*", (route) => {
    if (route.request().method() === "POST") {
      route.abort("servererror");
    }
  });
  
  await login(page, testUser);
  await page.goto("http://localhost:3100/feed");
  const initialCount = await page.locator("[data-testid=feed-entry]").count();
  
  // Quick-add: submit (will fail)
  await page.getByRole("button", { name: /\+ Ghi/ }).click();
  await page.getByPlaceholder(/Quan sát/).fill("Bad entry");
  await page.getByRole("button", { name: "Lưu" }).click();
  
  // ✅ Optimistic shows
  await expect(page.getByText("Bad entry")).toBeVisible({ timeout: 100 });
  
  // ✅ Error message appears
  await expect(page.getByText(/Lỗi|Error/i)).toBeVisible({ timeout: 1000 });
  
  // ✅ Optimistic entry removed (rollback)
  await page.waitForTimeout(500);
  const afterError = await page.locator("[data-testid=feed-entry]").count();
  expect(afterError).toBe(initialCount);  // Back to initial count
});
```

**Prerequisites:**
- Add `data-testid` attributes to Feed entries (component: feed-day-group.tsx)
- Ensure quick-add sheet returns focus to main thread after submit (for wait/assert timing)

**Catches:** Stale cache, missing revalidate, ID mismatches, incomplete rollback

---

### Test 1C: Stale Picker Regression (Commit bf63918)

**File:** `tests/e2e/stale-picker-regression.spec.ts` (NEW)  
**Type:** E2E (Playwright, multi-tab simulation)  
**Estimated LOC:** 30

**Scenario:**
1. User A: open quick-add, note employee count = N
2. User A: via roster dialog, add new employee "New Emp"
3. User A: close and re-open quick-add sheet
4. Assert employee count = N+1, "New Emp" in list

**Implementation:**

```typescript
test("quick-add picker shows newly added employees", async ({ page }) => {
  await login(page, testUser);
  await page.goto("http://localhost:3100/");
  
  // Open quick-add, count employees
  await page.getByRole("button", { name: /\+ Ghi|FAB/ }).click();
  const pickerDialog1 = page.getByRole("dialog");
  const empCount1 = await pickerDialog1.getByRole("option").count();
  
  // Close quick-add
  await page.getByRole("button", { name: /Đóng|Close/i }).click();
  
  // Add employee via Roster (or inline button in quick-add)
  await page.getByRole("button", { name: /\+ Nhân viên/ }).click();
  const addEmpDialog = page.getByRole("dialog");
  await addEmpDialog.getByLabel("Tên").fill("New Employee");
  await addEmpDialog.getByRole("button", { name: "Lưu" }).click();
  
  // Re-open quick-add
  await page.getByRole("button", { name: /\+ Ghi|FAB/ }).click();
  const pickerDialog2 = page.getByRole("dialog");
  const empCount2 = await pickerDialog2.getByRole("option").count();
  
  // ✅ New employee appears
  expect(empCount2).toBe(empCount1 + 1);
  await expect(pickerDialog2.getByRole("option", { name: "New Employee" })).toBeVisible();
});
```

**Prerequisites:**
- Quick-add picker must be rendered with `<select>` or `<div role="listbox">` options
- Component must call `fetchQuickAddData()` on every open (already does, per line 68–72 quick-add-sheet.tsx)

**Catches:** Stale picker cache, missing refetch on open

---

## Phase 2: CORE TESTS (1 sprint, ~180 LOC)

### Test 2A: Cross-User Privilege Escalation (Employee Profile URL)

**File:** `tests/e2e/cross-user-isolation.spec.ts` (NEW)  
**Type:** E2E (Playwright, multi-user)  
**Estimated LOC:** 40

**Scenario:**
1. User A: create employee E1 (get URL `/employees/<E1-id>`)
2. User B: login in **second browser context**
3. User B: attempt to visit `/employees/<E1-id>` (URL from User A)
4. Assert: 404, empty profile, or error (not leaked data)

**Implementation:**

```typescript
test("cannot access another user's employee profile", async ({ browser }) => {
  // User A: create employee
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await login(pageA, userA);
  
  await pageA.goto("http://localhost:3100/");
  await pageA.getByRole("button", { name: /\+ Nhân viên/ }).click();
  const dialog = pageA.getByRole("dialog");
  await dialog.getByLabel("Tên").fill("Secret Employee");
  await dialog.getByRole("button", { name: "Lưu" }).click();
  
  // Extract employee ID from URL
  await pageA.goto("http://localhost:3100/employees/");
  const empLink = pageA.getByRole("link", { name: "Secret Employee" });
  const empUrl = new URL((await empLink.getAttribute("href")) || "");
  const empId = empUrl.pathname.split("/").pop();
  
  // User B: attempt to access same employee
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await login(pageB, userB);
  
  await pageB.goto(`http://localhost:3100/employees/${empId}`);
  
  // ✅ Assert: no data leaked
  // Option 1: profile shows "not found"
  await expect(pageB.getByText(/Không tìm thấy|Not found/i)).toBeVisible();
  // Option 2: no employee name rendered
  await expect(pageB.getByText("Secret Employee")).not.toBeVisible();
});
```

**Catches:** RLS bypass, privilege escalation via URL param

---

### Test 2B: Cache Key Uniqueness

**File:** `tests/unit/swr-cache-keys.test.ts` (NEW)  
**Type:** Unit  
**Estimated LOC:** 20

**Assertions:**
- Cache keys are exactly: `"roster"`, `"feed-bootstrap"`, `"profile:<id>"`
- No typos like `"profile-<id>"` (dash vs colon)
- Revalidate regex `key.startsWith("profile:")` matches all profile keys
- No collision between keys (all unique)

**Implementation:**

```typescript
import { describe, expect, it } from "vitest";
import { revalidateAfterEntryWrite } from "@/lib/swr-revalidate";

describe("SWR cache keys", () => {
  it("core keys are unique and formatted correctly", () => {
    const keys = ["roster", "feed-bootstrap", "profile:emp-123", "profile:emp-456"];
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);  // No dupes
  });

  it("profile key regex matches all profile keys", () => {
    const regex = /^profile:/;  // From line 27 in swr-revalidate.ts
    expect(regex.test("profile:emp-123")).toBe(true);
    expect(regex.test("profile:emp-456")).toBe(true);
    expect(regex.test("profile-emp-123")).toBe(false);  // Catch typo
  });

  it("revalidateKey pattern matches expected keys", () => {
    const pattern = (key: string) =>
      typeof key === "string" &&
      (key === "roster" || key === "feed-bootstrap" || key.startsWith("profile:"));
    
    expect(pattern("roster")).toBe(true);
    expect(pattern("feed-bootstrap")).toBe(true);
    expect(pattern("profile:emp-123")).toBe(true);
    expect(pattern("settings")).toBe(false);  // Not revalidated (intentional)
  });
});
```

**Catches:** Cache key typos, silent desync

---

### Test 2C: Error Recovery (Network Fail During Write)

**File:** `tests/e2e/error-recovery.spec.ts` (NEW)  
**Type:** E2E (Playwright with network interception)  
**Estimated LOC:** 50

**Scenario:**
1. Mock Supabase `POST /entries` to fail (500)
2. Quick-add: submit entry
3. Assert: error message shown, no phantom entry in feed

**Implementation:**

```typescript
test("network error during write rolls back optimistic entry", async ({ page }) => {
  // Intercept Supabase entry insert — fail it
  await page.route("**/rest/v1/entries*", (route, request) => {
    if (request.method() === "POST") {
      route.abort("servererror");  // Network error
    } else {
      route.continue();
    }
  });
  
  await login(page, testUser);
  await page.goto("http://localhost:3100/feed");
  const initialCount = await page.locator("[data-testid=feed-entry]").count();
  
  // Quick-add: submit (will fail)
  await page.getByRole("button", { name: /\+ Ghi/ }).click();
  await page.getByPlaceholder(/Quan sát/).fill("Will fail");
  await page.getByRole("button", { name: "Lưu" }).click();
  
  // ✅ Optimistic appears
  await expect(page.getByText("Will fail")).toBeVisible({ timeout: 100 });
  
  // ✅ Error message
  await expect(page.getByText(/Lỗi|Error/i)).toBeVisible({ timeout: 1000 });
  
  // ✅ Optimistic removed
  await page.waitForTimeout(500);
  const finalCount = await page.locator("[data-testid=feed-entry]").count();
  expect(finalCount).toBe(initialCount);
});
```

**Catches:** Incomplete rollback, silent failures, orphaned cache entries

---

### Test 2D: Archived Sentiment Colors in Sparkline

**File:** `tests/integration/archived-sentiment-colors.test.ts` (NEW)  
**Type:** Integration  
**Estimated LOC:** 30

**Scenario:**
1. Create sentiment S1 with color `#FF0000`
2. Add entry E1 with sentiment S1
3. Archive S1
4. Fetch Roster; verify sparkline color for E1 is `#FF0000` (not NULL)

**Implementation:**

```typescript
it("sparkline uses archived sentiment colors", async () => {
  const client = anonClient;
  
  // Create sentiment
  const sent = await client.from("sentiment_options")
    .insert({ label: "Archived", color: "#FF0000", order_index: 1 })
    .select()
    .single();
  
  // Create employee + entry with sentiment
  const emp = await createEmployee(client);
  await client.from("entries")
    .insert({
      employee_id: emp.id,
      type: "win",
      content: "Test",
      sentiment_id: sent.data?.id,
    });
  
  // Archive sentiment
  await client.from("sentiment_options")
    .update({ is_archived: true })
    .eq("id", sent.data?.id);
  
  // Fetch roster
  const roster = await fetchRoster(client);
  const card = roster.cards.find(c => c.id === emp.id);
  
  // ✅ Sparkline colors include archived sentiment color
  expect(card?.sentimentColors).toContain("#FF0000");
  expect(card?.sentimentColors).not.toContain(null);
});
```

**Catches:** NULL colors, missing sentiment options in bootstrap, broken sparklines

---

## Implementation Checklist

### Pre-Flight (Before Writing Tests)

- [ ] Review current test setup in `tests/setup/supabase-test-clients.ts`
- [ ] Identify where admin vs anon clients are created
- [ ] Check if Playwright config supports multiple browser contexts
- [ ] Add `data-testid` attributes to Feed components (feed-day-group.tsx, etc.)
- [ ] Verify test database can be reset between runs (no side effects)

### Phase 1 (Week 1)

- [ ] Create `tests/setup/anon-test-clients.ts`
  - [ ] Export `createAnonClientAndSignIn(email, password)`
  - [ ] Export `createTestUserAndSignInAsAnon(admin, prefix)`
  - [ ] Test: sign in works, can query own data
  
- [ ] Write `tests/integration/anon-key-rls.test.ts`
  - [ ] Test 1A.1: Roster isolation
  - [ ] Test 1A.2: Feed isolation
  - [ ] Test 1A.3: Profile isolation
  - [ ] Test 1A.4: Spoofing rejection
  - [ ] Run: `npm run test:integration -- anon-key-rls`
  - [ ] Debug any failures (usually RLS policy misconfigs)

- [ ] Write `tests/e2e/optimistic-write-reconciliation.spec.ts`
  - [ ] Test 1B.1: Optimistic prepend + reconciliation
  - [ ] Test 1B.2: Optimistic rollback on error
  - [ ] Run: `npm run test:e2e -- optimistic-write`
  - [ ] Debug timing issues (may need to increase waits)

- [ ] Write `tests/e2e/stale-picker-regression.spec.ts`
  - [ ] Test 1C: Picker refresh on open
  - [ ] Run: `npm run test:e2e -- stale-picker`

### Phase 2 (Week 2)

- [ ] Write `tests/e2e/cross-user-isolation.spec.ts` (Test 2A)
- [ ] Write `tests/unit/swr-cache-keys.test.ts` (Test 2B)
- [ ] Write `tests/e2e/error-recovery.spec.ts` (Test 2C)
- [ ] Write `tests/integration/archived-sentiment-colors.test.ts` (Test 2D)

### Testing & Iteration

- [ ] Run all Phase 1 tests: `npm test`
- [ ] Fix failures
- [ ] Commit: `test: add anon-key RLS, optimistic sync, stale picker tests`
- [ ] Run all Phase 2 tests
- [ ] Commit: `test: add cross-user, cache keys, error recovery, archived color tests`

### Success Criteria

- [ ] All Phase 1 tests pass (3/3)
- [ ] All Phase 2 tests pass (4/4)
- [ ] Coverage improves from 41 → ~60+ tests
- [ ] No regressions in existing 41 tests
- [ ] CI/CD green (lint, build, all tests)

---

## Estimated Timeline

| Phase | Tests | LOC | Days | Status |
|-------|-------|-----|------|--------|
| Prerequisite | Setup extension | 15 | 0.5 | TODO |
| Phase 1 | 3 blocker tests | 130 | 2–3 | TODO |
| Phase 2 | 4 core tests | 180 | 2–3 | TODO |
| **Total** | **7 new tests** | **~325 LOC** | **~5 days** | TODO |

---

## Notes

1. **Anon-key setup is critical:** Once you have `createAnonClientAndSignIn()`, the rest of the tests become straightforward (just calling client-side fetch functions with the anon client).

2. **E2E timing is tricky:** Optimistic UI might flash too fast; use `{ timeout: 100 }` to catch it. Revalidate might take longer; use `waitForTimeout(1000)` strategically.

3. **Error recovery requires network mocking:** Playwright's `page.route()` can intercept and fail requests. Alternative: MSW (Mock Service Worker) if you want server-level mocking.

4. **Archived sentiment test:** Make sure the test data setup correctly links entry → archived sentiment. Verify the sentiment still appears in all-sentiments query (for color lookup).

5. **No changes to app code needed:** All these tests are additive. No refactoring required (yet). If tests fail, the issue is likely RLS policy or cache key mismatch.

---

## After Tests Pass: Next Steps

1. **Code review:** Share tests with team, verify they match spec invariants.
2. **Run in CI:** Add test suite to GitHub Actions (already set up, just ensure Phase 1+2 run).
3. **Phase 3 (optional):** If time allows, add defensive tests (race conditions, multi-tab, fallbacks).
4. **Refactor for testability:** Extract pure functions from cache sync (e.g., `mergeEntriesWithDedup()`) for easier future testing.
5. **Documentation:** Update `tests/README.md` with Phase 1+2 coverage summary.

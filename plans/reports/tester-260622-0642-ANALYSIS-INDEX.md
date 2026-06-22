# Test Coverage Gap Analysis — Complete Report (2026-06-22)

## 📋 Executive Summary

This analysis examines test coverage for the Team Tracker PWA after a recent **SSR → client-side migration**. Current 41 tests are **STALE**: they test the old architecture (via admin DB access) instead of the new architecture (browser anon key + RLS).

**Key Finding:** Client-side data fetching and SWR cache sync patterns are untested. The frozen-entries bug (commit 7336dcc) and stale-picker bug (commit bf63918) were not caught by tests — they're now fixed but have no regression tests.

**Risk Level:** HIGH. RLS policies are untested for the anon-key path (the real browser path). Data leak risk exists.

---

## 📁 Report Structure

### 1. **Main Analysis** (`test-coverage-gap-analysis.md` — 27 KB)
   
   **Comprehensive breakdown of what's tested vs what's missing.**
   
   Sections:
   - Test Coverage Map: Current 41 tests by type and quality
   - Stale/Misleading Tests: Why existing tests don't match the new architecture
   - Critical Untested Paths: 4-tier gap list (TIER 1: BLOCKER down to TIER 4: defensive)
   - Testability Assessment: Current blockers and recommendations
   - Gap Closure Roadmap: Priority matrix with effort/timeline
   - Unresolved Questions: 5 open questions needing clarification

   **Read this if:** You need the full picture of coverage gaps and their root causes.

---

### 2. **Quick Reference** (`test-plan-summary.md` — 7.6 KB)
   
   **One-page summary for quick decision-making.**
   
   Sections:
   - Problem in 30 seconds
   - Current coverage matrix (41 tests)
   - Untested paths (TIER 1–3 ranked by risk)
   - Why tests are stale (SSR → client migration explained)
   - Recommended test plan (4 phases, effort, priority)
   - How to implement (3-step process)
   - Testability gaps (4 blockers + fixes)
   - Impact matrix (what each test catches)
   - Bottom line (what works, what's broken, next steps)

   **Read this if:** You need a 5-minute overview before deciding whether to act.

---

### 3. **Implementation Roadmap** (`implementation-roadmap.md` — 20 KB)
   
   **Concrete, step-by-step guide to write the tests.**
   
   Sections:
   - Prerequisite: Extend test setup (new file: `anon-test-clients.ts`)
   - Phase 1 BLOCKER TESTS (3 tests, 130 LOC, 1 sprint):
     - Test 1A: Anon-key RLS (fetchRoster, fetchFeedBootstrap, fetchProfile)
     - Test 1B: Optimistic write + cache reconciliation
     - Test 1C: Stale picker regression
   - Phase 2 CORE TESTS (4 tests, 180 LOC, 1 sprint):
     - Test 2A: Cross-user privilege escalation
     - Test 2B: Cache key uniqueness
     - Test 2C: Error recovery (network fail)
     - Test 2D: Archived sentiment colors
   - Implementation Checklist (pre-flight, week-by-week tasks)
   - Timeline & Success Criteria
   - Notes on tricky bits (timing, mocking, setup)

   **Read this if:** You're ready to start writing tests and need detailed pseudocode/structure.

---

## 🎯 Key Findings

### What's Working ✅
- **Core invariants:** Append-only entries, current_take overwrite, sentiment archive keeps color
- **RLS at DB layer:** Spoofing rejected, cross-user visibility blocked (when tested via admin key)
- **New-user seed:** 3 default sentiments created correctly
- **Cascade deletes:** User deletion cleans up all related data
- **Unit logic:** Day grouping, sparkline rendering, nudge calculation, review pack generation

### What's Broken / Untested ❌
1. **Anon-key RLS:** Client-side queries use anon key; RLS is only guard. Tests use admin key (bypasses RLS). **RLS for the real browser path is untested.**
2. **SWR cache sync:** Optimistic prepend + revalidate patterns untested. Frozen-entries bug (commit 7336dcc) wasn't caught.
3. **Stale picker:** Quick-add picker should refresh on every open. Bug (commit bf63918) fixed but no regression test.
4. **Error recovery:** Optimistic entry should roll back on network error. Untested.
5. **Cross-user isolation:** Can User A access User B's employee profile via URL? Untested.

### Why Tests Are Stale

**The Migration (June 2026):**
- **Old (SSR):** Server Component → `listFeedEntries()` (server-side) → DB (RLS active)
- **New (Client):** Client Component → `useSWR()` → `fetchFeedBootstrap()` (browser) → DB (RLS active)

**The Problem:**
- Integration tests use `createAdminTestClient()` → admin key → **bypasses RLS**
- Real app uses anon key from browser → **RLS is the only guard**
- Tests pass because they're not testing the real path

---

## 📊 Coverage Metrics

| Metric | Current | Gap |
|--------|---------|-----|
| Total tests | 41 | — |
| Unit tests | 29 | ✅ Good (pure functions) |
| Integration tests | 11 | ❌ Wrong path (admin key, not anon) |
| E2E tests | 1 | ❌ Shallow (happy path, no edge cases) |
| Client-side RLS coverage | 0% | ⚠️ CRITICAL |
| SWR cache sync coverage | 0% | ⚠️ CRITICAL |
| Error recovery coverage | 0% | ⚠️ MEDIUM |
| **Recommended to add** | **~20 tests** | Phase 1 (7) + Phase 2 (4) + Phase 3–4 (9) |

---

## 🚀 Recommended Action Plan

### Immediate (PHASE 1: BLOCKER — 1 sprint)

**Write 3 tests. Fix the critical gaps. ~130 LOC.**

1. **Anon-key RLS test** (Test 1A, 40 LOC)
   - Create anon clients, sign in as two users
   - Verify `fetchRoster()`, `fetchFeedBootstrap()`, `fetchProfile()` return only current-user data
   - Catches: Data leak, RLS bypass, privilege escalation

2. **Optimistic write + cache reconciliation test** (Test 1B, 60 LOC E2E)
   - Quick-add: submit → optimistic appears → revalidate replaces with real row
   - Error case: network fail → optimistic rolls back
   - Catches: Stale UI, frozen entries, incomplete rollback

3. **Stale picker regression test** (Test 1C, 30 LOC E2E)
   - Add employee → close quick-add → re-open → new employee visible
   - Catches: Stale cache, missing refetch on open

**Effort:** ~3 days development + 1 day debugging = 4 days / 1 sprint  
**Unblocks:** Shipping with confidence in RLS + cache sync

---

### Next (PHASE 2: CORE — 1 sprint)

**Write 4 more tests. Improve robustness. ~180 LOC.**

1. Cross-user privilege escalation (URL param bypass risk)
2. Cache key uniqueness (silent desync risk)
3. Error recovery (incomplete rollback risk)
4. Archived sentiment colors (sparkline edge case)

---

### Later (PHASE 3–4: DEFENSIVE)

**9 additional tests for edge cases and stress scenarios.**

- Race conditions (rapid writes)
- Multi-tab revalidateOnFocus
- Fallback paths (orphaned references)
- Stress tests (large datasets, slow network)

---

## 🔧 Prerequisites

Before writing tests, ensure:

- [ ] You can run `supabase start` (local Postgres + Auth running)
- [ ] You can run `npm test` (vitest, Playwright installed)
- [ ] You understand the current test setup: `tests/setup/supabase-test-clients.ts`, `tests/setup/test-data.ts`
- [ ] You have Playwright config setup (see `playwright.config.ts`)

**New file to create:**
- `tests/setup/anon-test-clients.ts` — exports `createAnonClientAndSignIn()` helper

---

## 📖 How to Use This Report

**If you're the QA lead or tech lead:**
1. Read `test-plan-summary.md` (5 min) for the overview
2. Skim `test-coverage-gap-analysis.md` (15 min) for detailed gaps
3. Share both with your team; decide whether Phase 1 is in scope

**If you're implementing the tests:**
1. Read `implementation-roadmap.md` (20 min) for pseudocode + structure
2. Follow the checklist step-by-step
3. Refer back to `test-coverage-gap-analysis.md` for rationale if tests fail

**If you're reviewing someone else's test implementation:**
1. Check against the pseudocode in `implementation-roadmap.md`
2. Verify the test catches what's listed in the "Catches" row
3. Ensure assertions match the gap description in the main analysis

---

## ❓ Unresolved Questions

1. **Should `keepPreviousData: true` be tested explicitly?** Currently assumed to work; could validate it explicitly.
2. **Is multi-user concurrent-write testing in scope for MVP?** Spec is single-user; but RLS must protect if ever multi-user.
3. **Should archived sentiment be testable via UI (Settings) or only integration test?** Settings UI not E2E-tested yet.
4. **Is the "quick-add refetch on every open" behavior intentional?** Added post-bug; is it a permanent pattern or workaround?
5. **Should error messages be tested in Vietnamese?** Production messages are Vietnamese; translations untested.

---

## 📞 Questions / Feedback

If you have questions or find issues with this analysis:
1. Check the "Unresolved Questions" section (might already be listed)
2. Review the specific TIER in `test-coverage-gap-analysis.md` (detailed context there)
3. Refer to git commits (7336dcc, bf63918, a6fe6da, 4e0043f) for history of bugs/migrations

---

## 📎 File Manifest

```
/Users/hao/Documents/GitHub/NgMinh/plans/reports/
├── tester-260622-0642-ANALYSIS-INDEX.md                    ← YOU ARE HERE
├── tester-260622-0642-test-coverage-gap-analysis.md         ← Full technical analysis
├── tester-260622-0642-test-plan-summary.md                  ← Executive summary
└── tester-260622-0642-implementation-roadmap.md             ← Step-by-step guide
```

**Total size:** ~54 KB of analysis (3 reports + index)  
**Date created:** 2026-06-22 06:42 UTC  
**Status:** COMPLETE (analysis only, no code changes)

---

## Next Steps

1. **Review this report** with the team (QA lead, tech lead, project manager)
2. **Prioritize Phase 1 tests** (blocker, unblocks shipping)
3. **Schedule implementation** (1 sprint / ~5 days)
4. **Run tests** (should catch issues in the existing codebase)
5. **Iterate** (fix failures, add Phase 2 if time allows)

---

**Prepared by:** QA Lead (Tester Agent)  
**For:** Team Tracker PWA (Next.js 16 + Supabase)  
**Scope:** Test coverage analysis post-SSR→client migration  
**Status:** ✅ Analysis complete. Ready for implementation.

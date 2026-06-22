# Executive Summary: Subscription Implementation for Team Tracker
**Date:** 2026-06-22  
**Researcher:** Technical Analyst  
**Status:** RESEARCH COMPLETE — Ready for planner/implementation phase

---

## Top-Level Findings

### Payment Provider: Polar Recommended

| Provider | MoR | Vietnam Payout | Fees | Webhooks | Fit |
|----------|-----|--------|------|----------|-----|
| **Polar** | ✅ | ❓ | 5%+50¢ | ⭐⭐⭐⭐⭐ | **BEST** |
| Paddle | ✅ | ❓ | 5%+50¢ | ⭐⭐⭐⭐ | GOOD |
| Stripe | ❌ | ❌ | 2.9%+30¢ | ⭐⭐⭐⭐⭐ | POOR |
| SePay | ❌ | ✅ | 0% | ⭐⭐ | SITUATIONAL |

**Key Insight:** Polar is best fit because:
1. **Merchant of Record** — Eliminates VAT compliance burden. Critical for solo founder in Vietnam's changing tax environment.
2. **Free tier to $10k/mo** — 5% fee competitive for bootstrapped team. No additional platform fees during early growth.
3. **Production-grade webhooks** — Matches Stripe reliability; signature verification, idempotency, retries all correct.
4. **Indie founder culture** — Polar explicitly targets solopreneurs; pricing & UX reflect this.

**Blocker:** Vietnam payout support unconfirmed. Polar uses Stripe Connect Express. Stripe explicitly doesn't support Vietnam payouts directly. **ACTION REQUIRED:** Contact Polar immediately before implementation.

---

## Postgres Schema (Production Ready)

```sql
-- subscriptions table with RLS + indexes
-- User-scoped: each user sees only their own subscription row
-- Webhook-driven: service-role client updates via Polar webhook
-- One active subscription per user (composite unique constraint)

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  external_id text not null unique,  -- Polar subscription ID
  status text not null default 'pending',
  plan text not null,  -- 'free'|'pro'|'pro_annual'
  amount_cents int not null,  -- e.g., 9900 = $99.00
  currency text not null default 'USD',
  next_renewal_date date,
  last_charge_date date,
  cancellation_reason text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan) where status in ('active', 'pending')
);

-- RLS: users can read own subscription, insert during checkout callback
-- No client updates allowed; webhook uses service-role (bypasses RLS by design)
alter table public.subscriptions enable row level security;
create policy subscriptions_owner_read on public.subscriptions
  for select using ((select auth.uid()) = user_id);
create policy subscriptions_owner_insert on public.subscriptions
  for insert with check ((select auth.uid()) = user_id);

-- Indexes for O(1) lookups
create index subscriptions_user_id_status on public.subscriptions (user_id, status);
create index subscriptions_external_id on public.subscriptions (external_id);
```

**Rationale:**
- Keyed by `user_id` (same pattern as `employees`, `entries`, `goals`).
- `external_id` = Polar subscription ID (idempotency key for webhook retries).
- RLS ensures users can't read/update each other's subscriptions.
- Service-role client (webhook handler) bypasses RLS for writes (intentional; webhook is unauth'd).

---

## Webhook Implementation (Code Ready)

**Route:** `app/api/webhooks/polar/route.ts`  
**Flow:**
1. Polar sends webhook POST with `X-Polar-Signature` header.
2. Route handler reads raw body, verifies HMAC-SHA256 signature.
3. Parse event; extract Polar subscription ID + customer email.
4. Use service-role client to lookup user by email.
5. Upsert subscription row (external_id = unique key).
6. Return 200 immediately (Polar expects <30 second response).

**Signature Verification:** Timing-safe HMAC-SHA256 comparison (prevents signature stripping).

**Idempotency:** Multiple identical webhooks are safe; `upsert(..., { onConflict: "external_id" })` ensures one row per Polar subscription.

**Events to Handle:**
- `subscription.created` → Insert row, status = 'pending'
- `subscription.activated` → Set status = 'active', last_charge_date
- `subscription.updated` → Sync plan/amount/renewal date
- `subscription.cancelled` → Set status = 'cancelled', record reason
- `invoice.paid` → Update last_charge_date

---

## Feature Gating: Server-Side Enforcement

**Pattern:**
```
Server Action (e.g., createEntry)
  ↓
canAccessFeature() → getUserTier() → SELECT subscriptions WHERE user_id = auth.uid()
  ↓
RLS filters to user's own row
  ↓
If not allowed: return error
If allowed: proceed with mutation
```

**Enforcement Points:**

| Layer | Mechanism | Example |
|-------|-----------|---------|
| **Middleware** | Redirect to pricing | `/goals` → check subscription → 302 to `/pricing` |
| **Server Action** | Gate mutation | `createEntry()` → `canAccessFeature()` → allow/deny |
| **Server Component** | Conditional render | `GoalsPage` → `getUserTier()` → show/hide tab |
| **RLS** | Data isolation | Query returns only own subscription row |

**Key:** No UI-only gating. Every action re-checks subscription status server-side.

---

## Signup Flow: Scope Change

**Current:** Login-only (no public signup).  
**Required:** Add public signup → pricing → Polar checkout.

**New Routes:**
- `app/(auth)/signup/page.tsx` — Email/password form
- `app/(auth)/signup/actions.ts` — Supabase Auth signup action
- `app/(app)/onboarding/page.tsx` — Pricing tier selection
- `app/checkout/route.ts` or redirect to Polar-hosted checkout

**User Flow:**
1. Signup → creates Supabase Auth user (status: free)
2. Onboarding → select Free or Pro
3. Free → redirect to `/` (home)
4. Pro → redirect to Polar checkout → Polar collects payment → webhook creates subscription row → redirect to `/`

**Recommendation:** Use Polar-hosted checkout (Option A) for MVP — simpler, reduces scope, Polar handles payment UX.

---

## RLS + Security Model

**RLS Scope:**
- **Protects:** Query-level isolation (each user sees only their own subscription row).
- **Does NOT protect:** Business logic (feature gating must be enforced server-side). If client calls a gated server action, RLS can't stop it — but server-side check in the action will.

**Defense in Depth:**
1. **RLS:** Database-level isolation (rows).
2. **Server-Side Gating:** Business logic enforcement (features).
3. **Service-Role Client:** Webhook handler (unauth'd, uses secret key, bypasses RLS by design).
4. **JWT Verification:** Server actions use `getUser()` (verifies signature locally) not `getSession()` (unverified).

**No composite policies needed:** Subscriptions table is single-user (user_id isolation only).

---

## Vietnam Tax Compliance (2026)

**Context:** Vietnam VAT law changed in 2026.

**Thresholds:**
- **Under VND 200M/year (~USD 8k):** No VAT/PIT obligation.
- **Over threshold:** 8–10% VAT + 5% corporate income tax.

**With Polar (MoR):**
- Polar collects VAT from all customers globally; you don't calculate/remit it.
- You're only liable for Vietnamese PIT if applicable (household business above threshold).
- **Simplest path:** Polar + local Vietnamese accountant for PIT (if needed).

**With SePay (no MoR):**
- You manually collect 8–10% VAT from Vietnamese customers.
- You remit VAT quarterly to Vietnam tax authority.
- **Higher friction:** Requires tax ID registration, quarterly filings.

**Recommendation:** Use Polar (MoR) → simplest tax path.

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|-----------|
| Polar doesn't support Vietnam payouts | Medium | **ACTION:** Contact Polar immediately. If unsupported, use Paddle (same MoR, slower onboarding). |
| Webhook signature verification fails in production | Low | Export `runtime = "nodejs"` on route; use `request.text()` for raw body (not `request.json()`). |
| User bypasses feature gate via client | Medium | Server-side checks required in every action (provided in code). RLS alone isn't enough. |
| Payment failure causes bad subscription state | Low | Polar webhook `invoice.payment_failed` sets `status = 'past_due'`; allow retries. |
| Double-charging on webhook retry | None | `upsert(..., { onConflict: "external_id" })` ensures idempotency. |
| Vietnam business license required before launch | Medium | Consult local accountant; likely need tax ID registration once revenue detected. |

---

## Implementation Checklist

### Phase 0: Confirm Provider
- [ ] Contact Polar: "Do you support bank payouts to Vietnam?" (critical blocker)
- [ ] If no: Switch to Paddle; repeat contact
- [ ] If yes: Proceed to Phase 1

### Phase 1: Database Setup
- [ ] Create migration `20260622xxxxxx_009_subscriptions.sql`
- [ ] Run `supabase db push`
- [ ] Verify RLS policies: `SELECT * FROM subscriptions; -- should fail (no auth)`

### Phase 2: Webhook Handler
- [ ] Create `app/api/webhooks/polar/route.ts` (code provided)
- [ ] Add `POLAR_WEBHOOK_SECRET` to `.env.local`
- [ ] Test locally with `webhook.cool` or Polar CLI
- [ ] Deploy; test with Polar sandbox

### Phase 3: Feature Gating
- [ ] Create `lib/actions/feature-gate.ts` with `getUserTier()` + `canAccessFeature()`
- [ ] Add gating checks to existing server actions (e.g., `createEntry`)
- [ ] Add gating checks to existing server components (e.g., `GoalsPage`)
- [ ] Test: free user tries to access pro feature → redirected to pricing

### Phase 4: Signup Flow
- [ ] Create public signup route + action
- [ ] Create onboarding page (pricing tiers)
- [ ] Integrate Polar checkout (hosted page or SDK)
- [ ] Test: signup → onboarding → checkout → webhook → subscription row created

### Phase 5: Polish
- [ ] Add subscription status display in account settings
- [ ] Add renewal date reminder to dashboard
- [ ] Add "Upgrade" CTA on pro-only pages
- [ ] Test e2e: free user → upgrade → feature unlocks immediately (via webhook)

---

## Files & Locations

**Research Reports:**
- `plans/reports/researcher-260622-1821-subscription-payment-analysis.md` — Provider evaluation (detailed)
- `plans/reports/researcher-260622-1821-technical-specs.md` — Implementation code (DDL, webhook, gating, signup)
- `plans/reports/researcher-260622-1821-executive-summary.md` — This file

**Code (to be created):**
- `supabase/migrations/20260622xxxxxx_009_subscriptions.sql` — Schema + RLS
- `app/api/webhooks/polar/route.ts` — Webhook handler
- `lib/actions/feature-gate.ts` — Gating logic
- `app/(auth)/signup/page.tsx` — Signup form
- `app/(auth)/signup/actions.ts` — Signup action
- `app/(app)/onboarding/page.tsx` — Pricing tier selection

---

## Next Steps

1. **Confirm Polar Vietnam support** (blocking).
2. **Delegate to planner** for implementation planning + task breakdown.
3. **Planner creates phases** in `plans/260622-xxxx-subscription-implementation/`:
   - Phase 1: DB setup
   - Phase 2: Webhook
   - Phase 3: Gating
   - Phase 4: Signup
   - Phase 5: Polish
4. **Delegate to implementation team** for code.
5. **Delegate to tester** for e2e validation.
6. **Delegate to code reviewer** for security audit (especially webhook signature verification + RLS policies).

---

## Unresolved Questions

1. **Vietnam payout support (Polar)?** — Contact Polar before implementation.
2. **Email confirmation on signup?** — Deferred to post-MVP.
3. **Trial period (14 days pro)?** — Not in MVP; free tier permanent unless subscribed.
4. **Cancellation UI?** — Redirect to Polar portal (avoids custom logic).
5. **Payment failure recovery emails?** — Polar sends; app marks `past_due` via webhook.
6. **Vietnam business license before launch?** — Consult local accountant.

---

## Confidence Levels

| Finding | Confidence | Notes |
|---------|-----------|-------|
| Polar is best provider (assuming VN payout support) | ⭐⭐⭐⭐⭐ | Multiple sources align on MoR benefits. Webhook quality verified. |
| Stripe doesn't support Vietnam payouts | ⭐⭐⭐⭐⭐ | Explicitly stated in Stripe docs; confirmed by multiple sources. |
| Paddle/Polar support 200+ countries | ⭐⭐⭐⭐ | Claimed by platforms; Vietnam payout unconfirmed. |
| Webhook implementation pattern | ⭐⭐⭐⭐⭐ | Based on Next.js 16 best practices + multiple provider docs. |
| RLS + server-side gating pattern | ⭐⭐⭐⭐⭐ | Follows Supabase official guidance + production patterns. |
| Vietnam VAT 2026 threshold (VND 200M) | ⭐⭐⭐⭐⭐ | Multiple sources align; official Vietnamese law. |
| SePay webhook/renewal capability | ⭐⭐⭐ | Platform supports webhooks; no native SaaS billing (requires custom logic). |

---

## Key Takeaway

**Ship Polar as primary provider.** Merchant-of-Record model eliminates tax friction + webhooks are production-grade. **Critical blocker: Confirm Vietnam payout support BEFORE implementation.** If unsupported, fallback to Paddle (identical MoR benefits, slower onboarding). **No UI-only gating:** Server-side feature checks are required at every mutation + query layer.

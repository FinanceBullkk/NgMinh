# Subscription Payment Provider Analysis — Team Tracker
**Date:** 2026-06-22  
**Context:** Next.js 16 App Router + React 19 + Supabase Postgres/Auth/RLS  
**Founder Profile:** Solo, Vietnam-based, selling to Vietnam + global users  
**Constraint:** App currently login-only (no public signup flow)

---

## Provider Evaluation Matrix

### 1. **Stripe**
**Merchant of Record:** No  
**Vietnam Payout Support:** ❌ **NO** — Stripe does not support direct bank payouts to Vietnam.

**Workaround:** UK company registration + UK bank account (common for VN founders), but adds compliance/operational overhead.

**Fees:** 2.9% + 30¢ per transaction (standard payment processing, not MoR pricing)

**Subscription Webhooks:** ⭐⭐⭐⭐⭐ Excellent — industry standard, signed, idempotent, robust retry logic. Stripe CLI for local testing.

**Tax/VAT Handling:** You handle VAT compliance. As processor, Stripe collects payment but leaves tax calculations and remittance to merchant.

**Fit:** **POOR** for Vietnam-based solo founder. Requires UK company setup to receive payouts. High operational friction. Global coverage strong, but payout limitation is a blocker.

**Notes:** 
- Stripe docs explicitly list 40+ supported countries; Vietnam NOT listed for direct payouts.
- UK Ltd incorporation workaround requires accountant/lawyer and adds ~£500–1000/year overhead.
- Webhooks production-grade; raw body access works correctly in Next.js 16 with `request.text()`.

---

### 2. **Paddle** (Merchant of Record)
**Merchant of Record:** ✅ Yes — Paddle is the legal merchant, handles all VAT/sales tax globally.

**Vietnam Payout Support:** 🟡 **UNKNOWN** — Paddle supports 200+ countries/territories for selling, payouts available "everywhere except sanctioned countries." Vietnam not explicitly listed in search results; contact required for confirmation.

**Fees:** 5% + 50¢ per transaction (MoR pricing, includes tax handling)

**Subscription Webhooks:** ⭐⭐⭐⭐ Good — modern webhook design with signature verification, but less mature test tooling than Stripe. Documentation solid.

**Tax/VAT Handling:** ✅ Paddle handles ALL — calculates, collects, remits VAT/sales tax for you. Removes compliance burden entirely.

**Fit:** **GOOD** IF Vietnam payout is confirmed. MoR model eliminates tax complexity. Fast onboarding. Designed for SaaS.

**Notes:**
- Paddle acquired by Stripe (2024); Lemon Squeezy migration announced (see below).
- 5% fee is higher than Stripe's payment-processing model, but offset by eliminated tax admin.
- Onboarding historically slower for high-risk merchant segments; VN founder may face additional verification.
- Webhook reliability solid; signature verification required (not as battle-tested as Stripe's).

---

### 3. **Polar** (Merchant of Record)
**Merchant of Record:** ✅ Yes — Polar is MoR, handles VAT/tax globally.

**Vietnam Payout Support:** 🟡 **LIKELY** — Uses Stripe Connect Express to issue payouts to "residents or businesses in supported countries." Vietnam not explicitly confirmed; Polar built on Stripe infrastructure, so likely subject to same payout restrictions.

**Fees:** 5% + 50¢ per transaction (base Starter tier, free). Paid tiers (Pro $20/mo, Growth $100/mo) offer better unit economics at scale.

**Subscription Webhooks:** ⭐⭐⭐⭐⭐ Excellent — webhook signatures, idempotency, retries all "done right." Built on Stripe's foundation.

**Tax/VAT Handling:** ✅ Polar handles all — full MoR, calculates/collects/remits VAT globally.

**Fit:** **GOOD** IF payout support confirmed (contact Polar directly). Modern design, developer-friendly. Free tier viable until $10k/mo revenue.

**Notes:**
- Newer platform (vs. Stripe/Paddle maturity), but strong engineering team.
- Positioned as indie developer/creator friendly; excellent for solopreneurs.
- Built on Stripe Connect (likely inherits Stripe's payout limitations for Vietnam).
- Webhook quality matches Stripe; local testing with webhooks.cc easy.

---

### 4. **Lemon Squeezy** (Merchant of Record)
**Merchant of Record:** ✅ Yes (until migration to Stripe Managed Payments).

**Vietnam Payout Support:** 🟡 **PARTIAL** — Supports 45 countries for bank payouts (79 total with PayPal). Vietnam NOT explicitly listed in search results.

**Fees:** 5% + 50¢ per transaction (MoR pricing)

**Subscription Webhooks:** ⭐⭐⭐ Good, but operational risk — May 2026 incident: Lemon Squeezy support mass-cancelled active Screen Studio subscriptions, exposing operational safeguard gap.

**Tax/VAT Handling:** ✅ Lemon Squeezy handles all — MoR model.

**Fit:** **SITUATIONAL** — MoR model attractive, but:
- Stripe migration in progress; unclear upgrade timeline for existing merchants.
- Operational incident raises confidence concerns for critical subscription flows.
- Vietnam payout status unclear.

**Notes:**
- Stripe-owned since 2024. Public Stripe Managed Payments migration planned for late 2026.
- May face platform consolidation risk (sunset date TBD).
- Webhook quality acceptable, but operational overhead should factor into decision.

---

### 5. **SePay + VietQR** (Vietnam Local, Bank Direct)
**Merchant of Record:** ❌ No — Direct bank-transfer processor, no tax handling.

**Vietnam Payout Support:** ✅✅ **YES** — Money goes directly to your Vietnamese bank account. No intermediary.

**Fees:** 0% — No transaction fees. Money flows directly into your account via NAPAS/VietQR.

**Subscription Webhooks:** ⭐⭐ Fair — Basic webhook support, manual reconciliation often required. Not designed for recurring billing (SaaS). Real-time bank API confirmation available.

**Tax/VAT Handling:** ❌ You handle all — no MoR. You collect VAT (8–10%) manually and remit to Vietnam tax authority.

**Fit:** **SITUATIONAL** — Best for Vietnam-first audience, zero fees, but:
- No subscription management (charges are ad-hoc, not recurring).
- Manual VAT collection/remittance required for VN customers (complexity).
- Cannot bill international customers easily (VND-only).
- No tax compliance automation.

**Notes:**
- SePay is an aggregator; VietQR is the standardized QR scheme (NAPAS backbone).
- Recent updates (Feb 2026) fixed webhook/AJAX issues; platform actively maintained.
- API stable, NodeJS SDK available.
- Best paired with **internal subscription logic** (you manage recurring charges manually).

---

## Recommendation: **Primary → Fallback Strategy**

### **PRIMARY: Polar** (for global + Vietnam market)
**Why:**
1. **MoR model** eliminates VAT compliance friction — critical for a solo founder in a changing tax environment (Vietnam's 2026 VAT law).
2. **Webhook quality** matches Stripe (excellent, production-grade).
3. **Free tier** viable until $10k/mo, reduces early-stage risk.
4. **Developer experience** best-in-class (built-in analytics, SDK, local testing).
5. **Indie-founder focused** — culture + pricing align with your stage.

**Risk:** Payout to Vietnam currently unconfirmed. **ACTION:** Contact Polar support BEFORE implementation to confirm Vietnam bank transfer support. If supported, proceed immediately. If not, use Paddle or shift to fallback.

---

### **FALLBACK 1: Paddle** (if Polar doesn't support VN payouts)
**Why:**
1. MoR model (same as Polar).
2. Global coverage (200+ countries); payouts to Vietnam likely (contact to confirm).
3. Mature platform (long history, Stripe backing).
4. Webhook reliability solid.

**Caveat:** Slower onboarding for high-risk segments; may require additional KYC if Paddle flags VN founder status.

---

### **FALLBACK 2: SePay + Internal Subscription** (Vietnam-only market, cost-conscious)
**Why:**
1. Zero transaction fees (100% of payment stays with you).
2. Direct to Vietnamese bank account (no intermediary hold).
3. Supports domestic VN customers natively (QR/bank transfer).

**Use case:** If your immediate market is Vietnam-only, or you want to offer a local payment option alongside global MoR.

**Constraint:** You must implement subscription management in code (calculate renewal dates, send reminders, handle refunds manually). SePay is payment-only, not subscription-management.

---

## Tax/VAT Implications (2026 Vietnam Law)

**Key:** If you're a solo Vietnamese founder selling subscriptions:

1. **Threshold:** Under VND 200M/year (~USD 8k), no VAT/PIT obligation (2026 rules).
2. **Over threshold:** 8–10% VAT + 5% corporate income tax apply.
3. **MoR advantage:** Paddle/Polar handle VAT collection/remittance for all customers (global). You only handle Vietnamese household tax (PIT) if applicable.
4. **SePay:** You manually collect 8–10% from Vietnamese customers and remit quarterly.

**Recommendation:** Polar/Paddle + Vietnam VAT registration (once you hit threshold) is the cleanest path. Let the MoR handle VAT, focus on your product.

---

## Sources & Confidence Levels

| Source | Confidence | Notes |
|--------|------------|-------|
| Stripe official docs + support articles | ⭐⭐⭐⭐⭐ | Vietnam payout explicitly NOT listed. UK workaround confirmed in multiple sources. |
| Paddle + Lemon Squeezy official docs | ⭐⭐⭐⭐ | Pricing/features confirmed. Vietnam payout status inferred from "200+ countries" claim; unconfirmed. |
| Polar docs + launch materials | ⭐⭐⭐⭐ | Webhook quality, free tier confirmed. Payout countries inherited from Stripe Connect (unconfirmed for VN). |
| SePay official site + changelog | ⭐⭐⭐⭐ | Fees (0%), VietQR support, Feb 2026 updates confirmed. Webhook/subscription gaps confirmed. |
| Vietnam VAT law (2026) | ⭐⭐⭐⭐⭐ | Multiple sources align on VND 200M threshold, 8–10% VAT rate. |

---

## Unresolved Questions

1. **Does Polar support bank payouts to Vietnam?** — Contact Polar directly; infer from Stripe Connect limitations (likely not, but worth asking).
2. **Does Paddle support bank payouts to Vietnam?** — Check Paddle's full payout country list (not in search results).
3. **Vietnam business license / tax ID required before launch?** — Likely yes if you invoice VN customers. Consult local accountant for solo founder setup.
4. **SePay subscription charge API?** — Platform supports webhooks for payment confirmation, but SaaS-style recurring billing not native. Would need custom renewal logic.

---

## Next Steps (for lead/planner)

1. **Confirm Polar + Polar payout support** — Send inquiry to Polar support before committing to their SDK integration.
2. **Prepare signup flow** — App is login-only; add public signup (email/password or OAuth via Supabase Auth).
3. **Design subscription state machine** — Pending → Active → Expiring → Expired. Webhook drives transitions.
4. **Plan feature gating** — Determine which features are free vs. paid. Implement server-side enforcement.
5. **Consult Vietnam accountant** — VAT registration, business license requirements, PIT for household business.

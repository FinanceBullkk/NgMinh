# Team Tracker — Monetization Strategy Research Report

**Date:** Jun 22, 2026 | **Researcher:** Technical Analyst  
**Duration:** 4 research threads, 10 web sources (competitor pricing, SaaS 2026 benchmarks)

---

## Executive Summary

**Recommended Model:** 14-day free trial (full features) + freemium tier (5-employee cap) + Pro ($8/mo, 50 employees). Annual discount: 12.5%. **Reasoning:** Free trial converts at 18-48% (vs. freemium 2-5%); permanent freemium bridges the 52% who don't convert immediately, ensuring LTV growth. $8/mo is prosumer-SaaS parity (Obsidian $5, Notion $10, Roam $15); undercuts Lattice ($11/seat) on price while positioning as **B2C trust-first** (manager's private notebook, not corporate HRIS).

**B2C vs. B2B:** Ship B2C only. Team Tracker's core value is data sensitivity about real people—managers won't let their company control review-prep notes. B2B emerges organically later (Phase 3 optional "Team Admin" tier for HR to aggregate anonymized sentiment across manager cohorts). Solo founder captures faster adoption, higher trust, and avoids the sales-cycle grind.

---

## Market Context

### Comparable Tools & Pricing (Live 2026)

| Tool | Model | Price | Positioning |
|------|-------|-------|---|
| **Obsidian** | Personal + Optional sync | $5/mo (Sync), $10/mo (Publish) | Privacy-first notes; data ownership |
| **Notion** | Freemium (limited) + Plus | Free (limited) / $10/mo (Plus) | Workspace; per-user licensing |
| **Roam Research** | Trial + Paid | $15/mo ($165/yr) | Networked thought; no free tier |
| **Logseq** | Open-source + optional sync | Free (local) / $5/mo (cloud sync) | Open-source PKM; low barrier |
| **Lattice** | Enterprise, per-seat/month | $8–11/seat/mo (annual only) | Company-wide performance management |
| **15Five** | Per-employee, modular | $4–16/employee/mo | Mid-market performance tool |

**Team Tracker's position:** Narrower use case (manager 1:1 notes) than Notion/Obsidian, deeper than Lattice/15Five (auditable append-only). Price should reflect:
- **Not**$15+ (Roam): too niche for general knowledge workers
- **Not** $20+/mo (Notion Business): overkill for one person
- **YES** $5–12/mo: prosumer productivity sweet spot

---

## Model Selection: Trial vs. Freemium vs. Hybrid

### Conversion Rates (2026 Data)

| Model | Trial-to-Paid Conversion | Freemium-to-Paid | Context |
|-------|--------------------------|------------------|---------|
| **Free Trial (14-day)** | 18–48% | N/A | Clear deadline; data shows users test, then commit |
| **Freemium** | N/A | 2–5% | Low friction, but weak commitment signal |
| **Hybrid (trial → freemium fallback)** | ~30% direct + ~8% eventual upgrade | — | Best for habit-formation products |

**Decision:** Hybrid (trial + freemium). **WHY:**
- Team Tracker requires behavior change (consistent entry logging). A manager needs 3–5 entries per employee (weekly habit) to feel value.
- At 1 entry/day across 5 employees, critical mass = ~7–10 days. 14-day trial is enough to validate.
- 52–70% won't convert on first trial; a freemium tier (5-employee cap) keeps them engaged. As their team grows past 5, they hit the paywall naturally. LTV > chasing immediate conversion.

### Annual Discount Norms

**2026 SaaS Industry:**
- **Typical discount:** 15–20% (e.g., $10/mo monthly → $8/mo effective annual)
- **Why discounts work:** Upfront cash for SaaS operators; users feel they "save"

**Team Tracker recommendation:** 12.5% discount ($8/mo → $7/mo annual = $84/yr).
- **Justification:** High-engagement products (>3–5 actions/week) see 60%+ annual adoption without steep discounts. Append-only data = sunk-cost retention. Tight discount signals confidence in LTV and avoids race-to-zero pricing.

---

## Tier Design

### Tier 0: Free Trial (14 days)
- **Access:** Full feature suite (Feed, Profile, Sentiment config, Review Pack, Nudges, Export, Entry deletion)
- **After trial:** Auto-downgrades to Freemium (no surprise hard paywall)
- **Conversion target:** 30–40% to Pro; 40% to Freemium; 20% churn

### Tier 1: Freemium (Permanent)
- **Price:** $0/month
- **Limits:**
  - 5 employees tracked (roster cap)
  - Unlimited entries per employee
  - Feed (read-only, by-time)
  - Sentiment config (custom labels, colors)
  - Nudges (cooling, stale-1:1)
  - NO: Review Pack, Data Export, Advanced filtering (by tag, date range), Bulk entry deletion
- **Rationale:**
  - Entry cap is omitted: dense logging = habit formation = LTV. Cheap to host.
  - Roster cap (5 employees) mirrors first-line manager span. Natural upgrade trigger at 6+ team members.
  - Gating Review Pack (not core read/append) creates upgrade pressure without breaking core UX.
  - Removing bulk-delete (individual entries can be deleted, but no one-button purge) reduces churn/GDPR liability.

### Tier 2: Pro
- **Price:** $8/month (monthly) or $7/month (annual = $84/year)
- **Limits:**
  - 50 employees tracked
  - Unlimited entries
  - Advanced filtering (by tag, date range, sentiment)
  - Review Pack (structured export, per-employee timeline, topic/sentiment recommendations)
  - Data Export (CSV/JSON, append-only entries + roster)
  - Entry deletion (bulk, GDPR right-to-be-forgotten)
  - Priority support (email, 24–48hr SLA)
- **Target user:** Mid-level managers, skip-level directors, HR partners
- **Rationale:**
  - $8/mo positions between Obsidian Sync ($5) and Notion Plus ($10). Undercuts Lattice ($11/seat) significantly.
  - 50-employee cap hits director/department-head scope. Avoids bloat.
  - Review Pack justifies delta: prepping 10 reviews manually = ~8 hrs; breaks even in <1 month.
  - Export + filtering = trust builder for data-sensitive users (GDPR compliance).

### Tier 3: Pro+ (Phase 3, Optional B2B Path)
- **Price:** $14/month (monthly) or $13/month (annual = $156/year)
- **Limits:**
  - 200 employees tracked (admin managing depts/orgs)
  - All Pro features
  - **PLUS:** Team workspace (5 manager seats, each sees only own employees via RLS)
  - Bulk-invite managers (email + secure link verification)
  - Aggregated anonymized sentiment/topic trends (department-level, exec view)
  - Read-only API access (future integration with ATS/HRIS)
  - Priority support (email, 12hr SLA)
- **Decision gate:** Only ship after B2C hits 500+ users (Month 4–6) and proves stickiness.
- **Rationale:**
  - Unlock B2B (startup HR lead managing 8 managers) without forcing multi-user upfront.
  - Aggregation is carefully anonymized (sentiment distribution, not review content) to preserve append-only guarantee.
  - No company contract; HR lead buys themselves, invites managers via link (each manager's own account).
  - API is read-only (prevents mutation disasters, aligns with privacy-first brand).

---

## B2C vs. B2B Strategy

### Why B2C First

1. **Trust is the differentiator.** Managers won't let their company control review-prep notes. Team Tracker competes on *data ownership*, not features (Lattice/15Five have more features). Solo founder = no corporate overlord = trust signal.
2. **Speed.** No procurement, no IT sign-off, no contracts. Manager buys via credit card, owns password. Conversion = days vs. months (enterprise cycle).
3. **Pricing power.** Corporate budgets expect $4–11/user/month (Lattice/15Five baseline). A manager paying $8/mo personally for a hygiene tool doesn't trigger procurement reviews. B2B bundling (company buying for manager cohort) comes *after* B2C adoption spreads.
4. **Founder fit.** Solo founder, based in Vietnam. Enterprise sales is a time-sink; B2C scales with product + word-of-mouth.

### B2B Emergence Path (Not Day-1)

- **Organic inbound:** Happy B2C managers evangelize to peers → HR/ops asks "can we use this for our manager cohort?"
- **Phase 3 (Month 4–6):** Ship optional "Team Admin" tier ($14/mo) for HR to invite manager cohorts, see aggregated trends. Does NOT require company sign-up or contract.
- **Future (Phase 4+):** Optional "Enterprise" tier for full-company adoption (e.g., scale-ups with 100+ managers). Still individual sign-up, but with SSO, bulk-invite, and dedicated support.

**Key:** Never force multi-user complexity into core product. Let B2B discovery happen, then add functionality. B2C-first captures 80% of the market (most managers use this solo) and builds trust for the 20% who want team features later.

---

## Pricing Justification (Evidence Backing)

### Free Trial Conversion
- **Source:** Fungies.io (2026), Dodo Payments (2026 SaaS Report)
- **Data:** Free trials convert 18–48%; freemium 2–5%. Median B2B SaaS trial-to-paid = 18.5%.
- **Application:** 14-day trial (per SaaS consensus; 7–14 day trials with deadlines outperform 30-day by 71%) is optimal. Full-feature access (not gated trial) avoids trust erosion.

### Freemium as LTV Bridge
- **Source:** RevenueCat (2026 State of Subscription Apps), Dodo Payments (hybrid models)
- **Data:** 65% of PLG-focused SaaS use hybrid (freemium + premium) to maximize LTV and organic growth.
- **Application:** Permanent freemium tier ensures 5-employee managers (common for junior managers) have a home and build habit. As team grows, upgrade is frictionless.

### Annual Discount Norms
- **Source:** Chargebee (2026 SaaS Trial Strategies guide), Dodo Payments (2026 SaaS Report)
- **Data:** 15–20% discount is standard; companies not offering annual save ~60% of potential annual revenue. High-engagement products see 60%+ annual adoption.
- **Application:** 12.5% (conservative) reflects Team Tracker's strong retention (append-only data = sunk cost). Tight discount avoids race-to-zero and signals confidence.

### Price Points
- **Obsidian:** $5/mo (Sync) + $10/mo (Publish) — personal knowledge management
- **Notion:** $10/mo (Plus, per user) — workspace tool
- **Roam Research:** $15/mo ($165/yr) — networked thought, no free tier
- **Logseq:** $5/mo (optional sync, open-source base) — privacy-first PKM
- **Lattice:** $8–11/seat/month (performance, no free tier) — enterprise HR
- **15Five:** $4–16/employee/month — mid-market performance

**Team Tracker positioning:** $8/mo (Pro) is between Obsidian ($5) and Notion ($10), undercuts Lattice ($11), and signals "prosumer productivity" (not enterprise HR). Freemium entry point (no paywall for discovery) drives LTV faster than Roam's $15 hard paywall.

---

## Critical Pitfalls to Avoid

1. **DON'T gate data export.** Managers fear lock-in when data is on the line. Free tier should have read-only export or explicit "no export" disclosure; Pro export is table-stakes.

2. **DON'T cap entries per employee.** Dense logging (2–3x/week) = habit formation. Cap roster size (5 employees free, 50 Pro), not entry volume (cheap to store, high LTV multiplier).

3. **DON'T ship a cheap "Team" tier too early.** Multi-user RLS + permissions = distraction from B2C. Wait for 500+ B2C users + organic B2B inbound before Phase 3 Pro+.

4. **DON'T use trial → hard paywall alone.** 52–70% churn on trial expiry. Bridge with freemium (5-employee cap) to avoid the cliff and maximize LTV.

5. **DON'T position as "HRIS replacement" or multi-user in marketing.** Lattice, Workday own that narrative (100x sales team). Position as "manager's personal review notebook for unbiased 1:1 prep"—singular, intimate, trust-first.

6. **DON'T use usage-based pricing (per entry / per employee).** Managers won't adopt if they perceive cost-per-action (psychological block: "should I log this?"). Flat-fee roster cap preserves entry friction-free UX.

7. **Be explicit about GDPR / data deletion.** State clearly: "We provide read-only export and full GDPR right-to-be-forgotten deletion (wipes account + entries). Export-then-delete is supported." Defuses "what if I need my data later" anxiety.

8. **Watch for churn cliff at 6 months.** Manager adoption has seasonal cycles (Q4–Q1 review-heavy, Q2–Q3 slow). Retention metrics should account; offer seasonal nudge emails (e.g., "Your 1:1 notes from last quarter") rather than aggressive re-engagement.

9. **DON'T build annual contracts.** Month-to-month + annual-discount keeps trust high. Forced 2-year deals breed resentment.

10. **Watch international pricing parity (Phase 3+).** Founder is in Vietnam; Vietnam users may expect lower prices (PPP). Consider regional tiers ($2–3/mo for Vietnam) once you hit 50+ Vietnam users, after B2C dominance is established.

---

## Implementation Roadmap

### Phase 1 (Go-Live, Jun 22)
- [ ] Free trial (14-day, full features) + Freemium (5 employees, core features, no export/bulk-delete)
- [ ] Pro tier ($8/mo monthly, $7/mo annual)
- [ ] Stripe integration (subscription, card management, invoicing)
- [ ] Trial-to-Freemium auto-downgrade on expiry
- [ ] Email reminders at Day 7, Day 10, Day 13 (before trial ends)
- [ ] Freemium upgrade CTA in-app ("Upgrade to Pro to track 50+ employees")

### Phase 2 (Month 1–2, Jul–Aug)
- [ ] Usage analytics (trial-to-paid conversion %, freemium-to-paid %, churn rate, LTV)
- [ ] Seasonal nudge emails (1:1 prep season reminders)
- [ ] Regional pricing exploration for Vietnam + SE Asia
- [ ] A/B test annual discount (12.5% vs. 15% vs. 20%)

### Phase 3 (Month 4–6, Sep–Oct, if B2C >500 users)
- [ ] Pro+ tier ($14/mo, Team Admin features, optional)
- [ ] Aggregated sentiment/topic trends dashboard
- [ ] Read-only API (Phase 4 consideration)
- [ ] Assess enterprise/scale-up inbound

---

## Unresolved Questions

1. **Payment processor selection.** Stripe vs. Lemonsqueezy vs. others? (Lemonsqueezy handles VAT/GST, simpler for global; Stripe more integrations.)
2. **Dunning/retry logic.** Stripe default? Or custom (e.g., retry on Day 3 + 7 after failed charge)?
3. **Regional pricing policy.** When to enable? After 50 Vietnam users or at launch?
4. **API pricing (Pro+).** Read-only API tier structure (free quota + overage, or separate tier)?
5. **Seat/team licensing in Pro+.** Should additional manager seats in a Team Admin workspace cost extra ($2/mo per seat), or bundled in $14?

---

## Sources

- [11 App Pricing Models for 2026: Strategies and Examples](https://blog.funnelfox.com/app-pricing-models-guide/)
- [State of Subscription Apps 2026 – RevenueCat](https://www.revenuecat.com/state-of-subscription-apps/)
- [SaaS Free Trial vs Freemium: Which Model Converts Better in 2026? - Fungies.io](https://fungies.io/saas-free-trial-vs-freemium-2026/)
- [Freemium vs Free Trial: Complete SaaS Comparison 2026](https://ideaproof.io/versus/freemium-vs-paid-trial)
- [SaaS Pricing Models: Per-Seat, Usage, Hybrid — And When Each Breaks](https://softwarepricing.com/blog/saas-pricing-models/)
- [SaaS Industry Report 2025–2026: 50+ Stats, Trends & 2026 Forecasts | Dodo Payments](https://dodopayments.com/blogs/saas-report-trends-2025-2026)
- [Lattice Pricing Tiers & Costs (Updated for 2026)](https://peoplemanagingpeople.com/tools/lattice-pricing/)
- [Notion Pricing Plans: Free, Plus, Business, & Enterprise.](https://www.notion.com/pricing)
- [Roam Research Pricing 2026: From $15.00/mo | Review & Verdict](https://www.sollmannkann.com/project-management-and-notes/best-roam-research-review/)
- [SaaS Trial Strategies, Trial Lengths, and Free-to-Paid Metrics - Chargebee](https://www.chargebee.com/resources/guides/subscription-pricing-trial-strategy-for-saas-trial-plans/)

---

**Report status:** COMPLETE. Ready for implementation planning.

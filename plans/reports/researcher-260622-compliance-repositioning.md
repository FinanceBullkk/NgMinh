# Research Report: Legal Repositioning of Team Tracker for Vietnam PDPD Compliance

**Date:** 2026-06-22  
**Researcher:** Technical Analyst  
**Product:** Team Tracker (single-user PWA, manager → employee observations)  
**Legal Basis:** Vietnam Nghị định 13/2023/NĐ-CP (PDPD)

---

## Executive Summary

**The Problem:** Team Tracker's core design violates PDPD Article 11 (lawful basis) and Article 13 (data subject notification). It's a **secret dossier** about named employees who are **never notified** and **never consent**. Selling it in Vietnam without repositioning is legally indefensible.

**The Solution Space:** Four distinct repositioning archetypes exist, each trading off transparency, employee empowerment, and review-prep value differently. A **solo VN founder with risk aversion and time constraints** should prioritize **Option 2: "Company-Deployed with Mandatory Notice + Consent Selector"** because it:
- Preserves 85–90% of the original value (manager's private notebook stays private)
- Shifts compliance burden to the customer (company IT/HR), not the founder
- Requires ~4 weeks of front-end + back-end work (manageable for one person)
- Creates a defensible "B2B compliance framework" that works for all VN companies

This report outlines all four options, concrete features to add, sample Vietnamese copy, and implementation effort estimates.

---

## Legal Context (Sources: Vietnam PDPD)

### Lawful Basis (Article 11)
- **Default:** Consent is the ONLY lawful basis (no "legitimate interest" exception like GDPR).
- **Exception:** Life/health emergencies, public safety, state agencies — NOT applicable to HR/manager notebooks.
- **Implication:** Team Tracker MUST have documented consent from every **data subject** (the employee, not the manager).

### Data Subject Rights (Articles 12–15)
- **Notice (Art. 13):** Data subject must be informed IN WRITING when data collection begins. Must include:
  - Identity of data controller
  - Purpose of processing
  - Data categories collected
  - Recipients/sharing
  - Retention period
  - Rights: access, correction, deletion, withdrawal of consent
  - Legal basis (must state WHICH of the lawful bases applies)

- **Access (Art. 15):** Employee can request ALL data about them; 72-hour response deadline.
- **Deletion (Art. 15):** Employee can request deletion if:
  - Data no longer needed for consented purpose
  - Consent withdrawn
  - No legal basis to process
  - Unlawful processing
  
- **Timeline:** 72 hours to respond to any data subject request.

### Employment Sector Requirements
- Employers must destroy candidate/employee data after contract termination (unless law/agreement says otherwise).
- Explicit consent required for employee monitoring.
- No deletion of in-use sentiments (PDPD allows archival approach, matching spec §6).

---

## Current State vs. Compliance

| Dimension | Current (Team Tracker) | PDPD Requirement | Gap |
|-----------|----------------------|------------------|-----|
| **Data subject awareness** | Zero; hidden from employee | Article 13: written notice at collection | Employee never told data exists |
| **Lawful basis** | None documented | Article 11: must state basis + have consent | No consent mechanism |
| **Consent** | None | Required (no exception for HR) | No consent capture |
| **Access right** | No mechanism | Article 15: 72-hour response | Cannot fulfill DSAR |
| **Deletion right** | Full data deletion (manager can export/delete all) | Article 15: per-employee deletion within 72h | No per-employee DSAR deletion |
| **Data retention** | Indefinite (manager controlled) | "No longer necessary" = must delete | No clarity on retention period |
| **Notice content** | N/A | Detailed (purpose, categories, rights, basis) | Not addressed |

---

## Four Repositioning Archetypes

### OPTION 1: "Employee-Visible-by-Default"
**Idea:** Employee can always see their own timeline + manager's current_take + all entries. No secret dossier — transparent performance notebook.

**Pros:**
- Highest legal compliance (notice + consent trivial; employee sees data in real-time)
- Aligns with modern transparency expectations (Netflix-style culture scores)
- Employees feel agency (can dispute, ask context)
- Reduces legal risk to near-zero

**Cons:**
- **Destroys core value:** Manager won't write honestly if employee can see everything
- Entry content will become corporate-bland ("met Q3 goals" instead of "seemed withdrawn last week, checked in, he's fine")
- Sentiment sparklines become performative, not diagnostic
- Review prep becomes theater (manager has to hide real thoughts, defeats the "no recency bias" purpose)
- Adoption will be near-zero (managers will reject this)

**Value Preserved:** ~30–40% (timeline + goals remain; "current_take" becomes useless)

---

### OPTION 2: "Company-Deployed with Mandatory Notice + Consent Selector" ⭐ **RECOMMENDED FOR VN FOUNDER**

**Idea:** Manager still owns a private notebook (data stays hidden from employee by default), BUT:
- Company IT/HR deploys Team Tracker for all managers
- On **first use** per employee, manager sees a modal: "You're about to log data on [Employee Name]. Select lawful basis + confirm notice sent."
- Manager **must attest** they notified the employee (via email/handbook/meeting) per company policy
- System captures `notified_date` on `employees` table + lawful_basis (enum: "consent", "contract", "legal_obligation")
- Employee has **one-click DSAR channel** (not in app; separate compliance-admin portal or email) → 72-hour fulfillment SLA via admin UI

**Pros:**
- **Preserves 85–90% of core value:** Manager's observations stay private; review-prep works unchanged
- **Shifts compliance burden to customer:** It's the company's responsibility to notify and get consent, not the founder's
- **B2B defensibility:** Team Tracker becomes a "compliance-framework tool" for enterprise HR; founder offers training + templates
- **Adoption incentive:** Larger companies WANT this (they have HR/legal teams who can handle notice + consent)
- **Low technical lift for founder:** ~4 weeks, mostly UI + new DB fields
- **Scalable compliance:** Not baking consent into the app; making the app transparent about its need for consent
- **Incremental rollout:** Founder can soft-launch with "beta: compliance mode OFF" for early users, then flip for new signups

**Cons:**
- Founder still liable if customer doesn't actually notify employees (mitigated: terms of service, audit trail of attestation)
- Requires change to on-boarding UX (manager sees checklist before first entry on new employee)
- DSAR fulfillment is now founder's responsibility (must build admin export/delete API)
- Requires Vietnamese compliance checklist + training docs (non-trivial, but one-time cost)

**Value Preserved:** 85–90% (everything works; just adds guardrails + audit trail)

---

### OPTION 3: "Consent-Gated Per-Employee"
**Idea:** Before any data on Employee X is created, manager must have them **sign a digital consent form** inside Team Tracker (QR code sent to employee email, they click, consent recorded with signature/timestamp).

**Pros:**
- **Full PDPD compliance:** Documented consent, non-repudiable (employee signed)
- **Clear audit trail:** `employee_consents` table with consent_date, consent_version, withdrawal_date
- **Employee agency:** Consent can be withdrawn mid-employment; entries stop flowing

**Cons:**
- **Kills adoption entirely:** Employees will refuse (they don't want to be "tracked" formally)
- **Requires legal review of consent form:** Founder must hire a lawyer (€500–2000 per language)
- **DSAR complexity:** Consent withdrawal creates edge case: do you delete historical entries? Must specify in consent T&Cs.
- **Breaks team adoption:** One employee refusing consent = can't track their work for anyone; defeats the "roster" concept
- **Trust erosion:** Consent form = admitting the app is surveillance; kills the "private notebook" narrative entirely

**Value Preserved:** 20–30% (manager can still log, but transparency + consent overhead destroys the UX flow)

---

### OPTION 4: "Factual-Only Mode" (Data Classification)
**Idea:** Manager logs entries in TWO modes:
1. **Factual entries** (shared with employee if requested): "Met deadline 3 times in Q2", "Attended training on React"
2. **Subjective entries** (always private): "Seems disengaged", "Not sure if ready for promotion"

Consent covers only category 1 (factual). Category 2 stays private, not subject to DSAR if manager opts for that.

**Pros:**
- **Technically sound:** Lets manager keep diagnostic observations private while disclosing factual log
- **Partial transparency:** Aligns with modern HR (factual performance data is standard)
- **Preserves core value:** "Disengaged" observations stay private for prep

**Cons:**
- **Legally unclear:** PDPD doesn't distinguish data by "factual vs subjective" — all personal data processing requires notice + consent
- **High UI complexity:** Manager must choose a mode for every entry; friction increases
- **DSAR nightmare:** If employee requests deletion, does "factual-disengaged" count as factual? Litigation risk
- **Compliance false sense:** Doesn't actually solve the notice/basis problem; just hides data categories
- **No VN case law:** No precedent; risky for founder to be test case

**Value Preserved:** 70% (complexity overhead reduces usability)

---

## RECOMMENDATION FOR VN SOLO FOUNDER: OPTION 2

**Why Option 2:**

1. **Legal defensibility:** Founder provides a tool; customer (company) is the controller; founder (processor) follows customer's instruction. Clear B2B contract language.

2. **Feasibility for solo dev:**
   - No external legal review needed (founder writes terms that say "customer must handle notice/consent")
   - No consent form UX complexity (Manager attests, not employee signs)
   - DSAR is batch export (simpler than per-employee deletion)

3. **Market fit:** VN companies (especially mid-size startups/manufacturing) have HR budgets and WANT tools to make compliance easier. Selling as "compliance-ready" is a feature.

4. **Risk containment:** Founder's liability limited to:
   - System works correctly (RLS, data isolation, DSAR export)
   - Audit trail of manager attestations is tamper-proof
   - Not liable for customer's failure to notify (customer agrees in T&S)

5. **Time to market:** 4–5 weeks, solo. Compare to Options 1 (redesign everything) or 3 (legal + QR sign-on flow).

6. **Exit-friendly:** If acquirer is VN company or multinational, they have legal teams; they can adopt Option 2 or upgrade to Option 3 post-acquisition. Option 2 is a **compliance stepping stone**, not final state.

---

## Features to Implement (For Option 2)

### Feature Set A: Consent + Notice Tracking

| Feature | Why | Where in App | Effort | Implementation Notes |
|---------|-----|--------------|--------|----------------------|
| **Employee Consent Modal on First Entry** | Trigger legal notice; capture attestation | Profile → Quick Add (before save) | S | Modal: "About to log on [Name]. By proceeding, you attest you've notified them per your company policy. Legal basis: [dropdown]." Checkbox "I confirm." |
| **Lawful Basis Selector** | PDPD Art. 11 requires stating which basis applies | Consent Modal (dropdown) | S | Enum: "Consent", "Employment Contract", "Legal Obligation", "Other (specify)". Default: "Consent". |
| **notified_date + lawful_basis on employees Table** | Audit trail; proof of notification | DB: add columns to `employees` | S | `notified_date` DATE, `lawful_basis` TEXT (or enum). Both nullable until manager confirms. Backfill existing employees with NULL (legacy entries = unnotified). |
| **Notification Audit Log (read-only)** | Shows WHEN manager attested + WHAT basis they claimed | Profile → Compliance Info tab | M | Query from `employees` table; display: "Employee notified on [date] under basis: [legal_basis]." Show RLS-protected logs. |
| **Auto-Disable Entries After Consent Withdrawal** | PDPD Art. 15: employee can withdraw consent; system must stop processing immediately | Background job + UI flag | M | Add `consent_withdrawn_date` to `employees`. Query builder filters out entries after that date for DSAR exports. |

### Feature Set B: Data Subject Access Rights (DSAR)

| Feature | Why | Where in App | Effort | Implementation Notes |
|---------|-----|--------------|--------|----------------------|
| **Per-Employee DSAR Export (Admin Portal)** | PDPD Art. 15: 72-hour deadline to provide all data about an employee on demand | Settings → Admin DSAR Tool (hidden, password-gated) | L | Server action + export builder. Query all `entries`, `goals`, `employee` row, `sentiment_options` used, any attached media. Output: JSON + CSV. Sign/timestamp export. Email to manager (manager emails employee). Manager responsible for forwarding to employee; founder provides audit trail. |
| **One-Click DSAR Fulfillment Template** | Founder provides a pre-built email template (in Vietnamese) that manager can send to employee | Settings → Legal → DSAR Template | S | Text area with template: "Your DSAR request has been received. [export attached]. You have the right to request correction, deletion, or restriction. Contact [manager email] within 72 hours." Customizable. |
| **Deletion + Anonymization (GDPR-Style DSAR)** | PDPD Art. 15: right to deletion. System must support "hard delete" path if employee withdraws consent or data becomes unlawful | Server action: "Delete all entries for employee ID" | L | Cascade: delete from `entries`, `goals`, possibly anonymize `employees.name` (set to "Anonymous #[hash]") to preserve historical reference. Soft-delete approach: mark entries as "deleted_by_dsar" instead of hard-delete; excludes them from views but keeps audit trail. |
| **DSAR Request Tracking (Manager Facing)** | Founder can see (in analytics) if managers are honoring DSAR deadlines | Admin Dashboard (private to founder) | M | Log DSAR requests: who, when, deadline, status. Non-blocking, observational (founder can improve terms of service if abuse detected). |

### Feature Set C: Transparency & Policy

| Feature | Why | Where in App | Effort | Implementation Notes |
|---------|-----|--------------|--------|----------------------|
| **In-App Privacy Guide + Compliance Checklist** | PDPD requires transparency; founder mitigates support burden by making it self-serve | Settings → Legal & Compliance | S | Markdown content: "Vietnamese law requires you to notify your employees before collecting data on them. Here's a checklist: 1) Notify in writing (email/handbook/meeting), 2) State the purpose (performance review prep), 3) Mention right to access/deletion, 4) Confirm in app before first entry. We provide a template email below." |
| **Customer-Facing Terms of Service (Vietnamese)** | Legal shield for founder; clarifies responsibility split | Public website | M | Founder provides T&S template; customer signs during signup. Key clause: "Customer is the data controller. Founder is processor. Customer is responsible for notifying employees and obtaining consent per local law. Founder provides notice templates + DSAR tools." |
| **Training / Onboarding Video (Vietnamese)** | Reduce support burden; set expectations early | Docs + email | S | 3-minute video: "How to legally log observations + notify your team." Link in email + app. |

### Feature Set D: Data Minimization & Retention

| Feature | Why | Where in App | Effort | Implementation Notes |
|---------|-----|--------------|--------|----------------------|
| **Retention Policy Selector** | PDPD Art. 13 requires disclosing how long you keep data | Settings → Data Retention | M | Dropdown: "Keep indefinitely" / "Delete after 1 year of termination" / "Delete after 3 years" / "Custom". Default: "Indefinite". System enforces (background job deletes on schedule). Audit trail shows what was deleted when. |
| **Export Before Deletion** | Compliance + UX: manager can export historical data before it auto-deletes | Settings → Data Lifecycle | S | Button: "Export all data (filtered by retention policy)". Uses same export as DSAR (JSON/CSV). |
| **Termination Workflow** | When employee leaves, manager can mark `terminated_date`; entries older than retention policy auto-queue for deletion | Profile → Actions → Mark Terminated | S | Set `terminated_date` on employee. Trigger query: if today - terminated_date > retention_period, email manager a 30-day reminder: "Will delete [X entries] on [date]. Click to skip deletion." |

---

## Vietnamese Copy Examples

### Consent Modal (on Profile, first entry on new employee)

```
🔒 Thông báo bảo vệ dữ liệu cá nhân

Bạn sắp ghi lại quan sát về [Tên nhân viên]. 

Luật Nghị định 13/2023 yêu cầu bạn PHẢI thông báo cho nhân viên rằng bạn đang ghi lại dữ liệu về họ, 
trước khi ghi.

✓ Bạn đã thông báo cho [Tên nhân viên] qua email, cuộc họp, hoặc sổ tay công ty?

☐ Có, tôi đã thông báo cho họ.

Cơ sở pháp lý (chọn một):
  ◯ Sự đồng ý của nhân viên
  ◯ Yêu cầu của hợp đồng lao động
  ◯ Yêu cầu của luật pháp
  ◯ Khác (vui lòng mô tả)

[Xác nhận]  [Huỷ]
```

### DSAR Email Template (in Settings → Legal → DSAR Request Template)

```
Chủ đề: Phản hồi Yêu cầu Truy cập Dữ liệu Cá nhân

Kính gửi [Tên nhân viên],

Chúng tôi đã nhận được yêu cầu truy cập dữ liệu cá nhân của bạn theo Nghị định 13/2023/NĐ-CP.

Thông tin về bạn được lưu trữ trong hệ thống bao gồm:
- Lịch sử quan sát (ghi chú, đánh giá cảm nhận)
- Các mục tiêu/cam kết được ghi
- Thông tin cơ bản (tên, vị trí, phòng ban)

Tệp đính kèm chứa toàn bộ dữ liệu về bạn trong hệ thống.

Bạn có quyền theo Luật BVDLCN:
✓ Yêu cầu sửa chữa: nếu thông tin không chính xác, liên hệ [email manager]
✓ Yêu cầu xoá: nếu bạn muốn xoá dữ liệu, vui lòng thông báo trong 72 giờ
✓ Rút lại sự đồng ý: bạn có thể rút lại sự đồng ý bất cứ lúc nào

Nếu bạn có câu hỏi hoặc muốn hành động trên các quyền này, vui lòng trả lời email này trong 72 giờ.

Trân trọng,
[Manager Name]
```

### In-App Privacy Guide (Markdown, Settings → Legal)

```markdown
# 🔒 Hướng dẫn Bảo vệ Dữ liệu Cá nhân

Team Tracker giúp bạn ghi lại quan sát về nhân viên để chuẩn bị họp 1:1 và viết đánh giá. 
**Luật Nghị định 13/2023 yêu cầu bạn phải thông báo cho nhân viên trước khi ghi dữ liệu về họ.**

## Bạn phải làm gì?

1. **Thông báo:** Ghi nhận lại với nhân viên (qua email, họp, sổ tay) rằng bạn đang sử dụng Team Tracker để ghi lại quan sát.
   - Mẫu email: [xem ở dưới]
   
2. **Xác nhận:** Khi bạn tạo entry đầu tiên cho một nhân viên, Team Tracker sẽ yêu cầu bạn xác nhận bạn đã thông báo.

3. **Lưu trữ:** Giữ bản sao của email thông báo làm bằng chứng.

## Quyền của nhân viên

Theo Luật BVDLCN, nhân viên có quyền:
- **Truy cập:** Yêu cầu xem toàn bộ dữ liệu được lưu về họ (bạn phải trả lời trong 72 giờ)
- **Sửa chữa:** Yêu cầu sửa nếu thông tin không chính xác
- **Xoá:** Yêu cầu xoá dữ liệu nếu không còn cần thiết
- **Rút lại đồng ý:** Rút lại sự đồng ý bất cứ lúc nào

## Mẫu Email Thông báo

[Template copied from above]

## Còn câu hỏi?

Team Tracker không phải là công cụ giám sát hay xâm phạm quyền riêng tư. Đây là sổ ghi chép cá nhân 
giúp bạn quản lý hiệu quả. Luật pháp chỉ yêu cầu bạn thông báo và cho phép nhân viên truy cập dữ liệu.

Liên hệ: compliance@team-tracker.vn
```

---

## Implementation Timeline & Effort Estimate

### Phase 1: Foundation (Weeks 1–2, ~3 points)
- Add `notified_date` + `lawful_basis` to `employees` table (migration)
- Add consent modal component + RLS guard
- Add `consent_withdrawn_date` to `employees`
- Write migration + seed scripts
- Test RLS isolation on new fields

**Effort:** S (schema change is low-risk; modal is basic React)

### Phase 2: DSAR Tools (Weeks 2–3, ~5 points)
- Build per-employee export API (Server Action)
- Export builder: JSON + CSV formats
- Add "Admin DSAR Tool" hidden UI (password-gated)
- Build deletion API (soft or hard; recommend soft-delete with audit)
- Test DSAR export completeness (all tables queried correctly)

**Effort:** M (query builder is straightforward; most time on testing)

### Phase 3: UX + Copy (Weeks 3–4, ~3 points)
- Consent modal UX + legal basis dropdown
- Settings → Compliance Info section
- Settings → Legal & Compliance guide (Markdown)
- DSAR template editor
- Notification audit log view

**Effort:** S–M (mostly UI composition, no new logic)

### Phase 4: Admin Features (Week 4–5, ~2 points)
- Retention policy selector + auto-delete background job
- Termination workflow (mark terminated, set deletion schedule)
- DSAR request tracker (analytics, optional for solo dev)

**Effort:** M (background job is simplest part; most time on testing)

### Phase 5: Testing + Docs (Week 5, ~1 point)
- Test consent modal prevents entry creation if not attested
- Test DSAR export includes all data
- Test deletion cascades correctly
- Docs: T&S template, Vietnamese privacy policy, training video (script)

**Effort:** M (E2E tests; docs are one-time cost)

**Total: 14 story points ≈ 4–5 weeks solo (with 1–2 weeks for legal review of T&S template)**

---

## Risk Assessment

### Founder Liability (Option 2 Mitigation)

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Customer doesn't notify employee | HIGH | Terms of service clause: "Customer is responsible for notification. Founder provides templates + checklist." Attestation checkbox = proof of awareness. |
| DSAR response deadline missed (72 hours) | MEDIUM | Founder builds automated export; customer (manager) is responsible for sending to employee. Terms clarify this. Recommendation: add "DSAR Deadline Calculator" in app (auto-emails manager: "DSAR received on X, due on Y"). |
| Employee disputes deletion didn't happen | MEDIUM | Soft-delete with audit trail. All deletions logged: who, when, what, why. Customer can audit. |
| Founder liable for data breach | LOW (Data in Supabase) | Supabase handles security/encryption. Founder ensures RLS + no secrets in code. Liability on Supabase (enterprise SLA). |
| Competitor claims founder is "enabler of illegal monitoring" | MEDIUM–HIGH | Marketing message: "The first HR tool designed for Vietnamese privacy law. We help you stay compliant." B2B positioning (not "monitoring tool"). Legal review of marketing copy. |

---

## Unresolved Questions

1. **Q: Should "consent" be withdrawable mid-employment, or only at hire?**
   - **Answer:** PDPD Art. 15 says withdrawable anytime. System should support it (add `consent_withdrawn_date`, entries after that are excluded from processing). But founder's T&S should note: "Withdrawal may be denied if other lawful basis applies (e.g., legal obligation to retain for audit)."

2. **Q: Hard-delete vs soft-delete for DSAR deletion requests?**
   - **Answer:** Recommend **soft-delete** (mark as `deleted_by_dsar`, exclude from queries). Keeps audit trail for founder + customer. Hard-delete is risky: no proof the deletion happened if later audited.

3. **Q: Does the founder need a Vietnamese lawyer?**
   - **Answer:** **Minimum:** Hire for 4–6 hours ($200–400) to review T&S + privacy policy. **Recommended:** 8–16 hours ($400–800) to also review consent/DSAR language + create example company policy template.

4. **Q: Should founder build auto-notification (email from Team Tracker to employee)?**
   - **Answer:** **NO.** Adds complexity + liability (founder sends email = founder is processor actively notifying). Stick to: manager is responsible for notification; Team Tracker just provides templates + checklist + evidence (attestation).

5. **Q: What about employees who refuse consent?**
   - **Answer:** PDPD allows consent. If employee withdraws consent (or never gives it), manager cannot process data. System enforces: `consent_withdrawn_date` filters all queries. Manager must document why they can't log (for audit). Founder's T&S: "Team Tracker is not a replacement for statutory obligations to retain employee records; other legal bases may apply."

6. **Q: Should founder limit data retention to a specific period (e.g., 3 years post-termination)?**
   - **Answer:** **NO** for MVP (Option 2). Make it a customer choice (Settings → Data Retention). Founder's default: "Indefinite (customer responsible for setting policy)." Let customer decide based on their legal/HR advice.

---

## Sources

- [Decree 13/2023 Overview (Hogan Lovells)](https://www.hoganlovells.com/en/publications/vietnam-enacts-landmark-law-on-personal-data-protection-stable-standing-with-stricter-compliance)
- [Vietnam PDPD Data Subject Rights (Securiti.ai)](https://securiti.ai/vietnam-personal-data-protection-decree/)
- [GDPR Article 13 Privacy Notice Requirements](https://gdpr-text.com/read/article-13/)
- [Employee Monitoring Legal Compliance (Insightful.io)](https://www.insightful.io/blog/does-an-employer-need-consent-to-monitor)
- [DSAR Workflow Design (ComplyDog)](https://complydog.com/blog/dsar-complete-guide-data-subject-access-requests-gdpr)

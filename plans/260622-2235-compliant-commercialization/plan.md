# Plan: Reposition → Compliant Commercialization (B2B "company-deployed")

Đưa Team Tracker từ "sổ mật của sếp" → sản phẩm bán hợp pháp tại VN (NĐ 13/2023),
giữ ~90% giá trị. Mô hình: **công ty triển khai, sếp ghi note riêng (ẩn với NV) nhưng
có THÔNG BÁO + CĂN CỨ pháp lý + công cụ quyền chủ thể (DSAR)**. Kiếm tiền: B2B-lite + SePay/VietQR.

- **Nguồn:** `plans/reports/audit-260622-2208-launch-readiness-and-commercialization.md` + research repositioning (`wf_5c823e7f-067`) + market/subscription (`wf_3696ab4b-dd5`).
- **Nguyên lý hợp pháp:** privacy = *cài đặt hiển thị mặc định* (NV không thấy trong app), KHÔNG phải bí mật pháp lý. 3 trụ: **Notice + Lawful basis + Rights(DSAR)**.
- **Bối cảnh code mới:** entry-create đã **client-direct** (`quick-add-sheet.tsx`), chỉ delete là server action; middleware đã có security headers/CSP (remediation branch). RLS/cross-owner guard/append-only/`getUser()` đã chắc — KHÔNG đụng.
- **Đồng bộ với security remediation (quan trọng):** migration đã dùng tới **014** → plan này đánh số từ **015+** (015/016 phase-01, 017 phase-02, 018/019 phase-04). `lib/supabase/admin.ts` (service-role) **đã bị gỡ** → mọi ghi DB không-session (webhook billing) dùng **RPC `SECURITY DEFINER` + shared-secret**, KHÔNG tái dùng service-role.

## Invariants (không phá)
Append-only content · 1 bảng `entries` 2 trục · sentiment từ DB (3 default) · RLS mọi bảng `(select auth.uid()) = user_id` · writes = client-direct/Server Action (verify token, không `getSession()`) · file <200 LOC · kebab-case · mobile-first.

## Phases
| # | Phase | Chặn gì | Effort | Phụ thuộc |
|---|---|---|---|---|
| 00 | [Legal foundation](phase-00-legal-foundation.md) (luật sư, căn cứ, Privacy/Terms/DPA) | Thương mại hoá | L (phi-code) | — |
| 01 | [Compliance data model + Notice/Consent](phase-01-compliance-data-model-and-consent.md) | Pháp lý | M | 00 (quyết căn cứ) |
| 02 | [Data-subject rights (DSAR) + Retention](phase-02-data-subject-rights-and-retention.md) | Pháp lý | L | 01 |
| 03 | [Self-serve onboarding + Legal pages](phase-03-self-serve-onboarding-and-legal-pages.md) | Acquire khách | L | 00 (Terms text) |
| 04 | [Billing SePay/VietQR + gating](phase-04-billing-sepay-and-gating.md) | Thu tiền | L | 03 |
| 05 | [Ops / launch hardening](phase-05-ops-launch-hardening.md) | Vận hành | M | 03 |
| 06 | [UX / a11y / perf polish](phase-06-ux-a11y-perf-polish.md) | Chất lượng | M | song song |

## Thứ tự thực thi đề xuất
**00 trước tiên** (có thể chặn/đổi hướng) → **01 → 02** (cốt lõi hợp pháp) → **03** → **05** (song song) → **04** → **06**.
Mốc "có thể bán thử": xong 00–04. 06 làm dần.

## Quyết định cần chốt trước khi code (xem phase-00)
1. Căn cứ pháp lý chính: **đồng ý** vs **điều khoản hợp đồng** (ảnh hưởng schema phase-01).
2. B2C tự-trả hay **B2B-lite** (công ty trả) — khuyến nghị B2B-lite.
3. Có cho NV xem timeline của mình (employee portal) không — MVP: KHÔNG, chỉ DSAR theo yêu cầu.
4. Dữ liệu giữ ở Tokyo hay chuyển Singapore/VN (`docs/migrate-to-singapore.md`).

## Status
- [ ] 00 Legal · [ ] 01 Data model+consent · [ ] 02 DSAR+retention · [ ] 03 Onboarding+legal pages · [ ] 04 Billing · [ ] 05 Ops · [ ] 06 Polish

> ⚠️ Plan kỹ thuật — KHÔNG phải tư vấn luật. Phase-00 bắt buộc có luật sư VN duyệt trước khi bán.

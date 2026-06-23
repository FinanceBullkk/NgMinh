# Phase 00 — Legal Foundation (phi-code, làm TRƯỚC)

**Priority:** P0 (blocker thương mại hoá, có thể đổi cả hướng) · **Status:** todo · **Effort:** L

## Overview
Không viết code trước khi chốt căn cứ pháp lý. Đây là phase quyết định: chọn lawful basis,
thuê luật sư duyệt, soạn Privacy/Terms/DPA + bộ template tiếng Việt. Output của phase này
là INPUT cho schema (01) và onboarding (03).

## Key insights (từ research)
- VN NĐ 13/2023 **nặng về đồng ý + hợp đồng**; "legitimate interest" kiểu GDPR **YẾU** ở VN (không có balancing test, không án lệ).
- Căn cứ khả thi: **(mạnh)** đồng ý bằng văn bản · **(tạm)** điều khoản hợp đồng lao động *nêu rõ loại dữ liệu* (ghi chú, sentiment, closeness) · **(yếu)** mục đích chính đáng.
- Mô hình trách nhiệm: **công ty/sếp = controller** (chịu trách nhiệm thông báo), **bạn = processor** (cung cấp công cụ + DSAR + DPA). Terms phải nói rõ split này → lá chắn cho bạn.
- Dữ liệu đang ở Tokyo (ap-northeast-1) → chuyển dữ liệu xuyên biên giới, cần nêu trong hồ sơ.

## Requirements
1. Chốt **lawful basis chính** (đồng ý / hợp đồng) → quyết enum `lawful_basis` ở phase-01.
2. Luật sư VN (DLCN) duyệt ~4–8h: Terms, Privacy Policy, DPA, mẫu điều khoản hợp đồng lao động, mẫu thông báo NV.
3. Quyết retention mặc định (vd: xoá sau 12 tháng kể từ ngày NV nghỉ) → phase-02.
4. Quyết data residency: giữ Tokyo hay chuyển (`docs/migrate-to-singapore.md`).
5. Cân nhắc Hồ sơ đánh giá tác động xử lý DLCN (DPIA) — hỏi luật sư có bắt buộc nộp A05 không.

## Deliverables (lưu vào `docs/legal/` — tạo mới)
- `docs/legal/privacy-policy-vi.md`
- `docs/legal/terms-of-service-vi.md`
- `docs/legal/dpa-template-vi.md` (controller–processor)
- `docs/legal/employee-notice-template-vi.md` (mẫu sếp gửi NV — đã có draft trong report)
- `docs/legal/customer-compliance-checklist-vi.md` (hướng dẫn công ty khách)

## Implementation steps
1. Brief luật sư bằng `plans/reports/audit-...md` + research repositioning (mục PDPD).
2. Chốt lawful basis + retention + residency.
3. Luật sư hoàn thiện 5 deliverable trên (mình draft trước, họ duyệt).
4. Ghi quyết định vào `docs/system-architecture.md` (mục Compliance) + cập nhật `CLAUDE.md` invariant mới: "mọi employee phải có lawful_basis trước khi ghi entry".

## Todo
- [ ] Chốt lawful basis chính
- [ ] Thuê + brief luật sư VN
- [ ] Hoàn thiện Privacy/Terms/DPA/notice/checklist
- [ ] Quyết retention + residency
- [ ] Ghi quyết định vào docs + CLAUDE.md

## Success criteria
- Có 5 deliverable đã luật sư duyệt.
- Enum `lawful_basis` + retention default được chốt bằng văn bản → unblock phase-01/02.

## Risks
- Luật sư nói mô hình hiện tại không cứu được bằng "company-deployed" → phải tăng minh bạch (cho NV xem) → re-scope. **Mitigation:** hỏi rõ ngay buổi đầu trước khi code.

## Unresolved questions
- DPIA có phải nộp A05 không (quy mô nhỏ)?  
- Đồng ý của NV có "tự nguyện" hợp lệ không khi có quan hệ lao động (power imbalance)? → nghiêng về căn cứ hợp đồng.

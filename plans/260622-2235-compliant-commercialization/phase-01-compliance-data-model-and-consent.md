# Phase 01 — Compliance Data Model + Notice/Consent Attestation

**Priority:** P0 (pháp lý) · **Status:** todo · **Effort:** M · **Phụ thuộc:** phase-00 (chốt căn cứ)

## Overview
Thêm trường tuân thủ vào `employees` + bước "xác nhận đã thông báo + chọn căn cứ pháp lý"
trước khi ghi entry đầu tiên cho mỗi nhân viên. Note vẫn ẩn với NV; chỉ thêm guardrail + audit trail.

## Key insights
- Entry-create giờ **client-direct** (`components/quick-add/quick-add-sheet.tsx`) → gating ở UI có thể bypass.
  Vì vậy **bắt buộc enforce ở DB bằng trigger** (giống cross-owner guard `008`), không chỉ ở client.
- Attestation là hành động **một lần / mỗi employee** (lưu trên `employees`), không phải mỗi entry.

## Requirements
- `employees` thêm: `notified_date date`, `lawful_basis text`, `consent_withdrawn_at timestamptz` (nullable).
- `lawful_basis` enum (chốt ở phase-00): `consent | contract | legal_obligation | other`.
- Không cho tạo `entries` cho employee có `lawful_basis IS NULL` (hoặc đã `consent_withdrawn_at`).
- Backfill employee cũ = NULL (legacy) → buộc attest trước khi ghi tiếp.

## Related code files
> ⚠️ Security remediation đã dùng migration tới **014** → đánh số mới từ **015+** (dùng `supabase migration new <name>` để có timestamp đúng).
- **Create:** `supabase/migrations/<ts>_015_compliance_fields.sql`
- **Create:** `supabase/migrations/<ts>_016_entry_consent_guard.sql` (trigger BEFORE INSERT trên `entries`)
- **Modify:** `lib/types/database.ts` (regen: `npm run gen:types`), `lib/types/models.ts`
- **Modify:** `components/quick-add/quick-add-sheet.tsx` (modal attest trước insert client-direct)
- **Create:** `components/quick-add/consent-attest-dialog.tsx` (<200 LOC)
- **Modify:** `app/(app)/actions/employees.ts` (server action `attestNotified(employeeId, basis)` cập nhật `employees`)
- **Modify:** `lib/data/employees.ts` (đọc thêm trường compliance cho roster/profile)
- **Reference:** `supabase/migrations/...008_cross_owner_integrity.sql` (mẫu trigger)

## Implementation steps
1. Migration 015: `alter table employees add column ...`. Cập nhật RLS không đổi (đã FOR ALL).
2. Migration 016: trigger `before insert on entries` → nếu employee thiếu `lawful_basis` hoặc đã withdraw → `raise exception`. (Lưu ý: 010 đã làm append-only/khoá UPDATE — trigger này là guard riêng cho consent.)
3. `npm run gen:types`.
4. `attestNotified` server action: verify `getUser()`, update `employees.notified_date=current_date, lawful_basis=$basis` (RLS scope).
5. Trong quick-add: nếu employee được chọn có `lawful_basis IS NULL` → mở `consent-attest-dialog` (checkbox "đã thông báo" + dropdown căn cứ) → gọi `attestNotified` → rồi mới cho lưu entry.
6. Hiển thị badge "đã thông báo: dd/mm" ở profile header.
7. Test: trigger chặn insert khi NULL; attest xong insert ok; withdraw → chặn.

## Sample copy (tiếng Việt — từ research)
> 🔒 Bạn sắp ghi quan sát về **[Tên NV]**. NĐ 13/2023 yêu cầu thông báo cho nhân viên trước khi ghi.
> ☐ Tôi đã thông báo cho họ.  Cơ sở pháp lý: ◯ Đồng ý ◯ Hợp đồng lao động ◯ Luật pháp ◯ Khác

## Todo
- [ ] Migration 015 (trường compliance) + 016 (trigger consent guard)
- [ ] Regen types
- [ ] `attestNotified` action
- [ ] `consent-attest-dialog` + wire vào quick-add
- [ ] Badge "đã thông báo" ở profile
- [ ] Tests (trigger + flow)

## Success criteria
- Không thể tạo entry cho employee chưa attest (kiểm bằng test gọi thẳng client-direct).
- Audit trail `notified_date` + `lawful_basis` lưu đúng, RLS-scoped.
- `npm run build` + `npm run lint` pass.

## Security
- Enforce ở DB (trigger), không tin client. RLS giữ nguyên. Không log nội dung nhạy cảm.

## Unresolved questions
- Có cần lưu **bằng chứng** thông báo (file/email) trong app không, hay chỉ checkbox tự khai? (hỏi luật sư — MVP: tự khai + nhắc lưu email ngoài).

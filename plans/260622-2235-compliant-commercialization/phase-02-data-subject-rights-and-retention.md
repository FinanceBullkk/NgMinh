# Phase 02 — Data-Subject Rights (DSAR) + Retention + Termination

**Priority:** P0 (pháp lý) · **Status:** todo · **Effort:** L · **Phụ thuộc:** phase-01

## Overview
Cho phép sếp đáp ứng quyền của nhân viên (xem/sửa/xoá/rút đồng ý) theo NĐ 13/2023, và
tự động hoá vòng đời dữ liệu (giữ — nghỉ việc — xoá). Tận dụng hạ tầng export sẵn có.

## Key insights
- Đã có export toàn-tài-khoản: `app/(app)/settings/export/route.ts` + `lib/data/export.ts` + `lib/data/user-data.ts`.
  Gap thật chỉ là **export/xoá THEO TỪNG nhân viên** (cho 1 yêu cầu DSAR cụ thể).
- "Rút đồng ý" (phase-01 `consent_withdrawn_at`) → entry sau thời điểm đó bị chặn (trigger) và loại khỏi xử lý.
- Xoá: ưu tiên **hard-delete theo employee** (đơn giản, đúng "quyền xoá"); cascade đã có (`on delete cascade`).

## Requirements
- DSAR export 1 nhân viên (JSON + CSV) — toàn bộ entries/goals/thông tin cơ bản của employee đó.
- Mẫu email trả lời DSAR (tiếng Việt, đã draft trong report).
- Retention: `terminated_at` + `retention_until` trên `employees`; job xoá khi quá hạn.
- Termination workflow: đánh dấu NV nghỉ → đặt `retention_until = terminated_at + N tháng` (N từ phase-00).

## Related code files
- **Modify:** `lib/data/export.ts`, `lib/data/user-data.ts` (thêm hàm gom theo `employeeId`)
- **Create:** `app/(app)/employees/[id]/dsar/route.ts` (GET export 1 NV, auth-gated, RLS)
- **Modify:** `app/(app)/actions/employees.ts` (`markTerminated`, `withdrawConsent`, `deleteEmployeeData`)
- **Create:** `components/profile/compliance-panel.tsx` (nút: Xuất dữ liệu NV · Đánh dấu nghỉ · Rút đồng ý · Xoá dữ liệu)
- **Create:** `supabase/migrations/<ts>_017_retention_fields.sql` (`terminated_at`, `retention_until`) — *số 017 vì security đã dùng tới 014, phase-01 dùng 015/016*
- **Create:** retention cleanup — Supabase scheduled (pg_cron) hoặc Vercel Cron route `app/api/cron/retention/route.ts` (service-role, xoá employee quá `retention_until`)
- **Create:** `docs/legal/employee-notice-template-vi.md` link trong UI

## Implementation steps
1. Migration 017: thêm `terminated_at`, `retention_until`.
2. Hàm `gatherEmployeeData(employeeId)` (RLS-scoped) → JSON; route DSAR trả JSON/CSV.
3. `compliance-panel` ở profile: 4 nút trên + copy mẫu email DSAR (copy-to-clipboard).
4. `markTerminated`: set `terminated_at=today`, `retention_until=today + N tháng`.
5. `withdrawConsent`: set `consent_withdrawn_at=now()`.
6. `deleteEmployeeData`: hard-delete employee (cascade xoá entries/goals/tags-link).
7. Cron retention: chạy hằng ngày, xoá employee có `retention_until < today`; log số đã xoá.
8. Tests: DSAR export đủ data 1 NV (và KHÔNG lẫn NV khác); delete cascade sạch; cron chỉ xoá quá hạn.

## Todo
- [ ] Migration 017 retention fields
- [ ] `gatherEmployeeData` + DSAR route (JSON/CSV)
- [ ] `compliance-panel` (4 action + email template)
- [ ] `markTerminated` / `withdrawConsent` / `deleteEmployeeData`
- [ ] Cron retention cleanup
- [ ] Tests

## Success criteria
- 1 click xuất toàn bộ dữ liệu của đúng 1 nhân viên (không rò NV khác — test RLS).
- Xoá dữ liệu NV sạch cascade; retention cron hoạt động.
- `npm run build`/`lint`/test pass.

## Security
- DSAR route + cron dùng đúng quyền (route: user-RLS; cron: service-role + secret header). Không expose cron công khai.

## Unresolved questions
- Retention N tháng cụ thể (phase-00).  
- Có cần "soft-delete + ẩn danh" thay vì hard-delete để giữ thống kê tổng hợp không? (MVP: hard-delete).

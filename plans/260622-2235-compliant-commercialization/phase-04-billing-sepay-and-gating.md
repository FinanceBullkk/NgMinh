# Phase 04 — Billing (SePay/VietQR) + Server-Side Gating

**Priority:** P1 (thu tiền) · **Status:** todo · **Effort:** L · **Phụ thuộc:** phase-03

## Overview
Lớp kiếm tiền cho thị trường VN: SePay/VietQR + mô hình **`expires_at`** (không recurring native),
ưu tiên gói NĂM. Gate tính năng phía server. Hiện billing readiness = 0.

## Key insights
- VietQR = chuyển khoản 1 lần, KHÔNG auto-charge → dùng `expires_at`, KHÔNG cần subscription state machine.
- Mỗi thanh toán sinh **mã code riêng**; SePay webhook báo "đã nhận X, nội dung = code" → cộng hạn.
- **Đẩy gói năm** (~890–990k) để giảm ma sát quét QR; gói tháng có nhưng không khuyến khích.
- Gate phía **server/RLS**, không chỉ UI (UI bypass được). Gate: roster cap (Free 5 NV) + Review Pack.
- KHÔNG gate export (niềm tin) · KHÔNG gate sentiment (invariant). Hoá đơn → e-invoice provider/MoR, KHÔNG tự code.

## Related code files
> ⚠️ Security đã dùng migration tới 014, phase-01/02 dùng 015–017 → billing bắt đầu **018+**.
> ⚠️ `lib/supabase/admin.ts` (service-role) **đã bị gỡ** ở security remediation. KHÔNG tái sử dụng. Webhook ghi DB qua **RPC `SECURITY DEFINER` + shared-secret** (giống pattern `delete_own_account` migration 012).
- **Create:** `supabase/migrations/<ts>_018_subscriptions.sql` — bảng `subscriptions(user_id, plan, status, expires_at, external_ref, ...)`, RLS read-own, **không client/anon write trực tiếp**.
- **Create:** `supabase/migrations/<ts>_019_apply_payment_rpc.sql` — `apply_subscription_payment(p_secret, p_external_ref, p_user_ref, p_days)` `SECURITY DEFINER`: kiểm `p_secret` khớp GUC `app.sepay_webhook_secret` (nếu sai → raise), rồi upsert/cộng `expires_at` idempotent theo `external_ref`. EXECUTE grant tối thiểu.
- **Create:** `app/api/webhooks/sepay/route.ts` — verify chữ ký SePay → gọi RPC `apply_subscription_payment` bằng **anon client + secret** (KHÔNG service-role). Trả 200 nhanh.
- **Create:** `lib/billing/entitlement.ts` — `getEntitlement(userId)` (plan + còn hạn?), `assertCanAddEmployee()`, `assertPro()`.
- **Modify:** `lib/data/employees.ts` + `app/(app)/actions/employees.ts` — chặn thêm NV thứ 6 khi Free.
- **Modify:** `components/profile/review-pack.tsx` + nơi gọi — gate Pro.
- **Create:** `app/(marketing)/pricing/page.tsx` + `app/(app)/upgrade/page.tsx` — hiện VietQR + mã + trạng thái.
- **Modify:** `.env.example` — `SEPAY_WEBHOOK_SECRET`, `SEPAY_ACCOUNT_*`.
- **Create:** nhắc gia hạn (email, dùng hạ tầng phase-05) trước hết hạn 7 ngày.

## Implementation steps
1. Migration 018 (`subscriptions` + RLS read-own, no direct anon write; index `user_id`,`expires_at`) + Migration 019 (RPC `apply_subscription_payment` SECURITY DEFINER + secret check). Set GUC `app.sepay_webhook_secret`.
2. `getEntitlement`: free nếu không có/đã hết hạn; pro nếu `expires_at > now()`. Trial = set `expires_at = signup+14d` (tạo lúc signup phase-03).
3. Trang upgrade: tạo mã thanh toán/đơn → hiển thị VietQR + hướng dẫn; poll trạng thái.
4. Webhook SePay: verify chữ ký → match mã → gọi RPC `apply_subscription_payment` (anon client + secret) → cộng `expires_at += 365d` (hoặc 30d), idempotent theo `external_ref`. KHÔNG dùng service-role.
5. Gate server: `assertCanAddEmployee` trong action thêm NV; `assertPro` cho Review Pack/lọc nâng cao.
6. Email nhắc gia hạn trước 7 ngày (cron + provider phase-05).
7. Tests: hết hạn → rớt Free; cộng hạn đúng; webhook idempotent; gate chặn ở server (không chỉ UI).

## Todo
- [ ] Migration 018 subscriptions + RLS, 019 RPC apply_payment (SECURITY DEFINER + secret)
- [ ] `entitlement.ts` + trial khởi tạo lúc signup
- [ ] SePay webhook (verify + idempotent)
- [ ] Trang pricing + upgrade (VietQR)
- [ ] Gate server: roster cap + Review Pack
- [ ] Email nhắc gia hạn
- [ ] Tests

## Success criteria
- Thu được tiền thật qua VietQR → tài khoản lên Pro tự động (webhook).
- Free bị chặn ở NV thứ 6 + Review Pack **từ phía server**.
- Hết hạn tự rớt Free. `build`/`lint`/test pass.

## Security
- KHÔNG tái dùng service-role (đã gỡ ở security remediation). Webhook ghi DB qua RPC `SECURITY DEFINER` có kiểm shared-secret (GUC). Verify chữ ký SePay ở route. Không cho client/anon ghi thẳng `subscriptions` (RLS read-own).

## Unresolved questions
- Giá VND chính thức + có regional pricing không.  
- Hoá đơn điện tử: dùng provider nào (Viettel/MISA/VNPT) hay qua MoR cho khách global?

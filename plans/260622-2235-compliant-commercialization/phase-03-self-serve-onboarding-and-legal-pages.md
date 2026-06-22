# Phase 03 — Self-Serve Onboarding + Legal Pages

**Priority:** P0 (acquire khách) · **Status:** todo · **Effort:** L · **Phụ thuộc:** phase-00 (Terms text)

## Overview
Mở "cửa vào": signup + xác nhận email + quên mật khẩu + trang pháp lý + đồng ý Terms lúc đăng ký.
Hiện chỉ có login (`app/(auth)/login`). Bootstrap user mới đã có sẵn (trigger `handle_new_user` seed sentiment).

## Key insights
- Middleware `lib/supabase/middleware.ts:7` `PUBLIC_PATHS = ["/login"]` → phải thêm các route công khai mới.
- `supabase/config.toml` `enable_signup=true` nhưng không UI → người lạ POST thẳng API. Khi mở signup thật, **gắn signup vào luồng có kiểm soát** (hoặc invite cho B2B); nếu chưa mở thì set `enable_signup=false` ở dashboard.
- B2B-lite (khuyến nghị): công ty/HR đăng ký → mời quản lý qua email (`inviteUserByEmail`) — vẫn cần callback route.
- Đồng ý Terms lúc signup = bằng chứng ràng buộc hợp đồng (gắn phase-00).

## Related code files
- **Create:** `app/(auth)/signup/{page.tsx,actions.ts,signup-form.tsx}` (signUp + checkbox đồng ý Terms)
- **Create:** `app/(auth)/callback/route.ts` (`exchangeCodeForSession`) — cho confirm email + reset
- **Create:** `app/(auth)/forgot/{page.tsx,actions.ts}` (`resetPasswordForEmail`)
- **Create:** `app/(auth)/reset/{page.tsx,actions.ts}` (`updateUser({password})` sau callback)
- **Modify:** `app/(auth)/login/login-form.tsx` (link "Tạo tài khoản" + "Quên mật khẩu?")
- **Modify:** `lib/supabase/middleware.ts` (`PUBLIC_PATHS` += `/signup,/callback,/forgot,/reset,/privacy,/terms`)
- **Create:** `app/(marketing)/privacy/page.tsx`, `app/(marketing)/terms/page.tsx` (render `docs/legal/*`)
- **Optional:** `app/(marketing)/page.tsx` landing + pricing; route "/" chưa đăng nhập → landing thay vì login
- **Config:** Supabase dashboard: bật `enable_confirmations`, cấu hình captcha (Turnstile/hCaptcha), set redirect URLs

## Implementation steps
1. Thêm các path vào `PUBLIC_PATHS` (nếu thiếu → redirect-loop về /login).
2. `signup`: form email+password+checkbox Terms (required) → `supabase.auth.signUp` (emailRedirectTo=/callback) → màn "kiểm email".
3. `callback/route.ts`: `exchangeCodeForSession(code)` → redirect "/".
4. `forgot` + `reset`: gửi mail reset → callback → trang đặt mật khẩu mới.
5. Login form: thêm 2 link; giữ thông báo lỗi generic (chống enumeration — đã tốt).
6. Trang `/privacy` `/terms`: render markdown từ `docs/legal/`.
7. Bật email confirmations + captcha ở dashboard; quyết `enable_signup` (B2C mở / B2B invite-only).
8. Tests: signup→confirm→login; forgot→reset; route công khai không redirect-loop.

## Todo
- [ ] PUBLIC_PATHS update
- [ ] signup + callback + forgot + reset
- [ ] login links
- [ ] /privacy /terms (+ landing/pricing optional)
- [ ] Dashboard: confirmations + captcha + redirect URLs + enable_signup decision
- [ ] Tests

## Success criteria
- Người lạ tự tạo tài khoản → nhận mail xác nhận → vào app, có sẵn 3 sentiment default.
- Quên mật khẩu tự khôi phục được, không cần can thiệp thủ công.
- Đồng ý Terms được ghi nhận lúc signup.

## Security
- Bật email confirmation + captcha trước khi mở signup công khai. Rate-limit (phase-05). Không mở signup hở mà thiếu kiểm soát.

## Unresolved questions
- B2C signup mở hay B2B invite-only? (theo quyết định mô hình kinh doanh phase-00/plan).

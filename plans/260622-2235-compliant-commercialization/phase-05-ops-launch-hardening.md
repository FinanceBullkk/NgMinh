# Phase 05 — Ops / Launch Hardening

**Priority:** P1 (vận hành) · **Status:** todo · **Effort:** M · **Phụ thuộc:** phase-03 (song song được)

## Overview
Hạ tầng vận hành cho sản phẩm trả phí: email, theo dõi lỗi, CI/CD, staging riêng, backup,
rate-limit, error boundary. Một số đã được vá ở branch `security/remediation-rls-auth` (security headers/CSP).

## Key insights
- **Email là nền tảng chung**: cần cho confirm/reset (phase-03), nhắc gia hạn (phase-04), trả lời DSAR (phase-02). Làm sớm.
- Security headers/CSP đã có (`lib/security/headers.ts`, `lib/supabase/middleware.ts`) — kiểm lại, đừng làm lại.
- Reminder/nudges hiện in-app (đúng spec) — KHÔNG phải blocker; chỉ thêm email reminder nếu muốn tăng retention (optional).
- Preview Vercel đang trỏ chung DB prod (`docs/deployment-guide.md`) → rủi ro hỏng data khách.

## Requirements
- Email provider (Resend/Postmark/SES) cho transactional mail.
- Error tracking (Sentry) + log có cấu trúc tại các catch của Server Action.
- CI chạy `lint`+`build`+`test` trước deploy.
- Supabase project **staging riêng** cho Preview.
- Backup/restore documented + lịch backup.
- Rate-limit + captcha trên login/signup; `/api/health`.
- `app/global-error.tsx` + `app/(app)/error.tsx` (fallback tiếng Việt, có reset).

## Related code files
- **Create:** `app/global-error.tsx`, `app/(app)/error.tsx`, `app/not-found.tsx`
- **Create:** `app/api/health/route.ts` (check DB reachable, không auth)
- **Create:** `.github/workflows/ci.yml` (lint+build+test; supabase start cho integration)
- **Create:** `lib/email/*` (wrapper provider) — dùng chung cho phase-02/03/04
- **Modify:** Server Actions `app/(app)/actions/*` — `console.error` tại catch + Sentry capture
- **Modify:** `docs/deployment-guide.md` — staging project, backup/restore, runbook
- **Config:** Sentry DSN, email keys vào env (server-only); Vercel Preview → staging Supabase
- **Verify:** `lib/security/headers.ts` (CSP) đã đủ chặt

## Implementation steps
1. Email wrapper `lib/email/send.ts` (provider) — phase-02/03/04 import.
2. Sentry init (client+server) + log tại catch của các action.
3. `global-error`/`error`/`not-found` tiếng Việt.
4. `/api/health` + gắn uptime monitor ngoài (BetterStack/UptimeRobot).
5. `ci.yml`: lint+build+unit; integration với `supabase start`.
6. Tạo Supabase staging; trỏ Vercel Preview vào đó; cập nhật deploy guide.
7. Rate-limit login/signup (Upstash hoặc Supabase captcha) — phối hợp phase-03.
8. Tài liệu backup/restore + bật lịch backup (Supabase).

## Todo
- [ ] Email wrapper
- [ ] Sentry + logging
- [ ] error/global-error/not-found
- [ ] /api/health + uptime monitor
- [ ] CI workflow
- [ ] Staging Supabase + Preview tách prod
- [ ] Rate-limit/captcha
- [ ] Backup/restore doc + lịch

## Success criteria
- Email transactional gửi được (confirm/reset/DSAR/nhắc hạn).
- Lỗi production hiện ở Sentry; UI lỗi là trang tiếng Việt có nút thử lại.
- CI chặn merge khi test fail. Preview không đụng DB prod.

## Security
- Mọi secret server-only. Health check không lộ thông tin nhạy cảm. Rate-limit trước khi mở signup.

## Unresolved questions
- Chọn email provider nào (deliverability VN)?  
- Có cần email reminder out-of-app (tăng retention) ở MVP không, hay để sau?

# Báo cáo: Vì sao Team Tracker CHƯA sẵn sàng Launch & Thương mại hoá

- **Ngày:** 2026-06-22
- **Phạm vi:** Audit toàn codebase (8 chiều) + nghiên cứu thị trường & mô hình subscription
- **Phương pháp:** 8 agent đọc code/docs thật song song → adversarial verify từng blocker → gộp trùng
- **Kết quả số:** 64 finding → **26 confirmed** · **10 bác bỏ/hạ cấp** · **28 medium/low**
- **Mục tiêu thị trường:** Việt Nam · Mô hình giá: Freemium + trial · Thanh toán: SePay/VietQR

---

## TL;DR (ngôn ngữ thường) — ví von "mở cửa hàng"

Đã làm xong **món hàng rất tốt** (cuốn sổ ghi chú). Nhưng **chưa có cửa hàng** để bán cho người lạ & thu tiền.

**4 lý do thật:**
1. **Chưa có cửa ra vào** — người lạ không tự đăng ký được; phải mở tài khoản bằng tay cho từng người. Quên mật khẩu không tự lấy lại được.
2. **Bán có thể phạm luật** (QUAN TRỌNG NHẤT) — cuốn sổ ghi *bí mật* nhận xét về nhân viên mà họ không biết/không đồng ý. Nghị định 13/2023 cấm tự ý thu thập dữ liệu cá nhân. Bán ra = mỗi khách vi phạm, bạn tiếp tay. → **Hỏi luật sư trước tiên**, có thể phải đổi định vị sản phẩm.
3. **Chưa có giấy tờ bán hàng** — thiếu Điều khoản sử dụng + Chính sách bảo mật. Cổng thanh toán bắt buộc có mới cho bật.
4. **Chưa có quầy thu ngân** — không có nút trả tiền/bảng giá/gói. Làm từ đầu.

**Tin tốt:** lõi sản phẩm tốt, bảo mật dữ liệu chắc — gap nằm ở "vỏ thương mại", không phải cuốn sổ.

---

## 1. 4 nhóm BLOCKER gốc (đã verify, đã gộp trùng)

### Blocker 1 — Không có hệ thống tài khoản tự phục vụ
- **Mức:** blocker · **Chặn:** thương mại hoá · **Effort:** L–XL
- **Đời thường:** cửa hàng không có cửa vào; chủ phải dẫn từng khách qua cửa sau.
- **Kỹ thuật (evidence):**
  - Chỉ có đăng nhập: `app/(auth)/login/actions.ts:18` (`signInWithPassword`) — không có `signUp` ở đâu.
  - Không có route `/callback` để xử lý link xác nhận email / reset (Supabase bắt buộc có).
  - Không có quên-mật-khẩu (`resetPasswordForEmail` = 0 hit). `login-form.tsx` không có link.
  - `supabase/config.toml:176,221` `enable_signup=true` nhưng không có UI → người lạ POST thẳng API tạo account, ăn quota (fix nhanh: tắt `enable_signup`).
  - Provisioning thủ công không scale (blocker riêng, dim OPS).
- **Việc cần làm:** thêm `app/(auth)/signup` + route `/callback` (`exchangeCodeForSession`) + trang forgot/reset; thêm các path vào `PUBLIC_PATHS` ở `lib/supabase/middleware.ts:6`.

### Blocker 2 — Pháp lý: không có căn cứ hợp pháp xử lý dữ liệu nhân viên (PDPD)
- **Mức:** blocker · **Chặn:** thương mại hoá · **Effort:** XL (cần luật sư) · **SỐNG CÒN**
- **Đời thường:** bán công cụ ghi sổ mật về người khác mà không xin phép họ.
- **Vì sao:** Nghị định 13/2023/NĐ-CP (hiệu lực 01/07/2023):
  - Điều 11: cần **sự đồng ý / căn cứ pháp lý** *trước* khi xử lý dữ liệu cá nhân.
  - Điều 13: phải **thông báo** cho chủ thể dữ liệu (nhân viên) về mục đích, bên xử lý, quyền của họ.
  - App hiện **không có cả hai** (`grep consent` = 0). Nhân viên là chủ thể dữ liệu; manager là controller; vendor là processor "tiếp tay".
  - `sentiment`, `closeness` (1–5), nhận xét hiệu suất = dữ liệu hành vi nhạy cảm.
- **Cảnh báo bổ sung:** dữ liệu prod đang ở **Tokyo (ap-northeast-1)** → chuyển dữ liệu xuyên biên giới, kích hoạt nghĩa vụ đánh giá chuyển giao.
- **Việc cần làm:** **gặp luật sư VN trước khi làm gì khác.** Hướng khả thi: (a) đổi định vị thành công cụ công ty triển khai *có thông báo* cho nhân viên + căn cứ HR hợp pháp; (b) thêm cơ chế notice/consent trong sản phẩm; (c) hướng dẫn khách phải báo nhân viên. **KHÔNG** bán mô hình "sổ mật" hiện tại như cũ.

### Blocker 3 — Pháp lý: không có Privacy Policy / Terms / DPA
- **Mức:** blocker · **Chặn:** thương mại hoá · **Effort:** L
- **Vì sao:** không thể thu tiền hợp pháp khi thiếu Terms (hợp đồng được trả tiền), Privacy Policy (nghĩa vụ công bố theo Điều 13), và DPA (quan hệ controller–processor). Stripe/Paddle/SePay + mọi store **bắt buộc** Privacy Policy URL mới cho bật.
- **Evidence:** `find` app cho privacy/terms/legal = rỗng; login page không có link; không có trang marketing/landing.
- **Việc cần làm:** soạn (cùng luật sư) Privacy Policy + Terms + DPA; thêm route `/privacy`, `/terms`; link từ login & signup/billing.

### Blocker 4 — Không có hệ thống billing
- **Mức:** blocker · **Chặn:** thương mại hoá · **Effort:** L
- **Đời thường:** chưa có quầy thu ngân.
- **Evidence:** `package.json` chỉ có Supabase + Next + SWR (không SDK thanh toán); `.env.example` chỉ có key Supabase; 6 bảng DB không có cột `expires_at`/`plan`; không route billing.
- **LƯU Ý gộp trùng:** webhook, feature-gating, nhắc gia hạn, hoá đơn = **việc con** của blocker này, **không** đếm riêng. Đặc biệt **hoá đơn KHÔNG tự code trong app** — dùng nhà cung cấp hoá đơn điện tử VN (Viettel/MISA/VNPT) hoặc Merchant-of-Record.
- **Việc cần làm (model VN):** bảng `expires_at` (trial=+14 ngày, paid=+365 ngày, free=NULL+cap 5 nhân viên) + SePay/VietQR webhook + gate phía server.

---

## 2. High / Medium đã verify (làm sau blocker)

**High:**
- Không có kế hoạch backup/restore DB (ngoài mặc định free-tier).
- Không có consent capture lúc signup (gắn với Blocker 2/3).
- Chuyển dữ liệu xuyên biên giới (Tokyo) chưa đánh giá (gắn Blocker 2).

**Medium (đã verify):**
- Không có error tracking / logging (lỗi của khách = mù, debug bằng đoán).
- Không có CI/CD (41 test không tự chạy trước deploy).
- Không có rate-limit/captcha trên login.
- Không có `error.tsx` (lỗi render → màn hình lỗi tiếng Anh trần của Next).
- Không giới hạn độ dài text người dùng nhập (ghi blob nhiều MB).
- **0 test** cho auth / export route / hot-path optimistic-write.
- Preview env trỏ chung DB prod (rủi ro hỏng data khách khi test).
- Query không phân trang (feed-filter, search `ilike` không index, profile timeline) — ổn 1 user, chậm khi nhiều năm data.
- Chưa có DPIA (Hồ sơ đánh giá tác động xử lý DLCN).
- Daily reminder chỉ in-app (gap retention, không phải blocker).

---

## 3. ĐÍNH CHÍNH — 10 finding bị bác bỏ/hạ cấp (ĐỪNG tốn công)

Vòng adversarial verify loại các "báo động giả" sau:

| Finding | Sự thật |
|---|---|
| "Daily reminder/nudges không có kênh gửi = lời hứa hỏng" | Spec vốn định nghĩa = prompt *trong app*. Không quảng cáo sai. → gap retention (medium/low), không blocker |
| "Không có focus indicator nào (a11y)" | SAI tiền đề — Tailwind v4 KHÔNG xoá focus ring; button/nav/chip vẫn có ring mặc định. → low |
| "Thiếu webhook thanh toán" | Double-count — không thể thiếu webhook khi chưa có luồng thanh toán. Gộp vào Blocker 4 |
| "Không có feature-gating" | Đúng nhưng là design constraint cho *khi* xây billing, không phải blocker rời |
| "Không nhắc gia hạn" | Tính năng *sau* khi có khách trả tiền (v1.1), không chặn launch |
| "Không có hoá đơn (hóa đơn)" | KHÔNG tự code — dùng e-invoice provider/MoR. Mis-scoped |
| "Append-only nên không sửa được nhận xét sai" | SAI — `deleteEntry` tồn tại (`app/(app)/actions/entries.ts:12-22`); xoá ≠ sửa |
| "Password policy yếu (6 ký tự)" | Đó là config local dev; prod set ở dashboard → low |
| "User mới không được seed sentiment" | Trigger `handle_new_user()` (migration 006/007) đã tự seed |
| "Nhân viên không có quyền chủ thể dữ liệu" | Nghĩa vụ thuộc controller (khách), không phải vendor; app đã có export + delete |

➡️ **Bài học:** số blocker thật ÍT HƠN vẻ ngoài — gom còn **4 nhóm**.

---

## 4. Cái đang TỐT (đừng đụng vào)

- **Cách ly dữ liệu chắc:** RLS `FOR ALL` mọi bảng với `(select auth.uid()) = user_id` (migration 004); trigger chống cross-owner IDOR (008); xác thực bằng `getUser()/getClaims()` (không `getSession()`); service-role key server-only, chỉ dùng xoá account. → Không rò rỉ data giữa user.
- **Feature-complete đúng spec** (MVP + Phase 2: nudges, review-pack, daily reminder). Phase 3 (AI) đúng là out-of-scope.
- Code modular sạch (chỉ 2 file >200 LOC), lint clean, test phủ các invariant quan trọng (RLS, append-only, cross-owner, sentiment archive, export/delete).

---

## 5. Phụ lục — Nghiên cứu thị trường & mô hình subscription

**Thị trường (đã verify 22 đối thủ):** niche "sổ tay riêng tư, một người, chống recency-bias để prep 1:1/review" **chưa có đối thủ trực tiếp**. Gần nhất đều lệch:
- Suite team/enterprise (15Five, Lattice, Leapsome, Fellow, Peoplebox…): bán per-seat org-wide, quá nặng.
- Personal CRM (Clay/Mesh, Dex, Monica): sai domain (networking).
- Manager hiện dùng Notion/Sheets/Notes.
- VN HRIS (Base.vn, Tanca, ACheckin): chấm công/payroll, không chạm niche.

**Mô hình giá đề xuất (VN):**
- Free: 5 nhân viên vĩnh viễn + trial 14 ngày full.
- Pro: ~99k/tháng, **ưu tiên gói NĂM ~890–990k** (VietQR không auto-charge → đẩy annual để giảm ma sát).
- Gate theo **số nhân viên + Review Pack**. KHÔNG gate export, KHÔNG gate sentiment (invariant cốt lõi).

**Thanh toán (founder VN):** SePay/VietQR (0% phí, vào bank VN) — không recurring native → dùng model `expires_at`. Stripe KHÔNG payout VN. Paddle/Polar (MoR) nếu bán global.

**Rủi ro lớn nhất:** willingness-to-pay B2C ở VN thấp → cân nhắc **B2B-lite** (bán cho startup/HR theo cụm manager). **Validate trước khi build billing.**

---

## 6. Lộ trình đề xuất

1. **Quyết pháp lý TRƯỚC** (Blocker 2) — gặp luật sư, quyết có reposition không. *Đừng code billing trước khi rõ cái này.*
2. **Validate willingness-to-pay** (hỏi 10–20 manager).
3. Onboarding shell (Blocker 1): signup + callback + reset + tắt `enable_signup` lậu + landing/pricing.
4. Pháp lý artifacts (Blocker 3): Privacy/Terms/DPA + consent/notice trong app.
5. Ops: email provider, error tracking, CI/CD, staging riêng, backup.
6. Billing (Blocker 4): SePay + `expires_at` + gating.
7. Polish & perf: a11y, error boundary, phân trang, icon PWA.

---

## Câu hỏi chưa ngã ngũ

1. **B2C tự-trả hay B2B-lite (công ty trả)** là trọng tâm doanh thu? → quyết có cần multi-manager/team workspace không.
2. Đã có tài khoản SePay + bank để nhận tiền chưa?
3. App nhắm tiếng Việt hay tiếng Anh? (target VN → nên tiếng Việt)
4. Đây là sản phẩm kiếm tiền nghiêm túc hay portfolio? → nếu portfolio, có thể bỏ qua billing, để free.
5. Có phục vụ user EU không? Nếu có → kích hoạt thêm nghĩa vụ GDPR (lớn hơn nhiều).

---

*Nguồn: workflow audit `wf_5721866f-eeb` (8 chiều + adversarial verify) + workflow market/subscription `wf_3696ab4b-dd5`.*

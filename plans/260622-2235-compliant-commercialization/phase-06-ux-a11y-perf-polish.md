# Phase 06 — UX / Accessibility / Performance Polish

**Priority:** P2 (chất lượng) · **Status:** todo · **Effort:** M · **Phụ thuộc:** song song (làm dần)

## Overview
Nâng chuẩn lên mức "sản phẩm trả phí": a11y, empty state/onboarding, contrast màu sentiment,
phân trang chống chậm khi nhiều data, icon PWA thật. Đây là polish — KHÔNG chặn launch, nhưng buyer để ý.

## Key insights (đã verify trong audit)
- "Không có focus indicator" là báo động giả (Tailwind v4 giữ ring mặc định) — chỉ thiếu **focus style thiết kế riêng** cho nút brand. → low.
- Màu sentiment do user chọn → có thể mất contrast (chữ tàng hình). Cần on-color theo luminance.
- Query chưa phân trang (`feed-client.ts`, `profile-client.ts`, search `ilike`) → chậm khi nhiều năm data.
- Icon PWA placeholder (413 bytes) — roadmap đã ghi "replace before launch".

## Related code files
- **Modify:** `components/quick-add/sentiment-button-row.tsx`, `components/sparkline/sentiment-sparkline.tsx`, roster badges — on-color theo WCAG luminance (thêm util `lib/utils/contrast-color.ts`).
- **Modify:** `components/quick-add/quick-add-sheet.tsx` — `aria-labelledby` cho `<dialog>`, focus-return về trigger, `role="alert"` cho lỗi (login-form đã làm đúng — copy pattern).
- **Modify:** form controls (textarea/date/chip groups) — thêm `<label>`/`aria-label`/`fieldset`.
- **Modify:** `components/roster/empty-roster.tsx`, feed/timeline empties — value-prop + CTA "thêm NV đầu tiên".
- **Modify:** `lib/data/feed-client.ts` (`fetchFeedFiltered` thêm `.range`), `lib/data/profile-client.ts` (phân trang timeline) — theo pattern `lib/cache/registry.ts`.
- **Migration:** index `pg_trgm` GIN trên `entries.content` nếu giữ search.
- **Modify:** `app/manifest.ts` + bộ icon (192/512/maskable/apple-touch 180); hợp nhất nguồn icon.
- **Modify:** focus style brand (globals.css `--color-brand` token; bỏ literal `#3f8f6b` rải rác).
- **Modify:** `app/(app)/actions/*`, `quick-add` — length cap content (≤5000), name/role (≤200).

## Implementation steps
1. `contrast-color.ts` → áp cho sentiment chip/sparkline/badge.
2. A11y quick-add: dialog label + focus return + aria-live lỗi; gắn label cho mọi control.
3. Empty states: onboarding nhẹ + CTA.
4. Phân trang feed-filter + profile timeline; thêm trigram index nếu cần.
5. Icon PWA branded + maskable; hợp nhất manifest/file-convention.
6. Token màu brand; focus ring thiết kế cho nút chính.
7. Length cap (client + DB CHECK).
8. Map lỗi Supabase thô → tiếng Việt thân thiện.

## Todo
- [ ] Contrast-aware sentiment colors
- [ ] A11y quick-add (label/focus/aria-live)
- [ ] Empty states + onboarding nhẹ
- [ ] Phân trang feed + profile (+ trigram index)
- [ ] Icon PWA + manifest consolidation
- [ ] Brand color token + focus ring
- [ ] Length caps + friendly errors

## Success criteria
- Chữ sentiment luôn đọc được dù user chọn màu nhạt.
- Quick-add dùng được bằng bàn phím/screen reader.
- Feed/profile không kéo hàng nghìn dòng; mượt với data nhiều năm.
- Icon hiện đẹp khi "Add to Home Screen". `build`/`lint`/test pass.

## Security
- Length cap chống blob/DoS quota. Không hiện message Supabase thô (lộ chi tiết nội bộ).

## Unresolved questions
- Có làm offline (service worker) ở MVP không? (spec hoãn — để post-launch).

---
title: "Team Tracker — Comprehension UX (sentiment trend chip + onboarding guide)"
description: "Make the product self-explanatory: a plain-language sentiment TREND CHIP that surfaces the sparkline's payoff, plus an onboarding guide page + first-run nudge. Root problem (user feedback): 'không hiểu để làm gì'."
status: planned
created: 2026-06-23
depends_on: MVP + Phase 2 + Calendar (complete)
---

# Comprehension UX Plan

User feedback: the sentiment ("mức cảm nhận") feature is **not user-friendly — they don't
understand what it's for**. Diagnosis (chosen by user = framing A): the *concept is fine*, but
the app never makes the **payoff visible**, and sentiment is optional → often empty → sparkline
looks useless → feels pointless. Two complementary fixes:

- **Part A — make the per-feature payoff visible** (sentiment trend chip).
- **Part B — make the whole-product purpose visible** (onboarding guide + first-run nudge).

NOT doing: a model rewrite, making sentiment required (spec prizes quick capture), or per-note
sentiment → periodic-pulse (that was framing C, user picked A).

---

## Part A — Sentiment trend chip (level-based)

Turn the abstract colored sparkline into a **plain-language read-out** so the purpose is
self-evident.

### Decisions (locked via grill)
- **Level, not direction** — chip reflects *recent mood level*, reusing the existing cooling
  definition so there's ONE notion of "nguội", not two. (User chose Level.)
- **Window/threshold:** last ≤5 sentiment-bearing entries, need ≥2. avg polarity (`weight`)
  `> 0` → "Gần đây tích cực ↑", `== 0` → "Bình thường →", `< 0` → "Đang nguội ↓".
  `cool` (avg < 0) stays aligned with `nudges.ts` cooling — single source of truth.
- **Shown on:** Roster card + Profile header (next to the sparkline).
- **Insufficient data (<2):** hide chip; show invite "Ghi cảm nhận để thấy xu hướng" where the
  sparkline would be (breaks the "empty → useless" cycle).
- **Capture reframe (quick-add):** label "Cảm nhận" → "Buổi này thế nào?" + sub-line tying it
  to the trend.
- **Chip colors:** semantic chrome (green / zinc / red) for stability regardless of config.

### Steps (build → lint+build → verify → commit)
| # | Step | Key files |
|---|------|-----------|
| A1 | Pure util: 3-state trend from recent weights (cool aligned w/ cooling) + unit tests | `lib/utils/sentiment-trend.ts`, `tests/unit/sentiment-trend.test.ts` |
| A2 | `SentimentTrendChip` component (semantic colors, hidden when insufficient) | `components/sentiment/sentiment-trend-chip.tsx` |
| A3 | Show chip on Roster card + Profile header; wire recent-weights data | `components/roster/*`, `components/profile/*`, `lib/data/employees.ts` (reuse nudge data) |
| A4 | Empty sparkline → invite line | wherever the sparkline renders |
| A5 | Quick-add reframe: "Buổi này thế nào?" + sub-line | `components/quick-add/quick-add-sheet.tsx` |

> Note: `lib/utils/nudges.ts` already computes recent sentiment weights for cooling — A1 should
> share that window/data, not re-query. Confirm `EmployeeCard` already carries what the chip needs
> (it has `sentimentColors`; may need the weights too).

---

## Part B — Onboarding guide + first-run nudge

Make the *whole product* legible: what problem it solves, how it works, the value.

### Decisions (locked via grill)
- **Form:** a permanent **Hướng dẫn page** (re-readable anytime) + a **first-run banner**.
  NOT a nav tab (bottom nav already full: 4 tabs + FAB), NOT an interactive coachmark tour.
- **Entry point:** link in the **Account menu** (`app-nav` Tài khoản popover) → `/guide`;
  also a link from Settings.
- **First-run nudge:** dismissible banner on Roster (reuse the daily-reminder banner pattern),
  tracked in **localStorage** (no DB/migration), linking to `/guide`.

### Guide content (Vietnamese, static)
1. **Vấn đề nó giải quyết** — chống recency-bias; chuẩn bị 1:1 & viết review công bằng.
2. **Mô hình cốt lõi** — timeline append-only vs "nhận định hiện tại" sửa đè; 1 bảng / 2 trục
   (Profile theo người · Feed/Lịch theo thời gian).
3. **Mức cảm nhận → sparkline → chip xu hướng** — vì sao gắn cảm nhận, payoff là gì.
4. **Loại, tag, nudges** — lọc nhanh; "lâu chưa 1:1" / "đang nguội".
5. **Quyền riêng tư** — single-user, RLS, chỉ mình bạn thấy.
6. **Bắt đầu nhanh** — nút + ghi 1 quan sát cụ thể.

### Steps
| # | Step | Key files |
|---|------|-----------|
| B1 | `/guide` route + page (static content, sections above) | `app/(app)/guide/page.tsx`, `components/guide/*` |
| B2 | Account-menu link + Settings link → /guide | `components/nav/app-nav.tsx`, `components/settings/*` |
| B3 | First-run banner on Roster (localStorage-tracked, dismissible) | `components/roster/onboarding-banner.tsx`, roster page |

---

## Cross-cutting
- Files < 200 LOC; kebab-case; mobile-first. Reuse existing patterns (daily-reminder banner,
  nudge data, sparkline). No DB migration. No new RLS surface (guide is static; banner state in
  localStorage).
- Honor invariants: sentiment color still from data on the sparkline (chip uses semantic chrome,
  which is fine — it's a derived indicator, not a sentiment swatch).
- Gates: lint + build + unit. Then adversarial multi-agent review (like the calendar).

## Open follow-ups (not here)
- Configurable entry "loại" (type) — separately decided "label-only full config", PAUSED; big
  migration on remote prod data. Revisit after this.

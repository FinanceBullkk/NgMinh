# Phase 07 — Configurable Sentiment + Sparkline Component

## Context Links
- Spec: `/team-tracker-spec.md` §6 (configurable sentiment — manager chose this), §8 (sparkline signature), §7.1/§7.2 (where sparkline shows)
- Overview: `plan.md` · Depends on: Phase 3, 4, 5

## Overview
- **Priority:** P1 (signature feature + the only configurable taxonomy in MVP)
- **Status:** pending
- **Description:** Sentiment management UI (CRUD + reorder + archive-not-delete) and the hand-rendered SVG sparkline (colored dots per entry over time) used on Roster cards and Profile header. Sentiment color drives sparkline color.

## Key Insights
- **No hardcoded sentiment levels** (spec §6). Defaults (3) are seeded per-user in Phase 2; this phase lets the manager add/edit/reorder/archive them.
- **Archive, never hard-delete** an in-use option (spec §6 edge case): keep color for old entries. FK ON DELETE RESTRICT (Phase 2) blocks hard delete; UI offers "archive" → `is_archived = true`, hidden from pickers but still colors history.
- **Sparkline = SVG by hand, NO chart library** (spec §8). One small reusable component: input = ordered list of `{date, color}`; output = a row of colored dots/line. Lightweight, deterministic, server-safe (pure SVG, can render in RSC).
- Sparkline shows trend "ấm dần hay nguội đi" — order by entry_date ascending, recent on right. Cap to last N (e.g., 20-30) for card; profile header can show more.
- Color must come from the entry's sentiment_options.color (joined), including archived ones — never re-map by current config.
- This phase retroactively replaces the `sparkline-slot` placeholders from Phase 4/5 with the real component, and confirms sentiment-button-rows (Phase 5) read live config.

## Requirements
**Functional**
- Settings sub-section: list sentiment options (label, color swatch, order), add, edit (label/color), reorder (order_index), archive (with confirm if in use), unarchive.
- Sparkline renders colored dots per entry over time on Roster card + Profile header. Empty state when no entries.

**Non-functional**
- Sparkline pure/lightweight (no deps), accessible (title/aria summary). Files < 200 LOC.
- At least one active (non-archived) option must always exist (guard).

## Architecture
**Sparkline**
- `components/sparkline/sentiment-sparkline.tsx` — props: `points: {date: string; color: string}[]`, `width?`, `height?`. Pure SVG: equally spaced dots (optionally a faint connecting baseline). No state.
- Replaces `sparkline-slot.tsx` usage in employee-card + profile-header.
- `lib/utils/sparkline-points.ts` — maps employee entries (+ joined sentiment color, incl. archived) → ordered points, capped to N.

**Sentiment config**
- `components/settings/sentiment-manager.tsx` (client) — list + add/edit/reorder/archive.
- `components/settings/sentiment-row.tsx`, `sentiment-form.tsx` (label + color input, hex validation).
- Server Actions `app/(app)/actions/sentiment.ts`: `createSentiment`, `updateSentiment`, `reorderSentiment(ids[])`, `archiveSentiment(id)`, `unarchiveSentiment(id)`.
- DAL `lib/data/sentiment.ts`: `listSentimentOptions({includeArchived})`.

**Data flow:** entries already carry `sentiment_id`; DAL joins color (active OR archived) → sparkline-points → SVG. Config changes update sentiment_options; revalidate roster/profile/settings so colors propagate.

## Related Code Files
**Create**
- `components/sparkline/sentiment-sparkline.tsx`
- `lib/utils/sparkline-points.ts`
- `components/settings/sentiment-manager.tsx`, `sentiment-row.tsx`, `sentiment-form.tsx`
- `app/(app)/actions/sentiment.ts`
- `lib/utils/hex-color.ts` (validate/normalize hex)

**Modify**
- `components/roster/employee-card.tsx` (use real sparkline)
- `components/profile/profile-header.tsx` (use real sparkline)
- `components/sparkline/sparkline-slot.tsx` → delete or thin to wrap real component
- `lib/data/sentiment.ts` (includeArchived param)
- `lib/data/employees.ts` (ensure sparkline points include archived colors)
- Settings page (Phase 8 hosts `sentiment-manager`) — export component here, mount in Phase 8

**Delete:** `components/sparkline/sparkline-slot.tsx` (placeholder, if fully replaced)

## Implementation Steps
1. Build `sentiment-sparkline.tsx` pure SVG (dots evenly spaced, color per point, optional baseline, aria-label summary, empty state).
2. `sparkline-points` util: order entries by entry_date asc, cap N, map sentiment color (join handles archived).
3. Replace placeholder slot in employee-card + profile-header with real sparkline.
4. `hex-color` validation util.
5. DAL `listSentimentOptions({includeArchived})`.
6. `sentiment-manager` UI: list active+archived, add/edit (label+color picker), drag-or-arrow reorder, archive/unarchive.
7. Server Actions: create/update/reorder/archive/unarchive; guard "≥1 active" on archive; revalidate roster/profile/settings.
8. Confirm sentiment-button-row (Phase 5) reads live active options (colors).
9. Manual test: add new sentiment → appears in quick-add; archive in-use → hidden from picker, history keeps color; reorder reflects in button order + config; sparkline colors match.

## Todo List
- [ ] sentiment-sparkline SVG component (+ empty/aria)
- [ ] sparkline-points util (order/cap/archived colors)
- [ ] Wire real sparkline into roster card + profile header
- [ ] hex-color validation util
- [ ] DAL listSentimentOptions(includeArchived)
- [ ] sentiment-manager (add/edit/reorder/archive/unarchive)
- [ ] sentiment actions + "≥1 active" guard + revalidation
- [ ] Verify quick-add sentiment buttons use live config
- [ ] Manual test config↔sparkline↔history propagation

## Success Criteria
- Adding/editing a sentiment updates quick-add buttons and any new dots immediately.
- Archiving an in-use option removes it from pickers but old entries keep their color.
- Cannot archive the last active option (guard).
- Reorder changes both button order and config display order.
- Sparkline shows correct colored dots per entry over time on cards + profile; sensible empty state.
- No chart library dependency added.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Archived sentiment color lost in history | Med | High | Join sentiment incl. archived; never recolor by active config; FK RESTRICT |
| Archiving last option breaks quick-add | Med | High | Guard ≥1 active; sentiment_id nullable as fallback |
| Reorder race / inconsistent order_index | Low | Med | reorderSentiment writes full ordered id list atomically |
| Sparkline unreadable with many entries | Med | Low | Cap N, fixed dot size, recent-on-right; profile shows more than card |
| Invalid hex color crashes SVG | Low | Med | hex-color validate/normalize before save + at render |

## Security Considerations
- All sentiment config RLS-scoped (user_id); colors/labels are user data.
- No service-role needed.

## Next Steps
- Phase 8 mounts `sentiment-manager` in Settings and adds tags management + export/delete.

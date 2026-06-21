# Phase 04 — Roster + Employee CRUD + Tags + Search

## Context Links
- Spec: `/team-tracker-spec.md` §7.1 (Roster), §3 (MVP scope), §4 (employee/tag model)
- Overview: `plan.md` · Depends on: Phase 3

## Overview
- **Priority:** P1 (home screen / primary entry point)
- **Status:** ✅ done (2026-06-21)
- **Description:** Roster home: card grid per employee (name, role/team, closeness, current_take excerpt, sparkline slot), multi-select tag filter + search (matches name AND note content), add/edit/delete employee, tag management on employee.
- **Deviations:** plain Tailwind + native `<dialog>` (no shadcn — YAGNI); `window.confirm` for delete guard; tag editor lives in the **edit** dialog (create → then edit to tag); `sparkline-slot` renders minimal time-ordered dots now (richer component in Phase 7). Search hybrid as planned (name+tags client-side, content via debounced server action).
- **Verified (e2e vs running dev server):** authenticated render shows employee + tag; content `ilike` search finds employee; cleanup leaves empty roster. lint+build green.

## Key Insights
- Search must match BOTH employee name AND entry `content` (spec §3) — needs a query that unions name matches with employees having matching entries. Do server-side via Postgres `ilike` (DAL) to keep it simple; for MVP dataset (a manager's direct reports, tens of employees) no full-text index needed (YAGNI) — note as a Phase-2 scale item.
- Sparkline component is built in Phase 7; here render a placeholder slot fed by recent entry sentiments so wiring is ready.
- Tag filter is multi-select (AND or OR? spec implies filtering "by tag" — use OR/any-match for discoverability; documented). Tags are user-scoped, reused across employees (many-to-many via `employee_tags`).
- Closeness (1-5) shown on card; edited on Profile (Phase 5) — card is read-only display.
- Delete employee cascades entries/goals/tags (FK CASCADE from Phase 2) — confirm with a destructive-action confirm dialog.

## Requirements
**Functional**
- List employees as cards; empty state with "+ Nhân viên mới" CTA.
- Create employee (name required; role_title, team, start_date, closeness optional w/ default 3).
- Edit employee basic fields; delete with confirmation.
- Assign/remove tags on an employee; create new tag inline.
- Filter roster by selected tags (multi-select). Search box filters by name OR note content.

**Non-functional**
- Mobile-first responsive grid. Files < 200 LOC (split card, grid, filter-bar, forms).
- Search/filter feels instant (debounced; server query or client filter over loaded set — see Architecture).

## Architecture
**Rendering split**
- `app/(app)/page.tsx` — Server Component: fetch employees (with tags + last-N sentiment colors for sparkline) via DAL, pass to client list.
- `roster-grid.tsx` (client) — holds search/filter UI state; given full list + tag list.
- Search strategy: load roster set server-side; **name filter** client-side (instant). **Note-content search** triggers a server action/route returning employee ids whose entries match (debounced), merged into displayed set. Keeps common case (name) instant, content search correct.

**Components**
- `employee-card.tsx`, `tag-filter-bar.tsx`, `roster-search.tsx`, `employee-form-dialog.tsx`, `tag-editor.tsx`, `empty-roster.tsx`, sparkline placeholder slot.

**Server Actions** (`app/(app)/actions/employees.ts`, `.../tags.ts`)
- `createEmployee`, `updateEmployee`, `deleteEmployee`, `addTagToEmployee`, `removeTagFromEmployee`, `createTag`. Each: auth via server client (RLS), `revalidatePath('/')`.

**DAL additions** (`lib/data/employees.ts`, `tags.ts`)
- `listEmployeesWithMeta(userScopedSearch?)` returning card data incl. tags + recent sentiment colors.
- `searchEmployeeIdsByContent(q)` — ilike on entries.content.

**Data flow:** Server Component → DAL listEmployeesWithMeta → cards. Form submit → Server Action → DB (RLS) → revalidate → re-render.

## Related Code Files
**Create**
- `app/(app)/page.tsx` (Roster)
- `app/(app)/actions/employees.ts`, `app/(app)/actions/tags.ts`
- `components/roster/roster-grid.tsx`, `employee-card.tsx`, `tag-filter-bar.tsx`, `roster-search.tsx`, `empty-roster.tsx`
- `components/employee/employee-form-dialog.tsx`, `components/employee/tag-editor.tsx`
- `components/sparkline/sparkline-slot.tsx` (placeholder; real render in Phase 7)
- `lib/utils/closeness.ts` (label/clamp helper)

**Modify**
- `lib/data/employees.ts`, `lib/data/tags.ts` (add query fns)
- `lib/types/models.ts` (EmployeeCard type)

**Delete:** none

## Implementation Steps
1. DAL: `listEmployeesWithMeta` (join tags, fetch last ~20 entries' sentiment colors per employee for sparkline) + `searchEmployeeIdsByContent`.
2. Roster Server Component fetches + renders `roster-grid` with employees + all tags.
3. `employee-card`: name, role/team, closeness, current_take excerpt (truncate), sparkline-slot.
4. `tag-filter-bar` (multi-select chips) + `roster-search` (debounced input) → client-side name filter + server content search merge.
5. `employee-form-dialog` for create/edit (name required, closeness default 3, date picker for start_date).
6. `createEmployee`/`updateEmployee` Server Actions + revalidate.
7. `deleteEmployee` Server Action behind confirm dialog (warn cascade).
8. `tag-editor` on form: add/remove tags, create-new inline → `createTag`, `addTagToEmployee`, `removeTagFromEmployee`.
9. Empty state CTA. Wire "+ Nhân viên mới" floating button.
10. Manual test: CRUD, tag assign/filter, name+content search, mobile layout.

## Todo List
- [x] DAL listEmployeesWithMeta + searchEmployeeIdsByContent
- [x] Roster Server Component + grid
- [x] employee-card with sparkline slot
- [x] tag-filter-bar (multi-select) + debounced search (name + content)
- [x] employee-form-dialog (create/edit, native dialog)
- [x] create/update/delete employee actions (revalidatePath)
- [x] tag-editor (optimistic) + tag actions (create/add/remove)
- [x] Empty state + add CTA
- [x] Mobile-first responsive grid (1/2/3 cols)
- [x] e2e render + search test (authenticated)

## Success Criteria
- Create/edit/delete employee works and persists; list reflects changes without manual reload.
- Tag filter narrows roster; clearing restores full list.
- Searching a word present only in a note surfaces that employee; searching a name works too.
- Delete shows confirm + cascades (no orphan entries/goals).
- Grid usable on phone width.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Content search slow as entries grow | Low (MVP scale) | Med | ilike OK now; flag GIN/full-text for Phase 2 |
| N+1 fetching sentiments per card | Med | Med | Single query: fetch recent entries for all roster employees, group in JS |
| Accidental employee delete (data loss) | Med | High | Confirm dialog naming the employee; cascade documented |
| Tag explosion / duplicates | Low | Low | Unique(user_id,name); case-insensitive match on create |

## Security Considerations
- All queries through RLS-scoped server client — no cross-user leakage even if a bug passes a wrong id.
- Server Actions re-verify `getUser()`; never trust client-supplied user_id (column DEFAULT + WITH CHECK enforce).
- Confirm-on-delete to protect sensitive personnel data.

## Next Steps
- Phase 5 (Profile) is reached by clicking a card; reuses employee + tag actions.

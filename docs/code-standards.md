# Code Standards

> Seeded in Phase 1.

## Principles

- **YAGNI / KISS / DRY.** No speculative abstractions; AI features are out of MVP scope.
- Files **< 200 LOC** — split by concern (component / hook / server action / query).
- **kebab-case** for all `.ts` / `.tsx` files and folders (e.g. `employee-card.tsx`).
- TypeScript **strict**; no `any` without a written reason.

## Next.js / React

- App Router. Server Components by default; `"use client"` only when needed (state, events).
- **All mutations via Server Actions** — never write to Supabase from a Server Component render.
- Auth checks use Supabase `getUser()` (not `getSession()`) on the server.
- Co-locate route UI under `app/`; shared UI under `components/`; logic under `lib/`.

## Styling

- Tailwind v4, CSS-first config in `app/globals.css` (`@theme`). No `tailwind.config.js`.
- Mobile-first: quick-add is the most-used screen — design small-screen first.
- Sentiment colors come from data (per-user config), not CSS — CSS tokens are chrome only.

## Data / security

- Every table has `user_id`; RLS `FOR ALL` using `(select auth.uid()) = user_id`.
- `entries` append-only (no editing past content by default).
- Deleting an in-use sentiment option = archive, never hard-delete (don't break history).
- No secrets in `NEXT_PUBLIC_*`. `.env.local` is gitignored.

## Commits

- Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, …). No AI references.

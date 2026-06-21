# CLAUDE.md — Team Tracker

Project-specific guidance. The global `~/.claude/CLAUDE.md` still applies; this file
only adds what is specific to **this** repo. Keep it short — point to docs, don't duplicate them.

## What this is
Private, single-user **PWA**: one manager logs observations about their direct reports
over time, to prep 1:1s and write reviews **without recency bias**. Not a CRM, not
multi-user, no sharing. It is the manager's private notebook.

- **Spec (source of truth):** `team-tracker-spec.md`
- **Plan:** `plans/260621-0121-team-tracker-mvp/` (9 phases, MVP)
- **Docs:** `docs/system-architecture.md`, `docs/code-standards.md`

## Stack
Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 (CSS-first,
no `tailwind.config.js`) · Supabase (Postgres + Auth + RLS via `@supabase/ssr`) ·
PWA via native `app/manifest.ts` + `app/icon.png` conventions (no service worker in MVP).

## Commands
- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build; **must pass before a phase is "done"**
- `npm run lint` — ESLint; **must pass before a phase is "done"**
- Env: copy `.env.example` → `.env.local`, fill Supabase URL + publishable key (Phase 2+).

## Non-negotiable invariants (from spec — breaking these breaks the product)
1. **Append vs Revise.** `entries` is append-only (evidence over time — never edit past
   content). `employee.current_take` is overwrite-in-place. Two distinct behaviors; keep both.
2. **One table, two axes.** Query the single `entries` table by-person (Profile) and
   by-time (Feed). Do not fork it into separate tables.
3. **Configurable sentiment — never hardcoded.** Sentiment options live per-user in the DB
   (`label` + `color` + `order`). Ship 3 defaults, but UI + sparkline read from config.
   Deleting an in-use option = **archive**, not hard-delete (don't break history).
4. **RLS on every table.** Every table carries `user_id`; RLS `FOR ALL` using
   `(select auth.uid()) = user_id`. This is sensitive data about real people — treat it so.
5. **Writes via Server Actions only.** Never mutate Supabase from a Server Component
   render. Server-side auth checks use `getUser()` (not `getSession()`).
6. **No AI in MVP.** AI summarize / relationship-map are Phase 3, out of scope — do not
   design tech around them now.

## Conventions
- Files **< 200 LOC**; split by concern (component / hook / server action / query).
- **kebab-case** for all `.ts` / `.tsx` files and folders.
- **Mobile-first** — quick-add is the most-used screen.
- Sentiment colors come from **data**, not CSS. CSS tokens are chrome only.
- Full standards: `docs/code-standards.md`.

## Security
- Only the publishable/anon key goes in `NEXT_PUBLIC_*`. The `service_role` key never
  touches client env (it bypasses RLS).
- `.env.local` is gitignored. **Repo is public** — no real secrets in commits, ever.

## Git
- Conventional commits (`feat:` / `fix:` / `refactor:` / `test:` / `docs:`). No AI references.
- After each phase: update the phase status in `plans/260621-0121-team-tracker-mvp/` and
  any affected file in `docs/`.

## Current state
- Phases 1–5 ✅ done: scaffold + PWA · Supabase schema/RLS/seed (local-first via CLI) · auth (`@supabase/ssr`) + DAL · Roster · Profile (current_take auto-save, goals, append-only timeline, quick-add).
- Next: **Phase 6** — Feed (by-time view) + global quick-add with person picker.
- Notes: root middleware uses **`proxy.ts`** (Next 16 rename, not `middleware.ts`). Writes = Server Actions; reads = `lib/data/*`. Run `supabase start` before `npm run dev`. Regenerate types with `npm run gen:types` after migration changes.

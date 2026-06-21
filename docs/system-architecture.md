# System Architecture

> Seeded in Phase 1. Expanded as phases land.

## Overview

Private single-user PWA. One manager logs observations about direct reports.
Next.js (App Router) frontend + Supabase (Postgres/Auth/RLS) backend. No service
worker in MVP. All sensitive data scoped per user via Row-Level Security.

## Layers

| Layer | Tech | Notes |
|-------|------|-------|
| UI | Next.js 16 App Router, React 19, Tailwind v4 | Mobile-first; route groups `(auth)` / `(app)` planned |
| PWA | `app/manifest.ts` | Installable; no offline/SW in MVP |
| Data access | Supabase JS via `@supabase/ssr` | Browser + server clients (Phase 3) |
| Writes | Next.js Server Actions | Never write from Server Components |
| Backend | Supabase Postgres + Auth | RLS `FOR ALL` on every table by `user_id` |

## Core data model (see spec §4)

`EMPLOYEE` (1—N `ENTRY`, 1—N `GOAL`) · `SENTIMENT_OPTION` (per-user, configurable) ·
`TAG` (per-user, M—N with employee). Every table carries `user_id`.

Key invariant: **`entries` is append-only** (evidence over time); **`current_take`**
on `employee` is overwrite-in-place. Sentiment is configurable per user — never hardcoded.

## Phase status

- [x] Phase 1 — project + tooling + PWA scaffold
- [x] Phase 2 — Supabase schema + migrations + RLS + seed (6 migrations, smoke-tested)
- [x] Phase 3 — data/access layer + auth flow (`@supabase/ssr`, `proxy.ts`, login, DAL, e2e-verified)
- [x] Phase 4 — Roster: employee CRUD + tags + name/content search (Server Component + Server Actions)
- [x] Phase 5 — Profile: current_take auto-save, goals, append-only timeline + filters, shared quick-add
- [x] Phase 6 — Feed: by-time view, day grouping (Asia/Saigon), person/tag/type filters, load-older
- [ ] Phase 7–9 — see `plans/260621-0121-team-tracker-mvp/`

# Phase 01 — Project + Tooling + PWA Scaffold

## Context Links
- Spec: `/team-tracker-spec.md` §9 (tech), §11 (TL;DR)
- Research: `research/researcher-02-nextjs-pwa-setup.md`
- Overview: `plan.md`

## Overview
- **Priority:** P1 (foundation — everything blocks on this)
- **Status:** ✅ done (2026-06-21)
- **Description:** Scaffold Next.js 16 App Router + TS + Tailwind v4 project, env config, base layout, and installable PWA manifest. No business logic yet.
- **Deviation:** Pinned **Next.js 16.2.9 / React 19** (current stable) instead of Next 15 — research patterns (App Router, `manifest.ts`, `@supabase/ssr`, Server Actions, Tailwind v4) are version-stable across 15→16.

## Key Insights
- Native `app/manifest.ts` (metadata route) is enough for installability — NO service worker for MVP (KISS). Serwist is the documented upgrade path if offline is ever needed.
- iOS Safari has no install prompt; needs `apple-touch-icon` + `apple-mobile-web-app-capable` meta and a small in-app "how to install" hint (deferred to onboarding, not MVP-blocking).
- Mobile-first: quick-add is the most-used screen → design layout mobile-first from the start.
- Tailwind v4 uses CSS-first config (`@import "tailwindcss"` + `@theme`), no `tailwind.config.js` required.

## Requirements
**Functional**
- App boots, renders a base shell, is installable to home screen (Android + iOS).
- Env vars wired for Supabase URL + publishable key.

**Non-functional**
- TypeScript strict mode. ESLint runs clean. `npm run build` succeeds.
- Files < 200 LOC, kebab-case.

## Architecture
- App Router (`app/`), root layout holds `<html lang="vi">`, metadata (PWA meta tags), global styles, theme color.
- Route groups planned (not all created yet): `(auth)` for login, `(app)` for protected screens.
- `app/manifest.ts` returns the web manifest; static icons in `public/icons/`.
- `.env.local` (gitignored) + `.env.example` (committed) for the two public Supabase vars.

**Data flow:** none yet — static shell only.

## Related Code Files
**Create**
- `package.json`, `tsconfig.json`, `next.config.ts`, `.eslintrc`/`eslint.config.mjs`, `.gitignore`, `.env.example`
- `app/layout.tsx` — root layout + PWA/iOS meta
- `app/globals.css` — Tailwind v4 import + `@theme` tokens
- `app/page.tsx` — temporary placeholder (replaced in Phase 4)
- `app/manifest.ts` — web app manifest
- `public/icons/icon-192x192.png`, `public/icons/icon-512x512.png`, `public/icons/apple-touch-icon.png`
- `README.md` — setup/run instructions (root)
- `docs/system-architecture.md`, `docs/code-standards.md` — seed project docs

**Modify:** none
**Delete:** `team-tracker-spec.md` stays (reference); remove default Next.js boilerplate pages/styles.

## Implementation Steps
1. `npx create-next-app@latest` with: TypeScript, App Router, Tailwind, ESLint, `src/`=no, import alias `@/*`. Pin Next 15.
2. Verify Tailwind v4 setup in `globals.css` (`@import "tailwindcss"`); add base `@theme` color tokens (will hold sentiment defaults reference colors `#3F8F6B`/`#9AA0A6`/`#C45B4C` as CSS vars for non-data UI only).
3. Set `tsconfig.json` strict; confirm `@/*` alias.
4. Add `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (no values). Confirm `.env.local` in `.gitignore`.
5. Write `app/manifest.ts` (name "Team Tracker", short_name "Tracker", `display: standalone`, `start_url: /`, theme/background colors, 192+512 icons).
6. Add iOS meta in `app/layout.tsx` via Next `metadata` + `viewport` exports: `appleWebApp` (capable, statusBarStyle, title), `apple-touch-icon` link, `themeColor`.
7. Generate placeholder PNG icons (192/512/apple-touch, opaque squares — replace with real art later).
8. Replace `app/page.tsx` with minimal placeholder. Strip CRA-style boilerplate CSS.
9. Run `npm run lint && npm run build` — must pass.
10. Write root `README.md` (prereqs, env setup, `npm run dev`, Supabase note pointing to Phase 2). Seed `docs/system-architecture.md` + `docs/code-standards.md` stubs.

## Todo List
- [x] Scaffold Next.js 16 + TS + Tailwind v4 + ESLint
- [x] Configure tsconfig strict + `@/*` alias (create-next-app default — verified)
- [x] `.env.example` + verify `.gitignore` covers `.env*.local`
- [x] `app/manifest.ts` web manifest (renders at `/manifest.webmanifest`)
- [x] iOS/PWA meta in `app/layout.tsx` (`appleWebApp` + `themeColor` viewport + apple-touch-icon)
- [x] Placeholder icons (192/512 + 180 apple-touch, opaque RGB PNG)
- [x] Minimal `app/page.tsx`, strip boilerplate (removed marketing SVGs)
- [x] `npm run lint && npm run build` pass (both exit 0)
- [x] README + docs stubs (`system-architecture.md`, `code-standards.md`)
- [x] Pin `turbopack.root` to silence stray-lockfile root warning

> **Manual follow-up (needs a device, not automatable here):** verify Lighthouse "Installable" + actual Add-to-Home-Screen on Android Chrome & iOS Safari. Replace placeholder solid-green icons with real branding before launch.

### Post-review fixes (code-reviewer-260621-0141)
Review verdict: solid, no blockers. Resolved 2 minor findings:
- **M1/M2:** removed stock `app/favicon.ico` (Next.js triangle branding); switched to file-convention `app/icon.png` (32) + `app/apple-icon.png` (180) so the document-head favicon/apple-touch-icon have a single source. Dropped the now-redundant manual `icons` block in `layout.tsx`. Build routes now expose `/icon.png` + `/apple-icon.png`.
- Lowercased `themeColor` to `#3f8f6b` for consistency with manifest + globals.
- Re-verified: `npm run lint` + `npm run build` exit 0, no warnings.

## Success Criteria
- `npm run build` and `npm run lint` exit 0.
- Lighthouse "Installable" passes (manifest + icons valid) on a local HTTPS/preview.
- App installs to Android home screen and iOS via Share → Add to Home Screen, opens standalone.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tailwind v4 config drift (new CSS-first model) | Med | Low | Follow create-next-app default; keep `@theme` minimal |
| iOS not installable (missing meta) | Med | Med | Add apple-touch-icon + appleWebApp meta; verify on device |
| Placeholder icons rejected by PWA validator (transparency) | Low | Low | Use opaque square PNGs |

## Security Considerations
- Only the publishable (anon) key goes in `NEXT_PUBLIC_*`. Service-role key never added to client env. Document this in README.
- No secrets committed; `.env.local` gitignored.

## Next Steps
- Phase 2 (Supabase schema) can start once project boots — it is independent of UI but needs the repo + env scaffold from here.

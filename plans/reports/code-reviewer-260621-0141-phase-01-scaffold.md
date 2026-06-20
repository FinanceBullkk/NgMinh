# Code Review — Phase 1: Project + Tooling + PWA Scaffold

**Date:** 2026-06-21 · **Reviewer:** code-reviewer · **Scope:** Phase 1 scaffold/config only (no business logic)

## Summary Verdict

**Yes — Phase 1 is solid ("chuẩn chỉnh").** Build + lint both exit 0 clean (zero warnings), PWA manifest + iOS meta + opaque icons are correct, TS strict on, secrets handled properly. One real cleanliness defect (stock Next.js favicon left behind) + a few nits. No blockers, no majors.

---

## Build + Lint Results (verified)

| Check | Result |
|-------|--------|
| `npm run lint` | **exit 0**, no output (clean) |
| `npm run build` | **exit 0**, "Compiled successfully in 3.2s", TS checked, no warnings. Routes prerendered static: `/`, `/_not-found`, `/manifest.webmanifest` |

Both pass. Success criteria #1 met.

---

## Findings by Severity

### Blocker
None.

### Major
None.

### Minor

**M1 — Stock Next.js favicon left in repo (boilerplate not fully stripped).**
`app/favicon.ico` (25931 bytes, sha256 `2b8ad2d3…`) is the default create-next-app favicon = the **Next.js triangle logo**. Next App Router auto-serves `app/favicon.ico` as `<link rel="icon">`, so the app currently ships Next.js branding in the browser tab. The phase plan claims "strip boilerplate (removed marketing SVGs)" (todo line 70) — the SVGs are gone but this favicon was missed.
*Fix:* replace with a real (or neutral placeholder) favicon, or delete it for now since icons for PWA are already covered by `public/icons/*`. Pair with the deferred "replace placeholder icons with real branding" follow-up.

**M2 — `metadata.icons.icon` points at the 192×192 PWA icon as the favicon.**
`app/layout.tsx:20` sets `icon: "/icons/icon-192x192.png"`. Combined with M1, there are now two competing favicon sources (`app/favicon.ico` auto-injected + this 192px PNG). Browser behavior is order-dependent and surprising. Once M1's `favicon.ico` is resolved, keep a single deliberate favicon source. Not breaking, but tidy this so the tab icon is intentional.

### Nit

**N1 — Manifest missing `id` field.** `app/manifest.ts` has no `id`. Chrome derives `id` from `start_url` when absent (works fine), but an explicit `id: "/"` future-proofs install identity if `start_url` ever changes. Optional, recommended-only.

**N2 — `apple-touch-icon` is 180×180 but research suggested 192×192.** `public/icons/apple-touch-icon.png` is 180×180 (the iOS-canonical size — actually correct/standard). Research doc (researcher-02 §4) referenced a 192px apple icon and a filename `apple-touch-icon-192x192.png`; implementation sensibly used 180×180 named `apple-touch-icon.png` and the layout link matches. No defect — flagging only because it diverges from the research text. iOS will accept 180. Leave as-is.

**N3 — Geist fonts pulled from `next/font/google`.** `app/layout.tsx:2,5-6` loads Geist/Geist_Mono over the network at build. Fine and create-next-app default. If full offline/airgapped build determinism matters later, switch to `geist` npm package (self-hosted). Not a Phase-1 concern.

**N4 — No `package.json` `engines` field.** README states Node ≥20; not enforced. Optional `"engines": { "node": ">=20" }` would make the constraint machine-checkable. YAGNI-acceptable to skip.

---

## Checklist Assessment (per request)

1. **Build/lint health** — PASS. Both exit 0, zero warnings. (output above)
2. **PWA correctness** — PASS. Manifest has `name`, `short_name` ("Tracker"), `display: standalone`, `start_url: "/"`, 192+512 icons (`purpose: any`), `theme_color`/`background_color`, `lang: vi`, `description` (`app/manifest.ts:6-30`). iOS: `appleWebApp.capable:true` + `statusBarStyle` + `title` (`layout.tsx:14-18`), `apple` icon link (`layout.tsx:21`), `themeColor` correctly in **viewport** export not metadata (`layout.tsx:27`). Icons verified **opaque RGB** (`hasAlpha: no`) at 192/512/180. All good.
3. **TypeScript config** — PASS. `strict: true` (`tsconfig.json:7`), `@/*` → `./*` alias (`tsconfig.json:21-23`), no loosened flags. `allowJs`/`skipLibCheck` are create-next-app defaults, acceptable.
4. **Security** — PASS. `.env.example` has only the two `NEXT_PUBLIC_*` public vars with empty values + an explicit warning against putting `service_role` in `NEXT_PUBLIC_*` (`.env.example:7-8`). `.gitignore` covers `/node_modules`, `/.next/`, `.env` + `.env*.local` (`.gitignore:2,11,28-29`). No secrets committed. README repeats the service-role warning (`README.md:39`).
5. **Conventions vs code-standards.md** — PASS. kebab-case files, all files <200 LOC (largest source = layout.tsx ~44 lines), descriptive comments present (manifest, next.config, globals.css all explain *why*), mobile-first intent (`max-w-sm`, `text-sm`, flex column shell). `lang="vi"` set (`layout.tsx:38`).
6. **Cleanliness** — MOSTLY PASS. No references to `next.svg`/`vercel.svg`/`globe.svg` etc. (grep clean), `page.tsx` references no deleted assets, no dead imports. **Exception: M1** stock favicon.ico remains.
7. **Consistency** — PASS with one casing nit. `#3F8F6B` consistent across: layout viewport `themeColor` (`#3F8F6B`), manifest `theme_color` (`#3f8f6b`), globals.css `--sentiment-positive` (`#3f8f6b`). Values identical; **casing differs** (uppercase in layout vs lowercase in manifest/css) — cosmetic only, hex is case-insensitive. Sentiment tokens correctly commented as "chrome only, not data source of truth" per code-standards §Styling.
8. **Anything missed vs plan** — Route groups `(auth)`/`(app)` not yet created: **correctly deferred** (plan line 31 + arch doc say "planned", explicitly not Phase 1 scope). No `lib/`, `components/` dirs yet — fine, nothing to put there. `next.config.ts` `turbopack.root` pin validated (build ran clean, no stray-lockfile warning). All Related Code Files (plan lines 38-46) present and accounted for.

---

## Positive Observations

- `.env.example` security comment is genuinely good — explains *why* service_role must never be public (bypasses RLS, leaks all users' data). Not boilerplate.
- `globals.css` sentiment tokens carry a comment clarifying they're chrome-only and DB is the source of truth — prevents a future dev from hardcoding sentiment from CSS (directly enforces code-standards §Styling).
- `themeColor` correctly placed in `viewport` export, not `metadata` — a common Next.js 14+ mistake avoided.
- Icons verified opaque (no alpha) — pre-empts the iOS transparency glitch called out in research §4/§5.
- `manifest.ts` and `next.config.ts` comments explain rationale (no SW for MVP; root pin for stray lockfile), aiding Phase 2+ devs.

---

## Will it bite Phase 2/3?

No structural traps. Notes:
- DB access layer / `@supabase/ssr` clients not present yet — expected (arch doc marks Phase 3). Phase 2 (schema) is independent and unblocked.
- `entries` append-only + RLS `FOR ALL` invariants are documented in both `code-standards.md` and `system-architecture.md` — good guardrails seeded for Phase 2.

---

## (a) Build + Lint Confirmation

Confirmed: `npm run lint` exit **0** (clean), `npm run build` exit **0** ("Compiled successfully", TS passed, 5 static pages, zero warnings). Node v22.22.3.

## (b) Unresolved Questions

1. Is the stock `app/favicon.ico` (Next.js logo) intentional as a temporary placeholder, or an oversight? Recommend removing/replacing (M1) — currently ships Next.js branding in the tab.
2. Real app icons/branding are a known deferred follow-up (plan line 75). Confirm this is tracked before launch.
3. Hex casing for `#3F8F6B` — standardize to one case across files (nit), or leave? Harmless either way.

## (c) Status

**Status:** DONE_WITH_CONCERNS
**Summary:** Phase 1 scaffold is solid — build/lint green, PWA + iOS meta + opaque icons correct, secrets handled well, strict TS, conventions followed. Only minor cleanup outstanding (stock Next.js favicon left behind, dual favicon sources).
**Concerns:** M1 (stock favicon.ico ships Next.js branding) + M2 (two competing favicon sources). Both minor, non-blocking, fixable in <5 min. No blockers/majors.

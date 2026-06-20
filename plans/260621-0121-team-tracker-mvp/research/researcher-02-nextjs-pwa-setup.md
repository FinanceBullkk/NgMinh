# Next.js 15 PWA Setup Research — 2026

## Summary
For a personal mobile-first app, **use Next.js native manifest support (app/manifest.ts) without a service worker for MVP**. Service workers are NOT required for "Add to Home Screen" installability; manifest + HTTPS are sufficient. Add service worker (Serwist) only if offline functionality needed.

---

## 1. Approach Recommendation: Native Manifest vs Service Worker Framework

| Feature | Native `app/manifest.ts` | Serwist | next-pwa |
|---------|--------------------------|---------|----------|
| **KISS** | ✓ Zero deps | ✗ Adds framework | ✗ Legacy, deprecated |
| **Installability** | ✓ Full support | ✓ Full support | ✓ Full support |
| **Offline** | ✗ Not supported | ✓ Built-in | ✓ Built-in |
| **Maintenance** | ✓ Official Next.js | ✓ Active (2026) | ✗ Forked, not maintained |
| **Complexity** | Low | Medium | Medium |
| **Mobile-first** | ✓ Sufficient | Overkill for MVP | Overkill for MVP |

### Recommendation
**For MVP (no offline needed):** Use native `app/manifest.ts` only — no service worker.

**For offline support later:** Migrate to **Serwist** (`@serwist/next`) — it's the modern successor to next-pwa, actively maintained, and integrates cleanly with App Router.

**Avoid:** next-pwa and @ducanh2912/next-pwa — original is unmaintained; fork has no active development advantage.

---

## 2. app/manifest.ts Setup (MVP)

### Minimal Shape

```typescript
// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Team Tracker',
    short_name: 'Tracker',
    description: 'Personal task management app',
    start_url: '/',
    display: 'standalone',                    // Hides browser UI
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
```

### Next.js Auto-Linking
- No manual meta tag needed in `layout.tsx` — Next.js 15+ automatically injects `<link rel="manifest" href="/manifest.webmanifest">`.
- Manifest is cached by default (fast, no request-time overhead).

### Required Fields for Installability
- `name`, `short_name`, `display: 'standalone'` — **mandatory**
- `icons` — at least **192x192** and **512x512** (PNG, square)
- `start_url` — typically `'/'`
- `background_color`, `theme_color` — optional but recommended for UX

---

## 3. Service Worker: Required for Installability?

### **NO** — Service worker NOT required for "Add to Home Screen"

**Install triggers (manifest + HTTPS only):**
- Desktop Chrome/Edge: automatic prompt after 2 visits + 5 min apart
- Android Chrome: manual Share → "Add to Home Screen"
- iOS Safari: manual Share → "Add to Home Screen"

**Service worker needed ONLY for:**
- Offline caching
- Background sync
- Push notifications
- Fetch event interception

### Minimal Offline Strategy (if adding later)
Use **Serwist** with minimal config:
```typescript
// next.config.ts
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: [],
})

export default withSerwist({
  // your next.config
})
```

```typescript
// app/sw.ts
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry } from '@serwist/precaching'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends Serwist.SerwistGlobalScope {}
}
globalThis.addEventListener('install', () => globalThis.skipWaiting())
globalThis.addEventListener('activate', () => globalThis.clients.claim())

const serwist = new Serwist({
  precacheEntries: (self.__SW_MANIFEST as PrecacheEntry[] | undefined) ?? [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

---

## 4. Icon Requirements + Apple-Touch-Icon for iOS

### Manifest Icons (Android + Web)
- **192x192** — home screen, app drawer
- **512x512** — splash screen, bookmarks

Format: PNG, square, opaque background.

### iOS-Specific Meta Tags (Required for Home Screen)
Add to `app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  // ... other metadata
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Team Tracker',
  },
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/icons/apple-touch-icon-192x192.png',
      sizes: '192x192',
    },
  ],
}
```

Or direct HTML (fallback):
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Team Tracker">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-192x192.png" sizes="192x192">
```

### Apple Icon Details
- **Must be 192x192 or larger** (iOS scales down)
- **PNG format only** — no transparency
- **Served over HTTPS** — iOS won't load on HTTP
- Avoid corners/rounded edges — iOS auto-rounds

---

## 5. iOS Safari PWA Pitfalls

| Pitfall | Impact | Fix |
|---------|--------|-----|
| No `beforeinstallprompt` event | Users can't auto-trigger install | Manual: Share → Add to Home Screen only |
| HTTP (not HTTPS) | App won't install | Use HTTPS in production |
| Missing `apple-mobile-web-app-capable` | No full-screen mode | Add meta tag in layout |
| PNG with transparency | Visual glitch on home screen | Opaque background required |
| Icon < 192×192 | Blurry home screen icon | Use 192×192 min, 512×512 better |
| Wrong `status-bar-style` | Battery/time unreadable | Use `black-translucent` or `black` |
| Service worker + iOS 15 bug | Crashes on first install | iOS 16.4+ required for SW support |
| No `start_url` | Opens browser instead of app | Include `start_url: '/'` in manifest |

### iOS Install Flow (User-Driven)
1. User visits app in Safari
2. Tap **Share** (bottom toolbar)
3. Scroll → "Add to Home Screen"
4. Confirm app name + icon preview
5. Tap "Add"

**No automatic prompt** — user must manually discover.

---

## Implementation Checklist (MVP)

- [ ] Create `app/manifest.ts` with 192×192 + 512×512 icons
- [ ] Generate icons via [realfavicongenerator.net](https://realfavicongenerator.net/)
- [ ] Add apple-touch-icon meta tags to `app/layout.tsx`
- [ ] Serve app over HTTPS (production requirement)
- [ ] Test on Android Chrome: Share → "Add to Home Screen"
- [ ] Test on iOS Safari: Share → "Add to Home Screen"
- [ ] Verify `display: 'standalone'` removes browser UI
- [ ] **Skip service worker for MVP** — add later if offline needed

---

## Sources

- [Next.js PWA Guide — Official](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Next.js manifest.ts API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest)
- [Serwist @serwist/next Documentation](https://serwist.pages.dev/docs/next/getting-started)
- [Serwist Next.js Integration Guide](https://serwist.pages.dev/docs/next)
- [PWA iOS Limitations 2026 — MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [How to Enable PWA on iOS 2026 — TechRadar](https://techradar.info/how-to-enable-pwa-on-ios-the-complete-2026-progressive-web-app-guide)
- [Serwist vs next-pwa Comparison — Medium 2026](https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7)
- [Next.js 15 PWA Complete Setup — DEV Community](https://dev.to/rakibcloud/progressive-web-app-pwa-setup-guide-for-nextjs-15-complete-step-by-step-walkthrough-2b85)
- [PWA Installability Requirements 2026 — Simicart](https://simicart.com/blog/pwa-add-to-home-screen/)

---

## Unresolved Questions

- **Push notifications:** Do we want them? (Requires service worker + backend setup)
- **Offline mode:** Core feature or post-launch?
- **Icon design:** Do we have finalized app branding/colors?

**Status:** DONE

**Summary:** Native `app/manifest.ts` is sufficient for MVP installability. Skip service worker unless offline/push required. Add Serwist later if roadmap includes offline.

**Concerns:** iOS PWA install UX is manual (no auto-prompt) — plan user education in onboarding if visibility is critical.

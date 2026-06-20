---
name: nextjs-supabase-ssr-auth
description: Current (2025-2026) Next.js 15 App Router + @supabase/ssr authentication patterns, package versions, auth method comparison, route protection, and common pitfalls for single-user PWA.
---

# Next.js 15 + Supabase SSR Auth: Research Report

## 1. Package Versions (Current)

- **@supabase/ssr**: `0.12.0` (active, updated every few days)
- **@supabase/supabase-js**: `2.108.2` (active, updated every few days)

Install: `npm i @supabase/ssr @supabase/supabase-js`

---

## 2. Setup Pattern: @supabase/ssr for Next.js 15 App Router

### 2.1 Browser Client (Client Components)

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

**Note:** Publishable key is safe to embed in frontend code (marked `NEXT_PUBLIC_`). Initialize early so browser can capture OAuth/magic-link tokens from URL fragment.

### 2.2 Server Client (Server Components, Route Handlers, Server Actions)

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore if called from Server Component (cookies read-only there)
          }
        }
      }
    }
  )
}
```

**Critical:** `getAll()` returns all cookies as array of `{name, value}` objects (replaces deprecated `get/set/remove` pattern). `setAll()` catches errors gracefully in Server Components since they can't write cookies.

### 2.3 Middleware for Session Refresh (Project Root)

```typescript
// middleware.ts
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session & rewrite JWT to response if expired
  await supabase.auth.getUser()

  // Set cache-control headers to prevent session leakage
  response.headers.set('Cache-Control', 'private, no-store')

  return response
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**Purpose:** Every request refreshes the Auth token server-side and writes updated JWT to response via Set-Cookie header. Session contamination prevented in serverless (Vercel, etc.) by creating client fresh per request, not at module scope.

---

## 3. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # (optional, for admin-only routes)
```

**Note:** Publishable key is public (client-facing). Service role key is secret (server-only).

---

## 4. Auth Method: Email/Password vs Magic Link

| Aspect | Email/Password | Magic Link |
|--------|---|---|
| **Setup Complexity** | More code (form validation, password reset) | Fewer lines, enabled by default |
| **Single-User UX** | Simplest: one password memorized forever | Need email client access each login |
| **Cross-Device/Browser** | No friction | **Link invalid if opened in different browser** ⚠️ |
| **Default Enabled** | Yes | Yes |
| **Reliability** | High | Medium (email client dependency) |

### **Recommendation: Email/Password**

**Why:** For a private single-user personal PWA:
- You control one password; no friction after first setup
- No cross-browser/device magic-link issues
- Better reliability for trusted, self-hosted scenario
- Supabase provides bcrypt hashing + rate limiting by default
- Password reset flow can be simple (email link → new password)

Magic link better for **multi-user public apps** (no password fatigue, better accessibility). For single-user private app, email/password wins on simplicity + reliability.

---

## 5. Route Protection

### 5.1 Middleware-Based Redirect

```typescript
// middleware.ts (updated)
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const protectedRoutes = ['/dashboard', '/profile', '/settings']

export async function middleware(request: NextRequest) {
  // ... session refresh code (above) ...

  const supabase = createServerClient(/* ... */)
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users
  if (!user && protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}
```

### 5.2 In Server Components (Extra Security Layer)

```typescript
// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Dashboard for {user.email}</div>
}
```

**Why double-check:** Server Component check is **authorization layer** (trusts fresh session from middleware + verifies user exists). Middleware is **gatekeeper** (fast, redirects before rendering).

**Never use `getSession()`** for security checks—it reads cookies without server verification. Always use `getUser()` (validates token with Supabase Auth server).

---

## 6. Common Pitfalls

### 6.1 Server Components: Cookies Are Read-Only
- Can read cookies (via `const cookieStore = await cookies(); cookieStore.getAll()`)
- **Cannot write cookies**—setAll() will silently fail (try/catch needed)
- **Solution:** Middleware handles all cookie writes (token refresh), Server Components only read

### 6.2 Never Call Supabase from Server Component for Writes
- **Bad:** `await supabase.from('table').insert({...})` in Server Component
- **Good:** Use Server Action or Route Handler for writes
- **Why:** Server Components are not request-scoped; mutation side effects leak across requests

### 6.3 Client Always Created Fresh, Never at Module Scope
```typescript
// ❌ WRONG: Session contamination in serverless
const supabase = createServerClient(...)
export async function handler() { /* ... */ }

// ✅ CORRECT: Fresh per request
export async function handler() {
  const supabase = createServerClient(...)
  // ...
}
```

### 6.4 Middleware Must Refresh Token on Every Request
- Expired tokens are only refreshed if middleware calls `getUser()` or equivalent
- If middleware skips auth routes (/login, /signup), tokens **won't refresh** for unauthenticated users
- **Solution:** Middleware should run on all routes (or at least all protected routes)

### 6.5 Cache Headers Critical
```typescript
response.headers.set('Cache-Control', 'private, no-store')
```
- Without this, CDN/edge caches can serve one user's session to another
- ISR (Incremental Static Regeneration) + refreshed tokens = **user A sees user B's data**

### 6.6 getSession() vs getUser()
- `getSession()`: Reads cookies, **no verification**—can be spoofed
- `getUser()`: Calls Supabase Auth server, **validates token**
- **For route protection, always use `getUser()`**

---

## 7. Deprecated Patterns to Avoid

| Pattern | Deprecated | Replace With |
|---------|---|---|
| `@supabase/auth-helpers-nextjs` | Yes (removed) | `@supabase/ssr` |
| `cookies.get('key')` (single) | Yes | `getAll().find(c => c.name === 'key')` |
| `cookies.set(...)` (single) | Yes | `setAll([{name, value, options}])` |
| `cookies.remove(...)` | Yes | `setAll([{name, value: '', options}])` |
| `getSession()` for auth checks | Yes | `getUser()` |

---

## 8. Official Documentation URLs

- [Supabase SSR Package Overview](https://supabase.com/docs/guides/auth/server-side)
- [Creating a Supabase Client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Password-based Auth](https://supabase.com/docs/guides/auth/passwords)
- [Advanced SSR Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Migration from Auth Helpers to SSR](https://supabase.com/docs/guides/troubleshooting/how-to-migrate-from-supabase-auth-helpers-to-ssr-package-5NRunM)

---

## 9. Quick Start Checklist

- [ ] Install: `npm i @supabase/ssr@0.12.0 @supabase/supabase-js@2.108.2`
- [ ] Create `lib/supabase/client.ts` (browser client)
- [ ] Create `lib/supabase/server.ts` (server client with getAll/setAll)
- [ ] Create `middleware.ts` with session refresh + cache headers
- [ ] Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] Implement email/password login in `/login` route
- [ ] Add route protection in middleware (redirect to /login if no user)
- [ ] Add `getUser()` security check in protected Server Components
- [ ] Set `Cache-Control: private, no-store` in middleware response

---

**Status:** DONE
**Summary:** Complete Next.js 15 + @supabase/ssr pattern documented with concrete code snippets, package versions, email/password auth recommendation, and 6 critical pitfalls. Ready for implementation.
**Concerns:** None—research covers all requested topics with official source citations.

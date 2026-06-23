import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";
import { buildCsp, staticSecurityHeaders } from "@/lib/security/headers";

// Routes reachable without a session. `/auth/callback` completes OAuth before a session exists.
const PUBLIC_PATHS = ["/login", "/auth/callback"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Refreshes the auth token on every request, mirrors cookies, enforces redirects, and stamps
// browser security headers (CSP + HSTS/frame/nosniff/referrer/permissions) (audit M1).
export async function updateSession(request: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  // Secure cookies follow the actual scheme (HTTPS on Vercel via x-forwarded-proto), so a local
  // HTTP prod build does not silently drop the auth cookie.
  const isHttps =
    request.headers.get("x-forwarded-proto") === "https" ||
    request.nextUrl.protocol === "https:";
  const csp = buildCsp(process.env.NEXT_PUBLIC_SUPABASE_URL!, !isProd);

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      // Secure auth cookies over HTTPS only (audit M1) — see isHttps above.
      cookieOptions: { secure: isHttps },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Apply all security headers to whichever response we end up returning.
  const harden = (res: NextResponse) => {
    res.headers.set("Content-Security-Policy", csp);
    // HSTS only over real HTTPS (browsers ignore it on HTTP anyway).
    for (const [k, v] of Object.entries(staticSecurityHeaders(isHttps))) res.headers.set(k, v);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  };

  // getUser() refreshes the token AND verifies it with the auth server (never getSession).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Build a redirect that preserves any refreshed auth cookies + security headers.
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return harden(res);
  };

  if (!user && !isPublic(pathname)) return redirectTo("/login");
  if (user && pathname === "/login") return redirectTo("/");

  return harden(supabaseResponse);
}

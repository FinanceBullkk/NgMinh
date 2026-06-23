import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

// Secure auth cookies in production (audit M1) — real deploys are HTTPS. The e2e harness runs a
// production build over plain local HTTP (E2E_BUILD=1), where a Secure cookie would be dropped by
// the browser, so it is excluded. (Middleware derives this from the request scheme directly.)
const SECURE_COOKIES =
  process.env.NODE_ENV === "production" && process.env.E2E_BUILD !== "1";

// Server client for Server Components (read) and Server Actions (read/write).
// Always created fresh per request — never at module scope (avoids session bleed).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: { secure: SECURE_COOKIES },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — cookies are read-only there.
            // The middleware refreshes the session cookie instead.
          }
        },
      },
    },
  );
}

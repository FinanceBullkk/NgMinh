"use client";

import { createClient } from "@/lib/supabase/client";

// Initiate Google OAuth from the BROWSER (not a server-action form): signInWithOAuth navigates via
// window.location, which CSP `form-action 'self'` does not govern (a server-action form would be
// blocked because the OAuth redirect target is cross-origin). The @supabase/ssr browser client
// stores the PKCE code_verifier in a cookie so the server `/auth/callback` route can complete the
// exchange. `reauth` forces a fresh Google login for step-up; `next` is the post-login landing path.
export async function startGoogleSignIn(opts?: { reauth?: boolean; next?: string }): Promise<void> {
  const supabase = createClient();
  const next = opts?.next ?? "/";
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: opts?.reauth ? { prompt: "login" } : undefined,
    },
  });
  // On success the call redirects the browser to Google automatically.
  if (error) window.location.href = "/login?error=oauth";
}

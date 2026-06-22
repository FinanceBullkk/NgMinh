"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/security/audit";

export type SignInState = { error: string } | null;

// Google OAuth is initiated client-side (see lib/auth/oauth-client.ts) so the cross-origin OAuth
// redirect is a top-level navigation, not a form submission blocked by CSP `form-action 'self'`.

// Email/password sign-in — retained for the automated test harness + local dev only. The
// production login UI renders Google only (see login-form.tsx); a Google-provisioned manager
// account has no password, so this path is inert in prod.
export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Nhập email và mật khẩu." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Audit M3: record the failed attempt (no password/token). Pre-auth → server log only.
    logServerEvent("login_failure", { emailDomain: email.split("@")[1] ?? "unknown" });
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  // redirect() throws to interrupt — must stay outside any try/catch.
  redirect("/");
}

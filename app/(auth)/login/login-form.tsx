"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "./actions";
import { startGoogleSignIn } from "@/lib/auth/oauth-client";

// Production shows Google only. The email/password form renders only when `showPasswordForm`
// (local dev + the e2e harness) — see login/page.tsx. The Google button label intentionally
// avoids the substring "Đăng nhập" so the e2e's email submit button stays unambiguous.
export function LoginForm({
  showPasswordForm,
  error,
}: {
  showPasswordForm: boolean;
  error?: string;
}) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, null);

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          Đăng nhập không thành công. Vui lòng thử lại.
        </p>
      )}

      <button
        type="button"
        onClick={() => startGoogleSignIn()}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        Tiếp tục với Google
      </button>

      {showPasswordForm && (
        <>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="h-px flex-1 bg-zinc-200" />
            hoặc
            <span className="h-px flex-1 bg-zinc-200" />
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="rounded-md border border-zinc-300 px-3 py-2 text-base"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Mật khẩu
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="rounded-md border border-zinc-300 px-3 py-2 text-base"
              />
            </label>

            {state?.error && (
              <p role="alert" className="text-sm text-red-600">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-[#3f8f6b] px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {pending ? "Đang vào…" : "Đăng nhập"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

import { LoginForm } from "./login-form";

// Email/password form is shown only in local dev + the e2e harness (E2E_BUILD); production is
// Google-only. searchParams.error is set by the OAuth callback on failure.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const showPasswordForm =
    process.env.NODE_ENV !== "production" || process.env.E2E_BUILD === "1";

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Team Tracker</h1>
        <p className="mb-6 text-sm text-zinc-500">Đăng nhập để tiếp tục.</p>
        <LoginForm showPasswordForm={showPasswordForm} error={error} />
      </div>
    </main>
  );
}

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Team Tracker</h1>
        <p className="mb-6 text-sm text-zinc-500">Sign in to continue.</p>
        <LoginForm />
      </div>
    </main>
  );
}

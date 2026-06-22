// Step-up recency check (audit H4, provider-agnostic / OAuth-compatible).
// A destructive action requires the user to have authenticated INTERACTIVELY within this window.
// Supabase updates `last_sign_in_at` only on a real sign-in (a new refresh token), NOT on silent
// token refresh — so a stolen/long-lived session cannot satisfy this without passing Google again.
export const STEP_UP_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

// Pure + unit-testable. `nowMs` injected so tests are deterministic.
export function isRecentlyAuthenticated(
  lastSignInAt: string | null | undefined,
  nowMs: number,
  maxAgeMs: number = STEP_UP_MAX_AGE_MS,
): boolean {
  if (!lastSignInAt) return false;
  const t = Date.parse(lastSignInAt);
  if (Number.isNaN(t)) return false;
  const age = nowMs - t;
  // Within the window, allowing small negative skew (clock drift between auth server and app).
  return age <= maxAgeMs && age >= -30_000;
}

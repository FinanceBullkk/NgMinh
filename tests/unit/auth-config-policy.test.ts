import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Audit H1/H5: guard the committed Supabase auth config so a future edit can't silently re-open
// public signup or weaken the password policy. (Hosted dashboard settings are verified separately.)
const config = readFileSync(
  fileURLToPath(new URL("../../supabase/config.toml", import.meta.url)),
  "utf8",
);

function value(key: string): string | undefined {
  // last occurrence wins (e.g. enable_signup appears under [auth] and [auth.email]).
  const matches = [...config.matchAll(new RegExp(`^\\s*${key}\\s*=\\s*(.+)$`, "gm"))];
  return matches.at(-1)?.[1]?.trim();
}

describe("supabase auth config policy", () => {
  it("disables public signup via the global flag (H1)", () => {
    // The GLOBAL [auth] enable_signup (GOTRUE_DISABLE_SIGNUP) is the lever that blocks public
    // signup. The [auth.email] flag must stay true — it maps to GOTRUE_EXTERNAL_EMAIL_ENABLED,
    // so flipping it would disable email LOGIN too.
    const signupLines = [...config.matchAll(/^\s*enable_signup\s*=\s*(\w+)/gm)].map((m) => m[1]);
    expect(signupLines[0]).toBe("false"); // global [auth]
  });

  it("requires a 12+ char password with composition (H5)", () => {
    expect(Number(value("minimum_password_length"))).toBeGreaterThanOrEqual(12);
    expect(value("password_requirements")).toMatch(/"lower_upper_letters_digits/);
  });

  it("enables TOTP MFA enrolment (H5)", () => {
    expect(config).toMatch(/enroll_enabled\s*=\s*true/);
    expect(config).toMatch(/verify_enabled\s*=\s*true/);
  });
});

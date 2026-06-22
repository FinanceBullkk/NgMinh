import { describe, expect, it } from "vitest";
import { buildCsp, staticSecurityHeaders } from "@/lib/security/headers";

// Audit M1: browser security headers + CSP (Next-static-compatible, no nonce).
const SUPA = "https://abc.supabase.co";

describe("buildCsp", () => {
  it("denies framing and locks down base/object", () => {
    const csp = buildCsp(SUPA, false);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
  });

  it("allows the Supabase origin (http + ws) in connect-src", () => {
    const csp = buildCsp(SUPA, false);
    expect(csp).toContain(SUPA);
    expect(csp).toContain("wss://abc.supabase.co");
  });

  it("allows self+inline scripts (Next static) but never eval in production", () => {
    const scriptSrc = buildCsp(SUPA, false)
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("script-src"))!;
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it("relaxes for dev (eval + ws for HMR)", () => {
    const csp = buildCsp(SUPA, true);
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toMatch(/connect-src[^;]*ws:/);
  });
});

describe("staticSecurityHeaders", () => {
  it("sets nosniff, frame-deny, referrer, permissions-policy", () => {
    const h = staticSecurityHeaders(false);
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["Permissions-Policy"]).toContain("camera=()");
  });

  it("adds HSTS only over HTTPS/production", () => {
    expect(staticSecurityHeaders(false)["Strict-Transport-Security"]).toBeUndefined();
    expect(staticSecurityHeaders(true)["Strict-Transport-Security"]).toContain("max-age=");
  });
});

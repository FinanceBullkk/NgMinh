import { describe, expect, it } from "vitest";
import { isRecentlyAuthenticated, STEP_UP_MAX_AGE_MS } from "@/lib/auth/recent-auth";

// Audit H4: destructive actions require a recent interactive sign-in (provider-agnostic step-up).
describe("isRecentlyAuthenticated", () => {
  const now = 1_700_000_000_000;

  it("accepts a sign-in within the window", () => {
    expect(isRecentlyAuthenticated(new Date(now - 60_000).toISOString(), now)).toBe(true);
  });

  it("rejects a stale sign-in (older than the window)", () => {
    const iso = new Date(now - STEP_UP_MAX_AGE_MS - 60_000).toISOString();
    expect(isRecentlyAuthenticated(iso, now)).toBe(false);
  });

  it("rejects null / undefined / unparseable", () => {
    expect(isRecentlyAuthenticated(null, now)).toBe(false);
    expect(isRecentlyAuthenticated(undefined, now)).toBe(false);
    expect(isRecentlyAuthenticated("not-a-date", now)).toBe(false);
  });

  it("tolerates small clock skew but rejects large future timestamps", () => {
    expect(isRecentlyAuthenticated(new Date(now + 10_000).toISOString(), now)).toBe(true);
    expect(isRecentlyAuthenticated(new Date(now + 120_000).toISOString(), now)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { keyMatcher } from "@/lib/cache/match";

// Guards the centralized SWR invalidation fan-out (the structural fix for the
// "stale after write" bug class).
describe("keyMatcher", () => {
  it("matches exact keys only", () => {
    const m = keyMatcher("roster", "feed-bootstrap");
    expect(m("roster")).toBe(true);
    expect(m("feed-bootstrap")).toBe(true);
    expect(m("settings")).toBe(false);
    expect(m("profile:1")).toBe(false);
  });

  it("matches a prefix pattern (profile:*)", () => {
    const m = keyMatcher("profile:*");
    expect(m("profile:abc")).toBe(true);
    expect(m("profile:")).toBe(true);
    expect(m("roster")).toBe(false);
    expect(m("profilex")).toBe(false);
  });

  it("entry invalidation hits feed/roster/all-profiles/all-calendar-months, not settings", () => {
    const m = keyMatcher("feed-bootstrap", "roster", "profile:*", "calendar:*");
    expect(m("feed-bootstrap")).toBe(true);
    expect(m("roster")).toBe(true);
    expect(m("profile:123")).toBe(true);
    expect(m("calendar:2026-06")).toBe(true);
    expect(m("settings")).toBe(false);
  });

  it("ignores non-string keys", () => {
    const m = keyMatcher("roster");
    expect(m(null)).toBe(false);
    expect(m(undefined)).toBe(false);
    expect(m(["roster"])).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { localTestConfig } from "@/tests/setup/supabase-test-clients";

// Audit H1: this private single-user app must reject public sign-up. The manager is provisioned
// via Auth Admin only. (Requires the local stack restarted with enable_signup=false.)
describe("public signup is disabled (audit H1)", () => {
  it("rejects an anonymous sign-up via the auth API", async () => {
    const { apiUrl, anonKey } = localTestConfig();
    const res = await fetch(`${apiUrl}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `nope-${Date.now()}@example.test`,
        password: "Str0ngPassw0rd!",
      }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    const body = await res.json().catch(() => ({}));
    expect(JSON.stringify(body).toLowerCase()).toMatch(/signup|not allowed|disabled/);
  });
});

import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { localTestConfig } from "@/tests/setup/supabase-test-clients";

// Audit defenses: forged, expired, and anonymous requests must never read protected rows.
const { apiUrl, anonKey, jwtSecret } = localTestConfig();

function b64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

async function readEntries(bearer?: string) {
  const headers: Record<string, string> = { apikey: anonKey };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  return fetch(`${apiUrl}/rest/v1/entries?select=id`, { headers });
}

describe("token verification (auth defenses)", () => {
  it("rejects an anonymous request (no bearer) to a protected table", async () => {
    const res = await readEntries();
    // anon has no SELECT grant → permission denied, never a row.
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("rejects a forged/garbage bearer token", async () => {
    const res = await readEntries("not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("rejects a correctly-signed but EXPIRED token", async () => {
    const expired = signJwt(
      {
        role: "authenticated",
        sub: "00000000-0000-0000-0000-000000000001",
        aud: "authenticated",
        exp: Math.floor(Date.now() / 1000) - 3600, // 1h in the past
      },
      jwtSecret,
    );
    const res = await readEntries(expired);
    expect(res.status).toBe(401);
    const body = await res.json().catch(() => ({}));
    expect(JSON.stringify(body).toLowerCase()).toMatch(/jwt|expired/);
  });
});

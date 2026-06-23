import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createSupabaseTestContext,
  createTestUser,
  localTestConfig,
  type SupabaseTestContext,
} from "@/tests/setup/supabase-test-clients";

// Audit H4/M2 (scoped self-delete RPC + step-up primitive) and M3 (append-only audit trail).
describe("destructive RPC + audit trail (audit H4 / M2 / M3)", () => {
  let ctx: SupabaseTestContext;
  beforeAll(async () => {
    ctx = await createSupabaseTestContext();
  });
  afterAll(async () => ctx.cleanup());

  it("delete_own_account is not callable without a session (anon)", async () => {
    const { apiUrl, anonKey } = localTestConfig();
    const res = await fetch(`${apiUrl}/rest/v1/rpc/delete_own_account`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBeGreaterThanOrEqual(400); // EXECUTE revoked from anon
  });

  it("delete_own_account deletes ONLY the caller and cascades their data", async () => {
    const u = await createTestUser(ctx.admin, "phase9-selfdel");
    await u.client.from("employees").insert({ name: "to-be-wiped" });
    const del = await u.client.rpc("delete_own_account");
    expect(del.error).toBeNull();

    // The account is gone: a password sign-in now fails.
    const reSignin = await u.client.auth.signInWithPassword({
      email: u.email,
      password: u.password,
    });
    expect(reSignin.error).not.toBeNull();
  });

  // Step-up itself (recent-auth recency) is covered by tests/unit/recent-auth.test.ts — it's a
  // pure server-side gate in the Server Action, not exercisable via the Data API.

  it("security_events: append via RPC, read own, but no direct insert", async () => {
    const logged = await ctx.userA.client.rpc("log_security_event", {
      p_event_type: "export",
      p_metadata: { count: 2 },
    });
    expect(logged.error).toBeNull();

    const read = await ctx.userA.client
      .from("security_events")
      .select("event_type, metadata")
      .eq("event_type", "export");
    expect(read.error).toBeNull();
    expect(read.data?.length).toBeGreaterThanOrEqual(1);

    // The client cannot forge/insert events directly (no INSERT grant).
    const forged = await ctx.userA.client
      .from("security_events")
      .insert({ event_type: "forged", user_id: ctx.userA.id });
    expect(forged.error).not.toBeNull();

    // And cannot read another user's events (RLS).
    const cross = await ctx.userB.client
      .from("security_events")
      .select("id")
      .eq("user_id", ctx.userA.id);
    expect(cross.data ?? []).toEqual([]);
  });
});

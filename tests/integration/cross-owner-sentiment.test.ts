import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createSupabaseTestContext,
  createTestUser,
  type SupabaseTestContext,
} from "@/tests/setup/supabase-test-clients";
import { createEmployee, firstSentiment } from "@/tests/setup/test-data";

// Audit H2: entries.sentiment_id was not owner-scoped, so user B could attach user A's sentiment
// to B's own entry, then that foreign reference blocked A's account deletion (RESTRICT FK).
// Migration 009 enforces same-owner with a composite FK (sentiment_id, user_id).
describe("cross-owner sentiment integrity (migration 009 / audit H2)", () => {
  let ctx: SupabaseTestContext;
  beforeAll(async () => {
    ctx = await createSupabaseTestContext();
  });
  afterAll(async () => ctx.cleanup());

  it("rejects an entry referencing another user's sentiment", async () => {
    const aSent = await firstSentiment(ctx.userA.client);
    const bEmp = await createEmployee(ctx.userB.client, "B-emp");
    const res = await ctx.userB.client.from("entries").insert({
      employee_id: bEmp.id,
      type: "note",
      content: "uses A sentiment",
      sentiment_id: aSent.id,
    });
    expect(res.error).not.toBeNull(); // 23503 — composite FK violation
  });

  it("allows an entry referencing the user's OWN sentiment", async () => {
    const aSent = await firstSentiment(ctx.userA.client);
    const aEmp = await createEmployee(ctx.userA.client, "A-emp");
    const res = await ctx.userA.client.from("entries").insert({
      employee_id: aEmp.id,
      type: "note",
      content: "own sentiment",
      sentiment_id: aSent.id,
    });
    expect(res.error).toBeNull();
  });

  it("does not let a sentiment reference block account deletion", async () => {
    // A fresh user whose OWN entry references their OWN sentiment must still delete cleanly —
    // RESTRICT only blocks FOREIGN refs, which are now impossible.
    const u = await createTestUser(ctx.admin, "phase9-del");
    const emp = await createEmployee(u.client, "del-emp");
    const sent = await firstSentiment(u.client);
    const ins = await u.client.from("entries").insert({
      employee_id: emp.id,
      type: "note",
      content: "own",
      sentiment_id: sent.id,
    });
    expect(ins.error).toBeNull();

    const del = await ctx.admin.auth.admin.deleteUser(u.id);
    expect(del.error).toBeNull();
  });
});

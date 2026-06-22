import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createSupabaseTestContext,
  type SupabaseTestContext,
} from "@/tests/setup/supabase-test-clients";
import { createEmployee } from "@/tests/setup/test-data";

// Migration 008: RLS only checks user_id; the FK on employee_id/tag_id is not RLS-scoped,
// so a client inserting directly could attach a row to ANOTHER user's employee/tag. These
// tests use anon-key + session clients (the real browser path, RLS applied).
describe("cross-owner integrity guard (migration 008)", () => {
  let ctx: SupabaseTestContext;
  beforeAll(async () => {
    ctx = await createSupabaseTestContext();
  });
  afterAll(async () => ctx.cleanup());

  it("rejects an entry referencing another user's employee", async () => {
    const aEmp = await createEmployee(ctx.userA.client, "A-emp");
    const res = await ctx.userB.client
      .from("entries")
      .insert({ employee_id: aEmp.id, type: "note", content: "cross-owner" });
    expect(res.error).not.toBeNull();
  });

  it("rejects an employee_tag linking another user's employee", async () => {
    const aEmp = await createEmployee(ctx.userA.client, "A-emp-2");
    const bTag = await ctx.userB.client
      .from("tags")
      .insert({ name: `btag-${Date.now()}` })
      .select("id")
      .single();
    expect(bTag.error).toBeNull();
    const res = await ctx.userB.client
      .from("employee_tags")
      .insert({ employee_id: aEmp.id, tag_id: bTag.data!.id });
    expect(res.error).not.toBeNull();
  });

  it("allows an entry for the user's own employee", async () => {
    const bEmp = await createEmployee(ctx.userB.client, "B-emp");
    const res = await ctx.userB.client
      .from("entries")
      .insert({ employee_id: bEmp.id, type: "note", content: "ok" });
    expect(res.error).toBeNull();
  });
});

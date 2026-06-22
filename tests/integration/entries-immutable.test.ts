import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createSupabaseTestContext,
  type SupabaseTestContext,
} from "@/tests/setup/supabase-test-clients";
import { createEmployee } from "@/tests/setup/test-data";

// Audit H3 / H3b: "append-only" must hold at the DB layer, not just the UI. Migration 010 removes
// UPDATE (grant + policy) and column-scopes INSERT so id/user_id/created_at cannot be spoofed.
describe("entries are append-only at the DB layer (migration 010 / audit H3)", () => {
  let ctx: SupabaseTestContext;
  beforeAll(async () => {
    ctx = await createSupabaseTestContext();
  });
  afterAll(async () => ctx.cleanup());

  async function insertEntry(content = "original") {
    const emp = await createEmployee(ctx.userA.client, "imm-emp");
    const ins = await ctx.userA.client
      .from("entries")
      .insert({ employee_id: emp.id, type: "note", content })
      .select("id")
      .single();
    expect(ins.error).toBeNull();
    return ins.data!.id;
  }

  it("rejects UPDATE of entry content (no overwrite of evidence)", async () => {
    const id = await insertEntry("original");
    const upd = await ctx.userA.client
      .from("entries")
      .update({ content: "TAMPERED" })
      .eq("id", id);
    expect(upd.error).not.toBeNull(); // 42501 — UPDATE revoked
    expect(upd.error?.code).toBe("42501");

    const read = await ctx.userA.client
      .from("entries")
      .select("content")
      .eq("id", id)
      .single();
    expect(read.data?.content).toBe("original");
  });

  it("rejects a client-supplied created_at on INSERT (server-controlled column)", async () => {
    const emp = await createEmployee(ctx.userA.client, "col-emp");
    const res = await ctx.userA.client.from("entries").insert({
      employee_id: emp.id,
      type: "note",
      content: "x",
      created_at: "1999-01-01T00:00:00Z",
    });
    expect(res.error).not.toBeNull(); // 42501 — column not granted
  });

  it("still allows DELETE of a mis-entered entry (delete != edit)", async () => {
    const id = await insertEntry("typo");
    const del = await ctx.userA.client.from("entries").delete().eq("id", id);
    expect(del.error).toBeNull();
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createSupabaseTestContext,
  type SupabaseTestContext,
} from "@/tests/setup/supabase-test-clients";

describe("row ownership", () => {
  let context: SupabaseTestContext;

  beforeAll(async () => {
    context = await createSupabaseTestContext();
  });

  afterAll(async () => context.cleanup());

  it("defaults user_id to the authenticated caller", async () => {
    const result = await context.userA.client
      .from("employees")
      .insert({ name: "Owned by A" })
      .select("user_id")
      .single();

    expect(result.error).toBeNull();
    expect(result.data?.user_id).toBe(context.userA.id);
  });

  it("rejects an explicit owner spoof", async () => {
    const result = await context.userA.client.from("employees").insert({
      name: "Spoofed",
      user_id: context.userB.id,
    });

    expect(result.error?.code).toBe("42501");
  });
});

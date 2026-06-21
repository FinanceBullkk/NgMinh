import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createSupabaseTestContext,
  type SupabaseTestContext,
} from "@/tests/setup/supabase-test-clients";
import { seedOwnedGraph } from "@/tests/setup/test-data";

describe("current take revision", () => {
  let context: SupabaseTestContext;

  beforeAll(async () => {
    context = await createSupabaseTestContext();
  });

  afterAll(async () => context.cleanup());

  it("updates the take timestamp without changing timeline evidence", async () => {
    const graph = await seedOwnedGraph(context.userA.client, "take");
    await new Promise((resolve) => setTimeout(resolve, 10));
    const update = await context.userA.client
      .from("employees")
      .update({ current_take: "Revised view" })
      .eq("id", graph.employee.id);
    const employee = await context.userA.client
      .from("employees")
      .select("current_take, updated_at")
      .eq("id", graph.employee.id)
      .single();
    const entry = await context.userA.client
      .from("entries")
      .select("content, created_at")
      .eq("id", graph.entry.id)
      .single();

    expect(update.error ?? employee.error ?? entry.error).toBeNull();
    expect(employee.data?.current_take).toBe("Revised view");
    expect(employee.data?.updated_at).not.toBe(graph.employee.updated_at);
    expect(entry.data).toEqual({
      content: graph.entry.content,
      created_at: graph.entry.created_at,
    });
  });
});

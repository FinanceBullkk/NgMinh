import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createSupabaseTestContext,
  type SupabaseTestContext,
} from "@/tests/setup/supabase-test-clients";
import { seedOwnedGraph, type OwnedGraph } from "@/tests/setup/test-data";

describe("RLS isolation", () => {
  let context: SupabaseTestContext;
  let graphA: OwnedGraph;
  let graphB: OwnedGraph;

  beforeAll(async () => {
    context = await createSupabaseTestContext();
    graphA = await seedOwnedGraph(context.userA.client, "A");
    graphB = await seedOwnedGraph(context.userB.client, "B");
  });

  afterAll(async () => context.cleanup());

  it("hides all six tables from another user", async () => {
    const results = await Promise.all([
      context.userB.client.from("employees").select("id").eq("user_id", context.userA.id),
      context.userB.client.from("entries").select("id").eq("user_id", context.userA.id),
      context.userB.client.from("goals").select("id").eq("user_id", context.userA.id),
      context.userB.client.from("tags").select("id").eq("user_id", context.userA.id),
      context.userB.client.from("employee_tags").select("employee_id").eq("user_id", context.userA.id),
      context.userB.client.from("sentiment_options").select("id").eq("user_id", context.userA.id),
    ]);

    for (const result of results) {
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    }
  });

  it("rejects owner spoofing on all six tables", async () => {
    const results = await Promise.all([
      context.userB.client.from("employees").insert({ name: "Spoof", user_id: context.userA.id }),
      context.userB.client.from("entries").insert({
        employee_id: graphB.employee.id,
        type: "note",
        content: "Spoof",
        user_id: context.userA.id,
      }),
      context.userB.client.from("goals").insert({
        employee_id: graphB.employee.id,
        content: "Spoof",
        user_id: context.userA.id,
      }),
      context.userB.client.from("tags").insert({ name: "Spoof", user_id: context.userA.id }),
      context.userB.client.from("employee_tags").insert({
        employee_id: graphB.employee.id,
        tag_id: graphB.tag.id,
        user_id: context.userA.id,
      }),
      context.userB.client.from("sentiment_options").insert({
        label: "Spoof",
        color: "#000000",
        user_id: context.userA.id,
      }),
    ]);

    expect(graphA.employee.user_id).toBe(context.userA.id);
    for (const result of results) expect(result.error?.code).toBe("42501");
  });
});

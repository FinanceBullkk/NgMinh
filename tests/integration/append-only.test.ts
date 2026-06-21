import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createSupabaseTestContext,
  type SupabaseTestContext,
} from "@/tests/setup/supabase-test-clients";
import { createEmployee } from "@/tests/setup/test-data";

describe("append-only observations", () => {
  let context: SupabaseTestContext;

  beforeAll(async () => {
    context = await createSupabaseTestContext();
  });

  afterAll(async () => context.cleanup());

  it("adds new evidence without replacing the previous observation", async () => {
    const employee = await createEmployee(context.userA.client);
    const first = await context.userA.client
      .from("entries")
      .insert({ employee_id: employee.id, type: "note", content: "First evidence" })
      .select("id, content")
      .single();
    const second = await context.userA.client
      .from("entries")
      .insert({ employee_id: employee.id, type: "win", content: "Second evidence" })
      .select("id, content")
      .single();
    const timeline = await context.userA.client
      .from("entries")
      .select("id, content")
      .eq("employee_id", employee.id);

    expect(first.error ?? second.error ?? timeline.error).toBeNull();
    expect(new Set(timeline.data?.map((entry) => entry.id))).toEqual(
      new Set([first.data?.id, second.data?.id]),
    );
    expect(timeline.data?.map((entry) => entry.content)).toContain("First evidence");
  });
});

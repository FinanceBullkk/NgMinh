import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createSupabaseTestContext,
  type SupabaseTestContext,
} from "@/tests/setup/supabase-test-clients";
import { seedOwnedGraph } from "@/tests/setup/test-data";

describe("sentiment archive", () => {
  let context: SupabaseTestContext;

  beforeAll(async () => {
    context = await createSupabaseTestContext();
  });

  afterAll(async () => context.cleanup());

  it("hides an archived option from active config but preserves history color", async () => {
    const graph = await seedOwnedGraph(context.userA.client, "archive");
    const archived = await context.userA.client
      .from("sentiment_options")
      .update({ is_archived: true })
      .eq("id", graph.sentiment.id);
    const active = await context.userA.client
      .from("sentiment_options")
      .select("id")
      .eq("is_archived", false);
    const history = await context.userA.client
      .from("entries")
      .select("sentiment_options(color)")
      .eq("id", graph.entry.id)
      .single();
    const hardDelete = await context.userA.client
      .from("sentiment_options")
      .delete()
      .eq("id", graph.sentiment.id);

    expect(archived.error ?? active.error ?? history.error).toBeNull();
    expect(active.data?.map((option) => option.id)).not.toContain(graph.sentiment.id);
    expect(history.data?.sentiment_options?.color).toBe(graph.sentiment.color);
    expect(hardDelete.error?.code).toBe("23503");
  });
});

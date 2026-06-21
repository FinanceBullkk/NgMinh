import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createSupabaseTestContext,
  type SupabaseTestContext,
} from "@/tests/setup/supabase-test-clients";

describe("new manager sentiment seed", () => {
  let context: SupabaseTestContext;

  beforeAll(async () => {
    context = await createSupabaseTestContext();
  });

  afterAll(async () => context.cleanup());

  it("creates exactly three owner-scoped defaults with polarity weights", async () => {
    const result = await context.userA.client
      .from("sentiment_options")
      .select("label, color, order_index, weight, user_id")
      .order("order_index");

    expect(result.error).toBeNull();
    expect(result.data).toEqual([
      { label: "Tích cực", color: "#3F8F6B", order_index: 0, weight: 1, user_id: context.userA.id },
      { label: "Trung tính", color: "#9AA0A6", order_index: 1, weight: 0, user_id: context.userA.id },
      { label: "Tiêu cực", color: "#C45B4C", order_index: 2, weight: -1, user_id: context.userA.id },
    ]);
  });
});

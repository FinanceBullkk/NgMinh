import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { gatherUserDataForClient } from "@/lib/data/user-data";
import {
  createSupabaseTestContext,
  type SupabaseTestContext,
} from "@/tests/setup/supabase-test-clients";
import { seedOwnedGraph } from "@/tests/setup/test-data";

describe("portable data export", () => {
  let context: SupabaseTestContext;

  beforeAll(async () => {
    context = await createSupabaseTestContext();
    await seedOwnedGraph(context.userA.client, "export-A");
    await seedOwnedGraph(context.userB.client, "export-B");
  });

  afterAll(async () => context.cleanup());

  it("returns every table for only the authenticated manager", async () => {
    const data = await gatherUserDataForClient(context.userA.client);

    expect(Object.keys(data).sort()).toEqual([
      "employee_tags",
      "employees",
      "entries",
      "goals",
      "sentiment_options",
      "tags",
    ]);
    expect(data.employees).toHaveLength(1);
    expect(data.entries).toHaveLength(1);
    expect(data.goals).toHaveLength(1);
    expect(data.tags).toHaveLength(1);
    expect(data.employee_tags).toHaveLength(1);
    expect(data.sentiment_options).toHaveLength(3);
    for (const rows of Object.values(data)) {
      expect(rows.every((row) => row.user_id === context.userA.id)).toBe(true);
    }
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  deletePeopleDataForClient,
  gatherUserDataForClient,
} from "@/lib/data/user-data";
import {
  createSupabaseTestContext,
  createTestUser,
  type SupabaseTestContext,
} from "@/tests/setup/supabase-test-clients";
import { seedOwnedGraph } from "@/tests/setup/test-data";

describe("destructive data controls", () => {
  let context: SupabaseTestContext;

  beforeAll(async () => {
    context = await createSupabaseTestContext();
  });

  afterAll(async () => context.cleanup());

  it("deletes people data while retaining account sentiment settings", async () => {
    await seedOwnedGraph(context.userA.client, "delete-all");
    await deletePeopleDataForClient(context.userA.client);
    const data = await gatherUserDataForClient(context.userA.client);

    expect(data.employees).toEqual([]);
    expect(data.entries).toEqual([]);
    expect(data.goals).toEqual([]);
    expect(data.tags).toEqual([]);
    expect(data.employee_tags).toEqual([]);
    expect(data.sentiment_options).toHaveLength(3);
  });

  it("deleting the auth account cascades every owned row", async () => {
    const user = await createTestUser(context.admin, "account-delete");
    await seedOwnedGraph(user.client, "account");
    const deleted = await context.admin.auth.admin.deleteUser(user.id);
    expect(deleted.error).toBeNull();

    const results = await Promise.all([
      user.client.from("employees").select("id"),
      user.client.from("entries").select("id"),
      user.client.from("goals").select("id"),
      user.client.from("tags").select("id"),
      user.client.from("employee_tags").select("employee_id"),
      user.client.from("sentiment_options").select("id"),
    ]);
    for (const result of results) {
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    }
    const missingUser = await context.admin.auth.admin.getUserById(user.id);
    expect(missingUser.error).not.toBeNull();
  });
});

import type { Entry, Employee, Goal, SentimentOption, Tag } from "@/lib/types/models";
import type { TestClient } from "@/tests/setup/supabase-test-clients";

export type OwnedGraph = {
  employee: Employee;
  sentiment: SentimentOption;
  tag: Tag;
  entry: Entry;
  goal: Goal;
};

export async function createEmployee(
  client: TestClient,
  name = "Test employee",
): Promise<Employee> {
  const result = await client
    .from("employees")
    .insert({ name, closeness: 3 })
    .select("*")
    .single();
  if (result.error) throw result.error;
  return result.data;
}

export async function firstSentiment(client: TestClient): Promise<SentimentOption> {
  const result = await client
    .from("sentiment_options")
    .select("*")
    .order("order_index")
    .limit(1)
    .single();
  if (result.error) throw result.error;
  return result.data;
}

export async function seedOwnedGraph(
  client: TestClient,
  suffix = "graph",
): Promise<OwnedGraph> {
  const employee = await createEmployee(client, `Employee ${suffix}`);
  const sentiment = await firstSentiment(client);
  const tagResult = await client
    .from("tags")
    .insert({ name: `Tag ${suffix}` })
    .select("*")
    .single();
  if (tagResult.error) throw tagResult.error;

  const link = await client.from("employee_tags").insert({
    employee_id: employee.id,
    tag_id: tagResult.data.id,
  });
  if (link.error) throw link.error;

  const entryResult = await client
    .from("entries")
    .insert({
      employee_id: employee.id,
      entry_date: "2026-06-21",
      type: "note",
      content: `Observation ${suffix}`,
      sentiment_id: sentiment.id,
    })
    .select("*")
    .single();
  if (entryResult.error) throw entryResult.error;

  const goalResult = await client
    .from("goals")
    .insert({ employee_id: employee.id, content: `Goal ${suffix}` })
    .select("*")
    .single();
  if (goalResult.error) throw goalResult.error;

  return {
    employee,
    sentiment,
    tag: tagResult.data,
    entry: entryResult.data,
    goal: goalResult.data,
  };
}

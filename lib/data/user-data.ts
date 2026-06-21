import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type DatabaseClient = SupabaseClient<Database>;
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

// Enumerate every user-owned table. RLS scopes the result to the caller.
export async function gatherUserDataForClient(supabase: DatabaseClient) {
  const [employees, entries, goals, tags, employee_tags, sentiment_options] =
    await Promise.all([
      supabase.from("employees").select("*"),
      supabase.from("entries").select("*"),
      supabase.from("goals").select("*"),
      supabase.from("tags").select("*"),
      supabase.from("employee_tags").select("*"),
      supabase.from("sentiment_options").select("*"),
    ]);

  const error =
    employees.error ||
    entries.error ||
    goals.error ||
    tags.error ||
    employee_tags.error ||
    sentiment_options.error;
  if (error) throw error;

  return {
    employees: employees.data ?? [],
    entries: entries.data ?? [],
    goals: goals.data ?? [],
    tags: tags.data ?? [],
    employee_tags: employee_tags.data ?? [],
    sentiment_options: sentiment_options.data ?? [],
  };
}

// Wipe people data. Employee cascades remove entries, goals, and tag links;
// sentiment configuration remains attached to the account.
export async function deletePeopleDataForClient(supabase: DatabaseClient) {
  const employees = await supabase.from("employees").delete().neq("id", ZERO_UUID);
  if (employees.error) throw employees.error;
  const tags = await supabase.from("tags").delete().neq("id", ZERO_UUID);
  if (tags.error) throw tags.error;
}

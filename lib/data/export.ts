import { createClient } from "@/lib/supabase/server";

// Gather ALL of the current user's data (RLS-scoped) for a portable JSON export.
// Enumerate every table — keep in sync with the schema.
export async function gatherUserData() {
  const supabase = await createClient();
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

import { createClient } from "@/lib/supabase/server";
import type { Entry } from "@/lib/types/models";

// Profile timeline (by-person): one employee, newest first.
export async function listEntriesByEmployee(employeeId: string): Promise<Entry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("employee_id", employeeId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Feed (by-time): whole roster, newest first.
export async function listFeed(limit = 100): Promise<Entry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
